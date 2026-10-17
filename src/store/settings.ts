import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storage } from '../lib/storage'

export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  name: string
  theme: Theme
  seeded: boolean
  /** Browser spell checking in every text field. Off by default: browsers often check Turkish against an English dictionary. */
  spellcheck: boolean
  setName: (name: string) => void
  setTheme: (theme: Theme) => void
  setSpellcheck: (on: boolean) => void
  markSeeded: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      name: '',
      theme: 'system',
      seeded: false,
      spellcheck: false,
      setName: (name) => set({ name }),
      setTheme: (theme) => set({ theme }),
      setSpellcheck: (spellcheck) => set({ spellcheck }),
      markSeeded: () => set({ seeded: true }),
    }),
    { name: 'akis-settings', storage },
  ),
)
