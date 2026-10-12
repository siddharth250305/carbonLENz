import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const API_PORT = process.env.PORT || 5001;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Recharts v3 alone is ~520 kB minified (~155 kB gzip); it lives in its own vendor chunk.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': `http://localhost:${API_PORT}`,
    },
  },
});
