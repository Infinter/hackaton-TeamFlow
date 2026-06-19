-- Politiques RLS de mutation — à exécuter dans l'éditeur SQL Supabase
-- Projet : dwcobuchffembmjzzjyc
--
-- Story 1.1 ne crée que les politiques SELECT (tout authentifié).
-- Ce fichier ajoute les politiques d'écriture nécessaires aux stories
-- 1.3 (createTask), 1.5 (updateStatus), 2.1 (assignTask) et 2.2 (planTask).
--
-- ⚠️ Vérifier d'abord qu'elles n'existent pas déjà avant d'exécuter.

-- profiles : lecture seule hors story 1.2 (pas de mutation de profil ici)

-- tasks : INSERT réservé aux managers (stories 1.3, 2.1)
create policy tasks_insert_manager on tasks
  for insert to authenticated
  with check (
    (select role from profiles where id = auth.uid()) = 'manager'
  );

-- tasks : UPDATE par l'assigné sur sa propre tâche OU par un manager sur toute tâche
--         (covers story 1.5 updateStatus + story 2.1 assignTask + story 2.2 planTask)
create policy tasks_update_assignee_or_manager on tasks
  for update to authenticated
  using (
    auth.uid() = assignee_id
    or (select role from profiles where id = auth.uid()) = 'manager'
  );

-- task_history : INSERT par tout utilisateur authentifié
--               (logTaskEvent vérifie auth.uid() = author_id côté code)
create policy task_history_insert_authenticated on task_history
  for insert to authenticated
  with check (author_id = auth.uid());
