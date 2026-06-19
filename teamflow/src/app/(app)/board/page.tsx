import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import { TaskBoard } from '@/components/board/TaskBoard'

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
      .select('id, full_name')
      .eq('role', 'collaborator')
      .order('full_name', { ascending: true }),
    getCurrentProfile(),
  ])

  const isManager = profile?.role === 'manager'

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">Tableau d&apos;affectation</h1>
        {!isManager && (
          <span className="text-xs text-muted-foreground">Vue lecture seule</span>
        )}
      </div>

      {(tasks ?? []).length === 0 ? (
        <p className="rounded border px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune tâche dans le portefeuille.
        </p>
      ) : (
        <TaskBoard
          tasks={tasks ?? []}
          collaborators={collaborators ?? []}
          isManager={isManager}
        />
      )}
    </section>
  )
}
