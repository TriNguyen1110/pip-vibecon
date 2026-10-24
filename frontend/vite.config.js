import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Emergent serves the app on its own hostname: allow any Host header (Vite >= 5.4.12 blocks unknown hosts).
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://localhost:8001', changeOrigin: true },
    },
  },
  preview: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://localhost:8001', changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
