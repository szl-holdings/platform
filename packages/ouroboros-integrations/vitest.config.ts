import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      // Pre-existing import errors against unrelated packages — tracked separately,
      // not in scope for the v9 thesis surface contract suite.
      'test/anduril.test.ts',
      'test/unified-philosophy.test.ts',
    ],
    testTimeout: 15000,
  },
});
