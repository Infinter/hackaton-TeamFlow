---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
project_name: 'TeamFlow'
user_name: 'Solo'
date: '2026-06-19'
mode: 'hackathon'
team_size: 3
---

# TeamFlow - Découpage en Épiques

## Vue d'ensemble

Ce document décompose les exigences du PRD et de l'Architecture de **TeamFlow** en épiques et user stories implémentables.

**Contexte hackathon — 3 développeurs en parallèle :** le découpage vise une répartition **1 épique = 1 développeur**, avec un minimum de conflits Git. Une story de fondation partagée (Story 1.1) doit être réalisée et fusionnée en tout premier ; les trois épiques deviennent ensuite parallélisables. Les frontières de fichiers définies dans l'Architecture (`tasks/`, `board/`, `workload/` + `dashboard/`) servent de lignes de partage pour éviter que deux développeurs ne touchent les mêmes fichiers.

## Inventaire des Exigences

### Exigences Fonctionnelles

- **FR1** : Créer une tâche avec titre, description, priorité, estimation de charge (heures/jours) et échéance.
- **FR2** : Consulter le portefeuille complet des tâches avec filtres (statut, assigné, priorité, échéance).
- **FR3** : Le manager affecte une tâche à un collaborateur, et réaffecte une tâche existante.
- **FR4** : Planifier une tâche (date de début + échéance).
- **FR5** : Le collaborateur met à jour le statut (À faire / En cours / Terminé) et consigne sa progression.
- **FR6** : Calculer et afficher la charge agrégée par collaborateur sur une période donnée.
- **FR7** : Mettre en évidence les surcharges (charge > capacité) et les tâches en retard (échéance dépassée, non terminées).
- **FR8** : Afficher un indicateur d'avancement global du portefeuille.
- **FR9** : Ajuster affectations/planification par interaction simple (glisser-déposer) avec impact immédiat sur la charge.
- **FR10** : Distinguer deux rôles, Collaborateur et Manager, avec permissions différenciées.

### Exigences Non Fonctionnelles

- **NFR1** : Les vues de charge/avancement reflètent les changements en moins de 2 secondes.
- **NFR2** : Interface utilisable sans formation préalable pour les actions clés.
- **NFR3** : Lisible et fonctionnel jusqu'à 50 collaborateurs et plusieurs centaines de tâches actives.
- **NFR4** : Persistance fiable et cohérente des données.
- **NFR5** : Contrôle d'accès basé sur les rôles (RBAC).

### Exigences Additionnelles (Architecture)

