/**
 * Generalized vendored-bundle drift check.
 *
 * Walks every bundle listed in `packages/szl-doctrine/vendored-bundles.json`
 * and, for each bundle, verifies — for every file recorded in that bundle's
 * `VENDOR.json` — that all three SHA-256s agree:
 *
 *   1. the hash of the upstream source file (under `.local/payload-v8/...`),
 *   2. the hash of the vendored copy in the repo,
 *   3. the hash recorded in `VENDOR.json`.
 *
 * Also fails if either directory contains files not declared in the manifest
 * (extras) or is missing files the manifest declares (omissions).
 *
 * Run via:
 *
 *   pnpm --filter @szl-holdings/szl-doctrine run check:vendored-bundles
 *
 * Pass `--write` to re-vendor every bundle in the registry: each source file
 * is copied over its vendored counterpart and each `VENDOR.json` is rewritten
 * with fresh hashes (preserving the per-file `source` rename mapping when
 * present). Pass `--bundle <name>` to restrict the run to a single bundle.
 *
 * VENDOR.json schema (both forms are accepted):
 *
 *   { "files": { "name.png": "<sha256hex>" } }                       // flat
 *   { "files": { "name.png": { "source": "sub/name.png",
 *                              "sha256": "<sha256hex>" } } }         // full
 *
 * The full form is required when the vendored filename differs from the
 * source filename (e.g. flattened-subdir layouts or renames).
 *
 * Optional per-bundle field `source_dirs` declares which subdirectories
 * under `source_root` MUST be exhaustively reflected in `files` — i.e. any
 * upstream file appearing in one of those dirs without a manifest entry is
 * treated as drift. If omitted, defaults to `[""]` (scan source_root
 * itself). Use a narrower list when the manifest only intentionally pins
 * selected files out of a broader source tree.
 */
import { createHash } from "node:crypto";
import { copyFileSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(process.cwd(), "../..");
const REGISTRY_PATH = resolve(
  REPO_ROOT,
  "packages/szl-doctrine/vendored-bundles.json",
);

const NON_BUNDLE_FILES = new Set(["VENDOR.json", "README.md"]);
const WRITE_MODE = process.argv.includes("--write");
const BUNDLE_FILTER = (() => {
  const idx = process.argv.indexOf("--bundle");
  return idx >= 0 ? process.argv[idx + 1] : undefined;
})();

interface RegistryEntry {
  name: string;
  manifest: string;
}
interface Registry {
  bundles: RegistryEntry[];
}

type FileEntry = string | { source: string; sha256: string };
interface VendorManifest {
  $schema?: string;
  description: string;
  source_root: string;
  vendored_root: string;
  source_dirs?: string[];
  hash_algorithm: "sha256";
  files: Record<string, FileEntry>;
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function fail(bundle: string, message: string): never {
  console.error(`[szl-doctrine] VENDOR DRIFT [${bundle}]: ${message}`);
  process.exit(1);
}

function listBundleFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => !NON_BUNDLE_FILES.has(name))
    .sort();
}

function diff(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return a.filter((x) => !set.has(x));
}

function sourceOf(entry: FileEntry, vendoredName: string): string {
  return typeof entry === "string" ? vendoredName : entry.source;
}
function hashOf(entry: FileEntry): string {
  return typeof entry === "string" ? entry : entry.sha256;
}

const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as Registry;
const bundles = BUNDLE_FILTER
  ? registry.bundles.filter((b) => b.name === BUNDLE_FILTER)
  : registry.bundles;

if (BUNDLE_FILTER && bundles.length === 0) {
  console.error(
    `[szl-doctrine] no bundle named '${BUNDLE_FILTER}' in ${REGISTRY_PATH}`,
  );
  process.exit(1);
}

