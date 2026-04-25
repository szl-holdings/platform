import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import { sharedProxyPlugin } from '@szl-holdings/shared-proxy';

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? '2';

const port = Number(process.env.VITE_PORT) || 5205;
const basePath = process.env.BASE_PATH || '/helios/';

const libRoot = path.resolve(import.meta.dirname, '../../lib');
const packagesRoot = path.resolve(import.meta.dirname, '../../packages');

interface AliasEntry {
  find: string | RegExp;
  replacement: string;
}

function scanDirForAliases(rootDir: string, aliases: AliasEntry[]): void {
  if (!fs.existsSync(rootDir)) return;
  const dirs = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const dir of dirs) {
    const pkgPath = path.join(rootDir, dir, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (!pkg.name || !pkg.exports) continue;
      for (const [exportKey, exportValue] of Object.entries(pkg.exports)) {
        if (typeof exportValue !== 'string') continue;
        const aliasKey =
          exportKey === '.' ? pkg.name : `${pkg.name}/${exportKey.replace(/^\.\//, '')}`;
        const aliasValue = path.join(rootDir, dir, exportValue);
        const escapedKey = aliasKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        aliases.push({ find: new RegExp(`^${escapedKey}$`), replacement: aliasValue });
      }
    } catch {
      // skip
    }
  }
}

function buildWorkspaceAliases(): AliasEntry[] {
  const aliases: AliasEntry[] = [];
  scanDirForAliases(libRoot, aliases);
  scanDirForAliases(packagesRoot, aliases);
  return aliases;
}

const workspaceAliases = buildWorkspaceAliases();

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    sharedProxyPlugin(),
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(import.meta.dirname, 'src') },
      ...workspaceAliases,
    ],
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    sourcemap: 'hidden',
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
          }
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    holdUntilCrawlEnd: false,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: { clientPort: 443, path: basePath },
    fs: {
      strict: false,
      deny: ['**/.*'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
