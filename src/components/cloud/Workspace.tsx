import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { CloudAlert, LogOut } from 'lucide-react'
import { PEOPLE, WORKSPACES } from '../../lib/cloud/config'
import { signOut, switchWorkspace } from '../../lib/cloud/auth'
import { importDecided, importLocal, localData, markImportDecided } from '../../lib/cloud/importLocal'
import { useCloud } from '../../store/cloud'
import { useTasks } from '../../store/tasks'
import { usePages } from '../../store/pages'
import { useHabits } from '../../store/habits'
import { useUI } from '../../store/ui'
import { Modal } from '../common/Modal'
import { Avatar } from './LoginScreen'
import { useBalance } from '../../store/garden'
import { Coins } from '../garden/Garden'

/** Tabs for the three workspaces: each person's own and the shared one. */
export function WorkspaceSwitcher({ onSwitch }: { onSwitch?: () => void }) {
  const current = useCloud((s) => s.workspace)
  const navigate = useNavigate()
  return (
    <div role="tablist" aria-label="Alan" className="mb-3 grid grid-cols-3 gap-0.5 rounded-lg bg-sunken p-0.5">
      {WORKSPACES.map((w) => (
        <button
          key={w.id}
          role="tab"
          aria-selected={current === w.id}
          onClick={() => {
            if (current === w.id) return
            switchWorkspace(w.id)
            // A page from one workspace doesn't exist in another.
            if (location.pathname.startsWith('/sayfa/')) navigate('/')
            onSwitch?.()
          }}
          className={`flex items-center justify-center gap-1.5 rounded-md px-1 py-1.5 text-sm ${
            current === w.id ? 'bg-surface font-medium shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <span className="size-2 rounded-full" style={{ background: w.color }} aria-hidden />
          {w.name}
        </button>
      ))}
    </div>
  )
}

/** Who is signed in, whether edits reached the database, and sign out. */
export function AccountFooter() {
  const personId = useCloud((s) => s.person)
  const person = PEOPLE.find((p) => p.id === personId)
  const sync = useCloud((s) => s.sync)
  const balance = useBalance(personId)
  if (!person) return null
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
      <Avatar name={person.name} color={person.color} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          <span className="truncate">{person.name}</span>
          <NavLink to="/bahce" className="text-xs font-normal text-muted hover:text-ink" aria-label="Coin bakiyen, bahçeyi aç">
            <Coins value={balance} />
          </NavLink>
        </p>
        <p className={`flex items-center gap-1 text-xs ${sync === 'error' ? 'text-danger' : 'text-faint'}`} aria-live="polite">
          {sync === 'error' && <CloudAlert className="size-3.5" />}
          {sync === 'saved' ? 'Kaydedildi' : sync === 'saving' ? 'Kaydediliyor…' : 'Kaydedilemedi, yeniden deneniyor'}
        </p>
      </div>
      <button onClick={() => void signOut()} className="rounded-md p-1.5 text-muted hover:bg-sunken hover:text-ink" aria-label="Çıkış yap" title="Çıkış yap">
        <LogOut className="size-4" />
      </button>
    </div>
  )
}

/** Shown while a workspace loads or fails to load, in place of the screen's content. */
export function WorkspaceStatus({ children }: { children: React.ReactNode }) {
  const loading = useCloud((s) => s.loading)
  const error = useCloud((s) => s.error)
  if (error)
    return (
      <p role="alert" className="text-danger">
        {error}
      </p>
    )
  if (loading) return <p className="text-muted">Yükleniyor…</p>
  return children
}

/** Offers once per browser to move data saved here before the database into your own workspace. */
export function ImportPrompt() {
  const person = useCloud((s) => s.person)
  const workspace = useCloud((s) => s.workspace)
  const loading = useCloud((s) => s.loading)
  const noTasks = useTasks((s) => !s.tasks.length)
  const noPages = usePages((s) => !s.pages.length)
  const noHabits = useHabits((s) => !s.habits.length)
  const empty = noTasks && noPages && noHabits
  const toast = useUI((s) => s.toast)
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState({ tasks: 0, pages: 0, habits: 0 })

  useEffect(() => {
    if (!person || workspace !== person || loading || !empty || importDecided()) return
    const data = localData()
    if (!data.tasks.length && !data.pages.length && !data.habits.length) return
    setCounts({ tasks: data.tasks.length, pages: data.pages.length, habits: data.habits.length })
    setOpen(true)
  }, [person, workspace, loading, empty])

  if (!open) return null
  const name = PEOPLE.find((p) => p.id === person)?.name
  const close = () => {
    markImportDecided()
    setOpen(false)
  }
  return (
    <Modal onClose={close} label="Verileri aktar" className="max-w-sm p-5">
      <h2 className="font-display text-xl font-semibold">Bu tarayıcıdaki veriler aktarılsın mı?</h2>
      <p className="mt-2 text-sm text-muted">
        Bu tarayıcıda daha önce kaydedilmiş {counts.tasks} görev, {counts.pages} sayfa ve {counts.habits} alışkanlık var.
        Bunları {name} alanına taşıyabilirsin. Tarayıcıdaki kopya silinmez.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={close} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-sunken">
          Aktarma
        </button>
        <button
          onClick={() => {
            importLocal()
            setOpen(false)
            toast(`Veriler ${name} alanına aktarıldı`)
          }}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
        >
          Aktar
        </button>
      </div>
    </Modal>
  )
}
