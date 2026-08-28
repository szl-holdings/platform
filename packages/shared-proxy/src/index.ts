/**
 * @szl-holdings/shared-proxy — single shared reverse-proxy Vite plugin.
 * Import sharedProxyPlugin from this package in every artifact vite.config.ts.
 */

// ─── Route table ──────────────────────────────────────────────────────────────

export interface ProxyRoute {
  prefix: string;
  port: number;
}

export const CANONICAL_FALLBACK_PORT = 21130;
export const SHARED_PROXY_PORT = 9090;

export const A11OY_PORT = 4110;
export const API_PORT = 8080;
export const CARLOTA_JO_PORT = 8098;
export const COMMAND_PORT = 5000;
export const COUNSEL_PORT = 4199;
export const LYTE_PORT = 7099;
export const PRAXIS_PORT = 8008;
export const SENTRA_PORT = 4099;
export const TERRA_PORT = 6000;
export const VESSELS_PORT = 8099;
export const PULSE_PORT = 5201;
export const SZL_DEMO_VIDEO_PORT = 8765;
export const PLUGINMESH_PORT = 8190;
export const CONDUIT_PORT = 5300;

export const PROXY_ROUTES: ProxyRoute[] = [
  { prefix: '/a11oy/', port: A11OY_PORT },
  { prefix: '/api/', port: API_PORT },
  // '/ws/' routes bare WebSocket upgrades to the api-server platform WS
  // (artifacts/api-server/src/lib/websocket.ts, path: '/ws').
  { prefix: '/ws/', port: API_PORT },
  { prefix: '/carlota-jo/', port: CARLOTA_JO_PORT },
  { prefix: '/command/', port: COMMAND_PORT },
  { prefix: '/conduit/', port: CONDUIT_PORT },
  { prefix: '/counsel/', port: COUNSEL_PORT },
  { prefix: '/lyte/', port: LYTE_PORT },
  { prefix: '/nexus/', port: PRAXIS_PORT },
  { prefix: '/sentra/', port: SENTRA_PORT },
  { prefix: '/terra/', port: TERRA_PORT },
  { prefix: '/vessels/', port: VESSELS_PORT },
  { prefix: '/pulse/', port: PULSE_PORT },
  { prefix: '/szl-demo-video/', port: SZL_DEMO_VIDEO_PORT },
  { prefix: '/pluginmesh/', port: PLUGINMESH_PORT },
];

// ─── Diagnostics state ────────────────────────────────────────────────────────

interface RouteHealth {
  lastSuccessMs: number | null;
  lastFailureMs: number | null;
  consecutiveFailures: number;
}

interface WsTunnel {
  id: string;
  route: string;
  port: number;
  openedAt: number;
  lastDataFromUpstreamAt: number | null;
  clientSocket: import('node:net').Socket;
  upstreamSocket: import('node:net').Socket;
}

const startTimeMs = Date.now();
const httpRequestCounts = new Map<string, number>();
let httpRequestTotal = 0;
let httpActiveConnections = 0;

const wsActiveTunnels = new Map<string, WsTunnel>();
let wsTunnelIdCounter = 0;

const upstreamHealth = new Map<number, RouteHealth>();

function getOrInitHealth(port: number): RouteHealth {
  if (!upstreamHealth.has(port)) {
    upstreamHealth.set(port, { lastSuccessMs: null, lastFailureMs: null, consecutiveFailures: 0 });
  }
  return upstreamHealth.get(port)!;
}

function recordUpstreamSuccess(port: number): void {
  const h = getOrInitHealth(port);
  h.lastSuccessMs = Date.now();
  h.consecutiveFailures = 0;
}

function recordUpstreamFailure(port: number): void {
  const h = getOrInitHealth(port);
  h.lastFailureMs = Date.now();
  h.consecutiveFailures += 1;
}

