'use client'

import Link from 'next/link'
import { useDraggable, useDroppable } from '@dnd-kit/core'

export type BoardTask = {
  id: string
  title: string
  assignee_id: string | null
  status: string
  priority: string
}

function DraggableTaskCard({ task, disabled }: { task: BoardTask; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={[
        'rounded border bg-card p-3 shadow-sm select-none',
        isDragging ? 'opacity-40 shadow-lg' : '',
        disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
      ].join(' ')}
    >
      <Link
        href={`/tasks/${task.id}`}
        className="block text-sm font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {task.title}
      </Link>
      <p className="mt-1 text-xs capitalize text-muted-foreground">
        {task.status.replace('_', ' ')} · {task.priority}
      </p>
    </div>
  )
}

interface Props {
  id: string
  label: string
  tasks: BoardTask[]
  isManager: boolean
}

export function DroppableColumn({ id, label, tasks, isManager }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex w-56 shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={[
          'min-h-32 rounded-lg border-2 p-2 space-y-2 transition-colors',
          isOver ? 'border-primary bg-primary/5' : 'border-dashed border-muted-foreground/30 bg-muted/30',
        ].join(' ')}
      >
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} disabled={!isManager} />
        ))}
        {tasks.length === 0 && (
          <p className="pt-4 text-center text-xs text-muted-foreground">Vide</p>
        )}
      </div>
    </div>
  )
}
