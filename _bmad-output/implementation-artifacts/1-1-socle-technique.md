---
baseline_commit: 72b1ff6187e9e2efa9036bfadcf209449d27b2be
---

# Story 1.1: Socle technique partagé (init, schéma, session, navigation)

Status: review

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

- [x] Initialiser le projet (AC: #1)
  - [x] Lancer `npx create-next-app@latest teamflow --typescript --tailwind --app --eslint --src-dir --use-npm` (Next.js **16.2.9**, Turbopack, Tailwind v4)
  - [x] `npm install @supabase/supabase-js @supabase/ssr @dnd-kit/core @dnd-kit/sortable`
  - [x] `npx shadcn@latest init` + ajouter `sonner` (toasts)
  - [x] Créer `.env.example` (3 vars) ; `.env.local` couvert par `.gitignore` avec exception `!.env.example`
- [x] Créer le projet Supabase et le schéma (AC: #2, #3, #4) — exécuté sur le projet cloud `dwcobuchffembmjzzjyc`
  - [x] Écrire `supabase/schema.sql` : enums + 3 tables + contraintes + politiques RLS de base
  - [x] Écrire `supabase/seed.sql` : données de démo (1 manager, 3 collaborateurs, 12 tâches)
  - [x] Exécuter les deux sur la base cloud (via Session pooler) — vérifié : 3 tables, 4 enums, RLS activée + 3 policies SELECT, 4 auth.users, 12 tâches
- [x] Générer les types (AC: #5)
  - [x] `supabase gen types typescript --db-url <pooler> --schema public > src/lib/types.ts` (snake_case, FK introspectées)
- [x] Câbler les clients & la session (AC: #6, #7)
  - [x] `src/lib/supabase/server.ts` et `client.ts`
  - [x] `src/proxy.ts` (Next 16 : `middleware` → `proxy`) appelant `src/lib/supabase/proxy-session.ts` (refresh session + protection routes `(app)`) — redirection `/login` vérifiée (307)
- [x] Layout & navigation (AC: #8)
  - [x] `src/app/layout.tsx` (+ `<Toaster />` sonner), `src/app/page.tsx` (redirige `/dashboard` ou `/login`)
  - [x] `src/app/(app)/layout.tsx` avec nav (Dashboard, Tâches, Tableau, Charge) + pages placeholder
- [x] Helper d'historique (AC: #9)
  - [x] `src/lib/history.ts` → `logTaskEvent(...)`

## Dev Notes

- **Stack imposée** : Next.js 16 (App Router, Server Actions), TypeScript, Supabase (Postgres + Auth + RLS), Tailwind + shadcn/ui, @dnd-kit. [Source: architecture.md#Stack retenue]
- **Modèle de données** (voir détail colonnes/enums) [Source: architecture.md#Architecture des données] :
  - `profiles(id uuid FK→auth.users, full_name text, role enum{manager|collaborator}, weekly_capacity_hours numeric def 35)`
  - `tasks(id, title, description, priority enum{low|medium|high}, estimated_load_hours numeric, status enum{todo|in_progress|done}, start_date date, due_date date, assignee_id FK→profiles, created_by FK→profiles, created_at, updated_at)`
  - `task_history(id, task_id FK→tasks, author_id FK→profiles, event_type enum{created|status_changed|reassigned|planned|progress_note}, old_value text, new_value text, note text, created_at)`
- **RLS** : SELECT tasks/task_history pour tout authentifié ; INSERT/affectation/planification managers uniquement ; UPDATE statut par l'assigné ou manager ; INSERT task_history via Server Action. [Source: architecture.md#Authentification & Sécurité]
- **Convention DB↔code** : `snake_case` en DB et dans les types générés, consommés tels quels jusque dans l'UI — **PAS de mapping camelCase**. [Source: architecture.md#Nommage]
- **Helper d'historique** : signature unique `logTaskEvent(taskId, eventType, {old, new, note})`, appelé par chaque Server Action de mutation. [Source: architecture.md#Communication & État]

### Détails techniques critiques (pièges à éviter — Next.js 16 + @supabase/ssr)

> Ces points sont les sources d'erreur les plus fréquentes sur cette stack. À respecter à la lettre.

- **Cookies `@supabase/ssr` — API `getAll`/`setAll` UNIQUEMENT.** Ne PAS utiliser l'ancienne API `get`/`set`/`remove` (dépréciée, casse le refresh de session). Le client serveur (`src/lib/supabase/server.ts`) passe `{ cookies: { getAll, setAll } }` ; dans `setAll`, encapsuler `cookieStore.set(...)` dans un `try/catch` (un appel depuis un Server Component peut throw — ignoré car le middleware rafraîchit la session).
- **Next.js 16 — `cookies()` est asynchrone** : `const cookieStore = await cookies()` (import depuis `next/headers`). Idem `headers()`. Oublier le `await` est la cause n°1 d'échec du client serveur.
- **`middleware.ts`** : utiliser `createServerClient` avec `getAll` = `request.cookies.getAll()` et `setAll` qui écrit à la fois sur `request.cookies` et sur la `NextResponse`. **Retourner l'objet `supabaseResponse`** (ne pas en recréer un, sinon les cookies de session sont perdus). Appeler `supabase.auth.getUser()` (et non `getSession()`) pour valider la session avant la redirection vers `/login`. [Source: web — Supabase Docs « AI Prompt: Bootstrap Next.js v16 app with Supabase Auth »]
- **Seed AC#4 — `profiles.id` est une FK vers `auth.users` : on ne peut PAS insérer un `profile` sans un utilisateur Auth existant.** Sur projet hébergé (éditeur SQL Supabase), deux options :
  1. **Recommandé** : créer les comptes de démo via le Dashboard Supabase (Authentication → Add user, « Auto Confirm User ») ou l'Admin API (`auth.admin.createUser` avec la `SUPABASE_SERVICE_ROLE_KEY`), récupérer leurs `id`, puis `INSERT INTO profiles`.
  2. **Alternative SQL** : dans `seed.sql`, insérer dans `auth.users` (avec `encrypted_password = crypt('motdepasse', gen_salt('bf'))`, `email_confirmed_at = now()`, `aud='authenticated'`, `role='authenticated'`) **ET** la ligne correspondante dans `auth.identities` (sinon le login échoue), puis dans `profiles`. Extension `pgcrypto` requise.

  Documenter dans le seed les identifiants de démo (email/mot de passe) du manager et des collaborateurs pour la démo. [Source: web — Supabase Docs « User Management » ; laros.io « Seeding users in Supabase with a SQL seed script »]
- **`supabase gen types`** : nécessite la CLI Supabase et le `project-ref` (ou un login `supabase login`). Commande type : `supabase gen types typescript --project-id <ref> --schema public > src/lib/types.ts`. Régénérer ce fichier à chaque évolution du schéma (il est en lecture seule pour les Épiques 2 et 3).

### Project Structure Notes

- Arborescence cible complète en [Source: architecture.md#Arborescence complète]. Cette story crée le squelette : `supabase/`, `src/middleware.ts`, `src/app/{layout,page}.tsx`, `src/app/(app)/layout.tsx`, `src/lib/{supabase,history,types}`.
- **Cette story possède les fichiers partagés** (`schema.sql`, `seed.sql`, `lib/types.ts`, `lib/supabase/*`, `lib/history.ts`, nav). Les Épiques 2 et 3 les considèrent en lecture seule. [Source: epics.md#Contrat anti-conflits Git]
- **Portée RLS de cette story (AC#3)** : activer RLS sur les 3 tables + créer **uniquement** les politiques `SELECT` (tout authentifié). Les politiques de mutation (INSERT/UPDATE manager ou assigné) appartiennent aux stories 1.2/1.3/1.5 — ne PAS les écrire ici. Le **seed s'exécute en service role et contourne la RLS**, donc l'amorçage fonctionne même sans politique d'écriture. [Source: architecture.md#Authentification & Sécurité]
- **Pages placeholder (AC#8)** : créer des pages minimales pour `dashboard/`, `tasks/`, `board/`, `workload/` afin que la nav ne renvoie pas de 404. Elles seront remplacées par chaque épique — ne pas y mettre de logique.

### References

- [Source: architecture.md#Évaluation du Starter / Stack Technique]
- [Source: architecture.md#Structure du Projet & Frontières]
- [Source: architecture.md#Authentification & Sécurité]
- [Source: architecture.md#Communication & État]
- [Source: epics.md#Épique 1 : Fondations & Portefeuille de tâches]
- [Source: epics.md#Contrat anti-conflits Git]
- [Source: web — Supabase Docs, « AI Prompt: Bootstrap Next.js v16 app with Supabase Auth » — https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth]
- [Source: web — Supabase Docs, « User Management » — https://supabase.com/docs/guides/auth/managing-user-data]
- [Source: web — laros.io, « Seeding users in Supabase with a SQL seed script » — https://laros.io/seeding-users-in-supabase-with-a-sql-seed-script]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Amelia — Senior Software Engineer)

### Debug Log References

- `npm run lint` → clean (0 erreur).
- `npx tsc --noEmit` → OK.
- `npm run build` → ✓ compilé (Next.js 16.2.9, Turbopack) ; routes `/`(dynamique), `/login` `/dashboard` `/tasks` `/board` `/workload` (statiques) ; `ƒ Proxy` détecté.
- Exécution cloud (projet `dwcobuchffembmjzzjyc`, via Session pooler) :
  - `schema.sql` + `seed.sql` → OK. Vérifié : 3 tables (`profiles`, `tasks`, `task_history`), 4 enums, RLS activée sur les 3, 3 policies SELECT `authenticated`, 4 `auth.users`, profils 1 manager / 3 collaborateurs, 12 tâches (1 non assignée, 2 en retard), FK `tasks_assignee_id_fkey` / `tasks_created_by_fkey`.
  - `supabase gen types` → `src/lib/types.ts` régénéré (9,2 Ko, snake_case, FK introspectées). Helper `seed_user` supprimé après seed (schéma propre).
- Smoke-test `npm run dev` avec env **cloud réel** :
  - `GET /login` → **HTTP 200**
  - `GET /dashboard` → **HTTP 307 → /login** (`getUser()` réel → session absente → redirection)
  - REST anon `GET /rest/v1/tasks` → **`[]` (HTTP 200)** : la policy SELECT restreint bien à `authenticated`.

### Completion Notes List

- **Déviation AC#6 justifiée par la stack réelle** : Next.js 16 a renommé `middleware` → `proxy` (`middleware.ts` déprécié). Implémenté en `src/proxy.ts` exportant `proxy()`, runtime Node.js par défaut. Comportement identique à l'AC (refresh session + redirection `/login`). [Réf. `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`]
- **Frontière de données (AC#7) respectée** : l'instanciation du client en proxy vit dans `src/lib/supabase/proxy-session.ts` — au sein de `src/lib/supabase/*`, conformément à AR10. Aucun autre fichier n'instancie de client.
- **Cookies `@supabase/ssr`** : API `getAll`/`setAll` uniquement ; `cookies()` awaité (Next 16). `proxy-session.ts` retourne bien l'objet `supabaseResponse` et appelle `getUser()`.
- **types.ts (AC#5)** : généré depuis le schéma cloud via `supabase gen types --db-url` (Docker requis par la CLI ; OrbStack démarré pour l'occasion).
- **`.env.local`** renseigné avec l'URL projet réelle + clé anon. ⚠️ `SUPABASE_SERVICE_ROLE_KEY` reste un placeholder : la clé fournie était un doublon de l'anon (JWT `role:anon`). Non utilisée par la Story 1.1 ; à remplacer par la vraie clé (Project Settings → API) avant les stories qui en dépendent.
- **9/9 ACs satisfaits et vérifiés** (build + lint + tsc + exécution SQL cloud + smoke-test runtime). Statut → `review`.

### File List

**Créés (app `teamflow/`) :**
- `teamflow/` — projet Next.js 16 (create-next-app : package.json, tsconfig, next.config, eslint, tailwind v4, components.json, src/app/globals.css, favicon)
- `teamflow/.env.example`
- `teamflow/.gitignore` (exception `!.env.example` ajoutée)
- `teamflow/supabase/schema.sql`
- `teamflow/supabase/seed.sql`
- `teamflow/src/lib/types.ts` (généré via `supabase gen types`)
- `teamflow/src/lib/supabase/server.ts`
- `teamflow/src/lib/supabase/client.ts`
- `teamflow/src/lib/supabase/proxy-session.ts`
- `teamflow/src/proxy.ts`
- `teamflow/src/lib/history.ts`
- `teamflow/src/app/layout.tsx` (modifié : `<Toaster />`, `lang="fr"`, métadonnées TeamFlow)
- `teamflow/src/app/page.tsx` (modifié : redirection auth)
- `teamflow/src/app/login/page.tsx`
- `teamflow/src/app/(app)/layout.tsx` (nav)
- `teamflow/src/app/(app)/dashboard/page.tsx`
- `teamflow/src/app/(app)/tasks/page.tsx`
- `teamflow/src/app/(app)/board/page.tsx`
- `teamflow/src/app/(app)/workload/page.tsx`
- `teamflow/src/components/ui/{button,sonner}.tsx`, `teamflow/src/lib/utils.ts` (shadcn)

## Change Log

| Date | Changement |
|---|---|
| 2026-06-19 | Socle technique implémenté : init Next.js 16 + deps + shadcn/sonner ; schéma + seed SQL ; clients Supabase + proxy de session (redirection vérifiée) ; layout + nav + placeholders ; `logTaskEvent`. |
| 2026-06-19 | Exécution sur projet cloud `dwcobuchffembmjzzjyc` : schéma + seed appliqués et vérifiés, types régénérés, `.env.local` renseigné, smoke-test runtime OK. 9/9 ACs validés → statut `review`. |
