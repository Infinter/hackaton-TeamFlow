'use server'

import { createClient } from '@/lib/supabase/server'
import { logTaskEvent } from '@/lib/history'
import { requireManager } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

type Result = { ok: true } | { ok: false; error: string }

// Affecte ou réaffecte une tâche à un collaborateur (ou la désassigne si null).
// Fichier dédié Épique 2 — ne PAS toucher tasks/actions.ts (Épique 1).
export async function assignTask(
  taskId: string,
  assigneeId: string | null,
): Promise<Result> {
  const auth = await requireManager()
  if (!auth.ok) return auth

  const supabase = await createClient()

  // Lecture de l'assigné courant pour journaliser old_value (AR5)
  const { data: task, error: fetchErr } = await supabase
    .from('tasks')
    .select('assignee_id')
    .eq('id', taskId)
    .single()

  if (fetchErr || !task) return { ok: false, error: 'Tâche introuvable.' }

  const oldAssigneeId = task.assignee_id ?? null

  const { error } = await supabase
    .from('tasks')
    .update({ assignee_id: assigneeId })
    .eq('id', taskId)

  if (error) {
    console.error('assignTask:', error)
    return { ok: false, error: "Erreur lors de l'affectation." }
  }

  await logTaskEvent(taskId, 'reassigned', {
    old: oldAssigneeId,
    new: assigneeId,
  })

  revalidatePath('/tasks')
  revalidatePath('/board')
  revalidatePath(`/tasks/${taskId}`)

  return { ok: true }
}

// Planifie une tâche : start_date + due_date avec validation de cohérence (AC #1, #2, #4).
// Fichier dédié Épique 2 — ne PAS toucher tasks/actions.ts (Épique 1).
export async function planTask(
  taskId: string,
  startDate: string | null,
  dueDate: string | null,
): Promise<Result> {
  const auth = await requireManager()
  if (!auth.ok) return auth

  if (startDate && dueDate && dueDate < startDate) {
    return { ok: false, error: "L'échéance ne peut pas être antérieure à la date de début." }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ start_date: startDate, due_date: dueDate })
    .eq('id', taskId)

  if (error) {
    console.error('planTask:', error)
    return { ok: false, error: 'Erreur lors de la planification.' }
  }

  await logTaskEvent(taskId, 'planned', {
    new: JSON.stringify({ start_date: startDate, due_date: dueDate }),
  })

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/workload')

  return { ok: true }
}
