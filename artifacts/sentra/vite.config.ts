import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { sharedProxyPlugin } from '@szl-holdings/shared-proxy';
import { securityHeadersVitePlugin } from '@szl-holdings/security-headers';

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? '2';

const vitePort = Number(process.env.VITE_PORT) || 4099;
const basePath = process.env.BASE_PATH || '/sentra/';

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
      external: [
        '@google-cloud/storage',
        'node:fs',
        'node:path',
        'node:url',
        'node:crypto',
        'node:stream',
        'node:buffer',
        'node:os',
        'node:http',
        'node:https',
        'fs',
        'path',
        'url',
        'crypto',
        'stream',
      ],
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
    holdUntilCrawlEnd: false,
  },
  server: {
    port: vitePort,
    strictPort: true,
    host: '::',
    allowedHosts: true,
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
