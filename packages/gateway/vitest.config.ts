import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    isolate: true,
    pool: 'forks',
    testTimeout: 15_000,
    hookTimeout: 10_000,
  },
});
