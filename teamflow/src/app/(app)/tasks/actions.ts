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
