import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { PROXY_ROUTES } from "../../packages/proxy-routes.js";

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? "2";

const vitePort = Number(process.env.VITE_PORT) || 6099;
const basePath = process.env.BASE_PATH || "/terra/";

const SHARED_PROXY_PORT = 9090;

function sharedProxyPlugin() {
  return {
    name: "shared-proxy",
    apply: "serve" as const,
    async configureServer() {
      const http = await import("http");
      const net = await import("net");
      const proxyServer = http.createServer((req, res) => {
        const url = req.url || "/";
        if (url === "/" || url === "/health" || url === "/__health") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK");
          return;
        }
        const normalizedUrl = url.endsWith("/") ? url : url + "/";
        const route = PROXY_ROUTES.find((r) => normalizedUrl.startsWith(r.prefix));
        const targetPort = route ? route.port : vitePort;
        const upstream = http.request(
          { hostname: "127.0.0.1", port: targetPort, path: url, method: req.method,
            headers: { ...req.headers, host: "localhost:" + targetPort } },
          (upRes) => { res.writeHead(upRes.statusCode || 200, upRes.headers); upRes.pipe(res, { end: true }); }
        );
        upstream.on("error", () => {
          if (!res.headersSent) { res.writeHead(503, { "Content-Type": "text/plain" }); res.end("Upstream not ready on port " + targetPort); }
        });
        req.pipe(upstream, { end: true });
      });
      proxyServer.listen({ port: SHARED_PROXY_PORT, host: "0.0.0.0", reusePort: true }, () => {
        console.log("[shared-proxy] Listening on port " + SHARED_PROXY_PORT + " (reusePort)");
      });
      proxyServer.on("error", (err: NodeJS.ErrnoException) => {
        console.warn("[shared-proxy] Bind error:", err.code);
      });
      proxyServer.on("upgrade", (req, socket, head) => {
        const url = req.url || "/";
        const normalizedUrl = url.endsWith("/") ? url : url + "/";
        const route = PROXY_ROUTES.find((r) => normalizedUrl.startsWith(r.prefix));
        const targetPort = route ? route.port : vitePort;
        const conn = net.connect(targetPort, "127.0.0.1", () => {
          const rawHeaders = Object.entries(req.headers)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("\r\n");
          conn.write(`${req.method} ${url} HTTP/1.1\r\n${rawHeaders}\r\n\r\n`);
          if (head && head.length) conn.write(head);
          socket.pipe(conn);
          conn.pipe(socket);
        });
        conn.on("error", () => socket.destroy());
        socket.on("error", () => conn.destroy());
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
    hmr: { clientPort: 443, path: basePath },
    fs: {
      strict: false,
      deny: ["**/.*"],
    },
  },
  preview: {
    port: vitePort,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
