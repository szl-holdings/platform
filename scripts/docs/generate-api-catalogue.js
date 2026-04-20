#!/usr/bin/env node
/**
 * generate-api-catalogue.js
 *
 * Reads lib/api-spec/openapi.yaml and writes API-CATALOGUE.md — a structured
 * Markdown endpoint table grouped by tag.  Run this whenever the OpenAPI spec
 * changes to keep the human-readable catalogue accurate.
 *
 * Usage:
 *   node scripts/docs/generate-api-catalogue.js          # write API-CATALOGUE.md
 *   node scripts/docs/generate-api-catalogue.js --check  # exit 1 if file is stale
 *   node scripts/docs/generate-api-catalogue.js --stdout # print to stdout only
 *
 * CI integration:
 *   The .github/workflows/ci.yml "docs-generate" job runs this automatically.
 *   In --check mode it exits non-zero if API-CATALOGUE.md is out of date, making
 *   the gate advisory (set continue-on-error: true to keep it non-blocking).
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

const SPEC_PATH = join(ROOT, 'lib', 'api-spec', 'openapi.yaml');
const OUT_PATH = join(ROOT, 'API-CATALOGUE.md');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
const METHOD_ORDER = { get: 0, post: 1, put: 2, patch: 3, delete: 4, head: 5, options: 6 };

// ─── parse args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const CHECK_MODE = args.includes('--check');
const STDOUT_MODE = args.includes('--stdout');

// ─── load spec ───────────────────────────────────────────────────────────────
if (!existsSync(SPEC_PATH)) {
  console.error(`ERROR: OpenAPI spec not found at ${SPEC_PATH}`);
  process.exit(1);
}

const raw = readFileSync(SPEC_PATH, 'utf8');
const spec = parse(raw);

const info = spec.info || {};
const tags = spec.tags || [];
const paths = spec.paths || {};
const servers = spec.servers || [];

const baseUrl = servers[0]?.url ?? '/api';
const specVersion = info.version ?? 'unknown';

// ─── collect operations ───────────────────────────────────────────────────────
// operations: { tag → [ { method, path, operationId, summary, deprecated } ] }
const tagMap = new Map(); // preserves declaration order from spec.tags
const UNTAGGED = '__untagged__';

// seed from declared tags so we get their descriptions too
const tagMeta = new Map();
for (const t of tags) {
  tagMeta.set(t.name, t.description ?? '');
  tagMap.set(t.name, []);
}
tagMap.set(UNTAGGED, []);

let totalOps = 0;

for (const [rawPath, pathItem] of Object.entries(paths)) {
  const pathLevelParams = pathItem.parameters ?? [];

  for (const method of HTTP_METHODS) {
    const op = pathItem[method];
    if (!op) continue;

    totalOps++;
    const opTags = op.tags?.length ? op.tags : [UNTAGGED];

    for (const tag of opTags) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag).push({
        method,
        path: rawPath,
        operationId: op.operationId ?? '',
        summary: op.summary ?? '',
        deprecated: op.deprecated ?? false,
        security: op.security !== undefined ? op.security : (spec.security ?? []),
      });
    }
  }
}

// sort each tag's operations: by path then method weight
for (const [, ops] of tagMap) {
  ops.sort((a, b) => {
    const pc = a.path.localeCompare(b.path);
    return pc !== 0 ? pc : (METHOD_ORDER[a.method] ?? 99) - (METHOD_ORDER[b.method] ?? 99);
  });
}

// ─── generate Markdown ────────────────────────────────────────────────────────
const lines = [];
const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

lines.push(`# API Catalogue — ${info.title ?? 'Platform API'}`);
lines.push('');
lines.push('> **Auto-generated** from `lib/api-spec/openapi.yaml` — do not edit by hand.');
lines.push(
  `> Last generated: **${now}** | Spec version: **${specVersion}** | Base URL: \`${baseUrl}\``,
);
lines.push('');
lines.push('Run `pnpm docs:generate` to refresh after editing the spec.');
lines.push('');

// stats table
lines.push('## Summary');
lines.push('');
lines.push('| Metric | Value |');
lines.push('|--------|-------|');
lines.push(`| Total paths | ${Object.keys(paths).length} |`);
lines.push(`| Total operations | ${totalOps} |`);
lines.push(`| Tag groups | ${tagMap.size - (tagMap.get(UNTAGGED)?.length ? 0 : 1)} |`);
lines.push(`| Spec version | ${specVersion} |`);
lines.push('');

// Pre-compute unique anchors to avoid collision between tags that differ only
// by case or punctuation (e.g. "auth" and "Auth" both normalise to "auth").
// Duplicates receive a numeric suffix: auth, auth-2, auth-3, …
const anchorMap = new Map(); // tag → unique anchor string
const seenAnchors = new Map(); // base anchor → count of times seen so far
for (const [tag] of tagMap) {
  const base = (tag === UNTAGGED ? 'untagged' : tag)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const count = (seenAnchors.get(base) ?? 0) + 1;
  seenAnchors.set(base, count);
  anchorMap.set(tag, count === 1 ? base : `${base}-${count}`);
}

// TOC
lines.push('## Table of Contents');
lines.push('');
for (const [tag, ops] of tagMap) {
  if (tag === UNTAGGED && !ops.length) continue;
  const anchor = anchorMap.get(tag);
  const label = tag === UNTAGGED ? 'Untagged' : tag;
  lines.push(`- [${label}](#${anchor}) (${ops.length} endpoint${ops.length === 1 ? '' : 's'})`);
}
lines.push('');

// per-tag sections
for (const [tag, ops] of tagMap) {
  if (tag === UNTAGGED && !ops.length) continue;

  const label = tag === UNTAGGED ? 'Untagged' : tag;
  const anchor = anchorMap.get(tag);
  const desc = tagMeta.get(tag) ?? '';

  // Use an explicit HTML anchor so the heading text can stay as-is even when
  // GitHub normalises headings differently from our anchor generation logic.
  lines.push(`<a id="${anchor}"></a>`);
  lines.push('');
  lines.push(`## ${label}`);
  lines.push('');
  if (desc) {
    lines.push(desc);
    lines.push('');
  }

  if (!ops.length) {
    lines.push('_No operations defined for this tag._');
    lines.push('');
    continue;
  }

  lines.push('| Method | Path | Operation ID | Summary |');
  lines.push('|--------|------|-------------|---------|');

  for (const op of ops) {
    const methodBadge = op.deprecated
      ? `~~\`${op.method.toUpperCase()}\`~~`
      : `\`${op.method.toUpperCase()}\``;
    const pathCell = op.deprecated ? `~~${op.path}~~` : op.path;
    const idCell = op.operationId ? `\`${op.operationId}\`` : '—';
    const summaryCell = op.summary || '—';
    lines.push(`| ${methodBadge} | ${pathCell} | ${idCell} | ${summaryCell} |`);
  }
  lines.push('');
}

lines.push('---');
lines.push('');
lines.push(
  '_This file is auto-generated. Edit `lib/api-spec/openapi.yaml` to update the spec, then run `pnpm docs:generate`._',
);
lines.push('');

const output = lines.join('\n');

// ─── handle modes ─────────────────────────────────────────────────────────────
if (STDOUT_MODE) {
  process.stdout.write(output);
  process.exit(0);
}

if (CHECK_MODE) {
  const existing = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, 'utf8') : '';
  // Compare everything after the "Last generated:" line (date changes each run)
  const normalize = (s) => s.replace(/Last generated: \*\*[0-9-]+\*\*/, 'Last generated: **DATE**');
  if (normalize(existing) === normalize(output)) {
    console.log('✓ API-CATALOGUE.md is up to date.');
    process.exit(0);
  } else {
    console.error('✗ API-CATALOGUE.md is stale. Run `pnpm docs:generate` to refresh.');
    process.exit(1);
  }
}

writeFileSync(OUT_PATH, output, 'utf8');
console.log(
  `✓ API-CATALOGUE.md written (${Object.keys(paths).length} paths, ${totalOps} operations)`,
);
