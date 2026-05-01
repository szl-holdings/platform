import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = resolve(__dirname, '../..');

export default defineConfig({
  resolve: {
    alias: [
      // contracts
      {
        find: '@szl-holdings/contracts/agentic-rag',
        replacement: resolve(root, 'packages/contracts/src/agentic-rag.ts'),
      },
      {
        find: '@szl-holdings/contracts',
        replacement: resolve(root, 'packages/contracts/src/index.ts'),
      },
      // ai-control-plane (main + sub-paths)
      {
        find: '@szl-holdings/ai-control-plane/router',
        replacement: resolve(root, 'packages/ai-control-plane/src/router.ts'),
      },
      {
        find: '@szl-holdings/ai-control-plane',
        replacement: resolve(root, 'packages/ai-control-plane/src/index.ts'),
      },
      // evidence-ledger
      {
        find: '@szl-holdings/evidence-ledger',
        replacement: resolve(root, 'packages/evidence-ledger/src/index.ts'),
      },
      // shared-contracts (used by evidence-ledger)
      {
        find: '@szl-holdings/shared-contracts',
        replacement: resolve(root, 'packages/shared-contracts/src/index.ts'),
      },
      // retrieval-core
      {
        find: '@szl-holdings/retrieval-core',
        replacement: resolve(root, 'packages/retrieval-core/src/index.ts'),
      },
      // trace-graph
      {
        find: '@workspace/trace-graph',
        replacement: resolve(root, 'packages/trace-graph/src/index.ts'),
      },
      // planner
      {
        find: '@workspace/planner',
        replacement: resolve(root, 'packages/planner/src/index.ts'),
      },
      // tool-mesh (type-only import in planner)
      {
        find: '@workspace/tool-mesh',
        replacement: resolve(root, 'packages/tool-mesh/src/index.ts'),
      },
      // memory-fabric
      {
        find: '@workspace/memory-fabric',
        replacement: resolve(root, 'packages/memory-fabric/src/index.ts'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    isolate: true,
    pool: 'forks',
    testTimeout: 30000,
  },
});
