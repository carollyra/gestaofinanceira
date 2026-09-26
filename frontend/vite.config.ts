/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
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
});
