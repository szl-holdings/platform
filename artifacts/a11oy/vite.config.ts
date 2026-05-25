import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import { sharedProxyPlugin } from '@szl-holdings/shared-proxy';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { securityHeadersVitePlugin } from '@szl-holdings/security-headers';
import { sharedUiManifestPlugin } from './sharedUiManifestPlugin';

const vitePort = Number(process.env.VITE_PORT) || 4110;
const basePath = process.env.BASE_PATH || '/';

export default defineConfig({
  base: basePath,
  plugins: [
    securityHeadersVitePlugin(),
    sharedUiManifestPlugin(),
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
      { find: /^@szl-holdings\/omnia-shell\/provider$/, replacement: path.resolve(import.meta.dirname, '../../packages/omnia-shell/src/OmniaShellProvider.tsx') },
      { find: /^@szl-holdings\/omnia-shell\/top-bar$/, replacement: path.resolve(import.meta.dirname, '../../packages/omnia-shell/src/OmniaTopBar.tsx') },
      { find: /^@szl-holdings\/omnia-shell\/command-palette$/, replacement: path.resolve(import.meta.dirname, '../../packages/omnia-shell/src/OmniaCommandPalette.tsx') },
      { find: /^@szl-holdings\/omnia-shell\/provenance$/, replacement: path.resolve(import.meta.dirname, '../../packages/omnia-shell/src/Provenance.tsx') },
      { find: /^@szl-holdings\/omnia-shell\/hooks$/, replacement: path.resolve(import.meta.dirname, '../../packages/omnia-shell/src/hooks.ts') },
      { find: /^@szl-holdings\/omnia-shell\/types$/, replacement: path.resolve(import.meta.dirname, '../../packages/omnia-shell/src/types.ts') },
      { find: /^@szl-holdings\/omnia-shell$/, replacement: path.resolve(import.meta.dirname, '../../packages/omnia-shell/src/index.ts') },
      { find: /^@szl-holdings\/shared-ui\/billing$/, replacement: path.resolve(import.meta.dirname, '../../lib/shared-ui/src/billing/index.ts') },
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
            // Isolate map libraries (leaflet + maplibre-gl) so the chunk is
            // only fetched on the imperium-map / geospatial pages.
            if (
              id.includes('maplibre-gl') ||
              id.includes('/leaflet/') ||
              id.includes('react-leaflet') ||
              id.includes('/earcut/') ||
              id.includes('/geojson-vt/') ||
              id.includes('/vt-pbf/') ||
              id.includes('/pbf/') ||
              id.includes('/supercluster/') ||
              id.includes('/kdbush/') ||
              id.includes('/quickselect/') ||
              id.includes('/potpack/') ||
              id.includes('/tinyqueue/')
            ) {
              return 'vendor-map';
            }
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
  server: {
    port: vitePort || undefined,
    strictPort: !!vitePort,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: { clientPort: 443, path: basePath },
    fs: {
      strict: false,
      deny: ['**/.*'],
    },
  },
  preview: {
    port: vitePort || undefined,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
