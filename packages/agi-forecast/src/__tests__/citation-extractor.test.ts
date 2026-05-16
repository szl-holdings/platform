import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { computeCacheKey, type ExtractionResult } from '@workspace/langextract-bridge';
import { extractCitations } from '../ingestors/citation-extractor.js';

const SOURCE = 'Per Epoch AI, GPT-5 reaches 71% on GPQA Diamond, while METR autonomy tracks SWE-bench Verified.';

const PROMPT =
  'Extract every citation of a research paper, public dataset, public benchmark, or research org from the source text. ' +
  'Use the exact substring from the source. Do not paraphrase. ' +
  'Use class="paper" for academic papers, "dataset" for datasets, "benchmark" for evals/benchmarks, "org" for research organizations.';

const EXAMPLES = [
  {
    text: 'Per Epoch AI, GPT-5 reaches 71% on GPQA Diamond, up from 60% for o3.',
    extractions: [
      { class: 'org', text: 'Epoch AI' },
      { class: 'benchmark', text: 'GPQA Diamond' },
    ],
  },
  {
    text: "METR's autonomy evals show a doubling roughly every 7 months on SWE-bench Verified.",
    extractions: [
      { class: 'org', text: 'METR' },
      { class: 'benchmark', text: 'SWE-bench Verified' },
    ],
  },
];

describe('extractCitations', () => {
  let cacheDir: string;
  beforeEach(async () => {
    cacheDir = await mkdtemp(join(tmpdir(), 'citation-extractor-'));
  });
  afterEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
  });

  async function seedCache(): Promise<string> {
    const request = {
      model: 'gemini-2.5-flash',
      promptDescription: PROMPT,
      examples: EXAMPLES,
      sourceText: SOURCE,
    };
    const key = computeCacheKey(request);
    const cached: ExtractionResult = {
      request,
      hits: [
        { class: 'org', text: 'Epoch AI', startChar: 4, endChar: 12, attributes: {} },
        { class: 'benchmark', text: 'GPQA Diamond', startChar: 35, endChar: 47, attributes: {} },
        { class: 'org', text: 'METR', startChar: 56, endChar: 60, attributes: {} },
        { class: 'benchmark', text: 'SWE-bench Verified', startChar: 76, endChar: 94, attributes: {} },
        { class: 'unknown_kind', text: 'noise', startChar: 0, endChar: 1, attributes: {} },
      ],
      cacheKey: key,
      producedAt: '2026-05-16T00:00:00.000Z',
    };
    await mkdir(cacheDir, { recursive: true });
    await writeFile(join(cacheDir, `${key}.json`), JSON.stringify(cached), 'utf8');
    return key;
  }

  it('rejects sources whose license is not on the allowlist', async () => {
    await expect(
      extractCitations(
        {
          sourceUrl: 'https://example.com/x',
          sourceText: SOURCE,
          sourceLicense: 'GPL-3.0',
        },
        { cacheDir },
      ),
    ).rejects.toThrow(/license/);
  });

  it('returns only the 4 allowed-kind citations, drops unknown_kind noise', async () => {
    const key = await seedCache();
    const result = await extractCitations(
      { sourceUrl: 'https://epochai.org/x', sourceText: SOURCE, sourceLicense: 'CC-BY-4.0' },
      { cacheDir },
    );
    expect(result.cacheKey).toBe(key);
    expect(result.citations).toHaveLength(4);
    expect(result.citations.map((c) => c.kind).sort()).toEqual(['benchmark', 'benchmark', 'org', 'org']);
    expect(result.citations.find((c) => c.text === 'SWE-bench Verified')?.kind).toBe('benchmark');
  });

  it('is deterministic across 5 replays (byte-identical citation list)', async () => {
    await seedCache();
    const runs = await Promise.all(
      [0, 1, 2, 3, 4].map(() =>
        extractCitations(
          { sourceUrl: 'https://epochai.org/x', sourceText: SOURCE, sourceLicense: 'CC-BY-4.0' },
          { cacheDir },
        ).then((r) => JSON.stringify({ citations: r.citations, cacheKey: r.cacheKey })),
      ),
    );
    expect(new Set(runs).size).toBe(1);
  });

  it('throws LangExtractCacheMissError when cache is cold and mode is cache-only', async () => {
    await expect(
      extractCitations(
        { sourceUrl: 'https://epochai.org/x', sourceText: SOURCE, sourceLicense: 'CC-BY-4.0' },
        { cacheDir },
      ),
    ).rejects.toThrow(/cache miss/);
  });
});
