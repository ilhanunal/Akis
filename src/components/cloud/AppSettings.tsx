import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, Download, Share, Smartphone, SquarePlus, X } from 'lucide-react'
import { isIOS, isMobile, isStandalone, promptInstall, useCanPromptInstall } from '../../lib/pwa'
import {
  DEFAULT_PREFS,
  disablePush,
  enablePush,
  loadDevice,
  notify,
  pushSupported,
  updatePrefs,
  type PushPrefs,
} from '../../lib/cloud/push'
import type { PushDevice } from '../../lib/cloud/people'
import { useUI } from '../../store/ui'
import { SettingsRow } from '../common/SettingsRow'

const btn = 'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50'

/** How to put Akış on the home screen, for whichever phone or browser this is. */
export function InstallRow() {
  const canPrompt = useCanPromptInstall()
  const toast = useUI((s) => s.toast)
  if (isStandalone())
    return <SettingsRow id="uygulama" title="Telefona yükle" description="Akış şu an uygulama olarak açık." />

  return (
    <SettingsRow
      id="uygulama"
      title="Telefona yükle"
      description={
        isIOS() ? (
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>
              Bu sayfayı <strong>Safari</strong>'de aç.
            </li>
            <li>
              Alttaki <Share className="inline size-4 align-text-bottom" aria-label="Paylaş" /> Paylaş düğmesine dokun.
            </li>
            <li>
              <SquarePlus className="inline size-4 align-text-bottom" aria-hidden /> <strong>Ana Ekrana Ekle</strong>'yi seç, sonra Ekle'ye dokun.
            </li>
            <li>Akış'ı ana ekrandaki ikondan aç; bildirimler ancak böyle açıldığında çalışır.</li>
          </ol>
        ) : canPrompt ? (
          'Akış ana ekranında bir uygulama gibi durur ve tam ekran açılır.'
        ) : (
          <>
            Tarayıcının menüsünden (<strong>⋮</strong>) <strong>Uygulamayı yükle</strong> ya da <strong>Ana ekrana ekle</strong>'yi seç.
            Telefonda Chrome önerilir.
          </>
        )
      }
    >
      {canPrompt && (
        <button
          onClick={async () => {
            if (await promptInstall()) toast('Akış ana ekrana eklendi')
          }}
          className={`${btn} bg-accent text-accent-ink`}
        >
          <Download className="size-4" /> Ana ekrana ekle
        </button>
      )}
    </SettingsRow>
  )
}

const PREF_LABELS: [keyof PushPrefs, string][] = [
  ['notes', 'Yeni not bırakılınca'],
  ['tasks', 'Ortak görevde sıra bana gelince'],
  ['evening', 'Akşam 21:00 hatırlatması'],
]

/** Push notifications for this device: switch on or off, and which kinds. */
export function NotificationsRow() {
  const toast = useUI((s) => s.toast)
  const [device, setDevice] = useState<PushDevice | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const supported = pushSupported()
  const iosBrowser = isIOS() && !isStandalone()
  const denied = supported && Notification.permission === 'denied'

  useEffect(() => {
    if (!supported) return setLoading(false)
    loadDevice()
      .then(setDevice)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [supported])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError((err as Error).message || 'Bir şey ters gitti.')
    } finally {
      setBusy(false)
    }
  }

  let description: React.ReactNode = "Biriniz not bırakınca, ortak görevde sıra sana gelince ve akşam 21:00'de (yapılmamış alışkanlık ya da girilmemiş adım varsa) bu cihaza bildirim gelir."
  if (iosBrowser) description = "iPhone'da bildirimler için önce Akış'ı ana ekrana ekleyip oradan açman gerekiyor (yukarıdaki adımlar)."
  else if (!supported) description = 'Bu tarayıcı bildirimleri desteklemiyor.'
  else if (denied)
    description = 'Bu cihazda Akış için bildirim izni kapalı. Telefonun ayarlarından ya da tarayıcının site ayarlarından açabilirsin.'

  return (
    <SettingsRow id="bildirimler" title="Bildirimler" description={description}>
      {supported && !iosBrowser && !denied && !loading && (
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          <button
            role="switch"
            aria-checked={!!device}
            aria-label="Bu cihazda bildirimler"
            disabled={busy}
            onClick={() =>
              run(async () => {
                if (device) {
                  await disablePush(device)
                  setDevice(null)
                  toast('Bildirimler kapatıldı')
                } else {
                  setDevice(await enablePush(DEFAULT_PREFS))
                  toast('Bildirimler açıldı')
                }
              })
            }
            className={`relative h-6 w-11 shrink-0 self-end rounded-full transition-colors ${device ? 'bg-accent' : 'bg-line'}`}
          >
            <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform ${device ? 'translate-x-5' : ''}`} />
          </button>
          {device && (
            <>
              <ul className="space-y-1.5 text-sm">
                {PREF_LABELS.map(([key, label]) => (
                  <li key={key}>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={device.prefs[key]}
                        disabled={busy}
                        onChange={(e) =>
                          run(async () => setDevice(await updatePrefs(device, { ...device.prefs, [key]: e.target.checked })))
                        }
                        className="size-4 accent-[var(--accent)]"
                      />
                      {label}
                    </label>
                  </li>
                ))}
              </ul>
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const ok = await notify({ type: 'test' })
                    if (!ok) throw new Error('Deneme bildirimi gönderilemedi.')
                    toast('Deneme bildirimi gönderildi')
                  })
                }
                className={`${btn} border border-line hover:bg-sunken`}
              >
                <BellRing className="size-4" /> Deneme bildirimi gönder
              </button>
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </SettingsRow>
  )
}

const HINT_KEY = 'akis-install-hint'

/** A one-time nudge on phones opened in the browser: Akış works better from the home screen. */
export function InstallHint() {
  const [hidden, setHidden] = useState(() => {
    try {
      return !isMobile() || isStandalone() || localStorage.getItem(HINT_KEY) !== null
    } catch {
      return true
    }
  })
  if (hidden) return null
  const close = () => {
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {
      /* storage unavailable */
    }
    setHidden(true)
  }
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm">
      <Smartphone className="size-5 shrink-0 text-accent" aria-hidden />
      <p className="min-w-0 flex-1">
        Akış'ı telefonuna uygulama olarak ekle; tam ekran açılır, bildirim alırsın.{' '}
        <Link to="/ayarlar#uygulama" onClick={close} className="font-medium text-accent underline">
          Nasıl?
        </Link>
      </p>
      <button onClick={close} className="rounded-md p-1 text-muted hover:bg-surface hover:text-ink" aria-label="Kapat">
        <X className="size-4" />
      </button>
    </div>
  )
}
