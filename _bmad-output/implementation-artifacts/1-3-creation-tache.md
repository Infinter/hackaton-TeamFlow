# Story 1.3 : Création d'une tâche

---
baseline_commit: 65cae677368875dc2f01062b97c59ea8a087f4f9
---

Status: review

## Story

En tant que **manager**,
je veux **créer une tâche avec ses attributs**,
afin d'**alimenter le portefeuille de travail de l'équipe**.

## Acceptance Criteria

1. **Création** — sur `/tasks/new`, un manager renseigne titre, description, priorité (`low|medium|high`), estimation de charge (heures) et échéance, puis valide ; `createTask` insère la tâche (statut initial `todo`) et retourne `{ ok: true, data }` ; une redirection vers `/tasks` rafraîchit le portefeuille.
2. **Historique** — `logTaskEvent(..., 'created', ...)` est enregistré après l'insert réussi.
3. **Validation** — formulaire incomplet (titre vide ou `estimated_load_hours` non numérique / ≤ 0) → l'action retourne `{ ok: false, error }` et l'UI affiche le message sans créer de tâche.
4. **RBAC** — un collaborateur qui accède à `/tasks/new` est redirigé ; `createTask` appelle `requireManager()` et refuse la mutation si le rôle est insuffisant.

## Tasks / Subtasks

