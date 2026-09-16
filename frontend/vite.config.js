import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Semua request /api diteruskan ke backend Express, jadi tidak ada masalah CORS
    // saat development dan URL API di kode cukup ditulis relatif.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
