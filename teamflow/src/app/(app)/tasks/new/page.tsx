import { redirect } from 'next/navigation'
import { requireManager } from '@/lib/auth'
import { TaskForm } from '@/components/tasks/TaskForm'

export default async function NewTaskPage() {
  const guard = await requireManager()
  if (!guard.ok) redirect('/tasks')

  return (
    <section className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold">Nouvelle tâche</h1>
      <TaskForm />
    </section>
  )
}
