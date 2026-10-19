import { useState } from 'react'
import { ChevronDown, Expand, Gift, ShoppingBag } from 'lucide-react'
import { PEOPLE } from '../lib/cloud/config'
import { personOf } from '../lib/cloud/shared'
import { expandCost, landSize } from '../lib/garden/catalog'
import { RATES } from '../lib/garden/coins'
import { expandLand } from '../lib/cloud/garden'
import { dayKey, weekDays } from '../lib/dates'
import { useCloud } from '../store/cloud'
import { useBalance, useEarnings, useGarden, useGardenOf } from '../store/garden'
import { PageHeader } from '../components/common/PageHeader'
import { Coins, Plot, Shop } from '../components/garden/Garden'

const RULES = [
  [`Kendi alanında bitirdiğin her görev`, RATES.task],
  [`Ortak görevde kendi payını yapınca`, RATES.shared],
  [`İşaretlediğin her alışkanlık günü`, RATES.habit],
  [`Bir alışkanlığı Pazartesi–Pazar 7/7 yapınca`, RATES.habitWeek],
  [`En az bir görev bitirdiğin her gün`, RATES.daily],
] as const

function Rules() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md px-1 py-1 text-sm text-muted hover:text-ink"
      >
        <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        Coin nasıl kazanılır?
      </button>
      {open && (
        <ul className="mt-2 max-w-md space-y-1.5 text-sm">
          {RULES.map(([text, n]) => (
            <li key={text} className="flex items-center justify-between gap-4 border-b border-line pb-1.5 last:border-0">
              <span>{text}</span>
              <span className="shrink-0 font-medium tabular-nums">+{n} 🪙</span>
            </li>
          ))}
          <li className="pt-1 text-xs text-faint">Bir görevi geri alırsan kazandığı coin de geri gider.</li>
        </ul>
      )}
    </div>
  )
}

/** Your balance, this week's earnings and where they came from. */
function Wallet({ me }: { me: string }) {
  const balance = useBalance(me)
  const earned = useEarnings(me)
  const week = weekDays().reduce((sum, d) => sum + (earned?.byDay.get(dayKey(d)) ?? 0), 0)
  const parts = earned
    ? [
        ['Görevler', earned.breakdown.tasks],
        ['Ortak', earned.breakdown.shared],
        ['Alışkanlık', earned.breakdown.habits + earned.breakdown.habitWeeks],
        ['Seri', earned.breakdown.daily],
      ]
    : []
  return (
    <div className="mb-6 flex flex-wrap items-end gap-x-10 gap-y-4">
      <div>
        <p className="text-sm text-muted">Bakiye</p>
        <Coins value={balance} className={`font-display text-4xl font-semibold ${balance != null && balance < 0 ? 'text-danger' : ''}`} />
      </div>
      <div>
        <p className="text-sm text-muted">Bu hafta</p>
        <p className="font-display text-2xl font-semibold tabular-nums">+{week}</p>
      </div>
      {earned && earned.total > 0 && (
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {parts.map(([label, n]) => (
            <div key={label} className="flex gap-1.5">
              <dt className="text-muted">{label}</dt>
              <dd className="font-medium tabular-nums">{n}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function OwnGarden({ me }: { me: string }) {
  const { land } = useGardenOf(me)
  const balance = useBalance(me) ?? 0
  const [shop, setShop] = useState(false)
  const level = land?.level ?? 1
  const cost = expandCost(level)
  return (
    <>
      <PageHeader
        title={`${personOf(me)?.of} bahçesi`}
        subtitle="Görev bitirdikçe coin kazan, bahçeni büyüt. Boş bir kareye dokunup bir şey ekle."
        actions={
          <>
            <button onClick={() => setShop(true)} className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink">
              <ShoppingBag className="size-4" /> Mağaza
            </button>
            {cost != null && (
              <button
                onClick={() => expandLand(me, land)}
                disabled={balance < cost}
                title={balance < cost ? `${cost - balance} coin daha lazım` : undefined}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Expand className="size-4" /> {landSize(level + 1)}×{landSize(level + 1)} arsa · <Coins value={cost} />
              </button>
            )}
          </>
        }
      />
      <Wallet me={me} />
      <Plot owner={me} me={me} editable />
      <Rules />
      {shop && <Shop owner={me} me={me} onClose={() => setShop(false)} />}
    </>
  )
}

function VisitGarden({ owner, me }: { owner: string; me: string }) {
  const balance = useBalance(me)
  const [shop, setShop] = useState(false)
  const person = personOf(owner)!
  return (
    <>
      <PageHeader
        title={`${person.of} bahçesi`}
        subtitle={`Bu bahçeyi yalnızca ${person.name} düzenleyebilir. Kendi coin'inle hediye gönderebilirsin.`}
        actions={
          <button onClick={() => setShop(true)} className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink">
            <Gift className="size-4" /> Hediye gönder
          </button>
        }
      />
      <p className="mb-4 text-sm text-muted">
        Senin bakiyen <Coins value={balance} className="font-medium text-ink" />
      </p>
      <Plot owner={owner} me={me} editable={false} />
      {shop && <Shop owner={owner} me={me} onClose={() => setShop(false)} />}
    </>
  )
}

export function GardenView() {
  const me = useCloud((s) => s.person)
  const workspace = useCloud((s) => s.workspace)
  const ready = useGarden((s) => s.ready)
  if (!me || !workspace) return null
  if (!ready) return <p className="text-muted">Bahçe yükleniyor…</p>

  if (workspace === 'ortak')
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Bahçeler" subtitle="İkinizin bahçesi. Düzenlemek için kendi sekmene geç." />
        <div className="grid gap-8 md:grid-cols-2">
          {PEOPLE.map((p) => (
            <section key={p.id} aria-label={`${p.of} bahçesi`}>
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
                {p.of} bahçesi
              </h2>
              <Plot owner={p.id} me={me} editable={false} compact />
            </section>
          ))}
        </div>
      </div>
    )

  return <div className="mx-auto max-w-5xl">{workspace === me ? <OwnGarden me={me} /> : <VisitGarden owner={workspace} me={me} />}</div>
}
