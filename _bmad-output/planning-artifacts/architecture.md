---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
workflowType: 'architecture'
project_name: 'TeamFlow'
user_name: 'Solo'
date: '2026-06-19'
mode: 'hackathon'
lastStep: 8
status: 'complete'
completedAt: '2026-06-19'
---

# Architecture Decision Document — TeamFlow

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Analyse du Contexte Projet

### Vue d'ensemble des exigences

**Exigences fonctionnelles (10) :**
Application centrée sur la gestion CRUD d'un portefeuille de tâches (FR1, FR2),
avec affectation/réaffectation par le manager (FR3, FR9), planification par dates
(FR4), et suivi de statut par le collaborateur (FR5). Le cœur différenciant est le
**moteur de calcul de charge** : agrégation de la charge par collaborateur sur une
période (FR6), mise en évidence des surcharges et des retards (FR7), et indicateur
d'avancement global (FR8). Deux rôles distincts avec permissions différenciées (FR10).

**Exigences non fonctionnelles (5) :**
- NFR1 (< 2s pour refléter les changements de charge) → rafraîchissement requête/réponse
  ou mise à jour optimiste suffisent. **Pas de temps réel / WebSockets nécessaires.**
- NFR2 (utilisable sans formation) → patterns d'UI standards.
- NFR3 (≤ 50 collaborateurs, plusieurs centaines de tâches) → volume de données faible,
  aucune contrainte de montée en charge.
