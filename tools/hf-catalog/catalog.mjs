#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCHEMA = 'szl.hf-catalog-snapshot/v1';
export const ORGANIZATION = 'SZLHOLDINGS';
export const ASSET_TYPES = Object.freeze(['models', 'datasets', 'spaces']);
export const DEFAULT_PAGE_SIZE = 100;
export const DEFAULT_TIMEOUT_MS = 15_000;
export const DEFAULT_MAX_PAGES = 100;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DEFAULT_SNAPSHOT_PATH = resolve(
  ROOT,
  'artifacts',
  'huggingface-public-catalog.snapshot.json',
);
export const LEGACY_MANIFEST_PATH = resolve(ROOT, 'replit-sync', 'HF_ASSET_MANIFEST.json');

function parseInteger(value, name, { min, max }) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer from ${min} through ${max}`);
  }
  return parsed;
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function isCanonicalIsoTimestamp(value) {
  if (typeof value !== 'string') return false;
  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString() === value;
}

function errorCode(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[^A-Z0-9_:-]/gi, '_').slice(0, 160);
}

export function parseNextLink(linkHeader) {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(',')) {
    const match = part.trim().match(/^<([^>]+)>\s*;(.*)$/);
    if (!match) continue;
    const parameters = match[2]
      .split(';')
      .map((value) => value.trim())
      .filter(Boolean);
    if (parameters.some((value) => /^rel=(?:"next"|next)$/i.test(value))) {
      return match[1];
    }
  }
  return null;
}

export function validateNextUrl(value, { type, organization, pageSize }) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'huggingface.co') {
    throw new Error('UNTRUSTED_PAGINATION_URL');
  }
  if (url.pathname !== `/api/${type}`) {
    throw new Error('PAGINATION_PATH_CHANGED');
  }
  if (url.searchParams.get('author') !== organization) {
    throw new Error('PAGINATION_AUTHOR_CHANGED');
  }
  if (Number(url.searchParams.get('limit')) !== pageSize) {
    throw new Error('PAGINATION_LIMIT_CHANGED');
  }
  if (url.username || url.password || url.hash) {
    throw new Error('UNTRUSTED_PAGINATION_URL');
  }
  return url.toString();
}

export async function fetchAssetIds(
  type,
  {
    organization = ORGANIZATION,
    pageSize = DEFAULT_PAGE_SIZE,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxPages = DEFAULT_MAX_PAGES,
    fetchImpl = globalThis.fetch,
  } = {},
) {
  if (!ASSET_TYPES.includes(type)) throw new Error(`UNSUPPORTED_ASSET_TYPE:${type}`);
  parseInteger(pageSize, 'pageSize', { min: 1, max: 100 });
  parseInteger(timeoutMs, 'timeoutMs', { min: 1, max: 60_000 });
  parseInteger(maxPages, 'maxPages', { min: 1, max: 1_000 });
  if (typeof fetchImpl !== 'function') throw new Error('FETCH_UNAVAILABLE');

  let nextUrl = new URL(`https://huggingface.co/api/${type}`);
  nextUrl.searchParams.set('author', organization);
  nextUrl.searchParams.set('limit', String(pageSize));

  const visited = new Set();
  const ids = [];
  let pages = 0;

  while (nextUrl) {
    const current = nextUrl.toString();
    if (visited.has(current)) throw new Error('PAGINATION_LOOP');
    if (pages >= maxPages) throw new Error('PAGINATION_PAGE_LIMIT');
    visited.add(current);
    pages += 1;

    const response = await fetchImpl(current, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'szl-platform-hf-catalog-audit/1',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`HF_HTTP_${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload)) throw new Error('HF_RESPONSE_NOT_ARRAY');

    for (const item of payload) {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string') {
        throw new Error('HF_ASSET_ID_MISSING');
      }
      if (!item.id.startsWith(`${organization}/`)) {
        throw new Error('HF_ASSET_OWNER_MISMATCH');
      }
      ids.push(item.id);
    }

    const link = parseNextLink(response.headers.get('link'));
    if (!link) {
      if (payload.length >= pageSize) throw new Error('PAGINATION_COMPLETENESS_UNPROVEN');
      nextUrl = null;
    } else {
      nextUrl = new URL(validateNextUrl(link, { type, organization, pageSize }));
    }
  }

  if (new Set(ids).size !== ids.length) throw new Error('DUPLICATE_ASSET_ID');
  return { count: ids.length, ids: ids.sort(), pages };
}

export async function fetchLiveSnapshot({
  organization = ORGANIZATION,
  pageSize = DEFAULT_PAGE_SIZE,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxPages = DEFAULT_MAX_PAGES,
  fetchImpl = globalThis.fetch,
  now = new Date(),
} = {}) {
  const entries = await Promise.all(
    ASSET_TYPES.map(async (type) => [
      type,
      await fetchAssetIds(type, {
        organization,
        pageSize,
        timeoutMs,
        maxPages,
        fetchImpl,
      }),
    ]),
  );

  return {
    schema: SCHEMA,
    organization,
    observedAt: now.toISOString(),
    evidenceLabel: 'MEASURED',
    source: {
      apiBase: 'https://huggingface.co/api',
      pagination: 'RFC_LINK_CURSOR',
      pageSize,
      completenessRule:
        'Follow rel=next cursor links to exhaustion; reject a full terminal page without a next link.',
    },
    assets: Object.fromEntries(entries),
  };
}

export function validateSnapshot(snapshot) {
  const errors = [];
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return ['snapshot must be an object'];
  }
  if (snapshot.schema !== SCHEMA) errors.push(`schema must be ${SCHEMA}`);
  if (snapshot.organization !== ORGANIZATION) {
    errors.push(`organization must be ${ORGANIZATION}`);
  }
  if (snapshot.evidenceLabel !== 'MEASURED') {
    errors.push('evidenceLabel must be MEASURED');
  }
  if (!isCanonicalIsoTimestamp(snapshot.observedAt)) {
    errors.push('observedAt must be a canonical ISO timestamp');
  }
  if (
    snapshot.source?.apiBase !== 'https://huggingface.co/api' ||
    snapshot.source?.pagination !== 'RFC_LINK_CURSOR'
  ) {
    errors.push('source must identify the Hugging Face API and cursor-link pagination');
  }

  const assetKeys =
    snapshot.assets && typeof snapshot.assets === 'object'
      ? Object.keys(snapshot.assets).sort()
      : [];
  if (JSON.stringify(assetKeys) !== JSON.stringify([...ASSET_TYPES].sort())) {
    errors.push(`assets must contain exactly ${ASSET_TYPES.join(', ')}`);
  }

  for (const type of ASSET_TYPES) {
    const entry = snapshot.assets?.[type];
    if (!entry || typeof entry !== 'object') {
      errors.push(`${type} entry is missing`);
      continue;
    }
    if (!Array.isArray(entry.ids)) {
      errors.push(`${type}.ids must be an array`);
      continue;
    }
    if (!Number.isInteger(entry.count) || entry.count !== entry.ids.length) {
      errors.push(`${type}.count must equal ids.length`);
    }
    if (!Number.isInteger(entry.pages) || entry.pages < 1) {
      errors.push(`${type}.pages must be a positive integer`);
    }
    if (entry.ids.some((id) => typeof id !== 'string' || !id.startsWith(`${ORGANIZATION}/`))) {
      errors.push(`${type}.ids must contain only ${ORGANIZATION} asset IDs`);
    }
    if (new Set(entry.ids).size !== entry.ids.length) {
      errors.push(`${type}.ids must not contain duplicates`);
    }
    if (JSON.stringify(entry.ids) !== JSON.stringify(sortedUnique(entry.ids))) {
      errors.push(`${type}.ids must be unique and lexically sorted`);
    }
  }
  return errors;
}

export function validateLegacyManifestBoundary(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return ['legacy manifest must be an object'];
  }
  if (manifest._meta?.hf_org !== ORGANIZATION) {
    errors.push(`legacy manifest hf_org must be ${ORGANIZATION}`);
  }
  if (manifest._meta?.evidence_label !== 'HISTORICAL') {
    errors.push('legacy manifest evidence_label must be HISTORICAL');
  }
  if (manifest._meta?.counts_scope !== 'TRACKED_DECLARATIONS_NOT_LIVE_HUB') {
    errors.push('legacy manifest counts_scope must distinguish declarations from live Hub state');
  }
  if (
    manifest._meta?.live_catalog_snapshot !== 'artifacts/huggingface-public-catalog.snapshot.json'
  ) {
    errors.push('legacy manifest must point to the current live catalog snapshot');
  }
  if (typeof manifest._meta?.counts_note !== 'string' || manifest._meta.counts_note.length < 20) {
    errors.push('legacy manifest must explain the historical count boundary');
  }
  return errors;
}

export function compareSnapshots(expected, actual) {
  const assets = {};
  let changed = false;
  for (const type of ASSET_TYPES) {
    const expectedIds = new Set(expected.assets[type].ids);
    const actualIds = new Set(actual.assets[type].ids);
    const added = actual.assets[type].ids.filter((id) => !expectedIds.has(id));
    const removed = expected.assets[type].ids.filter((id) => !actualIds.has(id));
    if (added.length > 0 || removed.length > 0) changed = true;
    assets[type] = {
      expectedCount: expected.assets[type].count,
      observedCount: actual.assets[type].count,
      added,
      removed,
    };
  }
  return { status: changed ? 'DRIFT' : 'MATCH', assets };
}

export function loadSnapshot(path = DEFAULT_SNAPSHOT_PATH) {
  if (!existsSync(path)) throw new Error(`SNAPSHOT_MISSING:${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function renderMarkdown(report) {
  const lines = ['## Hugging Face public catalog advisory', '', `Status: **${report.status}**`, ''];
  if (report.status === 'UNAVAILABLE') {
    lines.push(`Reason: \`${report.reason}\``);
    return `${lines.join('\n')}\n`;
  }
  lines.push('| Asset type | Tracked | Observed | Added | Removed |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const type of ASSET_TYPES) {
    const entry = report.assets[type];
    lines.push(
      `| ${type} | ${entry.expectedCount} | ${entry.observedCount} | ${entry.added.length} | ${entry.removed.length} |`,
    );
  }
  lines.push('');
  lines.push(
    'This scheduled probe is advisory. Catalog drift and upstream availability do not fail a product build.',
  );
  return `${lines.join('\n')}\n`;
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const snapshotPath = resolve(argumentValue('--snapshot') ?? DEFAULT_SNAPSHOT_PATH);
  const pageSize = parseInteger(argumentValue('--page-size') ?? DEFAULT_PAGE_SIZE, 'pageSize', {
    min: 1,
    max: 100,
  });
  const format = argumentValue('--format') ?? 'json';

  if (process.argv.includes('--check')) {
    const snapshot = loadSnapshot(snapshotPath);
    const legacyManifest = JSON.parse(readFileSync(LEGACY_MANIFEST_PATH, 'utf8'));
    const errors = [
      ...validateSnapshot(snapshot),
      ...validateLegacyManifestBoundary(legacyManifest),
    ];
    if (errors.length > 0) {
      for (const error of errors) process.stderr.write(`FAIL ${error}\n`);
      process.exit(1);
    }
    process.stdout.write(
      `Hugging Face catalog snapshot is structurally valid: ${ASSET_TYPES.map(
        (type) => `${type}=${snapshot.assets[type].count}`,
      ).join(' ')}.\n`,
    );
    return;
  }

  if (process.argv.includes('--refresh')) {
    const snapshot = await fetchLiveSnapshot({ pageSize });
    const errors = validateSnapshot(snapshot);
    if (errors.length > 0) throw new Error(`GENERATED_SNAPSHOT_INVALID:${errors.join('|')}`);
    writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    process.stdout.write(`Wrote ${snapshotPath}.\n`);
    return;
  }

  if (process.argv.includes('--probe-live')) {
    const tracked = loadSnapshot(snapshotPath);
    const trackedErrors = validateSnapshot(tracked);
    if (trackedErrors.length > 0) {
      throw new Error(`TRACKED_SNAPSHOT_INVALID:${trackedErrors.join('|')}`);
    }
    let report;
    try {
      const live = await fetchLiveSnapshot({ pageSize });
      report = {
        schema: 'szl.hf-catalog-drift/v1',
        checkedAt: new Date().toISOString(),
        ...compareSnapshots(tracked, live),
      };
    } catch (error) {
      report = {
        schema: 'szl.hf-catalog-drift/v1',
        checkedAt: new Date().toISOString(),
        status: 'UNAVAILABLE',
        reason: errorCode(error),
      };
    }
    process.stdout.write(
      format === 'markdown' ? renderMarkdown(report) : `${JSON.stringify(report, null, 2)}\n`,
    );
    if (report.status === 'UNAVAILABLE') process.exitCode = 2;
    return;
  }

  process.stderr.write(
    'Usage: catalog.mjs --check | --refresh | --probe-live [--snapshot PATH] [--page-size N] [--format json|markdown]\n',
  );
  process.exit(2);
}

const entry = process.argv[1] ? resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) {
  await main();
}
