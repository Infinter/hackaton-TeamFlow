import { getWorkload } from "@/lib/workload";
import { resolvePeriod } from "@/lib/workload-period";
import { WorkloadBar } from "@/components/workload/WorkloadBar";

// FR6 — Charge agrégée par collaborateur sur une période.
// Server Component : la période est portée par l'URL (?from=&to=, AR8), donc la page
// est dynamique et reflète immédiatement les changements (NFR1). Pas de JS client :
// le sélecteur est un simple <form method="get">.
export default async function WorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const period = resolvePeriod(from, to, new Date());
  const rows = await getWorkload(period.from, period.to);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Charge</h1>
        <p className="text-sm text-muted-foreground">
          Charge agrégée par collaborateur sur la période sélectionnée.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Du</span>
          <input
            type="date"
            name="from"
            defaultValue={period.from}
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Au</span>
          <input
            type="date"
            name="to"
            defaultValue={period.to}
            className="rounded border px-2 py-1"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-foreground px-3 py-1.5 text-sm text-background"
        >
          Appliquer
        </button>
      </form>

      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun collaborateur à afficher.
          </p>
        ) : (
          rows.map((row) => <WorkloadBar key={row.assignee_id} row={row} />)
        )}
      </div>
    </section>
  );
}
