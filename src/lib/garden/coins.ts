// Coins are never stored: a balance is worked out from the activity history every time.
// Undoing a task removes its event, so the coins it earned disappear with it.
import type { ActivityEvent } from '../../types'
import { dayKey, fromKey, weekStart } from '../dates'

/** The day the garden opened; nothing done before it earns coins. */
export const GARDEN_START = '2026-10-20'

export const RATES = {
  task: 2, // a task finished in your own workspace
  shared: 5, // your part of a shared task
  habit: 1, // a habit ticked on a day
  habitWeek: 7, // a habit ticked on all 7 days of a Monday–Sunday week
  daily: 2, // any day on which you finished at least one task
}

export interface OwnedEvent {
  workspace: string
  event: ActivityEvent
}

export interface GardenRow {
  paid?: Record<string, number>
}

export interface Earnings {
  total: number
  breakdown: { tasks: number; shared: number; habits: number; habitWeeks: number; daily: number }
  /** Coins per day (YYYY-MM-DD), for "this week" totals. */
  byDay: Map<string, number>
}

export function earnings(rows: OwnedEvent[], person: string, since = GARDEN_START): Earnings {
  const byDay = new Map<string, number>()
  const add = (day: string, n: number) => byDay.set(day, (byDay.get(day) ?? 0) + n)
  const breakdown = { tasks: 0, shared: 0, habits: 0, habitWeeks: 0, daily: 0 }
  const taskDays = new Set<string>()
  const habitDays = new Map<string, Set<string>>() // habit id → days ticked

  for (const { workspace, event: e } of rows) {
    if (e.date < since) continue
    if (e.type === 'task_mark') {
      if (e.by !== person) continue
      breakdown.shared += RATES.shared
      add(e.date, RATES.shared)
      taskDays.add(e.date)
    } else if (workspace === person && e.type === 'task_done') {
      breakdown.tasks += RATES.task
      add(e.date, RATES.task)
      taskDays.add(e.date)
    } else if (workspace === person && e.type === 'habit_done') {
      const days = habitDays.get(e.refId) ?? new Set()
      if (days.has(e.date)) continue
      days.add(e.date)
      habitDays.set(e.refId, days)
      breakdown.habits += RATES.habit
      add(e.date, RATES.habit)
    }
  }

  for (const day of taskDays) {
    breakdown.daily += RATES.daily
    add(day, RATES.daily)
  }

  for (const days of habitDays.values()) {
    const weeks = new Map<string, number>()
    for (const day of days) {
      const monday = dayKey(weekStart(fromKey(day)))
      weeks.set(monday, (weeks.get(monday) ?? 0) + 1)
    }
    for (const [monday, count] of weeks) {
      if (count < 7 || monday < since) continue
      breakdown.habitWeeks += RATES.habitWeek
      // Credited on the Sunday that completed the week.
      const sunday = new Date(fromKey(monday))
      sunday.setDate(sunday.getDate() + 6)
      add(dayKey(sunday), RATES.habitWeek)
    }
  }

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)
  return { total, breakdown, byDay }
}

export const spent = (items: GardenRow[], person: string) => items.reduce((sum, i) => sum + (i.paid?.[person] ?? 0), 0)
