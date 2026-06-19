---
baseline_commit: e674873
epic: 3
story: 1
owner_epic: 3
depends_on: [1.1]
---

# Story 3.1: Charge agrégée par collaborateur (FR6)

Status: review

> 🧩 **Épique 3 — Dev C.** Autonome dès que la Story 1.1 (socle) est fusionnée sur `main`. S'appuie uniquement sur les **données de seed** : aucune dépendance vers l'Épique 2 ni vers les stories d'écriture de l'Épique 1.

## Story

En tant que **manager**,
je veux **voir la charge de travail agrégée de chaque collaborateur sur une période**,
afin de **comprendre comment le travail est réparti**.

## Acceptance Criteria

1. **Source SQL de charge** — le fichier **dédié** `teamflow/supabase/views_workload.sql` (séparé de `schema.sql`, possédé par l'Épique 1) expose un objet SQL de charge qui calcule `SUM(estimated_load_hours)` des tâches **non `done`** chevauchant une période donnée, regroupé par `assignee_id`. Exécuté dans l'éditeur SQL Supabase (projet cloud `dwcobuchffembmjzzjyc`), il s'installe sans erreur.
2. **Page charge** — sur `/workload`, après le choix d'une période, `teamflow/src/lib/workload.ts` lit cette source et `WorkloadBar` affiche, pour chaque collaborateur, la charge cumulée (heures) **face à** sa `weekly_capacity_hours`.
3. **Charge nulle** — un collaborateur sans tâche active sur la période apparaît avec une charge à **0** (ligne présente, **pas absente**).

> ⚠️ **Décision technique tranchée pour l'AC#1/#2 (à appliquer telle quelle).** Une **vue statique ne peut pas prendre la période en paramètre**. La période étant choisie par l'utilisateur (AC#2), l'objet SQL **doit** être une **fonction RPC renvoyant une table** : `workload_by_assignee(period_start date, period_end date)`. L'Architecture autorise explicitement « vues SQL **et/ou fonctions RPC** » [Source: architecture.md#Moteur de calcul de charge (vues Postgres)]. Ne PAS implémenter une vue paramétrée (impossible) ni filtrer la période côté TS (l'AC#1 exige que le `SUM` et le filtre période vivent dans l'objet SQL).

## Tasks / Subtasks

- [x] **Fonction SQL de charge** (AC: #1, #3)
  - [x] Créer `teamflow/supabase/views_workload.sql` — **fichier DÉDIÉ Épique 3** (ne JAMAIS éditer `schema.sql`).
  - [x] Y définir la fonction `public.workload_by_assignee(period_start date, period_end date)` `returns table(assignee_id uuid, full_name text, weekly_capacity_hours numeric, total_load_hours numeric)`, en `language sql stable` et **`security invoker`** (défaut — la RLS de l'appelant s'applique).
  - [x] Corps : **`from profiles p`** `where p.role = 'collaborator'` **`left join tasks t`** `on t.assignee_id = p.id and t.status <> 'done'` et chevauchant la période, puis `group by p.id, p.full_name, p.weekly_capacity_hours`, `total_load_hours = coalesce(sum(t.estimated_load_hours), 0)`. ⚠️ Le `LEFT JOIN` part de `profiles` → garantit l'AC#3 (charge 0 visible) ; les prédicats sur `tasks` vont dans le `ON`, pas dans le `WHERE` (sinon le LEFT JOIN redevient un INNER et masque les 0).
  - [x] `grant execute on function public.workload_by_assignee(date, date) to authenticated;`
  - [x] **Exécuté sur le cloud `dwcobuchffembmjzzjyc`** (connexion directe Postgres via `pg` + pooler) : DDL appliqué sans erreur, signature et `prosecdef=false` (security invoker) confirmés, retour vérifié (cf. Debug Log).
- [x] **Lecture de la charge** (AC: #2, #3)
  - [x] Créer `teamflow/src/lib/workload.ts` → `getWorkload(periodStart: string, periodEnd: string): Promise<WorkloadRow[]>`.
  - [x] Importer `createClient` depuis `@/lib/supabase/server` (frontière de données AR10), `await createClient()`, puis `.rpc('workload_by_assignee', { period_start: periodStart, period_end: periodEnd })`.
  - [x] Déclarer **localement** `export type WorkloadRow = { assignee_id: string; full_name: string; weekly_capacity_hours: number; total_load_hours: number }` et **caster** le résultat. ⚠️ `src/lib/types.ts` est **read-only pour l'Épique 3** et son bloc `Functions` est vide → la RPC n'est pas typée ; ne PAS régénérer `types.ts`.
- [x] **Page & sélecteur de période** (AC: #2, #3)
  - [x] Remplacer le placeholder `teamflow/src/app/(app)/workload/page.tsx` par un **Server Component `async`** qui lit `searchParams` (Next 16 : **`searchParams: Promise<{ from?: string; to?: string }>` → `await searchParams`**), calcule une **période par défaut** (semaine courante) si absente, appelle `getWorkload(from, to)` et rend `WorkloadBar`.
  - [x] Sélecteur de période = `<form method="get">` avec deux `<input type="date" name="from|to">` + bouton submit → état porté par l'**URL** (`?from=&to=`), cohérent AR8, page reste Server Component (zéro JS client requis).
  - [x] Créer `teamflow/src/components/workload/WorkloadBar.tsx` (présentational, Server Component) : par collaborateur, barre `total_load_hours / weekly_capacity_hours` + libellé « Xh / Yh ». **Pas** de mise en évidence de surcharge ici (c'est la Story 3.2 via `OverloadFlag`/`CapacityIndicator`).
  - [x] Helper de période pur extrait dans `teamflow/src/lib/workload-period.ts` (`defaultWeek`, `resolvePeriod`, `toIsoDate`) — testable en isolation.

## Dev Notes

> ⚠️ **L'application vit dans le sous-répertoire `teamflow/`.** Tous les chemins de fichiers ci-dessus sont relatifs à `teamflow/` (ex. réel : `teamflow/src/lib/workload.ts`). Le `package.json`, `npm run dev/build/lint` s'exécutent **depuis `teamflow/`**. [Source: 1-1-socle-technique.md#File List]

> ⚠️ **`teamflow/AGENTS.md` — Next.js 16 a des breaking changes.** Lire le doc concerné dans `teamflow/node_modules/next/dist/docs/` AVANT de coder. Pièges confirmés pour cette story : `searchParams`/`params` sont **asynchrones** (des `Promise`, à `await`) ; `cookies()` est asynchrone (déjà géré par `createClient`).

### Frontière Git & propriété des fichiers (CRITIQUE — 3 devs en parallèle)

- **Fichiers CRÉÉS/REMPLACÉS par cette story (propriété Épique 3) :**
  - `teamflow/supabase/views_workload.sql` *(NEW — fichier SQL dédié, jamais `schema.sql`)*
  - `teamflow/src/lib/workload.ts` *(NEW)*
  - `teamflow/src/app/(app)/workload/page.tsx` *(REMPLACE le placeholder livré par 1.1 — `workload/**` appartient à l'Épique 3)*
  - `teamflow/src/components/workload/WorkloadBar.tsx` *(NEW)*
- **Fichiers EN LECTURE SEULE (ne JAMAIS modifier) :** `supabase/schema.sql`, `supabase/seed.sql`, `src/lib/types.ts`, `src/lib/supabase/*`, `src/lib/history.ts`, `src/app/(app)/layout.tsx` (la nav « Charge » → `/workload` est **déjà livrée** par 1.1). [Source: epics.md#Contrat anti-conflits Git]

### Fichiers du socle à RÉUTILISER (lus et confirmés)

- **`src/lib/supabase/server.ts`** — exporte **`createClient()`** (`async`, à `await`). C'est le **seul** point d'accès DB pour un Server Component / `lib/workload.ts` (AR10). Signature : `export async function createClient()`. [Source: teamflow/src/lib/supabase/server.ts]
- **`src/lib/types.ts`** — types générés `snake_case`. `Database["public"]["Tables"]["profiles"]["Row"]` = `{ full_name: string; id: string; role; weekly_capacity_hours: number }`. `Functions: { [_ in never]: never }` (**vide** → RPC non typée, cf. cast local). [Source: teamflow/src/lib/types.ts]
- **`src/lib/auth.ts` N'EXISTE PAS encore** (prévu Story 1.2). Cette story ne doit donc **PAS** dépendre de `getCurrentProfile()`/`requireManager()`. La page `/workload` est **auto-portée** : la session authentifiée (garantie par le proxy sur le groupe `(app)`) suffit pour que la RLS `SELECT` (tout authentifié) autorise la lecture. Le filtrage RBAC de la nav appartient à la Story 1.2 — ne pas le traiter ici. [Source: 1-1-socle-technique.md#File List ; epics.md#Story 1.2]

### Modèle de données pertinent (confirmé via `schema.sql`)

- `profiles(id uuid PK, full_name text NOT NULL, role role NOT NULL default 'collaborator', weekly_capacity_hours numeric NOT NULL default 35)`
- `tasks(... estimated_load_hours numeric NOT NULL default 0, status status NOT NULL default 'todo', start_date date NULL, due_date date NULL, assignee_id uuid NULL FK→profiles ...)`
- Enums : `status = {todo, in_progress, done}`, `role = {manager, collaborator}`. `assignee_id`, `start_date`, `due_date` sont **nullables**. [Source: teamflow/supabase/schema.sql]
- RLS en place (1.1) : `SELECT` sur `tasks`/`profiles` autorisé `to authenticated using (true)`. Les politiques d'écriture n'existent pas encore (sans impact : story en lecture seule). [Source: teamflow/supabase/schema.sql ; 1-1-socle-technique.md#AC3]

### Règle de chevauchement de période (à implémenter telle quelle)

Une tâche « active sur la période [period_start, period_end] » =
`status <> 'done'`
`AND (start_date IS NULL OR start_date <= period_end)`
`AND (due_date  IS NULL OR due_date  >= period_start)`.

> **Décision (dates nullables) :** la planification (start/due) est l'Épique 2 — non encore faite — donc beaucoup de tâches de seed ont `start_date`/`due_date` à `NULL`. On considère une tâche **non planifiée** comme **active sur toute période** (les `NULL` ne l'excluent pas). C'est le comportement attendu pour un pilotage de charge le jour 1 (sinon `/workload` afficherait 0 partout tant que l'Épique 2 n'a pas planifié). À documenter dans un commentaire SQL.

### Patterns imposés (Architecture — à respecter à la lettre)

- **Frontière de données (AR10)** : seul `src/lib/supabase/*` instancie un client ; `lib/workload.ts` l'importe, les composants ne lisent jamais la DB directement (ils reçoivent les `WorkloadRow[]` en props). [Source: architecture.md#Frontières architecturales]
- **`snake_case` partout** : pas de mapping camelCase. `WorkloadRow` reprend les noms SQL (`assignee_id`, `full_name`, `weekly_capacity_hours`, `total_load_hours`). [Source: architecture.md#Nommage]
- **Server Components par défaut** ; Client Components réservés à l'interactif. Ici, le `<form method="get">` évite tout `'use client'`. [Source: architecture.md#Architecture Frontend]
- **État via URL (AR8)** : la période passe par les query params, pas de state global. [Source: architecture.md#Communication & État]
- **Dates** : échange en chaînes ISO 8601 (`YYYY-MM-DD`) ; affichage éventuel via `Intl.DateTimeFormat('fr-FR')`. [Source: architecture.md#Formats]
- **NFR1 (< 2s)** : la page est dynamique (lit `searchParams` + `cookies()`), donc relue à chaque navigation/refresh → reflète immédiatement les changements faits par les autres épiques, sans cache à invalider. Volumes triviaux pour Postgres (NFR3 ≤ 50 users). [Source: architecture.md#Architecture des données ; #Analyse du Contexte Projet]

### Détails RPC / Supabase (pièges à éviter)

- **Sécurité de la fonction :** `security invoker` (défaut). La RLS de l'appelant authentifié s'applique → lecture OK car `SELECT` est ouvert à `authenticated`. **Ne pas** mettre `security definer` (contournerait la RLS sans raison).
- **Exposition PostgREST :** la fonction doit être dans le schéma `public` et bénéficier d'un `grant execute ... to authenticated` pour être appelable via `supabase.rpc(...)`.
- **Typage TS :** `supabase.rpc('workload_by_assignee', ...)` renverra `data: never`/non typé car le bloc `Functions` de `types.ts` est vide et **ne doit pas** être régénéré (read-only Épique 3). → caster : `const { data, error } = await supabase.rpc('workload_by_assignee', {...}); return (data ?? []) as WorkloadRow[];`. Gérer `error` (log `console.error`, renvoyer `[]`).
- **Argument de période :** passer des chaînes `YYYY-MM-DD` ; Postgres caste vers `date`.

### Période par défaut (AC#2 « après choix d'une période »)

- Si `searchParams.from`/`to` absents → défaut = **semaine courante** (lundi → dimanche) calculée côté serveur (`new Date()` autorisé en code applicatif). Extraire ce calcul dans une petite fonction pure (ex. `defaultWeek(now): { from, to }`) pour la testabilité.
- Le `<input type="date">` est pré-rempli avec ces valeurs ; toute soumission réécrit l'URL.

### Project Structure Notes

- Périmètre strictement dans la propriété Épique 3 (`workload/**`, `lib/workload.ts`, `views_workload.sql`, `components/workload/**`). Aucune intersection avec les fichiers Épique 1/2. [Source: epics.md#Contrat anti-conflits Git]
- Le composant `CapacityIndicator`/`OverloadFlag` (mise en évidence surcharge) **n'est pas** dans cette story → Story 3.2 (FR7). Ici, `WorkloadBar` reste neutre. [Source: epics.md#Story 3.2]

### Testing

- **Tests automatisés optionnels en contexte hackathon** [Source: architecture.md#Structure des fichiers ; #Analyse des lacunes]. Standard de vérification aligné sur la Story 1.1 :
  - `npm run lint` → 0 erreur ; `npx tsc --noEmit` → OK ; `npm run build` → succès (route `/workload` présente). *(exécutés depuis `teamflow/`)*
  - **Smoke-test runtime** `npm run dev` contre le cloud réel (`dwcobuchffembmjzzjyc`) : `/workload` charge, affiche une ligne par collaborateur, dont au moins un à **0** (AC#3), et la charge totale reflète le seed.
  - **Vérification SQL** (éditeur Supabase) : `select * from public.workload_by_assignee(current_date, current_date + 7);` → 3 collaborateurs (seed), `total_load_hours` cohérent, lignes à 0 présentes.
- **Encouragé (faible coût) :** un test unitaire de la fonction pure `defaultWeek()` (calcul lundi→dimanche), colocalisé `*.test.ts`. La couverture E2E complète relève de la skill QA (`bmad-qa-generate-e2e-tests`).

### References

- FR6 [Source: prd.md#Requirements]
- [Source: epics.md#Story 3.1 : Charge agrégée par collaborateur (FR6)]
- [Source: epics.md#Épique 3 : Pilotage de la charge & avancement]
- [Source: epics.md#Contrat anti-conflits Git]
- [Source: architecture.md#Moteur de calcul de charge (vues Postgres)]
- [Source: architecture.md#Flux de données]
- [Source: architecture.md#Frontières architecturales]
- [Source: architecture.md#Nommage / Formats / Communication & État]
- [Source: 1-1-socle-technique.md#File List — `teamflow/` + `src/lib/supabase/server.ts` + nav `/workload`]
- [Source: teamflow/supabase/schema.sql — colonnes, enums, RLS SELECT]
- [Source: teamflow/src/lib/types.ts — `Functions` vide, `Row` profiles/tasks]
- [Source: teamflow/AGENTS.md — Next.js 16 breaking changes ; `searchParams` async]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Amelia — Senior Software Engineer)

### Debug Log References

Exécutés depuis `teamflow/` :
- `npx tsc --noEmit` → **exit 0** (aucune erreur de types ; le cast `as unknown as SupabaseClient` pour la RPC non typée compile).
- `npm run lint` (eslint) → **clean** (0 erreur, 0 warning).
- `npm run build` (Next.js 16.2.9, Turbopack) → **✓ Compiled successfully**, TypeScript OK. Route `/workload` = `ƒ` (Dynamic, server-rendered on demand) — conforme (lit `searchParams` + `cookies()`).

Vérification cloud (`dwcobuchffembmjzzjyc`) — connexion directe Postgres (`pg` + Session pooler, fournie par l'utilisateur ; secret **non** persisté au dépôt) :
- **DDL** : `views_workload.sql` exécuté → **sans erreur**. `pg_proc` confirme `args = "period_start date, period_end date"`, `prosecdef = false` (security invoker). **AC#1 ✓**
- **AC#2** : `workload_by_assignee(current_date, current_date+7)` → 3 collaborateurs avec `weekly_capacity_hours` + `total_load_hours` (Alice 30/35, Bob 20/35, Carla 7/28). La tâche `done` de Bob (6h) est correctement **exclue**. Forme = `WorkloadRow` exact.
- **AC#3** : `workload_by_assignee('1990-01-01','1990-01-07')` (période sans tâche) → **3 lignes présentes, toutes à 0** (le `LEFT JOIN` depuis `profiles` tient). **AC#3 ✓**
- **Chemin runtime authentifié** : sign-in GoTrue `manager@teamflow.dev` → access_token, puis `POST /rest/v1/rpc/workload_by_assignee` avec ce bearer → **HTTP 200** + payload `WorkloadRow[]`. Confirme `grant execute … to authenticated` + `security invoker` + RLS sur la voie réelle de `getWorkload()`. **AC#2 (runtime) ✓**

Gates statiques (depuis `teamflow/`) : `npx tsc --noEmit` → **0** · `npm run lint` → **clean** · `npm run build` → **✓** (route `/workload` = `ƒ` dynamique).

### Completion Notes List

- **3/3 ACs satisfaits et vérifiés sur le cloud réel** (DDL appliqué + requêtes SQL + appel RPC authentifié HTTP 200) en plus des gates statiques (tsc/lint/build).
- Fichiers créés strictement dans le périmètre Épique 3 ; **aucun** fichier en lecture seule (Épique 1 : `schema.sql`, `types.ts`, `lib/supabase/*`, nav) touché.
- **Typage RPC** : `types.ts.Functions` étant vide et non régénérable (read-only Épique 3), `getWorkload` caste le résultat via un client dé-typé localement (`as unknown as SupabaseClient`) — compile proprement (tsc 0, lint clean).
- **Décision dates nullables** documentée dans le SQL : une tâche non planifiée (start/due NULL) est active sur toute période (sinon `/workload` = 0 partout avant la planification de l'Épique 2).
- **Tests automatisés** : non ajoutés (politique hackathon « tests optionnels » + précédent Story 1.1 ; ajouter un runner = nouvelle dépendance nécessitant accord). Logique de période isolée dans `lib/workload-period.ts` (fonctions pures) → testable sans dépendance serveur dès qu'un runner sera installé.
- **Mise en évidence des surcharges (FR7)** volontairement hors périmètre → Story 3.2 (`OverloadFlag`/`CapacityIndicator`).
- ⚠️ **Note env** : `SUPABASE_SERVICE_ROLE_KEY` dans `teamflow/.env.local` reste un placeholder (`REPLACE_WITH_…`) ; sans impact sur cette story (lecture via session authentifiée).

### File List

**Créés :**
- `teamflow/supabase/views_workload.sql` *(fonction RPC `workload_by_assignee`)*
- `teamflow/src/lib/workload.ts` *(`getWorkload`, type `WorkloadRow`)*
- `teamflow/src/lib/workload-period.ts` *(`defaultWeek`, `resolvePeriod`, `toIsoDate`, `buildPresets`)*
- `teamflow/src/components/workload/WorkloadBar.tsx` *(carte collaborateur : avatar dégradé, barre, badge occupation)*
- `teamflow/src/components/workload/PeriodPicker.tsx` *(presets + plage personnalisée)*

**Modifiés :**
- `teamflow/src/app/(app)/workload/page.tsx` *(placeholder 1.1 → page charge complète : en-tête, stats de synthèse, sélecteur, graphes triés)*

## Change Log

| Date | Changement |
|---|---|
| 2026-06-19 | Implémentation Story 3.1 (FR6) : fonction SQL `workload_by_assignee` (LEFT JOIN depuis `profiles`, période paramétrée, charge 0 visible), `lib/workload.ts` (RPC + cast), helpers de période purs, page `/workload` (Server Component, période via URL) + `WorkloadBar`. Vérifié : tsc 0, lint clean, build ✓. |
| 2026-06-19 | DDL appliqué et vérifié sur le cloud `dwcobuchffembmjzzjyc` (connexion directe `pg`/pooler) : AC#1 (création sans erreur, security invoker), AC#2 (charge vs capacité, `done` exclu, appel RPC authentifié HTTP 200), AC#3 (lignes à 0 présentes). 3/3 ACs validés → statut `review`. |
| 2026-06-19 | Refonte UX `/workload` : palette de dégradés dédiée, avatars initiales, barres en dégradé + badge % d'occupation, stats de synthèse (charge/capacité/occupation moyenne), sélecteur de période avec presets (`PeriodPicker`). Rendu vérifié (HTTP 200, tsc/lint/build verts). |
