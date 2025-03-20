import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/static/',
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    rollupOptions: {
      output: {
        assetFileNames: 'static/[name].[ext]',
        chunkFileNames: 'static/[name].js',
        entryFileNames: 'static/[name].js',
      },
    },
  },
})
