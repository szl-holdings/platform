import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { sharedProxyPlugin } from '@szl-holdings/shared-proxy';

const vitePort = Number(process.env.VITE_PORT) || 5000;
const basePath = process.env.BASE_PATH || '/command/';

export default defineConfig({
  base: basePath,
  plugins: [sharedProxyPlugin(), react()],
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
  },
  server: {
    port: vitePort,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: { clientPort: 443, path: basePath },
  },
  preview: {
    port: vitePort,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
