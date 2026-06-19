import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth'

export default async function TasksPage() {
  const profile = await getCurrentProfile()
  const isManager = profile?.role === 'manager'

  return (
    <section className="space-y-4">
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
      <p className="text-sm text-muted-foreground">
        Portefeuille filtrable — Story 1.4.
      </p>
    </section>
  )
}
