/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  // The API address is baked into the bundle at build time. Without it, a
  // production build would talk to localhost and only fail in the browser.
  if (command === 'build' && mode === 'production') {
    const { VITE_API_URL } = loadEnv(mode, process.cwd(), 'VITE_');
    if (!VITE_API_URL) {
      throw new Error(
        'VITE_API_URL is required for production builds (e.g. https://your-api.onrender.com/api)',
      );
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
    },
    // Pre-bundled on startup, so the first page load does not trigger a re-optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom/client',
        'react-router',
        '@tanstack/react-query',
        'recharts',
        'framer-motion',
        'lucide-react',
        'react-hook-form',
        '@hookform/resolvers/zod',
        'zod',
        'clsx',
      ],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  };
});
