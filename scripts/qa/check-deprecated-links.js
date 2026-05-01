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

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

const DEPRECATED_ROUTES = [
  {
    slug: '/firestorm/',
    replacement: '/aegis/',
  },
  {
    slug: '/lyte-command-center/',
    replacement: '/command/',
  },
  {
    slug: '/imperium/',
    replacement: '/command/',
  },
  {
    slug: '/prism-counsel/',
    replacement: '/aegis/',
  },
];

const NAV_PATTERN =
  /(?:href|to|navigate|push|replace|window\.location(?:\.href|\.assign|\.replace)?)\s*[=(]\s*["'`]([^"'`]+)["'`]/gi;

// JSON nav fields. Matches `"link": "/path"`, `"href": "/path"`, etc.
// `path`, `route`, `slug` are intentionally excluded — they collide with
// non-navigation uses (file paths, route names, URL slugs in metadata).
const JSON_NAV_PATTERN =
  /"(href|link|url|to)"\s*:\s*"([^"]+)"/g;

const SERVER_ROUTE_DEFINITION = /^\s*router\.(get|post|put|patch|delete|use|all)\s*\(/;

const API_CALL_PATTERN =
  /^\s*(?:apiGet|apiPost|apiPut|apiPatch|apiDelete|apiFetchRaw|fetch|axios)\s*[(<]/;

const SOURCE_EXTENSIONS = /\.(ts|tsx|js|jsx|mts|mjs|html)$/;
const JSON_EXTENSIONS = /\.json$/;
const GENERATED_FILE_SUFFIX = /\.generated\.json$/;

const EXCLUDED_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '.turbo',
  '.cache',
]);

const EXCLUDED_FILE_NAMES = new Set(['check-deprecated-links.js']);

// JSON files that aren't navigation data: package manifests, TS configs,
// JSON schemas, lockfiles, etc. These rarely contain deprecated nav links and
// scanning them adds noise + cost. Match by exact basename or suffix.
const EXCLUDED_JSON_BASENAMES = new Set([
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.base.json',
  'tsconfig.build.json',
  'pnpm-workspace.json',
  'turbo.json',
  'vercel.json',
  'eslint.config.json',
  '.eslintrc.json',
  '.prettierrc.json',
  'manifest.json',
]);
const EXCLUDED_JSON_SUFFIXES = [/\.schema\.json$/, /\.tsbuildinfo$/];

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
    } else if (entry.isFile()) {
      if (EXCLUDED_FILE_NAMES.has(entry.name)) continue;
      if (SOURCE_EXTENSIONS.test(entry.name)) {
        yield fullPath;
      } else if (JSON_EXTENSIONS.test(entry.name) && !GENERATED_FILE_SUFFIX.test(entry.name)) {
        if (EXCLUDED_JSON_BASENAMES.has(entry.name)) continue;
        if (EXCLUDED_JSON_SUFFIXES.some((re) => re.test(entry.name))) continue;
        yield fullPath;
      }
    }
  }
}

function isServerRouteDefinition(line) {
  return SERVER_ROUTE_DEFINITION.test(line) || API_CALL_PATTERN.test(line);
}

function matchesDeprecated(href) {
  for (const { slug, replacement } of DEPRECATED_ROUTES) {
    const base = slug.endsWith('/') ? slug.slice(0, -1) : slug;
    const matched =
      href === slug ||
      href === base ||
      href.startsWith(slug) ||
      href.startsWith(`${base}/`) ||
      href.startsWith(`/api${slug}`) ||
      href.startsWith(`/api${base}/`);
    if (matched) return { slug, replacement };
  }
  return null;
}

function scanFile(filePath) {
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const isJson = JSON_EXTENSIONS.test(filePath);
  const lines = content.split('\n');
  const hits = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isJson) {
      JSON_NAV_PATTERN.lastIndex = 0;
      let match;
      while ((match = JSON_NAV_PATTERN.exec(line)) !== null) {
        const href = match[2];
        const dep = matchesDeprecated(href);
        if (dep) {
          hits.push({
            file: relative(ROOT, filePath),
            line: i + 1,
            content: line.trim(),
            route: dep.slug,
            replacement: dep.replacement,
            href,
          });
        }
      }
      continue;
    }

    if (isServerRouteDefinition(line)) continue;

    NAV_PATTERN.lastIndex = 0;
    let match;
    while ((match = NAV_PATTERN.exec(line)) !== null) {
      const href = match[1];
      const dep = matchesDeprecated(href);
      if (dep) {
        hits.push({
          file: relative(ROOT, filePath),
          line: i + 1,
          content: line.trim(),
          route: dep.slug,
          replacement: dep.replacement,
          href,
        });
      }
    }
  }

  return hits;
}

function main() {

  const SCAN_DIRS = [join(ROOT, 'artifacts'), join(ROOT, 'packages'), join(ROOT, 'scripts')];

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
    process.exit(0);
  }

  const byFile = new Map();
  for (const hit of allHits) {
    if (!byFile.has(hit.file)) byFile.set(hit.file, []);
    byFile.get(hit.file).push(hit);
  }

  for (const [_file, hits] of byFile) {
    for (const _hit of hits) {
    }
  }
  process.exit(1);
}

main();
