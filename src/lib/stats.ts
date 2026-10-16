import { addDays } from 'date-fns'
import type { ActivityEvent, Habit } from '../types'
import { dayKey, lastNDays, weekDays } from './dates'

export function countByDay(events: ActivityEvent[], type: ActivityEvent['type']) {
  const counts = new Map<string, number>()
  for (const e of events) if (e.type === type) counts.set(e.date, (counts.get(e.date) ?? 0) + 1)
  return counts
}

export function dailySeries(events: ActivityEvent[], type: ActivityEvent['type'], days: number) {
  const counts = countByDay(events, type)
  return lastNDays(days).map((d) => ({ key: dayKey(d), date: d, count: counts.get(dayKey(d)) ?? 0 }))
}

/** Consecutive days ending today that satisfy `hit`. Today not being hit yet doesn't break the streak. */
export function streak(hit: (key: string) => boolean) {
  let d = new Date()
  if (!hit(dayKey(d))) d = addDays(d, -1)
  let n = 0
  while (hit(dayKey(d))) {
    n++
    d = addDays(d, -1)
  }
  return n
}

export const taskStreak = (events: ActivityEvent[]) => {
  const days = new Set(events.filter((e) => e.type === 'task_done').map((e) => e.date))
  return streak((k) => days.has(k))
}

export const habitStreak = (habit: Habit) => streak((k) => !!habit.log[k])

export const habitWeekCount = (habit: Habit, ref: Date = new Date()) =>
  weekDays(ref).filter((d) => habit.log[dayKey(d)]).length

/** Share of possible habit check-ins over the last `days` days that were actually made. */
export function habitAdherence(habits: Habit[], days: number) {
  if (!habits.length) return null
  const keys = lastNDays(days).map((d) => dayKey(d))
  const done = habits.reduce((sum, h) => sum + keys.filter((k) => h.log[k]).length, 0)
  return done / (habits.length * days)
}
