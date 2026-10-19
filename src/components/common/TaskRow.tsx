import { Check } from 'lucide-react'
import { STATUS_LABEL, type Task } from '../../types'
import { useTasks } from '../../store/tasks'
import { useUI } from '../../store/ui'
import { dueLabel, isOverdue } from '../../lib/dates'
import { STATUS_DOT } from '../kanban/Column'
import { otherThan, useSharedMe } from '../../lib/cloud/shared'

/** A compact list row with a completion checkbox, used outside the board. */
export function TaskRow({ task, showDue = false }: { task: Task; showDue?: boolean }) {
  const setStatus = useTasks((s) => s.setStatus)
  const openTask = useUI((s) => s.openTask)
  const toast = useUI((s) => s.toast)
  const setMark = useTasks((s) => s.setMark)
  const me = useSharedMe()
  const done = task.status === 'done'
  // On the shared board the checkbox is your own part; the task is done once both have ticked it.
  const checked = me ? !!task.marks?.[me] : done
  const waitingFor = me && checked && !done ? otherThan(me) : undefined

  return (
    <li className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sunken">
      <button
        role="checkbox"
        aria-checked={checked}
        aria-label={`${task.title}: ${checked ? 'tamamlanmadı olarak işaretle' : 'tamamlandı olarak işaretle'}`}
        onClick={() => {
          if (me) {
            const other = otherThan(me)
            setMark(task.id, me, !checked)
            if (!checked) toast(task.marks?.[other.id] ? 'İkiniz de tamamladınız.' : `İşaretlendi. Sıra ${other.at}.`)
            return
          }
          setStatus(task.id, done ? 'todo' : 'done')
          if (!done) toast('Tamamlandı. Akış ilerliyor.')
        }}
        className={`grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors ${
          checked ? 'border-accent bg-accent text-accent-ink' : 'border-faint hover:border-accent'
        }`}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </button>
      <button onClick={() => openTask(task.id)} className="min-w-0 flex-1 text-left">
        <span className={`block truncate ${done ? 'text-muted line-through decoration-faint' : ''}`}>{task.title}</span>
      </button>
      {showDue && task.dueDate && (
        <span className={`shrink-0 text-xs ${!done && isOverdue(task.dueDate) ? 'font-medium text-danger' : 'text-muted'}`}>
          {dueLabel(task.dueDate)}
        </span>
      )}
      {waitingFor && <span className="shrink-0 text-xs text-muted">Sıra {waitingFor.at}</span>}
      {task.status === 'doing' && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
          <span className={`size-1.5 rounded-full ${STATUS_DOT.doing}`} />
          {STATUS_LABEL.doing}
        </span>
      )}
    </li>
  )
}
