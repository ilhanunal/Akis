import { useState } from 'react'
import { ArrowRight, Gift, Move, PackageOpen, Sprout, X } from 'lucide-react'
import { CATALOG, CATEGORIES, growCost, landSize, stageOf, type Category } from '../../lib/garden/catalog'
import { buy, grow, place, stash } from '../../lib/cloud/garden'
import { personOf } from '../../lib/cloud/shared'
import { useBalance, useGardenOf, type GardenItem } from '../../store/garden'
import { useUI } from '../../store/ui'
import { Modal } from '../common/Modal'

export function Coins({ value, className = '' }: { value: number | null; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${className}`}>
      <span aria-hidden>🪙</span>
      {value ?? '–'}
      <span className="sr-only"> coin</span>
    </span>
  )
}

const btn = 'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50'
const primary = `${btn} bg-accent text-accent-ink`
const quiet = `${btn} border border-line hover:bg-sunken`

/** The shop. In someone else's garden it buys gifts that land in their inventory. */
export function Shop({
  owner,
  me,
  at,
  onClose,
}: {
  owner: string
  me: string
  at?: { x: number; y: number }
  onClose: () => void
}) {
  const balance = useBalance(me) ?? 0
  const toast = useUI((s) => s.toast)
  const [category, setCategory] = useState<Category>('bitki')
  const gift = owner !== me
  const to = personOf(owner)

  return (
    <Modal onClose={onClose} label={gift ? 'Hediye gönder' : 'Mağaza'} align="top" className="flex max-h-[80vh] w-full max-w-md flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-xl font-semibold">{gift ? `${to?.of} bahçesine hediye` : 'Mağaza'}</h2>
          <p className="text-sm text-muted">
            Bakiyen <Coins value={balance} className="font-medium text-ink" />
          </p>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-sunken hover:text-ink" aria-label="Kapat">
          <X className="size-5" />
        </button>
      </div>
      <div role="tablist" aria-label="Kategori" className="flex gap-1 px-5 pt-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={category === c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${category === c.id ? 'bg-sunken font-medium' : 'text-muted hover:text-ink'}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <ul className="overflow-y-auto px-3 py-3">
        {CATALOG.filter((c) => c.category === category).map((c) => {
          const last = c.stages[c.stages.length - 1]
          const short = c.price - balance
          return (
            <li key={c.type} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-sunken/60">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-garden text-2xl" aria-hidden>
                {last.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{last.name}</p>
                <p className="flex flex-wrap items-center gap-1 text-xs text-muted">
                  {c.stages.length > 1 ? (
                    c.stages.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1">
                        {i > 0 && <ArrowRight className="size-3 text-faint" aria-hidden />}
                        <span title={s.name}>{s.emoji}</span>
                      </span>
                    ))
                  ) : (
                    <span>Büyümez</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <button
                  disabled={short > 0}
                  onClick={async () => {
                    const ok = await buy(c.type, owner, me, at)
                    if (!ok) return
                    toast(gift ? `Hediye ${to?.of} envanterine gitti` : at ? `${c.stages[0].name} bahçene yerleşti` : `${c.stages[0].name} envanterine eklendi`)
                    onClose()
                  }}
                  className={`${primary} min-w-20`}
                >
                  <Coins value={c.price} />
                </button>
                {short > 0 && <span className="text-[11px] text-faint">{short} coin daha lazım</span>}
              </div>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}

function ItemPanel({ item, me, onMove, onClose }: { item: GardenItem; me: string; onMove: () => void; onClose: () => void }) {
  const balance = useBalance(me) ?? 0
  const stage = stageOf(item.type, item.level)
  const cost = growCost(item.type, item.level)
  const next = cost != null ? stageOf(item.type, item.level + 1) : null
  const stages = CATALOG.find((c) => c.type === item.type)?.stages.length ?? 1
  const from = item.giftFrom ? personOf(item.giftFrom) : undefined

  return (
    <Modal onClose={onClose} label={stage.name} className="w-full max-w-xs p-5">
      <div className="text-center">
        <span className="text-6xl" aria-hidden>
          {stage.emoji}
        </span>
        <h2 className="mt-2 font-display text-xl font-semibold">{stage.name}</h2>
        <p className="text-sm text-muted">
          {stages > 1 ? `Aşama ${item.level}/${stages}` : 'Büyümez'}
          {from && ` · ${from.from} hediye`}
        </p>
      </div>
      <div className="mt-5 grid gap-2">
        {next && cost != null && (
          <button
            disabled={balance < cost}
            onClick={() => {
              grow(item.id, me)
              onClose()
            }}
            className={primary}
          >
            <Sprout className="size-4" /> {next.emoji} {next.name} olarak büyüt · <Coins value={cost} />
          </button>
        )}
        {next && cost != null && balance < cost && (
          <p className="-mt-1 text-center text-xs text-faint">{cost - balance} coin daha lazım</p>
        )}
        <button onClick={onMove} className={quiet}>
          <Move className="size-4" /> Taşı
        </button>
        <button
          onClick={() => {
            stash(item.id)
            onClose()
          }}
          className={quiet}
        >
          <PackageOpen className="size-4" /> Envantere kaldır
        </button>
      </div>
    </Modal>
  )
}

/**
 * A plot of land. In your own garden empty squares open the shop and items open their panel;
 * anyone else's garden is shown read-only.
 */
export function Plot({ owner, me, editable, compact }: { owner: string; me: string; editable: boolean; compact?: boolean }) {
  const { land, items } = useGardenOf(owner)
  const n = landSize(land?.level ?? 1)
  const [placing, setPlacing] = useState<string | null>(null)
  const [shopAt, setShopAt] = useState<{ x: number; y: number } | null>(null)
  const [panel, setPanel] = useState<string | null>(null)

  const onPlot = (i: GardenItem) => i.x != null && i.y != null && i.x < n && i.y < n
  const cells = new Map(items.filter(onPlot).map((i) => [`${i.x},${i.y}`, i]))
  const inventory = items.filter((i) => !onPlot(i))
  const placingItem = placing ? items.find((i) => i.id === placing) : undefined
  const panelItem = panel ? items.find((i) => i.id === panel) : undefined

  const tap = (x: number, y: number) => {
    const item = cells.get(`${x},${y}`)
    if (placing) {
      if (!item) place(placing, x, y)
      setPlacing(null)
      return
    }
    if (item) setPanel(item.id)
    else setShopAt({ x, y })
  }

  return (
    <div>
      {placingItem && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-accent-soft px-3 py-2 text-sm" role="status">
          <span>
            {stageOf(placingItem.type, placingItem.level).emoji} Yerleştirmek için boş bir kareye dokun
          </span>
          <button onClick={() => setPlacing(null)} className="rounded-md px-2 py-0.5 text-muted hover:bg-surface hover:text-ink">
            Vazgeç
          </button>
        </div>
      )}
      <div
        className={`grid w-full gap-1 rounded-2xl bg-garden p-1.5 sm:gap-1.5 sm:p-2 ${compact ? 'max-w-sm' : 'max-w-[34rem]'}`}
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={`${personOf(owner)?.of} bahçesi, ${n}×${n}`}
      >
        {Array.from({ length: n * n }, (_, k) => {
          const x = k % n
          const y = Math.floor(k / n)
          const item = cells.get(`${x},${y}`)
          const stage = item && stageOf(item.type, item.level)
          const size = compact ? 'text-[clamp(1rem,4vw,1.75rem)]' : 'text-[clamp(1.25rem,7vw,2.5rem)]'
          const label = stage ? stage.name : 'Boş kare'
          const cell = `grid aspect-square place-items-center rounded-lg leading-none ${size}`
          return editable ? (
            <button
              key={k}
              onClick={() => tap(x, y)}
              aria-label={item ? `${label}, ayrıntılar` : placing ? 'Buraya yerleştir' : 'Boş kare, mağazayı aç'}
              className={`${cell} transition-colors ${
                item ? 'hover:bg-garden-cell' : placing ? 'bg-accent-soft/70 hover:bg-accent-soft' : 'bg-garden-cell/45 hover:bg-garden-cell'
              } ${item?.id === placing ? 'ring-2 ring-accent' : ''}`}
            >
              <span aria-hidden>{stage?.emoji}</span>
            </button>
          ) : (
            <div key={k} role="gridcell" aria-label={label} className={`${cell} ${item ? '' : 'bg-garden-cell/45'}`}>
              <span aria-hidden>{stage?.emoji}</span>
            </div>
          )
        })}
      </div>

      {inventory.length > 0 && (
        <section className="mt-4" aria-label="Envanter">
          <h3 className="mb-2 text-sm font-semibold">
            Envanter <span className="font-normal text-faint">{inventory.length}</span>
          </h3>
          <ul className="flex flex-wrap gap-2">
            {inventory.map((i) => {
              const s = stageOf(i.type, i.level)
              const from = i.giftFrom ? personOf(i.giftFrom) : undefined
              const body = (
                <>
                  <span className="text-xl" aria-hidden>
                    {s.emoji}
                  </span>
                  <span className="text-left">
                    <span className="block">{s.name}</span>
                    {from && (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Gift className="size-3" /> {from.from}
                      </span>
                    )}
                  </span>
                </>
              )
              return (
                <li key={i.id}>
                  {editable ? (
                    <button
                      onClick={() => setPlacing(placing === i.id ? null : i.id)}
                      aria-pressed={placing === i.id}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm ${
                        placing === i.id ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-faint'
                      }`}
                    >
                      {body}
                    </button>
                  ) : (
                    <span className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm">{body}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {shopAt && <Shop owner={owner} me={me} at={shopAt} onClose={() => setShopAt(null)} />}
      {panelItem && (
        <ItemPanel
          item={panelItem}
          me={me}
          onClose={() => setPanel(null)}
          onMove={() => {
            setPanel(null)
            setPlacing(panelItem.id)
          }}
        />
      )}
    </div>
  )
}
