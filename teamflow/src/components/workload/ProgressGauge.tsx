import { completionRate } from "@/lib/workload-status";
import { cn } from "@/lib/utils";

// Indicateur d'avancement global du portefeuille (FR8, Story 3.3). Présentational
// (Server Component) : reçoit les comptes en props, ne lit jamais la DB.
// Affiche le pourcentage (via `completionRate`, garde-fou 0 tâche) + une barre de
// progression + le décompte `done / total`. Cas vide (total === 0) : 0 %, barre
// vide, libellé neutre — aucune division par zéro (AC#4).
export function ProgressGauge({
  done,
  total,
  doneHours,
  totalHours,
  className,
}: {
  done: number;
  total: number;
  doneHours?: number;
  totalHours?: number;
  className?: string;
}) {
  const pct = completionRate(done, total);
  const empty = total <= 0;
  const hoursPct =
    typeof doneHours === "number" && typeof totalHours === "number"
      ? completionRate(doneHours, totalHours)
      : null;

  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border bg-card p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Avancement global
          </div>
          <div className="text-sm text-muted-foreground">
            {empty ? (
              "Aucune tâche dans le portefeuille"
            ) : (
              <>
                <span className="font-semibold tabular-nums text-foreground">
                  {done}
                </span>{" "}
                tâche{done > 1 ? "s" : ""} terminée{done > 1 ? "s" : ""} sur{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {total}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="text-4xl font-semibold tabular-nums leading-none">
          {pct}
          <span className="text-2xl text-muted-foreground">%</span>
        </div>
      </div>

      <div
        className="relative h-3 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avancement global du portefeuille"
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {hoursPct !== null && !empty && (
        <div className="text-xs text-muted-foreground">
          Pondéré par la charge :{" "}
          <span className="font-medium tabular-nums text-foreground">
            {hoursPct}%
          </span>{" "}
          ({doneHours} h / {totalHours} h)
        </div>
      )}
    </div>
  );
}
