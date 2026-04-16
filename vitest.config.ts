import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@workspace/ai-engine/domain-embedding-hooks", replacement: resolve(__dirname, "lib/ai-engine/src/domain-embedding-hooks.ts") },
      { find: "@szl-holdings/ai-engine/domain-embedding-hooks", replacement: resolve(__dirname, "lib/ai-engine/src/domain-embedding-hooks.ts") },
      { find: "@workspace/auth", replacement: resolve(__dirname, "lib/auth/src/index.ts") },
      { find: "@workspace/db", replacement: resolve(__dirname, "lib/db/src/index.ts") },
      { find: "@workspace/api-zod", replacement: resolve(__dirname, "lib/api-zod/src/index.ts") },
      { find: "@workspace/observability", replacement: resolve(__dirname, "lib/observability/src/index.ts") },
      { find: "@workspace/services", replacement: resolve(__dirname, "lib/services/src/index.ts") },
      { find: "@workspace/config", replacement: resolve(__dirname, "lib/config/src/index.ts") },
      { find: "@workspace/audit", replacement: resolve(__dirname, "lib/audit/src/index.ts") },
      { find: "@workspace/forge-runtime", replacement: resolve(__dirname, "lib/forge-runtime/src/index.ts") },
      { find: "@workspace/ai-engine", replacement: resolve(__dirname, "lib/ai-engine/src/index.ts") },
      { find: "@workspace/replit-auth-web", replacement: resolve(__dirname, "lib/replit-auth-web/src/index.ts") },
      { find: "@workspace/shared-ui", replacement: resolve(__dirname, "lib/shared-ui/src/index.ts") },
      { find: "@szl-holdings/auth", replacement: resolve(__dirname, "lib/auth/src/index.ts") },
      { find: "@szl-holdings/db", replacement: resolve(__dirname, "lib/db/src/index.ts") },
      { find: "@szl-holdings/api-zod", replacement: resolve(__dirname, "lib/api-zod/src/index.ts") },
      { find: "@szl-holdings/observability", replacement: resolve(__dirname, "lib/observability/src/index.ts") },
      { find: "@szl-holdings/services", replacement: resolve(__dirname, "lib/services/src/index.ts") },
      { find: "@szl-holdings/config", replacement: resolve(__dirname, "lib/config/src/index.ts") },
      { find: "@szl-holdings/audit", replacement: resolve(__dirname, "lib/audit/src/index.ts") },
      { find: "@szl-holdings/forge-runtime", replacement: resolve(__dirname, "lib/forge-runtime/src/index.ts") },
      { find: "@szl-holdings/ai-engine", replacement: resolve(__dirname, "lib/ai-engine/src/index.ts") },
      { find: "@szl-holdings/shared-ui", replacement: resolve(__dirname, "lib/shared-ui/src/index.ts") },
      { find: "@szl-holdings/crdt-sync", replacement: resolve(__dirname, "lib/crdt-sync/src/index.ts") },
    ],
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts", "lib/scene-export/src/__tests__/**/*.test.ts"],
    exclude: [
      "tests/e2e/**",
      "tests/components/**",
      "node_modules/**",
      "tests/api/cross-app-smoke.test.ts",
      "tests/api/db-integration.test.ts",
      "tests/api/graphql-schema.test.ts",
      "tests/api/openapi-contract.test.ts",
      "tests/api/server-live.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "artifacts/api-server/src/**",
        "lib/shared-ui/src/**",
      ],
      exclude: ["**/node_modules/**", "**/dist/**"],
    },
    setupFiles: [],
    testTimeout: 15000,
  },
});
