import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    // Fast port, så dev-serveren ikke kolliderer med de andre prosjektene
    // (minio.no og resten ligger på Vites standard 5173). strictPort gjør at
    // den sier fra i stedet for å hoppe videre til neste ledige.
    port: 5180,
    strictPort: true,
  },
  build: {
    // Siden vi selger raske sider, holder vi bunten liten og delt i to:
    // rammeverket (sjelden endret, cacher godt) og vår egen kode.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router')) return 'react-router'
          if (id.includes('styled-components') || id.includes('stylis')) return 'styled'
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor'
        },
      },
    },
  },
})
