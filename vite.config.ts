import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0', // Explicitly bind to all network interfaces
    open: true
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