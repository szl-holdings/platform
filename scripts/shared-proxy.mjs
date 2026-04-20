/**
 * Standalone shared routing gateway.
 *
 * Listens on port 9090 and forwards every incoming request (HTTP + WebSocket
 * upgrade) to the appropriate per-artifact Vite dev server based on the URL
 * prefix declared in `packages/proxy-routes.ts`. Unknown prefixes go to the
 * canonical fallback (the artifact mounted at "/").
 *
 * This used to live inside `artifacts/command/vite.config.ts` (`sharedProxyPlugin`
 * + an eager-bind block at module load time). That made all proxied routes
 * (Terra, Vessels, Carlota Jo, Pulse, ...) go down whenever the Command
 * workflow crashed or restarted. Running the gateway as its own workflow
 * lets routing survive restarts of any individual artifact.
 *
 * Routes are parsed out of the canonical `proxy-routes.ts` so this script
 * stays a dependency-free Node module (no TS toolchain required).
 */
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHARED_PROXY_PORT = 9090;
const CANONICAL_ROUTES_PATH = path.resolve(__dirname, '../packages/proxy-routes.ts');

function loadProxyRoutes() {
  const source = fs.readFileSync(CANONICAL_ROUTES_PATH, 'utf8');
  const entryRegex = /\{\s*prefix:\s*['"]([^'"]+)['"]\s*,\s*port:\s*(\d+)\s*\}/g;
  const routes = [];
  let match;
  while ((match = entryRegex.exec(source)) !== null) {
    routes.push({ prefix: match[1], port: Number(match[2]) });
  }
  if (routes.length === 0) {
    throw new Error('[shared-proxy] Failed to parse any routes from ' + CANONICAL_ROUTES_PATH);
  }
  return routes;
}

function loadFallbackPort() {
  const source = fs.readFileSync(CANONICAL_ROUTES_PATH, 'utf8');
  const m = source.match(/CANONICAL_FALLBACK_PORT\s*=\s*(\d+)/);
  if (!m) {
    throw new Error(
      '[shared-proxy] Failed to parse CANONICAL_FALLBACK_PORT from ' + CANONICAL_ROUTES_PATH,
    );
  }
  return Number(m[1]);
}

const PROXY_ROUTES = loadProxyRoutes();
const CANONICAL_FALLBACK_PORT = loadFallbackPort();

const REQUIRED_PREFIXES = ['/aegis/', '/command/', '/vessels/'];
const missing = REQUIRED_PREFIXES.filter((p) => !PROXY_ROUTES.some((r) => r.prefix === p));
if (missing.length > 0) {
  throw new Error(
    '[shared-proxy] Canonical proxy-routes.ts is missing required prefixes: ' +
      missing.join(', ') +
      '. The parser in this script may be out of date.',
  );
}

console.log(
  '[shared-proxy] Loaded ' +
    PROXY_ROUTES.length +
    ' proxy routes (fallback port ' +
    CANONICAL_FALLBACK_PORT +
    ')',
);

function pickTargetPort(url) {
  const normalizedUrl = url.endsWith('/') ? url : url + '/';
  const route = PROXY_ROUTES.find((r) => normalizedUrl.startsWith(r.prefix));
  return route ? route.port : CANONICAL_FALLBACK_PORT;
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  if (url === '/__health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  const targetPort = pickTargetPort(url);
  const upstream = http.request(
    {
      hostname: '127.0.0.1',
      port: targetPort,
      path: url,
      method: req.method,
      headers: { ...req.headers, host: 'localhost:' + targetPort },
    },
    (upRes) => {
      res.writeHead(upRes.statusCode || 200, upRes.headers);
      upRes.pipe(res, { end: true });
    },
  );
  upstream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Upstream not ready on port ' + targetPort);
    }
  });
  req.pipe(upstream, { end: true });
});

server.on('upgrade', (req, socket, head) => {
  const url = req.url || '/';
  const targetPort = pickTargetPort(url);
  const conn = net.connect(targetPort, '127.0.0.1', () => {
    const rawHeaders = Object.entries(req.headers)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\r\n');
    conn.write(`${req.method} ${url} HTTP/1.1\r\n${rawHeaders}\r\n\r\n`);
    if (head && head.length) conn.write(head);
    socket.pipe(conn);
    conn.pipe(socket);
  });
  conn.on('error', () => socket.destroy());
  socket.on('error', () => conn.destroy());
});

server.on('error', (err) => {
  console.warn('[shared-proxy] Server error:', err.code || err.message);
});

server.listen({ port: SHARED_PROXY_PORT, host: '::', reusePort: true }, () => {
  console.log(
    '[shared-proxy] Listening on port ' +
      SHARED_PROXY_PORT +
      ' (reusePort, dual-stack, standalone)',
  );
});
