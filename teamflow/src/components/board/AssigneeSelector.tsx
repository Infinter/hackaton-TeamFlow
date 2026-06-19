'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { assignTask } from '@/app/(app)/tasks/assignment-actions'
import type { Database } from '@/lib/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AssigneeSelectorProps {
  taskId: string
  currentAssigneeId: string | null
  collaborators: Profile[]
}

// Sélecteur d'assigné pour manager — Client Component.
// React 19 : startTransition accepte les fonctions async.
export function AssigneeSelector({
  taskId,
  currentAssigneeId,
  collaborators,
}: AssigneeSelectorProps) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null
    startTransition(async () => {
      const result = await assignTask(taskId, value)
      if (!result.ok) toast.error(result.error)
    })
  }

  return (
    <select
      defaultValue={currentAssigneeId ?? ''}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Assigné"
      className="rounded border border-input bg-background px-2 py-1 text-sm disabled:opacity-50"
    >
      <option value="">— non assigné —</option>
      {collaborators.map((c) => (
        <option key={c.id} value={c.id}>
          {c.full_name}
        </option>
      ))}
    </select>
  )
}
