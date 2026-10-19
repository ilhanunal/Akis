// Loads every workspace's history and gardens, follows changes live, and writes garden purchases.
import type { RealtimeChannel } from '@supabase/supabase-js'
import { balanceNow, useGarden, type CoinRow, type GardenItem } from '../../store/garden'
import { useUI } from '../../store/ui'
import { uid } from '../id'
import { expandCost, growCost, itemOf, landSize } from '../garden/catalog'
import { supabase } from './config'

const PAGE = 1000
let channel: RealtimeChannel | null = null

async function fetchAll() {
  if (!supabase) return
  const rows: CoinRow[] = []
  // PostgREST caps a response at 1000 rows, so read the history in pages.
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('items')
      .select('id, workspace, kind, data')
      .in('kind', ['event', 'garden'])
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data as CoinRow[]))
    if (data.length < PAGE) break
  }
  useGarden.getState().setAll(rows)
}

const refresh = () => {
  if (document.visibilityState === 'visible' && channel) void fetchAll().catch(() => {})
}

export async function startGarden() {
  if (!supabase || channel) return
  const { put, drop } = useGarden.getState()
  channel = supabase
    .channel('garden')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items', filter: 'kind=in.(event,garden)' }, (p) => put(p.new as CoinRow))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter: 'kind=in.(event,garden)' }, (p) => put(p.new as CoinRow))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, (p) => {
      const id = (p.old as { id?: string }).id
      if (id) drop(id)
    })
    .subscribe()
  document.addEventListener('visibilitychange', refresh)
  try {
    await fetchAll()
  } catch (err) {
    console.error('Akış: bahçe yüklenemedi', err)
  }
}

export function stopGarden() {
  if (channel && supabase) void supabase.removeChannel(channel)
  channel = null
  document.removeEventListener('visibilitychange', refresh)
  useGarden.getState().reset()
}

/** Shows the change at once, then saves it; puts things back if the save fails. */
async function save(owner: string, next: GardenItem) {
  if (!supabase) return false
  const { rows, put, drop } = useGarden.getState()
  const before = rows[next.id]
  put({ id: next.id, workspace: owner, kind: 'garden', data: next })
  const { error } = await supabase.from('items').upsert({ id: next.id, workspace: owner, kind: 'garden', data: next })
  if (!error) return true
  console.error('Akış: bahçe kaydedilemedi', error)
  if (before) put(before)
  else drop(next.id)
  useUI.getState().toast('Kaydedilemedi. İnternet bağlantını kontrol et.')
  return false
}

function canAfford(me: string, cost: number) {
  const balance = balanceNow(me)
  if (balance >= cost) return true
  useUI.getState().toast(`${cost - balance} coin daha lazım.`)
  return false
}

const itemIn = (id: string) => {
  const row = useGarden.getState().rows[id]
  return row?.kind === 'garden' ? { owner: row.workspace, item: row.data as GardenItem } : undefined
}

/** Buys an item for `owner`'s garden, paid by `me`. A gift, or a full plot, sends it to the inventory. */
export function buy(type: string, owner: string, me: string, at?: { x: number; y: number }) {
  const entry = itemOf(type)
  if (!entry || !canAfford(me, entry.price)) return Promise.resolve(false)
  const gift = owner !== me
  const item: GardenItem = {
    id: uid(),
    type,
    level: 1,
    paid: { [me]: entry.price },
    createdAt: new Date().toISOString(),
    ...(gift ? { giftFrom: me } : at ?? {}),
  }
  return save(owner, item)
}

export function place(id: string, x: number, y: number) {
  const found = itemIn(id)
  if (!found) return
  void save(found.owner, { ...found.item, x, y })
}

export function stash(id: string) {
  const found = itemIn(id)
  if (!found) return
  const { x: _x, y: _y, ...rest } = found.item
  void save(found.owner, rest)
}

export function grow(id: string, me: string) {
  const found = itemIn(id)
  const cost = found && growCost(found.item.type, found.item.level)
  if (!found || cost == null || !canAfford(me, cost)) return
  const paid = { ...found.item.paid, [me]: (found.item.paid[me] ?? 0) + cost }
  void save(found.owner, { ...found.item, level: found.item.level + 1, paid })
}

export function expandLand(owner: string, land: GardenItem | undefined) {
  const level = land?.level ?? 1
  const cost = expandCost(level)
  if (cost == null || !canAfford(owner, cost)) return
  const base: GardenItem = land ?? { id: `land-${owner}`, type: 'land', level: 1, paid: {}, createdAt: new Date().toISOString() }
  void save(owner, { ...base, level: level + 1, paid: { ...base.paid, [owner]: (base.paid[owner] ?? 0) + cost } }).then(
    (ok) => ok && useUI.getState().toast(`Arsa ${landSize(level + 1)}×${landSize(level + 1)} oldu`),
  )
}
