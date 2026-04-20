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
export { drizzle as drizzleConnect } from "drizzle-orm/node-postgres";

export const pool = new Pool({
  connectionString: _env.DATABASE_URL,
  min: _env.DB_POOL_MIN,
  max: _env.DB_POOL_MAX,
  idleTimeoutMillis: _env.DB_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: _env.DB_CONNECT_TIMEOUT_MS,
  statement_timeout: _env.DB_STATEMENT_TIMEOUT_MS,
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
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
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
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
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
    console.log("[db] New connection established");
  }
});

pool.on("error", (err) => {
  if (isDev) {
    console.error("[db] Pool error:", err.message);
  }
});

export const db = drizzle(pool, {
  schema,
  logger: isDev
    ? {
        logQuery(query: string, _params: unknown[]) {
          if (_env.LOG_LEVEL === "debug") {
            console.log(`[db] Query:`, query.slice(0, 200));
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
  const lines = (err.stack ?? "").split("\n").slice(1);
  return lines
    .filter((l) => !l.includes("/lib/db/src/index"))
    .slice(0, 12)
    .join("\n");
}

export interface LongCheckoutInfo {
  id: number;
  ageMs: number;
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
// Override the overloaded pool.connect (callback + promise variants) with a
// promise-only wrapper that records the checkout. Internal callers in this
// codebase always use the await form, so collapsing overloads is safe.
(pool as unknown as { connect: () => Promise<pg.PoolClient> }).connect = async function instrumentedConnect(): Promise<pg.PoolClient> {
  const client = (await _originalPoolConnect()) as pg.PoolClient;
  const id = nextCheckoutId++;
  const record: CheckoutRecord = {
    id,
    acquiredAt: Date.now(),
    stack: captureStack(),
    warned: false,
  };
  activeCheckouts.set(id, record);

  const _originalRelease = client.release.bind(client);
  client.release = ((err?: Error | boolean) => {
    activeCheckouts.delete(id);
    return _originalRelease(err);
  }) as typeof client.release;
  return client;
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
      const payload = {
        level: "warn",
        event: "db.pool.checkout.long",
        obsRef: "OBS-007",
        checkoutId: rec.id,
        ageMs,
        thresholdMs: CHECKOUT_WARN_THRESHOLD_MS,
        acquiredAt: new Date(rec.acquiredAt).toISOString(),
        stack: rec.stack,
        message: `[db] Pool checkout #${rec.id} held ${ageMs}ms (> ${CHECKOUT_WARN_THRESHOLD_MS}ms threshold) — possible client leak or long-running transaction`,
      };
      // Structured single-line JSON so log shippers / Pino sinks can index
      // the event without a custom parser.
      console.warn(JSON.stringify(payload));
    }
  }
}, 5_000) : null;
_sweeperInterval?.unref?.();

export * from "./schema";
