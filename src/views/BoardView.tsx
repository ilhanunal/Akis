import { useCallback, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { PRIORITIES, PRIORITY_LABEL, type Priority, type Task } from '../types'
import { useTasks } from '../store/tasks'
import { Board } from '../components/kanban/Board'
import { PageHeader } from '../components/common/PageHeader'

const selectClass = 'rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink'

export function BoardView() {
  const tasks = useTasks((s) => s.tasks)
  const [q, setQ] = useState('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [tag, setTag] = useState('')

  const tags = useMemo(() => [...new Set(tasks.flatMap((t) => t.tags))].sort((a, b) => a.localeCompare(b, 'tr')), [tasks])
  const active = q || priority || tag

  const filter = useCallback(
    (t: Task) => {
      const query = q.toLocaleLowerCase('tr').trim()
      if (query && !t.title.toLocaleLowerCase('tr').includes(query)) return false
      if (priority && t.priority !== priority) return false
      if (tag && !t.tags.includes(tag)) return false
      return true
    },
    [q, priority, tag],
  )

  return (
    <div>
      <PageHeader
        title="Pano"
        subtitle="Kartları sürükleyerek ilerlet. Ayrıntılar için karta tıkla."
        actions={
          <>
            <label className="relative">
              <span className="sr-only">Görevlerde ara</span>
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ara"
                className={`${selectClass} w-36 pl-7`}
              />
            </label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | '')} className={selectClass} aria-label="Öncelik filtresi">
              <option value="">Tüm öncelikler</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
            {tags.length > 0 && (
              <select value={tag} onChange={(e) => setTag(e.target.value)} className={selectClass} aria-label="Etiket filtresi">
                <option value="">Tüm etiketler</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            )}
            {active && (
              <button
                onClick={() => {
                  setQ('')
                  setPriority('')
                  setTag('')
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-sunken hover:text-ink"
              >
                <X className="size-4" /> Temizle
              </button>
            )}
          </>
        }
      />
      <Board filter={active ? filter : undefined} />
    </div>
  )
}
