import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { sharedProxyPlugin } from '@szl-holdings/shared-proxy';
import { securityHeadersVitePlugin } from '@szl-holdings/security-headers';

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? '2';

const vitePort = Number(process.env.VITE_PORT) || 8099;
const basePath = process.env.BASE_PATH || '/vessels/';

function rootRedirectPlugin(): Plugin {
  return {
    name: 'root-redirect',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(
            `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${basePath}"></head><body></body></html>`,
          );
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    securityHeadersVitePlugin(),
    rootRedirectPlugin(),
    sharedProxyPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
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
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(import.meta.dirname, '..', '..', 'attached_assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    sourcemap: 'hidden',
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      external: ['worker_threads', 'node:worker_threads', 'async_hooks', 'node:async_hooks'],
      output: {
        manualChunks(id): string | undefined {
          if (id.includes('node_modules')) {
            // Isolate mapbox-gl and its heavy peers (~1.7MB) so the chunk is
            // only fetched when fleet-map.tsx dynamically imports
            // `mapbox-gl` (the page itself is lazy-loaded).
            if (
              id.includes('mapbox-gl') ||
              id.includes('/earcut/') ||
              id.includes('/geojson-vt/') ||
              id.includes('/vt-pbf/') ||
              id.includes('/pbf/') ||
              id.includes('/supercluster/') ||
              id.includes('/kdbush/') ||
              id.includes('/quickselect/') ||
              id.includes('/rw-lock/') ||
              id.includes('/potpack/') ||
              id.includes('/tinyqueue/')
            ) {
              return 'vendor-mapbox';
            }
            // Split the chart stack so consumers only pay for what they use.
            // - `vendor-recharts` is loaded by any chart page.
            // - `vendor-d3` groups the d3-* utilities (some chart consumers
            //   only need a subset; isolating them keeps recharts-only pages
            //   from paying for the full d3 footprint when downstream tree-
            //   shaking improves).
            if (id.includes('/recharts/')) return 'vendor-recharts';
            if (id.includes('/victory-vendor/')) return 'vendor-recharts';
            if (id.includes('/d3-')) return 'vendor-d3';
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
    holdUntilCrawlEnd: false,
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      '@tanstack/react-query',
      'recharts',
    ],
  },
  server: {
    port: vitePort,
    strictPort: true,
    host: '::',
    allowedHosts: true,
    warmup: {
      clientFiles: ['src/main.tsx', 'src/App.tsx'],
    },
    hmr: { clientPort: 443, path: basePath },
    fs: {
      strict: false,
      deny: ['**/.*'],
    },
  },
  preview: {
    port: vitePort,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
