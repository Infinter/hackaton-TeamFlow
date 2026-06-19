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
