/**
 * Readiness probe for the Temporal Frontend.
 *
 * The worker entrypoints call `waitForTemporalReady()` before bootstrapping
 * so that when the worker service is configured with `autoStart = true`
 * (and the Temporal server may come up shortly after — sidecar, dev CLI,
 * staged rollout, etc.) the worker waits for connectivity instead of
 * crash-looping.
 *
 * The probe opens a plain TCP connection to the configured `host:port`.
 * The Temporal Frontend listens for gRPC on this socket; a successful
 * TCP handshake is a sufficient liveness signal — the subsequent
 * `NativeConnection.connect()` call surfaces any auth/protocol issues.
 */

import net from "node:net";

/**
 * Coerce an env var to a finite, non-negative number. Returns `fallback` for
 * undefined/empty/NaN/negative values so a malformed override can never be
 * read as `NaN` (which would be neither nullish nor finite and could disable
 * the readiness deadline entirely).
 */
export function parseTimeoutEnv(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

export interface WaitForTemporalOptions {
  /** host:port string (e.g. "localhost:7233"). */
  endpoint: string;
  /** Per-attempt TCP connect timeout. Default: 2_000ms. */
  attemptTimeoutMs?: number;
  /** Sleep between attempts. Default: 2_000ms. */
  intervalMs?: number;
  /** Total time to wait before giving up. Default: 5 minutes. 0 = wait forever. */
  totalTimeoutMs?: number;
  /** Logger; defaults to console.log/console.warn. */
  log?: (msg: string) => void;
}

function parseEndpoint(endpoint: string): { host: string; port: number } {
  // Strip an optional scheme, then split host:port.
  const stripped = endpoint.replace(/^[a-z]+:\/\//i, "");
  const idx = stripped.lastIndexOf(":");
  if (idx === -1) {
    throw new Error(`Invalid Temporal endpoint "${endpoint}" — expected host:port`);
  }
  const host = stripped.slice(0, idx);
  const port = Number(stripped.slice(idx + 1));
  if (!host || !Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid Temporal endpoint "${endpoint}" — expected host:port`);
  }
  return { host, port };
}

function tryConnectOnce(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
    socket.connect(port, host);
  });
}

/**
 * Resolves when a TCP handshake to the Temporal Frontend succeeds.
 * Throws if `totalTimeoutMs` elapses without success.
 */
export async function waitForTemporalReady(opts: WaitForTemporalOptions): Promise<void> {
  const attemptTimeoutMs = opts.attemptTimeoutMs ?? 2_000;
  const intervalMs = opts.intervalMs ?? 2_000;
  const totalTimeoutMs = opts.totalTimeoutMs ?? 5 * 60 * 1_000;
  const log = opts.log ?? ((m: string) => console.log(m));

  const { host, port } = parseEndpoint(opts.endpoint);
  const startedAt = Date.now();
  let attempt = 0;
  let lastLogAt = 0;

  log(
    `[temporal-readiness] waiting for Temporal Frontend at ${host}:${port} ` +
      `(attemptTimeout=${attemptTimeoutMs}ms interval=${intervalMs}ms ` +
      `totalTimeout=${totalTimeoutMs === 0 ? "∞" : `${totalTimeoutMs}ms`})`,
  );

  for (;;) {
    attempt += 1;
    const ok = await tryConnectOnce(host, port, attemptTimeoutMs);
    if (ok) {
      log(
        `[temporal-readiness] reachable at ${host}:${port} after ` +
          `${attempt} attempt(s) / ${Date.now() - startedAt}ms`,
      );
      return;
    }

    const elapsed = Date.now() - startedAt;
    if (totalTimeoutMs > 0 && elapsed + intervalMs > totalTimeoutMs) {
      throw new Error(
        `Temporal Frontend at ${host}:${port} not reachable within ${totalTimeoutMs}ms ` +
          `(${attempt} attempt(s))`,
      );
    }

    // Throttle log noise — print every ~30s while waiting.
    if (Date.now() - lastLogAt >= 30_000) {
      log(
        `[temporal-readiness] still waiting for ${host}:${port} ` +
          `(attempt=${attempt} elapsed=${elapsed}ms)`,
      );
      lastLogAt = Date.now();
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
