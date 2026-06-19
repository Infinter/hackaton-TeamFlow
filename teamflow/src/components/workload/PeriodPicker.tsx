import Link from "next/link";
import type { Period, PeriodPreset } from "@/lib/workload-period";

const fmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function labelOf(iso: string): string {
  return fmt.format(new Date(`${iso}T00:00:00`));
}

// Sélecteur de période : raccourcis (presets) en un clic + plage personnalisée.
// Server Component — l'état est porté par l'URL (?from=&to=, AR8). Les presets sont
// des liens (navigation instantanée) ; la plage perso est un simple <form method="get">.
export function PeriodPicker({
  presets,
  period,
}: {
  presets: PeriodPreset[];
  period: Period;
}) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((p) => {
          const active = p.from === period.from && p.to === period.to;
          return (
            <Link
              key={p.key}
              href={`/workload?from=${p.from}&to=${p.to}`}
              aria-current={active ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 border-t pt-4"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">Du</span>
          <input
            type="date"
            name="from"
            defaultValue={period.from}
            className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">Au</span>
          <input
            type="date"
            name="to"
            defaultValue={period.to}
            className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          Appliquer
        </button>
      </form>

      <p className="text-sm text-muted-foreground">
        Période affichée :{" "}
        <span className="font-medium text-foreground">
          {labelOf(period.from)} – {labelOf(period.to)}
        </span>
      </p>
    </div>
  );
}
