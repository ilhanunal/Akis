import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Task } from '../types'
import { useTasks } from '../store/tasks'
import { useUI } from '../store/ui'
import { dayKey, fmt, todayKey } from '../lib/dates'
import { PageHeader } from '../components/common/PageHeader'
import { TaskRow } from '../components/common/TaskRow'

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const UNDATED = 'undated'

const chipTone = (t: Task) =>
  t.status === 'done'
    ? 'bg-accent-soft text-muted line-through decoration-faint'
    : t.status === 'doing'
      ? 'bg-doing-soft text-ink'
      : 'bg-sunken text-ink'

function Chip({ task, overlay }: { task: Task; overlay?: boolean }) {
  const openTask = useUI((s) => s.openTask)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, disabled: overlay })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        openTask(task.id)
      }}
      className={`cursor-grab truncate rounded px-1.5 py-0.5 text-xs ${chipTone(task)} ${isDragging ? 'opacity-30' : ''} ${
        overlay ? 'shadow-card ring-1 ring-accent' : ''
      }`}
      title={task.title}
    >
      {task.priority === 'yüksek' && task.status !== 'done' && <span className="mr-1 inline-block size-1.5 rounded-full bg-danger align-middle" />}
      {task.title}
    </div>
  )
}

interface DayProps {
  date: Date
  tasks: Task[]
  inMonth: boolean
  selected: boolean
  onSelect: () => void
}

