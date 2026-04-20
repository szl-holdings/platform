import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**'],
    hookTimeout: 30_000,
    testTimeout: 120_000,
    setupFiles: ['./src/__tests__/helpers/test-env-bootstrap.ts'],
  },
});
