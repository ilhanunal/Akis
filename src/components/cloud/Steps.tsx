import { useEffect, useState } from 'react'
import { addDays } from 'date-fns'
import { Footprints } from 'lucide-react'
import { PEOPLE } from '../../lib/cloud/config'
import { personOf } from '../../lib/cloud/shared'
import { removeRow, saveRow } from '../../lib/cloud/garden'
import { dayKey, fmt, lastNDays, weekDays } from '../../lib/dates'
import { useGarden, useStepsOf } from '../../store/garden'
import { Avatar } from './LoginScreen'

const num = (n: number) => n.toLocaleString('tr-TR')

/** Seven thin day bars for one person, scaled to `max`. */
function WeekBars({ byDay, color, max }: { byDay: Map<string, number>; color: string; max: number }) {
  const days = lastNDays(7)
  return (
    <div>
      <div className="flex h-16 items-end gap-1.5" aria-hidden>
        {days.map((d) => {
          const n = byDay.get(dayKey(d)) ?? 0
          return (
            <div key={dayKey(d)} className="flex h-full flex-1 items-end" title={`${fmt(d, 'd MMMM EEEE')}: ${num(n)} adım`}>
              <div
                className="w-full rounded-t-[4px] transition-[height] duration-500"
                style={{ height: n ? `${Math.max(4, (n / max) * 100)}%` : '2px', background: n ? color : 'var(--line)' }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-1.5 text-center text-[11px] text-faint" aria-hidden>
        {days.map((d) => (
          <span key={dayKey(d)} className="flex-1">
            {fmt(d, 'EEEEEE')}
          </span>
        ))}
      </div>
    </div>
  )
}

const average = (byDay: Map<string, number>) => {
  const vals = lastNDays(7)
    .map((d) => byDay.get(dayKey(d)))
    .filter((n): n is number => n !== undefined)
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
}

/** Today screen of a personal workspace: its owner logs steps here; the other person can look. */
export function StepsCard({ owner, me }: { owner: string; me: string }) {
  const ready = useGarden((s) => s.ready)
  const byDay = useStepsOf(owner)
  const person = personOf(owner)!
  const editable = owner === me
  const [which, setWhich] = useState<'today' | 'yesterday'>('today')
  const date = dayKey(which === 'today' ? new Date() : addDays(new Date(), -1))
  const stored = byDay.get(date)
  const [draft, setDraft] = useState('')

  // Show the saved value whenever the day changes or the other device updates it.
  useEffect(() => setDraft(stored !== undefined ? String(stored) : ''), [stored, date])

  const commit = () => {
    const digits = draft.replace(/\D/g, '')
    const count = digits ? Math.min(Number(digits), 200000) : null
    if (count === (stored ?? null)) return setDraft(stored !== undefined ? String(stored) : '')
    const id = `steps-${owner}-${date}`
    if (count === null) void removeRow(id)
    else void saveRow(owner, 'steps', { id, date, count, updatedAt: new Date().toISOString() })
  }

  const max = Math.max(1, ...lastNDays(7).map((d) => byDay.get(dayKey(d)) ?? 0))
  const avg = average(byDay)
  const today = byDay.get(dayKey())

  return (
    <section aria-labelledby={`steps-${owner}`}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id={`steps-${owner}`} className="flex items-center gap-1.5 text-sm font-semibold">
          <Footprints className="size-4 text-muted" /> Adımlar
        </h2>
        {editable && (
          <div role="radiogroup" aria-label="Gün" className="inline-flex rounded-md bg-sunken p-0.5 text-xs">
            {(
              [
                ['today', 'Bugün'],
                ['yesterday', 'Dün'],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                role="radio"
                aria-checked={which === v}
                onClick={() => setWhich(v)}
                className={`rounded px-2 py-0.5 ${which === v ? 'bg-surface font-medium shadow-sm' : 'text-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {!ready ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : (
        <>
          {editable ? (
            <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 focus-within:border-accent">
              <span className="sr-only">{which === 'today' ? 'Bugünkü' : 'Dünkü'} adım sayısı</span>
              <input
                value={draft}
                inputMode="numeric"
                onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ''))}
                onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="0"
                className="w-full min-w-0 bg-transparent font-display text-2xl font-semibold tabular-nums outline-none placeholder:text-faint"
              />
              <span className="shrink-0 text-sm text-muted">adım</span>
            </label>
          ) : (
            <p className="font-display text-2xl font-semibold tabular-nums">
              {today !== undefined ? `${num(today)} adım` : <span className="text-base font-normal text-muted">{person.name} bugün henüz adım girmedi.</span>}
            </p>
          )}
          <div className="mt-3">
            <WeekBars byDay={byDay} color={person.color} max={max} />
          </div>
          <p className="mt-2 text-xs text-muted">{avg !== null ? `Son 7 gün ortalaması: ${num(avg)} adım` : 'Son 7 günde kayıt yok.'}</p>
        </>
      )}
    </section>
  )
}

/** Shared Today screen: both people's steps side by side. */
export function StepsCompare() {
  const ready = useGarden((s) => s.ready)
  const a = useStepsOf(PEOPLE[0].id)
  const b = useStepsOf(PEOPLE[1].id)
  const data = [
    { person: PEOPLE[0], byDay: a },
    { person: PEOPLE[1], byDay: b },
  ]
  const today = dayKey()
  const week = weekDays().filter((d) => dayKey(d) <= today)
  const rows = data.map(({ person, byDay }) => ({
    person,
    byDay,
    today: byDay.get(today),
    week: week.reduce((sum, d) => sum + (byDay.get(dayKey(d)) ?? 0), 0),
  }))
  const maxToday = Math.max(1, ...rows.map((r) => r.today ?? 0))
  const days = lastNDays(7)
  const max7 = Math.max(1, ...days.flatMap((d) => rows.map((r) => r.byDay.get(dayKey(d)) ?? 0)))

  const [x, y] = rows
  const lead =
    x.today === undefined && y.today === undefined
      ? 'Bugün henüz adım girilmedi.'
      : (x.today ?? 0) === (y.today ?? 0)
        ? 'Bugün berabere.'
        : (() => {
            const [w, l] = (x.today ?? 0) > (y.today ?? 0) ? [x, y] : [y, x]
            return `Bugün ${w.person.name} önde, ${num((w.today ?? 0) - (l.today ?? 0))} adım farkla.`
          })()

  return (
    <section aria-labelledby="steps-compare">
      <h2 id="steps-compare" className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <Footprints className="size-4 text-muted" /> Adımlar
      </h2>
      {!ready ? (
        <p className="text-sm text-muted">Yükleniyor…</p>
      ) : (
        <>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.person.id}>
                <div className="flex items-center gap-2 text-sm">
                  <Avatar name={r.person.name} color={r.person.color} size="sm" />
                  <span className="font-medium">{r.person.name}</span>
                  <span className="ml-auto font-display text-lg font-semibold tabular-nums">
                    {r.today !== undefined ? num(r.today) : <span className="text-sm font-normal text-faint">girilmedi</span>}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${((r.today ?? 0) / maxToday) * 100}%`, background: r.person.color }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">Bu hafta {num(r.week)} adım</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">{lead}</p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
              <span>Son 7 gün</span>
              <span className="flex gap-3">
                {rows.map((r) => (
                  <span key={r.person.id} className="flex items-center gap-1">
                    <span className="size-2 rounded-full" style={{ background: r.person.color }} aria-hidden />
                    {r.person.name}
                  </span>
                ))}
              </span>
            </div>
            <div className="flex h-24 items-end gap-2" aria-hidden>
              {days.map((d) => (
                <div key={dayKey(d)} className="flex h-full flex-1 items-end gap-[2px]">
                  {rows.map((r) => {
                    const n = r.byDay.get(dayKey(d)) ?? 0
                    return (
                      <div
                        key={r.person.id}
                        title={`${r.person.name}, ${fmt(d, 'd MMMM')}: ${num(n)} adım`}
                        className="flex-1 rounded-t-[4px] transition-[height] duration-500"
                        style={{ height: n ? `${Math.max(4, (n / max7) * 100)}%` : '2px', background: n ? r.person.color : 'var(--line)' }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-2 text-center text-[11px] text-faint" aria-hidden>
              {days.map((d) => (
                <span key={dayKey(d)} className="flex-1">
                  {fmt(d, 'EEEEEE')}
                </span>
              ))}
            </div>
            <table className="sr-only">
              <caption>Son 7 günün adım sayıları</caption>
              <thead>
                <tr>
                  <th>Gün</th>
                  {rows.map((r) => (
                    <th key={r.person.id}>{r.person.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={dayKey(d)}>
                    <td>{fmt(d, 'd MMMM')}</td>
                    {rows.map((r) => (
                      <td key={r.person.id}>{num(r.byDay.get(dayKey(d)) ?? 0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
