import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import { AssigneeSelector } from '@/components/board/AssigneeSelector'

export default async function BoardPage() {
  const supabase = await createClient()

  const [{ data: tasks }, { data: collaborators }, profile] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, assignee_id, status, priority')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, full_name, role, weekly_capacity_hours')
      .eq('role', 'collaborator'),
    getCurrentProfile(),
  ])

  const isManager = profile?.role === 'manager'
  const collaboratorList = collaborators ?? []

  // Carte id → nom pour affichage lecture seule (collaborateurs)
  const nameById = Object.fromEntries(collaboratorList.map((c) => [c.id, c.full_name]))

  const taskList = tasks ?? []

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Tableau d&apos;affectation</h1>
        {!isManager && (
          <span className="text-xs text-muted-foreground">Vue lecture seule</span>
        )}
      </div>

      {taskList.length === 0 ? (
        <p className="rounded border px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune tâche dans le portefeuille.
        </p>
      ) : (
        <div className="divide-y rounded border">
          {taskList.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <Link href={`/tasks/${task.id}`} className="truncate text-sm font-medium hover:underline">
                  {task.title}
                </Link>
                <p className="text-xs text-muted-foreground capitalize">
                  {task.status.replace('_', ' ')} · {task.priority}
                </p>
              </div>

              {isManager ? (
                <AssigneeSelector
                  taskId={task.id}
                  currentAssigneeId={task.assignee_id}
                  collaborators={collaboratorList}
                />
              ) : (
                <span className="shrink-0 text-sm text-muted-foreground">
                  {task.assignee_id ? nameById[task.assignee_id] ?? '—' : '—'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
