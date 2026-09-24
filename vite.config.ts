import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `base: './'` keeps the build portable (any static host / sub-folder / file share).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // model-viewer (three.js) is lazy-loaded in its own chunk only when 3D opens
  build: { chunkSizeWarningLimit: 1200 },
  server: { host: true },
  preview: { host: true },
})
