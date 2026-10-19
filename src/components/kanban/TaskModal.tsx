import { useState, type ReactNode } from 'react'
import { CalendarDays, FileText, Flag, Tag, Trash2, X, CircleDot, ListChecks } from 'lucide-react'
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, type Task } from '../../types'
import { useTasks } from '../../store/tasks'
import { pageTitle, usePages } from '../../store/pages'
import { useUI } from '../../store/ui'
import { fmt } from '../../lib/dates'
import { uid } from '../../lib/id'
import { Modal } from '../common/Modal'
import { STATUS_DOT } from './Column'
import { useSharedMe } from '../../lib/cloud/shared'
import { MarksField } from '../cloud/SharedMarks'

export function TaskModalHost() {
  const id = useUI((s) => s.openTaskId)
  const openTask = useUI((s) => s.openTask)
  const task = useTasks((s) => s.tasks.find((t) => t.id === id))
  if (!task) return null
  return <TaskModal key={task.id} task={task} onClose={() => openTask(null)} />
}

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-start gap-2 py-1.5 max-sm:grid-cols-1 max-sm:gap-1">
      <span className="flex items-center gap-2 pt-1 text-sm text-muted [&_svg]:size-4">
        {icon}
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function Segmented<T extends string>({
  value,
  options,
  label,
  onChange,
  render,
}: {
  value: T
  options: T[]
  label: string
  onChange: (v: T) => void
  render: (v: T) => ReactNode
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-sunken p-0.5">
      {options.map((o) => (
        <button
          key={o}
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm ${
            value === o ? 'bg-surface font-medium shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {render(o)}
        </button>
      ))}
    </div>
  )
}

function TaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const updateTask = useTasks((s) => s.updateTask)
  const setStatus = useTasks((s) => s.setStatus)
  const deleteTask = useTasks((s) => s.deleteTask)
  const pages = usePages((s) => s.pages)
  const toast = useUI((s) => s.toast)
  const me = useSharedMe()
  const [tagDraft, setTagDraft] = useState('')
  const [subDraft, setSubDraft] = useState('')

  const patch = (p: Partial<Task>) => updateTask(task.id, p)

  const addTag = () => {
    const t = tagDraft.trim().replace(/^#/, '').toLocaleLowerCase('tr')
    if (t && !task.tags.includes(t)) patch({ tags: [...task.tags, t] })
    setTagDraft('')
  }

  const addSub = () => {
    if (subDraft.trim()) patch({ subtasks: [...task.subtasks, { id: uid(), title: subDraft.trim(), done: false }] })
    setSubDraft('')
  }

  return (
    <Modal onClose={onClose} label="Görev ayrıntıları" className="max-w-2xl" align="top">
      <div className="flex items-center justify-between border-b border-line px-5 py-2.5 text-sm text-muted">
        <span>Oluşturuldu: {fmt(task.createdAt, 'd MMMM yyyy')}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              deleteTask(task.id)
              onClose()
              toast('Görev silindi')
            }}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" /> Sil
          </button>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-sunken hover:text-ink" aria-label="Kapat">
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-6 pt-4">
        <textarea
          value={task.title}
          onChange={(e) => patch({ title: e.target.value.replace(/\n/g, '') })}
          onBlur={() => !task.title.trim() && patch({ title: 'Adsız görev' })}
          rows={1}
          aria-label="Görev adı"
          placeholder="Görev adı"
          className="field-sizing-content mb-3 w-full resize-none overflow-hidden bg-transparent font-display text-2xl font-semibold leading-tight outline-none placeholder:text-faint"
        />

        {me ? (
          <Field icon={<CircleDot />} label="Kim yaptı">
            <MarksField task={task} me={me} />
          </Field>
        ) : (
          <Field icon={<CircleDot />} label="Durum">
            <Segmented
              label="Durum"
              value={task.status}
              options={STATUSES}
              onChange={(s) => {
                setStatus(task.id, s)
                if (s === 'done' && task.status !== 'done') toast('Tamamlandı. Akış ilerliyor.')
              }}
              render={(s) => (
                <>
                  <span className={`size-2 rounded-full ${STATUS_DOT[s]}`} />
                  {STATUS_LABEL[s]}
                </>
              )}
            />
          </Field>
        )}

        <Field icon={<Flag />} label="Öncelik">
          <Segmented
            label="Öncelik"
            value={task.priority}
            options={PRIORITIES}
            onChange={(priority) => patch({ priority })}
            render={(p) => PRIORITY_LABEL[p]}
          />
        </Field>

        <Field icon={<CalendarDays />} label="Bitiş tarihi">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={task.dueDate ?? ''}
              onChange={(e) => patch({ dueDate: e.target.value || undefined })}
              className="rounded-md border border-line bg-surface px-2 py-1 text-sm"
            />
            {task.dueDate && (
              <button onClick={() => patch({ dueDate: undefined })} className="text-sm text-muted hover:text-ink">
                Kaldır
              </button>
            )}
          </div>
        </Field>

        <Field icon={<Tag />} label="Etiketler">
          <div className="flex flex-wrap items-center gap-1.5">
            {task.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-md bg-sunken py-0.5 pl-2 pr-1 text-sm">
                #{t}
                <button
                  onClick={() => patch({ tags: task.tags.filter((x) => x !== t) })}
                  className="rounded p-0.5 text-muted hover:text-ink"
                  aria-label={`${t} etiketini kaldır`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTag()
                }
              }}
              onBlur={addTag}
              placeholder="Etiket ekle"
              className="w-28 bg-transparent py-0.5 text-sm outline-none placeholder:text-faint"
            />
          </div>
        </Field>

        <Field icon={<FileText />} label="Sayfa">
          <select
            value={task.pageId ?? ''}
            onChange={(e) => patch({ pageId: e.target.value || undefined })}
            className="max-w-full rounded-md border border-line bg-surface px-2 py-1 text-sm"
          >
            <option value="">Bağlı değil</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon} {pageTitle(p)}
              </option>
            ))}
          </select>
        </Field>

        <div className="mt-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ListChecks className="size-4 text-muted" /> Alt görevler
            {task.subtasks.length > 0 && (
              <span className="font-normal text-muted">
                {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
              </span>
            )}
          </h3>
          <ul className="space-y-0.5">
            {task.subtasks.map((s) => (
              <li key={s.id} className="group flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-sunken">
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={() =>
                    patch({ subtasks: task.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })
                  }
                  className="size-4 accent-[var(--accent)]"
                  aria-label={s.title}
                />
                <span className={`flex-1 text-sm ${s.done ? 'text-muted line-through' : ''}`}>{s.title}</span>
                <button
                  onClick={() => patch({ subtasks: task.subtasks.filter((x) => x.id !== s.id) })}
                  className="rounded p-0.5 text-muted opacity-0 hover:text-danger focus:opacity-100 group-hover:opacity-100"
                  aria-label={`${s.title} alt görevini sil`}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <input
            value={subDraft}
            onChange={(e) => setSubDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSub()}
            placeholder="Alt görev ekle"
            className="mt-1 w-full rounded-md px-1 py-1 text-sm outline-none placeholder:text-faint focus:bg-sunken"
          />
        </div>

        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold">Açıklama</h3>
          <textarea
            value={task.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Notlar, bağlantılar, ayrıntılar…"
            className="field-sizing-content min-h-24 w-full resize-none rounded-lg border border-line bg-transparent px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-accent"
          />
        </div>
      </div>
    </Modal>
  )
}
