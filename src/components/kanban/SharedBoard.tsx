import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Check, ChevronDown, Plus, Undo2 } from 'lucide-react'
import type { Task } from '../../types'
import { PEOPLE, type PersonId } from '../../lib/cloud/config'
import { canMove, otherThan, sharedColumn, type SharedColumn } from '../../lib/cloud/shared'
import { dayKey, fmt, lastNDays } from '../../lib/dates'
import { byOrder, useTasks } from '../../store/tasks'
import { useUI } from '../../store/ui'
import { Avatar } from '../cloud/LoginScreen'
import { FlowBar } from './FlowBar'
import { TaskCardBody } from './TaskCard'

interface Props {
  filter?: (t: Task) => boolean
  defaults?: Partial<Task>
  showFlow?: boolean
  me: PersonId
}

const COLUMNS: { id: SharedColumn; name: string; color: string }[] = [
  { id: 'pool', name: 'Görevler', color: 'var(--faint)' },
  ...PEOPLE.map((p) => ({ id: p.id, name: p.name, color: p.color })),
]

const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length ? hits : rectIntersection(args)
}

/** Marks or unmarks the signed-in person and says what happened. */
function useMove(me: PersonId) {
  const setMark = useTasks((s) => s.setMark)
  const toast = useUI((s) => s.toast)
  const other = otherThan(me)
  return (task: Task, to: SharedColumn) => {
    if (!canMove(task, to, me)) {
      const from = sharedColumn(task)
      if (from !== null && from !== to)
        toast(to === 'pool' ? `Bu kartı yalnızca ${other.name} geri alabilir.` : 'Kartları yalnızca kendi sütununa taşıyabilirsin.')
      return
    }
    const finishing = to === me && !!task.marks?.[other.id]
    setMark(task.id, me, to === me)
    if (to === 'pool') toast('Görevler sütununa geri alındı')
    else if (finishing) toast('İkiniz de tamamladınız. Görev panodan kalktı.')
    else toast(`Senin sütununa taşındı. Sıra ${other.at}.`)
  }
}

function DoneNote({ task }: { task: Task }) {
  const marked = PEOPLE.filter((p) => task.marks?.[p.id])
  if (!marked.length) return <span />
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
      {marked.map((p) => (
        <Avatar key={p.id} name={p.name} color={p.color} size="sm" />
      ))}
      <span>
        {marked.length === 1
          ? `${marked[0].name} yaptı · ${fmt(new Date(task.marks![marked[0].id]), 'd MMM HH:mm')}`
          : 'İkiniz de yaptınız'}
      </span>
    </p>
  )
}

function SharedCard({ task, me, column }: { task: Task; me: PersonId; column: SharedColumn }) {
  const openTask = useUI((s) => s.openTask)
  const move = useMove(me)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  const action = column === me ? { label: 'Geri al', icon: Undo2, to: 'pool' as const } : { label: 'Yaptım', icon: Check, to: me }
  const allowed = canMove(task, action.to, me)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="Sürüklenebilir görev"
      onClick={() => openTask(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') openTask(task.id)
        listeners?.onKeyDown?.(e)
      }}
      className="cursor-grab touch-manipulation rounded-lg active:cursor-grabbing"
    >
      <TaskCardBody
        task={task}
        dragging={isDragging}
        footer={
          <div className="mt-2 flex items-center justify-between gap-2">
            <DoneNote task={task} />
            {allowed && (
              <button
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            move(task, action.to)
          }}
                className="flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-muted hover:border-accent hover:text-accent"
              >
                <action.icon className="size-3.5" /> {action.label}
              </button>
            )}
          </div>
        }
      />
    </div>
  )
}

