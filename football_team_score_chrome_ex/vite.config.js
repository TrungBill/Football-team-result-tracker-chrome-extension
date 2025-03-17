import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),        // existing main entry
        popup: resolve(__dirname, 'public/popup.html') // new popup entry
      }
    },
    outDir: 'dist'
  }
})
