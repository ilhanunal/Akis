import { addDays } from 'date-fns'
import type { ActivityEvent } from '../types'
import { dayKey, lastNDays } from './dates'

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
