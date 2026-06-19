# Story 2.2: Planifier une tâche (FR4)

Status: ready-for-dev

## Story

En tant que **manager**,
je veux **attribuer une date de début et une échéance à une tâche**,
afin de **cadrer quand le travail doit être réalisé**.

## Acceptance Criteria

1. **Planification** — renseigner `start_date` et `due_date` ⇒ `planTask` persiste les dates, retourne `{ ok: true }`, et journalise `logTaskEvent(..., 'planned', {new: dates})`.
2. **Validation** — `due_date` antérieure à `start_date` ⇒ `{ ok: false, error }`, aucune date enregistrée.
3. **Affichage** — dates échangées en ISO 8601, affichées via `Intl.DateTimeFormat('fr-FR')`.
4. **RBAC** — planification réservée au manager (`requireManager()` + RLS).

## Tasks / Subtasks

- [ ] Server Action de planification (AC: #1, #2, #4)
  - [ ] Ajouter `planTask` à `src/app/(app)/tasks/assignment-actions.ts` (même fichier dédié Épique 2)
  - [ ] Validation cohérence des dates + `logTaskEvent('planned')` + `requireManager()`
- [ ] UI de planification (AC: #1, #3)
  - [ ] Sélecteurs de dates (composant shadcn) sur la page détail tâche

## Dev Notes

- `planTask` partage le fichier `tasks/assignment-actions.ts` avec `assignTask` (2.1) — appartient à l'Épique 2, n'éditez pas `tasks/actions.ts`. [Source: epics.md#Contrat anti-conflits Git]
- Dates : stockage Postgres `date`, échange ISO 8601, affichage `Intl.DateTimeFormat('fr-FR')`. [Source: architecture.md#Formats]
- `start_date`/`due_date` alimentent le moteur de charge & la détection de retard (Épique 3) — fiabilité requise. [Source: architecture.md#Dépendances inter-composants]
- Mutation `{ ok, error }` + `logTaskEvent()`. [Source: architecture.md#Règles impératives]

### Project Structure Notes

- Fichiers : ajout `planTask` à `tasks/assignment-actions.ts` + UI dates.
- Dépend de 1.1 et idéalement après 2.1 (même fichier d'actions). Aucune dépendance vers l'Épique 3.

### References

- FR4 [Source: prd.md#Requirements]
- [Source: epics.md#Story 2.2 : Planifier une tâche (FR4)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
