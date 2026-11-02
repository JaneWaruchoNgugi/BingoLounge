import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Builds one game (run from inside its folder) into a single self-contained index.html,
// with scripts, styles and sound samples inlined, so the lobby can open it from public/games/.
export default defineConfig({
  root: process.cwd(),
  plugins: [react(), viteSingleFile()],
  build: { assetsInlineLimit: 100000000, outDir: 'dist', emptyOutDir: true },
})
