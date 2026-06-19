import { TriangleAlertIcon } from "lucide-react";
import { isOverloaded } from "@/lib/workload-status";
import { cn } from "@/lib/utils";

// Badge « Surcharge » (FR7, AC#1). Présentational (Server Component).
// Rendu UNIQUEMENT en cas de surcharge → renvoie `null` sinon (AC#3 : état sain
// silencieux). Reçoit la charge/capacité en props, ne lit jamais la DB.
export function OverloadFlag({
  load,
  capacity,
  className,
}: {
  load: number;
  capacity: number;
  className?: string;
}) {
  if (!isOverloaded({ total_load_hours: load, weekly_capacity_hours: capacity })) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700",
        className,
      )}
    >
      <TriangleAlertIcon className="size-3" aria-hidden />
      Surcharge
    </span>
  );
}