function Column({
  column,
  tasks,
  me,
  dragging,
  onAdd,
}: {
  column: (typeof COLUMNS)[number]
  tasks: Task[]
  me: PersonId
  dragging: Task | undefined
  onAdd?: (title: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const legal = dragging ? canMove(dragging, column.id, me) : false
  const blocked = dragging && !legal && sharedColumn(dragging) !== column.id

  const submit = () => {
    if (title.trim()) onAdd?.(title)
    setTitle('')
  }

  return (
    <section
      aria-label={column.name}
      className="flex w-[82vw] max-w-sm shrink-0 snap-start flex-col sm:w-72 md:w-auto md:max-w-none md:shrink"
    >
      <header className="mb-2 flex items-center gap-2 px-1">
        <span className="size-2 rounded-full" style={{ background: column.color }} />
        <h2 className="text-sm font-semibold">
          {column.name}
          {column.id === me && <span className="font-normal text-faint"> (sen)</span>}
        </h2>
        <span className="text-sm text-faint tabular-nums">{tasks.length}</span>
        {onAdd && (
          <button
            onClick={() => setAdding(true)}
            className="ml-auto rounded-md p-1 text-muted hover:bg-sunken hover:text-ink"
            aria-label="Görev ekle"
          >
            <Plus className="size-4" />
          </button>
        )}
      </header>
      <div
        ref={setNodeRef}
        className={`flex min-h-32 flex-1 flex-col gap-2 rounded-xl p-1.5 transition-[background-color,opacity] ${
          isOver && legal ? 'bg-accent-soft' : 'bg-sunken/60'
        } ${blocked ? 'opacity-45' : ''}`}
      >
        {tasks.map((t) => (
          <SharedCard key={t.id} task={t} me={me} column={column.id} />
        ))}
        {!tasks.length && !onAdd && (
          <p className="px-2.5 py-2 text-sm text-faint">
            {column.id === me ? 'Yaptığın görevi buraya sürükle.' : `${column.name} bir görevi yapınca burada görünür.`}
          </p>
        )}
        {onAdd &&
          (adding ? (
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
          ))}
      </div>
    </section>
  )
}

/** Tasks both have done: the last 7 days in view, older ones folded away. */
function Finished({ tasks, me }: { tasks: Task[]; me: PersonId }) {
  const openTask = useUI((s) => s.openTask)
  const move = useMove(me)
  const [showOld, setShowOld] = useState(false)
  if (!tasks.length) return null
  const since = dayKey(lastNDays(7)[0])
  const sorted = [...tasks].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const recent = sorted.filter((t) => t.completedAt && dayKey(new Date(t.completedAt)) >= since)
  const old = sorted.filter((t) => !recent.includes(t))

  const row = (t: Task) => (
    <li key={t.id} className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sunken">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-ink" aria-hidden>
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      <button onClick={() => openTask(t.id)} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-muted line-through decoration-faint">{t.title}</span>
      </button>
      {t.completedAt && <span className="shrink-0 text-xs text-faint">{fmt(new Date(t.completedAt), 'd MMM')}</span>}
      <button
        onClick={() => move(t, 'pool')}
        className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted hover:bg-surface hover:text-ink md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        title="Senin işaretini kaldırır; kart diğer kişinin sütununa döner"
      >
        <Undo2 className="size-3.5" /> Geri al
      </button>
    </li>
  )

  return (
    <section className="mt-8" aria-label="İkinizin tamamladığı görevler">
      <h2 className="mb-2 px-1 text-sm font-semibold">
        İkiniz de tamamladınız <span className="font-normal text-faint">· son 7 gün</span>
      </h2>
      {recent.length ? <ul>{recent.map(row)}</ul> : <p className="px-2 text-sm text-faint">Son 7 günde ikinizin bitirdiği görev yok.</p>}
      {old.length > 0 && (
        <>
          <button
            onClick={() => setShowOld(!showOld)}
            aria-expanded={showOld}
            className="mt-1 flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-sunken hover:text-ink"
          >
            <ChevronDown className={`size-4 transition-transform ${showOld ? 'rotate-180' : ''}`} />
            Daha eski ({old.length})
          </button>
          {showOld && <ul>{old.map(row)}</ul>}
        </>
      )}
    </section>
  )
}

export function SharedBoard({ filter, defaults, showFlow = true, me }: Props) {
  const allTasks = useTasks((s) => s.tasks)
  const addTask = useTasks((s) => s.addTask)
  const move = useMove(me)
  const [activeId, setActiveId] = useState<string | null>(null)

  const tasks = useMemo(() => (filter ? allTasks.filter(filter) : allTasks), [allTasks, filter])
  const grouped = useMemo(() => {
    const g: Record<SharedColumn, Task[]> = { pool: [], ilhan: [], sedef: [] }
    const finished: Task[] = []
    for (const t of tasks) {
      const col = sharedColumn(t)
      if (col) g[col].push(t)
      else finished.push(t)
    }
    g.pool.sort(byOrder)
    // In a person's column the most recently done comes first.
    for (const p of PEOPLE) g[p.id].sort((a, b) => (b.marks?.[p.id] ?? '').localeCompare(a.marks?.[p.id] ?? ''))
    return { ...g, finished }
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )
  const active = activeId ? tasks.find((t) => t.id === activeId) : undefined
  const half = grouped.ilhan.length + grouped.sedef.length

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    const task = tasks.find((t) => t.id === active.id)
    if (task && over) move(task, over.id as SharedColumn)
  }

  return (
    <div>
      {showFlow && (
        <FlowBar
          counts={{ todo: grouped.pool.length, doing: half, done: grouped.finished.length }}
          labels={{ todo: 'Kimsenin yapmadığı', doing: 'Birinizin yaptığı', done: 'İkinizin yaptığı' }}
        />
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={({ active }) => setActiveId(String(active.id))}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{
          screenReaderInstructions: {
            draggable: 'Görevi taşımak için boşluk tuşuna basın, ok tuşlarıyla sütun seçin, bırakmak için tekrar boşluk tuşuna basın.',
          },
          announcements: {
            onDragStart: ({ active }) => `${tasks.find((t) => t.id === active.id)?.title ?? 'Görev'} taşınıyor.`,
            onDragOver: ({ over }) => (over ? `${COLUMNS.find((c) => c.id === over.id)?.name} üzerinde.` : ''),
            onDragEnd: ({ over }) => (over ? `${COLUMNS.find((c) => c.id === over.id)?.name} sütununa bırakıldı.` : 'Bırakıldı.'),
            onDragCancel: () => 'Taşıma iptal edildi.',
          },
        }}
      >
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {COLUMNS.map((c) => (
            <Column
              key={c.id}
              column={c}
              tasks={grouped[c.id]}
              me={me}
              dragging={active}
              onAdd={c.id === 'pool' ? (title) => addTask({ ...defaults, title, status: 'todo' }) : undefined}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
          {active ? <TaskCardBody task={active} overlay /> : null}
        </DragOverlay>
      </DndContext>
      <Finished tasks={grouped.finished} me={me} />
    </div>
  )
}

