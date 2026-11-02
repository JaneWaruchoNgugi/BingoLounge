import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The lobby is a normal multi-file Vite app. Each game is a self-contained single-file build
// in public/games/, copied to dist/games/ as is and opened in a frame.
export default defineConfig({
  plugins: [react()],
  base: './',
})
