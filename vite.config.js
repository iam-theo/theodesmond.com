import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Local dev: forward API calls to the self-hosted server.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/live': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    // Explicit so automated scanners / future defaults can't regress this:
    // JS is always minified, CSS is minified, no sourcemaps ship to prod.
    // (Vite 8 minifies with oxc by default; `true` pins that on.)
    minify: true,
    cssMinify: true,
    sourcemap: false,
    target: 'es2018',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split stable vendor code out of the app bundle. Vendor chunks
        // change rarely, so browsers keep them cached (immutable headers in
        // vercel.json) while the smaller app chunk updates on each deploy.
        // (Vite 8 uses Rolldown: chunk groups go under `advancedChunks`.)
        advancedChunks: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            },
          ],
        },
      },
    },
  },
})
