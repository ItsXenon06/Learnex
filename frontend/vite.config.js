import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Learnex/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:1008',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/Learnex${path}`,
      },
      '/uploads': {
        target: 'http://localhost:1008',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/Learnex${path}`,
      },
    },
  },
})