/**
 * Regression test for task #4971.
 *
 * The api-server must read its payload from the `@szl-holdings/payload`
 * workspace package (which resolves `packages/payload/raw/payload.json`),
 * NOT from a hardcoded `artifacts/api-server/raw/payload.json` path. An
 * earlier recovery added a symlink at `artifacts/api-server/raw ->
 * ../../packages/payload/raw`; that symlink has been removed and must not
 * silently come back via any consumer hardcoding the in-artifact path.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..", "..", "..", "..");
const API_SERVER_DIR = resolve(REPO_ROOT, "artifacts", "api-server");
const FORBIDDEN_RAW_DIR = resolve(API_SERVER_DIR, "raw");
const DIST_BUNDLE = resolve(API_SERVER_DIR, "dist", "index.mjs");

describe("api-server payload sourcing (task #4971)", () => {
  it("does not have an in-artifact raw/ directory or symlink", () => {
    expect(existsSync(FORBIDDEN_RAW_DIR)).toBe(false);
  });

  it("source code does not reference api-server/raw/payload.json", async () => {
    const { globSync } = await import("node:fs");
    const files = globSync("src/**/*.ts", { cwd: API_SERVER_DIR });
    const offenders: string[] = [];
    const SELF = __filename.replace(`${API_SERVER_DIR}/`, "");
    for (const rel of files) {
      if (rel === SELF) continue;
      const text = readFileSync(resolve(API_SERVER_DIR, rel), "utf8");
      // Reject any reference to the in-artifact raw/ tree. Comments that
      // mention the canonical `packages/payload/raw/payload.json` location are
      // fine; only the artifact-local `api-server/raw/` path is forbidden.
      if (
        text.includes("artifacts/api-server/raw/") ||
        text.includes("api-server/raw/payload.json")
      ) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("compiled bundle does not reference artifacts/api-server/raw/", () => {
    if (!existsSync(DIST_BUNDLE)) {
      // Bundle not built in this test invocation; skip.
      return;
    }
    const bundle = readFileSync(DIST_BUNDLE, "utf8");
    expect(bundle.includes("artifacts/api-server/raw/")).toBe(false);
  });
});
