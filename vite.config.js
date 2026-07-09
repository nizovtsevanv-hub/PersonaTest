import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` must match the GitHub Pages sub-path (https://<user>.github.io/PersonaTest/)
// so built asset URLs resolve correctly. Overridable via the BASE_PATH env var.
export default defineConfig({
  base: process.env.BASE_PATH || '/PersonaTest/',
  plugins: [react()],
})
