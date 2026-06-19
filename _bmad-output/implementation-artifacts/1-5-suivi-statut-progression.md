# Story 1.5: Suivi du statut & progression (FR5)

Status: ready-for-dev

## Story

En tant que **collaborateur**,
je veux **mettre à jour le statut de mes tâches et y consigner ma progression**,
afin de **rendre mon avancement visible et tracé**.

## Acceptance Criteria

1. **Changement de statut** — sur `/tasks/[id]`, changer le statut (`todo → in_progress → done`) ; `updateStatus` persiste et retourne `{ ok: true }`, avec `logTaskEvent(..., 'status_changed', {old, new})`.
2. **Note de progression** — ajouter une note enregistre `logTaskEvent(..., 'progress_note', {note})`.
3. **Timeline** — `TaskTimeline` présente l'historique chronologique (`task_history`) : création, changements de statut, notes.
4. **RBAC** — une tâche non assignée à l'utilisateur (et non manager) ⇒ mutation refusée par la RLS + revérification côté action.

## Tasks / Subtasks

- [ ] Page détail (AC: #1, #2, #3)
  - [ ] `src/app/(app)/tasks/[id]/page.tsx` (détail + section historique)
- [ ] Server Action statut/progression (AC: #1, #2, #4)
  - [ ] `src/app/(app)/tasks/actions.ts` → `updateStatus` (+ note), `logTaskEvent`, vérification de droits
- [ ] Composant timeline (AC: #3)
  - [ ] `src/components/history/TaskTimeline.tsx`

## Dev Notes

- `updateStatus` va dans `tasks/actions.ts` (possédé par l'Épique 1, déjà créé en 1.3). [Source: epics.md#Contrat anti-conflits Git]
- RLS : UPDATE statut autorisé pour l'assigné OU un manager. Revérifier côté Server Action (défense en profondeur). [Source: architecture.md#Authentification & Sécurité]
- Toute mutation de tâche DOIT écrire l'événement correspondant via `logTaskEvent()` — interdiction de muter sans journaliser. [Source: architecture.md#Anti-patterns à éviter]
- `TaskTimeline` lit `task_history` triée par `created_at`. Affichage des dates via `Intl.DateTimeFormat('fr-FR')`.

### Project Structure Notes

- Fichiers : `src/app/(app)/tasks/[id]/page.tsx`, `src/components/history/TaskTimeline.tsx`, + ajout de `updateStatus` à `tasks/actions.ts`.
- Dépend de 1.1 (helper d'historique, schéma) et 1.3 (`tasks/actions.ts` existant).

### References

- FR5 [Source: prd.md#Requirements]
- [Source: architecture.md#Frontière d'historique]
- [Source: epics.md#Story 1.5 : Suivi du statut & progression (FR5)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
