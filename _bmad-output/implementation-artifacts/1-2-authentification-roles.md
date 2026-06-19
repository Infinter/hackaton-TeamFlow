# Story 1.2: Authentification & rôles

Status: ready-for-dev

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

- [ ] Page de connexion (AC: #1)
  - [ ] `src/app/login/page.tsx` (formulaire email/mot de passe, composants shadcn)
  - [ ] `src/app/login/actions.ts` → `signIn`, `signOut`
- [ ] Helpers d'autorisation (AC: #2, #4)
  - [ ] `src/lib/auth.ts` → `getCurrentProfile()`, `requireManager()`
- [ ] Nav selon rôle (AC: #3)
  - [ ] Adapter `src/app/(app)/layout.tsx` pour conditionner les entrées manager au `role`

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

### Debug Log References

### Completion Notes List

### File List
