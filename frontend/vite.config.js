import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server proxies /api -> backend so the frontend can call relative URLs.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
