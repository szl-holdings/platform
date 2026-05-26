/**
 * Anatomy bundle drift check.
 *
 * The 16 anatomy binaries (8 PDFs + 8 PNGs) under
 * `artifacts/a11oy/public/doctrine-anatomy/` are vendored copies of the
 * canonical figures shipped with the SZL Payload V8 bundle, under
 * `.local/payload-v8/05_anatomy/figures/`. They must remain byte-for-byte
 * identical to upstream.
 *
 * This script verifies three things for every file recorded in
 * `artifacts/a11oy/public/doctrine-anatomy/VENDOR.json`:
 *
 *   1. the SHA-256 of the upstream source file,
 *   2. the SHA-256 of the vendored copy,
 *   3. the SHA-256 recorded in `VENDOR.json`,
 *
 * all agree. It also fails if either directory contains extra or missing
 * files relative to the manifest.
 *
 * Run via:
 *
 *   pnpm --filter @szl-holdings/szl-doctrine run check:anatomy-drift
 *
 * Pass `--write` to re-vendor: every source file is copied over the
 * vendored file and `VENDOR.json` is rewritten with fresh hashes.
 */
import { createHash } from "node:crypto";
import { copyFileSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(process.cwd(), "../..");
const SOURCE_DIR = resolve(REPO_ROOT, ".local/payload-v8/05_anatomy/figures");
const VENDORED_DIR = resolve(
  REPO_ROOT,
  "artifacts/a11oy/public/doctrine-anatomy",
);
const MANIFEST_PATH = resolve(VENDORED_DIR, "VENDOR.json");

const NON_BINARY_FILES = new Set(["VENDOR.json", "README.md"]);
const WRITE_MODE = process.argv.includes("--write");

interface VendorManifest {
  $schema?: string;
  description: string;
  source_root: string;
  vendored_root: string;
  hash_algorithm: "sha256";
  files: Record<string, string>;
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function fail(message: string): never {
  console.error(`[szl-doctrine] ANATOMY DRIFT: ${message}`);
  process.exit(1);
}

function listBinaries(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => !NON_BINARY_FILES.has(name))
    .sort();
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as VendorManifest;

if (manifest.hash_algorithm !== "sha256") {
  fail(`unsupported hash algorithm: ${manifest.hash_algorithm}`);
}

const sourceFiles = listBinaries(SOURCE_DIR);
const vendoredFiles = listBinaries(VENDORED_DIR);

if (WRITE_MODE) {
  for (const name of sourceFiles) {
    copyFileSync(resolve(SOURCE_DIR, name), resolve(VENDORED_DIR, name));
  }
  for (const name of vendoredFiles) {
    if (!sourceFiles.includes(name)) {
      fail(
        `vendored file '${name}' has no upstream counterpart; remove it manually before re-vendoring`,
      );
    }
  }
  const refreshed: Record<string, string> = {};
  for (const name of sourceFiles) {
    refreshed[name] = sha256(resolve(SOURCE_DIR, name));
  }
  const next: VendorManifest = { ...manifest, files: refreshed };
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `[szl-doctrine] re-vendored ${sourceFiles.length} anatomy files and rewrote VENDOR.json`,
  );
  process.exit(0);
}

const manifestNames = Object.keys(manifest.files).sort();

function diff(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return a.filter((x) => !set.has(x));
}

const missingFromSource = diff(manifestNames, sourceFiles);
const extraInSource = diff(sourceFiles, manifestNames);
const missingFromVendored = diff(manifestNames, vendoredFiles);
const extraInVendored = diff(vendoredFiles, manifestNames);

if (missingFromSource.length) {
  fail(
    `${missingFromSource.length} file(s) listed in VENDOR.json are missing from ${manifest.source_root}: ${missingFromSource.join(", ")}`,
  );
}
if (extraInSource.length) {
  fail(
    `${extraInSource.length} new file(s) appeared in ${manifest.source_root} that are not in VENDOR.json: ${extraInSource.join(", ")} — re-vendor with \`pnpm --filter @szl-holdings/szl-doctrine run check:anatomy-drift -- --write\``,
  );
}
if (missingFromVendored.length) {
  fail(
    `${missingFromVendored.length} vendored file(s) are missing from ${manifest.vendored_root}: ${missingFromVendored.join(", ")}`,
  );
}
if (extraInVendored.length) {
  fail(
    `${extraInVendored.length} extra file(s) in ${manifest.vendored_root} not declared in VENDOR.json: ${extraInVendored.join(", ")}`,
  );
}

for (const name of manifestNames) {
  const expected = manifest.files[name];
  const sourceHash = sha256(resolve(SOURCE_DIR, name));
  const vendoredHash = sha256(resolve(VENDORED_DIR, name));
  if (sourceHash !== expected) {
    fail(
      `${name}: upstream hash ${sourceHash} does not match VENDOR.json ${expected} — re-vendor with \`-- --write\``,
    );
  }
  if (vendoredHash !== expected) {
    fail(
      `${name}: vendored hash ${vendoredHash} does not match VENDOR.json ${expected} — re-vendor with \`-- --write\``,
    );
  }
}

console.log(
  `[szl-doctrine] OK · anatomy bundle in sync (${manifestNames.length} files, sha256)`,
);
