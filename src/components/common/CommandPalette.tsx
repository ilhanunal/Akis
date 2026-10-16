import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, FilePlus, Plus, Search, Settings } from 'lucide-react'
import { useUI } from '../../store/ui'
import { pageTitle, usePages } from '../../store/pages'
import { useTasks } from '../../store/tasks'
import { STATUS_LABEL } from '../../types'
import { NAV } from '../layout/Sidebar'
import { Modal } from './Modal'

interface Item {
  id: string
  group: string
  label: string
  hint?: string
  icon: ReactNode
  run: () => void
}

const norm = (s: string) => s.toLocaleLowerCase('tr').trim()

export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen)
  const setPalette = useUI((s) => s.setPalette)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette(!useUI.getState().paletteOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPalette])

  if (!open) return null
  return <Palette onClose={() => setPalette(false)} />
}

function Palette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const pages = usePages((s) => s.pages)
  const addPage = usePages((s) => s.addPage)
  const tasks = useTasks((s) => s.tasks)
  const addTask = useTasks((s) => s.addTask)
  const { openTask, toast } = useUI.getState()
  const [q, setQ] = useState('')
  const [index, setIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const items = useMemo<Item[]>(() => {
    const query = norm(q)
    const match = (s: string) => !query || norm(s).includes(query)
    const out: Item[] = []
    if (query) {
      out.push({
        id: 'add-task',
        group: 'Ekle',
        label: `"${q.trim()}" görevini ekle`,
        icon: <Plus />,
        run: () => {
          addTask({ title: q })
          toast('Görev eklendi')
        },
      })
      out.push({
        id: 'add-page',
        group: 'Ekle',
        label: `"${q.trim()}" sayfasını oluştur`,
        icon: <FilePlus />,
        run: () => navigate(`/sayfa/${addPage(undefined, { title: q.trim() }).id}`),
      })
    }
    for (const n of NAV)
      if (match(n.label)) out.push({ id: n.to, group: 'Git', label: n.label, icon: <n.icon />, run: () => navigate(n.to) })
    if (match('Ayarlar')) out.push({ id: 'settings', group: 'Git', label: 'Ayarlar', icon: <Settings />, run: () => navigate('/ayarlar') })
    for (const p of pages.filter((p) => match(pageTitle(p))).slice(0, 8))
      out.push({
        id: p.id,
        group: 'Sayfalar',
        label: pageTitle(p),
        icon: <span className="text-base leading-none">{p.icon}</span>,
        run: () => navigate(`/sayfa/${p.id}`),
      })
    if (query)
      for (const t of tasks.filter((t) => match(t.title) || t.tags.some(match)).slice(0, 8))
        out.push({
          id: t.id,
          group: 'Görevler',
          label: t.title,
          hint: STATUS_LABEL[t.status],
          icon: <Search />,
          run: () => openTask(t.id),
        })
    return out
  }, [q, pages, tasks, addTask, addPage, navigate, openTask, toast])

  useEffect(() => setIndex(0), [q])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const run = (item?: Item) => {
    if (!item) return
    onClose()
    item.run()
  }

  let lastGroup = ''
  return (
    <Modal onClose={onClose} label="Komut paleti" className="max-w-xl" align="top">
      <div className="flex items-center gap-2 border-b border-line px-4">
        <Search className="size-4 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setIndex((i) => Math.min(items.length - 1, i + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setIndex((i) => Math.max(0, i - 1))
            } else if (e.key === 'Enter') {
              run(items[index])
            }
          }}
          placeholder="Sayfa, görev ara ya da yeni görev yaz…"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={items[index] ? `palette-${index}` : undefined}
          className="w-full bg-transparent py-3.5 outline-none placeholder:text-faint"
        />
      </div>
      <ul id="palette-list" ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
        {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Eşleşen bir şey yok.</li>}
        {items.map((item, i) => {
          const header = item.group !== lastGroup ? item.group : null
          lastGroup = item.group
          return (
            <li key={item.group + item.id} role="presentation">
              {header && <div className="px-2.5 pb-1 pt-2 text-xs font-medium text-faint">{header}</div>}
              <div
                id={`palette-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === index}
                onMouseMove={() => setIndex(i)}
                onClick={() => run(item)}
                className={`flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm ${
                  i === index ? 'bg-sunken' : ''
                }`}
              >
                <span className="grid w-5 place-items-center text-muted [&_svg]:size-4">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.hint && <span className="text-xs text-faint">{item.hint}</span>}
                {i === index && <CornerDownLeft className="size-3.5 text-faint" />}
              </div>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
