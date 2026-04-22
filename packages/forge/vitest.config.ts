import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    isolate: true,
    pool: 'forks',
    testTimeout: 15000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
});
