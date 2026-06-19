-- TeamFlow — Données de démo (Story 1.1)
-- À exécuter APRÈS schema.sql, dans l'éditeur SQL Supabase (ou `supabase db reset`).
--
-- Identifiants de démo (mot de passe commun) :
--   manager@teamflow.dev  / Password123!   (manager)
--   alice@teamflow.dev    / Password123!   (collaborator)
--   bob@teamflow.dev      / Password123!   (collaborator)
--   carla@teamflow.dev    / Password123!   (collaborator)
--
-- profiles.id étant une FK vers auth.users, on crée d'abord les comptes Auth.
-- Alternative si l'INSERT auth.users échoue sur votre instance : créer les 4
-- utilisateurs via Dashboard → Authentication → Add user (Auto Confirm), avec
-- ces mêmes UUID, puis n'exécuter que les sections « profiles » et « tasks ».

create extension if not exists pgcrypto;

-- Helper idempotent : crée un utilisateur Auth + son identité email -----------
create or replace function seed_user(p_id uuid, p_email text, p_password text)
returns void language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '', '', '', ''
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email', now(), now(), now()
  )
  on conflict do nothing;
end;
$$;

select seed_user('00000000-0000-0000-0000-000000000001', 'manager@teamflow.dev', 'Password123!');
select seed_user('00000000-0000-0000-0000-000000000002', 'alice@teamflow.dev',   'Password123!');
select seed_user('00000000-0000-0000-0000-000000000003', 'bob@teamflow.dev',     'Password123!');
select seed_user('00000000-0000-0000-0000-000000000004', 'carla@teamflow.dev',   'Password123!');

-- profiles -------------------------------------------------------------------
insert into profiles (id, full_name, role, weekly_capacity_hours) values
  ('00000000-0000-0000-0000-000000000001', 'Manon Manager', 'manager',      35),
  ('00000000-0000-0000-0000-000000000002', 'Alice Martin',  'collaborator', 35),
  ('00000000-0000-0000-0000-000000000003', 'Bob Dupont',    'collaborator', 35),
  ('00000000-0000-0000-0000-000000000004', 'Carla Nguyen',  'collaborator', 28)
on conflict (id) do nothing;

-- tasks (≥ 10, réparties ; quelques retards et une tâche non assignée) -------
insert into tasks
  (title, description, priority, estimated_load_hours, status, start_date, due_date, assignee_id, created_by)
values
  ('Maquetter la page d''accueil',        'Wireframes + validation',         'high',   8,  'in_progress', current_date - 3, current_date + 2, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('Intégrer l''authentification',        'Connexion email/mot de passe',    'high',   12, 'todo',        current_date,     current_date + 5, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('Schéma de la base de données',        'Tables + RLS',                    'high',   6,  'done',        current_date - 6, current_date - 4, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
  ('API portefeuille de tâches',          'Lecture + filtres',               'medium', 10, 'in_progress', current_date - 2, current_date + 4, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
  ('Rapport de charge hebdomadaire',      'Vue agrégée par collaborateur',   'medium', 7,  'todo',        current_date,     current_date + 7, '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001'),
  ('Corriger le bug d''export CSV',       'Encodage UTF-8',                  'low',    3,  'todo',        current_date - 5, current_date - 1, '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001'),
  ('Revue de sécurité',                   'Audit des politiques RLS',        'high',   5,  'todo',        current_date - 1, current_date + 3, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('Documentation utilisateur',           'Guide de prise en main',          'low',    4,  'todo',        current_date,     current_date + 10,'00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
  ('Tableau de bord de pilotage',         'Indicateur d''avancement global', 'medium', 9,  'in_progress', current_date - 4, current_date - 2, '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001'),
  ('Optimiser les requêtes SQL',          'Index + plans d''exécution',      'medium', 6,  'todo',        current_date,     current_date + 6, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
  ('Préparer la démo hackathon',          'Scénario + données',              'high',   4,  'todo',        current_date,     current_date + 1, null,                                     '00000000-0000-0000-0000-000000000001'),
  ('Mettre en place le CI',               'Lint + build sur PR',             'low',    5,  'todo',        current_date,     current_date + 8, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001');
