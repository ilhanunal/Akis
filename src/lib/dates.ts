import { addDays, format, isBefore, parseISO, startOfDay, startOfWeek } from 'date-fns'
import { tr } from 'date-fns/locale'

export const dayKey = (d: Date = new Date()) => format(d, 'yyyy-MM-dd')
export const todayKey = () => dayKey()
export const fromKey = (key: string) => parseISO(key)

export const fmt = (d: Date | string, pattern: string) =>
  format(typeof d === 'string' ? parseISO(d) : d, pattern, { locale: tr })

export const isOverdue = (key?: string) => !!key && isBefore(fromKey(key), startOfDay(new Date()))

export const weekStart = (d: Date = new Date()) => startOfWeek(d, { weekStartsOn: 1 })

export const weekDays = (d: Date = new Date()) => {
  const start = weekStart(d)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const lastNDays = (n: number, end: Date = new Date()) =>
  Array.from({ length: n }, (_, i) => addDays(end, i - n + 1))

export function dueLabel(key: string) {
  if (key === todayKey()) return 'Bugün'
  if (key === dayKey(addDays(new Date(), 1))) return 'Yarın'
  if (key === dayKey(addDays(new Date(), -1))) return 'Dün'
  return fmt(key, 'd MMM')
}

export function greeting(d: Date = new Date()) {
  const h = d.getHours()
  if (h < 5) return 'İyi geceler'
  if (h < 12) return 'Günaydın'
  if (h < 18) return 'İyi günler'
  return 'İyi akşamlar'
}
