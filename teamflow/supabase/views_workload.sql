-- TeamFlow — Moteur de charge (Épique 3, Story 3.1, FR6)
-- Fichier DÉDIÉ à l'Épique 3 — NE PAS éditer `supabase/schema.sql` (propriété Épique 1).
-- À exécuter dans l'éditeur SQL Supabase (projet cloud). Idempotent (create or replace).
--
-- Charge agrégée par collaborateur sur une période [period_start, period_end] :
--   SUM(estimated_load_hours) des tâches NON 'done' chevauchant la période,
--   regroupé par collaborateur.
--
-- Choix d'implémentation :
--  * Fonction RPC (et non vue statique) : la période est un paramètre utilisateur,
--    impossible à porter par une vue statique.
--  * LEFT JOIN depuis `profiles` : un collaborateur sans tâche active sur la période
--    apparaît avec total_load_hours = 0 (présent, pas absent) — AC#3.
--    Les prédicats sur `tasks` sont dans le ON (pas le WHERE) pour préserver le LEFT JOIN.
--  * Dates nullables : la planification (start/due) relève de l'Épique 2, pas encore faite.
--    Une tâche non planifiée (start_date/due_date NULL) est considérée active sur toute
--    période (les NULL ne l'excluent pas), sinon /workload afficherait 0 partout au jour 1.
--  * security invoker (défaut) : la RLS de l'appelant authentifié s'applique
--    (SELECT ouvert à `authenticated` en Story 1.1).

create or replace function public.workload_by_assignee(
  period_start date,
  period_end   date
)
returns table (
  assignee_id           uuid,
  full_name             text,
  weekly_capacity_hours numeric,
  total_load_hours      numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id                                     as assignee_id,
    p.full_name,
    p.weekly_capacity_hours,
    coalesce(sum(t.estimated_load_hours), 0) as total_load_hours
  from profiles p
  left join tasks t
    on  t.assignee_id = p.id
    and t.status <> 'done'
    and (t.start_date is null or t.start_date <= period_end)
    and (t.due_date   is null or t.due_date   >= period_start)
  where p.role = 'collaborator'
  group by p.id, p.full_name, p.weekly_capacity_hours
  order by p.full_name;
$$;

grant execute on function public.workload_by_assignee(date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Tâches en retard (Épique 3, Story 3.2, FR7)
-- ---------------------------------------------------------------------------
-- Une tâche est « en retard » quand son échéance est dépassée et qu'elle n'est
-- pas terminée :
--   due_date < current_date  AND  status <> 'done'
--
-- Choix d'implémentation :
--  * Comparaison à `current_date` (et non `now()`) : `due_date` est de type `date`.
--    Strict `<` → une tâche due AUJOURD'HUI n'est PAS encore en retard.
--  * LEFT JOIN sur `profiles` : une tâche non affectée (assignee_id NULL) reste
--    listée, avec assignee_name = NULL.
--  * `due_date is not null` : une tâche sans échéance ne peut pas être en retard.
--  * Indépendant de la période de charge : le retard est relatif à « maintenant ».
--  * security invoker (défaut) : la RLS de l'appelant authentifié s'applique
--    (SELECT ouvert à `authenticated` en Story 1.1). Index idx_tasks_due_date /
--    idx_tasks_status couvrent le filtre.

create or replace function public.overdue_tasks()
returns table (
  id            uuid,
  title         text,
  due_date      date,
  status        status,
  assignee_id   uuid,
  assignee_name text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    t.id,
    t.title,
    t.due_date,
    t.status,
    t.assignee_id,
    p.full_name as assignee_name
  from tasks t
  left join profiles p on p.id = t.assignee_id
  where t.due_date is not null
    and t.due_date < current_date
    and t.status <> 'done'
  order by t.due_date asc;
$$;

grant execute on function public.overdue_tasks() to authenticated;

-- ---------------------------------------------------------------------------
-- Avancement global du portefeuille (Épique 3, Story 3.3, FR8)
-- ---------------------------------------------------------------------------
-- Comptes bruts d'avancement sur l'ENSEMBLE du portefeuille :
--   total des tâches, tâches terminées, et heures correspondantes.
--
-- Choix d'implémentation :
--  * Renvoie des COMPTES bruts, jamais un pourcentage : le ratio et le garde-fou
--    « 0 tâche » (pas de division par zéro) se calculent côté TS (completionRate).
--  * Agrégat sans GROUP BY → renvoie TOUJOURS une ligne, même portefeuille vide
--    (0, 0, 0, 0). Pas de cas « aucune ligne » à gérer côté lecture.
--  * count(*)::int (pas bigint) : évite la sérialisation bigint→string de PostgREST.
--  * Heures pondérées (option Architecture FR8) exposées en plus des comptes.
--  * security invoker (défaut) : la RLS de l'appelant authentifié s'applique
--    (SELECT ouvert à `authenticated` en Story 1.1).

create or replace function public.portfolio_progress()
returns table (
  total_tasks int,
  done_tasks  int,
  total_hours numeric,
  done_hours  numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::int                                          as total_tasks,
    count(*) filter (where status = 'done')::int          as done_tasks,
    coalesce(sum(estimated_load_hours), 0)                 as total_hours,
    coalesce(sum(estimated_load_hours) filter (where status = 'done'), 0) as done_hours
  from tasks;
$$;

grant execute on function public.portfolio_progress() to authenticated;
