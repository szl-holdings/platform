import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { getEnv } from "@szl-holdings/env";
import * as schema from "./schema";

const { Pool } = pg;

const _env = getEnv();

if (!_env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isDev = _env.NODE_ENV !== "production";
const SLOW_QUERY_THRESHOLD_MS = _env.SLOW_QUERY_THRESHOLD_MS;
const CHECKOUT_WARN_THRESHOLD_MS = _env.DB_CHECKOUT_WARN_THRESHOLD_MS;

export const PgPool = Pool;
export const PgClient = pg.Client;
export { drizzle as drizzleConnect } from "drizzle-orm/node-postgres";

export const pool = new Pool({
  connectionString: _env.DATABASE_URL,
  min: _env.DB_POOL_MIN,
  max: _env.DB_POOL_MAX,
  idleTimeoutMillis: _env.DB_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: _env.DB_CONNECT_TIMEOUT_MS,
  statement_timeout: _env.DB_STATEMENT_TIMEOUT_MS,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});

// ─────────────────────────────────────────────────────────────────────────
// Dedicated, small pool reserved for liveness/readiness probes.
//
// The main pool can be saturated by scheduled-job fan-out or long-running
// transactions; when that happens, /api/health used to wait
// `DB_CONNECT_TIMEOUT_MS` (default 90s) for a connection and timed out.
// Routing health probes to their own pool keeps the probe latency
// independent of main-pool pressure: the pool is tiny (max 2), idle
// connections release quickly, and acquisition fails fast (≤1s) so a
// degraded probe surfaces immediately instead of blocking the request
// thread for tens of seconds. Because it uses the same DATABASE_URL it
// only adds 1–2 connections at the Postgres level, well within the
// per-instance budget.
// ─────────────────────────────────────────────────────────────────────────
export const healthPool = new Pool({
  connectionString: _env.DATABASE_URL,
  min: 0,
  max: 2,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 1_000,
  statement_timeout: 2_000,
});

healthPool.on("error", (_err) => {
  if (isDev) {
  }
});

const _originalPoolQuery = pool.query.bind(pool);
// @ts-expect-error — overriding overloaded pool.query to intercept all queries for latency instrumentation
pool.query = async function instrumentedQuery(...args: unknown[]) {
  const start = Date.now();
  try {
    // @ts-expect-error — forwarding all overload variants
    const result = await _originalPoolQuery(...args);
    const durationMs = Date.now() - start;
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      const obs = await (new Function('m', 'return import(m)'))("@szl-holdings/observability") as { serverTelemetry?: { recordDbQueryLatency?: (ms: number, q?: string) => void } };
      const queryText = typeof args[0] === "string" ? args[0] : (args[0] as { text?: string })?.text;
      obs.serverTelemetry?.recordDbQueryLatency?.(durationMs, queryText);
    } catch {
      // observability not available — not fatal
    }
    return result;
  } catch (err) {
    const durationMs = Date.now() - start;
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      const obs = await (new Function('m', 'return import(m)'))("@szl-holdings/observability") as { serverTelemetry?: { recordDbQueryLatency?: (ms: number, q?: string) => void } };
      const queryText = typeof args[0] === "string" ? args[0] : (args[0] as { text?: string })?.text;
      obs.serverTelemetry?.recordDbQueryLatency?.(durationMs, queryText);
    } catch {
      // observability not available — not fatal
    }
    throw err;
  }
};

pool.on("connect", () => {
  if (isDev && _env.LOG_LEVEL === "debug") {
  }
});

pool.on("error", (_err) => {
  if (isDev) {
  }
});

export const db = drizzle(pool, {
  schema,
  logger: isDev
    ? {
        logQuery(_query: string, _params: unknown[]) {
          if (_env.LOG_LEVEL === "debug") {
          }
        },
      }
    : false,
});

void SLOW_QUERY_THRESHOLD_MS;

