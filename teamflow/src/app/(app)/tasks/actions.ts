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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

type Result = { ok: true } | { ok: false; error: string }

const VALID_STATUSES = ['todo', 'in_progress', 'done'] as const
type Status = (typeof VALID_STATUSES)[number]

// Mise à jour statut + note de progression (FR5). Assigné OU manager (défense en profondeur RLS).
export async function updateStatus(
  taskId: string,
  newStatus: string,
  note?: string,
): Promise<Result> {
  if (!VALID_STATUSES.includes(newStatus as Status)) {
    return { ok: false, error: 'Statut invalide.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: task, error: fetchErr } = await supabase
    .from('tasks')
    .select('assignee_id, status')
    .eq('id', taskId)
    .single()

  if (fetchErr || !task) return { ok: false, error: 'Tâche introuvable.' }

  const isManager = profile?.role === 'manager'
  const isAssignee = task.assignee_id === user.id
  if (!isManager && !isAssignee) {
    return { ok: false, error: 'Accès refusé : vous n\'êtes pas assigné à cette tâche.' }
  }

  const oldStatus = task.status

  const { error } = await supabase
    .from('tasks')
    .update({ status: newStatus as Status })
    .eq('id', taskId)

  if (error) {
    console.error('updateStatus:', error)
    return { ok: false, error: 'Erreur lors de la mise à jour du statut.' }
  }

  await logTaskEvent(taskId, 'status_changed', { old: oldStatus, new: newStatus })

  if (note?.trim()) {
    await logTaskEvent(taskId, 'progress_note', { note: note.trim() })
  }

  revalidatePath(`/tasks/${taskId}`)
  revalidatePath('/tasks')
  revalidatePath('/board')

  return { ok: true }
}
