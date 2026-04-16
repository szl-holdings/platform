import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? "2";

const vitePort = Number(process.env.VITE_PORT) || 23931;
const basePath = process.env.BASE_PATH || "/firestorm/";

const PROXY_ROUTES = [
  { prefix: "/aegis/", port: 23933 },
  { prefix: "/firestorm/", port: 23931 },
  { prefix: "/carlota-jo/", port: 21200 },
  { prefix: "/command/", port: 25200 },
  { prefix: "/terra/", port: 25100 },
  { prefix: "/vessels/", port: 18485 },
];

function sharedProxyPlugin() {
  return {
    name: "shared-proxy",
    apply: "serve" as const,
    configureServer() {
      import("http").then((http) => {
        const server = http.createServer((req, res) => {
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
            }
          );
          upstream.on("error", () => {
            if (!res.headersSent) {
              res.writeHead(503);
              res.end("Upstream not ready");
            }
          });
          req.pipe(upstream, { end: true });
        });
        server.listen({ port: 9090, host: "0.0.0.0", reusePort: true }, () => {
          console.log("[shared-proxy] Listening on port 9090 (reusePort)");
        });
        server.on("error", (err: NodeJS.ErrnoException) => {
          console.warn("[shared-proxy] Port 9090 bind error:", err.code);
        });
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    sharedProxyPlugin(),
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
