import { capacityState, type CapacityState } from "@/lib/workload-status";
import { cn } from "@/lib/utils";

// Indicateur d'état de capacité réutilisable (FR7). Présentational (Server Component).
// Dérive la couleur et le libellé de `capacityState(load, capacity)`. Utilisé par
// `WorkloadBar` (surcharge) et destiné à être réutilisé par la synthèse du
// tableau de bord (Story 3.3) — d'où son exposition autonome.

const STATE_STYLES: Record<
  CapacityState,
  { dot: string; text: string; label: string }
> = {
  ok: { dot: "bg-emerald-500", text: "text-muted-foreground", label: "Charge saine" },
  near: { dot: "bg-amber-500", text: "text-amber-700", label: "Proche capacité" },
  over: { dot: "bg-red-500", text: "text-red-700", label: "Surcharge" },
};

// `dotOnly` : pour les contextes denses (juste la pastille de couleur).
export function CapacityIndicator({
  load,
  capacity,
  dotOnly = false,
  className,
}: {
  load: number;
  capacity: number;
  dotOnly?: boolean;
  className?: string;
}) {
  const state = capacityState(Number(load), Number(capacity));
  const style = STATE_STYLES[state];

  return (
    <span className={cn("inline-flex items-center gap-1.5", style.text, className)}>
      <span className={cn("size-2 shrink-0 rounded-full", style.dot)} aria-hidden />
      {!dotOnly && <span className="text-xs font-medium">{style.label}</span>}
      <span className="sr-only">{style.label}</span>
    </span>
  );
}
