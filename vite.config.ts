import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The page editor chunk (BlockNote) is ~1 MB but lazy-loaded, so only warn above that.
  build: { chunkSizeWarningLimit: 1100 },
  // 5173 is held by another local project's service worker; a separate port keeps the two apart.
  server: { port: 5180, strictPort: true },
  preview: { port: 5181 },
})
