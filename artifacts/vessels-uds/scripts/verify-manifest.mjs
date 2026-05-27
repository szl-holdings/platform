#!/usr/bin/env node
// Vessels.UDS — round-trip every file declared in build/MANIFEST.json.
// Fails on missing file, hash mismatch, size mismatch, or extra payload file.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.argv[2] ?? process.cwd();
// Manifest lives at <root>/build/MANIFEST.json in the source tree (after
// `build.sh`) and at <root>/MANIFEST.json after Zarf deploy lands files
// under /opt/vessels. Accept both so the same verifier works pre- and
// post-deploy.
const candidates = [join(root, "build/MANIFEST.json"), join(root, "MANIFEST.json")];
const manifestPath = candidates.find((p) => {
  try { statSync(p); return true; } catch { return false; }
});
if (!manifestPath) {
  console.error(`[verify] no MANIFEST.json found. Looked in:\n  - ${candidates.join("\n  - ")}`);
  process.exit(2);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (err) {
  console.error(`[verify] cannot read ${manifestPath}: ${err.message}`);
  process.exit(2);
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const payloadFiles = [
  ...walk(join(root, "lib")),
  join(root, "vessels-demo.mjs"),
  ...walk(join(root, "docs")),
]
  .map((abs) => relative(root, abs).split(sep).join("/"))
  .sort();

const declared = new Set(manifest.entries.map((e) => e.path));
const failures = [];

for (const entry of manifest.entries) {
  let buf;
  try {
    buf = readFileSync(join(root, entry.path));
  } catch (err) {
    failures.push(`MISSING ${entry.path}: ${err.message}`);
    continue;
  }
  const sha = createHash("sha256").update(buf).digest("hex");
  if (sha !== entry.sha256) {
    failures.push(`HASH MISMATCH ${entry.path}: expected=${entry.sha256} got=${sha}`);
  }
  if (buf.byteLength !== entry.size) {
    failures.push(`SIZE MISMATCH ${entry.path}: expected=${entry.size} got=${buf.byteLength}`);
  }
}

for (const rel of payloadFiles) {
  if (!declared.has(rel)) failures.push(`EXTRA FILE ${rel} not in manifest`);
}

if (failures.length > 0) {
  console.error(`[verify] FAILED with ${failures.length} issue(s):`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}

console.log(
  `[verify] OK — ${manifest.entries.length} files verified (sha256)`,
);
