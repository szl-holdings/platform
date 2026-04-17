import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTES_PATH = resolve(
  __dirname,
  "../../../../artifacts/api-server/src/routes/verifier.ts",
);

/**
 * Express matches routes in registration order. `/verifier/target/...`
 * MUST be registered BEFORE the `/verifier/:id` catch-all; otherwise the
 * `:id` parameter swallows the literal "target" segment and the
 * targets endpoint becomes unreachable. This is a regression that has
 * already happened once, so we lock the order in via a static check.
 */
describe("verifier route ordering", () => {
  const src = readFileSync(ROUTES_PATH, "utf8");

  it("registers /verifier/target/... before /verifier/:id", () => {
    const targetIdx = src.indexOf('router.get("/verifier/target/');
    const paramIdx = src.indexOf('router.get("/verifier/:id"');
    expect(targetIdx).toBeGreaterThan(-1);
    expect(paramIdx).toBeGreaterThan(-1);
    expect(targetIdx).toBeLessThan(paramIdx);
  });

  it("requires admin/super_admin for DELETE /verifier/:id", () => {
    expect(src).toMatch(/router\.delete\([\s\S]*"\/verifier\/:id"[\s\S]*requireRole\("admin",\s*"super_admin"\)/);
  });

  it("derives org scope on every read endpoint", () => {
    const matches = src.match(/resolveOrgScope\(req\)/g) ?? [];
    // GET list, GET target, GET :id, DELETE :id  →  4 call sites
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });

  it("returns 404 (not 403) on cross-org miss", () => {
    // sendNotFound rather than sendForbidden in the get/target/delete handlers.
    expect(src).not.toMatch(/sendForbidden/);
  });
});
