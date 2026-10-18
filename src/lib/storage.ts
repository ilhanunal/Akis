import { createJSONStorage, type StateStorage } from 'zustand/middleware'
import { cloudEnabled } from './cloud/config'

/**
 * The single place that decides where app data is persisted. Every store uses this.
 * On the web it is localStorage; a future mobile build only needs to swap this line
 * (e.g. AsyncStorage on React Native, Preferences on Capacitor).
 */
export const storage = createJSONStorage(() => localStorage)

const memory: StateStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }

/**
 * Storage for tasks, pages, habits and history. In cloud mode the database is the source of truth
 * (see cloud/sync.ts), so nothing is written locally and earlier local data stays untouched for import.
 */
export const dataStorage = cloudEnabled ? createJSONStorage(() => memory) : storage
