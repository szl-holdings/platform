import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import fs from "fs";

// Limit esbuild Go runtime threads to prevent OS thread exhaustion
process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? "2";

const port = Number(process.env.VITE_PORT) || 26500;
const basePath = process.env.BASE_PATH || "/prism-counsel/";

const libRoot = path.resolve(import.meta.dirname, "../../lib");

interface AliasEntry {
  find: string | RegExp;
  replacement: string;
}

function buildWorkspaceAliases(): AliasEntry[] {
  const aliases: AliasEntry[] = [];
  if (!fs.existsSync(libRoot)) return aliases;

  const libDirs = fs.readdirSync(libRoot, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const dir of libDirs) {
    const pkgPath = path.join(libRoot, dir, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (!pkg.name || !pkg.exports) continue;

      for (const [exportKey, exportValue] of Object.entries(pkg.exports)) {
        if (typeof exportValue !== "string") continue;
        const aliasKey = exportKey === "."
          ? pkg.name
          : `${pkg.name}/${exportKey.replace(/^\.\//, "")}`;
        const aliasValue = path.join(libRoot, dir, exportValue);
        const escapedKey = aliasKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        aliases.push({
          find: new RegExp(`^${escapedKey}$`),
          replacement: aliasValue,
        });
      }
    } catch {
      // skip
    }
  }
  return aliases;
}

const workspaceAliases = buildWorkspaceAliases();


  function healthCheckPlugin() {
    return {
      name: "health-check",
      apply: "serve",
      async configureServer() {
        const http = await import("http");
        const proxyServer = http.createServer((req, res) => {
          const url = req.url || "/";
          if (url === "/" || url === "/health" || url === "/__health") {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("OK");
            return;
          }
          const upstream = http.request(
            { hostname: "127.0.0.1", port, path: url, method: req.method,
              headers: { ...req.headers, host: "localhost:" + port } },
            (upRes) => { res.writeHead(upRes.statusCode || 200, upRes.headers); upRes.pipe(res, { end: true }); }
          );
          upstream.on("error", () => { if (!res.headersSent) { res.writeHead(503); res.end("Upstream not ready"); } });
          req.pipe(upstream, { end: true });
        });
        proxyServer.listen({ port: 9090, host: "0.0.0.0", reusePort: true }, () => {
          console.log("[health-check] Proxy listening on port 9090 (reusePort)");
        });
        proxyServer.on("error", (err: NodeJS.ErrnoException) => {
          console.warn("[health-check] Port 9090 bind failed:", err.code);
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
    alias: [
      { find: "@", replacement: path.resolve(import.meta.dirname, "src") },
      ...workspaceAliases,
    ],
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
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react-dom')) return 'vendor-react';
            if (id.includes('react/')) return 'vendor-react';
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
      strict: false,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
