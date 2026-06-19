import type { WorkloadRow } from "@/lib/workload";

// Affiche la charge cumulée d'un collaborateur face à sa capacité hebdomadaire.
// Présentational (Server Component) : reçoit les données en props, ne lit jamais
// la DB (frontière de composants). La mise en évidence des surcharges (FR7) relève
// de la Story 3.2 (OverloadFlag / CapacityIndicator) — ici la barre reste neutre.
export function WorkloadBar({ row }: { row: WorkloadRow }) {
  const capacity = row.weekly_capacity_hours;
  const load = row.total_load_hours;
  const pct = capacity > 0 ? Math.round(Math.min(load / capacity, 1) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{row.full_name}</span>
        <span className="text-muted-foreground">
          {load}h / {capacity}h
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded bg-muted"
        role="progressbar"
        aria-valuenow={load}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={`Charge de ${row.full_name}`}
      >
        <div
          className="h-full rounded bg-foreground/70"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
