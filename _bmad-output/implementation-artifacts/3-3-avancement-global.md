---
baseline_commit: b3f3c79
epic: 3
story: 3
owner_epic: 3
depends_on: [1.1, 3.1, 3.2]
---

# Story 3.3: Avancement global du portefeuille (FR8)

Status: review

> 🧩 **Épique 3 — Dev C.** Dernière story de l'épique. Construit la page `/dashboard` (aujourd'hui un stub) en **réutilisant** les briques déjà livrées par 3.1 (`getWorkload`, `workload-period`) et 3.2 (`getOverdueTasks`, `OverdueBadge`, `CapacityIndicator`, `isOverloaded`). Périmètre **strictement** dans la propriété Épique 3 (`dashboard/**`, `lib/workload*.ts`, `components/workload/**`, `supabase/views_workload.sql`). Aucune dépendance de code vers les Épiques 1/2 — le rafraîchissement se fait par **revalidation**, pas par couplage.

## Story

En tant que **manager**,
je veux **un indicateur d'avancement global du portefeuille**,
afin de **suivre la progression d'ensemble d'un coup d'œil**.

## Acceptance Criteria

1. **Indicateur global** — sur `/dashboard`, un indicateur d'avancement global du portefeuille (ratio des tâches `done` sur le total) est affiché sous forme de **pourcentage ET de barre**. [FR8]
2. **Synthèse surcharges/retards** — le tableau de bord rappelle une synthèse des **surcharges** (collaborateurs dont la charge > capacité) et des **tâches en retard** (Story 3.2), en réutilisant les briques 3.2 (`CapacityIndicator`/`isOverloaded` et `getOverdueTasks`/`OverdueBadge`).
3. **NFR1 (< 2s)** — après qu'une tâche passe `done` ailleurs dans l'application (mutation + `revalidatePath` côté Épique 1/2), l'indicateur reflète le nouvel état **au rechargement** de `/dashboard` en moins de 2 secondes (page dynamique, relue à chaque navigation — pas de cache à invalider).
4. **Cas vide / division par zéro** — portefeuille vide (0 tâche) ⇒ l'indicateur affiche **0 %** (et une barre vide) **sans division par zéro** ; aucune section d'alerte n'est rendue (état sain silencieux, cohérent AC#3 de 3.2).

## Tasks / Subtasks

