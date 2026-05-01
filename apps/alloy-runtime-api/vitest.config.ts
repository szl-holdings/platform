import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    testTimeout: 15000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: [
      {
        find: '@workspace/aef-evals',
        replacement: resolve(__dirname, '../../packages/aef-evals/src/index.ts'),
      },
      {
        find: '@workspace/aef-retrieval-core',
        replacement: resolve(__dirname, '../../packages/aef-retrieval-core/src/index.ts'),
      },
      {
        find: '@workspace/alloy-embed-worker',
        replacement: resolve(__dirname, '../../workers/alloy-embed-worker/src/index.ts'),
      },
      {
        find: '@workspace/aef-domain-profiles/schema',
        replacement: resolve(__dirname, '../../packages/aef-domain-profiles/src/schema.ts'),
      },
      {
        find: '@workspace/aef-domain-profiles',
        replacement: resolve(__dirname, '../../packages/aef-domain-profiles/src/index.ts'),
      },
      {
        find: '@szl-holdings/memory-core',
        replacement: resolve(__dirname, '../../packages/memory-core/src/index.ts'),
      },
      {
        find: '@szl-holdings/shared-contracts',
        replacement: resolve(__dirname, '../../packages/shared-contracts/src/index.ts'),
      },
      {
        find: '@szl-holdings/workflow-runtime',
        replacement: resolve(__dirname, '../../packages/workflow-runtime/src/index.ts'),
      },
      {
        find: '@szl-holdings/agent-core',
        replacement: resolve(__dirname, '../../packages/agent-core/src/index.ts'),
      },
      {
        find: '@szl-holdings/evidence-ledger',
        replacement: resolve(__dirname, '../../packages/evidence-ledger/src/index.ts'),
      },
      {
        find: '@szl-holdings/policy-guard',
        replacement: resolve(__dirname, '../../packages/policy-guard/src/index.ts'),
      },
    ],
  },
});
