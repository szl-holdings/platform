import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isDev = process.env.NODE_ENV !== "production";
const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS ?? "500", 10);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DB_POOL_MIN ?? "2", 10),
  max: parseInt(process.env.DB_POOL_MAX ?? "10", 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS ?? "30000", 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS ?? "5000", 10),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS ?? "30000", 10),
});

if (isDev) {
  pool.on("connect", () => {
    if (process.env.LOG_LEVEL === "debug") {
      console.log("[db] New connection established");
    }
  });

  pool.on("error", (err) => {
    console.error("[db] Pool error:", err.message);
  });
}

export const db = drizzle(pool, {
  schema,
  logger: isDev
    ? {
        logQuery(query: string, params: unknown[]) {
          const start = Date.now();
          setImmediate(() => {
            const elapsed = Date.now() - start;
            if (elapsed >= SLOW_QUERY_THRESHOLD_MS) {
              console.warn(`[db] SLOW QUERY (${elapsed}ms):`, query.slice(0, 200));
            } else if (process.env.LOG_LEVEL === "debug") {
              console.log(`[db] Query (${elapsed}ms):`, query.slice(0, 200));
            }
          });
        },
      }
    : false,
});

export * from "./schema";