- **AR1 — Starter / Init (⇒ Story 1.1)** : Initialisation via `create-next-app` (TypeScript, Tailwind, App Router, src-dir) + dépendances `@supabase/supabase-js`, `@supabase/ssr`, `@dnd-kit/*`, init `shadcn/ui`, création du projet Supabase et `.env.local`.
- **AR2 — Schéma de données** : 3 tables Postgres (`profiles`, `tasks`, `task_history`) avec enums, FK, NOT NULL ; types TS générés (`supabase gen types`).
- **AR3 — RBAC / RLS** : politiques Row-Level Security (lecture pour tout authentifié ; INSERT/affectation/planification réservés aux managers ; UPDATE statut par l'assigné ou un manager). Double barrière : `requireManager()` côté Server Action.
- **AR4 — Pattern Server Actions** : toute mutation passe par une Server Action retournant `{ ok: true; data } | { ok: false; error }` ; jamais de throw vers l'UI ; `revalidatePath` après mutation.
- **AR5 — Journalisation `task_history`** : un helper unique `logTaskEvent(taskId, eventType, {old, new, note})` appelé par CHAQUE Server Action de mutation.
- **AR6 — Moteur de charge (vues SQL)** : charge par collaborateur, surcharge, retard, avancement global exposés en vues Postgres / fonctions RPC.
- **AR7 — Glisser-déposer** : `@dnd-kit` + `useOptimistic` (réconcilié serveur, NFR1).
- **AR8 — État via URL** : filtres du portefeuille portés par les query params, pas de state global.
- **AR9 — Conventions de nommage** : `snake_case` DB ↔ types générés (pas de mapping) ; `camelCase`/`PascalCase` côté code ; pas de routes REST custom.
- **AR10 — Frontières de fichiers** : seul `src/lib/supabase/*` instancie un client ; les Client Components ne lisent jamais la DB directement.

### Exigences UX

_Aucun document UX dédié. NFR2 est porté par les composants standards shadcn/ui et la qualité d'exécution._

### Carte de couverture des exigences

| Exigence | Épique | Couverture |
|---|---|---|
| FR1 (créer tâche) | Épique 1 | `tasks/new` + `createTask` |
| FR2 (portefeuille + filtres) | Épique 1 | `tasks/page` + `TaskFilters` (filtres URL) |
| FR5 (statut + progression) | Épique 1 | `updateStatus` + `TaskTimeline` |
| FR10 (rôles / RBAC) | Épique 1 | Supabase Auth + RLS + `requireManager()` |
| FR3 (affectation / réaffectation) | Épique 2 | `assignTask` / `reassignTask` |
| FR4 (planification) | Épique 2 | `planTask` (dates) |
| FR9 (glisser-déposer) | Épique 2 | `TaskBoard` (@dnd-kit + `useOptimistic`) |
| FR6 (charge agrégée) | Épique 3 | vue SQL + `workload/page` |
| FR7 (surcharge / retard) | Épique 3 | vues SQL + `OverloadFlag` |
| FR8 (avancement global) | Épique 3 | vue SQL + `dashboard/page` |
| NFR1 (< 2s) | Épiques 2 & 3 | `useOptimistic` + `revalidatePath` + vues légères |
| NFR2 (sans formation) | Toutes | composants shadcn/ui standards |
| NFR3 (≤ 50 users) | Épique 3 | volumes triviaux pour Postgres |
| NFR4 (persistance) | Épique 1 | schéma Postgres + contraintes |
| NFR5 (RBAC) | Épique 1 | RLS + double barrière Server Action |

## Liste des Épiques

> **Règle de parallélisation (hackathon, 3 devs).** La **Story 1.1** (init projet + schéma + auth + types + nav + helper d'historique + seed) est le **socle partagé** : un seul dev la réalise et la **fusionne en premier** (~ 1ʳᵉ heure). Une fois mergée, les 3 épiques se développent en parallèle sur des **répertoires disjoints**. Voir le **Contrat anti-conflits Git** en fin de document.

### Épique 1 : Fondations & Portefeuille de tâches — _Dev A_
Une équipe authentifiée peut **créer, consulter (avec filtres) et faire avancer** ses tâches, chaque modification étant tracée. Pose le socle technique (projet, schéma, auth, RBAC, journalisation) dont dépendent les deux autres épiques.
**FRs couvertes :** FR1, FR2, FR5, FR10 · **NFR :** NFR4, NFR5 · **AR :** AR1, AR2, AR3, AR4, AR5, AR8, AR9, AR10
**Périmètre fichiers :** init projet, `supabase/schema.sql` + `seed.sql`, `src/lib/{supabase,auth,history,types}`, `src/app/login`, `src/app/(app)/layout.tsx` (nav complète), `src/app/(app)/tasks/**`, `src/components/{tasks,history}`.

### Épique 2 : Affectation & Planification (manager) — _Dev B_
Le manager **affecte/réaffecte** les tâches et les **planifie** (dates), y compris par **glisser-déposer** avec impact immédiat. Autonome dès que le socle (1.1) est en place.
**FRs couvertes :** FR3, FR4, FR9 · **NFR :** NFR1 · **AR :** AR7
**Périmètre fichiers :** `src/app/(app)/board/**`, `src/components/board/**`, `src/app/(app)/tasks/assignment-actions.ts` (fichier dédié, pour ne PAS toucher au `tasks/actions.ts` de l'Épique 1).

### Épique 3 : Pilotage de la charge & avancement — _Dev C_
Le manager **visualise la charge par collaborateur**, repère **surcharges et retards**, et suit l'**avancement global** du portefeuille. Autonome dès que le socle (1.1) est en place.
**FRs couvertes :** FR6, FR7, FR8 · **NFR :** NFR1, NFR3 · **AR :** AR6
**Périmètre fichiers :** `supabase/views_workload.sql` (fichier SQL dédié), `src/lib/workload.ts`, `src/app/(app)/workload/**`, `src/app/(app)/dashboard/**`, `src/components/workload/**`.

---

## Épique 1 : Fondations & Portefeuille de tâches

Une équipe authentifiée peut créer, consulter (avec filtres) et faire avancer ses tâches, chaque modification étant tracée. Cette épique pose le socle (projet, schéma, auth, RBAC, journalisation) dont dépendent les épiques 2 et 3.

### Story 1.1 : Socle technique partagé (init, schéma, session, navigation)

En tant qu'**équipe de développement**,
je veux **un projet Next.js initialisé, connecté à Supabase avec le schéma de données, la session et la navigation en place**,
afin que **chacun puisse développer sa fonctionnalité sur une base commune sans la reconstruire**.

> 🔑 **Story socle — à réaliser et fusionner EN PREMIER.** Une fois mergée, les épiques 1 (suite), 2 et 3 démarrent en parallèle.

**Critères d'acceptation :**

**Étant donné** un poste de développement propre
**Quand** on exécute la commande d'init de l'Architecture (`create-next-app` TypeScript + Tailwind + App Router + src-dir, puis `@supabase/supabase-js`, `@supabase/ssr`, `@dnd-kit/*`, `shadcn init`)
**Alors** le projet démarre en `npm run dev` sans erreur
**Et** `.env.example` documente `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Étant donné** le projet Supabase créé
**Quand** on exécute `supabase/schema.sql`
**Alors** les 3 tables `profiles`, `tasks`, `task_history` existent avec leurs enums (`role`, `priority`, `status`, `event_type`), contraintes NOT NULL et clés étrangères
**Et** les politiques RLS de base sont activées (SELECT `tasks`/`task_history` pour tout utilisateur authentifié)
**Et** `supabase/seed.sql` insère des données de démo (≥ 1 manager, ≥ 3 collaborateurs, ≥ 10 tâches réparties).

**Étant donné** le schéma en place
**Quand** on génère les types (`supabase gen types`)
**Alors** `src/lib/types.ts` contient les types `snake_case` consommés directement (aucune couche de mapping).

**Étant donné** un utilisateur non authentifié
**Quand** il accède à une route du groupe `(app)`
**Alors** le `middleware.ts` rafraîchit la session et le redirige vers `/login`.

**Étant donné** les clients Supabase
**Quand** un Server Component ou une Server Action accède aux données
**Alors** il importe exclusivement `src/lib/supabase/{server,client}.ts` (frontière de données AR10).

**Étant donné** le layout `(app)`
**Quand** un utilisateur authentifié est connecté
**Alors** une navigation complète est rendue avec les entrées **Dashboard, Tâches, Tableau, Charge** (les routes cibles peuvent être des pages vides à ce stade — elles seront remplies par chaque épique).

**Étant donné** un helper de journalisation unique `logTaskEvent(taskId, eventType, {old, new, note})`
**Quand** il est défini dans `src/lib/history.ts`
**Alors** il insère une ligne dans `task_history` et est importable par toutes les Server Actions.

### Story 1.2 : Authentification & rôles (FR10, NFR5)

En tant qu'**utilisateur (manager ou collaborateur)**,
je veux **me connecter et être reconnu selon mon rôle**,
afin d'**accéder uniquement aux actions autorisées pour mon rôle**.

**Critères d'acceptation :**

**Étant donné** un compte existant
**Quand** je saisis mes identifiants sur `/login` et valide
**Alors** la Server Action `signIn` m'authentifie via Supabase Auth et me redirige vers `/dashboard`
**Et** un bouton de déconnexion (`signOut`) est disponible dans la navigation.

**Étant donné** un utilisateur authentifié
**Quand** une page serveur appelle `getCurrentProfile()` (`src/lib/auth.ts`)
**Alors** elle obtient son `profile` incluant `role` et `weekly_capacity_hours`.

**Étant donné** un collaborateur (rôle `collaborator`)
**Quand** la navigation est rendue
**Alors** les entrées réservées au manager (ex. création/affectation) sont masquées ou désactivées selon le rôle.

**Étant donné** une Server Action sensible
**Quand** `requireManager()` est appelé et que l'utilisateur n'est pas manager
**Alors** l'action retourne `{ ok: false, error }` sans effectuer de mutation (double barrière avec la RLS).

### Story 1.3 : Création d'une tâche (FR1)

En tant que **manager**,
je veux **créer une tâche avec ses attributs**,
afin d'**alimenter le portefeuille de travail de l'équipe**.

**Critères d'acceptation :**

**Étant donné** un manager sur `/tasks/new`
**Quand** il renseigne titre, description, priorité (`low|medium|high`), estimation de charge (heures) et échéance, puis valide
**Alors** `createTask` insère la tâche (statut initial `todo`) et retourne `{ ok: true, data }`
**Et** `logTaskEvent(..., 'created', ...)` enregistre l'événement
**Et** une redirection/`revalidatePath` rafraîchit le portefeuille.

**Étant donné** un formulaire incomplet (titre vide ou estimation non numérique)
**Quand** le manager valide
**Alors** l'action retourne `{ ok: false, error }` et l'UI affiche le message via toast, sans créer de tâche.

**Étant donné** un collaborateur
**Quand** il tente d'accéder à la création
**Alors** l'action est refusée (`requireManager()`) et l'entrée n'est pas proposée dans l'UI.

### Story 1.4 : Portefeuille filtrable (FR2)

En tant qu'**utilisateur**,
je veux **consulter toutes les tâches et les filtrer**,
afin de **retrouver rapidement le travail qui m'intéresse**.

**Critères d'acceptation :**

**Étant donné** des tâches en base
**Quand** j'ouvre `/tasks`
**Alors** la liste complète s'affiche (titre, assigné, priorité, statut, échéance) avec un `StatusBadge` lisible.

**Étant donné** la barre de filtres `TaskFilters`
**Quand** je filtre par statut, assigné, priorité ou échéance
**Alors** l'état du filtre est porté par les paramètres d'URL (`?status=&assignee=&priority=`) et la liste se met à jour (AR8)
**Et** l'URL est partageable et restaure les filtres au rechargement.

**Étant donné** aucun résultat pour un filtre
**Quand** la liste est vide
**Alors** un état vide explicite est affiché (pas d'erreur).

### Story 1.5 : Suivi du statut & progression (FR5)

En tant que **collaborateur**,
je veux **mettre à jour le statut de mes tâches et y consigner ma progression**,
afin de **rendre mon avancement visible et tracé**.

**Critères d'acceptation :**

**Étant donné** une tâche qui m'est assignée sur `/tasks/[id]`
**Quand** je change son statut (`todo → in_progress → done`)
**Alors** `updateStatus` persiste le nouveau statut et retourne `{ ok: true }`
**Et** `logTaskEvent(..., 'status_changed', {old, new})` est enregistré.

**Étant donné** une tâche qui m'est assignée
**Quand** j'ajoute une note de progression
**Alors** `logTaskEvent(..., 'progress_note', {note})` l'enregistre.

**Étant donné** la page détail d'une tâche
**Quand** elle s'affiche
**Alors** `TaskTimeline` présente l'historique chronologique (`task_history`) : création, changements de statut, notes.

**Étant donné** une tâche qui ne m'est pas assignée (et que je ne suis pas manager)
**Quand** je tente d'en changer le statut
**Alors** la mutation est refusée par la RLS et la revérification côté action.

---

## Épique 2 : Affectation & Planification (manager)

Le manager affecte/réaffecte les tâches et les planifie, y compris par glisser-déposer avec impact immédiat. Autonome dès que la Story 1.1 est fusionnée.

### Story 2.1 : Affecter et réaffecter une tâche (FR3)

En tant que **manager**,
je veux **affecter une tâche à un collaborateur ou la réaffecter à un autre**,
afin de **répartir le travail de façon claire et traçable**.

**Critères d'acceptation :**

**Étant donné** une tâche non assignée et un manager
**Quand** il sélectionne un collaborateur comme assigné
**Alors** `assignTask` (dans `tasks/assignment-actions.ts`) met à jour `assignee_id`, retourne `{ ok: true }`
**Et** `logTaskEvent(..., 'reassigned', {old: null, new: assignee})` est enregistré
**Et** `revalidatePath` rafraîchit les vues concernées.

**Étant donné** une tâche déjà assignée
**Quand** le manager la réaffecte à un autre collaborateur
**Alors** l'ancien et le nouvel assigné sont consignés dans `task_history` (`old → new`).

**Étant donné** un collaborateur
**Quand** il tente d'affecter une tâche
**Alors** l'action est refusée (`requireManager()` + RLS) et l'UI ne propose pas l'action.

### Story 2.2 : Planifier une tâche (FR4)

En tant que **manager**,
je veux **attribuer une date de début et une échéance à une tâche**,
afin de **cadrer quand le travail doit être réalisé**.

**Critères d'acceptation :**

**Étant donné** une tâche et un manager
**Quand** il renseigne `start_date` et `due_date` et valide
**Alors** `planTask` (dans `tasks/assignment-actions.ts`) persiste les dates et retourne `{ ok: true }`
**Et** `logTaskEvent(..., 'planned', {new: dates})` est enregistré.

**Étant donné** une échéance antérieure à la date de début
**Quand** le manager valide
**Alors** l'action retourne `{ ok: false, error }` et aucune date n'est enregistrée.

**Étant donné** des dates échangées au format ISO 8601
**Quand** elles sont affichées
**Alors** elles le sont via `Intl.DateTimeFormat('fr-FR')`.

### Story 2.3 : Tableau d'affectation par glisser-déposer (FR9, NFR1)

En tant que **manager**,
je veux **réaffecter les tâches par glisser-déposer sur un tableau**,
afin d'**ajuster la répartition rapidement et voir l'impact immédiat**.

> Dépend de la Story 2.1 (`reassignTask`) — même épique, ordre respecté.

**Critères d'acceptation :**

**Étant donné** le tableau `/board` avec une colonne par collaborateur
**Quand** la page se charge
**Alors** `TaskBoard` (@dnd-kit) affiche les tâches dans la colonne de leur assigné.

**Étant donné** une tâche glissée vers la colonne d'un autre collaborateur
**Quand** je la dépose
**Alors** l'interface met à jour l'affichage immédiatement via `useOptimistic`
**Et** `reassignTask` (`board/actions.ts`) persiste la réaffectation et journalise l'événement
**Et** le changement est reflété en moins de 2 secondes (NFR1), réconcilié par le serveur.

**Étant donné** un échec de la réaffectation côté serveur
**Quand** l'action retourne `{ ok: false }`
**Alors** l'affichage optimiste est annulé (retour à l'état précédent) et un toast d'erreur s'affiche.

**Étant donné** un collaborateur
**Quand** il ouvre `/board`
**Alors** le glisser-déposer de réaffectation est désactivé (lecture seule) conformément au RBAC.

---

## Épique 3 : Pilotage de la charge & avancement

Le manager visualise la charge par collaborateur, repère surcharges et retards, et suit l'avancement global. Autonome dès que la Story 1.1 est fusionnée (s'appuie sur les données de seed).

### Story 3.1 : Charge agrégée par collaborateur (FR6)

En tant que **manager**,
je veux **voir la charge de travail agrégée de chaque collaborateur sur une période**,
afin de **comprendre comment le travail est réparti**.

**Critères d'acceptation :**

**Étant donné** le fichier `supabase/views_workload.sql`
**Quand** il est exécuté dans Supabase
**Alors** une vue de charge expose `SUM(estimated_load_hours)` des tâches non `done` chevauchant la période, regroupée par `assignee_id`.

**Étant donné** la page `/workload`
**Quand** un manager l'ouvre et choisit une période
**Alors** `lib/workload.ts` lit la vue et `WorkloadBar` affiche la charge par collaborateur (heures cumulées vs `weekly_capacity_hours`).

**Étant donné** un collaborateur sans tâche active sur la période
**Quand** la page s'affiche
**Alors** sa charge apparaît à 0 (et non absente).

### Story 3.2 : Surcharges & retards (FR7)

En tant que **manager**,
je veux **repérer visuellement les collaborateurs en surcharge et les tâches en retard**,
afin de **réagir avant que la situation ne dégénère**.

**Critères d'acceptation :**

**Étant donné** les vues de charge
**Quand** la charge agrégée d'un collaborateur dépasse sa `weekly_capacity_hours`
**Alors** `OverloadFlag` / `CapacityIndicator` met sa barre en évidence (signal de surcharge).

**Étant donné** une tâche dont `due_date < now()` et `status <> 'done'`
**Quand** elle est affichée (portefeuille et/ou tableau de bord)
**Alors** elle est marquée « en retard » visuellement.

**Étant donné** aucune surcharge ni retard
**Quand** la vue s'affiche
**Alors** aucun signal d'alerte n'est présent (état sain lisible).

### Story 3.3 : Avancement global du portefeuille (FR8)

En tant que **manager**,
je veux **un indicateur d'avancement global du portefeuille**,
afin de **suivre la progression d'ensemble d'un coup d'œil**.

**Critères d'acceptation :**

**Étant donné** une vue d'avancement (ratio des tâches `done` sur le total)
**Quand** le manager ouvre `/dashboard`
**Alors** un indicateur d'avancement global est affiché (pourcentage et/ou barre)
**Et** une synthèse des surcharges et retards (Story 3.2) y est rappelée.

**Étant donné** une tâche passée à `done` ailleurs dans l'application
**Quand** le tableau de bord est rechargé (après `revalidatePath`)
**Alors** l'indicateur d'avancement reflète le nouvel état en moins de 2 secondes (NFR1).

**Étant donné** un portefeuille vide
**Quand** le tableau de bord s'affiche
**Alors** l'indicateur gère le cas (0 tâche) sans division par zéro.

---

## Contrat anti-conflits Git (3 développeurs)

**Principe :** chaque développeur possède un ensemble de répertoires **disjoints**. Les rares fichiers partagés sont figés par la Story 1.1.

| Zone | Propriétaire | Règle pour les autres |
|---|---|---|
| `supabase/schema.sql`, `seed.sql` | Épique 1 (Story 1.1) | Ne pas modifier. L'Épique 3 ajoute ses vues dans `supabase/views_workload.sql` (fichier séparé). L'Épique 2 ne nécessite aucun changement de schéma. |
| `src/lib/types.ts` (généré) | Épique 1 | Lecture seule. |
| `src/lib/{supabase,auth,history}` | Épique 1 | Lecture seule (helpers stables après 1.1). |
| `src/app/(app)/layout.tsx` (nav) | Épique 1 | Nav complète livrée en 1.1 ; les autres ne créent QUE leurs routes, pas la nav. |
| `src/app/(app)/tasks/actions.ts` | Épique 1 | L'Épique 2 met `assignTask`/`planTask` dans `tasks/assignment-actions.ts` (fichier dédié). |
| `src/app/(app)/board/**`, `src/components/board/**` | Épique 2 | — |
| `src/app/(app)/{workload,dashboard}/**`, `src/lib/workload.ts`, `src/components/workload/**` | Épique 3 | — |

**Séquencement :**
1. **Story 1.1 d'abord**, fusionnée sur `main` (un dev, ~1ʳᵉ heure).
2. Chaque dev part d'une branche par épique (`feat/epic-1-tasks`, `feat/epic-2-board`, `feat/epic-3-workload`).
3. Les 3 épiques avancent en parallèle ; les frontières de fichiers ci-dessus garantissent des merges quasi sans conflit.
4. Communication via `revalidatePath` (pas de couplage de code) : la réaffectation (Épique 2) et les vues de charge (Épique 3) restent indépendantes.
