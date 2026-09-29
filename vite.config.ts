import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  // Hashed build output lives apart from public/assets (logo, photos) so vercel.json
  // can cache it forever without also freezing files that keep their names.
  build: { assetsDir: 'static' },
})
