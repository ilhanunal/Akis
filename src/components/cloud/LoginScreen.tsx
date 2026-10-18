import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { PEOPLE, type PersonId } from '../../lib/cloud/config'
import { signIn } from '../../lib/cloud/auth'

export function Avatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const box = { sm: 'size-6 text-xs', md: 'size-9 text-sm', lg: 'size-16 text-2xl' }[size]
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white ${box}`}
      style={{ background: color }}
    >
      {name.charAt(0)}
    </span>
  )
}

export function LoginScreen() {
  const [chosen, setChosen] = useState<PersonId | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const person = PEOPLE.find((p) => p.id === chosen)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chosen || !password) return
    setBusy(true)
    setError('')
    try {
      await signIn(chosen, password)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Akış</h1>
        {!person ? (
          <>
            <p className="mt-1 text-muted">Kim giriş yapıyor?</p>
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {PEOPLE.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setChosen(p.id)}
                    className="flex w-full flex-col items-center gap-3 rounded-xl border border-line bg-surface px-4 py-6 hover:border-faint focus-visible:border-accent"
                  >
                    <Avatar name={p.name} color={p.color} size="lg" />
                    <span className="font-medium">{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <form onSubmit={submit} className="mt-8">
            <div className="flex items-center gap-3">
              <Avatar name={person.name} color={person.color} />
              <p className="font-medium">{person.name}</p>
            </div>
            <label htmlFor="password" className="mt-6 block text-sm text-muted">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent"
            />
            {error && (
              <p role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || !password}
              className="mt-4 w-full rounded-lg bg-accent px-3 py-2 font-medium text-accent-ink disabled:opacity-60"
            >
              {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
            </button>
            <button
              type="button"
              onClick={() => {
                setChosen(null)
                setPassword('')
                setError('')
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-sunken"
            >
              <ArrowLeft className="size-4" /> Başka kişi seç
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
