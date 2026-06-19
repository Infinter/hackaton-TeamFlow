import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import { DatePlannerForm } from '@/components/tasks/DatePlannerForm'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { StatusUpdater } from '@/components/tasks/StatusUpdater'
import { TaskTimeline } from '@/components/history/TaskTimeline'

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return fmt.format(new Date(iso))
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: task }, { data: history }, profile] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, description, status, priority, start_date, due_date, estimated_load_hours, assignee_id')
      .eq('id', id)
      .single(),
    supabase
      .from('task_history')
      .select('id, created_at, event_type, old_value, new_value, note, author:profiles!task_history_author_id_fkey(full_name)')
      .eq('task_id', id)
      .order('created_at', { ascending: true }),
    getCurrentProfile(),
  ])

  if (!task) notFound()

  const isManager = profile?.role === 'manager'
  const isAssignee = profile?.id === task.assignee_id
  const canUpdateStatus = isManager || isAssignee

  type HistoryRow = {
    id: string
    created_at: string
    event_type: 'created' | 'status_changed' | 'reassigned' | 'planned' | 'progress_note'
    old_value: string | null
    new_value: string | null
    note: string | null
    author: { full_name: string } | null
  }

  const typedHistory = (history ?? []) as HistoryRow[]

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">{task.title}</h1>
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Statut</dt>
          <dd className="mt-0.5">
            <StatusBadge status={task.status} />
          </dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Priorité</dt>
          <dd className="capitalize">{task.priority}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Charge estimée</dt>
          <dd>{task.estimated_load_hours}h</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Date de début</dt>
          <dd>{formatDate(task.start_date)}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Échéance</dt>
          <dd>{formatDate(task.due_date)}</dd>
        </div>
      </dl>

      {canUpdateStatus && (
        <div className="space-y-2 rounded border p-4">
          <h2 className="text-sm font-semibold">Mettre à jour le statut</h2>
          <StatusUpdater taskId={task.id} currentStatus={task.status} />
        </div>
      )}

      {isManager && (
        <div className="space-y-2 rounded border p-4">
          <h2 className="text-sm font-semibold">Planification</h2>
          <DatePlannerForm
            taskId={task.id}
            currentStartDate={task.start_date}
            currentDueDate={task.due_date}
          />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Historique</h2>
        <TaskTimeline history={typedHistory} />
      </div>
    </section>
  )
}
