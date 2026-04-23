export interface ProxyRoute {
  prefix: string;
  port: number;
}

// Canonical fallback owner for any prefix not explicitly listed below.
// szl-holdings is mounted at "/" (the artifact whose previewPath is "/"), so
// it is the natural home for everything that does not belong to a sibling
// artifact. Each shared-proxy listener forwards unknown prefixes here
// instead of to its own vite port, which keeps routing deterministic even
// when the kernel load-balances incoming connections across listeners that
// all bind 9090 with SO_REUSEPORT.
export const CANONICAL_FALLBACK_PORT = 21130;

// Canonical proxy port. All artifacts bind this with SO_REUSEPORT so the
// OS load-balances incoming connections. This value must not be overridden
// via any environment variable — it is intentionally hardcoded here so every
// artifact always agrees on a single port.
export const SHARED_PROXY_PORT = 9090;

export const PROXY_ROUTES: ProxyRoute[] = [
  { prefix: '/aegis/', port: 3002 },
  { prefix: '/api/', port: 8080 },
  { prefix: '/carlota-jo/', port: 8098 },
  { prefix: '/command/', port: 5000 },
  { prefix: '/counsel/', port: 4199 },
  { prefix: '/lyte/', port: 7099 },
  { prefix: '/nexus/', port: 8008 },
  { prefix: '/sentra/', port: 4099 },
  { prefix: '/terra/', port: 6000 },
  { prefix: '/vessels/', port: 8099 },
  { prefix: '/pulse/', port: 5201 },
  { prefix: '/prism-counsel/', port: 7100 },
  { prefix: '/szl-demo-video/', port: 8765 },
];

/**
 * Shared Vite plugin used by every sub-path artifact.
 *
 * Binds a reverse-proxy server on SHARED_PROXY_PORT (9090) with
 * SO_REUSEPORT so all artifact dev-servers share the same external port.
 * Incoming HTTP requests are routed to the correct artifact port via
 * PROXY_ROUTES; unknown prefixes fall back to CANONICAL_FALLBACK_PORT.
 * WebSocket upgrade frames are forwarded with a raw TCP tunnel so HMR
 * works across all artifacts.
 */
export function sharedProxyPlugin() {
  return {
    name: 'shared-proxy',
    apply: 'serve' as const,
    async configureServer() {
      const http = await import('node:http');
      const net = await import('node:net');
      const proxyServer = http.createServer((req, res) => {
        const url = req.url || '/';
        if (url === '/__health') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
          return;
        }
        const normalizedUrl = url.endsWith('/') ? url : `${url}/`;
        const route = PROXY_ROUTES.find((r) => normalizedUrl.startsWith(r.prefix));
        const targetPort = route ? route.port : CANONICAL_FALLBACK_PORT;
        const upstream = http.request(
          {
            hostname: '127.0.0.1',
            port: targetPort,
            path: url,
            method: req.method,
            headers: { ...req.headers, host: `localhost:${targetPort}` },
          },
          (upRes) => {
            res.writeHead(upRes.statusCode || 200, upRes.headers);
            upRes.pipe(res, { end: true });
          },
        );
        upstream.on('error', () => {
          if (!res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'text/plain' });
            res.end(`Upstream not ready on port ${targetPort}`);
          }
        });
        req.pipe(upstream, { end: true });
      });
      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        };
        proxyServer.once('error', (_err: NodeJS.ErrnoException) => {
          finish();
        });
        proxyServer.listen({ port: SHARED_PROXY_PORT, host: '::', reusePort: true }, () => {
          finish();
        });
      });
      proxyServer.on('upgrade', (req, socket, head) => {
        const url = req.url || '/';
        const normalizedUrl = url.endsWith('/') ? url : `${url}/`;
        const route = PROXY_ROUTES.find((r) => normalizedUrl.startsWith(r.prefix));
        const targetPort = route ? route.port : CANONICAL_FALLBACK_PORT;
        const conn = net.connect(targetPort, '127.0.0.1', () => {
          const rawHeaders = Object.entries(req.headers)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\r\n');
          conn.write(`${req.method} ${url} HTTP/1.1\r\n${rawHeaders}\r\n\r\n`);
          if (head?.length) conn.write(head);
          socket.pipe(conn);
          conn.pipe(socket);
        });
        conn.on('error', () => socket.destroy());
        socket.on('error', () => conn.destroy());
      });
    },
  };
}
