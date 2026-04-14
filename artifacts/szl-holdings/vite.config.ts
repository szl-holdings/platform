import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import fs from "fs";

// Limit esbuild Go runtime threads to prevent OS thread exhaustion
// when multiple Vite dev servers run simultaneously
process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? "2";

const port = Number(process.env.PORT) || 3000;
const basePath = process.env.BASE_PATH || "/";

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
