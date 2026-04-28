import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { sharedProxyPlugin } from '@szl-holdings/shared-proxy';
import { sharedUiManifestPlugin } from './sharedUiManifestPlugin';
import { securityHeadersVitePlugin } from '@szl-holdings/security-headers';

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? '2';

const port = Number(process.env.VITE_PORT) || 8008;
const basePath = process.env.BASE_PATH || '/nexus/';

function healthCheckPlugin(): Plugin {
  return {
    name: 'health-check',
    apply: 'serve' as const,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (url === '/__health' || url === `${basePath}__health` || url.endsWith('/__health')) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
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
    securityHeadersVitePlugin(),
    healthCheckPlugin(),
    sharedProxyPlugin(),
    sharedUiManifestPlugin(),
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
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id): string | undefined {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            // Bundle React + Radix UI together: Radix primitives import React
            // and were previously emitted as a separate chunk, which produced
            // a vendor-radix → vendor-react → vendor-radix cycle that crashed
            // the page at runtime ("Cannot access 'S' before initialization").
            // Co-locating them in one chunk avoids the cycle entirely.
            if (
              id.includes('@radix-ui') ||
              id.includes('react-dom') ||
              id.includes('react/')
            )
              return 'vendor-react';
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
    host: '::',
    allowedHosts: true,
    hmr: { clientPort: 443 },
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
