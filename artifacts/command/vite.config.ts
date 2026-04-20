import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? "2";

const vitePort = Number(process.env.VITE_PORT) || 5000;
const basePath = process.env.BASE_PATH || "/command/";

// The shared routing gateway that fronts every artifact on port 9090 used to
// be embedded in this config (`sharedProxyPlugin` + an eager-bind block at
// module load). It now runs as its own standalone workflow
// (`scripts/shared-proxy.mjs`) so traffic to Terra, Vessels, Carlota Jo,
// Pulse, etc. survives crashes or restarts of the Command app.

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            })
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner()
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@lyte": path.resolve(import.meta.dirname, "src/operations"),
      "@imp": path.resolve(import.meta.dirname, "src/infrastructure"),
      "@szl/substrate-client/streaming": path.resolve(import.meta.dirname, "../../packages/substrate-client/src/streaming.ts"),
      "@szl/substrate-client/types": path.resolve(import.meta.dirname, "../../packages/substrate-client/src/types.ts"),
      "@szl/substrate-client": path.resolve(import.meta.dirname, "../../packages/substrate-client/src/index.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    sourcemap: "hidden",
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id): string | undefined {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3-"))
              return "vendor-charts";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("@tanstack")) return "vendor-tanstack";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("react-dom")) return "vendor-react";
            if (id.includes("react/")) return "vendor-react";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: vitePort,
    strictPort: true,
    host: "::",
    allowedHosts: true,
    hmr: { clientPort: 443, path: basePath },
    fs: {
      strict: false,
      deny: ["**/.*"],
    },
    proxy: {
      [`${basePath}api`]: {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${basePath}api`), "/api"),
      },
    },
  },
  preview: {
    port: vitePort,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
