// Keeps the stores of the open workspace in step with the `items` table.
// Stores stay the single API for the views: local edits are diffed and written out,
// remote edits arrive over Realtime and are applied without being written back.
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { StoreApi, UseBoundStore } from 'zustand'
import { useActivity } from '../../store/activity'
import { useCloud } from '../../store/cloud'
import { useHabits } from '../../store/habits'
import { usePages } from '../../store/pages'
import { useTasks } from '../../store/tasks'
import { uid } from '../id'
import { supabase, type WorkspaceId } from './config'

type Kind = 'task' | 'page' | 'habit' | 'event'
type Item = { id: string; createdAt?: string; date?: string }
interface Row {
  id: string
  workspace: WorkspaceId
  kind: Kind
  data: Item
  client_id: string | null
}

interface Source {
  kind: Kind
  store: UseBoundStore<StoreApi<object>>
  key: string
}

const SOURCES: Source[] = [
  { kind: 'task', store: useTasks as never, key: 'tasks' },
  { kind: 'page', store: usePages as never, key: 'pages' },
  { kind: 'habit', store: useHabits as never, key: 'habits' },
  { kind: 'event', store: useActivity as never, key: 'events' },
]

const list = (s: Source) => (s.store.getState() as Record<string, Item[]>)[s.key]
const setList = (s: Source, items: Item[]) => s.store.setState({ [s.key]: items })

/** Identifies this tab, so our own writes echoed back by Realtime are ignored. */
const CLIENT_ID = uid()

let workspace: WorkspaceId | null = null
let applyingRemote = false
let channel: RealtimeChannel | null = null
/** Latest unsaved state per item id; `null` data means delete. */
const pending = new Map<string, { kind: Kind; workspace: WorkspaceId; data: Item | null }>()
let flushTimer: ReturnType<typeof setTimeout> | undefined
let flushing = false

function applyRemote(fn: () => void) {
  applyingRemote = true
  try {
    fn()
  } finally {
    applyingRemote = false
  }
}

function scheduleFlush(delay = 500) {
  clearTimeout(flushTimer)
  flushTimer = setTimeout(flush, delay)
  useCloud.getState().setSync('saving')
}

async function flush() {
  if (!supabase || flushing || pending.size === 0) {
    if (pending.size === 0) useCloud.getState().setSync('saved')
    return
  }
  flushing = true
  const batch = new Map(pending)
  pending.clear()
  const upserts = [...batch].filter(([, p]) => p.data).map(([id, p]) => ({
    id,
    workspace: p.workspace,
    kind: p.kind,
    data: p.data,
    client_id: CLIENT_ID,
  }))
  const deletes = [...batch].filter(([, p]) => !p.data).map(([id]) => id)
  try {
    if (upserts.length) {
      const { error } = await supabase.from('items').upsert(upserts)
      if (error) throw error
    }
    if (deletes.length) {
      const { error } = await supabase.from('items').delete().in('id', deletes)
      if (error) throw error
    }
    flushing = false
    if (pending.size) scheduleFlush(0)
    else useCloud.getState().setSync('saved')
  } catch (err) {
    console.error('Akış: kaydedilemedi', err)
    // Put the batch back unless a newer edit of the same item is already waiting.
    for (const [id, p] of batch) if (!pending.has(id)) pending.set(id, p)
    flushing = false
    useCloud.getState().setSync('error')
    clearTimeout(flushTimer)
    flushTimer = setTimeout(flush, 5000)
  }
}

/** Immutable updates mean a changed item is a new object, so a reference check finds every edit. */
function watch(source: Source) {
  source.store.subscribe((state, prev) => {
    if (applyingRemote || !workspace) return
    const next = (state as Record<string, Item[]>)[source.key]
    const before = (prev as Record<string, Item[]>)[source.key]
    if (next === before) return
    const old = new Map(before.map((i) => [i.id, i]))
    const ids = new Set<string>()
    for (const item of next) {
      ids.add(item.id)
      if (old.get(item.id) !== item) pending.set(item.id, { kind: source.kind, workspace, data: item })
    }
    for (const item of before) if (!ids.has(item.id)) pending.set(item.id, { kind: source.kind, workspace, data: null })
    scheduleFlush()
  })
}
SOURCES.forEach(watch)

const sortKey = (i: Item) => i.createdAt ?? i.date ?? ''

function receive(row: Row) {
  if (row.client_id === CLIENT_ID || pending.has(row.id) || row.workspace !== workspace) return
  const source = SOURCES.find((s) => s.kind === row.kind)
  if (!source) return
  const items = list(source)
  const at = items.findIndex((i) => i.id === row.id)
  applyRemote(() =>
    setList(source, at === -1 ? [...items, row.data] : items.map((i, n) => (n === at ? row.data : i))),
  )
}

function receiveDelete(id: string) {
  if (pending.has(id)) return
  for (const source of SOURCES) {
    const items = list(source)
    if (items.some((i) => i.id === id)) applyRemote(() => setList(source, items.filter((i) => i.id !== id)))
  }
}

async function fetchWorkspace(ws: WorkspaceId) {
  if (!supabase) return
  const { data, error } = await supabase.from('items').select('id, workspace, kind, data, client_id').eq('workspace', ws)
  if (error) throw error
  if (workspace !== ws) return // switched again while loading
  const rows = data as Row[]
  applyRemote(() => {
    for (const source of SOURCES) {
      const fresh = rows
        .filter((r) => r.kind === source.kind && !pending.has(r.id))
        .map((r) => r.data)
      // Keep local items that are still waiting to be saved.
      const unsaved = list(source).filter((i) => pending.get(i.id)?.data)
      setList(source, [...fresh, ...unsaved].sort((a, b) => sortKey(a).localeCompare(sortKey(b))))
    }
  })
}

/** Switches every store to the given workspace and starts listening for the other person's edits. */
export async function openWorkspace(ws: WorkspaceId) {
  if (!supabase) return
  const cloud = useCloud.getState()
  workspace = ws
  cloud.setLoading(true)
  if (channel) void supabase.removeChannel(channel)
  applyRemote(() => SOURCES.forEach((s) => setList(s, [])))

  channel = supabase
    .channel(`items-${ws}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items', filter: `workspace=eq.${ws}` }, (p) =>
      receive(p.new as Row),
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter: `workspace=eq.${ws}` }, (p) =>
      receive(p.new as Row),
    )
    // Delete events can't be filtered; ids from other workspaces simply aren't found.
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, (p) => {
      const id = (p.old as { id?: string }).id
      if (id) receiveDelete(id)
    })
    .subscribe()

  try {
    await fetchWorkspace(ws)
    if (workspace === ws) cloud.setError('')
  } catch (err) {
    console.error('Akış: yüklenemedi', err)
    cloud.setError('Veriler yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile.')
  } finally {
    if (workspace === ws) cloud.setLoading(false)
  }
}

export function closeWorkspace() {
  workspace = null
  if (channel && supabase) void supabase.removeChannel(channel)
  channel = null
  applyRemote(() => SOURCES.forEach((s) => setList(s, [])))
}

export const hasUnsaved = () => pending.size > 0 || flushing

if (typeof window !== 'undefined') {
  // Realtime can miss events while a laptop sleeps or a phone is in the background; catch up on return.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && workspace) void fetchWorkspace(workspace).catch(() => {})
    if (document.visibilityState === 'hidden') void flush()
  })
  window.addEventListener('beforeunload', (e) => {
    if (!hasUnsaved()) return
    void flush()
    e.preventDefault()
  })
}
