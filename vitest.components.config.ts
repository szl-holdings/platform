import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@workspace/replit-auth-web": resolve(__dirname, "lib/replit-auth-web/src/index.ts"),
      "@workspace/shared-ui": resolve(__dirname, "lib/shared-ui/src/index.ts"),
      "@workspace/observability": resolve(__dirname, "lib/observability/src/index.ts"),
      "@workspace/api-client-react": resolve(__dirname, "lib/api-client-react/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["tests/components/**/*.test.tsx", "tests/components/**/*.spec.tsx"],
    setupFiles: ["tests/utils/setup-dom.ts"],
    testTimeout: 15000,
  },
});
