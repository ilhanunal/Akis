import { create } from 'zustand'
import type { PersonId, WorkspaceId } from '../lib/cloud/config'

export type SyncState = 'saved' | 'saving' | 'error'

// Session and sync status for cloud mode. Not persisted: Supabase keeps the session itself.
interface CloudState {
  /** undefined while the session is being restored, null when signed out. */
  person: PersonId | null | undefined
  workspace: WorkspaceId | null
  /** The workspace whose data the stores currently hold; null while one is loading. */
  loaded: WorkspaceId | null
  loading: boolean
  error: string
  sync: SyncState
  setPerson: (person: PersonId | null) => void
  setWorkspace: (workspace: WorkspaceId | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  setSync: (sync: SyncState) => void
}

export const useCloud = create<CloudState>()((set) => ({
  person: undefined,
  workspace: null,
  loaded: null,
  loading: false,
  error: '',
  sync: 'saved',
  setPerson: (person) => set({ person }),
  setWorkspace: (workspace) => set({ workspace }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSync: (sync) => set({ sync }),
}))
