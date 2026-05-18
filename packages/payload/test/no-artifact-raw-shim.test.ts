/**
 * Workspace-level regression guard for task #5033 (follow-up to #4971).
 *
 * Task #4971 fixed the api-server's bundled `@szl-holdings/payload/server`
 * resolver and added a per-artifact regression test asserting that the
 * api-server bundle and source never reference `artifacts/api-server/raw/`.
 *
 * The same hazard exists for any artifact that bundles the server entry of
 * `@szl-holdings/payload`: if its dist ends up next to a stray `raw/`
 * directory or symlink (e.g. a recovery shim pointing at
 * `packages/payload/raw`), the old "silent wrong-path payload" behavior
 * can silently re-appear.
 *
 * This test lifts that check up to the workspace level so it fires once
 * for every artifact, not just api-server.
 */

import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const ARTIFACTS_DIR = resolve(REPO_ROOT, "artifacts");

function listArtifacts(): string[] {
  if (!existsSync(ARTIFACTS_DIR)) return [];
  return readdirSync(ARTIFACTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

function listMjsBundles(distDir: string): string[] {
  if (!existsSync(distDir)) return [];
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(distDir, { withFileTypes: true, encoding: "utf8" });
  } catch {
    return [];
  }
  for (const entry of entries) {
    const full = join(distDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      out.push(...listMjsBundles(full));
    } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
      out.push(full);
    }
  }
  return out;
}

describe("workspace-wide payload sourcing (task #5033)", () => {
  it("no artifact has a stray raw/ directory or symlink", () => {
    const offenders: string[] = [];
    for (const name of listArtifacts()) {
      const rawPath = join(ARTIFACTS_DIR, name, "raw");
      let exists = false;
      try {
        // lstat so that a symlink registers even if its target is missing.
        lstatSync(rawPath);
        exists = true;
      } catch {
        exists = false;
      }
      if (exists) offenders.push(`artifacts/${name}/raw`);
    }
    expect(offenders).toEqual([]);
  });

  it("no built artifact bundle references artifacts/<x>/raw/", () => {
    const offenders: { bundle: string; needle: string }[] = [];
    for (const name of listArtifacts()) {
      const distDir = join(ARTIFACTS_DIR, name, "dist");
      const needle = `artifacts/${name}/raw/`;
      for (const bundle of listMjsBundles(distDir)) {
        let text: string;
        try {
          // Some dist files can be large; readFileSync is fine here, this
          // only runs on the artifacts that have actually been built.
          if (statSync(bundle).size > 50 * 1024 * 1024) continue;
          text = readFileSync(bundle, "utf8");
        } catch {
          continue;
        }
        if (text.includes(needle)) {
          offenders.push({
            bundle: bundle.replace(`${REPO_ROOT}/`, ""),
            needle,
          });
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
