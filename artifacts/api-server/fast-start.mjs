import http from "node:http";

const port = parseInt(process.env.PORT || "8080", 10);
process.env.__FAST_START_SERVER = "1";

let appHandler = (_req, res) => {
  res.writeHead(503, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "starting", message: "API server is initializing" }));
};

const server = http.createServer((req, res) => appHandler(req, res));

server.listen(port, "0.0.0.0", async () => {
  console.log(`  ➜  Local:   http://localhost:${port}/`);
  console.log(`  ➜  Network: http://0.0.0.0:${port}/`);

  try {
    const mod = await import("./dist/index.mjs");
    const handler = await mod.bootstrap(server, port);
    appHandler = handler;
    console.log(`[api-server] Fully ready on port ${port}`);
  } catch (err) {
    console.error("[api-server] Fatal:", err);
    process.exit(1);
  }
});
