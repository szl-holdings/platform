/**
 * Shared proxy + health check server for the mobile artifact.
 * Runs on port 9090 (reusePort) alongside other Vite dev servers.
 * Properly routes requests to the correct upstream Vite server by path prefix,
 * instead of the previous naive TCP responder that returned "OK" for everything
 * and caused MIME-type failures for JavaScript module scripts.
 */
"use strict";
const http = require("http");

const PROXY_ROUTES = [
  { prefix: "/aegis/", port: 3000 },
  { prefix: "/firestorm/", port: 23931 },
  { prefix: "/carlota-jo/", port: 3101 },
  { prefix: "/command/", port: 3102 },
  { prefix: "/terra/", port: 6099 },
  { prefix: "/vessels/", port: 6899 },
  { prefix: "/pulse/", port: 5201 },
];

const EXPO_PORT = Number(process.env.EXPO_PORT) || 8085;

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  if (url === "/" || url === "/health" || url === "/__health") {
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
