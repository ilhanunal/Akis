import { useMemo, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PRIORITIES, PRIORITY_LABEL } from '../types'
import { useTasks } from '../store/tasks'
import { useActivity } from '../store/activity'
import { useHabits } from '../store/habits'
import { dayKey, fmt, lastNDays, weekDays } from '../lib/dates'
import { countByDay, dailySeries, habitAdherence, taskStreak } from '../lib/stats'
import { PageHeader } from '../components/common/PageHeader'

function Stat({ value, label, note }: { value: ReactNode; label: string; note?: string }) {
  return (
    <div className="px-5 py-4 first:pl-0 max-sm:px-0">
      <p className="font-display text-3xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted">{label}</p>
      {note && <p className="mt-0.5 text-xs text-faint">{note}</p>}
    </div>
  )
}

function Panel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

/** Labelled horizontal bar; identity comes from the label, so one hue is enough. */
function MeterRow({ label, value, max, text }: { label: ReactNode; value: number; max: number; text: string }) {
  return (
    <li className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3 text-sm" title={`${typeof label === 'string' ? label : ''} ${text}`}>
      <span className="truncate">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-sunken">
        <span
          className="block h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: max ? `${(value / max) * 100}%` : 0 }}
        />
      </span>
      <span className="text-right tabular-nums text-muted">{text}</span>
    </li>
  )
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: { date: Date; count: number } }[] }) {
  if (!active || !payload?.length) return null
  const { date, count } = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-card">
      <p className="text-muted">{fmt(date, 'd MMMM EEEE')}</p>
      <p className="font-medium">{count} görev tamamlandı</p>
    </div>
  )
}

export function DashboardView() {
  const tasks = useTasks((s) => s.tasks)
  const events = useActivity((s) => s.events)
  const habits = useHabits((s) => s.habits)
  const [range, setRange] = useState<7 | 30>(7)

  const series = useMemo(() => dailySeries(events, 'task_done', range), [events, range])
  const doneByDay = useMemo(() => countByDay(events, 'task_done'), [events])
  const thisWeek = weekDays().reduce((sum, d) => sum + (doneByDay.get(dayKey(d)) ?? 0), 0)
  const totalDone = events.filter((e) => e.type === 'task_done').length
  const streak = taskStreak(events)
  const adherence = habitAdherence(habits, 7)

  const open = tasks.filter((t) => t.status !== 'done')
  const byPriority = PRIORITIES.map((p) => ({ p, n: open.filter((t) => t.priority === p).length }))
  const maxPriority = Math.max(1, ...byPriority.map((x) => x.n))

  const tagStats = useMemo(() => {
    const m = new Map<string, { total: number; done: number }>()
    for (const t of tasks)
      for (const tag of t.tags) {
        const s = m.get(tag) ?? { total: 0, done: 0 }
        s.total++
        if (t.status === 'done') s.done++
        m.set(tag, s)
      }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 6)
  }, [tasks])

  const last30 = lastNDays(30).map((d) => dayKey(d))

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="İlerleme" subtitle="Tamamladıkların burada birikir. Silinen görevler de geçmişte sayılır." />

      <div className="mb-8 grid grid-cols-2 border-y border-line sm:grid-cols-4 sm:divide-x sm:divide-line">
        <Stat value={thisWeek} label="Bu hafta tamamlanan" />
        <Stat value={streak} label="Günlük seri" note={streak ? 'Her gün en az bir görev' : 'Bugün bir görev bitir, seri başlasın'} />
        <Stat value={totalDone} label="Toplam tamamlanan" />
        <Stat
          value={adherence === null ? '–' : `%${Math.round(adherence * 100)}`}
          label="Alışkanlık uyumu"
          note="Son 7 gün"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Günlük tamamlanan görevler"
            actions={
              <div role="radiogroup" aria-label="Zaman aralığı" className="inline-flex rounded-lg bg-sunken p-0.5 text-sm">
                {([7, 30] as const).map((r) => (
                  <button
                    key={r}
                    role="radio"
                    aria-checked={range === r}
                    onClick={() => setRange(r)}
                    className={`rounded-md px-2.5 py-1 ${range === r ? 'bg-surface font-medium shadow-sm' : 'text-muted'}`}
                  >
                    {r} gün
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-60" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap={range === 7 ? '35%' : '20%'}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis
                    dataKey="key"
                    tickFormatter={(k: string) => fmt(k, range === 7 ? 'EEE' : 'd')}
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    interval={range === 7 ? 0 : 4}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--sunken)' }} />
                  <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="sr-only">
              <caption>Son {range} günde günlük tamamlanan görev sayısı</caption>
              <thead>
                <tr>
                  <th>Gün</th>
                  <th>Tamamlanan</th>
                </tr>
              </thead>
              <tbody>
                {series.map((s) => (
                  <tr key={s.key}>
                    <td>{fmt(s.date, 'd MMMM')}</td>
                    <td>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <Panel title="Açık görevler, önceliğe göre">
          {open.length === 0 ? (
            <p className="text-sm text-muted">Açık görev kalmadı.</p>
          ) : (
            <ul className="space-y-3">
              {byPriority.map(({ p, n }) => (
                <MeterRow key={p} label={PRIORITY_LABEL[p]} value={n} max={maxPriority} text={String(n)} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Etiketlere göre ilerleme">
          {tagStats.length === 0 ? (
            <p className="text-sm text-muted">Görevlere etiket ekledikçe burada görünür.</p>
          ) : (
            <ul className="space-y-3">
              {tagStats.map(([tag, s]) => (
                <MeterRow key={tag} label={`#${tag}`} value={s.done} max={s.total} text={`${s.done}/${s.total}`} />
              ))}
            </ul>
          )}
        </Panel>

        <div className="lg:col-span-2">
          <Panel title="Alışkanlıklar, son 30 gün">
            {habits.length === 0 ? (
              <p className="text-sm text-muted">Henüz alışkanlık eklenmedi.</p>
            ) : (
              <ul className="space-y-3">
                {habits.map((h) => {
                  const n = last30.filter((k) => h.log[k]).length
                  return <MeterRow key={h.id} label={`${h.icon} ${h.name}`} value={n} max={30} text={`${n}/30`} />
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
