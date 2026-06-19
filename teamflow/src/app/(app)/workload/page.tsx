import { redirect } from 'next/navigation'
import { requireManager } from '@/lib/auth'

export default async function WorkloadPage() {
  const guard = await requireManager()
  if (!guard.ok) redirect('/dashboard')

  return (
    <section className="space-y-2">
      <h1 className="text-xl font-semibold">Charge</h1>
      <p className="text-sm text-muted-foreground">
        Charge agrégée par collaborateur — Épique 3 (Story 3.1).
      </p>
    </section>
  )
}
