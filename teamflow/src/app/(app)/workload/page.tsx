import { getWorkload } from "@/lib/workload";
import { resolvePeriod, buildPresets } from "@/lib/workload-period";
import { WorkloadBar } from "@/components/workload/WorkloadBar";
import { PeriodPicker } from "@/components/workload/PeriodPicker";

// FR6 — Charge agrégée par collaborateur sur une période.
// Server Component : la période est portée par l'URL (?from=&to=, AR8), donc la page
// est dynamique et reflète immédiatement les changements (NFR1). Pas de JS client.
export default async function WorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const now = new Date();
  const period = resolvePeriod(from, to, now);
  const presets = buildPresets(now);
  const rows = await getWorkload(period.from, period.to);

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
  );
}
