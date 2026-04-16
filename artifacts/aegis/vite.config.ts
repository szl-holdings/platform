import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? "2";

const vitePort = Number(process.env.PORT) || 3000;
const basePath = process.env.BASE_PATH || "/aegis/";

const PROXY_ROUTES = [
  { prefix: "/aegis/", port: 23933 },
  { prefix: "/firestorm/", port: 23931 },
  { prefix: "/carlota-jo/", port: 3101 },
  { prefix: "/command/", port: 3102 },
  { prefix: "/terra/", port: 6099 },
  { prefix: "/vessels/", port: 6899 },
  { prefix: "/pulse/", port: 5201 },
];

function sharedProxyPlugin(): Plugin {
  return {
    name: "shared-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/" || req.url === "/__health" || req.url === "/health") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK");
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    sharedProxyPlugin(),
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
      "@assets": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "attached_assets"
      ),
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
  optimizeDeps: {
    holdUntilCrawlEnd: true,
  },
  server: {
    port: vitePort,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: { clientPort: 443 },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port: vitePort,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
