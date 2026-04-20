import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    isolate: true,
    pool: "forks",
    testTimeout: 30000,
    hookTimeout: 15000,
    teardownTimeout: 10000,
  },
});
