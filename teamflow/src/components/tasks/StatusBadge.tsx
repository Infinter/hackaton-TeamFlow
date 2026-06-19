type Status = 'todo' | 'in_progress' | 'done'

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  todo:        { label: 'À faire',  className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  done:        { label: 'Terminé',  className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
