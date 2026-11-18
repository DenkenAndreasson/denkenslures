import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // /api skickas vidare till Express. Då ligger frontend och backend på samma adress lokalt,
  // precis som på Vercel, och sessionscookien och Googles callback fungerar likadant.
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
