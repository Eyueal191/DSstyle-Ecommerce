import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  // Storefront: http://localhost:5173 (must match backend FRONTEND_URL / ALLOWED_ORIGINS)
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
})
