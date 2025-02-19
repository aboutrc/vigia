import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        cleanupOutdatedCaches: true
      },
      manifest: {
        name: 'VÍGIA',
        short_name: 'VÍGIA',
        description: 'Community Map Markers',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: false,
    host: '0.0.0.0',
    open: true,
    cors: {
      origin: [
        'https://opzqmoaimiqiiflivqtq.supabase.co',
        'https://*.supabase.co'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'apikey',
        'X-Client-Info',
        'Range'
      ],
      exposedHeaders: ['Content-Range', 'Range'],
      credentials: true
    },
    headers: {
      'Access-Control-Allow-Origin': 'https://opzqmoaimiqiiflivqtq.supabase.co',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': 'Content-Range, Range',
      'Access-Control-Allow-Credentials': 'true',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['maplibre-gl', 'react-map-gl']
  },
  resolve: {
    alias: {
      'mapbox-gl': 'maplibre-gl'
    }
  },
  build: {
    sourcemap: true
  }
});