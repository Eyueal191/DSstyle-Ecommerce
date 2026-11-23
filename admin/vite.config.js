import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Admin: http://localhost:5174 (must match backend ADMIN_FRONTEND_URL / ALLOWED_ORIGINS)
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
})
