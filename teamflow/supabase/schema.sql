-- TeamFlow — Schéma de base (Story 1.1)
-- À exécuter dans l'éditeur SQL Supabase, ou via `supabase db push`.
-- Convention : snake_case en DB, consommé tel quel dans le code (aucun mapping).

-- Extensions ---------------------------------------------------------------
create extension if not exists pgcrypto;

-- Enums --------------------------------------------------------------------
create type role as enum ('manager', 'collaborator');
create type priority as enum ('low', 'medium', 'high');
create type status as enum ('todo', 'in_progress', 'done');
create type event_type as enum ('created', 'status_changed', 'reassigned', 'planned', 'progress_note');

-- Tables -------------------------------------------------------------------

-- profiles : extension de auth.users (porte le rôle et la capacité hebdo)
create table profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  full_name             text not null,
  role                  role not null default 'collaborator',
  weekly_capacity_hours numeric not null default 35
);

-- tasks : portefeuille de travail
create table tasks (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text,
  priority             priority not null default 'medium',
  estimated_load_hours numeric not null default 0,
  status               status not null default 'todo',
  start_date           date,
  due_date             date,
  assignee_id          uuid references profiles (id) on delete set null,
  created_by           uuid not null references profiles (id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- task_history : journal de traçabilité (point d'entrée unique = logTaskEvent)
create table task_history (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks (id) on delete cascade,
  author_id  uuid not null references profiles (id),
  event_type event_type not null,
  old_value  text,
  new_value  text,
  note       text,
  created_at timestamptz not null default now()
);

-- Index ---------------------------------------------------------------------
create index idx_tasks_assignee on tasks (assignee_id);
create index idx_tasks_status on tasks (status);
create index idx_tasks_due_date on tasks (due_date);
create index idx_task_history_task on task_history (task_id);

-- RLS : activée sur les 3 tables (Story 1.1) -------------------------------
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table task_history enable row level security;

-- Politiques de LECTURE uniquement (Story 1.1) : tout utilisateur authentifié.
-- Les politiques d'écriture (INSERT/UPDATE manager ou assigné) sont ajoutées
-- par les stories 1.2 / 1.3 / 1.5. Le seed s'exécute en service role et
-- contourne la RLS — l'amorçage fonctionne donc sans politique d'écriture.
create policy profiles_select_authenticated on profiles
  for select to authenticated using (true);

create policy tasks_select_authenticated on tasks
  for select to authenticated using (true);

create policy task_history_select_authenticated on task_history
  for select to authenticated using (true);