function Day({ date, tasks, inMonth, selected, onSelect }: DayProps) {
  const key = dayKey(date)
  const { setNodeRef, isOver } = useDroppable({ id: key })
  const addTask = useTasks((s) => s.addTask)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState(false)
  const isToday = key === todayKey()
  const shown = expanded ? tasks : tasks.slice(0, 3)

  const submit = () => {
    if (draft.trim()) addTask({ title: draft, dueDate: key })
    setDraft('')
    setAdding(false)
  }

  return (
    <div
      ref={setNodeRef}
      onClick={() => {
        onSelect()
        if (window.matchMedia('(min-width: 768px)').matches) setAdding(true)
      }}
      className={`group relative flex min-h-16 cursor-pointer flex-col gap-1 border-b border-r border-line p-1 md:min-h-28 md:p-1.5 ${
        inMonth ? 'bg-surface' : 'bg-bg'
      } ${isOver ? '!bg-accent-soft' : ''} ${selected ? 'max-md:ring-2 max-md:ring-inset max-md:ring-accent' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`grid size-6 place-items-center rounded-full text-xs tabular-nums ${
            isToday ? 'bg-accent font-semibold text-accent-ink' : inMonth ? 'text-ink' : 'text-faint'
          }`}
        >
          {date.getDate()}
        </span>
        <Plus className="hidden size-3.5 text-faint opacity-0 group-hover:opacity-100 md:block" aria-hidden />
      </div>
      {/* Phones get dots; the selected day's list appears under the grid. */}
      <div className="flex flex-wrap gap-0.5 md:hidden">
        {tasks.map((t) => (
          <span key={t.id} className={`size-1.5 rounded-full ${t.status === 'done' ? 'bg-accent' : t.status === 'doing' ? 'bg-doing' : 'bg-todo'}`} />
        ))}
      </div>
      <div className="hidden flex-col gap-1 md:flex">
        {shown.map((t) => (
          <Chip key={t.id} task={t} />
        ))}
        {tasks.length > 3 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
            className="text-left text-xs text-muted hover:text-ink"
          >
            {expanded ? 'Daha az' : `+${tasks.length - 3} daha`}
          </button>
        )}
        {adding && (
          <input
            autoFocus
            value={draft}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') {
                setDraft('')
                setAdding(false)
              }
            }}
            onBlur={submit}
            placeholder="Görev"
            aria-label={`${fmt(date, 'd MMMM')} için görev ekle`}
            className="w-full rounded border border-accent bg-surface px-1.5 py-0.5 text-xs outline-none"
          />
        )}
      </div>
    </div>
  )
}

function UndatedList({ tasks }: { tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: UNDATED })
  return (
    <aside ref={setNodeRef} className={`rounded-xl border border-line p-3 transition-colors ${isOver ? 'bg-accent-soft' : 'bg-surface'}`}>
      <h2 className="text-sm font-semibold">Tarihsiz görevler</h2>
      <p className="mb-3 text-xs text-muted">Bir güne sürükleyerek tarih ver. Buraya bırakınca tarih kalkar.</p>
      {tasks.length === 0 ? (
        <p className="text-sm text-faint">Tüm açık görevlerin tarihli.</p>
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          {tasks.map((t) => (
            <Chip key={t.id} task={t} />
          ))}
        </div>
      )}
    </aside>
  )
}

export function CalendarView() {
  const tasks = useTasks((s) => s.tasks)
  const updateTask = useTasks((s) => s.updateTask)
  const addTask = useTasks((s) => s.addTask)
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(todayKey())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
      }),
    [cursor],
  )
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) if (t.dueDate) m.set(t.dueDate, [...(m.get(t.dueDate) ?? []), t])
    for (const list of m.values()) list.sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
    return m
  }, [tasks])
  const undated = tasks.filter((t) => !t.dueDate && t.status !== 'done')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return
    updateTask(String(active.id), { dueDate: over.id === UNDATED ? undefined : String(over.id) })
  }

  const active = activeId ? tasks.find((t) => t.id === activeId) : undefined
  const selectedTasks = byDay.get(selected) ?? []

  return (
    <div>
      <PageHeader
        title={fmt(cursor, 'LLLL yyyy')}
        subtitle="Görevleri günler arasında sürükleyerek yeniden planla."
        actions={
          <div className="flex items-center gap-1">
            <button onClick={() => setCursor((c) => addMonths(c, -1))} className="rounded-md p-1.5 hover:bg-sunken" aria-label="Önceki ay">
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => {
                setCursor(startOfMonth(new Date()))
                setSelected(todayKey())
              }}
              className="rounded-md border border-line px-3 py-1 text-sm hover:bg-sunken"
            >
              Bugün
            </button>
            <button onClick={() => setCursor((c) => addMonths(c, 1))} className="rounded-md p-1.5 hover:bg-sunken" aria-label="Sonraki ay">
              <ChevronRight className="size-5" />
            </button>
          </div>
        }
      />
      <DndContext sensors={sensors} onDragStart={({ active }) => setActiveId(String(active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="grid gap-4 xl:grid-cols-[1fr_15rem]">
          <div className="overflow-hidden rounded-xl border-l border-t border-line">
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((d) => (
                <div key={d} className="border-b border-r border-line bg-bg py-1.5 text-center text-xs font-medium text-muted">
                  {d}
                </div>
              ))}
              {days.map((d) => (
                <Day
                  key={dayKey(d)}
                  date={d}
                  inMonth={isSameMonth(d, cursor)}
                  tasks={byDay.get(dayKey(d)) ?? []}
                  selected={selected === dayKey(d)}
                  onSelect={() => setSelected(dayKey(d))}
                />
              ))}
            </div>
          </div>
          <div className="hidden xl:block">
            <UndatedList tasks={undated} />
          </div>
        </div>
        <DragOverlay>{active ? <Chip task={active} overlay /> : null}</DragOverlay>
      </DndContext>

      <section className="mt-6 md:hidden">
        <h2 className="mb-1 px-2 text-sm font-semibold">{fmt(selected, 'd MMMM, EEEE')}</h2>
        {selectedTasks.length > 0 ? (
          <ul>
            {selectedTasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ul>
        ) : (
          <p className="px-2 py-2 text-sm text-muted">Bu güne görev yok.</p>
        )}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              addTask({ title: draft, dueDate: selected })
              setDraft('')
            }
          }}
          placeholder="Bu güne görev ekle"
          className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </section>
    </div>
  )
}
