import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@szl-holdings/platform-registry',
        replacement: resolve(__dirname, '../../packages/config/src/index.ts'),
      },
      {
        find: '@szl-holdings/db',
        replacement: resolve(__dirname, '../../lib/db/src/index.ts'),
      },
      {
        find: '@szl-holdings/quantum-engine',
        replacement: resolve(__dirname, '../../lib/quantum-engine/src/index.ts'),
      },
      {
        find: '@workspace/ontology',
        replacement: resolve(__dirname, '../../packages/ontology/src/index.ts'),
      },
      {
        find: '@workspace/codex-kernel',
        replacement: resolve(__dirname, '../../packages/codex-kernel/src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**'],
    hookTimeout: 30_000,
    testTimeout: 120_000,
    setupFiles: ['./src/__tests__/helpers/test-env-bootstrap.ts'],
    fileParallelism: false,
  },
});
