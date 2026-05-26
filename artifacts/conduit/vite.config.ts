import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { sharedProxyPlugin } from '@szl-holdings/shared-proxy';
import { securityHeadersVitePlugin } from '@szl-holdings/security-headers';

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? '2';

const vitePort = Number(process.env.VITE_PORT) || 5300;
const basePath = process.env.BASE_PATH || '/conduit/';

export default defineConfig({
  base: basePath,
  plugins: [
    securityHeadersVitePlugin(),
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
      'framer-motion',
      'lucide-react',
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
    hmr: { clientPort: 443 },
    fs: {
      strict: false,
      deny: ['**/.*'],
    },
  },
  preview: {
    port: vitePort,
    host: '::',
    allowedHosts: true,
  },
});
