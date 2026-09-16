import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// El 5173 está ocupado por otro proyecto en este equipo
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
  },
})
