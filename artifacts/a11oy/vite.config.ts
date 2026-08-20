import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import { sharedProxyPlugin } from '@szl-holdings/shared-proxy';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { securityHeadersVitePlugin } from '@szl-holdings/security-headers';

const vitePort = Number(process.env.VITE_PORT) || 4110;
const basePath = process.env.BASE_PATH || '/a11oy/';

export default defineConfig({
  base: basePath,
  plugins: [
    securityHeadersVitePlugin(),
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
      {
        find: /^@szl-holdings\/flexcache\/react$/,
        replacement: path.resolve(import.meta.dirname, '../../lib/flexcache/src/react.tsx'),
      },
      {
        find: /^@szl-holdings\/flexcache$/,
        replacement: path.resolve(import.meta.dirname, '../../lib/flexcache/src/index.ts'),
      },
      {
        find: /^@szl-holdings\/omnia-shell\/provider$/,
        replacement: path.resolve(
          import.meta.dirname,
          '../../packages/omnia-shell/src/OmniaShellProvider.tsx',
        ),
      },
      {
        find: /^@szl-holdings\/omnia-shell\/top-bar$/,
        replacement: path.resolve(
          import.meta.dirname,
          '../../packages/omnia-shell/src/OmniaTopBar.tsx',
        ),
      },
      {
        find: /^@szl-holdings\/omnia-shell\/command-palette$/,
        replacement: path.resolve(
          import.meta.dirname,
          '../../packages/omnia-shell/src/OmniaCommandPalette.tsx',
        ),
      },
      {
        find: /^@szl-holdings\/omnia-shell\/provenance$/,
        replacement: path.resolve(
          import.meta.dirname,
          '../../packages/omnia-shell/src/Provenance.tsx',
        ),
      },
      {
        find: /^@szl-holdings\/omnia-shell\/hooks$/,
        replacement: path.resolve(import.meta.dirname, '../../packages/omnia-shell/src/hooks.ts'),
      },
      {
        find: /^@szl-holdings\/omnia-shell\/types$/,
        replacement: path.resolve(import.meta.dirname, '../../packages/omnia-shell/src/types.ts'),
      },
      {
        find: /^@szl-holdings\/omnia-shell$/,
        replacement: path.resolve(import.meta.dirname, '../../packages/omnia-shell/src/index.ts'),
      },
      {
        find: /^@szl-holdings\/shared-ui\/billing$/,
        replacement: path.resolve(import.meta.dirname, '../../lib/shared-ui/src/billing/index.ts'),
      },
    ],
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    sourcemap: 'hidden',
    emptyOutDir: true,
    cssCodeSplit: true,
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
