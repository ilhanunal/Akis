// Every evening at 21:00 Turkey time: reminds each person of habits still open today and of
// steps not yet entered. Stays silent when there is nothing to remind.
import type { Habit } from '../../src/types'
import { PEOPLE } from '../../src/lib/cloud/people'
import { canTickToday } from '../../src/lib/habits'
import { asService, devicesOf, sendTo } from '../lib/push'

/** Today's date in Turkey, as YYYY-MM-DD. */
const turkeyToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date())

export default async () => {
  const db = asService()
  const today = turkeyToday()
  // Noon UTC of that date: the same calendar day wherever the function happens to run.
  const ref = new Date(`${today}T12:00:00Z`)
  const report: Record<string, number> = {}

  for (const person of PEOPLE) {
    const devices = (await devicesOf(db, person.id)).filter((d) => d.prefs?.evening !== false)
    if (!devices.length) continue

    const { data: habitRows } = await db.from('items').select('data').eq('kind', 'habit').eq('workspace', person.id)
    const habits = (habitRows ?? []).map((r) => r.data as Habit)
    const open = habits.filter((h) => !h.log?.[today] && canTickToday(h, ref).ok)

    const { data: steps } = await db.from('items').select('id').eq('id', `steps-${person.id}-${today}`).maybeSingle()

    const parts: string[] = []
    if (open.length) parts.push(`Bugün henüz yapılmadı: ${open.map((h) => `${h.icon} ${h.name}`).join(', ')}.`)
    if (!steps) parts.push('Bugünkü adımlarını da girmeyi unutma.')
    if (!parts.length) continue

    report[person.id] = await sendTo(db, devices, { title: 'Akşam hatırlatması', body: parts.join(' '), url: '/', tag: 'evening' })
  }
  return Response.json(report)
}

// 18:00 UTC = 21:00 in Turkey (UTC+3 all year).
export const config = { schedule: '0 18 * * *' }
