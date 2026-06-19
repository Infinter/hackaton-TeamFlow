'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'

type Profile = { id: string; full_name: string }

const selectClass =
  'rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring'

export function TaskFilters({ profiles }: { profiles: Profile[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={searchParams.get('status') ?? ''}
        onChange={(e) => updateFilter('status', e.target.value)}
        className={selectClass}
        aria-label="Filtrer par statut"
      >
        <option value="">Tous les statuts</option>
        <option value="todo">À faire</option>
        <option value="in_progress">En cours</option>
        <option value="done">Terminé</option>
      </select>

      <select
        value={searchParams.get('assignee') ?? ''}
        onChange={(e) => updateFilter('assignee', e.target.value)}
        className={selectClass}
        aria-label="Filtrer par assigné"
      >
        <option value="">Tous les assignés</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('priority') ?? ''}
        onChange={(e) => updateFilter('priority', e.target.value)}
        className={selectClass}
        aria-label="Filtrer par priorité"
      >
        <option value="">Toutes les priorités</option>
        <option value="low">Faible</option>
        <option value="medium">Moyenne</option>
        <option value="high">Haute</option>
      </select>

      <input
        type="date"
        value={searchParams.get('due_before') ?? ''}
        onChange={(e) => updateFilter('due_before', e.target.value)}
        className={selectClass}
        title="Échéance avant le"
        aria-label="Échéance avant le"
      />
    </div>
  )
}
