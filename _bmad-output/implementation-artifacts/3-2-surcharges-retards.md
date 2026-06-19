---
baseline_commit: b3f3c79
epic: 3
story: 2
owner_epic: 3
depends_on: [1.1, 3.1]
---

# Story 3.2: Surcharges & retards (FR7)

Status: review

> 🧩 **Épique 3 — Dev C.** S'appuie directement sur la Story 3.1 (vues de charge + page `/workload` livrées). Aucune dépendance vers l'Épique 2. Périmètre **strictement** dans la propriété Épique 3 (`workload/**`, `dashboard/**`, `lib/workload.ts`, `components/workload/**`, `supabase/views_workload.sql`).

## Story

En tant que **manager**,
je veux **repérer visuellement les collaborateurs en surcharge et les tâches en retard**,
afin de **réagir avant que la situation ne dégénère**.

## Acceptance Criteria

1. **Surcharge** — quand la charge agrégée d'un collaborateur dépasse sa `weekly_capacity_hours` (`total_load_hours > weekly_capacity_hours`), `OverloadFlag` / `CapacityIndicator` met sa barre en évidence (signal de surcharge visuellement distinct de l'état sain).
2. **Retard** — une tâche dont `due_date < current_date` **et** `status <> 'done'` est marquée « en retard » visuellement, sur une surface possédée par l'Épique 3 (page `/workload` et/ou `/dashboard`).
3. **État sain** — aucune surcharge ni retard ⇒ aucun signal d'alerte affiché (l'état nominal reste lisible, sans bruit visuel).

## Tasks / Subtasks

