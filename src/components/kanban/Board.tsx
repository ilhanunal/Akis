import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { STATUSES, STATUS_LABEL, type Status, type Task } from '../../types'
import { byOrder, useTasks } from '../../store/tasks'
import { useUI } from '../../store/ui'
import { Column } from './Column'
import { FlowBar } from './FlowBar'
import { TaskCardBody } from './TaskCard'
import { SharedBoard } from './SharedBoard'
import { useSharedMe } from '../../lib/cloud/shared'

type Columns = Record<Status, string[]>

interface Props {
  /** Tasks shown on this board; new tasks get `defaults` (e.g. a page link). */
  filter?: (t: Task) => boolean
  defaults?: Partial<Task>
  showFlow?: boolean
}

const toColumns = (tasks: Task[]): Columns => {
  const cols: Columns = { todo: [], doing: [], done: [] }
  for (const t of [...tasks].sort(byOrder)) cols[t.status].push(t.id)
  return cols
}

/** The shared workspace gets its own board (one column per person); everywhere else the status board. */
export function Board(props: Props) {
  const me = useSharedMe()
  return me ? <SharedBoard {...props} me={me} /> : <StatusBoard {...props} />
}

function StatusBoard({ filter, defaults, showFlow = true }: Props) {
  const allTasks = useTasks((s) => s.tasks)
  const addTask = useTasks((s) => s.addTask)
  const commitColumns = useTasks((s) => s.commitColumns)
  const toast = useUI((s) => s.toast)

  const tasks = useMemo(() => (filter ? allTasks.filter(filter) : allTasks), [allTasks, filter])
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  // During a drag the board renders from local columns so cards can cross columns before anything is saved.
  const [columns, setColumns] = useState<Columns>(() => toColumns(tasks))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [justDoneId, setJustDoneId] = useState<string | null>(null)
  const startStatus = useRef<Status | null>(null)
  const columnsRef = useRef(columns)
  columnsRef.current = columns
  const lastOverId = useRef<string | null>(null)
  // After a card jumps to another column the layout shifts under the pointer; without this lock the
  // card can be bounced back and forth between columns forever (dnd-kit's multi-container caveat).
  const recentlyMoved = useRef(false)

  useEffect(() => {
    if (!activeId) setColumns(toColumns(tasks))
  }, [tasks, activeId])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      recentlyMoved.current = false
    })
    return () => cancelAnimationFrame(id)
  }, [columns])

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointer = pointerWithin(args)
      let overId = getFirstCollision(pointer.length ? pointer : rectIntersection(args), 'id')
      if (overId != null) {
        const items = columnsRef.current[overId as Status]
        if (items?.length) {
          // Over a column with cards: target the nearest card inside it instead of the column itself.
          overId =
            closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter((c) => items.includes(String(c.id))),
            })[0]?.id ?? overId
        }
        lastOverId.current = String(overId)
        return [{ id: overId }]
      }
      if (recentlyMoved.current && activeId) lastOverId.current = activeId
      return lastOverId.current ? [{ id: lastOverId.current }] : []
    },
    [activeId],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findColumn = (id: string, cols = columns): Status | undefined =>
    (STATUSES as string[]).includes(id) ? (id as Status) : STATUSES.find((s) => cols[s].includes(id))

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
    startStatus.current = findColumn(String(active.id)) ?? null
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || over.id === active.id) return
    const id = String(active.id)
    const from = findColumn(id)
    const to = findColumn(String(over.id))
    if (!from || !to || from === to) return
    const translated = active.rect.current.translated
    const below = !!translated && translated.top > over.rect.top + over.rect.height / 2
    recentlyMoved.current = true
    setColumns((prev) => {
      const overIndex = prev[to].indexOf(String(over.id))
      const index = overIndex === -1 ? prev[to].length : overIndex + (below ? 1 : 0)
      return {
        ...prev,
        [from]: prev[from].filter((x) => x !== id),
        [to]: [...prev[to].slice(0, index), id, ...prev[to].slice(index)],
      }
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id)
    setActiveId(null)
    if (!over) {
      setColumns(toColumns(tasks))
      return
    }
    const col = findColumn(id)
    if (!col) return
    let next = columns
    const from = columns[col].indexOf(id)
    const to = columns[col].indexOf(String(over.id))
    if (to !== -1 && from !== to) next = { ...columns, [col]: arrayMove(columns[col], from, to) }
    setColumns(next)

    const changed: Partial<Columns> = { [col]: next[col] }
    if (startStatus.current && startStatus.current !== col) changed[startStatus.current] = next[startStatus.current]
    commitColumns(changed)

    if (col === 'done' && startStatus.current !== 'done') {
      setJustDoneId(id)
      setTimeout(() => setJustDoneId((cur) => (cur === id ? null : cur)), 800)
      toast('Tamamlandı. Akış ilerliyor.')
    }
  }

  const counts = {
    todo: columns.todo.length,
    doing: columns.doing.length,
    done: columns.done.length,
  }
  const active = activeId ? byId.get(activeId) : undefined

  return (
    <div>
      {showFlow && <FlowBar counts={counts} />}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActiveId(null)
          setColumns(toColumns(tasks))
        }}
        accessibility={{
          screenReaderInstructions: {
            draggable: 'Görevi taşımak için boşluk tuşuna basın, ok tuşlarıyla yer değiştirin, bırakmak için tekrar boşluk tuşuna basın.',
          },
          announcements: {
            onDragStart: ({ active }) => `${byId.get(String(active.id))?.title ?? 'Görev'} taşınıyor.`,
            onDragOver: ({ over }) => (over ? `${STATUS_LABEL[findColumn(String(over.id)) ?? 'todo']} üzerinde.` : ''),
            onDragEnd: ({ over }) => (over ? `${STATUS_LABEL[findColumn(String(over.id)) ?? 'todo']} sütununa bırakıldı.` : 'Bırakıldı.'),
            onDragCancel: () => 'Taşıma iptal edildi.',
          },
        }}
      >
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {STATUSES.map((s) => (
            <Column
              key={s}
              status={s}
              tasks={columns[s].map((id) => byId.get(id)).filter((t): t is Task => !!t)}
              justDoneId={justDoneId}
              onAdd={(title) => addTask({ ...defaults, title, status: s })}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
          {active ? <TaskCardBody task={active} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
