import { ClockAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Badge « En retard » réutilisable (FR7, AC#2). Présentational (Server Component).
// Consommable en lecture seule par la page /workload et la synthèse du tableau de
// bord (Story 3.3), sans modifier les fichiers de l'Épique 1 (portefeuille).
export function OverdueBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700",
        className,
      )}
    >
      <ClockAlertIcon className="size-3" aria-hidden />
      En retard
    </span>
  );
}
