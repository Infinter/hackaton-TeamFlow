'use client'

import { useOptimistic, useTransition } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { toast } from 'sonner'
import { reassignTask } from '@/app/(app)/board/actions'
import { DroppableColumn, BoardTask } from './DroppableColumn'

type Collaborator = {
  id: string
  full_name: string
}

interface Props {
  tasks: BoardTask[]
  collaborators: Collaborator[]
  isManager: boolean
}

const UNASSIGNED_ID = 'unassigned'

export function TaskBoard({ tasks, collaborators, isManager }: Props) {
  const [isPending, startTransition] = useTransition()

  const [optimisticTasks, applyOptimistic] = useOptimistic(
    tasks,
    (
      current: BoardTask[],
      { taskId, newAssigneeId }: { taskId: string; newAssigneeId: string | null },
    ) => current.map((t) => (t.id === taskId ? { ...t, assignee_id: newAssigneeId } : t)),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const newAssigneeId = over.id === UNASSIGNED_ID ? null : (over.id as string)
    const task = optimisticTasks.find((t) => t.id === taskId)
    if (!task || task.assignee_id === newAssigneeId) return

    startTransition(async () => {
      applyOptimistic({ taskId, newAssigneeId })
      const result = await reassignTask(taskId, newAssigneeId)
      if (!result.ok) toast.error(result.error)
    })
  }

  const tasksByCollaborator: Record<string, BoardTask[]> = Object.fromEntries(
    collaborators.map((c) => [c.id, []]),
  )
  const unassigned: BoardTask[] = []

  for (const task of optimisticTasks) {
    if (task.assignee_id && task.assignee_id in tasksByCollaborator) {
      tasksByCollaborator[task.assignee_id].push(task)
    } else {
      unassigned.push(task)
    }
  }

  return (
    <DndContext onDragEnd={isManager ? handleDragEnd : undefined}>
      <div
        className={[
          'flex gap-4 overflow-x-auto pb-4',
          isPending ? 'pointer-events-none opacity-75' : '',
        ].join(' ')}
      >
        <DroppableColumn
          id={UNASSIGNED_ID}
          label="Non assigné"
          tasks={unassigned}
          isManager={isManager}
        />
        {collaborators.map((c) => (
          <DroppableColumn
            key={c.id}
            id={c.id}
            label={c.full_name}
            tasks={tasksByCollaborator[c.id] ?? []}
            isManager={isManager}
          />
        ))}
      </div>
    </DndContext>
  )
}
