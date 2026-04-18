#!/usr/bin/env node
/**
 * check-deprecated-links — SZL Holdings Platform
 *
 * Scans all artifact source files for navigation references (href, Link to,
 * window.location, router.push, etc.) pointing to archived or deprecated
 * routes. Any match causes CI to fail with the exact file and line number.
 *
 * Server-side route *definitions* (router.get/post/put/patch/delete) and
 * direct API call helpers (apiGet, apiPost, fetch) are intentionally excluded —
 * the API server may legitimately continue to serve those paths.
 *
 * Deprecated routes (kept in sync with ROUTE_INVENTORY.md "Archived Surfaces"):
 *   /firestorm/          — archived; superseded by Aegis (/aegis/)
 *   /lyte-command-center/ — archived; merged into Command (/command/)
 *   /imperium/           — archived; merged into Command (/command/)
 *   /prism-counsel/      — deprecated (task #579); use /aegis/
 *
 * Usage:
 *   node scripts/qa/check-deprecated-links.js
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

const DEPRECATED_ROUTES = [
  {
    slug: "/firestorm/",
    replacement: "/aegis/",
  },
  {
    slug: "/lyte-command-center/",
    replacement: "/command/",
  },
  {
    slug: "/imperium/",
    replacement: "/command/",
  },
  {
    slug: "/prism-counsel/",
    replacement: "/aegis/",
  },
];

const NAV_PATTERN =
  /(?:href|to|navigate|push|replace|window\.location(?:\.href|\.assign|\.replace)?)\s*[=(]\s*["'`]([^"'`]+)["'`]/gi;

const SERVER_ROUTE_DEFINITION =
  /^\s*router\.(get|post|put|patch|delete|use|all)\s*\(/;

const API_CALL_PATTERN =
  /^\s*(?:apiGet|apiPost|apiPut|apiPatch|apiDelete|apiFetchRaw|fetch|axios)\s*[(<]/;

const SOURCE_EXTENSIONS = /\.(ts|tsx|js|jsx|mts|mjs|html)$/;

const EXCLUDED_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  ".git",
  "coverage",
  ".turbo",
  ".cache",
]);

const EXCLUDED_FILE_NAMES = new Set([
  "check-deprecated-links.js",
]);

function* walkDir(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (EXCLUDED_DIR_NAMES.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.test(entry.name)) {
      if (!EXCLUDED_FILE_NAMES.has(entry.name)) {
        yield fullPath;
      }
    }
  }
}

function isServerRouteDefinition(line) {
  return SERVER_ROUTE_DEFINITION.test(line) || API_CALL_PATTERN.test(line);
}

function scanFile(filePath) {
  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return [];
  }

  const lines = content.split("\n");
  const hits = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isServerRouteDefinition(line)) continue;

    NAV_PATTERN.lastIndex = 0;
    let match;
    while ((match = NAV_PATTERN.exec(line)) !== null) {
      const href = match[1];
      for (const { slug, replacement } of DEPRECATED_ROUTES) {
        const base = slug.endsWith("/") ? slug.slice(0, -1) : slug;
        const matched =
          href === slug ||
          href === base ||
          href.startsWith(slug) ||
          href.startsWith(base + "/") ||
          href.startsWith("/api" + slug) ||
          href.startsWith("/api" + base + "/");
        if (matched) {
          hits.push({
            file: relative(ROOT, filePath),
            line: i + 1,
            content: line.trim(),
            route: slug,
            replacement,
            href,
          });
        }
      }
    }
  }

  return hits;
}

function main() {
  console.log("\nSZL Holdings — Deprecated Navigation Link Check");
  console.log(
    "Scanning artifact source files for archived route references in navigation...\n"
  );

  const SCAN_DIRS = [
    join(ROOT, "artifacts"),
    join(ROOT, "packages"),
    join(ROOT, "scripts"),
  ];

  const allHits = [];

  for (const dir of SCAN_DIRS) {
    let stat;
    try {
      stat = statSync(dir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    for (const filePath of walkDir(dir)) {
      const hits = scanFile(filePath);
      allHits.push(...hits);
    }
  }

  if (allHits.length === 0) {
    console.log("PASS — No deprecated navigation link references found.\n");
    process.exit(0);
  }

  console.error(
    `FAIL — ${allHits.length} deprecated navigation link(s) found:\n`
  );

  const byFile = new Map();
  for (const hit of allHits) {
    if (!byFile.has(hit.file)) byFile.set(hit.file, []);
    byFile.get(hit.file).push(hit);
  }

  for (const [file, hits] of byFile) {
    console.error(`  ${file}`);
    for (const hit of hits) {
      console.error(
        `    Line ${hit.line}: "${hit.route}" — use "${hit.replacement}" instead`
      );
      console.error(`      ${hit.content}`);
    }
  }

  console.error(
    `\nThese routes are archived. Update each reference to the replacement route listed above.`
  );
  console.error(
    `See ROUTE_INVENTORY.md for the full list of archived surfaces.\n`
  );
  process.exit(1);
}

main();
