'use server'

import { createClient } from '@/lib/supabase/server'
import { logTaskEvent } from '@/lib/history'
import { requireManager } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

type Result = { ok: true } | { ok: false; error: string }

// Réaffecte une tâche par glisser-déposer (FR9). Fichier possédé par l'Épique 2.
export async function reassignTask(
  taskId: string,
  newAssigneeId: string | null,
): Promise<Result> {
  const auth = await requireManager()
  if (!auth.ok) return auth

  const supabase = await createClient()

  const { data: task, error: fetchErr } = await supabase
    .from('tasks')
    .select('assignee_id')
    .eq('id', taskId)
    .single()

  if (fetchErr || !task) return { ok: false, error: 'Tâche introuvable.' }

  const oldAssigneeId = task.assignee_id ?? null

  const { error } = await supabase
    .from('tasks')
    .update({ assignee_id: newAssigneeId })
    .eq('id', taskId)

  if (error) {
    console.error('reassignTask:', error)
    return { ok: false, error: 'Erreur lors de la réaffectation.' }
  }

  await logTaskEvent(taskId, 'reassigned', {
    old: oldAssigneeId,
    new: newAssigneeId,
  })

  revalidatePath('/board')
  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)

  return { ok: true }
}
