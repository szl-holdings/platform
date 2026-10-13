import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const ROOT = resolve(__dirname, '../..');

export default defineConfig({
  resolve: {
    conditions: ['workspace'],
    // Resolve the observability + env workspace packages to source so the
    // server test exercises the real OTEL pipeline without a prior build,
    // mirroring apps/alloy-runtime-api/vitest.config.ts.
    alias: [
      {
        find: '@szl-holdings/observability',
        replacement: resolve(ROOT, 'lib/observability/src/index.ts'),
      },
      { find: '@szl-holdings/env', replacement: resolve(ROOT, 'packages/env/src/index.ts') },
    ],
  },
  server: {
    deps: {
      inline: [/^@szl-holdings\//, /^@workspace\//],
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    timeout: 30_000,
  },
});
