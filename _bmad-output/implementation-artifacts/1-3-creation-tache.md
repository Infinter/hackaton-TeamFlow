# Story 1.3: Création d'une tâche (FR1)

Status: ready-for-dev

## Story

En tant que **manager**,
je veux **créer une tâche avec ses attributs**,
afin d'**alimenter le portefeuille de travail de l'équipe**.

## Acceptance Criteria

1. **Création** — sur `/tasks/new`, en renseignant titre, description, priorité (`low|medium|high`), estimation de charge (heures) et échéance, `createTask` insère la tâche (statut initial `todo`) et retourne `{ ok: true, data }`.
2. **Historique** — `logTaskEvent(..., 'created', ...)` est enregistré dans la même opération.
3. **Rafraîchissement** — `revalidatePath` rafraîchit le portefeuille après création.
4. **Validation** — formulaire incomplet (titre vide, estimation non numérique) ⇒ `{ ok: false, error }`, toast d'erreur, aucune tâche créée.
5. **RBAC** — un collaborateur ne peut pas créer de tâche (`requireManager()` + entrée UI absente).

## Tasks / Subtasks

- [ ] Formulaire de création (AC: #1, #4)
  - [ ] `src/app/(app)/tasks/new/page.tsx` + `src/components/tasks/TaskForm.tsx`
- [ ] Server Action (AC: #1, #2, #3, #5)
  - [ ] `src/app/(app)/tasks/actions.ts` → `createTask` (validation, insert, `logTaskEvent('created')`, `requireManager()`, `revalidatePath('/tasks')`)
- [ ] Composants partagés (AC: #1)
  - [ ] `src/components/tasks/StatusBadge.tsx` (réutilisé par 1.4/1.5)

## Dev Notes

- **`tasks/actions.ts` est possédé par l'Épique 1.** Y placer `createTask` et `updateStatus` (1.5). L'Épique 2 placera `assignTask`/`planTask` dans `tasks/assignment-actions.ts` (fichier séparé) — ne pas anticiper ici. [Source: epics.md#Contrat anti-conflits Git]
- Mutation via Server Action retournant `{ ok, error }` ; appeler `logTaskEvent()` ; revérifier le rôle. [Source: architecture.md#Règles impératives]
- Champs `estimated_load_hours`, `due_date` doivent être fiables dès cette story : le moteur de charge (Épique 3) en dépend. [Source: architecture.md#Dépendances inter-composants]
- Dates échangées en ISO 8601, affichées via `Intl.DateTimeFormat('fr-FR')`. [Source: architecture.md#Formats]
- Erreurs → toast sonner ; détails techniques en `console.error` serveur. [Source: architecture.md#Gestion erreurs & chargement]

### Project Structure Notes

- Fichiers : `src/app/(app)/tasks/{new/page.tsx,actions.ts}`, `src/components/tasks/{TaskForm,StatusBadge}.tsx`.
- Dépend des Stories 1.1 (schéma, helper, clients) et 1.2 (`requireManager()`).

### References

- FR1 [Source: prd.md#Requirements]
- [Source: architecture.md#Correspondance Exigences → Structure]
- [Source: epics.md#Story 1.3 : Création d'une tâche (FR1)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