- [x] **Source SQL des retards** (AC: #2)
  - [x] **Étendre** (append, jamais réécrire l'existant) `teamflow/supabase/views_workload.sql` : ajouter une fonction RPC `public.overdue_tasks()` `returns table(id uuid, title text, due_date date, status status, assignee_id uuid, assignee_name text)`, `language sql stable`, **`security invoker`**, `set search_path = public`.
  - [x] Corps : `from tasks t left join profiles p on p.id = t.assignee_id` `where t.due_date is not null and t.due_date < current_date and t.status <> 'done'` `order by t.due_date asc`. ⚠️ Comparer à **`current_date`** (pas `now()`) : `due_date` est de type `date` ; une tâche due **aujourd'hui** n'est PAS en retard (`<`, pas `<=`). `assignee_name = p.full_name` (nullable si tâche non affectée).
  - [x] `grant execute on function public.overdue_tasks() to authenticated;`
  - [x] **À exécuter sur le cloud `dwcobuchffembmjzzjyc`** (connexion `pg` directe via pooler, fournie par l'utilisateur — **non** persistée au dépôt) : DDL appliqué sans erreur, `prosecdef = false` (security invoker) et `provolatile = s` (stable) confirmés, `grant execute to authenticated` vérifié, retour conforme (cf. Debug Log).
  - [x] ⚠️ **La surcharge (AC#1) ne nécessite AUCUN nouveau SQL** : elle est dérivable des données déjà renvoyées par `workload_by_assignee` (`total_load_hours` vs `weekly_capacity_hours`). Ne PAS dupliquer la logique de charge côté SQL. *(décision appliquée : aucun SQL de surcharge ajouté)*
- [x] **Lecture des retards** (AC: #2)
  - [x] **Étendre** `teamflow/src/lib/workload.ts` : ajouter `export type OverdueTask = { id: string; title: string; due_date: string; status: string; assignee_id: string | null; assignee_name: string | null }` et `export async function getOverdueTasks(): Promise<OverdueTask[]>`.
  - [x] Même pattern que `getWorkload` : `createClient` (frontière AR10), client dé-typé localement (`as unknown as SupabaseClient` — `types.ts.Functions` vide, **read-only Épique 3**), `.rpc('overdue_tasks')`, gérer `error` (`console.error`, renvoyer `[]`), caster `(data ?? []) as OverdueTask[]`.
- [x] **Logique de surcharge (pure, testable)** (AC: #1, #3)
  - [x] Créer `teamflow/src/lib/workload-status.ts` : `export function capacityState(load: number, capacity: number): 'ok' | 'near' | 'over'` (`over` si `load > capacity` ; `near` si `load >= capacity * 0.9` ; sinon `ok`) et `export function isOverloaded(row: { total_load_hours: number; weekly_capacity_hours: number }): boolean`. Fonctions pures, sans I/O → testables en isolation (`*.test.ts` colocalisé).
- [x] **Composants d'alerte** (AC: #1, #2, #3)
  - [x] `teamflow/src/components/workload/OverloadFlag.tsx` — badge « Surcharge » (présentational, Server Component), rendu **uniquement** si surcharge (sinon `null` → AC#3).
  - [x] `teamflow/src/components/workload/CapacityIndicator.tsx` — indicateur d'état de capacité réutilisable (couleur/libellé dérivés de `capacityState`), pour `WorkloadBar` et la future synthèse du dashboard (3.3).
  - [x] `teamflow/src/components/workload/OverdueBadge.tsx` — badge « En retard » réutilisable (présentational), consommable en lecture seule (utilitaire exposé pour 3.3, **sans** modifier les fichiers de l'Épique 1).
- [x] **Intégration `/workload`** (AC: #1, #2, #3)
  - [x] **Modifier** `teamflow/src/components/workload/WorkloadBar.tsx` : appliquer la mise en évidence de surcharge (barre en couleur d'alerte + `OverloadFlag`) quand `isOverloaded(row)` ; sinon rendu neutre inchangé (AC#3).
  - [x] **Modifier** `teamflow/src/app/(app)/workload/page.tsx` : appeler `getOverdueTasks()` et rendre une section « Tâches en retard » (liste avec `OverdueBadge`) ; **état vide** = pas de section d'alerte / message neutre (AC#3). La liste des retards est **indépendante de la période** sélectionnée (relative à `current_date`).

## Dev Notes

> ⚠️ **L'application vit dans le sous-répertoire `teamflow/`.** Tous les chemins ci-dessus sont relatifs à `teamflow/`. `package.json`, `npm run dev/build/lint` s'exécutent **depuis `teamflow/`**. [Source: 1-1-socle-technique.md#File List]

> ⚠️ **`teamflow/AGENTS.md` — Next.js 16 a des breaking changes.** Lire le doc concerné dans `teamflow/node_modules/next/dist/docs/` AVANT de coder. Pour cette story : la page `/workload` reste un **Server Component `async`** ; `searchParams` est une `Promise` à `await` (déjà en place via 3.1). Aucun Client Component requis (tout est présentational).

### Décisions tranchées (à appliquer telles quelles)

- **Surcharge = dérivée, pas re-calculée en SQL.** `workload_by_assignee` (3.1) renvoie déjà `total_load_hours` et `weekly_capacity_hours`. La surcharge est `total_load_hours > weekly_capacity_hours`, évaluée côté TS/présentation. N'ajoute **aucune** fonction SQL de surcharge (le contrat Architecture « charge_agrégée > weekly_capacity_hours → indicateur visuel » est une règle de présentation, pas une requête séparée). [Source: architecture.md#Moteur de calcul de charge (vues Postgres) — ligne « Surcharge (FR7) »]
- **Retard = `due_date < current_date AND status <> 'done'`.** Comparer à `current_date` (type `date`), pas `now()` (timestamptz) : pas de coercition implicite hasardeuse, et une échéance **du jour** n'est pas encore dépassée. Index `idx_tasks_due_date` + `idx_tasks_status` déjà en place → requête triviale (NFR3). [Source: architecture.md#Moteur de calcul de charge — ligne « Retard (FR7) » ; teamflow/supabase/schema.sql]
- **Surface du marquage « en retard » : `/workload` (et réutilisable par `/dashboard`).** L'AC dit « portefeuille **et/ou** tableau de bord ». Le portefeuille (`/tasks`, `components/tasks/**`) appartient à l'**Épique 1 — lecture seule** pour l'Épique 3 → on ne le modifie pas. On rend donc le marquage sur `/workload` (possédé Épique 3) et on **expose** `OverdueBadge` + `getOverdueTasks` pour que la Story 3.3 les rappelle sur `/dashboard` sans couplage. [Source: epics.md#Contrat anti-conflits Git ; epics.md#Story 3.3 (« synthèse des surcharges et retards rappelée »)]
- **AC#3 (état sain) = rendu conditionnel.** `OverloadFlag` renvoie `null` hors surcharge ; la section retards n'affiche aucune alerte si `getOverdueTasks()` est vide. Pas de badge « 0 retard » criard — l'état nominal doit rester silencieux.

### Frontière Git & propriété des fichiers (CRITIQUE — 3 devs en parallèle)

- **Fichiers CRÉÉS par cette story (propriété Épique 3) :**
  - `teamflow/src/lib/workload-status.ts` *(NEW — helpers purs surcharge)*
  - `teamflow/src/components/workload/OverloadFlag.tsx` *(NEW)*
  - `teamflow/src/components/workload/CapacityIndicator.tsx` *(NEW)*
  - `teamflow/src/components/workload/OverdueBadge.tsx` *(NEW)*
- **Fichiers MODIFIÉS par cette story (propriété Épique 3) :**
  - `teamflow/supabase/views_workload.sql` *(APPEND `overdue_tasks()` — ne PAS toucher `workload_by_assignee`)*
  - `teamflow/src/lib/workload.ts` *(ADD `OverdueTask` + `getOverdueTasks`)*
  - `teamflow/src/components/workload/WorkloadBar.tsx` *(mise en évidence surcharge)*
  - `teamflow/src/app/(app)/workload/page.tsx` *(section retards)*
- **Fichiers EN LECTURE SEULE (ne JAMAIS modifier) :** `supabase/schema.sql`, `supabase/seed.sql`, `src/lib/types.ts`, `src/lib/supabase/*`, `src/lib/auth.ts`, `src/lib/history.ts`, `src/app/(app)/layout.tsx`, **tout `src/app/(app)/tasks/**` et `src/components/tasks/**` (portefeuille = Épique 1)**, `src/app/(app)/board/**` + `src/components/board/**` (Épique 2). [Source: epics.md#Contrat anti-conflits Git]
- **`src/app/(app)/dashboard/page.tsx`** appartient à l'Épique 3 mais est le périmètre de la **Story 3.3**. Cette story ne le construit pas ; elle fournit les briques (`OverdueBadge`, `getOverdueTasks`, `CapacityIndicator`) que 3.3 consommera. Ne pas anticiper le dashboard ici.

### État existant à RÉUTILISER (lu et confirmé)

- **`teamflow/supabase/views_workload.sql`** *(livré 3.1)* — contient `workload_by_assignee(period_start date, period_end date)` (RPC, `security invoker`, `grant ... to authenticated`). **Append** `overdue_tasks()` dessous ; ne pas modifier l'existant. [Source: teamflow/supabase/views_workload.sql]
- **`teamflow/src/lib/workload.ts`** *(livré 3.1)* — exporte `type WorkloadRow` + `getWorkload(periodStart, periodEnd)`. Pattern RPC dé-typée (`as unknown as SupabaseClient`, gestion `error` → `[]`) à **reproduire** pour `getOverdueTasks`. [Source: teamflow/src/lib/workload.ts]
- **`teamflow/src/components/workload/WorkloadBar.tsx`** *(livré 3.1)* — carte présentational `{ row, index }`. Calcule déjà `capacity`, `load`, `ratio`, `pct`. Le commentaire en tête annonce explicitement que la surcharge relève de la Story 3.2 → c'est ici qu'on l'ajoute. [Source: teamflow/src/components/workload/WorkloadBar.tsx]
- **`teamflow/src/app/(app)/workload/page.tsx`** *(livré 3.1)* — Server Component `async`, garde `requireManager()` → `redirect('/dashboard')`, lit la période via `searchParams`/URL, trie par charge, rend les `WorkloadBar`. On y greffe l'appel `getOverdueTasks()` + la section retards. [Source: teamflow/src/app/(app)/workload/page.tsx]
- **`teamflow/src/lib/auth.ts`** *(livré 1.2, désormais présent — contrairement à la note de 3.1)* — exporte `getCurrentProfile()` et `requireManager(): Promise<AuthResult>`. La page `/workload` est **déjà** manager-only via `requireManager()`. Lecture seule (propriété Épique 1). [Source: teamflow/src/lib/auth.ts]

### Modèle de données pertinent (confirmé via `schema.sql`)

- `tasks(id uuid PK, title text NOT NULL, description text, priority priority NOT NULL default 'medium', estimated_load_hours numeric NOT NULL default 0, status status NOT NULL default 'todo', start_date date NULL, due_date date NULL, assignee_id uuid NULL FK→profiles ON DELETE SET NULL)`. [Source: teamflow/supabase/schema.sql]
- Enums : `status = {todo, in_progress, done}`, `priority = {low, medium, high}`, `role = {manager, collaborator}`.
- Index pertinents : `idx_tasks_due_date (due_date)`, `idx_tasks_status (status)`, `idx_tasks_assignee (assignee_id)` → la requête retards est couverte. [Source: teamflow/supabase/schema.sql]
- RLS (1.1) : `SELECT` sur `tasks`/`profiles` `to authenticated using (true)` → `overdue_tasks()` en `security invoker` lit sans contournement. [Source: teamflow/supabase/schema.sql]

### Patterns imposés (Architecture — à respecter à la lettre)

- **Frontière de données (AR10)** : seul `src/lib/supabase/*` instancie un client ; `lib/workload.ts` l'importe, les composants reçoivent les données en props et ne lisent jamais la DB. [Source: architecture.md#Frontières architecturales]
- **`snake_case` pour les données SQL/DB, `camelCase` pour fonctions/variables TS.** `OverdueTask` reprend les noms SQL (`due_date`, `assignee_id`, `assignee_name`) ; les helpers s'appellent `getOverdueTasks`, `capacityState`, `isOverloaded`. [Source: architecture.md#Nommage]
- **Server Components par défaut** ; ici tout est présentational/serveur, **aucun** `'use client'`. [Source: architecture.md#Architecture Frontend]
- **Sécurité fonction SQL** : `security invoker` (défaut), schéma `public`, `grant execute ... to authenticated` pour l'appel via `supabase.rpc(...)`. **Ne pas** mettre `security definer`. [Source: 3-1-charge-agregee.md#Détails RPC / Supabase]
- **Typage RPC** : `types.ts.Functions` vide et **non régénérable** (read-only Épique 3) → caster le résultat, comme `getWorkload`. [Source: teamflow/src/lib/types.ts ; 3-1-charge-agregee.md]
- **Dates** : échange en chaînes ISO `YYYY-MM-DD` ; affichage éventuel via `Intl.DateTimeFormat('fr-FR')`. [Source: architecture.md#Formats]
- **NFR1 (< 2s)** : `/workload` est dynamique (lit `searchParams` + `cookies()`) → relue à chaque navigation, reflète immédiatement un passage à `done` ou un changement d'échéance fait ailleurs, sans cache à invalider. [Source: architecture.md#Architecture des données ; 3-1-charge-agregee.md]

### Intelligence des stories précédentes (3.1)

- **Vérification cloud obligatoire** : 3.1 a appliqué et testé son DDL sur le cloud réel `dwcobuchffembmjzzjyc` (connexion `pg` directe + appel RPC authentifié HTTP 200). Reproduire pour `overdue_tasks()` : exécuter le DDL, puis `select * from public.overdue_tasks();` et confirmer le tri par `due_date` croissant + le filtre `status <> 'done'`. [Source: 3-1-charge-agregee.md#Debug Log References]
- **Secret non persisté** : la chaîne de connexion `pg` directe est fournie par l'utilisateur et **ne doit jamais** être committée. `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local` reste un placeholder — sans impact (lecture via session authentifiée). [Source: 3-1-charge-agregee.md#Completion Notes List]
- **Données de seed** : 3.1 a confirmé 3 collaborateurs (Alice, Bob, Carla). Pour tester l'AC#2, vérifier qu'au moins une tâche de seed a `due_date < current_date` et `status <> 'done'` ; sinon le panneau retards sera vide (état sain valide pour AC#3, mais à noter explicitement dans les Completion Notes). [Source: 3-1-charge-agregee.md#Debug Log References]

### Testing

- **Tests automatisés optionnels en contexte hackathon** [Source: architecture.md#Structure des fichiers ; 3-1-charge-agregee.md#Testing]. Standard de vérification aligné sur 3.1 :
  - `npm run lint` → 0 erreur ; `npx tsc --noEmit` → OK ; `npm run build` → succès (route `/workload` toujours présente). *(exécutés depuis `teamflow/`)*
  - **Vérification SQL** (éditeur Supabase / `pg`) : `select * from public.overdue_tasks();` → uniquement des tâches `due_date < current_date` et `status <> 'done'`, triées par échéance.
  - **Smoke-test runtime** `npm run dev` contre le cloud : `/workload` charge ; un collaborateur en surcharge (charge > capacité) affiche le signal `OverloadFlag` + barre d'alerte ; la section « Tâches en retard » liste les tâches dépassées (ou reste silencieuse si aucune — AC#3).
- **Encouragé (faible coût)** : tests unitaires de `capacityState()` / `isOverloaded()` (`lib/workload-status.test.ts`) — bornes `ok`/`near`/`over`, capacité 0. Fonctions pures, sans dépendance serveur. La couverture E2E relève de `bmad-qa-generate-e2e-tests`.

### Project Structure Notes

- Périmètre strictement dans la propriété Épique 3 (`workload/**`, `lib/workload*.ts`, `views_workload.sql`, `components/workload/**`). **Aucune** intersection avec les fichiers Épique 1/2. [Source: epics.md#Contrat anti-conflits Git]
- Dépend de 3.1 (vues de charge + page `/workload` + `WorkloadBar` existants). Aucune dépendance vers l'Épique 2.

### References

- FR7 [Source: prd.md#Requirements — « met en évidence visuellement les situations de surcharge … et les tâches en retard »]
- [Source: epics.md#Story 3.2 : Surcharges & retards (FR7)]
- [Source: epics.md#Story 3.3 (dashboard rappelle la synthèse surcharges/retards)]
- [Source: epics.md#Contrat anti-conflits Git]
- [Source: architecture.md#Moteur de calcul de charge (vues Postgres) — Surcharge / Retard (FR7)]
- [Source: architecture.md#Frontières architecturales / Nommage / Formats / Architecture Frontend]
- [Source: 3-1-charge-agregee.md — `views_workload.sql`, `lib/workload.ts`, `WorkloadBar.tsx`, page `/workload`, patterns RPC]
- [Source: teamflow/supabase/schema.sql — colonnes `tasks`, enums, index, RLS SELECT]
- [Source: teamflow/src/lib/auth.ts — `requireManager` présent]
- [Source: teamflow/AGENTS.md — Next.js 16 breaking changes]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Amelia — Senior Software Engineer)

### Debug Log References

Exécutés depuis `teamflow/` :
- `npx tsc --noEmit` → **exit 0** (aucune erreur de types ; le cast `as unknown as SupabaseClient` pour `getOverdueTasks` compile, comme `getWorkload`).
- `npm run lint` (eslint) → **clean** (0 erreur, 0 warning).
- `npm run build` (Next.js 16.2.9, Turbopack) → **✓ Compiled successfully**, TypeScript OK. Route `/workload` = `ƒ` (Dynamic, server-rendered on demand) — conforme.

**Vérification cloud `dwcobuchffembmjzzjyc`** — connexion `pg` directe (Session pooler, fournie par l'utilisateur ; secret **non** persisté) :
- **DDL** : `views_workload.sql` ré-exécuté (idempotent) → **sans erreur**. `pg_proc` confirme `overdue_tasks()` : args vides, `result = TABLE(id uuid, title text, due_date date, status status, assignee_id uuid, assignee_name text)`, `prosecdef = false` (security invoker), `provolatile = s` (stable). `has_function_privilege('authenticated', 'public.overdue_tasks()', 'EXECUTE') = true`. **AC#2 (DDL) ✓**
- **AC#2 (données)** : `select * from public.overdue_tasks()` → **2 lignes**, triées par échéance : « Tableau de bord de pilotage » (16/06, `in_progress`, Carla) et « Corriger le bug d'export CSV » (17/06, `todo`, Alice). Contre-vérification : `done_leaked = 0`, `not_yet_overdue_leaked = 0` (aucune échéance ≥ aujourd'hui), total attendu = 2 → exact.
- **Chemin authentifié** : `set role authenticated; select * from public.overdue_tasks();` → **2 lignes** (grant + RLS `SELECT` ouvert + security invoker confirmés sur la voie réelle de `getOverdueTasks()`). **AC#2 (runtime) ✓**
- **AC#1 (surcharge)** : `workload_by_assignee` (semaine courante) → **Carla Nguyen 29 h / 28 h → surcharge** (`isOverloaded = true` → barre rouge + `OverloadFlag`) ; Alice 13/35 et Bob 24/35 sous capacité → rendu neutre. Signal de surcharge **live** sur le seed actuel. **AC#1 ✓**
- **AC#3 (état sain)** : Alice/Bob (non surchargés) n'affichent aucun signal ; `OverloadFlag` renvoie `null` hors surcharge ; le panneau retards n'apparaît que si `overdue.length > 0`. **AC#3 ✓**

### Completion Notes List

- **Code de la story complet et statiquement vérifié** (tsc 0 · lint clean · build ✓). Périmètre strictement Épique 3 ; **aucun** fichier read-only (Épique 1/2) touché.
- **AC#1 (surcharge)** : dérivée des données 3.1, **aucun SQL ajouté**. `lib/workload-status.ts` (`capacityState`/`isOverloaded`, fonctions pures) + `OverloadFlag` (rendu conditionnel) + mise en évidence dans `WorkloadBar` (barre rouge, badge, % rouge).
- **AC#2 (retard)** : RPC `overdue_tasks()` (append à `views_workload.sql`, `current_date`, `security invoker`, grant), `getOverdueTasks()` (même pattern dé-typé que `getWorkload`), panneau « Tâches en retard » sur `/workload` (surface Épique 3 ; portefeuille = Épique 1 read-only). `OverdueBadge` exposé pour le dashboard de 3.3.
- **AC#3 (état sain)** : `OverloadFlag` → `null` hors surcharge ; panneau retards rendu **uniquement** si `overdue.length > 0`. Aucun signal en état nominal.
- **3/3 ACs vérifiés sur le cloud réel** (DDL appliqué + requêtes SQL + chemin `role=authenticated`) en plus des gates statiques (tsc/lint/build). Surcharge **live** (Carla 29/28) et **2 tâches en retard** présentes dans le seed → les deux signaux sont visibles à l'écran, pas seulement en théorie.

### File List

**Créés :**
- `teamflow/src/lib/workload-status.ts` *(helpers purs `capacityState`/`isOverloaded`)*
- `teamflow/src/components/workload/OverloadFlag.tsx`
- `teamflow/src/components/workload/CapacityIndicator.tsx`
- `teamflow/src/components/workload/OverdueBadge.tsx`

**Modifiés :**
- `teamflow/supabase/views_workload.sql` *(append fonction RPC `overdue_tasks()`)*
- `teamflow/src/lib/workload.ts` *(type `OverdueTask` + `getOverdueTasks`)*
- `teamflow/src/components/workload/WorkloadBar.tsx` *(mise en évidence surcharge)*
- `teamflow/src/app/(app)/workload/page.tsx` *(section « Tâches en retard »)*

## Change Log

| Date | Changement |
|---|---|
| 2026-06-19 | Création du contexte de story 3.2 (FR7) : ACs surcharge/retard/état sain, décisions tranchées (surcharge dérivée sans SQL, retard via `overdue_tasks()` comparé à `current_date`, marquage sur `/workload` car portefeuille = Épique 1 read-only), frontières Git, fichiers à créer/modifier, standard de vérification cloud. Statut → ready-for-dev. |
| 2026-06-19 | Implémentation 3.2 (FR7) : RPC `overdue_tasks()` (append `views_workload.sql`), `getOverdueTasks` + type `OverdueTask` (`lib/workload.ts`), helpers purs `lib/workload-status.ts`, composants `OverloadFlag`/`CapacityIndicator`/`OverdueBadge`, mise en évidence surcharge dans `WorkloadBar`, panneau « Tâches en retard » sur `/workload`. Gates statiques verts (tsc 0 · lint clean · build ✓). |
| 2026-06-19 | DDL appliqué et vérifié sur le cloud `dwcobuchffembmjzzjyc` (connexion `pg`/pooler) : `overdue_tasks()` security invoker + grant authenticated, 2 tâches en retard renvoyées (filtre `current_date`/`status` confirmé, chemin `role=authenticated` OK). AC#1 surcharge live (Carla 29/28), AC#3 état sain confirmé. 3/3 ACs validés → statut `review`. |
