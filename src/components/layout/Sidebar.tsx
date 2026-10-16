import { NavLink } from 'react-router-dom'
import { CalendarDays, Search, Settings, SquareKanban, Sprout, Sun, TrendingUp, X } from 'lucide-react'
import { useUI } from '../../store/ui'
import { PageTree } from './PageTree'

export const NAV = [
  { to: '/', label: 'Bugün', icon: Sun },
  { to: '/pano', label: 'Pano', icon: SquareKanban },
  { to: '/takvim', label: 'Takvim', icon: CalendarDays },
  { to: '/aliskanliklar', label: 'Alışkanlıklar', icon: Sprout },
  { to: '/ilerleme', label: 'İlerleme', icon: TrendingUp },
]

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm ${
    isActive ? 'bg-sunken font-medium text-ink' : 'text-muted hover:bg-sunken hover:text-ink'
  }`

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--accent)" />
        <path
          d="M6 13c4-4 8 4 12 0s6-2 8-1M6 20c4-4 8 4 12 0s6-2 8-1"
          stroke="var(--accent-ink)"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight">Akış</span>
    </div>
  )
}

export function Sidebar() {
  const setPalette = useUI((s) => s.setPalette)
  const drawerOpen = useUI((s) => s.drawerOpen)
  const setDrawer = useUI((s) => s.setDrawer)
  const close = () => setDrawer(false)

  return (
    <>
      {drawerOpen && <div className="fixed inset-0 z-30 bg-ink/25 md:hidden" onClick={close} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-line bg-bg transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          drawerOpen ? 'translate-x-0 shadow-card' : '-translate-x-full'
        }`}
        aria-label="Ana menü"
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <Logo />
          <button onClick={close} className="rounded-md p-1 text-muted hover:bg-sunken md:hidden" aria-label="Menüyü kapat">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-3">
          <button
            onClick={() => {
              close()
              setPalette(true)
            }}
            className="mb-3 flex w-full items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-muted hover:border-faint"
          >
            <Search className="size-4" />
            Ara ya da ekle
            <kbd className="ml-auto rounded border border-line px-1.5 text-[11px] text-faint">Ctrl K</kbd>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-0.5">
            {NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} end={to === '/'} className={navClass} onClick={close}>
                  <Icon className="size-[18px]" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <PageTree />
        </nav>
        <div className="border-t border-line px-3 py-2">
          <NavLink to="/ayarlar" className={navClass} onClick={close}>
            <Settings className="size-[18px]" />
            Ayarlar
          </NavLink>
        </div>
      </aside>
    </>
  )
}
