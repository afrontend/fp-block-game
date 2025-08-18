import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/fp-block-game/',
  build: {
    outDir: 'build'
  }
})