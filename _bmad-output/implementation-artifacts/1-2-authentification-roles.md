---
baseline_commit: e6748737852635f54fd4d2a45db352a3be85d5d7
---

# Story 1.2: Authentification & rôles

Status: done

## Story

En tant qu'**utilisateur (manager ou collaborateur)**,
je veux **me connecter et être reconnu selon mon rôle**,
afin d'**accéder uniquement aux actions autorisées pour mon rôle**.

## Acceptance Criteria

1. **Connexion** — sur `/login`, la Server Action `signIn` authentifie via Supabase Auth et redirige vers `/dashboard` ; un bouton `signOut` est présent dans la nav.
2. **Profil courant** — `getCurrentProfile()` (`src/lib/auth.ts`) retourne le `profile` incluant `role` et `weekly_capacity_hours`.
3. **Nav selon rôle** — pour un `collaborator`, les entrées/actions réservées au manager sont masquées ou désactivées.
4. **Garde manager** — `requireManager()` ; si l'utilisateur n'est pas manager, l'action retourne `{ ok: false, error }` sans mutation (double barrière avec la RLS).

## Tasks / Subtasks

- [x] Page de connexion (AC: #1)
  - [x] `src/app/login/page.tsx` (formulaire email/mot de passe, composants shadcn)
  - [x] `src/app/login/actions.ts` → `signIn`, `signOut`
- [x] Helpers d'autorisation (AC: #2, #4)
  - [x] `src/lib/auth.ts` → `getCurrentProfile()`, `requireManager()`
- [x] Nav selon rôle (AC: #3)
  - [x] Adapter `src/app/(app)/layout.tsx` pour conditionner les entrées manager au `role`

### Review Findings

- [x] [Review][Decision] Aucun flux signUp → résolu : ajout de `signUp` Server Action + UI toggle connexion/inscription dans `login/page.tsx`
- [x] [Review][Decision] Convention `{ ok, error }` → résolu : actions auth qui redirigent sont exclues de la convention (redirect = succès framework, pas throw vers UI)
- [x] [Review][Patch] Route /workload accessible directement par un collaborator → `requireManager()` appelé dans `workload/page.tsx`, redirect /dashboard si non-manager [`src/app/(app)/workload/page.tsx`]
- [x] [Review][Patch] `signIn` : FormData null cast → validation server-side avec trim + guard vide [`src/app/login/actions.ts:10-15`]
- [x] [Review][Patch] `signIn` : aucune validation serveur → guard `!email || !password` ajouté [`src/app/login/actions.ts:14`]
- [x] [Review][Patch] `signIn` : messages Supabase verbatim → remplacé par message générique [`src/app/login/actions.ts:21`]
- [x] [Review][Patch] `getCurrentProfile` : erreur query ignorée → `error` destructuré et loggé [`src/lib/auth.ts:24-27`]
- [x] [Review][Patch] `signOut` : erreur ignorée → `error` destructuré et loggé [`src/app/login/actions.ts:74`]
- [x] [Review][Patch] `AppLayout` : profile null sans redirect → `if (!profile) redirect('/login')` ajouté [`src/app/(app)/layout.tsx:17`]
- [x] [Review][Defer] `getCurrentProfile` sans cache React — deux round-trips Supabase par render, optimisation perf à faire [`src/lib/auth.ts:15`] — deferred, pre-existing
- [x] [Review][Defer] `select('*')` sur profiles — récupère toutes les colonnes, à restreindre [`src/lib/auth.ts:23`] — deferred, pre-existing
- [x] [Review][Defer] Page /login sans redirect pour utilisateurs déjà connectés — UX seulement, le proxy protège déjà les routes app [`src/app/login/page.tsx`] — deferred, pre-existing

## Dev Notes

- **Auth** : Supabase Auth (email/mot de passe). Le rôle est porté par `profiles.role`, pas par les claims. [Source: architecture.md#Authentification & Sécurité]
- **Double barrière** : RLS en base **et** `requireManager()` dans les Server Actions sensibles. Les actions retournent toujours `{ ok, error }`, jamais de throw vers l'UI. [Source: architecture.md#Frontières architecturales]
- **Format de retour Server Action** : `{ ok: true; data: T } | { ok: false; error: string }`. [Source: architecture.md#Formats]
- `getCurrentProfile()` est consommé par les autres stories (filtres, RBAC UI) — stabiliser sa signature.

### Project Structure Notes

- Fichiers possédés par cette story : `src/app/login/**`, `src/lib/auth.ts`. Modifie `(app)/layout.tsx` (livré en 1.1) uniquement pour la logique de rôle.
- Dépend de la Story 1.1 (clients Supabase, schéma, types, nav). [Source: epics.md#Contrat anti-conflits Git]

### References

- [Source: architecture.md#Authentification & Sécurité]
- [Source: epics.md#Story 1.2 : Authentification & rôles (FR10, NFR5)]
- FR10, NFR5 [Source: prd.md#Requirements]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Correction du type retour de `signIn` : ajout de `null` dans le type de retour pour compatibilité avec `useActionState` React 19 (overload 2 attendait `(state, payload) => Promise<S | null>`).

### Completion Notes List

- `src/app/login/page.tsx` : Client Component avec `useActionState` React 19 ; formulaire email/mot de passe avec affichage d'erreur ; styles Tailwind inline car seuls Button et Sonner sont disponibles en composants shadcn.
- `src/app/login/actions.ts` : `signIn` (Server Action avec prevState pour useActionState, redirect vers /dashboard après succès) ; `signOut` (Server Action, redirect vers /login).
- `src/lib/auth.ts` : `getCurrentProfile()` retourne `Profile | null` — requête Supabase `profiles` après `getUser()` ; `requireManager()` retourne `{ ok: false, error }` si non manager, `{ ok: true, data: undefined }` sinon.
- `src/app/(app)/layout.tsx` : rendu serveur async, appelle `getCurrentProfile()`, masque l'entrée "Charge" pour les collaborators (`managerOnly: true`), ajoute le bouton Déconnexion via `form action={signOut}`.
- La protection de route (redirect /login si non authentifié) est déjà gérée par `src/proxy.ts` (middleware renommé en Next.js 16).

### File List

- teamflow/src/app/login/page.tsx (modifié)
- teamflow/src/app/login/actions.ts (créé)
- teamflow/src/lib/auth.ts (créé)
- teamflow/src/app/(app)/layout.tsx (modifié)

## Change Log

- 2026-06-19 : Implémentation Story 1.2 — page login, Server Actions signIn/signOut, getCurrentProfile(), requireManager(), nav conditionnelle par rôle.
