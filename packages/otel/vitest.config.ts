import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    isolate: true,
    pool: 'forks',
    testTimeout: 15_000,
    hookTimeout: 10_000,
    teardownTimeout: 10_000,
  },
});
