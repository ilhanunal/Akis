import { useMemo } from 'react'
import { create } from 'zustand'
import type { ActivityEvent } from '../types'
import { earnings, spent, type Earnings, type OwnedEvent } from '../lib/garden/coins'
import { useActivity } from './activity'
import { useCloud } from './cloud'

export interface GardenItem {
  id: string
  /** Catalog key, or 'land' for the plot itself. */
  type: string
  /** Position on the plot; both missing means it waits in the inventory. */
  x?: number
  y?: number
  level: number
  /** Coins each person has put into this item (purchase plus growth). */
  paid: Record<string, number>
  giftFrom?: string
  createdAt: string
}

export interface CoinRow {
  id: string
  workspace: string
  kind: 'event' | 'garden'
  data: ActivityEvent | GardenItem
}

// Every workspace's history and gardens, kept apart from the open workspace's stores:
// a balance needs your own workspace plus your shared-task marks, whichever tab is open.
interface GardenState {
  rows: Record<string, CoinRow>
  ready: boolean
  setAll: (rows: CoinRow[]) => void
  put: (row: CoinRow) => void
  drop: (id: string) => void
  reset: () => void
}

export const useGarden = create<GardenState>()((set) => ({
  rows: {},
  ready: false,
  setAll: (rows) => set({ rows: Object.fromEntries(rows.map((r) => [r.id, r])), ready: true }),
  put: (row) => set((s) => ({ rows: { ...s.rows, [row.id]: row } })),
  drop: (id) =>
    set((s) => {
      if (!s.rows[id]) return s
      const rows = { ...s.rows }
      delete rows[id]
      return { rows }
    }),
  reset: () => set({ rows: {}, ready: false }),
}))

/**
 * History from the database, except for the open workspace, whose local events are used instead
 * so a finished task pays out at once rather than after the save round trip.
 */
function ownedEvents(rows: Record<string, CoinRow>, local: ActivityEvent[], open: string | null) {
  const useLocal = open
  const out: OwnedEvent[] = []
  for (const r of Object.values(rows))
    if (r.kind === 'event' && !(useLocal && r.workspace === open)) out.push({ workspace: r.workspace, event: r.data as ActivityEvent })
  if (useLocal) for (const e of local) out.push({ workspace: open, event: e })
  return out
}

const gardenRows = (rows: Record<string, CoinRow>) =>
  Object.values(rows).filter((r) => r.kind === 'garden') as (CoinRow & { data: GardenItem })[]

/** Snapshot outside React, for checks right before spending. */
export function balanceNow(person: string) {
  const { rows } = useGarden.getState()
  const events = ownedEvents(rows, useActivity.getState().events, useCloud.getState().loaded)
  return earnings(events, person).total - spent(gardenRows(rows).map((r) => r.data), person)
}

export function useEarnings(person: string | null | undefined): Earnings | null {
  const rows = useGarden((s) => s.rows)
  const ready = useGarden((s) => s.ready)
  const local = useActivity((s) => s.events)
  // Only trust the local stores once they hold the open workspace (`loaded`), not mid-switch.
  const open = useCloud((s) => s.loaded)
  return useMemo(
    () => (person && ready ? earnings(ownedEvents(rows, local, open), person) : null),
    [rows, ready, local, open, person],
  )
}

export function useBalance(person: string | null | undefined) {
  const earned = useEarnings(person)
  const rows = useGarden((s) => s.rows)
  return useMemo(
    () => (earned && person ? earned.total - spent(gardenRows(rows).map((r) => r.data), person) : null),
    [earned, rows, person],
  )
}

/** One person's garden: the plot (land row) and everything in it or waiting in the inventory. */
export function useGardenOf(owner: string) {
  const rows = useGarden((s) => s.rows)
  return useMemo(() => {
    const mine = gardenRows(rows).filter((r) => r.workspace === owner).map((r) => r.data)
    return {
      land: mine.find((i) => i.type === 'land'),
      items: mine.filter((i) => i.type !== 'land').sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }
  }, [rows, owner])
}