// ─────────────────────────────────────────────────────────────────────────
// OBS-007 follow-on: per-checkout leak detection.
//
// `pool.query()` checks out → uses → releases a connection in one call,
// so it is self-cleaning and not the source of leaks. Leaks come from
// callers that do `pool.connect()` and forget to call `client.release()`,
// or hold a client open across a long-running transaction. We wrap
// `pool.connect` to track the lifetime of each checkout, log a structured
// warning the first time a checkout crosses the configured threshold,
// and expose `getLongRunningCheckouts()` so the self-monitor can surface
// a signal in its cycle.
// ─────────────────────────────────────────────────────────────────────────

interface CheckoutRecord {
  id: number;
  // Wall-clock at which the caller invoked pool.connect() (BEFORE awaiting).
  // Used to compute pool-queue wait time; NOT used for the OBS-007 "held"
  // threshold so wait-on-saturated-pool does not produce a false leak alert.
  requestedAt: number;
  // Wall-clock at which pg actually handed us a usable client (AFTER await).
  // This is what counts as "the client was checked out" — the OBS-007 hold
  // threshold and the warn payload's "held" message both key off this.
  acquiredAt: number;
  stack: string;
  warned: boolean;
}

const activeCheckouts = new Map<number, CheckoutRecord>();
let nextCheckoutId = 1;

function captureStack(): string {
  const err = new Error("db pool checkout");
  Error.captureStackTrace?.(err, captureStack);
  // Drop the leading "Error: ..." line and trim the first few frames so the
  // trace points at the originating route/handler, not this wrapper file.
  //
  // IMPORTANT: this function MUST be called synchronously from
  // `instrumentedConnect` BEFORE the `await _originalPoolConnect()`. Once
  // execution crosses that await, the synchronous call chain is unwound
  // and Error.captureStackTrace can only see internal Node frames
  // (`processTicksAndRejections`), which is why earlier OBS-007 warnings
  // showed no useful caller. Capturing on the call-side preserves the
  // route/handler/init frame that actually opened the checkout.
  const lines = (err.stack ?? "").split("\n").slice(1);
  return lines
    .filter(
      (l) =>
        !l.includes("/lib/db/src/index") &&
        !l.includes("instrumentedConnect") &&
        !l.includes("captureStack"),
    )
    .slice(0, 12)
    .join("\n");
}

export interface LongCheckoutInfo {
  id: number;
  /** Time the client has actually been held since pg handed it over. */
  ageMs: number;
  /** Time the caller spent waiting in the pool queue before acquisition. */
  waitMs: number;
  acquiredAt: string;
  stack: string;
}

export function getLongRunningCheckouts(
  thresholdMs: number = CHECKOUT_WARN_THRESHOLD_MS,
): LongCheckoutInfo[] {
  const now = Date.now();
  const out: LongCheckoutInfo[] = [];
  for (const rec of activeCheckouts.values()) {
    const ageMs = now - rec.acquiredAt;
    if (ageMs >= thresholdMs) {
      out.push({
        id: rec.id,
        ageMs,
        waitMs: rec.acquiredAt - rec.requestedAt,
        acquiredAt: new Date(rec.acquiredAt).toISOString(),
        stack: rec.stack,
      });
    }
  }
  return out.sort((a, b) => b.ageMs - a.ageMs);
}

export function getCheckoutWarnThresholdMs(): number {
  return CHECKOUT_WARN_THRESHOLD_MS;
}

const _originalPoolConnect = pool.connect.bind(pool);

// ── OBS-007 / pool-query fix:
//
// pg-pool 3.x uses the CALLBACK form of pool.connect() inside pool.query().
// The original implementation was `async function instrumentedConnect()` which
// always returns a Promise and IGNORES any callback argument. When pg-pool's
// pool.query() calls `pool.connect(cb)` and the callback is never invoked,
// pool.query() hangs forever and the acquired connection is never released.
// This caused silent pool exhaustion (all max slots held by leaked connections)
// and then unhandled promise rejections (timeout errors from instrumentedConnect's
// own _originalPoolConnect() call whose Promise had no rejection handler).
//
// Fix: detect the callback form and call cb(null, client) / cb(err) ourselves,
// returning void (which pg-pool expects). The Promise form (used by drizzle and
// explicit `await pool.connect()` callers) is handled by returning a Promise.
type PoolConnectCb = (err: Error | null, client?: pg.PoolClient, release?: (err?: Error | boolean) => void) => void;

