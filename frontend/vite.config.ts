import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {                    // All /api/* calls go to Django
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/admin': {                  // Optional: proxy Django admin too
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})