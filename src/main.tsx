import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { seedIfNeeded } from './lib/seed'
import { cloudEnabled } from './lib/cloud/config'
import { initAuth } from './lib/cloud/auth'
// Fonts ship with the app instead of loading from Google, so visitors' browsers contact no third party.
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/instrument-sans'
import './index.css'

if (cloudEnabled) {
  initAuth()
} else {
  // Stores hydrate synchronously from localStorage, so the seed check sees real data.
  seedIfNeeded()
}

if (import.meta.env.DEV) {
  // Dev-only handle for poking at state from the console; stripped from production builds.
  void Promise.all([import('./store/cloud'), import('./store/tasks'), import('./store/activity')]).then(([c, t, a]) => {
    Object.assign(window, { __akis: { cloud: c.useCloud, tasks: t.useTasks, activity: a.useActivity } })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
