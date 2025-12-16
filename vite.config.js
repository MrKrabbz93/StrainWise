import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest', // Use our custom sw.js
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        swDest: 'dist/sw.js',
        // Glob patterns to include in the precache manifest
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifestFilename: 'manifest.json', // Ensure it matches index.html
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      // workbox options moved to injectManifest block implicitly or manually handled in sw.js
      manifest: {
        name: 'StrainWise AI Consultant',
        short_name: 'StrainWise',
        description: 'Your Personal AI Cannabis Consultant',
        theme_color: '#020617',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
