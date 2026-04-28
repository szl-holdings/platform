import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@szl/substrate-client/streaming',
        replacement: resolve(__dirname, 'packages/substrate-client/src/streaming.ts'),
      },
      {
        find: '@szl/substrate-client/types',
        replacement: resolve(__dirname, 'packages/substrate-client/src/types.ts'),
      },
      {
        find: '@szl/substrate-client',
        replacement: resolve(__dirname, 'packages/substrate-client/src/index.ts'),
      },
      {
        find: '@workspace/ai-engine/domain-embedding-hooks',
        replacement: resolve(__dirname, 'lib/ai-engine/src/domain-embedding-hooks.ts'),
      },
      {
        find: '@szl-holdings/ai-engine/domain-embedding-hooks',
        replacement: resolve(__dirname, 'lib/ai-engine/src/domain-embedding-hooks.ts'),
      },
      { find: '@workspace/auth', replacement: resolve(__dirname, 'lib/auth/src/index.ts') },
      {
        find: '@szl-holdings/auth-shared/server',
        replacement: resolve(__dirname, 'packages/auth-shared/src/server/index.ts'),
      },
      {
        find: '@szl-holdings/auth-shared/client',
        replacement: resolve(__dirname, 'packages/auth-shared/src/client/index.ts'),
      },
      {
        find: '@szl-holdings/auth-shared/mobile',
        replacement: resolve(__dirname, 'packages/auth-shared/src/mobile/index.ts'),
      },
      {
        find: '@szl-holdings/auth-shared/types',
        replacement: resolve(__dirname, 'packages/auth-shared/src/types.ts'),
      },
      {
        find: '@szl-holdings/auth-shared',
        replacement: resolve(__dirname, 'packages/auth-shared/src/index.ts'),
      },
      { find: '@workspace/db', replacement: resolve(__dirname, 'lib/db/src/index.ts') },
      { find: '@workspace/api-zod', replacement: resolve(__dirname, 'lib/api-zod/src/index.ts') },
      {
        find: '@workspace/observability',
        replacement: resolve(__dirname, 'lib/observability/src/index.ts'),
      },
      { find: '@workspace/services', replacement: resolve(__dirname, 'lib/services/src/index.ts') },
      { find: '@workspace/config', replacement: resolve(__dirname, 'lib/config/src/index.ts') },
      { find: '@workspace/audit', replacement: resolve(__dirname, 'lib/audit/src/index.ts') },
      {
        find: '@workspace/forge-runtime',
        replacement: resolve(__dirname, 'lib/forge-runtime/src/index.ts'),
      },
      {
        find: '@workspace/ai-engine',
        replacement: resolve(__dirname, 'lib/ai-engine/src/index.ts'),
      },
      {
        find: '@workspace/replit-auth-web',
        replacement: resolve(__dirname, 'lib/replit-auth-web/src/index.ts'),
      },
      {
        find: '@workspace/shared-ui',
        replacement: resolve(__dirname, 'lib/shared-ui/src/index.ts'),
      },
      { find: '@szl-holdings/auth', replacement: resolve(__dirname, 'lib/auth/src/index.ts') },
      { find: '@szl-holdings/db', replacement: resolve(__dirname, 'lib/db/src/index.ts') },
      {
        find: '@szl-holdings/api-zod',
        replacement: resolve(__dirname, 'lib/api-zod/src/index.ts'),
      },
      {
        find: '@szl-holdings/observability',
        replacement: resolve(__dirname, 'lib/observability/src/index.ts'),
      },
      {
        find: '@szl-holdings/services',
        replacement: resolve(__dirname, 'lib/services/src/index.ts'),
      },
      { find: '@szl-holdings/config', replacement: resolve(__dirname, 'lib/config/src/index.ts') },
      { find: '@szl-holdings/audit', replacement: resolve(__dirname, 'lib/audit/src/index.ts') },
      {
        find: '@szl-holdings/forge-runtime',
        replacement: resolve(__dirname, 'lib/forge-runtime/src/index.ts'),
      },
      {
        find: '@szl-holdings/ai-engine',
        replacement: resolve(__dirname, 'lib/ai-engine/src/index.ts'),
      },
      {
        find: '@szl-holdings/shared-ui',
        replacement: resolve(__dirname, 'lib/shared-ui/src/index.ts'),
      },
      {
        find: '@szl-holdings/crdt-sync',
        replacement: resolve(__dirname, 'lib/crdt-sync/src/index.ts'),
      },
      {
        find: '@workspace/ontology',
        replacement: resolve(__dirname, 'packages/ontology/src/index.ts'),
      },
      {
        find: '@workspace/guardian/decision-engine',
        replacement: resolve(__dirname, 'packages/guardian/src/decision-engine.ts'),
      },
      {
        find: '@workspace/guardian/tiers',
        replacement: resolve(__dirname, 'packages/guardian/src/tiers.ts'),
      },
      {
        find: '@workspace/guardian/schema',
        replacement: resolve(__dirname, 'packages/guardian/src/schema.ts'),
      },
      {
        find: '@workspace/guardian',
        replacement: resolve(__dirname, 'packages/guardian/src/index.ts'),
      },
      {
        find: '@workspace/trace-graph/store',
        replacement: resolve(__dirname, 'packages/trace-graph/src/store.ts'),
      },
      {
        find: '@workspace/trace-graph/writer',
        replacement: resolve(__dirname, 'packages/trace-graph/src/writer.ts'),
      },
      {
        find: '@workspace/trace-graph/replay',
        replacement: resolve(__dirname, 'packages/trace-graph/src/replay.ts'),
      },
      {
        find: '@workspace/trace-graph/schema',
        replacement: resolve(__dirname, 'packages/trace-graph/src/schema.ts'),
      },
      {
        find: '@workspace/trace-graph/queue',
        replacement: resolve(__dirname, 'packages/trace-graph/src/queue.ts'),
      },
      {
        find: '@workspace/trace-graph/query',
        replacement: resolve(__dirname, 'packages/trace-graph/src/query.ts'),
      },
      {
        find: '@workspace/trace-graph/sdk',
        replacement: resolve(__dirname, 'packages/trace-graph/src/sdk.ts'),
      },
      {
        find: '@workspace/trace-graph',
        replacement: resolve(__dirname, 'packages/trace-graph/src/index.ts'),
      },
      {
        find: '@workspace/constellation/schema',
        replacement: resolve(__dirname, 'packages/constellation/src/schema.ts'),
      },
      {
        find: '@workspace/constellation/adapter',
        replacement: resolve(__dirname, 'packages/constellation/src/adapter.ts'),
      },
      {
        find: '@workspace/constellation/store',
        replacement: resolve(__dirname, 'packages/constellation/src/store.ts'),
      },
      {
        find: '@workspace/constellation/query',
        replacement: resolve(__dirname, 'packages/constellation/src/query.ts'),
      },
      {
        find: '@workspace/constellation',
        replacement: resolve(__dirname, 'packages/constellation/src/index.ts'),
      },
      {
        find: '@szl-holdings/constellation/types',
        replacement: resolve(__dirname, 'packages/constellation/src/types.ts'),
      },
      {
        find: '@szl-holdings/constellation/adapter',
        replacement: resolve(__dirname, 'packages/constellation/src/adapter.ts'),
      },
      {
        find: '@szl-holdings/constellation/query',
        replacement: resolve(__dirname, 'packages/constellation/src/query.ts'),
      },
      {
        find: '@szl-holdings/constellation/registry',
        replacement: resolve(__dirname, 'packages/constellation/src/registry.ts'),
      },
      {
        find: '@szl-holdings/constellation',
        replacement: resolve(__dirname, 'packages/constellation/src/index.ts'),
      },
      {
        find: '@workspace/memory-fabric/types',
        replacement: resolve(__dirname, 'packages/memory-fabric/src/types.ts'),
      },
      {
        find: '@workspace/memory-fabric/store',
        replacement: resolve(__dirname, 'packages/memory-fabric/src/store.ts'),
      },
      {
        find: '@workspace/memory-fabric/retention',
        replacement: resolve(__dirname, 'packages/memory-fabric/src/retention.ts'),
      },
      {
        find: '@workspace/memory-fabric/behaviors',
        replacement: resolve(__dirname, 'packages/memory-fabric/src/behaviors.ts'),
      },
      {
        find: '@workspace/memory-fabric',
        replacement: resolve(__dirname, 'packages/memory-fabric/src/index.ts'),
      },
      {
        find: '@workspace/eval-forge/types',
        replacement: resolve(__dirname, 'packages/eval-forge/src/types.ts'),
      },
      {
        find: '@workspace/eval-forge/metrics',
        replacement: resolve(__dirname, 'packages/eval-forge/src/metrics.ts'),
      },
      {
        find: '@workspace/eval-forge/graders',
        replacement: resolve(__dirname, 'packages/eval-forge/src/graders.ts'),
      },
      {
        find: '@workspace/eval-forge/runtime',
        replacement: resolve(__dirname, 'packages/eval-forge/src/runtime.ts'),
      },
      {
        find: '@workspace/eval-forge/nightly-runner',
        replacement: resolve(__dirname, 'packages/eval-forge/src/nightly-runner.ts'),
      },
      {
        find: '@workspace/eval-forge/cli',
        replacement: resolve(__dirname, 'packages/eval-forge/src/cli.ts'),
      },
      {
        find: '@workspace/eval-forge/suites',
        replacement: resolve(__dirname, 'packages/eval-forge/src/suites/index.ts'),
      },
      {
        find: '@workspace/eval-forge',
        replacement: resolve(__dirname, 'packages/eval-forge/src/index.ts'),
      },
      {
        find: '@workspace/tool-mesh/manifest',
        replacement: resolve(__dirname, 'packages/tool-mesh/src/manifest.ts'),
      },
      {
        find: '@workspace/tool-mesh/registry',
        replacement: resolve(__dirname, 'packages/tool-mesh/src/registry.ts'),
      },
      {
        find: '@workspace/tool-mesh/gateway',
        replacement: resolve(__dirname, 'packages/tool-mesh/src/gateway.ts'),
      },
      {
        find: '@workspace/tool-mesh/rate-limiter',
        replacement: resolve(__dirname, 'packages/tool-mesh/src/rate-limiter.ts'),
      },
      {
        find: '@workspace/tool-mesh/executor',
        replacement: resolve(__dirname, 'packages/tool-mesh/src/executor.ts'),
      },
      {
        find: '@workspace/tool-mesh/mcp-bridge',
        replacement: resolve(__dirname, 'packages/tool-mesh/src/mcp-bridge.ts'),
      },
      {
        find: '@workspace/tool-mesh',
        replacement: resolve(__dirname, 'packages/tool-mesh/src/index.ts'),
      },
      {
        find: '@workspace/alloy/types',
        replacement: resolve(__dirname, 'packages/alloy/src/types.ts'),
      },
      {
        find: '@workspace/alloy/checkpoint',
        replacement: resolve(__dirname, 'packages/alloy/src/checkpoint.ts'),
      },
      {
        find: '@workspace/alloy/run-manager',
        replacement: resolve(__dirname, 'packages/alloy/src/run-manager.ts'),
      },
      {
        find: '@workspace/alloy/ledger',
        replacement: resolve(__dirname, 'packages/alloy/src/ledger.ts'),
      },
      {
        find: '@workspace/alloy/model-router',
        replacement: resolve(__dirname, 'packages/alloy/src/model-router.ts'),
      },
      {
        find: '@workspace/alloy/workflow',
        replacement: resolve(__dirname, 'packages/alloy/src/workflow.ts'),
      },
      {
        find: '@workspace/alloy/plan-orchestrator',
        replacement: resolve(__dirname, 'packages/alloy/src/plan-orchestrator.ts'),
      },
      { find: '@workspace/alloy', replacement: resolve(__dirname, 'packages/alloy/src/index.ts') },
      {
        find: '@workspace/cognitive-observability/metrics',
        replacement: resolve(__dirname, 'packages/cognitive-observability/src/metrics.ts'),
      },
      {
        find: '@workspace/cognitive-observability/collector',
        replacement: resolve(__dirname, 'packages/cognitive-observability/src/collector.ts'),
      },
      {
        find: '@workspace/cognitive-observability/exporter',
        replacement: resolve(__dirname, 'packages/cognitive-observability/src/exporter.ts'),
      },
      {
        find: '@workspace/cognitive-observability',
        replacement: resolve(__dirname, 'packages/cognitive-observability/src/index.ts'),
      },
      {
        find: '@workspace/reflection-engine/types',
        replacement: resolve(__dirname, 'packages/reflection-engine/src/types.ts'),
      },
      {
        find: '@workspace/reflection-engine/store',
        replacement: resolve(__dirname, 'packages/reflection-engine/src/store.ts'),
      },
      {
        find: '@workspace/reflection-engine/candidate-skill-library',
        replacement: resolve(
          __dirname,
          'packages/reflection-engine/src/candidate-skill-library.ts',
        ),
      },
      {
        find: '@workspace/reflection-engine/scorer',
        replacement: resolve(__dirname, 'packages/reflection-engine/src/scorer.ts'),
      },
      {
        find: '@workspace/reflection-engine/classifier',
        replacement: resolve(__dirname, 'packages/reflection-engine/src/classifier.ts'),
      },
      {
        find: '@workspace/reflection-engine/lesson-writer',
        replacement: resolve(__dirname, 'packages/reflection-engine/src/lesson-writer.ts'),
      },
      {
        find: '@workspace/reflection-engine/skill-drafter',
        replacement: resolve(__dirname, 'packages/reflection-engine/src/skill-drafter.ts'),
      },
      {
        find: '@workspace/reflection-engine',
        replacement: resolve(__dirname, 'packages/reflection-engine/src/index.ts'),
      },
      {
        find: '@szl-holdings/ai-control-plane/router',
        replacement: resolve(__dirname, 'packages/ai-control-plane/src/router.ts'),
      },
      {
        find: '@szl-holdings/ai-control-plane',
        replacement: resolve(__dirname, 'packages/ai-control-plane/src/index.ts'),
      },
      {
        find: '@szl-holdings/decision-engine',
        replacement: resolve(__dirname, 'packages/decision-engine/src/index.ts'),
      },
      {
        find: '@workspace/planner/types',
        replacement: resolve(__dirname, 'packages/planner/src/types.ts'),
      },
      {
        find: '@workspace/planner/store',
        replacement: resolve(__dirname, 'packages/planner/src/store.ts'),
      },
      {
        find: '@workspace/planner/router',
        replacement: resolve(__dirname, 'packages/planner/src/router.ts'),
      },
      {
        find: '@workspace/planner',
        replacement: resolve(__dirname, 'packages/planner/src/index.ts'),
      },
      {
        find: '@szl-holdings/atlas-core',
        replacement: resolve(__dirname, 'packages/atlas-core/src/index.ts'),
      },
      {
        find: '@szl-holdings/policy-engine',
        replacement: resolve(__dirname, 'packages/policy-engine/src/index.ts'),
      },
      {
        find: '@szl-holdings/replay-core',
        replacement: resolve(__dirname, 'packages/replay-core/src/index.ts'),
      },
      {
        find: '@workspace/replay-core',
        replacement: resolve(__dirname, 'packages/replay-core/src/index.ts'),
      },
      {
        find: '@szl-holdings/action-engine',
        replacement: resolve(__dirname, 'packages/action-engine/src/index.ts'),
      },
      {
        find: '@szl-holdings/observability-core',
        replacement: resolve(__dirname, 'packages/observability-core/src/index.ts'),
      },
      {
        find: '@szl-holdings/decision-engine',
        replacement: resolve(__dirname, 'packages/decision-engine/src/index.ts'),
      },
      {
        find: '@szl-holdings/db/schema',
        replacement: resolve(__dirname, 'lib/db/src/schema/index.ts'),
      },
      { find: '@szl-holdings/db', replacement: resolve(__dirname, 'lib/db/src/index.ts') },
      {
        find: '@workspace/self-model/types',
        replacement: resolve(__dirname, 'packages/self-model/src/types.ts'),
      },
      {
        find: '@workspace/self-model/schema',
        replacement: resolve(__dirname, 'packages/self-model/src/schema.ts'),
      },
      {
        find: '@workspace/self-model/store',
        replacement: resolve(__dirname, 'packages/self-model/src/store.ts'),
      },
      {
        find: '@workspace/self-model/update',
        replacement: resolve(__dirname, 'packages/self-model/src/update.ts'),
      },
      {
        find: '@workspace/self-model',
        replacement: resolve(__dirname, 'packages/self-model/src/index.ts'),
      },
      {
        find: '@workspace/verifier/types',
        replacement: resolve(__dirname, 'packages/verifier/src/types.ts'),
      },
      {
        find: '@workspace/verifier/checks',
        replacement: resolve(__dirname, 'packages/verifier/src/checks.ts'),
      },
      {
        find: '@workspace/verifier/aggregator',
        replacement: resolve(__dirname, 'packages/verifier/src/aggregator.ts'),
      },
      {
        find: '@workspace/verifier/engine',
        replacement: resolve(__dirname, 'packages/verifier/src/engine.ts'),
      },
      {
        find: '@workspace/verifier/store',
        replacement: resolve(__dirname, 'packages/verifier/src/store.ts'),
      },
      {
        find: '@workspace/verifier',
        replacement: resolve(__dirname, 'packages/verifier/src/index.ts'),
      },
      {
        find: '@workspace/skill-library/types',
        replacement: resolve(__dirname, 'packages/skill-library/src/types.ts'),
      },
      {
        find: '@workspace/skill-library/registry',
        replacement: resolve(__dirname, 'packages/skill-library/src/registry.ts'),
      },
      {
        find: '@workspace/skill-library/runner',
        replacement: resolve(__dirname, 'packages/skill-library/src/runner.ts'),
      },
      {
        find: '@workspace/skill-library/seeds',
        replacement: resolve(__dirname, 'packages/skill-library/src/seeds.ts'),
      },
      {
        find: '@workspace/skill-library',
        replacement: resolve(__dirname, 'packages/skill-library/src/index.ts'),
      },
      {
        find: '@workspace/cognitive-runtime/types',
        replacement: resolve(__dirname, 'packages/cognitive-runtime/src/types.ts'),
      },
      {
        find: '@workspace/cognitive-runtime/checkpoint',
        replacement: resolve(__dirname, 'packages/cognitive-runtime/src/checkpoint.ts'),
      },
      {
        find: '@workspace/cognitive-runtime/orchestrator',
        replacement: resolve(__dirname, 'packages/cognitive-runtime/src/orchestrator.ts'),
      },
      {
        find: '@workspace/cognitive-runtime',
        replacement: resolve(__dirname, 'packages/cognitive-runtime/src/index.ts'),
      },
      {
        find: '@szl-holdings/business-events',
        replacement: resolve(__dirname, 'packages/business-events/src/index.ts'),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    isolate: true,
    pool: 'forks',
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'lib/audit/src/**/*.test.ts',
      'lib/scene-export/src/__tests__/**/*.test.ts',
      'lib/shared-ui/src/**/*.test.ts',
      'lib/shared-ui/src/**/*.test.tsx',
      'scripts/**/*.test.js',
      'scripts/**/*.test.ts',
      // NOTE: All packages/* test suites have their own per-package vitest.config.ts
      // and are run by turbo via their test scripts.
    ],
    exclude: [
      'tests/e2e/**',
      'tests/components/**',
      'node_modules/**',
      'tests/api/cross-app-smoke.test.ts',
      'tests/api/db-integration.test.ts',
      'tests/api/graphql-schema.test.ts',
      'tests/api/openapi-contract.test.ts',
      'tests/api/server-live.test.ts',
      'tests/api/cortex-inca-smoke.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['artifacts/api-server/src/**', 'lib/shared-ui/src/**'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
    setupFiles: [],
    testTimeout: 15000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
});