- [x] Politiques RLS INSERT (AC: #1, #4)
  - [x] Exécuter dans Supabase SQL Editor : INSERT tasks pour managers + INSERT task_history pour tout authentifié (voir Dev Notes)
- [x] Server Action `createTask` (AC: #1, #2, #3, #4)
  - [x] `src/app/(app)/tasks/actions.ts` → `createTask(_prevState, formData)`
- [x] Page de création (AC: #1, #4)
  - [x] `src/app/(app)/tasks/new/page.tsx` → guard manager + rendu du formulaire
- [x] Composant formulaire (AC: #1, #3)
  - [x] `src/components/tasks/TaskForm.tsx` → Client Component avec `useActionState`
- [x] Lien "Nouvelle tâche" dans tasks/page.tsx (AC: #4)
  - [x] Modifier `src/app/(app)/tasks/page.tsx` pour ajouter lien conditionnel manager

## Dev Notes

### ⚠️ Politiques RLS à appliquer AVANT de tester

Story 1.1 n'a créé que les politiques SELECT. Story 1.3 est responsable des INSERT.
Exécuter ce SQL dans le **Supabase SQL Editor** :

```sql
-- INSERT tasks : managers uniquement
CREATE POLICY "managers_insert_tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
  );

-- INSERT task_history : tout utilisateur authentifié (auteur = soi-même)
-- Nécessaire pour que logTaskEvent() fonctionne dans createTask
CREATE POLICY "authenticated_insert_task_history" ON task_history
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());
```

### Server Action `createTask`

Fichier à créer : `src/app/(app)/tasks/actions.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/auth'
import { logTaskEvent } from '@/lib/history'

export type TaskFormState = { ok: false; error: string } | null

export async function createTask(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const guard = await requireManager()
  if (!guard.ok) return { ok: false, error: guard.error }

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const priority = (formData.get('priority') as string | null) ?? 'low'
  const estimatedRaw = formData.get('estimated_load_hours') as string | null
  const dueDateRaw = (formData.get('due_date') as string | null) || null

  if (!title) return { ok: false, error: 'Le titre est requis.' }

  const estimated = parseFloat(estimatedRaw ?? '')
  if (isNaN(estimated) || estimated <= 0) {
    return { ok: false, error: "L'estimation de charge doit être un nombre positif." }
  }

  if (!['low', 'medium', 'high'].includes(priority)) {
    return { ok: false, error: 'Priorité invalide.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      priority: priority as 'low' | 'medium' | 'high',
      estimated_load_hours: estimated,
      due_date: dueDateRaw,
      status: 'todo',
      created_by: user.id,
    })
    .select()
    .single()

  if (error || !task) {
    console.error('[createTask] insert error:', error?.message)
    return { ok: false, error: 'Erreur lors de la création de la tâche.' }
  }

  await logTaskEvent(task.id, 'created', { new: title })
  revalidatePath('/tasks')
  redirect('/tasks')
  return null
}
```

**Points critiques :**
- `requireManager()` en tout premier — double barrière avec RLS.
- `created_by` = `user.id` (UUID = même ID que auth.users, FK → profiles).
- `logTaskEvent` DOIT être appelé après l'insert réussi (frontière d'historique AR5).
- `revalidatePath('/tasks')` puis `redirect('/tasks')` — `redirect()` throw en interne (Next.js), `return null` après est dead code mais satisfait le type TS.
- `assignee_id` absent : tâche non assignée à la création (affectation = Story 2.1).
- `start_date` absent : planification = Story 2.2.
- `estimated_load_hours` vient de formData en string → `parseFloat()` obligatoire.

### Page `/tasks/new`

Fichier à créer : `src/app/(app)/tasks/new/page.tsx`

Server Component. Guard manager côté serveur — si non-manager → `redirect('/tasks')`.

```typescript
import { redirect } from 'next/navigation'
import { requireManager } from '@/lib/auth'
import { TaskForm } from '@/components/tasks/TaskForm'

export default async function NewTaskPage() {
  const guard = await requireManager()
  if (!guard.ok) redirect('/tasks')

  return (
    <section className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold">Nouvelle tâche</h1>
      <TaskForm />
    </section>
  )
}
```

### Composant `TaskForm`

Fichier à créer : `src/components/tasks/TaskForm.tsx`

Client Component (`'use client'`). Utilise `useActionState(createTask, null)`.

Champs du formulaire :
| Champ | Type HTML | name | Requis |
|---|---|---|---|
| Titre | `input[type=text]` | `title` | oui |
| Description | `textarea` | `description` | non |
| Priorité | `select` | `priority` | oui (défaut `low`) |
| Estimation (h) | `input[type=number]` | `estimated_load_hours` | oui |
| Échéance | `input[type=date]` | `due_date` | non |

Style des inputs (identique Story 1.2, à réutiliser tel quel) :
```
className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring w-full"
```

Affichage de l'erreur : `{state !== null && <p className="text-sm text-destructive">{state.error}</p>}`

Bouton submit : `<Button type="submit" disabled={isPending}>` avec label "Créer la tâche" / "Création…"

Options du select priorité :
```jsx
<option value="low">Faible</option>
<option value="medium">Moyenne</option>
<option value="high">Haute</option>
```

Signature `useActionState` (React 19) :
```typescript
const [state, formAction, isPending] = useActionState<TaskFormState, FormData>(createTask, null)
```

### Modification `src/app/(app)/tasks/page.tsx`

Ajouter un bouton/lien "Nouvelle tâche" visible uniquement par les managers :

```typescript
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth'

export default async function TasksPage() {
  const profile = await getCurrentProfile()
  const isManager = profile?.role === 'manager'

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tâches</h1>
        {isManager && (
          <Link
            href="/tasks/new"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Nouvelle tâche
          </Link>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Portefeuille filtrable — Story 1.4.
      </p>
    </section>
  )
}
```

### Contrat anti-conflits Git

- **Fichiers possédés par cette story :** `src/app/(app)/tasks/actions.ts` (créé ici), `src/app/(app)/tasks/new/page.tsx`, `src/components/tasks/TaskForm.tsx`.
- **Fichiers modifiés :** `src/app/(app)/tasks/page.tsx` (ajout lien conditionnel).
- **Fichiers en lecture seule :** `src/lib/auth.ts`, `src/lib/history.ts`, `src/lib/types.ts`, `src/lib/supabase/*`.
- **Épique 2** crée `tasks/assignment-actions.ts` (fichier séparé) — ne PAS anticiper ici.

### Learnings critiques de Story 1.2

- `requireManager()` retourne `{ ok: false, error: string }` — toujours vérifier `guard.ok`.
- `createClient()` est **async** (Next.js 16) — toujours `await createClient()`.
- `redirect()` en Server Action throw en interne → `return null` après est dead code mais requis pour TS.
- `useActionState` React 19 : signature `(action, initialState)`, action reçoit `(prevState, formData)`.
- Pas de composant Input/Select shadcn disponible — utiliser plain HTML avec les classes Tailwind ci-dessus.
- Seuls `button.tsx` et `sonner.tsx` existent dans `src/components/ui/`.

### Pièges à éviter

- **NE PAS** oublier `logTaskEvent` après l'insert.
- **NE PAS** créer de route API REST — Server Action uniquement.
- **NE PAS** exposer `assignee_id` dans le formulaire (Story 2.1).
- **NE PAS** utiliser `sonner` pour les erreurs de validation : affichage inline via `state.error` suffit (`<p className="text-sm text-destructive">`).
- **Attention** aux politiques RLS : sans les INSERT policies, Supabase retourne une erreur 403 silencieuse (row-level security violation) — appliquer le SQL ci-dessus en premier.

### References

- [Source: architecture.md#Authentification & Sécurité] — politiques RLS INSERT
- [Source: architecture.md#Frontières architecturales] — Server Actions, logTaskEvent
- [Source: architecture.md#Formats] — `{ ok, error }`, dates ISO 8601
- [Source: epics.md#Story 1.3 : Création d'une tâche (FR1)]
- [Source: 1-2-authentification-roles.md] — patterns useActionState, requireManager, style inputs

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun — implémentation sans blocage.

### Completion Notes List

- AC#1 : `createTask` insère en BDD avec statut `todo`, redirige vers `/tasks` après succès.
- AC#2 : `logTaskEvent(task.id, 'created', { new: title })` appelé après insert réussi.
- AC#3 : validation côté serveur — titre vide et `estimated_load_hours` ≤ 0 / NaN retournent `{ ok: false, error }` ; `TaskForm` affiche l'erreur inline via `useActionState`.
- AC#4 : `requireManager()` double-barrière dans l'action + `redirect('/tasks')` dans `NewTaskPage` si non-manager ; lien "Nouvelle tâche" conditionnel dans `tasks/page.tsx`.
- TypeScript : 0 erreur (`tsc --noEmit`). ESLint : 0 warning.
- RLS SQL exécuté par Solo avant l'implémentation.

### File List

- teamflow/src/app/(app)/tasks/actions.ts (créé)
- teamflow/src/app/(app)/tasks/new/page.tsx (créé)
- teamflow/src/components/tasks/TaskForm.tsx (créé)
- teamflow/src/app/(app)/tasks/page.tsx (modifié)

## Change Log

- 2026-06-19 : Story créée par CS workflow (bmad-create-story).
- 2026-06-19 : Implémentation complète — createTask, TaskForm, NewTaskPage, lien conditionnel manager (Amelia / claude-sonnet-4-6).
