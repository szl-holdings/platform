#!/usr/bin/env node
/**
 * Strict SHA-256 + size verification of every file in packages/payload/raw/
 * against the file_integrity manifest in raw/payload.json.
 *
 * Behaviour:
 *   - For every entry in `payload.json.file_integrity`: the file MUST exist on
 *     disk and its SHA-256 + byte size MUST match. Any drift -> exit 1.
 *   - For every file on disk under raw/ (except payload.json itself, which
 *     cannot self-reference its own hash): it MUST be referenced by the
 *     manifest. Extras -> exit 1.
 *
 * Known structural deltas between the staged raw/ tree and the manifest are
 * recorded in integrity-deltas.json (auditable). Passing --accept-known-deltas
 * (or env ACCEPT_KNOWN_DELTAS=1) downgrades those specific deltas from errors
 * to warnings so CI can be green while raw/ remains read-only. Any delta NOT
 * declared in integrity-deltas.json is still a hard error.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = resolve(HERE, "..", "raw");
const DELTAS_PATH = resolve(HERE, "..", "integrity-deltas.json");

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

function toManifestKey(absPath) {
  const rel = relative(RAW, absPath);
  return sep === "/" ? rel : rel.split(sep).join("/");
}

const master = JSON.parse(readFileSync(join(RAW, "payload.json"), "utf8"));
const manifest = master.file_integrity ?? {};

const allFiles = await walk(RAW);
let ok = 0;
let mismatch = 0;
let missing = 0;
let extra = 0;
let knownExtraSeen = 0;
let knownMissingSeen = 0;
const seen = new Set();

for (const file of allFiles) {
  const key = toManifestKey(file);
  if (key === "payload.json") continue;
  seen.add(key);
  const entry = manifest[key];
  if (!entry) {
    if (knownExtras.has(key)) {
      knownExtraSeen++;
      if (acceptKnown) {
        console.warn(`~ known extra (declared in integrity-deltas.json): ${key}`);
        continue;
      }
    }
    extra++;
    console.error(`\u2717 extra (not in manifest): ${key}`);
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

for (const key of Object.keys(manifest)) {
  if (!seen.has(key)) {
    if (knownMissing.has(key)) {
      knownMissingSeen++;
      if (acceptKnown) {
        console.warn(`~ known missing (declared in integrity-deltas.json): ${key}`);
        continue;
      }
    }
    missing++;
    console.error(`\u2717 missing (in manifest, not on disk): ${key}`);
  }
}

const total = Object.keys(manifest).length;
console.log(
  `\npayload integrity: ${ok}/${total} verified, ${mismatch} mismatch, ${missing} missing, ${extra} extra` +
    (acceptKnown
      ? ` (known deltas accepted: ${knownExtraSeen} extras, ${knownMissingSeen} missing)`
      : ""),
);

if (mismatch || missing || extra) process.exit(1);
process.exit(0);
