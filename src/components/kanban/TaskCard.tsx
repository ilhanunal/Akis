import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays, ListChecks } from 'lucide-react'
import type { Task } from '../../types'
import { dueLabel, isOverdue } from '../../lib/dates'
import { usePages } from '../../store/pages'
import { useUI } from '../../store/ui'

interface BodyProps {
  task: Task
  dragging?: boolean
  overlay?: boolean
  justDone?: boolean
}

export function TaskCardBody({ task, dragging, overlay, justDone }: BodyProps) {
  const page = usePages((s) => (task.pageId ? s.pages.find((p) => p.id === task.pageId) : undefined))
  const done = task.status === 'done'
  const subDone = task.subtasks.filter((s) => s.done).length
  const overdue = !done && isOverdue(task.dueDate)

  return (
    <div
      className={`group rounded-lg border bg-surface px-3 py-2.5 text-left ${
        overlay ? 'rotate-[1.5deg] border-accent shadow-card' : 'border-line hover:border-faint'
      } ${dragging ? 'opacity-40' : ''} ${justDone ? 'just-done' : ''}`}
    >
      <div className="flex items-start gap-2">
        {task.priority === 'yüksek' && !done && (
          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-danger" title="Yüksek öncelik" />
        )}
        <p className={`text-[14.5px] leading-snug ${done ? 'text-muted line-through decoration-faint' : ''}`}>{task.title}</p>
      </div>
      {(task.dueDate || task.subtasks.length > 0 || task.tags.length > 0 || page) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 ${overdue ? 'font-medium text-danger' : ''}`}>
              <CalendarDays className="size-3.5" />
              {dueLabel(task.dueDate)}
            </span>
          )}
          {task.subtasks.length > 0 && (
            <span className={`inline-flex items-center gap-1 ${subDone === task.subtasks.length ? 'text-accent' : ''}`}>
              <ListChecks className="size-3.5" />
              {subDone}/{task.subtasks.length}
            </span>
          )}
          {page && (
            <span className="inline-flex max-w-32 items-center gap-1 truncate">
              <span>{page.icon}</span>
              <span className="truncate">{page.title || 'Adsız sayfa'}</span>
            </span>
          )}
          {task.tags.map((t) => (
            <span key={t} className="text-faint">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function SortableTaskCard({ task, justDone }: { task: Task; justDone?: boolean }) {
  const openTask = useUI((s) => s.openTask)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' },
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-roledescription="Sürüklenebilir görev"
      onClick={() => openTask(task.id)}
      onKeyDown={(e) => {
        // Space/arrow keys belong to dnd-kit's keyboard sensor; Enter opens the task.
        if (e.key === 'Enter') openTask(task.id)
        listeners?.onKeyDown?.(e)
      }}
      className="cursor-grab touch-manipulation rounded-lg active:cursor-grabbing"
    >
      <TaskCardBody task={task} dragging={isDragging} justDone={justDone} />
    </div>
  )
}
