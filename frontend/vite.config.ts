import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // GitHub Pages: https://ishaan2005.github.io/rtl-portfolio/
  base: '/rtl-portfolio/',

  // Local development only
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
