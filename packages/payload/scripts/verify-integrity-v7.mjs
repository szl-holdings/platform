#!/usr/bin/env node
/**
 * Strict SHA-256 + size verification for the Fly-High V7 audit pack staged
 * at packages/payload/raw_v7/, against the file_integrity manifest embedded
 * in raw_v7/03_manifests/MANIFEST.json (`files[]`).
 *
 * Mirrors verify-integrity.mjs (V6) policy:
 *   - For every entry in `MANIFEST.files[]`: file MUST exist + sha256 +
 *     size MUST match. Drift => exit 1.
 *   - Every file on disk under raw_v7/ (except MANIFEST.json itself, which
 *     cannot self-reference its own hash) MUST be referenced by `files[]`.
 *     Extras => exit 1.
 *
 * Known structural deltas may be declared in integrity-deltas-v7.json
 * (auditable). Passing --accept-known-deltas (or env
 * ACCEPT_KNOWN_DELTAS=1) downgrades those specific deltas from errors to
 * warnings. Any delta NOT declared is still a hard error.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW_V7 = resolve(HERE, "..", "raw_v7");
const MANIFEST_PATH = join(RAW_V7, "03_manifests", "MANIFEST.json");
const DELTAS_PATH = resolve(HERE, "..", "integrity-deltas-v7.json");
const MANIFEST_KEY = "03_manifests/MANIFEST.json";

const acceptKnown =
  process.argv.includes("--accept-known-deltas") ||
  process.env.ACCEPT_KNOWN_DELTAS === "1";

const knownDeltas = existsSync(DELTAS_PATH)
  ? JSON.parse(readFileSync(DELTAS_PATH, "utf8"))
  : { extras: [], missing: [] };
const knownExtras = new Set(knownDeltas.extras ?? []);
const knownMissing = new Set(knownDeltas.missing ?? []);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function toKey(absPath) {
  const rel = relative(RAW_V7, absPath);
  return sep === "/" ? rel : rel.split(sep).join("/");
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
if (manifest.schema !== "szl-holdings/fly-v7-replit-payload/v1") {
  console.error(
    `\u2717 unexpected MANIFEST schema: ${JSON.stringify(manifest.schema)}`,
  );
  process.exit(1);
}
const expected = new Map();
for (const f of manifest.files ?? []) {
  expected.set(f.path, { sha256: f.sha256, size_bytes: f.size_bytes });
}

const allFiles = await walk(RAW_V7);
let ok = 0;
let mismatch = 0;
let missing = 0;
let extra = 0;
let knownExtraSeen = 0;
let knownMissingSeen = 0;
const seen = new Set();

for (const file of allFiles) {
  const key = toKey(file);
  if (key === MANIFEST_KEY) continue;
  seen.add(key);
  const entry = expected.get(key);
  if (!entry) {
    if (knownExtras.has(key)) {
      knownExtraSeen++;
      if (acceptKnown) {
        console.warn(`~ known extra (declared in integrity-deltas-v7.json): ${key}`);
        continue;
      }
    }
    extra++;
    console.error(`\u2717 extra (not in V7 manifest): ${key}`);
    continue;
  }
  const got = sha256(file);
  if (got !== entry.sha256) {
    mismatch++;
    console.error(
      `\u2717 ${key}\n   expected sha ${entry.sha256}\n   got      sha ${got}`,
    );
    continue;
  }
  const size = statSync(file).size;
  if (typeof entry.size_bytes === "number" && size !== entry.size_bytes) {
    mismatch++;
    console.error(
      `\u2717 ${key} size ${size} != manifest ${entry.size_bytes}`,
    );
    continue;
  }
  ok++;
}

for (const key of expected.keys()) {
  if (!seen.has(key)) {
    if (knownMissing.has(key)) {
      knownMissingSeen++;
      if (acceptKnown) {
        console.warn(`~ known missing (declared in integrity-deltas-v7.json): ${key}`);
        continue;
      }
    }
    missing++;
    console.error(`\u2717 missing (in V7 manifest, not on disk): ${key}`);
  }
}

const total = expected.size;
console.log(
  `\npayload V7 integrity: ${ok}/${total} verified, ${mismatch} mismatch, ${missing} missing, ${extra} extra` +
    (acceptKnown
      ? ` (known deltas accepted: ${knownExtraSeen} extras, ${knownMissingSeen} missing)`
      : ""),
);

if (mismatch || missing || extra) process.exit(1);
process.exit(0);