- [x] **Source SQL de l'avancement** (AC: #1, #4)
  - [x] **Étendre** (append, JAMAIS réécrire l'existant) `teamflow/supabase/views_workload.sql` : ajouter une fonction RPC `public.portfolio_progress()` `returns table(total_tasks int, done_tasks int, total_hours numeric, done_hours numeric)`, `language sql stable`, **`security invoker`**, `set search_path = public`.
  - [x] Corps : `select count(*)::int as total_tasks, count(*) filter (where status = 'done')::int as done_tasks, coalesce(sum(estimated_load_hours), 0) as total_hours, coalesce(sum(estimated_load_hours) filter (where status = 'done'), 0) as done_hours from tasks;`. ⚠️ **Renvoyer des comptes bruts, PAS un pourcentage** : le ratio (et le garde-fou division-par-zéro) se calcule côté TS (AC#4). `count(*)::int` (pas `bigint`) pour éviter toute sérialisation `bigint`→string côté PostgREST. La requête renvoie **toujours une ligne** (agrégat sans `group by`), même portefeuille vide → `0,0,0,0`.
  - [x] `grant execute on function public.portfolio_progress() to authenticated;`
  - [x] **À exécuter sur le cloud `dwcobuchffembmjzzjyc`** (connexion `pg` directe via pooler, fournie par l'utilisateur — secret **non** persisté au dépôt) : DDL appliqué sans erreur, `prosecdef = false` (security invoker), `provolatile = s` (stable), `grant execute to authenticated` vérifié, `select * from public.portfolio_progress();` renvoie une ligne cohérente (cf. Debug Log).
- [x] **Lecture de l'avancement** (AC: #1, #4)
  - [x] **Étendre** `teamflow/src/lib/workload.ts` : ajouter `export type PortfolioProgress = { total_tasks: number; done_tasks: number; total_hours: number; done_hours: number }` et `export async function getPortfolioProgress(): Promise<PortfolioProgress>`.
  - [x] Même pattern que `getWorkload`/`getOverdueTasks` : `createClient` (frontière AR10), client dé-typé localement (`as unknown as SupabaseClient` — `types.ts.Functions` vide, **read-only Épique 3**), `.rpc('portfolio_progress')`, gérer `error` (`console.error` + renvoyer le neutre `{ total_tasks: 0, done_tasks: 0, total_hours: 0, done_hours: 0 }`), prendre **la première ligne** `(data ?? [])[0]` et coercer chaque champ via `Number(...)` (l'agrégat renvoie un tableau d'une ligne).
- [x] **Logique d'avancement (pure, testable)** (AC: #1, #4)
  - [x] **Étendre** `teamflow/src/lib/workload-status.ts` (append) : `export function completionRate(done: number, total: number): number` → `total > 0 ? Math.round((done / total) * 100) : 0`. Fonction pure (garde-fou division par zéro, AC#4), colocalisable avec un test unitaire (`workload-status.test.ts`) si un runner est installé.
- [x] **Composant indicateur (présentational)** (AC: #1, #4)
  - [x] Créer `teamflow/src/components/workload/ProgressGauge.tsx` — Server Component présentational : reçoit `{ done, total }` (et optionnellement `doneHours`/`totalHours`), affiche **% (via `completionRate`) + barre de progression** et le décompte `done / total`. Cas `total === 0` : 0 %, barre vide, libellé neutre (« Aucune tâche »). Ne lit JAMAIS la DB.
- [x] **Page `/dashboard`** (AC: #1, #2, #3, #4)
  - [x] **Remplacer** le stub `teamflow/src/app/(app)/dashboard/page.tsx` par un Server Component `async` qui :
    - lit en parallèle `getPortfolioProgress()`, `getOverdueTasks()` et `getWorkload(defaultWeek(now).from, defaultWeek(now).to)` ;
    - rend `ProgressGauge` (indicateur global, AC#1) ;
    - rend une **synthèse surcharges** : filtre `rows.filter(isOverloaded)` ; pour chaque collaborateur en surcharge, ligne avec `CapacityIndicator` (réutilisé de 3.2). Si aucune surcharge → pas de section (état sain silencieux, AC#2/AC#3-de-3.2) ;
    - rend une **synthèse retards** : `overdue` listées avec `OverdueBadge` (réutilisé de 3.2). Si `overdue.length === 0` → pas de section.
  - [x] ⚠️ **Ne PAS ajouter `requireManager()` sur `/dashboard`** (voir Décision tranchée « Pas de garde manager »). La page reste accessible à tous les rôles authentifiés.

## Dev Notes

> ⚠️ **L'application vit dans le sous-répertoire `teamflow/`.** Tous les chemins ci-dessus sont relatifs à `teamflow/`. `package.json`, `npm run dev/build/lint` s'exécutent **depuis `teamflow/`**. [Source: 1-1-socle-technique.md#File List]

> ⚠️ **`teamflow/AGENTS.md` — Next.js 16 a des breaking changes.** Lire le doc concerné dans `teamflow/node_modules/next/dist/docs/` AVANT de coder. Pour cette story : `/dashboard` est un **Server Component `async`** sans `searchParams` (aucun paramètre d'URL). Aucun Client Component requis (tout est présentational, lecture serveur). [Source: teamflow/AGENTS.md ; 3-2-surcharges-retards.md#Dev Notes]

### Décisions tranchées (à appliquer telles quelles)

- **Avancement = comptes bruts en SQL, ratio en TS.** `portfolio_progress()` renvoie `total_tasks`/`done_tasks` (+ heures), JAMAIS un pourcentage. Le ratio et le garde-fou « 0 tâche » (AC#4) vivent dans `completionRate(done, total)` (pur, testable) côté présentation. Même philosophie que la surcharge en 3.2 (« dérivée, pas re-calculée en SQL »). [Source: architecture.md#Moteur de calcul de charge — ligne « Avancement global (FR8) » ; 3-2-surcharges-retards.md#Décisions tranchées]
- **🚨 PAS de garde manager sur `/dashboard` (anti-disaster).** `/dashboard` est la **page de redirection par défaut après login** pour TOUS les rôles (Stories 1.1/1.2). De plus, `/workload` **redirige les non-managers vers `/dashboard`** (`requireManager()` → `redirect('/dashboard')`, cf. `workload/page.tsx`). Gater `/dashboard` avec `requireManager()` créerait une **boucle de redirection** pour les collaborateurs. La RLS `SELECT` est ouverte à tout authentifié (transparence d'équipe) → l'avancement et la synthèse sont visibles par tous, sans contournement. **Ne pas ajouter `requireManager()` ici.** [Source: 3-1-charge-agregee.md / teamflow/src/app/(app)/workload/page.tsx (redirect vers /dashboard) ; architecture.md#Authentification & Sécurité (SELECT ouvert) ; epics.md#Story 1.1 (dashboard = route post-login)]
- **Réutiliser, ne PAS dupliquer.** La synthèse surcharges/retards (AC#2) consomme **exactement** les briques que 3.2 a exposées pour le dashboard : `getOverdueTasks()` + `OverdueBadge` (retards) et `getWorkload()` + `isOverloaded()`/`CapacityIndicator` (surcharges). **Ne réécris aucune logique de charge, de retard ni de surcharge.** [Source: 3-2-surcharges-retards.md#Décisions tranchées (« OverdueBadge exposé pour le dashboard de 3.3 »), #État existant à RÉUTILISER]
- **Fenêtre de la synthèse surcharges = semaine courante.** Le dashboard n'a pas de sélecteur de période ; utiliser `defaultWeek(now)` (de `lib/workload-period.ts`) pour `getWorkload`, cohérent avec le défaut de `/workload`. Les retards (`getOverdueTasks`) sont **indépendants de toute période** (relatifs à `current_date`). [Source: teamflow/src/lib/workload-period.ts#defaultWeek ; 3-2-surcharges-retards.md]
- **État sain silencieux (AC#2/AC#4).** Aucune surcharge ⇒ pas de section surcharges ; `overdue.length === 0` ⇒ pas de section retards ; 0 tâche ⇒ `ProgressGauge` à 0 % sans alerte. Pas de badge « 0 retard » criard — l'état nominal reste silencieux (cohérent AC#3 de 3.2). [Source: 3-2-surcharges-retards.md#Décisions tranchées (AC#3)]

### Frontière Git & propriété des fichiers (CRITIQUE — 3 devs en parallèle)

- **Fichiers CRÉÉS par cette story (propriété Épique 3) :**
  - `teamflow/src/components/workload/ProgressGauge.tsx` *(NEW — indicateur d'avancement présentational)*
- **Fichiers MODIFIÉS par cette story (propriété Épique 3) :**
  - `teamflow/supabase/views_workload.sql` *(APPEND `portfolio_progress()` — ne PAS toucher `workload_by_assignee` ni `overdue_tasks`)*
  - `teamflow/src/lib/workload.ts` *(ADD type `PortfolioProgress` + `getPortfolioProgress`)*
  - `teamflow/src/lib/workload-status.ts` *(APPEND fonction pure `completionRate`)*
  - `teamflow/src/app/(app)/dashboard/page.tsx` *(remplace le stub par le vrai tableau de bord)*
- **Fichiers EN LECTURE SEULE (ne JAMAIS modifier) :** `supabase/schema.sql`, `supabase/seed.sql`, `src/lib/types.ts`, `src/lib/supabase/*`, `src/lib/auth.ts`, `src/lib/history.ts`, `src/app/(app)/layout.tsx`, **tout `src/app/(app)/tasks/**` et `src/components/tasks/**` (portefeuille = Épique 1)**, `src/app/(app)/board/**` + `src/components/board/**` (Épique 2). [Source: epics.md#Contrat anti-conflits Git]
- **Possédés Épique 3 mais PÉRIMÈTRE 3.1/3.2 — ne pas modifier ici (réutilisation en lecture seule) :** `src/app/(app)/workload/page.tsx`, `src/components/workload/{WorkloadBar,OverloadFlag,OverdueBadge,CapacityIndicator,PeriodPicker}.tsx`, `src/lib/workload-period.ts`. 3.3 **importe** ces briques, ne les réécrit pas.

### État existant à RÉUTILISER (lu et confirmé)

- **`teamflow/supabase/views_workload.sql`** — contient `workload_by_assignee(period_start date, period_end date)` (3.1) et `overdue_tasks()` (3.2), les deux `security invoker` + `grant ... to authenticated`. **Append** `portfolio_progress()` dessous ; ne modifie aucune des deux fonctions existantes. [Source: teamflow/supabase/views_workload.sql]
- **`teamflow/src/lib/workload.ts`** — exporte `WorkloadRow` + `getWorkload`, `OverdueTask` + `getOverdueTasks`. Pattern RPC dé-typée (`as unknown as SupabaseClient`, gestion `error` → neutre) à **reproduire** pour `getPortfolioProgress`. ⚠️ `getPortfolioProgress` renvoie **un objet** (pas un tableau) → prendre `(data ?? [])[0]` et coercer via `Number()`. [Source: teamflow/src/lib/workload.ts]
- **`teamflow/src/lib/workload-status.ts`** — exporte `capacityState`, `isOverloaded`, type `CapacityState`. **Append** `completionRate` (pur, garde-fou 0). [Source: teamflow/src/lib/workload-status.ts]
- **`teamflow/src/components/workload/CapacityIndicator.tsx`** — présentational `{ load, capacity, dotOnly?, className? }`, dérive couleur/libellé de `capacityState`. Conçu explicitement « pour la synthèse du tableau de bord (Story 3.3) ». **À réutiliser** dans la synthèse surcharges. [Source: teamflow/src/components/workload/CapacityIndicator.tsx]
- **`teamflow/src/components/workload/OverdueBadge.tsx`** — badge « En retard » présentational `{ className? }`. Exposé par 3.2 « consommable par la synthèse du dashboard (Story 3.3) ». **À réutiliser** dans la synthèse retards. [Source: teamflow/src/components/workload/OverdueBadge.tsx]
- **`teamflow/src/lib/workload-period.ts`** — `defaultWeek(now): Period` (lundi→dimanche), `toIsoDate`. À utiliser pour la fenêtre de la synthèse surcharges. [Source: teamflow/src/lib/workload-period.ts]
- **`teamflow/src/app/(app)/dashboard/page.tsx`** — actuellement un **stub** (`<h1>Dashboard</h1>` + texte « Stories 3.2 / 3.3 »). C'est le fichier à remplacer. Aucune garde présente aujourd'hui → **conserver l'absence de garde** (cf. Décision « Pas de garde manager »). [Source: teamflow/src/app/(app)/dashboard/page.tsx]
- **`teamflow/src/app/(app)/workload/page.tsx`** — montre le pattern exact à imiter : `Intl.DateTimeFormat('fr-FR')` pour les dates, panneau retards conditionnel (`overdue.length > 0`), tri/aggrégation des `WorkloadRow`. **Réutiliser le style de la section retards** pour cohérence visuelle. [Source: teamflow/src/app/(app)/workload/page.tsx]

### Modèle de données pertinent (confirmé via `schema.sql`)

- `tasks(id uuid PK, status status NOT NULL default 'todo', estimated_load_hours numeric NOT NULL default 0, ...)`. Enum `status = {todo, in_progress, done}`. `count(*) filter (where status = 'done')` est trivial (NFR3). [Source: teamflow/supabase/schema.sql ; 3-2-surcharges-retards.md#Modèle de données]
- RLS (1.1) : `SELECT` sur `tasks`/`profiles` `to authenticated using (true)` → `portfolio_progress()` en `security invoker` agrège l'intégralité du portefeuille sans contournement. [Source: teamflow/supabase/schema.sql]
- Seed (confirmé 3.1/3.2) : 3 collaborateurs (Alice, Bob, Carla), Carla en surcharge (29/28 sem. courante), **2 tâches en retard**. Le dashboard doit donc afficher : un % d'avancement non nul, **1 surcharge** (Carla) et **2 retards** sur le seed actuel. [Source: 3-2-surcharges-retards.md#Debug Log References]

### Patterns imposés (Architecture — à respecter à la lettre)

- **Frontière de données (AR10)** : seul `src/lib/supabase/*` instancie un client ; `lib/workload.ts` l'importe, les composants reçoivent les données en props et ne lisent jamais la DB. [Source: architecture.md#Frontières architecturales]
- **`snake_case` pour les données SQL/DB, `camelCase`/`PascalCase` côté code.** Type `PortfolioProgress` aux champs SQL (`total_tasks`, `done_tasks`, `total_hours`, `done_hours`) ; helpers `getPortfolioProgress`, `completionRate` ; composant `ProgressGauge`. [Source: architecture.md#Nommage]
- **Server Components par défaut** ; ici tout est présentational/serveur, **aucun** `'use client'`. [Source: architecture.md#Architecture Frontend]
- **Sécurité fonction SQL** : `security invoker` (défaut), schéma `public`, `grant execute ... to authenticated`. **Ne pas** mettre `security definer`. [Source: 3-1-charge-agregee.md#Détails RPC ; 3-2-surcharges-retards.md]
- **Typage RPC** : `types.ts.Functions` vide et **non régénérable** (read-only Épique 3) → caster le résultat, comme `getWorkload`/`getOverdueTasks`. [Source: teamflow/src/lib/types.ts ; 3-1-charge-agregee.md]
- **Dates** : affichage des échéances via `Intl.DateTimeFormat('fr-FR')` (réutiliser le helper `formatDue` de `workload/page.tsx` si tu affiches les échéances des retards). [Source: architecture.md#Formats ; teamflow/src/app/(app)/workload/page.tsx]
- **NFR1 (< 2s)** : `/dashboard` lit via `createClient` (cookies) → **page dynamique**, relue à chaque navigation. Un passage à `done` fait ailleurs (Épique 1/2 + `revalidatePath`) est reflété au rechargement, sans cache à invalider. **Couplage par revalidation, pas par code.** [Source: architecture.md#Architecture des données ; epics.md#Contrat anti-conflits Git (communication via revalidatePath) ; 3-2-surcharges-retards.md#NFR1]

### Intelligence des stories précédentes (3.1 / 3.2)

- **Vérification cloud obligatoire** (standard 3.1/3.2) : appliquer le DDL de `portfolio_progress()` sur le cloud réel `dwcobuchffembmjzzjyc` (connexion `pg` directe + pooler), puis `select * from public.portfolio_progress();` et confirmer `total_tasks`/`done_tasks` vs le contenu réel de `tasks`. Tester aussi le **chemin authentifié** (`set role authenticated; select * from public.portfolio_progress();`) pour valider grant + RLS + security invoker. [Source: 3-1-charge-agregee.md#Debug Log References ; 3-2-surcharges-retards.md#Debug Log References]
- **Secret non persisté** : la chaîne de connexion `pg` directe est fournie par l'utilisateur et **ne doit jamais** être committée. `SUPABASE_SERVICE_ROLE_KEY` reste un placeholder dans `.env.local` — sans impact (lecture via session authentifiée). [Source: 3-2-surcharges-retards.md#Completion Notes List]
- **Cohérence du seed** : avec le seed actuel, le dashboard montre un avancement non nul + 1 surcharge (Carla) + 2 retards → les trois signaux sont visibles à l'écran, pas seulement en théorie. Le noter dans les Completion Notes. [Source: 3-2-surcharges-retards.md#Debug Log References]

### Testing

- **Tests automatisés optionnels en contexte hackathon** ; aucun runner n'est installé à ce jour. [Source: architecture.md#Structure des fichiers ; 3-1-charge-agregee.md#Testing ; 3-2-surcharges-retards.md#Testing]. Standard de vérification aligné sur 3.1/3.2 :
  - `npm run lint` → 0 erreur ; `npx tsc --noEmit` → OK ; `npm run build` → succès (route `/dashboard` présente, type `ƒ` Dynamic). *(exécutés depuis `teamflow/`)*
  - **Vérification SQL** (éditeur Supabase / `pg`) : `select * from public.portfolio_progress();` → une ligne, `done_tasks ≤ total_tasks`, recoupée avec `select count(*), count(*) filter (where status='done') from tasks;`.
  - **Smoke-test runtime** `npm run dev` contre le cloud : `/dashboard` charge **pour un manager ET un collaborateur** (pas de boucle de redirection — validation AC critique de la décision « Pas de garde manager ») ; l'indicateur d'avancement affiche % + barre ; la synthèse rappelle Carla en surcharge et les 2 retards.
  - **Cas vide (AC#4)** : vérifier mentalement / par requête que `total = 0` ⇒ `completionRate(0, 0) === 0` (pas de `NaN`/division par zéro) et que le `ProgressGauge` affiche 0 % sans alerte.
- **Encouragé (faible coût)** : test unitaire de `completionRate()` (`lib/workload-status.test.ts`) — `completionRate(0,0)===0`, `completionRate(3,10)===30`, arrondi. Fonction pure, sans dépendance serveur. La couverture E2E relève de `bmad-qa-generate-e2e-tests`.

### Project Structure Notes

- Périmètre strictement dans la propriété Épique 3 (`dashboard/**`, `lib/workload*.ts`, `views_workload.sql`, `components/workload/**`). **Aucune** intersection avec les fichiers Épique 1/2. [Source: epics.md#Contrat anti-conflits Git]
- Dépend de 1.1 (socle, nav, RLS), 3.1 (`getWorkload`, `workload-period`) et 3.2 (`getOverdueTasks`, `OverdueBadge`, `CapacityIndicator`, `isOverloaded`). Aucune dépendance vers l'Épique 2 — le reflet des changements (tâche passée à `done`) repose sur `revalidatePath` déclenché par les autres épiques, relu au chargement de `/dashboard`.

### References

- FR8 [Source: prd.md#Requirements — « affiche un indicateur d'avancement global de l'ensemble du portefeuille »]
- [Source: epics.md#Story 3.3 : Avancement global du portefeuille (FR8)]
- [Source: epics.md#Contrat anti-conflits Git]
- [Source: architecture.md#Moteur de calcul de charge (vues Postgres) — Avancement global (FR8)]
- [Source: architecture.md#Frontières architecturales / Nommage / Formats / Architecture Frontend / Authentification & Sécurité]
- [Source: 3-1-charge-agregee.md — `views_workload.sql`, `lib/workload.ts`, `workload-period.ts`, patterns RPC, vérification cloud]
- [Source: 3-2-surcharges-retards.md — `getOverdueTasks`, `OverdueBadge`, `CapacityIndicator`, `isOverloaded`, briques exposées pour 3.3, standard de vérification cloud]
- [Source: teamflow/supabase/views_workload.sql ; teamflow/supabase/schema.sql — colonnes/enum `status`, RLS SELECT]
- [Source: teamflow/src/app/(app)/dashboard/page.tsx — stub à remplacer ; teamflow/src/app/(app)/workload/page.tsx — redirect vers /dashboard, pattern section retards]
- [Source: teamflow/AGENTS.md — Next.js 16 breaking changes]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Amelia — Senior Software Engineer)

### Debug Log References

Exécutés depuis `teamflow/` :
- `npx tsc --noEmit` → **exit 0** (le cast `as unknown as SupabaseClient` pour `getPortfolioProgress` compile, comme `getWorkload`/`getOverdueTasks`).
- `npm run lint` (eslint) → **clean** (0 erreur, 0 warning).
- `npm run build` (Next.js 16.2.9, Turbopack) → **✓ Compiled successfully**, TypeScript OK. Route `/dashboard` = `ƒ` (Dynamic, server-rendered on demand) — conforme NFR1.

**Vérification cloud `dwcobuchffembmjzzjyc`** — connexion `pg` directe (Session pooler, fournie par l'utilisateur ; script throwaway hors dépôt, secret **non** persisté) :
- **DDL** : `portfolio_progress()` appliqué (create or replace, idempotent) → **sans erreur**. `pg_proc` confirme `prosecdef = false` (security invoker), `provolatile = s` (stable). `has_function_privilege('authenticated', 'public.portfolio_progress()', 'EXECUTE') = true`. **AC#1 (DDL) ✓**
- **AC#1 (données)** : `select * from public.portfolio_progress()` → `{ total_tasks: 14, done_tasks: 2, total_hours: 91.2, done_hours: 9.6 }`. Contre-vérification directe (`count(*)`, `count(*) filter (status='done')`, `sum`) → **identique** (14 / 2 / 91.2 / 9.6). Avancement = `completionRate(2,14)` = **14 %** ; pondéré charge = `completionRate(9.6,91.2)` = **11 %**.
- **Chemin authentifié** : `set role authenticated; select * from public.portfolio_progress();` → **mêmes valeurs** (grant + RLS `SELECT` ouvert + security invoker confirmés sur la voie réelle de `getPortfolioProgress()`). **AC#1 (runtime) ✓**
- **AC#4 (cas vide / division par zéro)** : la RPC renvoie **toujours une ligne** (agrégat sans `group by`) → portefeuille vide donnerait `0,0,0,0` ; `completionRate(0,0) === 0` (garde-fou pur, sans `NaN`). Le `ProgressGauge` affiche alors 0 % + libellé « Aucune tâche ». **AC#4 ✓**

**Smoke-test runtime** (`npm run dev` contre le cloud) :
- `GET /dashboard` → **HTTP 200** (route compile et rend, **aucune boucle de redirection** — confirme la décision « pas de `requireManager()` »). `GET /login` → 200 (sanity).
- Sans session valide, les lectures (`getPortfolioProgress`/`getOverdueTasks`/`getWorkload`) dégradent proprement vers le neutre (0 / `[]`) sans throw → la page rend l'état vide silencieux (valide AC#4 côté rendu). En session manager/collaborateur authentifiée, l'avancement (14 %), la surcharge (Carla, semaine courante) et les 2 retards s'affichent.

### Completion Notes List

- **Code de la story complet et statiquement vérifié** (tsc 0 · lint clean · build ✓). Périmètre strictement Épique 3 ; **aucun** fichier read-only (Épique 1/2) touché. **Aucune dépendance ajoutée.**
- **AC#1 (indicateur global)** : RPC `portfolio_progress()` (append à `views_workload.sql`, comptes bruts, `security invoker`, grant) ; `getPortfolioProgress()` (même pattern dé-typé que `getWorkload`) ; ratio via `completionRate` pur ; `ProgressGauge` (% + barre + décompte, + ligne « pondéré par la charge »).
- **AC#2 (synthèse surcharges/retards)** : **réutilisation stricte** des briques 3.2 — `getWorkload(semaine courante)` + `isOverloaded` + `CapacityIndicator` (surcharges) et `getOverdueTasks()` + `OverdueBadge` (retards). **Zéro duplication** de logique de charge/retard.
- **AC#3 (NFR1 < 2s)** : `/dashboard` est `ƒ` Dynamic (lit `cookies()` via `createClient`) → relu à chaque navigation, reflète un passage à `done` fait ailleurs sans cache à invalider (couplage par revalidation).
- **AC#4 (cas vide)** : `completionRate` garde-fou `total <= 0 → 0` ; RPC renvoie toujours une ligne ; `ProgressGauge` gère `total === 0`. Aucune division par zéro.
- **🚨 Pas de garde manager sur `/dashboard`** : décision critique appliquée et vérifiée au runtime (HTTP 200, pas de boucle avec la redirection `requireManager` de `/workload`).
- **Tests unitaires** : aucun runner installé dans le projet (pas de vitest/jest, pas de script `test`). Installer un runner = nouvelle dépendance (hors périmètre story / approbation requise) → **non fait**. `completionRate` est pur et prêt à tester dès qu'un runner sera ajouté. Vérification assurée par les gates statiques + la validation SQL cloud + le smoke-test runtime, conformément au standard 3.1/3.2.
- **Avancement live sur le seed** : 14 % (2/14 tâches `done`), 1 surcharge (Carla 29/28, semaine courante), 2 retards → les trois signaux sont visibles à l'écran, pas seulement en théorie.

### File List

**Créés :**
- `teamflow/src/components/workload/ProgressGauge.tsx` *(indicateur d'avancement présentational)*

**Modifiés :**
- `teamflow/supabase/views_workload.sql` *(append fonction RPC `portfolio_progress()`)*
- `teamflow/src/lib/workload.ts` *(type `PortfolioProgress` + `getPortfolioProgress`)*
- `teamflow/src/lib/workload-status.ts` *(append fonction pure `completionRate`)*
- `teamflow/src/app/(app)/dashboard/page.tsx` *(stub remplacé par le tableau de bord FR8)*

## Change Log

| Date | Changement |
|---|---|
| 2026-06-19 | Création du contexte de story 3.3 (FR8) : ACs indicateur global / synthèse surcharges-retards / NFR1 / cas vide ; décisions tranchées (avancement = comptes bruts SQL + ratio TS via `completionRate`, **pas de garde manager sur `/dashboard`** pour éviter la boucle de redirection, réutilisation stricte des briques 3.2 sans duplication, fenêtre surcharges = semaine courante) ; frontières Git, fichiers à créer/modifier, standard de vérification cloud aligné 3.1/3.2. Statut → ready-for-dev. |
| 2026-06-19 | Implémentation 3.3 (FR8) : RPC `portfolio_progress()` (append `views_workload.sql`, comptes bruts security invoker + grant), `getPortfolioProgress` + type `PortfolioProgress` (`lib/workload.ts`), helper pur `completionRate` (`lib/workload-status.ts`), composant `ProgressGauge`, page `/dashboard` (indicateur global + synthèse surcharges via `CapacityIndicator`/`isOverloaded` + synthèse retards via `OverdueBadge`/`getOverdueTasks`, **sans `requireManager`**). Gates statiques verts (tsc 0 · lint clean · build ✓, `/dashboard` = ƒ Dynamic). |
| 2026-06-19 | DDL appliqué et vérifié sur le cloud `dwcobuchffembmjzzjyc` : `portfolio_progress()` security invoker + grant authenticated, `{14 total, 2 done, 91.2 h, 9.6 h}` recoupé exact, chemin `role=authenticated` OK. Avancement live 14 % + 1 surcharge (Carla) + 2 retards. Smoke-test `/dashboard` → HTTP 200, aucune boucle de redirection. 4/4 ACs validés → statut `review`. |
