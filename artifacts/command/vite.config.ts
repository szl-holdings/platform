import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { spawn, type ChildProcess } from "child_process";
import net from "net";

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? "2";

const port = Number(process.env.PORT) || 25200;
const basePath = process.env.BASE_PATH || "/command/";

const API_SERVER_PORT = 8080;
const apiServerDist = path.resolve(import.meta.dirname, "..", "api-server", "dist", "index.mjs");

function healthCheckPlugin(): Plugin {
  return {
    name: "health-check",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (url === "/" || url === "/__health" || url === "/health") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("ok");
          return;
        }
        next();
      });
    },
  };
}

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(true));
    srv.once("listening", () => { srv.close(); resolve(false); });
    srv.listen(port, "0.0.0.0");
  });
}

function apiServerPlugin(): Plugin {
  let child: ChildProcess | null = null;

  return {
    name: "api-server-dev",
    apply: "serve",
    async configureServer(server) {
      if (child) return;

      const alreadyRunning = await isPortInUse(API_SERVER_PORT);
      if (alreadyRunning) {
        console.log(`[api-server-dev] Port ${API_SERVER_PORT} already in use — skipping embedded api-server`);
        return;
      }

      child = spawn(
        "node",
        ["--max-old-space-size=512", apiServerDist],
        {
          env: { ...process.env, PORT: String(API_SERVER_PORT) },
          stdio: "inherit",
          detached: false,
        }
      );

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
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    healthCheckPlugin(),
    apiServerPlugin(),
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
            if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
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
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: { clientPort: 443 },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: `http://localhost:${API_SERVER_PORT}`,
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
