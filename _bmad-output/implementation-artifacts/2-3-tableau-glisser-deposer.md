---
baseline_commit: 198ede24e597fcf368ace62fe6fad69bea53dd9d
---

# Story 2.3: Tableau d'affectation par glisser-déposer (FR9, NFR1)

Status: review

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

- [x] Page tableau (AC: #1)
  - [x] `src/app/(app)/board/page.tsx` (lecture tâches + profils)
- [x] Composants dnd (AC: #1, #2, #4)
  - [x] `src/components/board/TaskBoard.tsx` (@dnd-kit, `useOptimistic`), `DroppableColumn.tsx`
- [x] Server Action (AC: #2, #3, #5)
  - [x] `src/app/(app)/board/actions.ts` → `reassignTask` (optimiste, `logTaskEvent('reassigned')`, `requireManager()`, `revalidatePath`)

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

claude-sonnet-4-6 (Dev Story Agent)

### Debug Log References

- `npx tsc --noEmit` → ✅ 0 erreur
- `npm run lint` → ✅ 0 erreur
- `npm run build` → ✅ compilé (Turbopack, 1199ms) — `/board` en mode `ƒ Dynamic`

### Completion Notes List

- **`board/actions.ts`** : `reassignTask` — `requireManager()` → lecture `assignee_id` courant → UPDATE → `logTaskEvent('reassigned', { old, new })` → `revalidatePath` sur `/board`, `/tasks`, `/tasks/[id]`.
- **`TaskBoard.tsx`** : Client Component, `DndContext` (@dnd-kit/core 6.3.1), `useOptimistic` sur le tableau plat de tâches (reducer : remap `assignee_id`), `useTransition` autour de `reassignTask`. Rollback automatique à la fin de la transition si erreur serveur + toast sonner (AC#4).
- **`DroppableColumn.tsx`** : `useDroppable` par colonne (id = collaborateur ou `'unassigned'`). `DraggableTaskCard` inline dans le même fichier : `useDraggable` avec `disabled={!isManager}` (AC#5). Lien vers `/tasks/[id]` conservé.
- **`board/page.tsx`** : remplace l'ancienne liste `AssigneeSelector` par `TaskBoard`. Colonnes triées par `full_name`. Tâches non assignées ou dont l'assigné n'est pas collaborateur → colonne "Non assigné".
- **AC#3 (NFR1 < 2s)** : garanti par `useOptimistic` (impact immédiat côté client) + `revalidatePath` pour réconciliation serveur.

### File List

- `teamflow/src/app/(app)/board/actions.ts` — **NOUVEAU** (Server Action `reassignTask`)
- `teamflow/src/app/(app)/board/page.tsx` — **MODIFIÉ** (passe à TaskBoard, supprime AssigneeSelector)
- `teamflow/src/components/board/TaskBoard.tsx` — **NOUVEAU** (DndContext + useOptimistic)
- `teamflow/src/components/board/DroppableColumn.tsx` — **NOUVEAU** (useDroppable + DraggableTaskCard)

## Change Log

| Date | Changement |
|---|---|
| 2026-06-19 | Story 2.3 implémentée : reassignTask (board/actions.ts), TaskBoard (DndContext + useOptimistic), DroppableColumn + DraggableTaskCard, board/page.tsx migré vers kanban. Build ✅ lint ✅ tsc ✅ |
