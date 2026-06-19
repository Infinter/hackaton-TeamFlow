import {
  getPortfolioProgress,
  getOverdueTasks,
  getWorkload,
} from "@/lib/workload";
import { isOverloaded } from "@/lib/workload-status";
import { defaultWeek } from "@/lib/workload-period";
import { ProgressGauge } from "@/components/workload/ProgressGauge";
import { CapacityIndicator } from "@/components/workload/CapacityIndicator";
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

// FR8 — Tableau de bord : indicateur d'avancement global du portefeuille + rappel
// de la synthèse surcharges/retards (Story 3.2). Server Component dynamique (lit
// les cookies via createClient) → relu à chaque navigation, reflète immédiatement
// les changements faits ailleurs (NFR1, couplage par revalidation).
//
// ⚠️ PAS de requireManager() ici : /dashboard est la page d'atterrissage post-login
// pour TOUS les rôles, et /workload y redirige les non-managers — une garde manager
// créerait une boucle de redirection. La RLS (SELECT ouvert à tout authentifié)
// rend la lecture sûre pour les collaborateurs (transparence d'équipe).
export default async function DashboardPage() {
  const week = defaultWeek(new Date());
  const [progress, overdue, rows] = await Promise.all([
    getPortfolioProgress(),
    getOverdueTasks(),
    getWorkload(week.from, week.to),
  ]);

  // Synthèse surcharges (semaine courante) — uniquement les collaborateurs en surcharge.
  const overloaded = rows.filter(isOverloaded);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted-foreground">
          Avancement global du portefeuille et points de vigilance.
        </p>
      </header>

      {/* Indicateur d'avancement global (FR8, AC#1 / AC#4). */}
      <ProgressGauge
        done={progress.done_tasks}
        total={progress.total_tasks}
        doneHours={progress.done_hours}
        totalHours={progress.total_hours}
      />

      {/* Synthèse surcharges (AC#2) — rendue uniquement s'il y en a (état sain silencieux). */}
      {overloaded.length > 0 && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/40 p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-red-700">
              Collaborateurs en surcharge
            </h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 tabular-nums">
              {overloaded.length}
            </span>
            <span className="text-xs text-muted-foreground">
              (semaine courante)
            </span>
          </div>
          <ul className="space-y-2">
            {overloaded.map((row) => (
              <li
                key={row.assignee_id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.full_name}</div>
                  <CapacityIndicator
                    load={Number(row.total_load_hours)}
                    capacity={Number(row.weekly_capacity_hours)}
                  />
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground tabular-nums">
                    {Number(row.total_load_hours)}
                  </span>{" "}
                  h / {Number(row.weekly_capacity_hours)} h
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Synthèse retards (AC#2) — rendue uniquement s'il y en a (état sain silencieux). */}
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
                    {task.assignee_name
                      ? ` · ${task.assignee_name}`
                      : " · non affectée"}
                  </div>
                </div>
                <OverdueBadge className="shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
