// Plain data with no browser or build-tool dependencies, so the Netlify functions can import it too.

/** The two people who can sign in. Each has a workspace of their own; "ortak" is shared. */
export const PEOPLE = [
  // `at`, `of` and `from` carry the Turkish suffixes: "Sıra Sedef'te", "Sedef'in bugünü", "Sedef'ten".
  { id: 'ilhan', name: 'İlhan', at: "İlhan'da", of: "İlhan'ın", from: "İlhan'dan", email: 'ilhan@akis.com', color: '#1F6F66' },
  { id: 'sedef', name: 'Sedef', at: "Sedef'te", of: "Sedef'in", from: "Sedef'ten", email: 'sedef@akis.com', color: '#A04E7B' },
] as const

export type PersonId = (typeof PEOPLE)[number]['id']

export const personByEmail = (email?: string) => PEOPLE.find((p) => p.email === email?.toLowerCase())

/** Public half of the Web Push key pair; the private half lives only in Netlify's environment. */
export const VAPID_PUBLIC_KEY = 'BJKfLpG-7ovLCzTu7_d7p2kLET5IwJnQBAgRTB-Zpz5w6y8j8W9cfjxMZuQ2HKQj-BXTCqduTArdioI9u4Q7EMk'

/** Push subscription of one device, stored as an `items` row of kind 'push' in its owner's workspace. */
export interface PushDevice {
  id: string
  endpoint: string
  keys: { p256dh: string; auth: string }
  person: PersonId
  prefs: { notes: boolean; tasks: boolean; evening: boolean }
  device: string
  createdAt: string
}

/** Bare project URL even if "/rest/v1/" was pasted along with it. */
export const cleanSupabaseUrl = (url?: string) => url?.trim().replace(/\/(rest\/v1\/?)?$/, '').replace(/\/$/, '')
