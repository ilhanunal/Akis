import { useEffect, useRef, useState } from 'react'
import { Download, Monitor, Moon, Sun, Upload } from 'lucide-react'
import { useSettings, type Theme } from '../store/settings'
import { useUI } from '../store/ui'
import { resetData } from '../lib/backup'
import { downloadBackup, restoreFromFile } from '../lib/backupWeb'
import { PageHeader } from '../components/common/PageHeader'
import { Modal } from '../components/common/Modal'
import { SettingsRow } from '../components/common/SettingsRow'
import { InstallRow, NotificationsRow } from '../components/cloud/AppSettings'
import { useLocation } from 'react-router-dom'
import { cloudEnabled, WORKSPACES } from '../lib/cloud/config'
import { useCloud } from '../store/cloud'

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Açık', icon: Sun },
  { value: 'dark', label: 'Koyu', icon: Moon },
  { value: 'system', label: 'Sistem', icon: Monitor },
]

export function SettingsView() {
  const { name, setName, theme, setTheme, spellcheck, setSpellcheck } = useSettings()
  const toast = useUI((s) => s.toast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [error, setError] = useState('')
  const workspaceId = useCloud((s) => s.workspace)
  const workspace = WORKSPACES.find((w) => w.id === workspaceId)
  // In cloud mode backup, restore and reset act on the open workspace only.
  const scope = cloudEnabled && workspace ? workspace.within : 'Bu tarayıcıdaki'
  const { hash } = useLocation()

  // Links such as /ayarlar#bildirimler land on that row.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ayarlar" />

      {!cloudEnabled && (
        <SettingsRow title="Adın" description="Bugün ekranındaki selamlamada kullanılır.">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adın"
            className="w-56 rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent"
          />
        </SettingsRow>
      )}

      <SettingsRow title="Tema" description="Sistem seçeneği cihazının ayarını izler.">
        <div role="radiogroup" aria-label="Tema" className="inline-flex rounded-lg bg-sunken p-0.5">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              role="radio"
              aria-checked={theme === value}
              onClick={() => setTheme(value)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
                theme === value ? 'bg-surface font-medium shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </SettingsRow>

      <SettingsRow
        title="Yazım denetimi"
        description="Açıkken tarayıcı, yanlış sandığı kelimelerin altını kırmızıyla çizer. Tarayıcın İngilizce sözlük kullanıyorsa doğru Türkçe kelimeler de işaretlenebilir."
      >
        <button
          role="switch"
          aria-checked={spellcheck}
          aria-label="Yazım denetimi"
          onClick={() => setSpellcheck(!spellcheck)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${spellcheck ? 'bg-accent' : 'bg-line'}`}
        >
          <span
            className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform ${
              spellcheck ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </SettingsRow>

      <InstallRow />
      {cloudEnabled && <NotificationsRow />}

      <SettingsRow
        title="Yedekle"
        description={
          cloudEnabled
            ? `${scope} görevleri, sayfaları ve alışkanlıkları dosyaya indir ya da dosyadan bu alana geri yükle.`
            : 'Verilerin yalnızca bu tarayıcıda durur. Başka cihaza taşımak ya da güvende tutmak için yedek dosyası indir.'
        }
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              downloadBackup()
              toast('Yedek indirildi')
            }}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
          >
            <Download className="size-4" /> Yedeği indir
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm hover:bg-sunken"
          >
            <Upload className="size-4" /> Yedekten geri yükle
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              try {
                await restoreFromFile(file)
                setError('')
                toast('Yedek geri yüklendi')
              } catch (err) {
                setError((err as Error).message)
              }
            }}
          />
        </div>
        {error && (
          <p role="alert" className="w-full text-sm text-danger">
            {error}
          </p>
        )}
      </SettingsRow>

      <SettingsRow
        title="Verileri sıfırla"
        description={
          cloudEnabled
            ? `${scope} tüm görevleri, sayfaları ve alışkanlıkları ikiniz için de siler. Geri alınamaz.`
            : 'Tüm görevleri, sayfaları ve alışkanlıkları bu tarayıcıdan siler. Geri alınamaz.'
        }
      >
        <button
          onClick={() => setConfirmReset(true)}
          className="rounded-lg border border-danger/40 px-3 py-2 text-sm text-danger hover:bg-danger-soft"
        >
          Verileri sıfırla
        </button>
      </SettingsRow>

      {confirmReset && (
        <Modal onClose={() => setConfirmReset(false)} label="Verileri sıfırla" className="max-w-sm p-5">
          <h2 className="font-display text-xl font-semibold">
            {cloudEnabled && workspace ? `${workspace.within} her şey silinsin mi?` : 'Tüm veriler silinsin mi?'}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Görevler, sayfalar, alışkanlıklar ve ilerleme geçmişi silinir. Önce yedek indirmen önerilir.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setConfirmReset(false)} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-sunken">
              Vazgeç
            </button>
            <button
              onClick={() => {
                resetData()
                setConfirmReset(false)
                toast('Veriler sıfırlandı')
              }}
              className="rounded-lg bg-danger px-3 py-2 text-sm font-medium text-white"
            >
              Verileri sil
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
