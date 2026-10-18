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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