// Resolve the upstream port for a request URL. Strips query/fragment before
// prefix matching so '/ws?ticket=abc' resolves identically to '/ws'.
function resolveRoute(url: string): { route: ProxyRoute | null; port: number; label: string } {
  let pathname: string;
  try {
    pathname = new URL(url, 'http://x').pathname;
  } catch {
    pathname = url.split('?')[0]!.split('#')[0]!;
  }
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const route = PROXY_ROUTES.find((r) => normalized.startsWith(r.prefix)) ?? null;
  const port = route ? route.port : CANONICAL_FALLBACK_PORT;
  const label = route ? route.prefix : '/ (fallback)';
  return { route, port, label };
}

function incrementHttpCount(label: string): void {
  httpRequestCounts.set(label, (httpRequestCounts.get(label) ?? 0) + 1);
  httpRequestTotal += 1;
}

// ─── Error pages ──────────────────────────────────────────────────────────────

function errorHtml(status: number, title: string, detail: string): string {
  return (
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
    `<title>${status} ${title}</title>` +
    `<style>body{font-family:monospace;padding:2rem;background:#0d0d0d;color:#e0e0e0}` +
    `h1{color:#ff4444;font-size:1.5rem}p{color:#aaa}</style></head>` +
    `<body><h1>${status} ${title}</h1><p>${detail}</p></body></html>`
  );
}

// ─── Status payload ───────────────────────────────────────────────────────────

