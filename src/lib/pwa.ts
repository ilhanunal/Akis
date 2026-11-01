// Installing Akış as an app on a phone: service worker registration and the install prompt.
import { useSyncExternalStore } from 'react'

interface InstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPrompt | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function registerServiceWorker() {
  // Production only: in development a cached app would hide code changes.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error('Akış: service worker kaydedilemedi', err))
  })
  // Chrome on Android offers its own install button; keep the event so ours can trigger it.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPrompt
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
}

/** Opened from the home screen icon rather than a browser tab. */
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isMobile = () => isIOS() || /android/i.test(navigator.userAgent)

/** Whether the browser's own install dialog can be opened from a button. */
export function useCanPromptInstall() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => deferred !== null,
  )
}

export async function promptInstall() {
  if (!deferred) return false
  await deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  emit()
  return outcome === 'accepted'
}
