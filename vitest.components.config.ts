import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@workspace/replit-auth-web',
        replacement: resolve(__dirname, 'lib/replit-auth-web/src/index.ts'),
      },
      {
        find: '@workspace/shared-ui',
        replacement: resolve(__dirname, 'lib/shared-ui/src/index.ts'),
      },
      {
        find: '@workspace/observability',
        replacement: resolve(__dirname, 'lib/observability/src/index.ts'),
      },
      {
        find: '@workspace/api-client-react',
        replacement: resolve(__dirname, 'lib/api-client-react/src/index.ts'),
      },
      {
        find: '@szl-holdings/prism-bus/bus',
        replacement: resolve(__dirname, 'lib/prism-bus/src/bus.ts'),
      },
      {
        find: '@szl-holdings/prism-bus',
        replacement: resolve(__dirname, 'lib/prism-bus/src/index.ts'),
      },
      {
        find: '@szl-holdings/covenant-policy/engine',
        replacement: resolve(__dirname, 'lib/covenant-policy/src/engine.ts'),
      },
      {
        find: '@szl-holdings/covenant-policy',
        replacement: resolve(__dirname, 'lib/covenant-policy/src/index.ts'),
      },
      {
        find: '@szl-holdings/monte-carlo/distributions',
        replacement: resolve(__dirname, 'lib/monte-carlo/src/distributions.ts'),
      },
      {
        find: '@szl-holdings/monte-carlo/scenarios',
        replacement: resolve(__dirname, 'lib/monte-carlo/src/scenarios.ts'),
      },
      {
        find: '@szl-holdings/monte-carlo/schema',
        replacement: resolve(__dirname, 'lib/monte-carlo/src/schema.ts'),
      },
      {
        find: '@szl-holdings/monte-carlo',
        replacement: resolve(__dirname, 'lib/monte-carlo/src/index.ts'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: [
      'tests/components/**/*.test.tsx',
      'tests/components/**/*.spec.tsx',
      'tests/components/**/*.test.ts',
    ],
    setupFiles: ['tests/utils/setup-dom.ts'],
    testTimeout: 15000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    pool: 'forks',
  },
});
