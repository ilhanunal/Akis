import { createJSONStorage } from 'zustand/middleware'

/**
 * The single place that decides where app data is persisted. Every store uses this.
 * On the web it is localStorage; a future mobile build only needs to swap this line
 * (e.g. AsyncStorage on React Native, Preferences on Capacitor).
 */
export const storage = createJSONStorage(() => localStorage)