function buildStatusPayload() {
  const wsByRoute: Record<string, number> = {};
  for (const tunnel of wsActiveTunnels.values()) {
    wsByRoute[tunnel.route] = (wsByRoute[tunnel.route] ?? 0) + 1;
  }

  return {
    uptimeSec: Math.floor((Date.now() - startTimeMs) / 1000),
    startedAt: new Date(startTimeMs).toISOString(),
    http: {
      activeConnections: httpActiveConnections,
      totalRequests: httpRequestTotal,
      byRoute: Object.fromEntries(httpRequestCounts),
    },
    websocket: {
      activeTunnels: wsActiveTunnels.size,
      byRoute: wsByRoute,
      tunnels: Array.from(wsActiveTunnels.values()).map((t) => ({
        id: t.id,
        route: t.route,
        port: t.port,
        openedAt: new Date(t.openedAt).toISOString(),
        ageSec: Math.floor((Date.now() - t.openedAt) / 1000),
        lastDataFromUpstreamAt: t.lastDataFromUpstreamAt
          ? new Date(t.lastDataFromUpstreamAt).toISOString()
          : null,
      })),
    },
    routes: PROXY_ROUTES.map((r) => {
      const h = upstreamHealth.get(r.port);
      return {
        prefix: r.prefix,
        port: r.port,
        httpRequests: httpRequestCounts.get(r.prefix) ?? 0,
        activeWsTunnels: wsByRoute[r.prefix] ?? 0,
        upstream: h
          ? {
              lastSuccessMs: h.lastSuccessMs,
              lastFailureMs: h.lastFailureMs,
              consecutiveFailures: h.consecutiveFailures,
              healthy: h.consecutiveFailures === 0,
            }
          : null,
      };
    }),
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HTTP_UPSTREAM_TIMEOUT_MS = 30_000;
const WS_TCP_KEEPALIVE_DELAY_MS = 30_000;
// Periodic scan interval for zombie tunnel reaping (see health scan below).
const WS_TUNNEL_SCAN_INTERVAL_MS = 30_000;
// RFC 6455 §5.5.1 close frame: FIN+opcode=0x8, payload_len=2, status=1001 Going Away.
const WS_CLOSE_GOING_AWAY = Buffer.from([0x88, 0x02, 0x03, 0xe9]);

// ─── Plugin ───────────────────────────────────────────────────────────────────

export function sharedProxyPlugin() {
  return {
    name: 'shared-proxy',
    apply: 'serve' as const,
    async configureServer() {
      const http = await import('node:http');
      const net = await import('node:net');

      // ── HTTP handler ──────────────────────────────────────────────────────

      const proxyServer = http.createServer((req, res) => {
        const url = req.url ?? '/';

        if (url === '/__health') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
          return;
        }

        if (url === '/__proxy/status') {
          const body = JSON.stringify(buildStatusPayload(), null, 2);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(body);
          return;
        }

        const { port: targetPort, label } = resolveRoute(url);
        incrementHttpCount(label);
        httpActiveConnections += 1;

        const clientIp =
          (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
          req.socket.remoteAddress ??
          '127.0.0.1';

        const upstreamHeaders = {
          ...req.headers,
          host: `localhost:${targetPort}`,
          'x-forwarded-for': clientIp,
          'x-forwarded-host': req.headers.host ?? `localhost:${SHARED_PROXY_PORT}`,
          'x-forwarded-proto': 'http',
          'x-forwarded-port': String(SHARED_PROXY_PORT),
        };

        const upstream = http.request(
          {
            hostname: '127.0.0.1',
            port: targetPort,
            path: url,
            method: req.method,
            headers: upstreamHeaders,
            timeout: HTTP_UPSTREAM_TIMEOUT_MS,
          },
          (upRes) => {
            recordUpstreamSuccess(targetPort);
            res.writeHead(upRes.statusCode ?? 200, upRes.headers);
            upRes.pipe(res, { end: true });
            upRes.on('error', () => res.destroy());
          },
        );

        let connectionDecremented = false;
        function decrementActive() {
          if (!connectionDecremented) {
            connectionDecremented = true;
            httpActiveConnections = Math.max(0, httpActiveConnections - 1);
          }
        }
        res.once('finish', decrementActive);
        res.once('close', decrementActive);

        upstream.on('timeout', () => {
          upstream.destroy();
          recordUpstreamFailure(targetPort);
          if (!res.headersSent) {
            res.writeHead(504, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(
              errorHtml(
                504,
                'Gateway Timeout',
                `Upstream on port ${targetPort} timed out after ${HTTP_UPSTREAM_TIMEOUT_MS / 1000}s.`,
              ),
            );
          }
        });

        upstream.on('error', (err: NodeJS.ErrnoException) => {
          recordUpstreamFailure(targetPort);
          if (!res.headersSent) {
            const isConnRefused = err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET';
            const status = isConnRefused ? 503 : 502;
            const title = isConnRefused ? 'Service Unavailable' : 'Bad Gateway';
            const detail = isConnRefused
              ? `Upstream on port ${targetPort} is not ready. Start the dev server for this artifact.`
              : `Upstream on port ${targetPort} returned an unexpected error: ${err.message}`;
            res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(errorHtml(status, title, detail));
          }
        });

        req.on('error', () => upstream.destroy());
        req.pipe(upstream, { end: true });
      });

      // ── Bind with SO_REUSEPORT ────────────────────────────────────────────

      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        };
        proxyServer.once('error', (err: NodeJS.ErrnoException) => {
          if (err.code !== 'EADDRINUSE') {
            console.error(
              `[shared-proxy] Failed to bind on port ${SHARED_PROXY_PORT}: ${err.message}`,
            );
          }
          finish();
        });
        if (process.platform === 'win32') {
          // Windows does not implement SO_REUSEPORT for this listener shape.
          proxyServer.listen({ port: SHARED_PROXY_PORT, host: '0.0.0.0' }, finish);
        } else {
          proxyServer.listen({ port: SHARED_PROXY_PORT, host: '::', reusePort: true }, finish);
        }
      });

      // ── WebSocket upgrade handler ─────────────────────────────────────────

      proxyServer.on('upgrade', (req, rawSocket, head) => {
        const socket = rawSocket as import('node:net').Socket;
        const url = req.url ?? '/';
        const { port: targetPort, label } = resolveRoute(url);

        const tunnelId = `ws-${++wsTunnelIdCounter}`;
        let cleanedUp = false;
        let handshakeComplete = false;

        const upstream = net.connect(targetPort, '127.0.0.1');

        function cleanup() {
          if (cleanedUp) return;
          cleanedUp = true;
          wsActiveTunnels.delete(tunnelId);
          // Post-handshake: send 1001 Going Away so the browser auto-reconnects.
          if (handshakeComplete && !socket.destroyed) {
            try {
              socket.write(WS_CLOSE_GOING_AWAY);
              socket.end();
            } catch {
              socket.destroy();
            }
          } else if (!socket.destroyed) {
            socket.destroy();
          }
          if (!upstream.destroyed) upstream.destroy();
        }

        // Pre-connect error handler: removed explicitly when TCP connect succeeds
        // so it cannot fire again mid-session and race with the cleanup handler.
        function handlePreConnectError(err: NodeJS.ErrnoException) {
          recordUpstreamFailure(targetPort);
          if (!socket.destroyed) {
            const isConnRefused = err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET';
            const status = isConnRefused ? 503 : 502;
            const statusText = isConnRefused ? 'Service Unavailable' : 'Bad Gateway';
            socket.write(
              `HTTP/1.1 ${status} ${statusText}\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\n` +
                `WebSocket upstream on port ${targetPort} is not available.`,
            );
            socket.destroy();
          }
        }

        upstream.once('error', handlePreConnectError);

        upstream.once('connect', () => {
          upstream.removeListener('error', handlePreConnectError);
          recordUpstreamSuccess(targetPort);

          // TCP keepalive for OS-level dead-peer detection.
          upstream.setKeepAlive(true, WS_TCP_KEEPALIVE_DELAY_MS);
          socket.setKeepAlive(true, WS_TCP_KEEPALIVE_DELAY_MS);

          const tunnel: WsTunnel = {
            id: tunnelId,
            route: label,
            port: targetPort,
            openedAt: Date.now(),
            lastDataFromUpstreamAt: null,
            clientSocket: socket,
            upstreamSocket: upstream,
          };
          wsActiveTunnels.set(tunnelId, tunnel);

          // Replay the HTTP Upgrade handshake verbatim to upstream.
          const requestLine = `${req.method ?? 'GET'} ${url} HTTP/1.1\r\n`;
          const headerLines = Object.entries(req.headers)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\r\n');
          upstream.write(`${requestLine}${headerLines}\r\n\r\n`);
          if (head?.length) upstream.write(head);

          // Intercept first upstream response chunk to confirm 101 before piping.
          // handshakeComplete is set only on confirmed upgrade so cleanup() avoids
          // injecting a WS close frame on a socket that was never promoted.
          upstream.once('data', (firstChunk: Buffer) => {
            const firstLine = firstChunk.slice(0, 32).toString('ascii');
            if (firstLine.startsWith('HTTP/1.1 101') || firstLine.startsWith('HTTP/1.0 101')) {
              handshakeComplete = true;
            }
            if (!socket.destroyed) socket.write(firstChunk);
            if (!socket.destroyed && !upstream.destroyed) upstream.pipe(socket);
          });

          upstream.on('data', () => {
            tunnel.lastDataFromUpstreamAt = Date.now();
          });

          socket.pipe(upstream);

          socket.on('error', cleanup);
          socket.on('close', cleanup);
          upstream.on('error', cleanup);
          upstream.on('close', cleanup);
        });

        socket.on('error', () => upstream.destroy());
      });

      // ── Tunnel health scan ────────────────────────────────────────────────
      // Periodically reaps zombie tunnels whose sockets closed without firing
      // the cleanup() handler (e.g. abrupt process kills bypassing close events).
      // Complements TCP keepalive with an application-level liveness check.
      const healthScanTimer = setInterval(() => {
        for (const [id, tunnel] of wsActiveTunnels) {
          if (tunnel.clientSocket.destroyed || tunnel.upstreamSocket.destroyed) {
            wsActiveTunnels.delete(id);
          }
        }
      }, WS_TUNNEL_SCAN_INTERVAL_MS);
      healthScanTimer.unref();

      // ── Graceful shutdown ─────────────────────────────────────────────────
      // Sends RFC 6455 close frames to all active client sockets on server close
      // so browsers auto-reconnect without a full page reload after HMR restarts.
      proxyServer.once('close', () => {
        clearInterval(healthScanTimer);
        for (const tunnel of wsActiveTunnels.values()) {
          if (!tunnel.clientSocket.destroyed) {
            try {
              tunnel.clientSocket.write(WS_CLOSE_GOING_AWAY);
              tunnel.clientSocket.end();
            } catch {
              tunnel.clientSocket.destroy();
            }
          }
          if (!tunnel.upstreamSocket.destroyed) tunnel.upstreamSocket.destroy();
          wsActiveTunnels.delete(tunnel.id);
        }
      });
    },
  };
}
