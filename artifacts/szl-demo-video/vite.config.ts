import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { PROXY_ROUTES, CANONICAL_FALLBACK_PORT } from "../../packages/proxy-routes.js";

const rawPort = process.env.VITE_PORT;

if (!rawPort) {
  throw new Error(
    "VITE_PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid VITE_PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

// Shared proxy port — hardcoded; do not use a PROXY_PORT env var to override this.
const SHARED_PROXY_PORT = 9090;

function sharedProxyPlugin(): Plugin {
  return {
    name: "shared-proxy",
    apply: "serve",
    async configureServer() {
      const http = await import("http");
      const proxyServer = http.createServer((req, res) => {
        const url = req.url || "/";
        if (url === "/__health") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK");
          return;
        }
        const normalizedUrl = url.endsWith("/") ? url : url + "/";
        const route = PROXY_ROUTES.find((r) => normalizedUrl.startsWith(r.prefix));
        const targetPort = route ? route.port : CANONICAL_FALLBACK_PORT;
        const upstream = http.request(
          {
            hostname: "127.0.0.1",
            port: targetPort,
            path: url,
            method: req.method,
            headers: { ...req.headers, host: "localhost:" + targetPort },
          },
          (upRes) => {
            res.writeHead(upRes.statusCode || 200, upRes.headers);
            upRes.pipe(res, { end: true });
          },
        );
        upstream.on("error", () => {
          if (!res.headersSent) {
            res.writeHead(503, { "Content-Type": "text/plain" });
            res.end("Upstream not ready on port " + targetPort);
          }
        });
        req.pipe(upstream, { end: true });
      });
      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        };
        proxyServer.once("error", (err: NodeJS.ErrnoException) => {
          console.warn("[shared-proxy] Bind error:", err.code);
          finish();
        });
        proxyServer.listen(
          { port: SHARED_PROXY_PORT, host: "::", reusePort: true },
          () => {
            console.log(
              "[shared-proxy] Listening on port " +
                SHARED_PROXY_PORT +
                " (reusePort, dual-stack)",
            );
            finish();
          },
        );
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    runtimeErrorOverlay(),
    tailwindcss(),
    sharedProxyPlugin(),
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
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  optimizeDeps: {
    holdUntilCrawlEnd: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: { clientPort: 443 },
    fs: {
      strict: false,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
