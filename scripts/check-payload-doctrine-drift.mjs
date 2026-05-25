#!/usr/bin/env node
/**
 * Payload→doctrine drift guardrail (task #5142).
 *
 * The "dark" artifact landing / about / lineage surfaces (sentra, conduit,
 * a11oy) were migrated off `@szl-holdings/payload` onto the canonical
 * `@szl-holdings/szl-doctrine` import surface. szl-doctrine internally
 * re-exports the same constants from payload, so consumers see no behavior
 * change — but they no longer reach across the doctrine boundary.
 *
 * This script fails CI if any TS/TSX/JS/JSX file under `artifacts/*\/src/`
 * re-introduces a direct `from '@szl-holdings/payload'` import. New artifact
 * code must import panel facts, V7 facts, thesis lineage / papers, the org
 * summary, and the DOI ledger count from `@szl-holdings/szl-doctrine`.
 *
 * The api-server artifact is exempt — it consumes payload for raw-bytes
 * routes and is intentionally out of scope for the artifact-surface
 * migration.
 *
 * Exit codes: 0 = clean, 1 = at least one violation.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, "..", "..");

const SCAN_ROOT = join(ROOT, "artifacts");

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".next",
  "build",
  ".turbo",
  ".git",
  "coverage",
  ".cache",
  ".vite",
  "out",
]);

const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

// Artifacts whose `src/` is intentionally allowed to keep depending on
// `@szl-holdings/payload` directly. Only the api-server qualifies — it
// serves the raw payload bytes and lives behind the artifact-surface
// boundary, not in front of it.
const ALLOWED_ARTIFACT_PREFIXES = [
  `artifacts${sep}api-server${sep}`,
];

// Import-shape detector: matches `from '@szl-holdings/payload'`,
// `from "@szl-holdings/payload"`, `require('@szl-holdings/payload')`,
// and `import('@szl-holdings/payload')`. Sub-path imports such as
// `@szl-holdings/payload/server` are also caught.
const PAYLOAD_IMPORT_RE =
  /(?:from\s+|require\(\s*|import\(\s*)(['"])@szl-holdings\/payload(?:\/[\w\-./]+)?\1/;

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (st.isFile()) {
      const dot = name.lastIndexOf(".");
      const ext = dot >= 0 ? name.slice(dot) : "";
      if (SOURCE_EXTS.has(ext)) yield full;
    }
  }
}

function isAllowed(rel) {
  return ALLOWED_ARTIFACT_PREFIXES.some((p) => rel.startsWith(p));
}

const violations = [];

for (const file of walk(SCAN_ROOT)) {
  const rel = relative(ROOT, file);
  // Only scan `artifacts/<name>/src/**` — auxiliary trees (raw_v7, audit
  // evidence, test fixtures rooted outside src) are not artifact surfaces.
  if (!/^artifacts[/\\][^/\\]+[/\\]src[/\\]/.test(rel)) continue;
  if (isAllowed(rel)) continue;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(PAYLOAD_IMPORT_RE);
    if (m) {
      violations.push({
        file: rel,
        line: i + 1,
        text: lines[i].trim(),
      });
    }
  }
}

if (violations.length > 0) {
  console.error(
    `\nFound ${violations.length} direct '@szl-holdings/payload' import(s) ` +
      `in artifact source.\n` +
      `Migrate them to '@szl-holdings/szl-doctrine' (task #5142). ` +
      `szl-doctrine re-exports DOI_LEDGER_COUNT, ORG_SUMMARY, PANEL_FACTS, ` +
      `THESIS_LINEAGE, THESIS_PAPERS, V7_PANEL_FACTS, and thesisPaperSummary.\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  console.error("");
  process.exit(1);
}

console.log("check-payload-doctrine-drift: clean (0 violations)");
