/**
 * Shared proxy + health check server for the mobile artifact.
 * Runs on port 9090 (reusePort) alongside other Vite dev servers.
 * Properly routes requests to the correct upstream Vite server by path prefix,
 * instead of the previous naive TCP responder that returned "OK" for everything
 * and caused MIME-type failures for JavaScript module scripts.
 *
 * Port values are sourced from the canonical
 * `packages/shared-proxy/src/index.ts` file at startup so this script never
 * drifts from the rest of the project. The file is parsed with small regexes
 * (port constants + route entries) rather than imported, so this module can
 * stay a dependency-free CommonJS script and survive monorepo restructuring.
 *
 * The previous shim `packages/proxy-routes.ts` is now a re-export and contains
 * no literal route table, which is why the older parser silently produced an
 * empty list. The parser below resolves named port constants AND numeric
 * literals, so it works whether routes are written as
 *   `{ prefix: '/aegis/', port: AEGIS_PORT }`  or
 *   `{ prefix: '/aegis/', port: 3002 }`.
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const CANONICAL_SHARED_PROXY = path.resolve(
  __dirname,
  '../../../packages/shared-proxy/src/index.ts',
);
const LEGACY_PROXY_ROUTES = path.resolve(__dirname, '../../../packages/proxy-routes.ts');

function readFirstExisting(paths) {
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return { path: p, source: fs.readFileSync(p, 'utf8') };
    }
  }
  throw new Error(
    `[health-proxy] Could not locate canonical proxy routes file. Tried: ${paths.join(', ')}`,
  );
}

function parsePortConstants(source) {
  // Match `export const FOO_PORT = 1234;` (export is optional, semicolon optional).
  const constants = {};
  const constRegex = /(?:export\s+)?const\s+([A-Z][A-Z0-9_]*_PORT)\s*=\s*(\d+)\s*;?/g;
  let match;
  while ((match = constRegex.exec(source)) !== null) {
    constants[match[1]] = Number(match[2]);
  }
  return constants;
}

function parseRouteEntries(source, constants) {
  // Match `{ prefix: '<...>', port: <NUMBER_OR_IDENT> }` allowing arbitrary
  // whitespace/newlines and either single or double quotes.
  const entryRegex =
    /\{\s*prefix\s*:\s*['"]([^'"]+)['"]\s*,\s*port\s*:\s*([A-Za-z_][A-Za-z0-9_]*|\d+)\s*\}/g;
  const routes = [];
  let match;
  while ((match = entryRegex.exec(source)) !== null) {
    const prefix = match[1];
    const portRaw = match[2];
    let port;
    if (/^\d+$/.test(portRaw)) {
      port = Number(portRaw);
    } else if (Object.prototype.hasOwnProperty.call(constants, portRaw)) {
      port = constants[portRaw];
    } else {
      // Skip entries where we cannot resolve the port — surfaced via the
      // REQUIRED_PREFIXES sanity check below if any critical route is lost.
      continue;
    }
    if (!Number.isFinite(port) || port <= 0) continue;
    routes.push({ prefix, port });
  }
  return routes;
}

function loadProxyRoutes() {
  const { path: filePath, source } = readFirstExisting([
    CANONICAL_SHARED_PROXY,
    LEGACY_PROXY_ROUTES,
  ]);
  const constants = parsePortConstants(source);
  const routes = parseRouteEntries(source, constants);
  if (routes.length === 0) {
    throw new Error(
      `[health-proxy] Failed to parse any routes from ${filePath}. Constants found: ` +
        `${Object.keys(constants).join(', ') || '<none>'}.`,
    );
  }
  return routes;
}

const PROXY_ROUTES = loadProxyRoutes();

// Sanity check: a few prefixes are critical to the mobile dev experience.
// If the canonical file is reformatted in a way the regex above can no longer
// understand (e.g. computed values, spread operators, helper-built tables),
// fail loudly at startup instead of silently routing to the Expo fallback.
const REQUIRED_PREFIXES = ['/a11oy/', '/command/', '/vessels/'];
const missing = REQUIRED_PREFIXES.filter((p) => !PROXY_ROUTES.some((r) => r.prefix === p));
if (missing.length > 0) {
  throw new Error(
    '[health-proxy] Canonical shared-proxy is missing required prefixes: ' +
      missing.join(', ') +
      '. The parser in this script may be out of date.',
  );
}

const EXPO_PORT = Number(process.env.EXPO_PORT) || 8085;

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  if (url === '/__health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  const normalizedUrl = url.endsWith('/') ? url : `${url}/`;
  const route = PROXY_ROUTES.find((r) => normalizedUrl.startsWith(r.prefix));
  const targetPort = route ? route.port : EXPO_PORT;
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

server.listen({ port: 9090, host: '0.0.0.0', reusePort: true }, () => {});
server.on('error', (_e) => {});
