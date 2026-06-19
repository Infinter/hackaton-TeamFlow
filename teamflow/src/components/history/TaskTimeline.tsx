import type { Database } from '@/lib/types'

type EventType = Database['public']['Enums']['event_type']

type HistoryRow = {
  id: string
  created_at: string
  event_type: EventType
  old_value: string | null
  new_value: string | null
  note: string | null
  author: { full_name: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
}

const fmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

function eventLabel(row: HistoryRow): string {
  switch (row.event_type) {
    case 'created':
      return 'Tâche créée'
    case 'status_changed':
      return `Statut : ${STATUS_LABEL[row.old_value ?? ''] ?? row.old_value} → ${STATUS_LABEL[row.new_value ?? ''] ?? row.new_value}`
    case 'reassigned':
      return `Réaffecté${row.new_value ? ` à ${row.new_value}` : ''}`
    case 'planned':
      return 'Planification mise à jour'
    case 'progress_note':
      return row.note ?? 'Note de progression'
  }
}

export function TaskTimeline({ history }: { history: HistoryRow[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">Aucun historique pour le moment.</p>
    )
  }

  return (
    <ol className="space-y-3">
      {history.map((row) => (
        <li key={row.id} className="flex gap-3 text-sm">
          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40 ring-2 ring-background" />
          <div className="min-w-0">
            <p className="font-medium leading-snug">{eventLabel(row)}</p>
            {row.event_type === 'progress_note' && row.note && row.note !== eventLabel(row) && (
              <p className="mt-0.5 text-muted-foreground">{row.note}</p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {fmt.format(new Date(row.created_at))}
              {row.author?.full_name ? ` · ${row.author.full_name}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
