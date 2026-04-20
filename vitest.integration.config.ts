import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

const PNPM_STORE = resolve(__dirname, 'node_modules/.pnpm');
const API_MODS = resolve(__dirname, 'artifacts/api-server/node_modules');

export default defineConfig({
  resolve: {
    alias: {
      '@workspace/auth': resolve(__dirname, 'lib/auth/src/index.ts'),
      '@workspace/db': resolve(__dirname, 'lib/db/src/index.ts'),
      '@workspace/api-zod': resolve(__dirname, 'lib/api-zod/src/index.ts'),
      '@workspace/observability': resolve(__dirname, 'lib/observability/src/index.ts'),
      '@workspace/services': resolve(__dirname, 'lib/services/src/index.ts'),
      '@workspace/config': resolve(__dirname, 'lib/config/src/index.ts'),
      '@workspace/audit': resolve(__dirname, 'lib/audit/src/index.ts'),
      '@workspace/forge-runtime': resolve(__dirname, 'lib/forge-runtime/src/index.ts'),
      '@workspace/ai-engine': resolve(__dirname, 'lib/ai-engine/src/index.ts'),
      '@workspace/replit-auth-web': resolve(__dirname, 'lib/replit-auth-web/src/index.ts'),
      '@workspace/shared-ui': resolve(__dirname, 'lib/shared-ui/src/index.ts'),
      '@szl-holdings/db/schema': resolve(__dirname, 'lib/db/src/schema/index.ts'),
      '@szl-holdings/db': resolve(__dirname, 'lib/db/src/index.ts'),
      '@szl-holdings/auth': resolve(__dirname, 'lib/auth/src/index.ts'),
      '@szl-holdings/api-zod': resolve(__dirname, 'lib/api-zod/src/index.ts'),
      '@szl-holdings/observability': resolve(__dirname, 'lib/observability/src/index.ts'),
      '@szl-holdings/config': resolve(__dirname, 'lib/config/src/index.ts'),
      '@szl-holdings/audit': resolve(__dirname, 'lib/audit/src/index.ts'),
      '@szl-holdings/forge-runtime': resolve(__dirname, 'lib/forge-runtime/src/index.ts'),
      '@szl-holdings/crdt-sync': resolve(__dirname, 'lib/crdt-sync/src/index.ts'),
      graphql: resolve(PNPM_STORE, 'graphql@16.13.2/node_modules/graphql/index.js'),
      '@graphql-tools/schema': resolve(API_MODS, '@graphql-tools/schema'),
      '@graphql-tools/merge': resolve(API_MODS, '@graphql-tools/merge'),
      '@graphql-tools/utils': resolve(API_MODS, '@graphql-tools/utils'),
      '@apollo/server': resolve(API_MODS, '@apollo/server'),
      '@as-integrations/express5': resolve(API_MODS, '@as-integrations/express5'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    isolate: true,
    testTimeout: 30000,
    hookTimeout: 15000,
    teardownTimeout: 15000,
    include: [
      'tests/api/cross-app-smoke.test.ts',
      'tests/api/openapi-contract.test.ts',
      'tests/api/db-integration.test.ts',
      'tests/api/cross-cutting-routes-integration.test.ts',
      'tests/api/graph-neighbors-integration.test.ts',
      'tests/api/graphql-schema.test.ts',
      'tests/api/server-live.test.ts',
      'tests/api/stress.test.ts',
      'tests/api/cortex-inca-smoke.test.ts',
      'tests/api/websocket-stress.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
    },
  },
});
