// Push notifications: this device's subscription (an `items` row of kind 'push') and asking the
// Netlify function to notify the other person.
import { useCloud } from '../../store/cloud'
import { VAPID_PUBLIC_KEY, type PushDevice } from './people'
import { supabase } from './config'

export type PushPrefs = PushDevice['prefs']
export const DEFAULT_PREFS: PushPrefs = { notes: true, tasks: true, evening: true }

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function keyBytes(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** A stable row id per device: the same browser always maps to the same subscription row. */
async function rowId(endpoint: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return (
    'push-' +
    Array.from(new Uint8Array(hash).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('')
  )
}

function deviceName() {
  const ua = navigator.userAgent
  if (/iphone/i.test(ua)) return 'iPhone'
  if (/ipad/i.test(ua)) return 'iPad'
  if (/android/i.test(ua)) return 'Android'
  if (/windows/i.test(ua)) return 'Windows'
  if (/mac/i.test(ua)) return 'Mac'
  return 'Tarayıcı'
}

async function currentSubscription() {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  return (await reg?.pushManager.getSubscription()) ?? null
}

/** This device's saved settings, or null when it isn't subscribed. */
export async function loadDevice(): Promise<PushDevice | null> {
  const sub = await currentSubscription()
  if (!sub || !supabase) return null
  const { data } = await supabase.from('items').select('data').eq('id', await rowId(sub.endpoint)).maybeSingle()
  return (data?.data as PushDevice | undefined) ?? null
}

async function saveDevice(device: PushDevice) {
  if (!supabase) throw new Error('no db')
  const { error } = await supabase
    .from('items')
    .upsert({ id: device.id, workspace: device.person, kind: 'push', data: device })
  if (error) throw error
}

export async function enablePush(prefs: PushPrefs = DEFAULT_PREFS): Promise<PushDevice> {
  const person = useCloud.getState().person
  if (!person) throw new Error('Önce giriş yap.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Bildirim izni verilmedi.')
  const reg = await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }))
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
  const device: PushDevice = {
    id: await rowId(json.endpoint),
    endpoint: json.endpoint,
    keys: json.keys,
    person,
    prefs,
    device: deviceName(),
    createdAt: new Date().toISOString(),
  }
  await saveDevice(device)
  return device
}

export async function updatePrefs(device: PushDevice, prefs: PushPrefs) {
  const next = { ...device, prefs }
  await saveDevice(next)
  return next
}

export async function disablePush(device: PushDevice | null) {
  const sub = await currentSubscription()
  if (supabase) {
    const id = device?.id ?? (sub ? await rowId(sub.endpoint) : null)
    if (id) await supabase.from('items').delete().eq('id', id)
  }
  await sub?.unsubscribe()
}

export type NotifyEvent =
  | { type: 'note'; text: string }
  | { type: 'mark'; title: string; finished: boolean }
  | { type: 'test' }

/** Fire and forget: a failed notification never gets in the way of what the user just did. */
export async function notify(event: NotifyEvent) {
  if (!supabase) return false
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return false
    const res = await fetch('/.netlify/functions/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(event),
    })
    return res.ok
  } catch (err) {
    console.warn('Akış: bildirim gönderilemedi', err)
    return false
  }
}
