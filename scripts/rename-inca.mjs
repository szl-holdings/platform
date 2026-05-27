#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, statSync, renameSync, existsSync, mkdirSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const TOKEN_MAP = [
  ["MYTHOS", "KHIPU"],
  ["Mythos", "Khipu"],
  ["mythos", "khipu"],
  ["GLASSWING", "PILLPINTU"],
  ["Glasswing", "Pillpintu"],
  ["glasswing", "pillpintu"],
];

const EXCLUDE_PREFIXES = [
  ".git/", ".cache/", ".pnpm-store/", "attached_assets/", ".local/",
  "archive/", "vendor/",
  "scripts/check-forbidden-patterns.baseline.json",
  "scripts/check-doctrine-v6.mjs",
  "scripts/check-forbidden-patterns.mjs",
  "scripts/rename-inca.mjs",
];

const EXCLUDE_FILENAMES = new Set(["pnpm-lock.yaml", "yarn.lock", "package-lock.json"]);

const SCANNABLE_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".md", ".mdx",
  ".py", ".rs", ".go", ".rb",
  ".html", ".css", ".scss",
  ".yaml", ".yml", ".toml",
  ".sh", ".bash", ".sql",
]);

function listTrackedFiles() {
  const out = execSync("git ls-files", { encoding: "utf8", maxBuffer: 500 * 1024 * 1024 });
  return out.split("\n").filter(Boolean);
}

function isExcluded(path) {
  for (const p of EXCLUDE_PREFIXES) if (path.startsWith(p)) return true;
  const base = path.split("/").pop();
  if (EXCLUDE_FILENAMES.has(base)) return false; // we still skip via ext anyway
  const ext = extname(path).toLowerCase();
  if (!SCANNABLE_EXTS.has(ext)) return true;
  if (EXCLUDE_FILENAMES.has(base)) return true;
  return false;
}

function rewriteContent(content) {
  let out = content;
  for (const [from, to] of TOKEN_MAP) {
    out = out.split(from).join(to);
  }
  return out;
}

function rewritePath(p) {
  let out = p;
  for (const [from, to] of TOKEN_MAP) {
    out = out.split(from).join(to);
  }
  return out;
}

const files = listTrackedFiles();
const renames = [];
let contentTouched = 0, contentSkipped = 0;

for (const f of files) {
  if (!existsSync(f)) continue;
  if (isExcluded(f)) continue;
  let content;
  try {
    content = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  const rewritten = rewriteContent(content);
  if (rewritten !== content) {
    writeFileSync(f, rewritten);
    contentTouched++;
  } else {
    contentSkipped++;
  }
}

console.log(`Content rewrites: ${contentTouched} touched, ${contentSkipped} no-op`);

// Phase 2: file path renames (do AFTER content rewrites)
// Re-list because content rewrites may have changed package.json names etc.
const allFiles = listTrackedFiles();
for (const f of allFiles) {
  if (f.startsWith(".git/")) continue;
  // We rename ALL file paths whose basename matches (even in grandfathered dirs
  // packages/frontier-mythos and tools/github-actions/mythos-doctrine — that's
  // the "exhaustive" part the user asked for).
  const newPath = rewritePath(f);
  if (newPath !== f) renames.push([f, newPath]);
}

// Sort by depth descending so we rename leaves before parents
renames.sort((a, b) => b[0].split("/").length - a[0].split("/").length);

for (const [from, to] of renames) {
  if (!existsSync(from)) continue;
  mkdirSync(dirname(to), { recursive: true });
  try { renameSync(from, to); } catch (e) { console.error(`rename failed ${from} -> ${to}: ${e.message}`); }
}

console.log(`Path renames: ${renames.length}`);
