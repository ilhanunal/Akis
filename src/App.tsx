import { lazy, Suspense } from 'react'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom'
import { Menu as MenuIcon } from 'lucide-react'
import { Sidebar } from './components/layout/Sidebar'
import { CommandPalette } from './components/common/CommandPalette'
import { Toasts } from './components/common/Toasts'
import { TaskModalHost } from './components/kanban/TaskModal'
import { useUI } from './store/ui'
import { useApplySpellcheck, useApplyTheme } from './lib/theme'
import { TodayView } from './views/TodayView'
import { BoardView } from './views/BoardView'
import { CalendarView } from './views/CalendarView'
import { HabitsView } from './views/HabitsView'
import { SettingsView } from './views/SettingsView'
import { cloudEnabled } from './lib/cloud/config'
import { useCloud } from './store/cloud'
import { LoginScreen } from './components/cloud/LoginScreen'
import { ImportPrompt, WorkspaceStatus } from './components/cloud/Workspace'

// The editor and charts are the heaviest dependencies; load them only when those screens open.
const PageView = lazy(() => import('./views/PageView').then((m) => ({ default: m.PageView })))
const DashboardView = lazy(() => import('./views/DashboardView').then((m) => ({ default: m.DashboardView })))

function Layout() {
  useApplyTheme()
  useApplySpellcheck()
  const setDrawer = useUI((s) => s.setDrawer)
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur md:hidden">
          <button onClick={() => setDrawer(true)} className="rounded-md p-1.5 hover:bg-sunken" aria-label="Menüyü aç">
            <MenuIcon className="size-5" />
          </button>
          <span className="font-display text-lg font-semibold">Akış</span>
        </div>
        <main className="px-4 py-8 md:px-10 md:py-12">
          <Suspense fallback={<p className="text-muted">Yükleniyor…</p>}>
            {cloudEnabled ? (
              <WorkspaceStatus>
                <Outlet />
              </WorkspaceStatus>
            ) : (
              <Outlet />
            )}
          </Suspense>
        </main>
      </div>
      <TaskModalHost />
      <CommandPalette />
      <Toasts />
      {cloudEnabled && <ImportPrompt />}
    </div>
  )
}

/** In cloud mode nothing but the sign-in screen is shown until one of the two people signs in. */
function CloudGate() {
  useApplyTheme()
  const person = useCloud((s) => s.person)
  if (person === undefined) return <div className="min-h-screen bg-bg" />
  if (person === null) return <LoginScreen />
  return <Layout />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={cloudEnabled ? <CloudGate /> : <Layout />}>
          <Route index element={<TodayView />} />
          <Route path="pano" element={<BoardView />} />
          <Route path="takvim" element={<CalendarView />} />
          <Route path="aliskanliklar" element={<HabitsView />} />
          <Route path="ilerleme" element={<DashboardView />} />
          <Route path="ayarlar" element={<SettingsView />} />
          <Route path="sayfa/:id" element={<PageView />} />
          <Route path="*" element={<TodayView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
