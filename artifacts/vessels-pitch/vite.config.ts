import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Align with sibling artifacts (conduit, sentra, vessels): the
// workflow command does not export PORT/BASE_PATH, so a hard throw
// here permanently broke `pnpm run dev` for vessels-pitch. Prefer
// the orchestrator-injected value when present, fall back to the
// artifact's previously-assigned port + its registered preview path.
const rawPort = process.env.PORT ?? process.env.VITE_PORT;
const parsedPort = rawPort ? Number(rawPort) : NaN;
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 24631;

const basePath = process.env.BASE_PATH ?? '/vessels-pitch/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    runtimeErrorOverlay(),
    tailwindcss(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
