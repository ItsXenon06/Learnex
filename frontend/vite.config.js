import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Learnex/', // Match server.servlet.context-path=/learnex
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:1008',
        changeOrigin: true,
        secure: false,
        // Rewrite: /api/posts → /learnex/api/posts
        rewrite: (path) => `/learnex${path}`,
      },
    },
  },
})