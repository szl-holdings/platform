import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { spawn, type ChildProcess } from "child_process";
import http from "http";
import net from "net";

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? "2";

const vitePort = Number(process.env.VITE_PORT) || 3102;
const basePath = process.env.BASE_PATH || "/command/";

const SHARED_PROXY_PORT = 9090;
const API_SERVER_PORT = 8080;

const PROXY_ROUTES = [
  { prefix: "/aegis/", port: 3000 },
  { prefix: "/firestorm/", port: 23931 },
  { prefix: "/carlota-jo/", port: 3101 },
  { prefix: "/command/", port: 3102 },
  { prefix: "/terra/", port: 6099 },
  { prefix: "/vessels/", port: 6899 },
  { prefix: "/pulse/", port: 5201 },
];

const apiServerDist = path.resolve(
  import.meta.dirname,
  "..",
  "api-server",
  "dist",
  "index.mjs"
);

function sharedProxyPlugin(): Plugin {
  return {
    name: "shared-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "/";
        if (url === "/" || url === "/__health" || url === "/health" ||
            url === basePath || url === basePath.replace(/\/$/, "")) {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK");
          return;
        }
        next();
      });

      const proxyServer = http.createServer((req: any, res: any) => {
        const url = req.url || "/";
        if (url === "/" || url === "/health" || url === "/__health") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK");
          return;
        }
        const normalizedUrl = url.endsWith("/") ? url : url + "/";
        const route = PROXY_ROUTES.find((r: any) => normalizedUrl.startsWith(r.prefix));
        const targetPort = route ? route.port : vitePort;
        const upstream = http.request(
          { hostname: "127.0.0.1", port: targetPort, path: url, method: req.method,
            headers: { ...req.headers, host: "localhost:" + targetPort } },
          (upRes: any) => { res.writeHead(upRes.statusCode || 200, upRes.headers); upRes.pipe(res, { end: true }); }
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
    },
  };
}

function isPortInUse(p: number): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(true));
    srv.once("listening", () => {
      srv.close();
      resolve(false);
    });
    srv.listen(p, "0.0.0.0");
  });
}

function apiServerPlugin(): Plugin {
  let child: ChildProcess | null = null;

  return {
    name: "api-server-dev",
    apply: "serve",
    async configureServer(server) {
      if (child) return;

      if (process.env.EMBED_API_SERVER === "false") {
        console.log("[api-server-dev] Embedding disabled via EMBED_API_SERVER=false");
        return;
      }

      const alreadyRunning = await isPortInUse(API_SERVER_PORT);
      if (alreadyRunning) {
        console.log(
          `[api-server-dev] Port ${API_SERVER_PORT} already in use — skipping embedded api-server`
        );
        return;
      }

      child = spawn("node", ["--max-old-space-size=512", apiServerDist], {
        env: { ...process.env, PORT: String(API_SERVER_PORT) },
        stdio: "inherit",
        detached: false,
      });

      child.on("error", (err) => {
        console.error("[api-server-dev] Failed to start api-server:", err.message);
      });

      child.on("exit", (code) => {
        if (code !== null && code !== 0) {
          console.warn(`[api-server-dev] api-server exited with code ${code}`);
        }
        child = null;
      });

      server.httpServer?.once("close", () => {
        if (child) {
          child.kill("SIGTERM");
          child = null;
        }
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    sharedProxyPlugin(),
    apiServerPlugin(),
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
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: { clientPort: 443 },
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
