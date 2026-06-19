// Helpers de période — purs et sans dépendance serveur (testables en isolation).
// Convention de date : chaîne ISO 'YYYY-MM-DD' (échange/affichage). [architecture.md#Formats]

export type Period = { from: string; to: string };

// Formate une Date en 'YYYY-MM-DD' à partir de ses composantes locales.
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Semaine courante (lundi → dimanche) contenant `now`.
export function defaultWeek(now: Date): Period {
  const day = now.getDay(); // 0 = dimanche, 1 = lundi, ...
  const diffToMonday = (day + 6) % 7; // nombre de jours depuis lundi
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toIsoDate(monday), to: toIsoDate(sunday) };
}

// Normalise les query params (?from=&to=) en période valide, avec repli sur la
// semaine courante quand une borne est absente ou mal formée.
export function resolvePeriod(
  from: string | undefined,
  to: string | undefined,
  now: Date,
): Period {
  const fallback = defaultWeek(now);
  const isIso = (s: string | undefined): s is string =>
    typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  return {
    from: isIso(from) ? from : fallback.from,
    to: isIso(to) ? to : fallback.to,
  };
}

// --- Presets de période (raccourcis cliquables) ---------------------------

export type PeriodPreset = { key: string; label: string } & Period;

function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

// Raccourcis proposés dans le sélecteur de période.
export function buildPresets(now: Date): PeriodPreset[] {
  const week = defaultWeek(now);
  const monthFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTo = new Date(now.getFullYear(), now.getMonth() + 1, 0); // dernier jour du mois
  return [
    { key: "week", label: "Cette semaine", ...week },
    {
      key: "next-week",
      label: "Semaine prochaine",
      from: addDaysIso(week.from, 7),
      to: addDaysIso(week.to, 7),
    },
    {
      key: "month",
      label: "Ce mois-ci",
      from: toIsoDate(monthFrom),
      to: toIsoDate(monthTo),
    },
    {
      key: "30d",
      label: "30 prochains jours",
      from: toIsoDate(now),
      to: addDaysIso(toIsoDate(now), 29),
    },
  ];
}
