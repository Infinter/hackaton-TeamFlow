# Story 2.1: Affecter et réaffecter une tâche (FR3)

Status: ready-for-dev

## Story

En tant que **manager**,
je veux **affecter une tâche à un collaborateur ou la réaffecter à un autre**,
afin de **répartir le travail de façon claire et traçable**.

## Acceptance Criteria

1. **Affectation** — pour une tâche non assignée, sélectionner un collaborateur ⇒ `assignTask` met à jour `assignee_id`, retourne `{ ok: true }`, journalise `logTaskEvent(..., 'reassigned', {old: null, new: assignee})`, puis `revalidatePath`.
2. **Réaffectation** — pour une tâche déjà assignée, la réaffecter consigne l'ancien et le nouvel assigné (`old → new`) dans `task_history`.
3. **RBAC** — un collaborateur ne peut pas affecter (`requireManager()` + RLS) ; l'action n'est pas proposée dans l'UI.

## Tasks / Subtasks

- [ ] Server Actions d'affectation (AC: #1, #2, #3)
  - [ ] `src/app/(app)/tasks/assignment-actions.ts` → `assignTask` (fichier DÉDIÉ, ne pas toucher `tasks/actions.ts`)
  - [ ] `logTaskEvent('reassigned', {old, new})` + `requireManager()` + `revalidatePath`
- [ ] UI d'affectation (AC: #1, #2)
  - [ ] Contrôle de sélection d'assigné (sur la page détail tâche et/ou réutilisé par le board)

## Dev Notes

- ⚠️ **Frontière Git critique** : `assignTask` et `planTask` (2.2) vont dans **`src/app/(app)/tasks/assignment-actions.ts`** — fichier dédié à l'Épique 2 — pour NE PAS éditer `tasks/actions.ts` possédé par l'Épique 1. `reassignTask` (2.3) ira dans `board/actions.ts`. [Source: epics.md#Contrat anti-conflits Git]
- Mutation via Server Action `{ ok, error }` + `logTaskEvent()` + revérification `manager`. [Source: architecture.md#Règles impératives]
- RLS : INSERT/affectation réservés aux managers. [Source: architecture.md#Authentification & Sécurité]
- La liste des collaborateurs vient de `profiles` (rôle `collaborator`) via `lib/supabase/server`.

### Project Structure Notes

- Fichiers : `src/app/(app)/tasks/assignment-actions.ts` (nouveau), composant de sélection d'assigné dans `src/components/`.
- Dépend du socle 1.1 (schéma, helper, `requireManager` via 1.2). N'a PAS besoin de l'Épique 3.

### References

- FR3 [Source: prd.md#Requirements]
- [Source: architecture.md#Correspondance Exigences → Structure]
- [Source: epics.md#Story 2.1 : Affecter et réaffecter une tâche (FR3)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
