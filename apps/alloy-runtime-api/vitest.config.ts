import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const ROOT = resolve(__dirname, '../..');

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@szl-holdings/observability',
        replacement: resolve(ROOT, 'lib/observability/src/index.ts'),
      },
      { find: '@szl-holdings/env', replacement: resolve(ROOT, 'packages/env/src/index.ts') },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 20000,
  },
});
