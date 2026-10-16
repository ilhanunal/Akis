import { useState, type DragEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronRight, Ellipsis, Plus, Star, StarOff, Trash2, FilePlus } from 'lucide-react'
import type { Page } from '../../types'
import { descendantIds, pageTitle, usePages } from '../../store/pages'
import { useUI } from '../../store/ui'
import { Menu } from '../common/Menu'

const DRAG_TYPE = 'application/x-akis-page'

interface RowProps {
  page: Page
  depth: number
  expanded: Set<string>
  toggle: (id: string, open?: boolean) => void
}

function PageRow({ page, depth, expanded, toggle }: RowProps) {
  const pages = usePages((s) => s.pages)
  const { addPage, updatePage, deletePage, movePage } = usePages.getState()
  const setDrawer = useUI((s) => s.setDrawer)
  const toast = useUI((s) => s.toast)
  const navigate = useNavigate()
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [dropping, setDropping] = useState(false)

  const children = pages.filter((p) => p.parentId === page.id)
  const open = expanded.has(page.id)

  const addChild = () => {
    const child = addPage(page.id)
    toggle(page.id, true)
    navigate(`/sayfa/${child.id}`)
    setDrawer(false)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDropping(false)
    const id = e.dataTransfer.getData(DRAG_TYPE)
    if (id && id !== page.id) {
      movePage(id, page.id)
      toggle(page.id, true)
    }
  }

  return (
    <li>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(DRAG_TYPE, page.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes(DRAG_TYPE)) {
            e.preventDefault()
            setDropping(true)
          }
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={onDrop}
        onContextMenu={(e) => {
          e.preventDefault()
          setMenu({ x: e.clientX, y: e.clientY })
        }}
        className={`group relative flex items-center rounded-md ${dropping ? 'bg-accent-soft ring-1 ring-accent' : ''}`}
        style={{ paddingLeft: depth * 14 }}
      >
        <button
          onClick={() => toggle(page.id)}
          className={`grid size-6 shrink-0 place-items-center rounded text-faint hover:bg-sunken hover:text-ink ${
            children.length ? '' : 'invisible'
          }`}
          aria-label={open ? 'Daralt' : 'Genişlet'}
          aria-expanded={open}
        >
          <ChevronRight className={`size-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
        <NavLink
          to={`/sayfa/${page.id}`}
          onClick={() => setDrawer(false)}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 pl-1 pr-12 text-sm ${
              isActive ? 'bg-sunken font-medium text-ink' : 'text-muted hover:bg-sunken hover:text-ink'
            }`
          }
        >
          <span className="shrink-0">{page.icon}</span>
          <span className="truncate">{pageTitle(page)}</span>
        </NavLink>
        <div className="absolute right-1 flex opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
          <button
            onClick={(e) => setMenu({ x: e.clientX, y: e.clientY })}
            className="grid size-6 place-items-center rounded text-muted hover:bg-line hover:text-ink"
            aria-label={`${pageTitle(page)} için seçenekler`}
          >
            <Ellipsis className="size-4" />
          </button>
          <button
            onClick={addChild}
            className="grid size-6 place-items-center rounded text-muted hover:bg-line hover:text-ink"
            aria-label={`${pageTitle(page)} içine alt sayfa ekle`}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      {open && children.length > 0 && (
        <ul>
          {children.map((c) => (
            <PageRow key={c.id} page={c} depth={depth + 1} expanded={expanded} toggle={toggle} />
          ))}
        </ul>
      )}
      {menu && (
        <Menu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            { label: 'Alt sayfa ekle', icon: <FilePlus />, onSelect: addChild },
            {
              label: page.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle',
              icon: page.favorite ? <StarOff /> : <Star />,
              onSelect: () => updatePage(page.id, { favorite: !page.favorite }),
            },
            ...(page.parentId
              ? [{ label: 'En üst düzeye taşı', icon: <ChevronRight />, onSelect: () => movePage(page.id, undefined) }]
              : []),
            {
              label: 'Sil',
              icon: <Trash2 />,
              danger: true,
              onSelect: () => {
                const doomed = [page.id, ...descendantIds(pages, page.id)]
                const viewingDoomed = doomed.some((id) => location.pathname === `/sayfa/${id}`)
                deletePage(page.id)
                toast(`"${pageTitle(page)}" silindi`)
                if (viewingDoomed) navigate('/')
              },
            },
          ]}
        />
      )}
    </li>
  )
}

export function PageTree() {
  const pages = usePages((s) => s.pages)
  const addPage = usePages((s) => s.addPage)
  const movePage = usePages((s) => s.movePage)
  const setDrawer = useUI((s) => s.setDrawer)
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [rootDrop, setRootDrop] = useState(false)

  const toggle = (id: string, open?: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (open ?? !next.has(id)) next.add(id)
      else next.delete(id)
      return next
    })

  const roots = pages.filter((p) => !p.parentId)
  const favorites = pages.filter((p) => p.favorite)

  const newPage = () => {
    const p = addPage()
    navigate(`/sayfa/${p.id}`)
    setDrawer(false)
  }

  return (
    <>
      {favorites.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-1 px-2 text-xs font-medium text-faint">Favoriler</h3>
          <ul>
            {favorites.map((p) => (
              <li key={p.id}>
                <NavLink
                  to={`/sayfa/${p.id}`}
                  onClick={() => setDrawer(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
                      isActive ? 'bg-sunken font-medium text-ink' : 'text-muted hover:bg-sunken hover:text-ink'
                    }`
                  }
                >
                  <span>{p.icon}</span>
                  <span className="truncate">{pageTitle(p)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6">
        <div
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes(DRAG_TYPE)) {
              e.preventDefault()
              setRootDrop(true)
            }
          }}
          onDragLeave={() => setRootDrop(false)}
          onDrop={(e) => {
            e.preventDefault()
            setRootDrop(false)
            const id = e.dataTransfer.getData(DRAG_TYPE)
            if (id) movePage(id, undefined)
          }}
          className={`group mb-1 flex items-center justify-between rounded-md px-2 ${rootDrop ? 'bg-accent-soft' : ''}`}
        >
          <h3 className="text-xs font-medium text-faint">Sayfalar</h3>
          <button
            onClick={newPage}
            className="grid size-6 place-items-center rounded text-muted hover:bg-sunken hover:text-ink"
            aria-label="Yeni sayfa"
            title="Yeni sayfa"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {roots.length === 0 ? (
          <button onClick={newPage} className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted hover:bg-sunken">
            İlk sayfanı oluştur
          </button>
        ) : (
          <ul>
            {roots.map((p) => (
              <PageRow key={p.id} page={p} depth={0} expanded={expanded} toggle={toggle} />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
