import { useState } from 'react'
import { addMonths, addWeeks, eachDayOfInterval, endOfMonth, isSameMonth, startOfMonth } from 'date-fns'
import { Check, ChevronLeft, ChevronRight, Flame, Plus, Trash2 } from 'lucide-react'
import type { Habit } from '../types'
import { HABIT_COLORS, useHabits } from '../store/habits'
import { useUI } from '../store/ui'
import { dayKey, fmt, todayKey, weekDays, weekStart } from '../lib/dates'
import { habitStreak, habitWeekCount } from '../lib/stats'
import { PageHeader } from '../components/common/PageHeader'
import { Modal } from '../components/common/Modal'

const HABIT_ICONS = ['🚶', '📖', '💧', '🧘', '🏃', '🥗', '😴', '✍️', '🎸', '🧹', '💊', '🌿', '📵', '🙏', '💪', '🧠']

/**
 * One month as plain dates in reading order: day 1 is the top-left box, the last day the final box.
 * Deliberately not aligned to weekdays, so a box's position always equals its day of the month.
 */
function MonthGrid({ habit, month }: { habit: Habit; month: Date }) {
  const today = todayKey()
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const done = days.filter((d) => habit.log[dayKey(d)]).length
  return (
    <div className="w-fit max-w-full">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="truncate text-sm">
          {habit.icon} {habit.name}
        </p>
        <p className="shrink-0 text-xs tabular-nums text-muted">
          {done}/{days.length} gün
        </p>
      </div>
      <ol className="grid w-fit grid-cols-7 gap-1" aria-label={`${habit.name}, ${fmt(month, 'LLLL yyyy')}`}>
        {days.map((d) => {
          const key = dayKey(d)
          const isDone = !!habit.log[key]
          const isToday = key === today
          const future = key > today
          return (
            <li
              key={key}
              title={`${fmt(d, 'd MMMM EEEE')}${isDone ? ': yapıldı' : ''}`}
              aria-label={`${fmt(d, 'd MMMM')}${isDone ? ', yapıldı' : ''}`}
              className={`grid size-8 place-items-center rounded-md text-xs tabular-nums ${
                isDone ? 'font-semibold text-white' : future ? 'text-faint' : 'bg-sunken text-muted'
              } ${isToday ? 'ring-2 ring-ink ring-offset-1 ring-offset-bg' : ''}`}
              style={isDone ? { background: habit.color } : future ? { border: '1px dashed var(--line)' } : undefined}
            >
              {d.getDate()}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function NewHabit({ onClose }: { onClose: () => void }) {
  const addHabit = useHabits((s) => s.addHabit)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(HABIT_ICONS[0])
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [target, setTarget] = useState(5)

  const save = () => {
    if (!name.trim()) return
    addHabit({ name: name.trim(), icon, color, targetPerWeek: target })
    onClose()
  }

  return (
    <Modal onClose={onClose} label="Yeni alışkanlık" className="max-w-md p-5">
      <h2 className="mb-4 font-display text-xl font-semibold">Yeni alışkanlık</h2>
      <label className="mb-1 block text-sm font-medium" htmlFor="habit-name">
        Ad
      </label>
      <input
        id="habit-name"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        placeholder="Örn. 10 dakika esneme"
        className="mb-4 w-full rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent"
      />
      <p className="mb-1 text-sm font-medium">Simge</p>
      <div className="mb-4 grid grid-cols-8 gap-1">
        {HABIT_ICONS.map((i) => (
          <button
            key={i}
            onClick={() => setIcon(i)}
            aria-pressed={icon === i}
            className={`grid aspect-square place-items-center rounded-md text-lg ${icon === i ? 'bg-accent-soft ring-1 ring-accent' : 'hover:bg-sunken'}`}
          >
            {i}
          </button>
        ))}
      </div>
      <p className="mb-1 text-sm font-medium">Renk</p>
      <div className="mb-4 flex gap-2">
        {HABIT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label={`Renk ${c}`}
            aria-pressed={color === c}
            className={`size-7 rounded-full ${color === c ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <label className="mb-1 block text-sm font-medium" htmlFor="habit-target">
        Haftalık hedef: {target} gün
      </label>
      <input
        id="habit-target"
        type="range"
        min={1}
        max={7}
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        className="mb-6 w-full accent-[var(--accent)]"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-sunken">
          Vazgeç
        </button>
        <button
          onClick={save}
          disabled={!name.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:opacity-40"
        >
          Alışkanlığı ekle
        </button>
      </div>
    </Modal>
  )
}

export function HabitsView() {
  const habits = useHabits((s) => s.habits)
  const toggleToday = useHabits((s) => s.toggleToday)
  const deleteHabit = useHabits((s) => s.deleteHabit)
  const toast = useUI((s) => s.toast)
  const [ref, setRef] = useState(() => new Date())
  const [creating, setCreating] = useState(false)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const isThisMonth = isSameMonth(month, new Date())
  const days = weekDays(ref)
  const today = todayKey()
  const isThisWeek = dayKey(weekStart(ref)) === dayKey(weekStart())

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Alışkanlıklar"
        subtitle="Her gün küçük bir işaret. Seriler kendiliğinden birikir."
        actions={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
          >
            <Plus className="size-4" /> Yeni alışkanlık
          </button>
        }
      />

      {habits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">Henüz alışkanlık yok</p>
          <p className="mx-auto mt-1 max-w-sm text-muted">Su içmek, yürüyüş, okuma… Takip etmek istediğin bir şeyle başla.</p>
          <button onClick={() => setCreating(true)} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
            İlk alışkanlığını ekle
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-1">
            <button onClick={() => setRef((d) => addWeeks(d, -1))} className="rounded-md p-1.5 hover:bg-sunken" aria-label="Önceki hafta">
              <ChevronLeft className="size-5" />
            </button>
            <span className="min-w-44 text-center text-sm font-medium">
              {isThisWeek ? 'Bu hafta' : `${fmt(days[0], 'd MMM')} – ${fmt(days[6], 'd MMM')}`}
            </span>
            <button
              onClick={() => setRef((d) => addWeeks(d, 1))}
              disabled={isThisWeek}
              className="rounded-md p-1.5 hover:bg-sunken disabled:opacity-30"
              aria-label="Sonraki hafta"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="px-4 py-2 text-left font-medium">Alışkanlık</th>
                  {days.map((d) => (
                    <th key={d.toISOString()} className={`w-12 py-2 font-medium ${dayKey(d) === today ? 'text-accent' : ''}`}>
                      <div>{fmt(d, 'EEEEEE')}</div>
                      <div className="tabular-nums">{d.getDate()}</div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left font-medium">Hafta</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => {
                  const count = habitWeekCount(h, ref)
                  const streak = habitStreak(h)
                  return (
                    <tr key={h.id} className="group border-b border-line last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{h.icon}</span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{h.name}</p>
                            <p className="flex items-center gap-1 text-xs text-muted">
                              <Flame className="size-3.5" style={{ color: streak ? h.color : undefined }} />
                              {streak ? `${streak} gün seri` : 'Seri yok'}
                            </p>
                          </div>
                        </div>
                      </td>
                      {days.map((d) => {
                        const key = dayKey(d)
                        const done = !!h.log[key]
                        const isToday = key === today
                        const style = done
                          ? { background: h.color, borderColor: h.color, color: '#fff' }
                          : { borderColor: 'var(--line)' }
                        return (
                          <td key={key} className="text-center">
                            {isToday ? (
                              <button
                                role="checkbox"
                                aria-checked={done}
                                aria-label={`${h.name}, bugün`}
                                onClick={() => toggleToday(h.id)}
                                className="mx-auto grid size-8 place-items-center rounded-lg border-[1.5px] ring-2 ring-accent/30 transition-colors hover:border-accent"
                                style={style}
                              >
                                {done && <Check className="size-4" strokeWidth={3} />}
                              </button>
                            ) : (
                              // Only today can be marked; other days just show what happened.
                              <span
                                role="img"
                                aria-label={`${h.name}, ${fmt(d, 'd MMMM EEEE')}: ${done ? 'yapıldı' : key > today ? 'henüz gelmedi' : 'yapılmadı'}`}
                                title="Yalnızca bugün işaretlenebilir"
                                className={`mx-auto grid size-8 place-items-center rounded-lg border-[1.5px] ${done ? '' : 'opacity-40'}`}
                                style={style}
                              >
                                {done && <Check className="size-4" strokeWidth={3} />}
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3">
                        <div className="w-20">
                          <p className="text-xs tabular-nums text-muted">
                            {count}/{h.targetPerWeek}
                          </p>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken">
                            <div
                              className="h-full rounded-full transition-[width] duration-500"
                              style={{ width: `${Math.min(100, (count / h.targetPerWeek) * 100)}%`, background: h.color }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="pr-2">
                        <button
                          onClick={() => {
                            deleteHabit(h.id)
                            toast(`"${h.name}" silindi`)
                          }}
                          className="rounded-md p-1.5 text-muted opacity-0 hover:bg-danger-soft hover:text-danger focus:opacity-100 group-hover:opacity-100"
                          aria-label={`${h.name} alışkanlığını sil`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs text-muted">Yalnızca bugünün kutusu işaretlenebilir. Geçmiş günler kayıt olarak kalır.</p>

          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">{fmt(month, 'LLLL yyyy')}</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setMonth((m) => addMonths(m, -1))} className="rounded-md p-1.5 hover:bg-sunken" aria-label="Önceki ay">
                  <ChevronLeft className="size-5" />
                </button>
                {!isThisMonth && (
                  <button
                    onClick={() => setMonth(startOfMonth(new Date()))}
                    className="rounded-md border border-line px-3 py-1 text-sm hover:bg-sunken"
                  >
                    Bu ay
                  </button>
                )}
                <button
                  onClick={() => setMonth((m) => addMonths(m, 1))}
                  disabled={isThisMonth}
                  className="rounded-md p-1.5 hover:bg-sunken disabled:opacity-30"
                  aria-label="Sonraki ay"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {habits.map((h) => (
                <MonthGrid key={h.id} habit={h} month={month} />
              ))}
            </div>
          </section>
        </>
      )}
      {creating && <NewHabit onClose={() => setCreating(false)} />}
    </div>
  )
}
