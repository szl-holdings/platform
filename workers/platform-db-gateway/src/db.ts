/**
 * Data-access path for Workers: postgres.js over Cloudflare Hyperdrive.
 *
 * - Hyperdrive owns the connection pool, so a client per request is cheap and
 *   recommended; `max: 5` stays under the Workers concurrent-connection limit.
 * - `prepare: true` (never false) so Hyperdrive's transaction-mode pool can
 *   cache prepared statements; `fetch_types: false` saves a round-trip.
 * - Fails closed: no binding or a non-Postgres connection string throws
 *   DatabaseConfigError. There is no in-memory or SQLite fallback.
 * - Session-level state (SET, advisory locks, LISTEN, temp tables) does not
 *   survive Hyperdrive's transaction pooling. Wrap multi-statement work in
 *   `sql.begin(...)`. Migrations never run here: they use the DIRECT URL.
 */
import postgres from "postgres";

export interface HyperdriveBinding {
  connectionString: string;
}

export interface DbEnv {
  HYPERDRIVE?: HyperdriveBinding;
}

export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

export type Sql = ReturnType<typeof postgres>;
export type SqlFactory = (connectionString: string, options: postgres.Options<Record<string, postgres.PostgresType>>) => Sql;

export const CLIENT_OPTIONS = {
  max: 5,
  fetch_types: false,
  prepare: true,
  idle_timeout: 10,
  connect_timeout: 10,
} as const;

export function connectionStringFrom(env: DbEnv): string {
  const cs = env.HYPERDRIVE?.connectionString;
  if (!cs || !cs.trim()) throw new DatabaseConfigError("HYPERDRIVE binding is missing; refusing to run without the Platform Postgres");
  if (!/^postgres(ql)?:\/\//i.test(cs)) throw new DatabaseConfigError("HYPERDRIVE connectionString is not a PostgreSQL URL");
  return cs;
}

/** Run `fn` with a per-request client and always release it (ctx.waitUntil when given). */
export async function withDb<T>(
  env: DbEnv,
  fn: (sql: Sql) => Promise<T>,
  opts: { factory?: SqlFactory; waitUntil?: (p: Promise<unknown>) => void } = {},
): Promise<T> {
  const factory = opts.factory ?? (postgres as unknown as SqlFactory);
  const sql = factory(connectionStringFrom(env), { ...CLIENT_OPTIONS });
  try {
    return await fn(sql);
  } finally {
    const closing = sql.end({ timeout: 5 });
    if (opts.waitUntil) opts.waitUntil(closing);
    else await closing;
  }
}
