type Status = 'todo' | 'in_progress' | 'done'

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  todo:        { label: 'À faire',  className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En cours', className: 'bg-primary/15 text-primary' },
  done:        { label: 'Terminé',  className: 'bg-success/15 text-success-foreground' },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
