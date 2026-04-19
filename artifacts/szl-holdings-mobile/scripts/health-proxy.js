/**
 * Shared proxy + health check server for the mobile artifact.
 * Runs on port 9090 (reusePort) alongside other Vite dev servers.
 * Properly routes requests to the correct upstream Vite server by path prefix,
 * instead of the previous naive TCP responder that returned "OK" for everything
 * and caused MIME-type failures for JavaScript module scripts.
 *
 * Port values are sourced from the canonical `packages/proxy-routes.ts` at
 * startup so this script never drifts from the rest of the project. The file
 * is parsed with a small regex rather than imported so this module can stay a
 * dependency-free CommonJS script.
 */
"use strict";
const fs = require("fs");
const http = require("http");
const path = require("path");

const CANONICAL_ROUTES_PATH = path.resolve(
  __dirname,
  "../../../packages/proxy-routes.ts"
);

function loadProxyRoutes() {
  const source = fs.readFileSync(CANONICAL_ROUTES_PATH, "utf8");
  const entryRegex =
    /\{\s*prefix:\s*"([^"]+)"\s*,\s*port:\s*(\d+)\s*\}/g;
  const routes = [];
  let match;
  while ((match = entryRegex.exec(source)) !== null) {
    routes.push({ prefix: match[1], port: Number(match[2]) });
  }
  if (routes.length === 0) {
    throw new Error(
      "[health-proxy] Failed to parse any routes from " + CANONICAL_ROUTES_PATH
    );
  }
  return routes;
}

const PROXY_ROUTES = loadProxyRoutes();

// Sanity check: a few prefixes are critical to the mobile dev experience.
// If the canonical file is reformatted in a way the regex above can no longer
// understand (e.g. single-quoted strings, key reordering, computed values),
// fail loudly at startup instead of silently routing to the Expo fallback.
const REQUIRED_PREFIXES = ["/aegis/", "/command/", "/vessels/"];
const missing = REQUIRED_PREFIXES.filter(
  (p) => !PROXY_ROUTES.some((r) => r.prefix === p)
);
if (missing.length > 0) {
  throw new Error(
    "[health-proxy] Canonical proxy-routes.ts is missing required prefixes: " +
      missing.join(", ") +
      ". The parser in this script may be out of date."
  );
}

console.log(
  "[health-proxy] Loaded " +
    PROXY_ROUTES.length +
    " proxy routes from packages/proxy-routes.ts"
);

const EXPO_PORT = Number(process.env.EXPO_PORT) || 8085;

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  if (url === "/__health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }
  const normalizedUrl = url.endsWith("/") ? url : url + "/";
  const route = PROXY_ROUTES.find((r) => normalizedUrl.startsWith(r.prefix));
  const targetPort = route ? route.port : EXPO_PORT;
  const upstream = http.request(
    {
      hostname: "127.0.0.1",
      port: targetPort,
      path: url,
      method: req.method,
      headers: { ...req.headers, host: "localhost:" + targetPort },
    },
    (upRes) => {
      res.writeHead(upRes.statusCode || 200, upRes.headers);
      upRes.pipe(res, { end: true });
    }
  );
  upstream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(503, { "Content-Type": "text/plain" });
      res.end("Upstream not ready on port " + targetPort);
    }
  });
  req.pipe(upstream, { end: true });
});

server.listen({ port: 9090, host: "0.0.0.0", reusePort: true }, () => {
  console.log("[health-proxy] Listening on port 9090 (reusePort)");
});
server.on("error", (e) => {
  console.warn("[health-proxy] Port 9090 bind error:", e.code);
});
