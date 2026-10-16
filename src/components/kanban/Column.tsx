import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { STATUS_LABEL, type Status, type Task } from '../../types'
import { SortableTaskCard } from './TaskCard'

export const STATUS_DOT: Record<Status, string> = {
  todo: 'bg-todo',
  doing: 'bg-doing',
  done: 'bg-accent',
}

interface Props {
  status: Status
  tasks: Task[]
  justDoneId: string | null
  onAdd: (title: string) => void
}

export function Column({ status, tasks, justDoneId, onAdd }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column' } })
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')

  const submit = () => {
    if (title.trim()) onAdd(title)
    setTitle('')
  }

  return (
    <section
      aria-label={STATUS_LABEL[status]}
      className="flex w-[82vw] max-w-sm shrink-0 snap-start flex-col sm:w-72 md:w-auto md:max-w-none md:shrink"
    >
      <header className="mb-2 flex items-center gap-2 px-1">
        <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
        <h2 className="text-sm font-semibold">{STATUS_LABEL[status]}</h2>
        <span className="text-sm text-faint tabular-nums">{tasks.length}</span>
        <button
          onClick={() => setAdding(true)}
          className="ml-auto rounded-md p-1 text-muted hover:bg-sunken hover:text-ink"
          aria-label={`${STATUS_LABEL[status]} sütununa görev ekle`}
        >
          <Plus className="size-4" />
        </button>
      </header>
      <div
        ref={setNodeRef}
        className={`flex min-h-32 flex-1 flex-col gap-2 rounded-xl p-1.5 transition-colors ${
          isOver ? 'bg-accent-soft' : 'bg-sunken/60'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <SortableTaskCard key={t.id} task={t} justDone={t.id === justDoneId} />
          ))}
        </SortableContext>
        {adding ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') {
                setTitle('')
                setAdding(false)
              }
            }}
            onBlur={() => {
              submit()
              setAdding(false)
            }}
            placeholder="Görevin adı, Enter ile ekle"
            className="rounded-lg border border-accent bg-surface px-3 py-2.5 text-[14.5px] outline-none placeholder:text-faint"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-sm text-muted hover:bg-surface hover:text-ink"
          >
            <Plus className="size-4" /> Görev ekle
          </button>
        )}
      </div>
    </section>
  )
}
