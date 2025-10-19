import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    middlewareMode: false,
  },
  preview: {
    open: true,
    port: 5173,
    historyApiFallback: true,
  },
})
