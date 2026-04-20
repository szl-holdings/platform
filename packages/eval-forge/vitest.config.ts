import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/__tests__/**/*.test.ts"],
    isolate: true,
    pool: "forks",
    testTimeout: 20000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
});
