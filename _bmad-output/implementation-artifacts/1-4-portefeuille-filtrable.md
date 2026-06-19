# Story 1.4: Portefeuille filtrable (FR2)

Status: ready-for-dev

## Story

En tant qu'**utilisateur**,
je veux **consulter toutes les tâches et les filtrer**,
afin de **retrouver rapidement le travail qui m'intéresse**.

## Acceptance Criteria

1. **Liste** — `/tasks` affiche toutes les tâches (titre, assigné, priorité, statut, échéance) avec un `StatusBadge` lisible.
2. **Filtres** — `TaskFilters` permet de filtrer par statut, assigné, priorité, échéance.
3. **État via URL** — l'état des filtres est porté par les query params (`?status=&assignee=&priority=`) ; l'URL est partageable et restaure les filtres au rechargement.
4. **État vide** — aucun résultat ⇒ état vide explicite (pas d'erreur).

## Tasks / Subtasks

- [ ] Page portefeuille (AC: #1, #4)
  - [ ] `src/app/(app)/tasks/page.tsx` (Server Component, lecture via `lib/supabase/server`)
- [ ] Composant filtres (AC: #2, #3)
  - [ ] `src/components/tasks/TaskFilters.tsx` (Client Component, écrit dans l'URL)
- [ ] Lecture filtrée (AC: #2, #3)
  - [ ] Appliquer les `searchParams` à la requête Supabase côté serveur

## Dev Notes

- **Filtres via URL, pas de state global** (Redux/Zustand interdits). Les `searchParams` sont la source unique de l'état. [Source: architecture.md#Communication & État] [Source: architecture.md#Anti-patterns à éviter]
- Lecture en Server Component via `src/lib/supabase/server.ts` ; les Client Components ne lisent jamais la DB directement. [Source: architecture.md#Frontières architecturales]
- Réutiliser `StatusBadge` (créé en 1.3). Ne pas dupliquer.
- SELECT autorisé pour tout utilisateur authentifié (transparence d'équipe). [Source: architecture.md#Authentification & Sécurité]

### Project Structure Notes

- Fichiers : `src/app/(app)/tasks/page.tsx`, `src/components/tasks/TaskFilters.tsx`.
- Dépend de 1.1 (clients, schéma) et 1.3 (`StatusBadge`, données à afficher).

### References

- FR2 [Source: prd.md#Requirements]
- [Source: architecture.md#Architecture Frontend]
- [Source: epics.md#Story 1.4 : Portefeuille filtrable (FR2)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
