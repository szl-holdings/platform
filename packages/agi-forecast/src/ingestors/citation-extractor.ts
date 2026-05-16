import { extract, type ExtractionRequest, type ExtractionResult } from '@workspace/langextract-bridge';
import { assertAllowedLicense } from '../licenses.js';

export interface CitationExtractionInput {
  readonly sourceUrl: string;
  readonly sourceText: string;
  readonly sourceLicense: string;
  readonly model?: string;
}

export interface ExtractedCitation {
  readonly kind: 'paper' | 'dataset' | 'benchmark' | 'org';
  readonly text: string;
  readonly startChar: number;
  readonly endChar: number;
}

export interface CitationExtractionResult {
  readonly ok: true;
  readonly sourceUrl: string;
  readonly citations: ReadonlyArray<ExtractedCitation>;
  readonly cacheKey: string;
  readonly producedAt: string;
}

const CITATION_PROMPT =
  'Extract every citation of a research paper, public dataset, public benchmark, or research org from the source text. ' +
  'Use the exact substring from the source. Do not paraphrase. ' +
  'Use class="paper" for academic papers, "dataset" for datasets, "benchmark" for evals/benchmarks, "org" for research organizations.';

const CITATION_EXAMPLES: ExtractionRequest['examples'] = [
  {
    text: 'Per Epoch AI, GPT-5 reaches 71% on GPQA Diamond, up from 60% for o3.',
    extractions: [
      { class: 'org', text: 'Epoch AI' },
      { class: 'benchmark', text: 'GPQA Diamond' },
    ],
  },
  {
    text: 'METR\'s autonomy evals show a doubling roughly every 7 months on SWE-bench Verified.',
    extractions: [
      { class: 'org', text: 'METR' },
      { class: 'benchmark', text: 'SWE-bench Verified' },
    ],
  },
];

const ALLOWED_CITATION_KINDS = new Set<ExtractedCitation['kind']>(['paper', 'dataset', 'benchmark', 'org']);

/**
 * Extract citations from a public source via the langextract bridge.
 *
 * Doctrine notes:
 * - `sourceLicense` MUST be in the agi-forecast license allowlist; we
 *   refuse to ingest from sources we cannot redistribute attribution for.
 * - This call is cache-only by default (deterministic replay). Pass
 *   `mode: 'live'` (via the bridge) only when intentionally refreshing
 *   the cache outside of replay runs.
 */
export async function extractCitations(
  input: CitationExtractionInput,
  options: { readonly cacheDir: string; readonly mode?: 'cache-only' | 'live' },
): Promise<CitationExtractionResult> {
  assertAllowedLicense(input.sourceLicense);

  const request: ExtractionRequest = {
    model: input.model ?? 'gemini-2.5-flash',
    promptDescription: CITATION_PROMPT,
    examples: CITATION_EXAMPLES,
    sourceText: input.sourceText,
  };

  const result: ExtractionResult = await extract(request, {
    cacheDir: options.cacheDir,
    mode: options.mode ?? 'cache-only',
  });

  const citations: ExtractedCitation[] = [];
  for (const hit of result.hits) {
    if (!ALLOWED_CITATION_KINDS.has(hit.class as ExtractedCitation['kind'])) continue;
    citations.push({
      kind: hit.class as ExtractedCitation['kind'],
      text: hit.text,
      startChar: hit.startChar,
      endChar: hit.endChar,
    });
  }

  return {
    ok: true,
    sourceUrl: input.sourceUrl,
    citations,
    cacheKey: result.cacheKey,
    producedAt: result.producedAt,
  };
}
