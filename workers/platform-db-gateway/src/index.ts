/**
 * platform-db-gateway — Worker entry. Read-only health surface for now; app
 * routes add their own queries through `withDb`. Reached only via a service
 * binding (no workers.dev, no routes), so it never exposes data publicly.
 */
import { DatabaseConfigError, type DbEnv, type SqlFactory, withDb } from "./db.ts";

export interface Env extends DbEnv {
  SZL_ENV?: string;
}

interface Ctx { waitUntil(p: Promise<unknown>): void }

export async function handle(request: Request, env: Env, ctx?: Ctx, factory?: SqlFactory): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET") return new Response("method not allowed", { status: 405 });
  if (url.pathname === "/healthz") return Response.json({ ok: true });
  if (url.pathname === "/db/health") {
    try {
      const row = await withDb(env, async (sql) => {
        const [r] = await sql`select current_setting('server_version') as server_version,
          current_setting('transaction_read_only') as read_only, now() as db_now`;
        return r;
      }, { factory, waitUntil: ctx ? (p) => ctx.waitUntil(p) : undefined });
      return Response.json({ ok: true, via: "hyperdrive", server_version: row.server_version, read_only: row.read_only, db_now: row.db_now });
    } catch (err) {
      const status = err instanceof DatabaseConfigError ? 503 : 502;
      // never echo driver errors: they can include host names
      return Response.json({ ok: false, error: err instanceof DatabaseConfigError ? err.message : "database unavailable" }, { status });
    }
  }
  return new Response("not found", { status: 404 });
}

export default {
  fetch: (request: Request, env: Env, ctx: Ctx) => handle(request, env, ctx),
};
