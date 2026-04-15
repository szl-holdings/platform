import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@workspace/auth": resolve(__dirname, "lib/auth/src/index.ts"),
      "@workspace/db": resolve(__dirname, "lib/db/src/index.ts"),
      "@workspace/api-zod": resolve(__dirname, "lib/api-zod/src/index.ts"),
      "@workspace/observability": resolve(__dirname, "lib/observability/src/index.ts"),
      "@workspace/services": resolve(__dirname, "lib/services/src/index.ts"),
      "@workspace/config": resolve(__dirname, "lib/config/src/index.ts"),
      "@workspace/audit": resolve(__dirname, "lib/audit/src/index.ts"),
      "@workspace/forge-runtime": resolve(__dirname, "lib/forge-runtime/src/index.ts"),
      "@workspace/ai-engine": resolve(__dirname, "lib/ai-engine/src/index.ts"),
      "@workspace/replit-auth-web": resolve(__dirname, "lib/replit-auth-web/src/index.ts"),
      "@workspace/shared-ui": resolve(__dirname, "lib/shared-ui/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    exclude: ["tests/e2e/**", "tests/components/**", "node_modules/**"],
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