- NFR4 (persistance fiable et cohérente) → base de données relationnelle.
- NFR5 (contrôle d'accès basé sur les rôles) → autorisation Manager vs Collaborateur.

**Échelle & complexité :**
- Domaine principal : application web full-stack (mono-organisation / single-tenant).
- Niveau de complexité : faible à moyen.
- Composants architecturaux estimés : ~5 (UI, API, moteur de charge, persistance, auth).

### Contraintes techniques & dépendances

- Contexte hackathon : priorité absolue à un produit fonctionnel et rapide à construire.
- Stack « ennuyeuse » et bien supportée, pièces mobiles minimales.
- Aucune exigence de conformité réglementaire identifiée.

### Préoccupations transversales identifiées

- **Autorisation (RBAC)** : appliquée sur les actions sensibles (affecter, planifier).
- **Moteur de calcul de charge** : module réutilisé par FR6, FR7, FR8 et FR9.
- **Gestion des dates / échéances** : cohérence entre planification, retards et périodes
  de calcul de charge.

## Évaluation du Starter / Stack Technique

### Domaine technologique principal

Application web full-stack — Next.js (App Router) pour l'UI et la logique serveur,
Supabase comme backend de données managé. Pièces mobiles minimales.

### Options considérées

- **Next.js + Supabase (Postgres)** ✅ retenu — backend managé (DB + Auth + RLS +
  API + dashboard). Le RBAC (FR10/NFR5) est fourni par les politiques RLS. Données
  fortement relationnelles → Postgres idéal pour l'agrégation de charge (FR6/7/8).
- Next.js + MongoDB Atlas — rejeté : auth/RBAC à construire soi-même, agrégation
  de charge en pipeline (plus de code sur la fonctionnalité clé de la démo).
- Next.js + SQLite/Prisma local — rejeté au profit de Supabase (l'utilisateur
  souhaite un backend managé ; RLS et Auth intégrés accélèrent le RBAC).

### Stack retenue

| Préoccupation | Choix | Version (juin 2026) |
|---|---|---|
| Framework | Next.js (App Router, Server Actions) | 16.2.7 |
| Langage | TypeScript | — |
| Base de données | Supabase (PostgreSQL managé) | — |
| Accès données | @supabase/supabase-js + @supabase/ssr | dernière |
| Auth / RBAC | Supabase Auth + Row-Level Security | — |
| UI | Tailwind CSS + shadcn/ui | CLI |
| Glisser-déposer | @dnd-kit | dernière |

### Commande d'initialisation (= première story d'implémentation)

```bash
npx create-next-app@latest teamflow --typescript --tailwind --app --eslint --src-dir --use-npm
cd teamflow
npm install @supabase/supabase-js @supabase/ssr @dnd-kit/core @dnd-kit/sortable
npx shadcn@latest init
# Créer un projet sur supabase.com ; renseigner SUPABASE_URL + clé anon dans .env.local ;
# définir le schéma via l'éditeur SQL Supabase ; générer les types : `supabase gen types`.
```

### Décisions architecturales fournies par ce starter

- **Langage & runtime** : TypeScript, runtime Next.js.
- **Structure du code** : `src/app` (routes + Server Actions), `src/lib` (client
  Supabase, moteur de charge), `src/components` (UI).
- **Styling** : Tailwind + composants shadcn/ui.
- **Build & dev** : serveur de dev Next.js (hot-reload), build de production intégré.
- **Persistance** : Supabase Postgres ; sécurité d'accès par politiques RLS ;
  types TypeScript générés depuis le schéma.

**Note :** l'initialisation et la création du projet Supabase doivent constituer
la première story d'implémentation.

## Décisions Architecturales Fondamentales

### Analyse de priorité des décisions

**Décisions critiques (bloquantes pour l'implémentation) :**
- Modèle de données (tables `profiles`, `tasks`, `task_history`).
- Politiques RLS pour le RBAC (FR10/NFR5).
- Moteur de calcul de charge (FR6/FR7/FR8).

**Décisions importantes (structurantes) :**
- Server Actions pour les mutations ; lecture via client Supabase en Server Components.
- Filtres du portefeuille portés par les paramètres d'URL (pas de lib de state global).
- Glisser-déposer via @dnd-kit + `useOptimistic` (NFR1).
- Historisation des événements de tâche dans `task_history` (traçabilité + FR5).

**Décisions différées (post-MVP) :**
- Notifications, temps réel Supabase (NFR1 satisfait sans).
- Pondération avancée de la charge (multi-périodes, jours ouvrés, congés).

### Architecture des données

**Modèle relationnel (PostgreSQL / Supabase) — 3 tables :**

`profiles` (extension de `auth.users`)
- `id` (uuid, FK → auth.users), `full_name` (text)
- `role` (enum : `manager` | `collaborator`)
- `weekly_capacity_hours` (numeric, défaut 35) — base de la détection de surcharge

`tasks`
- `id` (uuid), `title` (text), `description` (text)
- `priority` (enum : `low` | `medium` | `high`)
- `estimated_load_hours` (numeric) — charge estimée (FR1)
- `status` (enum : `todo` | `in_progress` | `done`)
- `start_date` (date), `due_date` (date) — planification (FR4)
- `assignee_id` (uuid, FK → profiles), `created_by` (uuid, FK → profiles)
- `created_at`, `updated_at` (timestamptz)

`task_history` (journal / traçabilité — couvre FR5 et l'objectif de traçabilité)
- `id` (uuid), `task_id` (uuid, FK → tasks), `author_id` (uuid, FK → profiles)
- `event_type` (enum : `created` | `status_changed` | `reassigned` | `planned` | `progress_note`)
- `old_value` (text), `new_value` (text) — avant/après (ex. `todo` → `in_progress`)
- `note` (text) — saisie libre de progression (FR5)
- `created_at` (timestamptz)

**Écriture de l'historique :** les Server Actions qui modifient une tâche écrivent
l'événement correspondant dans `task_history` dans la même opération.
**Validation :** contraintes Postgres (enums, NOT NULL, FK) + validation côté Server Action.
**Migrations :** schéma défini via l'éditeur SQL Supabase ; types TS générés (`supabase gen types`).

### Moteur de calcul de charge (vues Postgres)

- **Charge par collaborateur (FR6)** : `SUM(estimated_load_hours)` des tâches non `done`
  chevauchant la période sélectionnée, regroupées par `assignee_id`.
- **Surcharge (FR7)** : `charge_agrégée > weekly_capacity_hours` → indicateur visuel.
- **Retard (FR7)** : `due_date < now() AND status <> 'done'`.
- **Avancement global (FR8)** : ratio des tâches `done` sur le total (option : pondéré par heures).
- Exposé en **vues SQL** (et/ou fonctions RPC) → une requête, lisible et performante.

### Authentification & Sécurité

- **Auth :** Supabase Auth (email/mot de passe). Le rôle est porté par `profiles.role`.
- **Autorisation (RLS) :**
  - `SELECT tasks` / `SELECT task_history` : tout utilisateur authentifié (transparence d'équipe, FR2).
  - `INSERT` tâche / affectation / planification : managers uniquement.
  - `UPDATE` statut/progression : l'assigné sur sa tâche, ou un manager sur toute tâche.
  - `INSERT task_history` : via Server Action (auteur = utilisateur courant).
- **Défense en profondeur :** les Server Actions revérifient le rôle avant toute mutation.

### Patterns API & Communication

- **Mutations** : Server Actions Next.js (pas de couche REST/GraphQL à écrire).
- **Lectures** : client Supabase dans les Server Components.
- **Gestion d'erreurs** : les Server Actions renvoient un objet résultat typé
  (`{ ok, error }`) consommé par l'UI.

### Architecture Frontend

- **Server Components par défaut** ; Client Components pour l'interactif (tableau
  glisser-déposer, filtres).
- **État** : filtres (FR2) via paramètres d'URL ; pas de Redux/Zustand.
- **Glisser-déposer (FR9)** : @dnd-kit + `useOptimistic` → impact immédiat sur la charge,
  réconcilié par le serveur (NFR1 < 2s).

### Infrastructure & Déploiement

- **Hébergement** : Vercel (Next.js) + Supabase Cloud (Postgres + Auth).
- **Configuration** : variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, clé service côté serveur).
- **CI/CD** : non requis pour le hackathon (déploiement à la demande).

### Analyse d'impact des décisions

**Séquence d'implémentation :**
1. Init projet + Supabase + schéma SQL (3 tables) + RLS (story 1).
2. Auth + profils + rôles.
3. CRUD tâches + portefeuille filtrable + écriture `task_history`.
4. Affectation/planification (manager) + glisser-déposer.
5. Vues de charge, surcharge, retards, avancement global.
6. Timeline d'historique par tâche (traçabilité + progression FR5).

**Dépendances inter-composants :**
- Le moteur de charge dépend de `estimated_load_hours`, `status`, `due_date` et
  `weekly_capacity_hours` → ces champs doivent être fiables dès la story CRUD.
- Les politiques RLS dépendent de `profiles.role` → l'auth/profils précède les mutations.
- `task_history` est alimentée par toutes les Server Actions de mutation → à câbler
  dès la mise en place du CRUD pour éviter un historique lacunaire.

## Patterns d'Implémentation & Règles de Cohérence

### Points de conflit identifiés
~6 zones où des agents IA pourraient diverger : nommage DB, nommage code,
structure de fichiers, format de retour des Server Actions, gestion erreurs/chargement,
historisation. Règles ci-dessous = source de vérité unique.

### Nommage

**Base de données (conventions Postgres/Supabase) :**
- Tables : `snake_case`, au pluriel (`tasks`, `profiles`, `task_history`).
- Colonnes : `snake_case` (`estimated_load_hours`, `due_date`).
- Clés étrangères : `<entité>_id` (`assignee_id`, `task_id`).
- Enums : valeurs en `snake_case` minuscules (`in_progress`).

**Code (TypeScript/React) :**
- Composants : `PascalCase`, fichier `PascalCase.tsx` (`TaskCard.tsx`).
- Hooks/fonctions/variables : `camelCase` (`getWorkload`, `assignTask`).
- Server Actions : `camelCase` verbe+nom (`createTask`, `reassignTask`, `updateStatus`),
  regroupées dans un fichier `actions.ts` par feature.
- Types : `PascalCase` ; on réutilise les types générés par Supabase tels quels.

**Cohérence DB↔Code :** PAS de couche de mapping camelCase. On consomme les types
générés (`supabase gen types`) en `snake_case` directement, jusque dans l'UI.

### Structure des fichiers
- `src/app/...` : routes, layouts, et `actions.ts` colocalisés par feature.
- `src/lib/` : `supabase/` (clients server & browser), `workload.ts`, `types.ts` (types générés).
- `src/components/ui/` : composants shadcn ; `src/components/` : composants métier.
- Tests colocalisés `*.test.ts` (optionnels en contexte hackathon).

### Formats
- **Retour des Server Actions** : objet discriminé
  `{ ok: true; data: T } | { ok: false; error: string }`. Jamais de throw vers l'UI.
- **Dates** : stockage Postgres (`date`/`timestamptz`) ; échange en chaînes ISO 8601 ;
  affichage via `Intl.DateTimeFormat('fr-FR')`.
- **Booléens/nulls** : valeurs natives (`true`/`false`/`null`), pas de 0/1.

### Communication & État
- **Mutations** → Server Actions + `revalidatePath`/`revalidateTag` pour rafraîchir.
- **Interactions optimistes** (glisser-déposer) → `useOptimistic`, réconcilié par l'action.
- **Filtres** → paramètres d'URL (`?status=&assignee=&priority=`), source unique de l'état.
- **Historique** → un helper unique `logTaskEvent(taskId, eventType, {old, new, note})`
  appelé par chaque Server Action de mutation (garantit un journal complet).

### Gestion erreurs & chargement
- **Erreurs** : `error.tsx` par segment de route ; messages utilisateur via toasts
  (shadcn `sonner`) ; détails techniques en `console.error` côté serveur.
- **Chargement** : `loading.tsx` + Suspense pour les Server Components ; `isPending`
  (`useTransition`) pour les actions client.

### Règles impératives (tous les agents IA DOIVENT)
- Respecter `snake_case` en DB et dans les types consommés ; `camelCase`/`PascalCase` en code.
- Faire transiter toute mutation par une Server Action retournant `{ ok, error }`.
- Appeler `logTaskEvent(...)` dans toute Server Action qui modifie une tâche.
- Revérifier le rôle (`manager`) dans les actions d'affectation/planification (défense en profondeur RLS).

### Anti-patterns à éviter
- Convertir manuellement snake_case ↔ camelCase entre DB et UI.
- Écrire des routes API REST custom là où une Server Action suffit.
- Modifier une tâche sans écrire l'événement correspondant dans `task_history`.
- Stocker l'état des filtres dans un state global plutôt que dans l'URL.

## Structure du Projet & Frontières

### Arborescence complète

```
teamflow/
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── components.json                  # config shadcn/ui
├── .env.local                       # secrets (non versionné)
├── .env.example                     # gabarit des variables
├── .gitignore
├── supabase/
│   ├── schema.sql                   # enums + 3 tables + politiques RLS + vues de charge
│   └── seed.sql                     # données de démo (managers, collaborateurs, tâches)
├── src/
│   ├── middleware.ts                # refresh session Supabase + protection des routes
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx               # layout racine + Toaster (sonner)
│   │   ├── page.tsx                 # redirection vers /dashboard ou /login
│   │   ├── login/
│   │   │   ├── page.tsx             # FR10 — connexion
│   │   │   └── actions.ts           # signIn / signOut
│   │   └── (app)/                   # groupe de routes protégées
│   │       ├── layout.tsx           # garde de session + navigation par rôle
│   │       ├── dashboard/
│   │       │   └── page.tsx         # FR8 avancement global + FR7 surcharges/retards
│   │       ├── tasks/
│   │       │   ├── page.tsx         # FR2 portefeuille filtrable (filtres via URL)
│   │       │   ├── actions.ts       # FR1/FR3/FR4/FR5 create/assign/plan/updateStatus
│   │       │   ├── new/page.tsx     # FR1 création de tâche
│   │       │   └── [id]/page.tsx    # détail + timeline d'historique (FR5 / traçabilité)
│   │       ├── board/
│   │       │   ├── page.tsx         # FR9 tableau glisser-déposer (affectation)
│   │       │   └── actions.ts       # reassignTask (optimiste)
│   │       └── workload/
│   │           └── page.tsx         # FR6 charge agrégée par collaborateur
│   ├── components/
│   │   ├── ui/                      # composants shadcn (générés)
│   │   ├── tasks/                   # TaskCard.tsx, TaskForm.tsx, TaskFilters.tsx, StatusBadge.tsx
│   │   ├── board/                   # TaskBoard.tsx (dnd-kit), DroppableColumn.tsx
│   │   ├── workload/                # WorkloadBar.tsx, CapacityIndicator.tsx, OverloadFlag.tsx
│   │   └── history/                 # TaskTimeline.tsx
│   └── lib/
│       ├── supabase/
│       │   ├── server.ts            # client serveur (Server Components / Actions)
│       │   └── client.ts            # client navigateur
│       ├── auth.ts                  # getCurrentProfile(), requireManager()
│       ├── workload.ts              # lecture des vues de charge (FR6/FR7/FR8)
│       ├── history.ts               # logTaskEvent() — journalisation unique
│       └── types.ts                 # types générés (`supabase gen types`)
└── public/
```

### Frontières architecturales

**Frontière de données :** seul `src/lib/supabase/*` instancie un client Supabase.
Les Server Actions et Server Components l'importent ; les Client Components ne lisent
jamais la DB directement (ils reçoivent les données en props ou via Server Actions).

**Frontière d'autorisation :** double barrière — politiques RLS en base + `requireManager()`
dans les Server Actions sensibles. Aucune mutation ne contourne `actions.ts`.

**Frontière de composants :** Server Components (lecture/affichage) vs Client Components
(`'use client'` : glisser-déposer, filtres, formulaires). Communication descendante par
props, remontée par appel de Server Actions.

**Frontière d'historique :** toute écriture sur `tasks` passe par une Server Action qui
appelle `logTaskEvent()` — point d'entrée unique de `task_history`.

### Correspondance Exigences → Structure

| Exigence | Emplacement |
|---|---|
| FR1 création | `app/(app)/tasks/new/`, `tasks/actions.ts#createTask` |
| FR2 portefeuille + filtres | `app/(app)/tasks/page.tsx`, `components/tasks/TaskFilters.tsx` |
| FR3 affectation/réaffectation | `tasks/actions.ts#assignTask`, `board/actions.ts#reassignTask` |
| FR4 planification | `tasks/actions.ts#planTask` |
| FR5 statut + progression | `tasks/actions.ts#updateStatus`, `components/history/TaskTimeline.tsx` |
| FR6 charge agrégée | `app/(app)/workload/`, `lib/workload.ts` |
| FR7 surcharge / retard | `components/workload/OverloadFlag.tsx`, vues SQL |
| FR8 avancement global | `app/(app)/dashboard/` |
| FR9 glisser-déposer | `app/(app)/board/`, `components/board/TaskBoard.tsx` |
| FR10 rôles / RBAC | `lib/auth.ts`, `supabase/schema.sql` (RLS), `app/login/` |

### Flux de données
1. Server Component lit via `lib/supabase/server.ts` (+ `lib/workload.ts` pour la charge).
2. L'UI déclenche une Server Action (`actions.ts`).
3. L'action vérifie le rôle, mute `tasks`, écrit `task_history` via `logTaskEvent()`.
4. `revalidatePath()` rafraîchit les vues de charge/avancement (NFR1 < 2s).

### Configuration & déploiement
- `.env.local` : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- `supabase/schema.sql` + `seed.sql` : exécutés dans l'éditeur SQL Supabase pour amorcer la démo.
- Déploiement : push → Vercel ; variables d'environnement renseignées dans Vercel.

## Résultats de Validation de l'Architecture

### Validation de cohérence ✅
- **Compatibilité des décisions :** Next.js 16 + Supabase + @supabase/ssr + @dnd-kit
  forment une combinaison éprouvée, sans conflit de versions. Server Actions natives,
  pas de couche redondante.
- **Cohérence des patterns :** le `snake_case` DB ↔ types générés évite tout mapping ;
  les Server Actions `{ ok, error }` et `logTaskEvent()` sont applicables partout.
- **Alignement de la structure :** l'arborescence supporte chaque décision (frontière
  données dans `lib/supabase`, autorisation dans `actions.ts` + RLS).

### Couverture des exigences ✅
- **Fonctionnelles :** FR1→FR10 toutes rattachées à un emplacement précis
  (cf. table Correspondance Exigences → Structure). Aucune lacune.
- **Non fonctionnelles :**
  - NFR1 (< 2s) → `useOptimistic` + `revalidatePath`, vues SQL légères. ✅
  - NFR2 (sans formation) → composants shadcn standards. ⚠️ dépend aussi de l'exécution UX.
  - NFR3 (≤ 50 users / centaines de tâches) → trivial pour Postgres. ✅
  - NFR4 (persistance fiable) → Postgres + contraintes (enums, FK, NOT NULL). ✅
  - NFR5 (RBAC) → RLS + revérification de rôle dans les Server Actions. ✅

### Préparation à l'implémentation ✅
- Décisions documentées avec versions ; patterns et règles impératives explicites ;
  structure complète et spécifique ; frontières et flux de données définis.

### Analyse des lacunes
- **Critiques :** aucune.
- **Importantes :** aucune bloquante.
- **Mineures (acceptées en contexte hackathon) :**
  - Pas de tests automatisés (privilégier la vitesse de démo ; à ajouter post-hackathon).
  - NFR2 garantie par la qualité d'exécution UX, non par l'architecture seule.
  - Calcul de charge simplifié (pas de jours ouvrés / congés) — suffisant pour la démo.

### Liste de complétude de l'architecture

**Analyse des exigences**
- [x] Contexte projet analysé en profondeur
- [x] Échelle et complexité évaluées
- [x] Contraintes techniques identifiées
- [x] Préoccupations transversales cartographiées

**Décisions architecturales**
- [x] Décisions critiques documentées avec versions
- [x] Stack technique entièrement spécifiée
- [x] Patterns d'intégration définis
- [x] Considérations de performance traitées (NFR1)

**Patterns d'implémentation**
- [x] Conventions de nommage établies
- [x] Patterns de structure définis
- [x] Patterns de communication spécifiés
- [x] Patterns de processus documentés (erreurs, chargement)

**Structure du projet**
- [x] Arborescence complète définie
- [x] Frontières de composants établies
- [x] Points d'intégration cartographiés
- [x] Correspondance exigences → structure complète

### Évaluation de préparation

**Statut global :** READY FOR IMPLEMENTATION (16/16 cochés, aucune lacune critique).
**Niveau de confiance :** élevé.

**Points forts :**
- Pièces mobiles minimales (un framework, un backend managé).
- RBAC fourni quasi gratuitement par RLS.
- Traçabilité native via `task_history` (atout de démo).

**Améliorations futures :**
- Tests automatisés, temps réel Supabase, notifications, calcul de charge avancé.

### Passation à l'implémentation
**Consignes aux agents IA :**
- Suivre les décisions et patterns à la lettre ; respecter les frontières ;
  faire transiter toute mutation par `actions.ts` + `logTaskEvent()`.

**Première priorité d'implémentation :**
```bash
npx create-next-app@latest teamflow --typescript --tailwind --app --eslint --src-dir --use-npm
```
