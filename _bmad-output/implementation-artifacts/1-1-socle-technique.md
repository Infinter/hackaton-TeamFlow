# Story 1.1: Socle technique partagé (init, schéma, session, navigation)

Status: ready-for-dev

> 🔑 **Story socle — à réaliser et FUSIONNER EN PREMIER sur `main`.** Tant qu'elle n'est pas mergée, les Épiques 2 et 3 ne peuvent pas démarrer proprement. Un seul dev la prend (~1ʳᵉ heure).

## Story

En tant qu'**équipe de développement**,
je veux **un projet Next.js initialisé, connecté à Supabase avec le schéma de données, la session et la navigation en place**,
afin que **chacun puisse développer sa fonctionnalité sur une base commune sans la reconstruire**.

## Acceptance Criteria

1. **Init projet** — `npm run dev` démarre sans erreur après la commande d'init de l'Architecture (`create-next-app` TS + Tailwind + App Router + src-dir, puis `@supabase/supabase-js`, `@supabase/ssr`, `@dnd-kit/core`, `@dnd-kit/sortable`, `shadcn init`). `.env.example` documente `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. **Schéma** — l'exécution de `supabase/schema.sql` crée les 3 tables `profiles`, `tasks`, `task_history` avec leurs enums (`role`, `priority`, `status`, `event_type`), contraintes NOT NULL et FK.
3. **RLS de base** — SELECT sur `tasks` et `task_history` autorisé pour tout utilisateur authentifié ; RLS activée sur les 3 tables.
4. **Seed** — `supabase/seed.sql` insère ≥ 1 manager, ≥ 3 collaborateurs et ≥ 10 tâches réparties.
5. **Types** — `supabase gen types` produit `src/lib/types.ts` (types `snake_case` consommés directement, aucun mapping).
6. **Session** — `middleware.ts` rafraîchit la session Supabase et redirige tout accès non authentifié au groupe `(app)` vers `/login`.
7. **Frontière de données** — les clients Supabase ne sont instanciés que dans `src/lib/supabase/{server,client}.ts`.
8. **Navigation** — le layout `(app)` rend une nav complète : **Dashboard, Tâches, Tableau, Charge** (routes cibles = pages placeholder à ce stade).
9. **Helper d'historique** — `logTaskEvent(taskId, eventType, {old, new, note})` défini dans `src/lib/history.ts`, insère une ligne `task_history`, importable par toutes les Server Actions.

## Tasks / Subtasks

- [ ] Initialiser le projet (AC: #1)
  - [ ] Lancer `npx create-next-app@latest teamflow --typescript --tailwind --app --eslint --src-dir --use-npm`
  - [ ] `npm install @supabase/supabase-js @supabase/ssr @dnd-kit/core @dnd-kit/sortable`
  - [ ] `npx shadcn@latest init` + ajouter `sonner` (toasts)
  - [ ] Créer `.env.example` et `.env.local` (non versionné, dans `.gitignore`)
- [ ] Créer le projet Supabase et le schéma (AC: #2, #3, #4)
  - [ ] Écrire `supabase/schema.sql` : enums + 3 tables + contraintes + politiques RLS de base
  - [ ] Écrire `supabase/seed.sql` : données de démo
  - [ ] Exécuter les deux dans l'éditeur SQL Supabase
- [ ] Générer les types (AC: #5)
  - [ ] `supabase gen types typescript ... > src/lib/types.ts`
- [ ] Câbler les clients & la session (AC: #6, #7)
  - [ ] `src/lib/supabase/server.ts` et `client.ts`
  - [ ] `src/middleware.ts` (refresh session + protection routes `(app)`)
- [ ] Layout & navigation (AC: #8)
  - [ ] `src/app/layout.tsx` (+ `<Toaster />` sonner), `src/app/page.tsx` (redirige `/dashboard` ou `/login`)
  - [ ] `src/app/(app)/layout.tsx` avec nav (Dashboard, Tâches, Tableau, Charge) + pages placeholder
- [ ] Helper d'historique (AC: #9)
  - [ ] `src/lib/history.ts` → `logTaskEvent(...)`

## Dev Notes

- **Stack imposée** : Next.js 16 (App Router, Server Actions), TypeScript, Supabase (Postgres + Auth + RLS), Tailwind + shadcn/ui, @dnd-kit. [Source: architecture.md#Stack retenue]
- **Modèle de données** (voir détail colonnes/enums) [Source: architecture.md#Architecture des données] :
  - `profiles(id uuid FK→auth.users, full_name text, role enum{manager|collaborator}, weekly_capacity_hours numeric def 35)`
  - `tasks(id, title, description, priority enum{low|medium|high}, estimated_load_hours numeric, status enum{todo|in_progress|done}, start_date date, due_date date, assignee_id FK→profiles, created_by FK→profiles, created_at, updated_at)`
  - `task_history(id, task_id FK→tasks, author_id FK→profiles, event_type enum{created|status_changed|reassigned|planned|progress_note}, old_value text, new_value text, note text, created_at)`
- **RLS** : SELECT tasks/task_history pour tout authentifié ; INSERT/affectation/planification managers uniquement ; UPDATE statut par l'assigné ou manager ; INSERT task_history via Server Action. [Source: architecture.md#Authentification & Sécurité]
- **Convention DB↔code** : `snake_case` en DB et dans les types générés, consommés tels quels jusque dans l'UI — **PAS de mapping camelCase**. [Source: architecture.md#Nommage]
- **Helper d'historique** : signature unique `logTaskEvent(taskId, eventType, {old, new, note})`, appelé par chaque Server Action de mutation. [Source: architecture.md#Communication & État]

### Project Structure Notes

- Arborescence cible complète en [Source: architecture.md#Arborescence complète]. Cette story crée le squelette : `supabase/`, `src/middleware.ts`, `src/app/{layout,page}.tsx`, `src/app/(app)/layout.tsx`, `src/lib/{supabase,history,types}`.
- **Cette story possède les fichiers partagés** (`schema.sql`, `seed.sql`, `lib/types.ts`, `lib/supabase/*`, `lib/history.ts`, nav). Les Épiques 2 et 3 les considèrent en lecture seule. [Source: epics.md#Contrat anti-conflits Git]

### References

- [Source: architecture.md#Évaluation du Starter / Stack Technique]
- [Source: architecture.md#Structure du Projet & Frontières]
- [Source: epics.md#Épique 1 : Fondations & Portefeuille de tâches]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
