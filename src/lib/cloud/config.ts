import { createClient } from '@supabase/supabase-js'
import { PEOPLE, cleanSupabaseUrl, type PersonId } from './people'

export { PEOPLE, personByEmail, type PersonId } from './people'

export type WorkspaceId = PersonId | 'ortak'

export const WORKSPACES: { id: WorkspaceId; name: string; title: string; within: string; color: string }[] = [
  { id: 'ilhan', name: 'İlhan', title: "İlhan'ın alanı", within: "İlhan'ın alanındaki", color: PEOPLE[0].color },
  { id: 'sedef', name: 'Sedef', title: "Sedef'in alanı", within: "Sedef'in alanındaki", color: PEOPLE[1].color },
  { id: 'ortak', name: 'Ortak', title: 'Ortak alan', within: 'Ortak alandaki', color: '#B7791F' },
]

// Supabase's Data API page shows the URL with "/rest/v1/" appended; the client needs the bare project URL.
const url = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const key = import.meta.env.VITE_SUPABASE_KEY?.trim()

/**
 * Without these variables the app runs as before: everything stays in this browser.
 * With them, data lives in Supabase and only the people above can sign in.
 */
export const supabase = url && key ? createClient(url, key) : null
export const cloudEnabled = supabase !== null
