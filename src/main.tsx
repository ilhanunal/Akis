import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { seedIfNeeded } from './lib/seed'
import { cloudEnabled } from './lib/cloud/config'
import { cleanSupabaseUrl } from './lib/cloud/people'
import { initAuth } from './lib/cloud/auth'
import { registerServiceWorker } from './lib/pwa'
// Fonts ship with the app instead of loading from Google, so visitors' browsers contact no third party.
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/instrument-sans'
import './index.css'

if (cloudEnabled) {
  // Open the connection to the database while the app is still starting, so the first request doesn't wait for it.
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)!
  link.crossOrigin = ''
  document.head.append(link)
  initAuth()
} else {
  // Stores hydrate synchronously from localStorage, so the seed check sees real data.
  seedIfNeeded()
}

if (import.meta.env.DEV) {
  // Dev-only handle for poking at state from the console; stripped from production builds.
  void Promise.all([import('./store/cloud'), import('./store/tasks'), import('./store/activity'), import('./store/garden'), import('./store/habits'), import('./store/notes')]).then(([c, t, a, g, h, n]) => {
    Object.assign(window, {
      __akis: { cloud: c.useCloud, tasks: t.useTasks, activity: a.useActivity, garden: g.useGarden, habits: h.useHabits, notes: n.useNotes },
    })
  })
}

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
