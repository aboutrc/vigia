import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
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
  }
});