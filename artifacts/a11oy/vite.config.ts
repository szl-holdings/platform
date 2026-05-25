import { cpSync, existsSync, createReadStream, statSync } from 'node:fs';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import { sharedProxyPlugin } from '@szl-holdings/shared-proxy';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { securityHeadersVitePlugin } from '@szl-holdings/security-headers';
import { sharedUiManifestPlugin } from './sharedUiManifestPlugin';

const vitePort = Number(process.env.VITE_PORT) || 4110;
const basePath = process.env.BASE_PATH || '/';

const REPO_DOCS = path.resolve(import.meta.dirname, '../../docs');
const DOCS_URL_PREFIX = '/docs/';
const DOCS_ALLOWED_SUBPATH = 'proposals/defense-unicorns/tuesday';
const DOCS_ALLOWED_ROOT = path.join(REPO_DOCS, DOCS_ALLOWED_SUBPATH);

const MIME: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.zip': 'application/zip',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function repoDocsPlugin(): Plugin {
  return {
    name: 'a11oy-repo-docs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith(DOCS_URL_PREFIX)) return next();
        let rel: string;
        try {
          rel = decodeURIComponent(url.slice(DOCS_URL_PREFIX.length).split('?')[0]);
        } catch {
          return next();
        }
        const filePath = path.resolve(REPO_DOCS, rel);
        if (!filePath.startsWith(DOCS_ALLOWED_ROOT + path.sep)) return next();
        if (!existsSync(filePath) || !statSync(filePath).isFile()) return next();
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
        createReadStream(filePath).pipe(res);
      });
    },
    writeBundle() {
      const src = path.join(REPO_DOCS, 'proposals/defense-unicorns/tuesday');
      const dest = path.resolve(
        import.meta.dirname,
        'dist/public/docs/proposals/defense-unicorns/tuesday',
      );
      if (existsSync(src)) {
        cpSync(src, dest, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    securityHeadersVitePlugin(),
    sharedUiManifestPlugin(),
    repoDocsPlugin(),
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
