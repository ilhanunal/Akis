// Scheduling rules for habits. A habit either has fixed weekdays (`days`) or a number of days per
// week (`targetPerWeek`) on any days. Only today can be ticked, and only while the week still needs it.
import { addWeeks } from 'date-fns'
import type { Habit } from '../types'
import { dayKey, lastNDays, weekDays, weekStart } from './dates'
import { streak } from './stats'

/** ISO weekday: Monday 1 … Sunday 7. */
export const isoDay = (d: Date) => d.getDay() || 7

export const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
export const dayNames = (days: number[]) => [...days].sort((a, b) => a - b).map((d) => DAY_SHORT[d - 1]).join(', ')

/** How many days a week the habit asks for. */
export const weekTarget = (h: Habit) => h.days?.length ?? h.targetPerWeek
export const isDaily = (h: Habit) => weekTarget(h) >= 7

export const scheduledOn = (h: Habit, d: Date) => !h.days || h.days.includes(isoDay(d))

/** Ticks in the week containing `ref`; with fixed days only the scheduled ones count. */
export const weekCount = (h: Habit, ref: Date = new Date()) =>
  weekDays(ref).filter((d) => h.log[dayKey(d)] && scheduledOn(h, d)).length

/** Whether today's box can be changed, and why not when it can't. Unticking is always allowed. */
export function canTickToday(h: Habit, today: Date = new Date()): { ok: boolean; reason?: string } {
  if (h.log[dayKey(today)]) return { ok: true }
  if (h.days && !h.days.includes(isoDay(today))) return { ok: false, reason: `Yalnızca ${dayNames(h.days)}` }
  if (weekCount(h, today) >= weekTarget(h)) return { ok: false, reason: 'Bu haftanın hedefi tamam' }
  return { ok: true }
}

/** Whether the habit belongs on today's list: it can still be ticked today, or already was. */
export const dueToday = (h: Habit) => canTickToday(h).ok

/**
 * Daily habits count consecutive days. Others count consecutive weeks that met the target;
 * the current week only adds to the streak once met, and never breaks it while still open.
 */
export function habitStreak(h: Habit): { count: number; unit: 'gün' | 'hafta' } {
  if (isDaily(h)) return { count: streak((k) => !!h.log[k]), unit: 'gün' }
  const target = weekTarget(h)
  const firstWeek = dayKey(weekStart(new Date(h.createdAt)))
  let w = weekStart(new Date())
  if (weekCount(h, w) < target) w = addWeeks(w, -1)
  let count = 0
  while (dayKey(w) >= firstWeek && weekCount(h, w) >= target) {
    count++
    w = addWeeks(w, -1)
  }
  return { count, unit: 'hafta' }
}

export function streakLabel(h: Habit) {
  const { count, unit } = habitStreak(h)
  return count ? `${count} ${unit === 'gün' ? 'günlük' : 'haftalık'} seri` : 'Seri yok'
}

export function scheduleLabel(h: Habit) {
  if (h.days) return h.days.length === 7 ? 'Her gün' : dayNames(h.days)
  return h.targetPerWeek >= 7 ? 'Her gün' : `Haftada ${h.targetPerWeek} gün`
}

/** Share of the check-ins the habits asked for over the last `days` days that were actually made. */
export function habitAdherence(habits: Habit[], days: number) {
  if (!habits.length) return null
  const range = lastNDays(days)
  let expected = 0
  let done = 0
  for (const h of habits) {
    const ticks = range.filter((d) => h.log[dayKey(d)] && scheduledOn(h, d)).length
    const asked = h.days ? range.filter((d) => scheduledOn(h, d)).length : (h.targetPerWeek * days) / 7
    expected += asked
    done += Math.min(ticks, asked)
  }
  return expected ? done / expected : null
}

