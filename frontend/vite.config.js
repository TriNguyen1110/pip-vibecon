import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PIP_API_PROXY lets a second backend (e.g. a private test copy) stand in for :8001.
const API = process.env.PIP_API_PROXY || 'http://localhost:8001'

export default defineConfig({
  plugins: [react()],
  // Emergent serves the app on its own hostname: allow any Host header (Vite >= 5.4.12 blocks unknown hosts).
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': { target: API, changeOrigin: true },
    },
  },
  preview: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': { target: API, changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
