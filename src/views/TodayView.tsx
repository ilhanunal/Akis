import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { useTasks } from '../store/tasks'
import { useHabits } from '../store/habits'
import { useSettings } from '../store/settings'
import { useCloud } from '../store/cloud'
import { PEOPLE, WORKSPACES } from '../lib/cloud/config'
import { useUI } from '../store/ui'
import { dayKey, fmt, greeting, isOverdue, todayKey } from '../lib/dates'
import { habitStreak } from '../lib/stats'
import { ProgressRing } from '../components/common/ProgressRing'
import { TaskRow } from '../components/common/TaskRow'

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-1 flex items-baseline gap-2 px-2 text-sm font-semibold">
        {title}
        {count !== undefined && <span className="font-normal text-faint tabular-nums">{count}</span>}
      </h2>
      {children}
    </section>
  )
}

export function TodayView() {
  const tasks = useTasks((s) => s.tasks)
  const addTask = useTasks((s) => s.addTask)
  const habits = useHabits((s) => s.habits)
  const toggleHabit = useHabits((s) => s.toggleToday)
  const localName = useSettings((s) => s.name)
  const person = useCloud((s) => s.person)
  const workspace = useCloud((s) => s.workspace)
  const name = PEOPLE.find((p) => p.id === person)?.name ?? localName
  const viewing = workspace && workspace !== person ? WORKSPACES.find((w) => w.id === workspace) : undefined
  const toast = useUI((s) => s.toast)
  const [draft, setDraft] = useState('')

  const today = todayKey()
  const completedToday = (iso?: string) => !!iso && dayKey(new Date(iso)) === today
  const overdue = tasks.filter((t) => t.status !== 'done' && isOverdue(t.dueDate))
  const dueToday = tasks
    .filter((t) => t.dueDate === today || (t.status === 'done' && completedToday(t.completedAt)))
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
  const inProgress = tasks.filter((t) => t.status === 'doing' && t.dueDate !== today && !isOverdue(t.dueDate))

  const doneCount = dueToday.filter((t) => t.status === 'done').length
  const habitsDone = habits.filter((h) => h.log[today]).length
  const total = dueToday.length + habits.length
  const progress = total ? (doneCount + habitsDone) / total : 0

  const add = () => {
    if (!draft.trim()) return
    addTask({ title: draft, dueDate: today })
    setDraft('')
    toast('Bugüne eklendi')
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="text-muted">{fmt(new Date(), 'd MMMM, EEEE')}</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {greeting()}
          {name ? `, ${name}` : ''}
        </h1>
        {viewing && (
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <span className="size-2 rounded-full" style={{ background: viewing.color }} aria-hidden />
            {viewing.title} gösteriliyor
          </p>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 focus-within:border-accent">
            <Plus className="size-5 text-faint" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="Bugün ne yapacaksın?"
              aria-label="Bugüne görev ekle"
              className="w-full bg-transparent py-1 outline-none placeholder:text-faint"
            />
            {draft && (
              <button onClick={add} className="shrink-0 rounded-md bg-accent px-3 py-1 text-sm font-medium text-accent-ink">
                Ekle
              </button>
            )}
          </div>

          {overdue.length > 0 && (
            <Section title="Gecikenler" count={overdue.length}>
              <ul>
                {overdue.map((t) => (
                  <TaskRow key={t.id} task={t} showDue />
                ))}
              </ul>
            </Section>
          )}

          <Section title="Bugün" count={dueToday.length}>
            {dueToday.length ? (
              <ul>
                {dueToday.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </ul>
            ) : (
              <p className="px-2 py-3 text-sm text-muted">
                Bugüne ait görev yok. Yukarıdan ekleyebilir ya da <Link to="/pano" className="text-accent hover:underline">panodan</Link> bir görev seçebilirsin.
              </p>
            )}
          </Section>

          {inProgress.length > 0 && (
            <Section title="Devam edenler" count={inProgress.length}>
              <ul>
                {inProgress.map((t) => (
                  <TaskRow key={t.id} task={t} showDue />
                ))}
              </ul>
            </Section>
          )}
        </div>

        <aside className="space-y-8">
          <div className="flex items-center gap-5">
            <ProgressRing value={progress} />
            <div className="text-sm">
              <p className="font-semibold">Günün akışı</p>
              <p className="text-muted">
                {total === 0
                  ? 'Bugün için plan yok.'
                  : `${doneCount + habitsDone} / ${total} tamamlandı`}
              </p>
            </div>
          </div>

          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Alışkanlıklar</h2>
              <Link to="/aliskanliklar" className="text-xs text-muted hover:text-ink">
                Tümü
              </Link>
            </div>
            {habits.length === 0 ? (
              <Link to="/aliskanliklar" className="text-sm text-accent hover:underline">
                İlk alışkanlığını ekle
              </Link>
            ) : (
              <ul className="space-y-1">
                {habits.map((h) => {
                  const done = !!h.log[today]
                  const s = habitStreak(h)
                  return (
                    <li key={h.id}>
                      <button
                        role="checkbox"
                        aria-checked={done}
                        onClick={() => toggleHabit(h.id)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-sunken"
                      >
                        <span
                          className="grid size-7 shrink-0 place-items-center rounded-lg border-[1.5px] text-sm transition-colors"
                          style={done ? { background: h.color, borderColor: h.color, color: '#fff' } : { borderColor: 'var(--line)' }}
                        >
                          {done ? <Check className="size-4" strokeWidth={3} /> : h.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{h.name}</span>
                          <span className="text-xs text-muted">{s > 0 ? `${s} günlük seri` : 'Seri yok'}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
