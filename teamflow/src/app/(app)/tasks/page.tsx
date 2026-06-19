import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { StatusBadge } from '@/components/tasks/StatusBadge'

type TaskWithAssignee = {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'done'
  due_date: string | null
  estimated_load_hours: number
  assignee_id: string | null
  assignee: { full_name: string } | null
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Faible', medium: 'Moyenne', high: 'Haute',
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; assignee?: string; priority?: string; due_before?: string }>
}) {
  const { status, assignee, priority, due_before } = await searchParams

  const supabase = await createClient()

  let query = supabase
    .from('tasks')
    .select(`
      id, title, priority, status, due_date, estimated_load_hours, assignee_id,
      assignee:profiles!tasks_assignee_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  if (status)     query = query.eq('status', status as 'todo' | 'in_progress' | 'done')
  if (assignee)   query = query.eq('assignee_id', assignee)
  if (priority)   query = query.eq('priority', priority as 'low' | 'medium' | 'high')
  if (due_before) query = query.lte('due_date', due_before)

  const [{ data: tasks }, { data: profiles }, profile] = await Promise.all([
    query,
    supabase.from('profiles').select('id, full_name').order('full_name'),
    getCurrentProfile(),
  ])

  const isManager = profile?.role === 'manager'
  const typedTasks = (tasks ?? []) as TaskWithAssignee[]

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tâches</h1>
        {isManager && (
          <Link
            href="/tasks/new"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Nouvelle tâche
          </Link>
        )}
      </div>

      <TaskFilters profiles={profiles ?? []} />

      {typedTasks.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Aucune tâche ne correspond aux filtres sélectionnés.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Titre</th>
                <th className="pb-2 pr-4 font-medium">Assigné</th>
                <th className="pb-2 pr-4 font-medium">Priorité</th>
                <th className="pb-2 pr-4 font-medium">Statut</th>
                <th className="pb-2 font-medium">Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {typedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-muted/40">
                  <td className="py-3 pr-4 font-medium">
                    <Link href={`/tasks/${task.id}`} className="hover:underline">
                      {task.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {task.assignee?.full_name ?? <span className="italic">Non assigné</span>}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {PRIORITY_LABEL[task.priority]}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {task.due_date
                      ? new Intl.DateTimeFormat('fr-FR').format(new Date(task.due_date))
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
