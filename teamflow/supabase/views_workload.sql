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
