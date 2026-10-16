import { create } from 'zustand'
import { uid } from '../lib/id'

interface Toast {
  id: string
  text: string
}

// Ephemeral UI state; deliberately not persisted.
interface UIState {
  paletteOpen: boolean
  drawerOpen: boolean
  openTaskId: string | null
  toasts: Toast[]
  setPalette: (open: boolean) => void
  setDrawer: (open: boolean) => void
  openTask: (id: string | null) => void
  toast: (text: string) => void
}

export const useUI = create<UIState>()((set) => ({
  paletteOpen: false,
  drawerOpen: false,
  openTaskId: null,
  toasts: [],
  setPalette: (paletteOpen) => set({ paletteOpen }),
  setDrawer: (drawerOpen) => set({ drawerOpen }),
  openTask: (openTaskId) => set({ openTaskId }),
  toast: (text) => {
    const id = uid()
    set((s) => ({ toasts: [...s.toasts, { id, text }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600)
  },
}))
