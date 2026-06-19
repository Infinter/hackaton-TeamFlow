# Story 2.3: Tableau d'affectation par glisser-déposer (FR9, NFR1)

Status: ready-for-dev

## Story

En tant que **manager**,
je veux **réaffecter les tâches par glisser-déposer sur un tableau**,
afin d'**ajuster la répartition rapidement et voir l'impact immédiat**.

> Dépend de la Story 2.1 (`reassignTask`) — même épique, ordre respecté, aucune dépendance avant.

## Acceptance Criteria

1. **Tableau** — `/board` affiche `TaskBoard` (@dnd-kit) avec une colonne par collaborateur, chaque tâche dans la colonne de son assigné.
2. **Glisser-déposer optimiste** — déposer une tâche dans la colonne d'un autre collaborateur met à jour l'affichage immédiatement via `useOptimistic`, puis `reassignTask` (`board/actions.ts`) persiste et journalise l'événement.
3. **NFR1** — le changement est reflété en moins de 2 secondes, réconcilié par le serveur.
4. **Rollback** — échec serveur (`{ ok: false }`) ⇒ l'affichage optimiste est annulé + toast d'erreur.
5. **RBAC** — pour un collaborateur, le glisser-déposer est désactivé (lecture seule).

## Tasks / Subtasks

- [ ] Page tableau (AC: #1)
  - [ ] `src/app/(app)/board/page.tsx` (lecture tâches + profils)
- [ ] Composants dnd (AC: #1, #2, #4)
  - [ ] `src/components/board/TaskBoard.tsx` (@dnd-kit, `useOptimistic`), `DroppableColumn.tsx`
- [ ] Server Action (AC: #2, #3, #5)
  - [ ] `src/app/(app)/board/actions.ts` → `reassignTask` (optimiste, `logTaskEvent('reassigned')`, `requireManager()`, `revalidatePath`)

## Dev Notes

- **@dnd-kit + `useOptimistic`** pour l'impact immédiat ; réconciliation serveur pour NFR1 < 2s. [Source: architecture.md#Architecture Frontend]
- `reassignTask` vit dans `board/actions.ts` (possédé par l'Épique 2). Réutilise la logique de réaffectation de 2.1 (mêmes règles de journalisation `old → new`). [Source: architecture.md#Correspondance Exigences → Structure]
- En cas d'échec, annuler l'état optimiste et notifier via toast sonner. [Source: architecture.md#Gestion erreurs & chargement]
- Colonnes = collaborateurs (`profiles` rôle `collaborator`).

### Project Structure Notes

- Fichiers : `src/app/(app)/board/{page.tsx,actions.ts}`, `src/components/board/{TaskBoard,DroppableColumn}.tsx`.
- Répertoires `board/**` entièrement possédés par l'Épique 2 → aucun conflit avec les Épiques 1 et 3.

### References

- FR9, NFR1 [Source: prd.md#Requirements]
- [Source: architecture.md#Patterns API & Communication]
- [Source: epics.md#Story 2.3 : Tableau d'affectation par glisser-déposer (FR9, NFR1)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
