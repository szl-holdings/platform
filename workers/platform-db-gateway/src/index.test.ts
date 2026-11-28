import assert from "node:assert/strict";
import { test } from "node:test";
import { CLIENT_OPTIONS, connectionStringFrom, DatabaseConfigError } from "./db.ts";
import { handle } from "./index.ts";

function fakeFactory(rows: Record<string, unknown>[], seen: { cs?: string; opts?: unknown; ended?: boolean }) {
  return ((cs: string, opts: unknown) => {
    seen.cs = cs; seen.opts = opts;
    const sql = (async () => rows) as unknown as Record<string, unknown>;
    sql.end = async () => { seen.ended = true; };
    return sql;
  }) as never;
}

test("missing or non-postgres Hyperdrive binding fails closed (503), no fallback", async () => {
  assert.throws(() => connectionStringFrom({}), DatabaseConfigError);
  assert.throws(() => connectionStringFrom({ HYPERDRIVE: { connectionString: "sqlite:///x" } }), DatabaseConfigError);
  const res = await handle(new Request("https://gw/db/health"), {});
  assert.equal(res.status, 503);
});

test("db health goes through the Hyperdrive connection string with Hyperdrive-safe options", async () => {
  const seen: { cs?: string; opts?: Record<string, unknown>; ended?: boolean } = {};
  const env = { HYPERDRIVE: { connectionString: "postgresql://app:x@hyperdrive.local:5432/platform" } };
  const res = await handle(new Request("https://gw/db/health"), env, undefined,
    fakeFactory([{ server_version: "18.7", read_only: "off", db_now: "2026-11-27T00:00:00Z" }], seen));
  assert.equal(res.status, 200);
  const body = await res.json() as Record<string, unknown>;
  assert.equal(body.via, "hyperdrive");
  assert.equal(seen.cs, env.HYPERDRIVE.connectionString);
  assert.deepEqual(seen.opts, { ...CLIENT_OPTIONS });
  assert.equal((seen.opts as Record<string, unknown>).prepare, true);
  assert.equal(seen.ended, true);
});

test("driver errors are not echoed to callers", async () => {
  const env = { HYPERDRIVE: { connectionString: "postgresql://app:x@secret-host.example/platform" } };
  const factory = (() => { const s = (async () => { throw new Error("connect ECONNREFUSED secret-host.example"); }) as unknown as Record<string, unknown>; s.end = async () => {}; return s; }) as never;
  const res = await handle(new Request("https://gw/db/health"), env, undefined, factory);
  assert.equal(res.status, 502);
  assert.ok(!(await res.text()).includes("secret-host"));
});

test("only GET, unknown paths 404", async () => {
  assert.equal((await handle(new Request("https://gw/db/health", { method: "POST" }), {})).status, 405);
  assert.equal((await handle(new Request("https://gw/x"), {})).status, 404);
});
