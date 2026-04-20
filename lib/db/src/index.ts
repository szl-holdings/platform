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

export * from "./schema";
