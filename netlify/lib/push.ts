// Shared by the Netlify functions: Supabase access and sending Web Push messages.
import webpush from 'web-push'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { VAPID_PUBLIC_KEY, cleanSupabaseUrl, type PushDevice } from '../../src/lib/cloud/people'

export interface Message {
  title: string
  body: string
  url?: string
  tag?: string
}

const env = (name: string) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} tanımlı değil`)
  return value
}

export const supabaseUrl = () => cleanSupabaseUrl(env('VITE_SUPABASE_URL'))!

/** A client that acts as the signed-in caller, so the database's row rules still apply. */
export const asUser = (token: string) =>
  createClient(supabaseUrl(), env('VITE_SUPABASE_KEY'), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

/** Full access, for the scheduled reminder that runs with nobody signed in. */
export const asService = () =>
  createClient(supabaseUrl(), env('SUPABASE_SERVICE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } })

/** Sends to every device; devices whose subscription has expired are removed. */
export async function sendTo(db: SupabaseClient, devices: PushDevice[], message: Message) {
  webpush.setVapidDetails('https://akis-planla.netlify.app', VAPID_PUBLIC_KEY, env('VAPID_PRIVATE_KEY'))
  let sent = 0
  await Promise.all(
    devices.map(async (d) => {
      try {
        await webpush.sendNotification({ endpoint: d.endpoint, keys: d.keys }, JSON.stringify(message), { TTL: 12 * 3600 })
        sent++
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await db.from('items').delete().eq('id', d.id)
        else console.error('push failed', status, (err as Error).message)
      }
    }),
  )
  return sent
}

export async function devicesOf(db: SupabaseClient, person: string) {
  const { data, error } = await db.from('items').select('data').eq('kind', 'push').eq('workspace', person)
  if (error) throw error
  return (data ?? []).map((r) => r.data as PushDevice)
}
