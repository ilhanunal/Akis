import { Check, Undo2 } from 'lucide-react'
import type { ActivityEvent, Task } from '../../types'
import { PEOPLE, type PersonId } from '../../lib/cloud/config'
import { otherThan } from '../../lib/cloud/shared'
import { dayKey, fmt, lastNDays, weekDays } from '../../lib/dates'
import { useTasks } from '../../store/tasks'
import { useUI } from '../../store/ui'
import { Avatar } from './LoginScreen'

/** Task modal row for the shared workspace: who has done the task, and your own toggle. */
export function MarksField({ task, me }: { task: Task; me: PersonId }) {
  const setMark = useTasks((s) => s.setMark)
  const toast = useUI((s) => s.toast)
  const mine = !!task.marks?.[me]
  const other = otherThan(me)
  return (
    <div className="space-y-1.5">
      {PEOPLE.map((p) => {
        const at = task.marks?.[p.id]
        return (
          <div key={p.id} className="flex items-center gap-2 text-sm">
            <Avatar name={p.name} color={p.color} size="sm" />
            <span className="font-medium">{p.name}</span>
            <span className="text-muted">{at ? `yaptı · ${fmt(new Date(at), 'd MMM HH:mm')}` : 'henüz yapmadı'}</span>
            {p.id === me && (
              <button
                onClick={() => {
                  setMark(task.id, me, !mine)
                  if (mine) toast('İşaretin kaldırıldı')
                  else toast(task.marks?.[other.id] ? 'İkiniz de tamamladınız. Görev panodan kalktı.' : `İşaretlendi. Sıra ${other.at}.`)
                }}
                className="ml-auto flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-muted hover:border-accent hover:text-accent"
              >
                {mine ? <Undo2 className="size-3.5" /> : <Check className="size-3.5" />}
                {mine ? 'Geri al' : 'Yaptım'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Progress page for the shared workspace: how many shared tasks each person has done. */
export function MarksScoreboard({ events }: { events: ActivityEvent[] }) {
  const marks = events.filter((e) => e.type === 'task_mark')
  const week = new Set(weekDays().map((d) => dayKey(d)))
  const month = new Set(lastNDays(30).map((d) => dayKey(d)))
  const rows = PEOPLE.map((p) => {
    const mine = marks.filter((e) => e.by === p.id)
    return {
      person: p,
      week: mine.filter((e) => week.has(e.date)).length,
      month: mine.filter((e) => month.has(e.date)).length,
      total: mine.length,
    }
  })
  return (
    <section className="mb-4 rounded-xl border border-line bg-surface p-5">
      <h2 className="mb-4 font-semibold">Kim kaç görev yaptı</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="pb-2 font-normal">
              <span className="sr-only">Kişi</span>
            </th>
            <th className="pb-2 text-right font-normal">Bu hafta</th>
            <th className="pb-2 text-right font-normal">Son 30 gün</th>
            <th className="pb-2 text-right font-normal">Toplam</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.person.id} className="border-t border-line">
              <th scope="row" className="py-2.5 text-left font-medium">
                <span className="flex items-center gap-2">
                  <Avatar name={r.person.name} color={r.person.color} size="sm" />
                  {r.person.name}
                </span>
              </th>
              <td className="py-2.5 text-right font-display text-lg font-semibold tabular-nums">{r.week}</td>
              <td className="py-2.5 text-right tabular-nums text-muted">{r.month}</td>
              <td className="py-2.5 text-right tabular-nums text-muted">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