for (const { name, manifest: manifestRel } of bundles) {
  const manifestPath = resolve(REPO_ROOT, manifestRel);
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  ) as VendorManifest;

  if (manifest.hash_algorithm !== "sha256") {
    fail(name, `unsupported hash algorithm: ${manifest.hash_algorithm}`);
  }

  const sourceRoot = resolve(REPO_ROOT, manifest.source_root);
  const vendoredRoot = resolve(REPO_ROOT, manifest.vendored_root);
  const manifestNames = Object.keys(manifest.files).sort();

  if (WRITE_MODE) {
    for (const vendoredName of manifestNames) {
      const entry = manifest.files[vendoredName];
      copyFileSync(
        resolve(sourceRoot, sourceOf(entry, vendoredName)),
        resolve(vendoredRoot, vendoredName),
      );
    }
    const refreshed: Record<string, FileEntry> = {};
    for (const vendoredName of manifestNames) {
      const entry = manifest.files[vendoredName];
      const sourceRel = sourceOf(entry, vendoredName);
      const fresh = sha256(resolve(sourceRoot, sourceRel));
      refreshed[vendoredName] =
        typeof entry === "string"
          ? fresh
          : { source: sourceRel, sha256: fresh };
    }
    const next: VendorManifest = { ...manifest, files: refreshed };
    writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
    console.log(
      `[szl-doctrine] [${name}] re-vendored ${manifestNames.length} files and rewrote ${manifestRel}`,
    );
    continue;
  }

  // Layout / membership checks (extras + omissions on both sides).
  const vendoredFiles = listBundleFiles(vendoredRoot);
  const missingFromVendored = diff(manifestNames, vendoredFiles);
  const extraInVendored = diff(vendoredFiles, manifestNames);
  if (missingFromVendored.length) {
    fail(
      name,
      `${missingFromVendored.length} vendored file(s) are missing from ${manifest.vendored_root}: ${missingFromVendored.join(", ")}`,
    );
  }
  if (extraInVendored.length) {
    fail(
      name,
      `${extraInVendored.length} extra file(s) in ${manifest.vendored_root} not declared in VENDOR.json: ${extraInVendored.join(", ")}`,
    );
  }

  // Source-side membership: for every declared exhaustive source dir, every
  // file present there upstream MUST be referenced in `files.source`, or
  // upstream additions silently bypass the gate.
  const sourceDirs = manifest.source_dirs ?? [""];
  const declaredSourcePaths = new Set(
    manifestNames.map((n) => sourceOf(manifest.files[n], n)),
  );
  for (const subdir of sourceDirs) {
    const scanRoot = resolve(sourceRoot, subdir);
    let entries: string[];
    try {
      entries = readdirSync(scanRoot)
        .filter((f) => !NON_BUNDLE_FILES.has(f))
        .sort();
    } catch (err) {
      fail(
        name,
        `declared source_dirs entry '${subdir || "."}' is unreadable under ${manifest.source_root} (${(err as Error).message})`,
      );
    }
    const missingFromManifest: string[] = [];
    for (const entry of entries) {
      const relFromSourceRoot = subdir ? `${subdir}/${entry}` : entry;
      if (!declaredSourcePaths.has(relFromSourceRoot)) {
        missingFromManifest.push(relFromSourceRoot);
      }
    }
    if (missingFromManifest.length) {
      fail(
        name,
        `${missingFromManifest.length} upstream file(s) appeared in ${manifest.source_root}/${subdir} that are not declared in VENDOR.json: ${missingFromManifest.join(", ")} — re-vendor with \`-- --write\` or narrow \`source_dirs\``,
      );
    }
  }

  // Per-file three-way hash check.
  for (const vendoredName of manifestNames) {
    const entry = manifest.files[vendoredName];
    const sourceRel = sourceOf(entry, vendoredName);
    const expected = hashOf(entry);
    const sourcePath = resolve(sourceRoot, sourceRel);
    const vendoredPath = resolve(vendoredRoot, vendoredName);

    let sourceHash: string;
    try {
      sourceHash = sha256(sourcePath);
    } catch (err) {
      fail(
        name,
        `source file '${sourceRel}' under ${manifest.source_root} is unreadable (${(err as Error).message})`,
      );
    }
    const vendoredHash = sha256(vendoredPath);

    if (sourceHash !== expected) {
      fail(
        name,
        `${vendoredName}: upstream hash ${sourceHash} does not match VENDOR.json ${expected} — re-vendor with \`-- --write\``,
      );
    }
    if (vendoredHash !== expected) {
      fail(
        name,
        `${vendoredName}: vendored hash ${vendoredHash} does not match VENDOR.json ${expected} — re-vendor with \`-- --write\``,
      );
    }
  }

  console.log(
    `[szl-doctrine] OK · [${name}] in sync (${manifestNames.length} files, sha256)`,
  );
}

if (!WRITE_MODE) {
  console.log(
    `[szl-doctrine] OK · ${bundles.length} vendored bundle(s) verified`,
  );
}
