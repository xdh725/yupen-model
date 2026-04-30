import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { snapshotApiPlugin } from './vite-plugin-snapshot-api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), snapshotApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
