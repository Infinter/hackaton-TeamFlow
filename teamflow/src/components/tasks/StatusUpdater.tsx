'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { updateStatus } from '@/app/(app)/tasks/actions'

type Status = 'todo' | 'in_progress' | 'done'

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Terminé' },
]

export function StatusUpdater({
  taskId,
  currentStatus,
}: {
  taskId: string
  currentStatus: Status
}) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Status>(currentStatus)
  const [note, setNote] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateStatus(taskId, selected, note || undefined)
      if (!result.ok) {
        toast.error(result.error)
      } else {
        toast.success('Statut mis à jour')
        setNote('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
              selected === opt.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note de progression (optionnelle)…"
        rows={2}
        className="w-full rounded border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <button
        type="submit"
        disabled={isPending || selected === currentStatus && !note.trim()}
        className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
