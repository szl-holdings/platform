import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { PLUGINMESH_PORT, sharedProxyPlugin } from '@szl-holdings/shared-proxy';
import { securityHeadersVitePlugin } from '@szl-holdings/security-headers';

process.env.GOMAXPROCS = process.env.GOMAXPROCS ?? '2';

const vitePort = Number(process.env.VITE_PORT) || 8190;
const basePath = process.env.BASE_PATH || '/pluginmesh/';

function healthCheckPlugin(): Plugin {
  return {
    name: 'health-check',
    apply: 'serve' as const,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__health') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
          return;
        }
        next();
      });
    },
  };
}

function portBridgePlugin(bridgePort: number, targetPort: number): Plugin {
  return {
    name: 'port-bridge',
    apply: 'serve' as const,
    configureServer(server) {
      if (bridgePort === targetPort) return;
      server.httpServer?.once('listening', () => {
        const bridge = http.createServer((req, res) => {
          const opts = {
            hostname: '127.0.0.1',
            port: targetPort,
            path: req.url,
            method: req.method,
            headers: { ...req.headers, host: `localhost:${targetPort}` },
          };
          const proxy = http.request(opts, (upstream) => {
            res.writeHead(upstream.statusCode ?? 502, upstream.headers);
            upstream.pipe(res, { end: true });
          });
          proxy.on('error', () => {
            if (!res.headersSent) {
              res.writeHead(502);
              res.end('upstream unavailable');
            }
          });
          req.pipe(proxy, { end: true });
        });

        bridge.on('upgrade', (req, clientSocket, head) => {
          const upstream = net.connect(targetPort, '127.0.0.1', () => {
            upstream.write(
              `${req.method} ${req.url} HTTP/1.1\r\n` +
                `Host: localhost:${targetPort}\r\n` +
                Object.entries(req.headers)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join('\r\n') +
                '\r\n\r\n',
            );
            upstream.write(head);
            clientSocket.pipe(upstream);
            upstream.pipe(clientSocket);
          });
          upstream.on('error', () => clientSocket.destroy());
          clientSocket.on('error', () => upstream.destroy());
        });

        bridge.listen(bridgePort, '::', () => {
          console.log(
            `  ➜  Bridge:  http://localhost:${bridgePort}/ → http://localhost:${targetPort}/`,
          );
        });
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    securityHeadersVitePlugin(),
    healthCheckPlugin(),
    portBridgePlugin(PLUGINMESH_PORT, vitePort),
    sharedProxyPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, '..') }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
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
    port: vitePort,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: { clientPort: 443, path: basePath },
    fs: { strict: false, deny: ['**/.*'] },
  },
  preview: {
    port: vitePort,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
