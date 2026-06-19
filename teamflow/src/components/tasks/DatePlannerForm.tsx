'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { planTask } from '@/app/(app)/tasks/assignment-actions'

interface Props {
  taskId: string
  currentStartDate: string | null
  currentDueDate: string | null
}

export function DatePlannerForm({ taskId, currentStartDate, currentDueDate }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const startDate = (data.get('start_date') as string) || null
    const dueDate = (data.get('due_date') as string) || null

    startTransition(async () => {
      const result = await planTask(taskId, startDate, dueDate)
      if (!result.ok) {
        toast.error(result.error)
      } else {
        toast.success('Dates enregistrées.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="start_date" className="text-xs font-medium text-muted-foreground">
          Date de début
        </label>
        <input
          id="start_date"
          name="start_date"
          type="date"
          defaultValue={currentStartDate ?? ''}
          disabled={isPending}
          className="rounded border px-2 py-1 text-sm disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="due_date" className="text-xs font-medium text-muted-foreground">
          Échéance
        </label>
        <input
          id="due_date"
          name="due_date"
          type="date"
          defaultValue={currentDueDate ?? ''}
          disabled={isPending}
          className="rounded border px-2 py-1 text-sm disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
