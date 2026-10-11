import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Agenda ESME',
        short_name: 'Agenda ESME',
        description: 'Application de calendrier scolaire et gestionnaire de tâches ESME',
        theme_color: '#007AFF',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});
