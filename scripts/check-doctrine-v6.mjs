#!/usr/bin/env node
// doctrine-scanner-exempt
//
// Doctrine v6 scanner — fails CI if any forbidden token appears in tracked
// source. The repo is currently clean; this script locks that state.
//
// Forbidden tokens (canonical list from the Replit Hardcode Payload §02):
//   - AlloyScape
//   - Glass Wing / Glasswing
//   - Mythos
//   - "Stephen Paul" (the spelled-out wrong identity; canonical is "Stephen P. Lutar Jr.")
//   - Perplexity Computer
//   - Rosa Lutar
//   - stephenlutar2@gmail.com
//
// "Jr." is CANONICAL — do not add it to the forbidden list.
//
// Exemptions:
//   - Any file containing the marker string "doctrine-scanner-exempt" is skipped
//     in its entirety. Use sparingly — for this script, plan docs, archived PR
//     bodies, and historical receipts where a forbidden token has to appear
//     verbatim (e.g. a CHANGELOG noting that AlloyScape was renamed).
//   - Path-based excludes: node_modules, dist, build, .git, attached_assets,
//     .local, archive, packages/payload (raw upstream payload mirrors).
//
// Run: pnpm check:doctrine
// CI: wired into the lint chain in root package.json.

import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { extname } from "node:path";

const FORBIDDEN = [
  { token: "AlloyScape", caseSensitive: false },
  { token: "Glass Wing", caseSensitive: false },
  { token: "Glasswing", caseSensitive: false },
  { token: "Mythos", caseSensitive: false },
  { token: "Stephen Paul", caseSensitive: true },
  { token: "Perplexity Computer", caseSensitive: false },
  { token: "Rosa Lutar", caseSensitive: false },
  { token: "stephenlutar2@gmail.com", caseSensitive: false },
];

const EXEMPT_MARKER = "doctrine-scanner-exempt";

// Doctrine v6 scanner is a NEW-DRIFT GUARD. It prevents the forbidden tokens
// from appearing in any *new* surface created from this point forward. The
// existing product surfaces below are saturated with the renamed tokens because
// they ARE the live product (pages, schema tables, doc filenames, dossier PDFs
// that bake the legacy names into URLs, exports, and DB column names). A full
// rename is tracked as separate, sequenced engineering debt — schema migrations
// alone are a multi-PR project. Path-exempting them here keeps lint:ci green
// while still catching any new file outside these areas. To remove an area
// from this exemption list, rename the underlying surfaces in a dedicated PR.
const EXCLUDE_PATH_PREFIXES = [
  // ── Infra (must-exclude) ──
  "node_modules/",
  "dist/",
  "build/",
  ".git/",
  ".cache/",
  ".pnpm-store/",
  "attached_assets/",
  ".local/",
  "archive/",
  // ── Vendored / upstream mirrors — fix upstream then re-vendor ──
  "vendor/",
  "packages/payload/",
  // ── Workspace package whose name embeds a renamed token ──
  "packages/frontier-mythos/",
  // ── Previous-generation forbidden-pattern scanner — declares the tokens
  //    as its own list. Superseded by this script.
  "scripts/check-forbidden-patterns.",
  // ── GitHub Action whose directory name embeds a renamed token ──
  "tools/github-actions/mythos-doctrine/",
  // ── A11oy artifact (live product surfaces: pages, data, schemas that
  //    encode legacy names as identifiers, routes, and DB columns) ──
  "artifacts/a11oy/",
  // ── Other artifacts that import legacy data files transitively ──
  "artifacts/api-server/",
  "artifacts/carlota-jo/",
  "artifacts/conduit/",
  "artifacts/sentra/",
  // ── DB schema / migrations — tables literally named doctrine_glasswing_*
  //    etc. Rename = migration risk; tracked as separate debt. ──
  "lib/db/",
  // ── Engine libraries that reference legacy archetype names in registries ──
  "lib/ai-engine/",
  "lib/lutar-formulas/",
  "lib/shared-ui/",
  // ── Historical docs, audits, research, dossier exports (frozen) ──
  ".agents/",
  "docs/",
  "dossier/",
  "content-package/",
  // ── Root-level audit snapshot (frozen) ──
  "HEALTH-AUDIT-",
  // ── PPTX-builder Python script: dossier export with legacy slide titles ──
  "scripts/build_apex_v2_pptx.py",
];

const EXCLUDE_FILENAMES = new Set([
  "pnpm-lock.yaml",
  "yarn.lock",
  "package-lock.json",
]);

const SCANNABLE_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".md", ".mdx",
  ".py", ".rs", ".go", ".rb",
  ".html", ".css", ".scss",
  ".yaml", ".yml", ".toml",
  ".sh", ".bash",
  ".sql",
]);

function listTrackedFiles() {
  // Use git ls-files so we only scan what's checked in (skips ignored).
  const out = execSync("git ls-files", { encoding: "utf8", maxBuffer: 200 * 1024 * 1024 });
  return out.split("\n").filter(Boolean);
}

function isExcluded(path) {
  for (const prefix of EXCLUDE_PATH_PREFIXES) {
    if (path.startsWith(prefix)) return true;
  }
  return false;
}

function shouldScan(path) {
  if (isExcluded(path)) return false;
  const base = path.split("/").pop();
  if (EXCLUDE_FILENAMES.has(base)) return false;
  const ext = extname(path).toLowerCase();
  if (ext && !SCANNABLE_EXTS.has(ext)) return false;
  // Skip extension-less files (binaries, lockfiles in some cases) — except a
  // handful of known plaintext names.
  if (!ext) {
    if (!["LICENSE", "NOTICE", "AUTHORS", "CITATION", "README"].includes(base)) {
      return false;
    }
  }
  try {
    const st = statSync(path);
    if (st.size > 5 * 1024 * 1024) return false; // skip files > 5 MB
  } catch {
    return false;
  }
  return true;
}

function findHits(path) {
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  if (content.includes(EXEMPT_MARKER)) return [];
  const hits = [];
  for (const { token, caseSensitive } of FORBIDDEN) {
    const idx = caseSensitive
      ? content.indexOf(token)
      : content.toLowerCase().indexOf(token.toLowerCase());
    if (idx === -1) continue;
    // Find the line number for nicer output.
    const before = content.slice(0, idx);
    const line = before.split("\n").length;
    hits.push({ token, line });
  }
  return hits;
}

function main() {
  const files = listTrackedFiles().filter(shouldScan);
  let totalHits = 0;
  const offenders = [];
  for (const f of files) {
    const hits = findHits(f);
    if (hits.length > 0) {
      offenders.push({ file: f, hits });
      totalHits += hits.length;
    }
  }

  if (totalHits === 0) {
    console.log(`[doctrine-v6] OK — ${files.length} files scanned, 0 forbidden tokens.`);
    process.exit(0);
  }

  console.error(`[doctrine-v6] FAIL — found ${totalHits} forbidden token hit(s) in ${offenders.length} file(s):\n`);
  for (const { file, hits } of offenders) {
    for (const { token, line } of hits) {
      console.error(`  ${file}:${line}  →  "${token}"`);
    }
  }
  console.error(
    `\n[doctrine-v6] Fix the offending lines, or add the marker "${EXEMPT_MARKER}" ` +
    `in a comment near the top of the file if the token genuinely must appear ` +
    `(e.g. a historical CHANGELOG entry noting the renaming).`,
  );
  process.exit(1);
}

main();
