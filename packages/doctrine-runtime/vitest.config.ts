import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    // Exclude files that use node:test or raw node:assert instead of vitest.
    // These are standalone correctness harnesses designed to run with `node` directly;
    // they do not export vitest describe/it suites and would be reported as
    // "No test suite found" by vitest.
    exclude: [
      'src/composer/composer.test.ts',
      'src/prng/xoshiro_kat.test.ts',
      'src/correlator/matched_filter.test.ts',
      'src/shannon/shannon_doctrine_code.test.ts',
      'src/wheeler/wheeler_window.test.ts',
    ],
    isolate: true,
    pool: 'forks',
    testTimeout: 15000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
});
