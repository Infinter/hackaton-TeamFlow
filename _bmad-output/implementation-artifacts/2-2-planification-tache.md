---
baseline_commit: e6748737852635f54fd4d2a45db352a3be85d5d7
---

# Story 2.2: Planifier une tâche (FR4)

Status: review

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

- [x] Server Action de planification (AC: #1, #2, #4)
  - [x] Ajouter `planTask` à `src/app/(app)/tasks/assignment-actions.ts` (même fichier dédié Épique 2)
  - [x] Validation cohérence des dates + `logTaskEvent('planned')` + `requireManager()`
- [x] UI de planification (AC: #1, #3)
  - [x] Sélecteurs de dates (composant shadcn) sur la page détail tâche

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

claude-sonnet-4-6 (Dev Story Agent)

### Debug Log References

- `npx tsc --noEmit` → ✅ 0 erreur
- `npm run lint` → ✅ 0 erreur
- `npm run build` → ✅ compilé (Turbopack, 1192ms) — `/tasks/[id]` en mode `ƒ Dynamic`

### Completion Notes List

- **`planTask` ajouté** à `assignment-actions.ts` : `requireManager()` → validation `dueDate >= startDate` → UPDATE `tasks` → `logTaskEvent('planned', { new: JSON.stringify({start_date, due_date}) })` → `revalidatePath` sur `/tasks`, `/tasks/[id]`, `/workload`.
- **AC#2 (validation)** : si `due_date < start_date`, retourne `{ ok: false, error }` sans aucune écriture en base.
- **AC#3 (affichage)** : dates formatées via `Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })` dans la page détail.
- **AC#4 (RBAC)** : `requireManager()` côté action ; UI `DatePlannerForm` rendu uniquement si `isManager`.
- **`DatePlannerForm`** : Client Component, `<input type="date">` natif (shadcn Calendar non installé — approche pragmatique hackathon), `useTransition`, toast sonner sur erreur et succès.
- **Page `/tasks/[id]`** : Server Component créé (n'existait pas), `params` awaité (Next.js 16 breaking change), `notFound()` si tâche inexistante.
- Déviation acceptée : `<input type="date">` natif à la place d'un shadcn Calendar Picker (composant non installé).

### File List

- `teamflow/src/app/(app)/tasks/assignment-actions.ts` — **MODIFIÉ** (ajout `planTask`)
- `teamflow/src/components/tasks/DatePlannerForm.tsx` — **NOUVEAU** (Client Component formulaire dates)
- `teamflow/src/app/(app)/tasks/[id]/page.tsx` — **NOUVEAU** (page détail tâche avec RBAC UI)

## Change Log

| Date | Changement |
|---|---|
| 2026-06-19 | Story 2.2 implémentée : planTask (assignment-actions.ts), DatePlannerForm, page /tasks/[id] avec RBAC et Intl.DateTimeFormat. Build ✅ lint ✅ tsc ✅ |
