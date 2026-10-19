import { createClient } from '@supabase/supabase-js'

/** The two people who can sign in. Each has a workspace of their own; "ortak" is shared. */
export const PEOPLE = [
  // `at`, `of` and `from` carry the Turkish suffixes: "Sıra Sedef'te", "Sedef'in bugünü", "Sedef'ten".
  { id: 'ilhan', name: 'İlhan', at: "İlhan'da", of: "İlhan'ın", from: "İlhan'dan", email: 'ilhan@akis.com', color: '#1F6F66' },
  { id: 'sedef', name: 'Sedef', at: "Sedef'te", of: "Sedef'in", from: "Sedef'ten", email: 'sedef@akis.com', color: '#A04E7B' },
] as const

export type PersonId = (typeof PEOPLE)[number]['id']
export type WorkspaceId = PersonId | 'ortak'

export const WORKSPACES: { id: WorkspaceId; name: string; title: string; within: string; color: string }[] = [
  { id: 'ilhan', name: 'İlhan', title: "İlhan'ın alanı", within: "İlhan'ın alanındaki", color: PEOPLE[0].color },
  { id: 'sedef', name: 'Sedef', title: "Sedef'in alanı", within: "Sedef'in alanındaki", color: PEOPLE[1].color },
  { id: 'ortak', name: 'Ortak', title: 'Ortak alan', within: 'Ortak alandaki', color: '#B7791F' },
]

export const personByEmail = (email?: string) => PEOPLE.find((p) => p.email === email?.toLowerCase())

// Supabase's Data API page shows the URL with "/rest/v1/" appended; the client needs the bare project URL.
const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/(rest\/v1\/?)?$/, '').replace(/\/$/, '')
const key = import.meta.env.VITE_SUPABASE_KEY?.trim()

/**
 * Without these variables the app runs as before: everything stays in this browser.
 * With them, data lives in Supabase and only the people above can sign in.
 */
export const supabase = url && key ? createClient(url, key) : null
export const cloudEnabled = supabase !== null
