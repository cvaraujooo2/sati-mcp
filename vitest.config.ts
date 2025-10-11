import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.integration.test.ts',
      'tests/**/*.ui.test.tsx'
    ],
    testTimeout: 60000,
    hookTimeout: 60000,
    reporters: 'default',
    coverage: {
      enabled: false
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src')
    }
  }
});
