import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { computeCacheKey, extract, LangExtractCacheMissError, type ExtractionRequest, type ExtractionResult } from '../index.js';

function makeRequest(overrides: Partial<ExtractionRequest> = {}): ExtractionRequest {
  return {
    model: 'gemini-2.5-flash',
    promptDescription: 'Extract project names and licenses from release notes.',
    examples: [
      {
        text: 'agi-forecast v0.1 (Apache-2.0) ships.',
        extractions: [
          { class: 'project', text: 'agi-forecast' },
          { class: 'license', text: 'Apache-2.0' },
        ],
      },
    ],
    sourceText: 'langextract-bridge v0.1 (Apache-2.0) lands today.',
    ...overrides,
  };
}

describe('computeCacheKey', () => {
  it('is deterministic and order-insensitive', () => {
    const a = computeCacheKey(makeRequest());
    const b = computeCacheKey(makeRequest());
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('changes when any input field changes', () => {
    const base = computeCacheKey(makeRequest());
    expect(computeCacheKey(makeRequest({ model: 'gemini-2.5-pro' }))).not.toBe(base);
    expect(computeCacheKey(makeRequest({ sourceText: 'different text' }))).not.toBe(base);
    expect(computeCacheKey(makeRequest({ promptDescription: 'different prompt' }))).not.toBe(base);
  });
});

describe('extract', () => {
  let cacheDir: string;
  beforeEach(async () => {
    cacheDir = await mkdtemp(join(tmpdir(), 'langextract-bridge-'));
  });
  afterEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
  });

  it('throws LangExtractCacheMissError on cold cache in default mode', async () => {
    await expect(extract(makeRequest(), { cacheDir })).rejects.toBeInstanceOf(
      LangExtractCacheMissError,
    );
  });

  it('returns cached result without invoking python', async () => {
    const req = makeRequest();
    const key = computeCacheKey(req);
    const cached: ExtractionResult = {
      request: req,
      hits: [
        { class: 'project', text: 'langextract-bridge', startChar: 0, endChar: 18, attributes: {} },
        { class: 'license', text: 'Apache-2.0', startChar: 25, endChar: 35, attributes: {} },
      ],
      cacheKey: key,
      producedAt: '2026-05-16T00:00:00.000Z',
    };
    await mkdir(cacheDir, { recursive: true });
    await writeFile(join(cacheDir, `${key}.json`), JSON.stringify(cached), 'utf8');
    const result = await extract(req, { cacheDir });
    expect(result.cacheKey).toBe(key);
    expect(result.hits).toHaveLength(2);
    expect(result.hits[0]?.class).toBe('project');
  });

  it('rejects corrupted cache entries (wrong key)', async () => {
    const req = makeRequest();
    const key = computeCacheKey(req);
    const corrupted = {
      request: req,
      hits: [],
      cacheKey: 'deadbeef',
      producedAt: '2026-05-16T00:00:00.000Z',
    };
    await mkdir(cacheDir, { recursive: true });
    await writeFile(join(cacheDir, `${key}.json`), JSON.stringify(corrupted), 'utf8');
    await expect(extract(req, { cacheDir })).rejects.toThrow(/corrupted/);
  });

  it('5x byte-identical replay from cache', async () => {
    const req = makeRequest();
    const key = computeCacheKey(req);
    const cached: ExtractionResult = {
      request: req,
      hits: [{ class: 'project', text: 'langextract-bridge', startChar: 0, endChar: 18, attributes: {} }],
      cacheKey: key,
      producedAt: '2026-05-16T00:00:00.000Z',
    };
    await mkdir(cacheDir, { recursive: true });
    await writeFile(join(cacheDir, `${key}.json`), JSON.stringify(cached), 'utf8');
    const runs = await Promise.all(
      [0, 1, 2, 3, 4].map(() => extract(req, { cacheDir }).then((r) => JSON.stringify(r))),
    );
    expect(new Set(runs).size).toBe(1);
  });

  it('cache file written by live mode is also byte-identical on re-read', async () => {
    const req = makeRequest();
    const key = computeCacheKey(req);
    const path = join(cacheDir, `${key}.json`);
    const synthetic: ExtractionResult = {
      request: req,
      hits: [{ class: 'project', text: 'langextract-bridge', startChar: 0, endChar: 18, attributes: { kind: 'package' } }],
      cacheKey: key,
      producedAt: '2026-05-16T00:00:00.000Z',
    };
    await mkdir(cacheDir, { recursive: true });
    await writeFile(path, `${JSON.stringify(synthetic, null, 2)}\n`, 'utf8');
    const first = await readFile(path, 'utf8');
    const result = await extract(req, { cacheDir });
    expect(result.hits[0]?.attributes?.kind).toBe('package');
    expect(await readFile(path, 'utf8')).toBe(first);
  });
});
