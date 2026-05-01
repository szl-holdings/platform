import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import cartographer from '@replit/vite-plugin-cartographer';
import devBanner from '@replit/vite-plugin-dev-banner';
import runtimeErrorModal from '@replit/vite-plugin-runtime-error-modal';

export default defineConfig({
  base: '/${{ values.domainSlug }}/',
  plugins: [
    react(),
    tailwindcss(),
    cartographer(),
    devBanner(),
    runtimeErrorModal(),
  ],
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT ?? '5173'),
    allowedHosts: true, // Required for Replit proxy
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
