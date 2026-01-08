import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      // Proxy forwarding URLs to backend
      // Matches pattern: /{user_key}/{slug} where user_key and slug are alphanumeric
      '^/([a-zA-Z0-9]+)/([a-zA-Z0-9_-]+)$': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path // Keep the path as-is
      }
    }
  }
})
