'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { createTask, type TaskFormState } from '@/app/(app)/tasks/actions'

const inputClass =
  'rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring w-full'

export function TaskForm() {
  const [state, formAction, isPending] = useActionState<TaskFormState, FormData>(
    createTask,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Titre
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className={inputClass}
          placeholder="Nom de la tâche"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className={inputClass}
          placeholder="Détails optionnels…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="priority" className="text-sm font-medium">
          Priorité
        </label>
        <select id="priority" name="priority" defaultValue="low" className={inputClass}>
          <option value="low">Faible</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="estimated_load_hours" className="text-sm font-medium">
          Estimation (heures)
        </label>
        <input
          id="estimated_load_hours"
          name="estimated_load_hours"
          type="number"
          min="0.1"
          step="0.5"
          required
          className={inputClass}
          placeholder="ex. 4"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="due_date" className="text-sm font-medium">
          Échéance
        </label>
        <input id="due_date" name="due_date" type="date" className={inputClass} />
      </div>

      {state !== null && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Création…' : 'Créer la tâche'}
      </Button>
    </form>
  )
}
