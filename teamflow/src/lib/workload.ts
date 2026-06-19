import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Une ligne de charge par collaborateur.
// Déclaré localement : le bloc `Functions` de `src/lib/types.ts` est vide et ce
// fichier est en lecture seule pour l'Épique 3 (ne pas régénérer). On caste donc
// le résultat de la RPC plutôt que de dépendre des types générés.
export type WorkloadRow = {
  assignee_id: string;
  full_name: string;
  weekly_capacity_hours: number;
  total_load_hours: number;
};

// Lit la charge agrégée par collaborateur sur la période [periodStart, periodEnd]
// (chaînes ISO 'YYYY-MM-DD'). Frontière de données (AR10) : passe exclusivement par
// `lib/supabase/server`. Appelle la fonction SQL `workload_by_assignee` (views_workload.sql).
export async function getWorkload(
  periodStart: string,
  periodEnd: string,
): Promise<WorkloadRow[]> {
  // Le client est typé contre `Database` dont le bloc Functions est vide : on le
  // dé-type localement pour appeler une RPC non encore présente dans types.ts.
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data, error } = await supabase.rpc("workload_by_assignee", {
    period_start: periodStart,
    period_end: periodEnd,
  });

  if (error) {
    console.error("getWorkload: échec RPC workload_by_assignee", error);
    return [];
  }

  return (data ?? []) as WorkloadRow[];
}

// Une tâche en retard (échéance dépassée, non terminée). Voir `overdue_tasks()`
// dans views_workload.sql. Déclaré localement pour la même raison que WorkloadRow
// (bloc `Functions` de types.ts vide et read-only pour l'Épique 3).
export type OverdueTask = {
  id: string;
  title: string;
  due_date: string;
  status: string;
  assignee_id: string | null;
  assignee_name: string | null;
};

// Lit les tâches en retard (FR7) : `due_date < current_date AND status <> 'done'`.
// Indépendant de toute période — le retard est relatif à la date courante (côté SQL).
// Frontière de données (AR10) : passe exclusivement par `lib/supabase/server`.
export async function getOverdueTasks(): Promise<OverdueTask[]> {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data, error } = await supabase.rpc("overdue_tasks");

  if (error) {
    console.error("getOverdueTasks: échec RPC overdue_tasks", error);
    return [];
  }

  return (data ?? []) as OverdueTask[];
}

// Avancement global du portefeuille (FR8). Voir `portfolio_progress()` dans
// views_workload.sql. Comptes BRUTS (le ratio se calcule côté présentation via
// `completionRate`, garde-fou division par zéro). Déclaré localement pour la même
// raison que WorkloadRow (bloc `Functions` de types.ts vide et read-only Épique 3).
export type PortfolioProgress = {
  total_tasks: number;
  done_tasks: number;
  total_hours: number;
  done_hours: number;
};

// Valeur neutre : portefeuille vide ou erreur RPC → tout à zéro (jamais de throw vers l'UI).
const EMPTY_PROGRESS: PortfolioProgress = {
  total_tasks: 0,
  done_tasks: 0,
  total_hours: 0,
  done_hours: 0,
};

// Lit l'avancement global (FR8) sur l'ensemble du portefeuille. La RPC renvoie
// toujours une ligne (agrégat sans GROUP BY) — on prend la première et on coerce
// chaque champ en nombre. Frontière de données (AR10) : passe par `lib/supabase/server`.
export async function getPortfolioProgress(): Promise<PortfolioProgress> {
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const { data, error } = await supabase.rpc("portfolio_progress");

  if (error) {
    console.error("getPortfolioProgress: échec RPC portfolio_progress", error);
    return EMPTY_PROGRESS;
  }

  const row = (data ?? [])[0];
  if (!row) return EMPTY_PROGRESS;

  return {
    total_tasks: Number(row.total_tasks),
    done_tasks: Number(row.done_tasks),
    total_hours: Number(row.total_hours),
    done_hours: Number(row.done_hours),
  };
}
