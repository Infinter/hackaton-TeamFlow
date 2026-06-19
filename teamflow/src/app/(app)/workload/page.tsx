import { redirect } from "next/navigation";
import { requireManager } from "@/lib/auth";
import { getWorkload, getOverdueTasks } from "@/lib/workload";
import { resolvePeriod, buildPresets } from "@/lib/workload-period";
import { WorkloadBar } from "@/components/workload/WorkloadBar";
import { PeriodPicker } from "@/components/workload/PeriodPicker";
import { OverdueBadge } from "@/components/workload/OverdueBadge";

// Affichage d'une échéance ISO 'YYYY-MM-DD' en français, sans décalage de fuseau.
const dueDateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
function formatDue(iso: string): string {
  return dueDateFmt.format(new Date(`${iso}T00:00:00`));
}

// FR6 — Charge agrégée par collaborateur sur une période.
// Server Component : la période est portée par l'URL (?from=&to=, AR8), donc la page
// est dynamique et reflète immédiatement les changements (NFR1). Pas de JS client.
export default async function WorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const guard = await requireManager();
  if (!guard.ok) redirect("/dashboard");

  const { from, to } = await searchParams;
  const now = new Date();
  const period = resolvePeriod(from, to, now);
  const presets = buildPresets(now);
  const rows = await getWorkload(period.from, period.to);
  // Retards (FR7) : relatifs à la date courante, indépendants de la période choisie.
  const overdue = await getOverdueTasks();

  // Tri par charge décroissante (lecture « classement » plus parlante).
  const sorted = [...rows].sort(
    (a, b) => Number(b.total_load_hours) - Number(a.total_load_hours),
  );
  const totalLoad = rows.reduce((s, r) => s + Number(r.total_load_hours), 0);
  const totalCapacity = rows.reduce(
    (s, r) => s + Number(r.weekly_capacity_hours),
    0,
  );
  const avgUtil =
    totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;

  const stats = [
    { label: "Charge totale", value: `${totalLoad} h` },
    { label: "Capacité de l'équipe", value: `${totalCapacity} h` },
    { label: "Occupation moyenne", value: `${avgUtil} %` },
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Charge de l&apos;équipe
        </h1>
        <p className="text-sm text-muted-foreground">
          Répartition de la charge de travail par collaborateur sur la période
          sélectionnée.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tâches en retard (FR7, AC#2) — affiché uniquement s'il y en a (AC#3 : état sain silencieux). */}
      {overdue.length > 0 && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/40 p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-red-700">
              Tâches en retard
            </h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 tabular-nums">
              {overdue.length}
            </span>
          </div>
          <ul className="space-y-2">
            {overdue.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Échéance {formatDue(task.due_date)}
                    {task.assignee_name ? ` · ${task.assignee_name}` : " · non affectée"}
                  </div>
                </div>
                <OverdueBadge className="shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <PeriodPicker presets={presets} period={period} />

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
            Aucun collaborateur à afficher pour cette période.
          </div>
        ) : (
          sorted.map((row, i) => (
            <WorkloadBar key={row.assignee_id} row={row} index={i} />
          ))
        )}
      </div>
    </section>
  )
}