function _wrapClient(rawClient: pg.PoolClient, requestedAt: number, stack: string): pg.PoolClient {
  const acquiredAt = Date.now();
  const id = nextCheckoutId++;
  // The OBS-007 "held" semantics measure time AFTER pg handed us a usable
  // client — pool-queue wait time is reported separately as waitMs.
  const record: CheckoutRecord = { id, requestedAt, acquiredAt, stack, warned: false };
  activeCheckouts.set(id, record);
  const _originalRelease = rawClient.release.bind(rawClient);
  rawClient.release = ((err?: Error | boolean) => {
    activeCheckouts.delete(id);
    return _originalRelease(err);
  }) as typeof rawClient.release;
  return rawClient;
}

(pool as unknown as { connect: ((cb?: PoolConnectCb) => Promise<pg.PoolClient> | void) }).connect = function instrumentedConnect(cb?: PoolConnectCb): Promise<pg.PoolClient> | void {
  // OBS-007: capture originating stack synchronously before any async boundary.
  const stack = captureStack();
  const requestedAt = Date.now();

  if (cb) {
    // ── Callback form: called by pg-pool's pool.query() internally.
    // We must invoke cb(null, client, release) on success and cb(err) on failure.
    // Returning void (not a Promise) matches pg-pool's callback-form expectations.
    (_originalPoolConnect() as Promise<pg.PoolClient>)
      .then((rawClient) => {
        const wrapped = _wrapClient(rawClient, requestedAt, stack);
        cb(null, wrapped, wrapped.release);
      })
      .catch((err: Error) => {
        cb(err);
      });
    return;
  }

  // ── Promise form: called by drizzle-orm and explicit `await pool.connect()`.
  return (_originalPoolConnect() as Promise<pg.PoolClient>)
    .then((rawClient) => _wrapClient(rawClient, requestedAt, stack));
};

// Background sweeper — every 5s, log a structured warning for any
// checkout that has just crossed the threshold. We only warn once per
// checkout so a stuck client doesn't spam logs every cycle, but we keep
// it visible to the self-monitor via getLongRunningCheckouts() until
// it's released. Disabled under NODE_ENV=test so the test runner output
// stays clean — tracking + getLongRunningCheckouts() still work for any
// test that wants to assert on the behaviour directly.
const _sweeperEnabled = _env.NODE_ENV !== "test";
const _sweeperInterval = _sweeperEnabled ? setInterval(() => {
  if (activeCheckouts.size === 0) return;
  const now = Date.now();
  for (const rec of activeCheckouts.values()) {
    const ageMs = now - rec.acquiredAt;
    if (!rec.warned && ageMs >= CHECKOUT_WARN_THRESHOLD_MS) {
      rec.warned = true;
      const waitMs = rec.acquiredAt - rec.requestedAt;
      const _payload = {
        level: "warn",
        event: "db.pool.checkout.long",
        obsRef: "OBS-007",
        checkoutId: rec.id,
        // ageMs measures only "held since acquisition" — pool-queue wait
        // time is reported separately as waitMs. See instrumentedConnect
        // for the rationale (avoids false leak alerts under contention).
        ageMs,
        waitMs,
        thresholdMs: CHECKOUT_WARN_THRESHOLD_MS,
        acquiredAt: new Date(rec.acquiredAt).toISOString(),
        stack: rec.stack,
        message: `[db] Pool checkout #${rec.id} held ${ageMs}ms (> ${CHECKOUT_WARN_THRESHOLD_MS}ms threshold; waited ${waitMs}ms in pool queue before acquisition) — possible client leak or long-running transaction`,
      };
    }
  }
}, 5_000) : null;
_sweeperInterval?.unref?.();

export * from "./schema";
