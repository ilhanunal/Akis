import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storage } from '../lib/storage'

export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  name: string
  theme: Theme
  seeded: boolean
  setName: (name: string) => void
  setTheme: (theme: Theme) => void
  markSeeded: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      name: '',
      theme: 'system',
      seeded: false,
      setName: (name) => set({ name }),
      setTheme: (theme) => set({ theme }),
      markSeeded: () => set({ seeded: true }),
    }),
    { name: 'akis-settings', storage },
  ),
)
