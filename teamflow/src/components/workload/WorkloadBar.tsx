import type { WorkloadRow } from "@/lib/workload";
import { isOverloaded } from "@/lib/workload-status";
import { OverloadFlag } from "@/components/workload/OverloadFlag";
import { cn } from "@/lib/utils";

// Palette de dégradés (CSS inline → robuste quelle que soit la version de Tailwind v4,
// et indépendante du thème neutre du projet). Couleur déterministe par position.
const PALETTE = [
  { from: "#8b5cf6", to: "#6366f1" }, // violet → indigo
  { from: "#0ea5e9", to: "#06b6d4" }, // sky → cyan
  { from: "#10b981", to: "#14b8a6" }, // emerald → teal
  { from: "#f59e0b", to: "#f97316" }, // amber → orange
  { from: "#ec4899", to: "#f43f5e" }, // pink → rose
  { from: "#d946ef", to: "#a855f7" }, // fuchsia → purple
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Couleur d'alerte de surcharge (FR7, AC#1) — remplace le dégradé décoratif quand
// le collaborateur dépasse sa capacité.
const OVERLOAD_FILL = { from: "#ef4444", to: "#dc2626" }; // red-500 → red-600

// Carte de charge d'un collaborateur : avatar initiales, barre de progression
// (charge / capacité) et badge d'occupation. Présentational (Server Component) :
// reçoit les données en props, ne lit jamais la DB.
// Surcharge (FR7, AC#1) : quand `total_load_hours > weekly_capacity_hours`, la barre
// passe en couleur d'alerte + badge `OverloadFlag`. État sain (AC#3) : rendu neutre,
// couleur décorative par collaborateur, aucun signal.
export function WorkloadBar({
  row,
  index = 0,
}: {
  row: WorkloadRow;
  index?: number;
}) {
  const capacity = Number(row.weekly_capacity_hours);
  const load = Number(row.total_load_hours);
  const ratio = capacity > 0 ? load / capacity : 0;
  const pct = Math.round(ratio * 100);
  const fillPct = Math.min(ratio, 1) * 100;
  const over = isOverloaded(row);
  const { from, to } = over ? OVERLOAD_FILL : PALETTE[index % PALETTE.length];

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        over && "border-red-200 bg-red-50/40",
      )}
    >
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-inner"
        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
        aria-hidden
      >
        {initials(row.full_name)}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{row.full_name}</span>
            <OverloadFlag load={load} capacity={capacity} className="shrink-0" />
          </span>
          <span className="shrink-0 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {load}
            </span>{" "}
            h / {capacity} h
          </span>
        </div>
        <div
          className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={load}
          aria-valuemin={0}
          aria-valuemax={capacity}
          aria-label={`Charge de ${row.full_name}`}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${fillPct}%`,
              backgroundImage: `linear-gradient(90deg, ${from}, ${to})`,
            }}
          />
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div
          className={cn(
            "text-lg font-semibold tabular-nums leading-none",
            over && "text-red-600",
          )}
        >
          {pct}%
        </div>
        <div className="mt-1 text-xs text-muted-foreground">occupation</div>
      </div>
    </div>
  );
}
