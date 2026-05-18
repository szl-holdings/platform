/**
 * Local Temporal dev server bring-up for the workspace.
 *
 * Boots the Temporal CLI dev server (downloaded + cached by
 * `@temporalio/testing` on first run) bound to `127.0.0.1:7233`,
 * so the `temporal-worker` and `temporal-approval-worker` services
 * have a Frontend to connect to in dev. The server stays up until
 * SIGTERM/SIGINT, at which point it is torn down cleanly.
 *
 * Run with:
 *   pnpm --filter @szl-holdings/temporal-tests run dev:server
 *
 * Env:
 *   TEMPORAL_DEV_PORT       Frontend gRPC port (default 7233)
 *   TEMPORAL_DEV_UI_PORT    Optional UI port; if set, UI is enabled
 *   TEMPORAL_DEV_NAMESPACE  Namespace to pre-create (default "default")
 *   TEMPORAL_DEV_IP         Bind IP (default 127.0.0.1)
 *   TEMPORAL_DEV_DB         Optional sqlite file for persistence
 *                           (default in-memory; data is lost on restart)
 */

import http from "node:http";
import { TestWorkflowEnvironment } from "@temporalio/testing";

const PORT = Number(process.env.TEMPORAL_DEV_PORT ?? 7233);
const IP = process.env.TEMPORAL_DEV_IP ?? "127.0.0.1";
const NAMESPACE = process.env.TEMPORAL_DEV_NAMESPACE ?? "default";
const UI_PORT_RAW = process.env.TEMPORAL_DEV_UI_PORT;
const UI_PORT = UI_PORT_RAW ? Number(UI_PORT_RAW) : undefined;
const DB_FILE = process.env.TEMPORAL_DEV_DB || undefined;
// HTTP health port used by the Replit workflow port-probe (which expects an
// HTTP service). The Temporal Frontend itself speaks gRPC on PORT (7233).
const HEALTH_PORT = Number(process.env.PORT ?? 7234);

async function main() {
  const started = Date.now();

  // Open the HTTP health port FIRST so the Replit workflow port-probe sees
  // the service as "up" while the Temporal CLI dev server (which may need
  // to download its binary on first run) finishes booting in the background.
  let temporalReady = false;
  let temporalAddress = `${IP}:${PORT}`;
  const health = http.createServer((req, res) => {
    if (req.url === "/healthz" || req.url === "/" || req.url === "/readyz") {
      res.writeHead(temporalReady ? 200 : 503, {
        "content-type": "application/json",
      });
      res.end(
        JSON.stringify({
          status: temporalReady ? "ok" : "starting",
          temporalEndpoint: temporalAddress,
          namespace: NAMESPACE,
        }),
      );
      return;
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });
  await new Promise<void>((resolve, reject) => {
    health.once("error", reject);
    health.listen(HEALTH_PORT, "0.0.0.0", () => {
      health.removeListener("error", reject);
      resolve();
    });
  });
  console.log(
    `[temporal-dev-server] HTTP health on http://0.0.0.0:${HEALTH_PORT}/healthz`,
  );

  console.log(
    `[temporal-dev-server] starting Temporal dev server on ${IP}:${PORT} ` +
      `(namespace="${NAMESPACE}"${UI_PORT ? ` ui=${IP}:${UI_PORT}` : ""}` +
      `${DB_FILE ? ` db=${DB_FILE}` : " in-memory"})`,
  );

  let env: TestWorkflowEnvironment;
  try {
    env = await TestWorkflowEnvironment.createLocal({
      server: {
        ip: IP,
        port: PORT,
        namespace: NAMESPACE,
        ui: UI_PORT !== undefined,
        ...(UI_PORT !== undefined ? { uiPort: UI_PORT } : {}),
        ...(DB_FILE ? { dbFilename: DB_FILE } : {}),
      },
    });
  } catch (err) {
    console.error(
      "[temporal-dev-server] FATAL: failed to start dev server",
      err instanceof Error ? { message: err.message, stack: err.stack } : err,
    );
    process.exit(1);
  }

  temporalAddress = env.address;
  temporalReady = true;
  console.log(
    `[temporal-dev-server] ready at ${env.address} after ${Date.now() - started}ms — ` +
      `TEMPORAL_ENDPOINT=${env.address} TEMPORAL_NAMESPACE=${NAMESPACE}`,
  );

  let shuttingDown = false;
  const stop = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[temporal-dev-server] received ${signal} — tearing down`);
    try {
      await env.teardown();
      console.log("[temporal-dev-server] shut down cleanly");
      process.exit(0);
    } catch (err) {
      console.error(
        "[temporal-dev-server] teardown error",
        err instanceof Error ? { message: err.message } : err,
      );
      process.exit(1);
    }
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);

  // Keep the event loop alive. The native ephemeral server holds a child
  // process; this interval is purely a belt-and-braces keepalive so Node
  // doesn't exit if every handle ever becomes unref'd.
  setInterval(() => {}, 1 << 30);
}

main();
