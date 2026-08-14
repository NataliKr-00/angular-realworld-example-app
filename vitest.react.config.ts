import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'react',
    globals: false,
    environment: 'jsdom',
    include: ['src/core/**/*.spec.ts', 'src/core/**/*.spec.tsx', 'src/shared/**/*.spec.ts'],
    pool: 'threads',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
