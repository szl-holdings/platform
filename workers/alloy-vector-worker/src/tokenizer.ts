/**
 * Token-aware text utilities backed by the same Hugging Face tokenizer that
 * the LocalCpuBackend uses for embedding. Lazy-loads the tokenizer so callers
 * that never invoke it pay no cost.
 *
 * All operations are CPU-only and synchronous after the initial async load.
 */

export interface Tokenizer {
  /** Encode text into model token IDs (no special tokens). */
  encode(text: string): number[];
  /** Decode token IDs back into a string. */
  decode(ids: number[]): string;
  /** Maximum token sequence length the underlying model accepts. */
  readonly maxModelTokens: number;
  /** Hugging Face model ID this tokenizer was loaded from. */
  readonly modelRef: string;
}

const tokenizerCache = new Map<string, Promise<Tokenizer>>();

export async function loadTokenizer(modelRef = 'Xenova/all-MiniLM-L6-v2'): Promise<Tokenizer> {
  let pending = tokenizerCache.get(modelRef);
  if (!pending) {
    pending = (async () => {
      const tf = await import('@huggingface/transformers');
      const AutoTokenizer = (
        tf as { AutoTokenizer: { from_pretrained: (m: string) => Promise<unknown> } }
      ).AutoTokenizer;
      const raw = (await AutoTokenizer.from_pretrained(modelRef)) as {
        encode: (text: string, opts?: { add_special_tokens?: boolean }) => number[];
        decode: (ids: number[], opts?: { skip_special_tokens?: boolean }) => string;
        model_max_length?: number;
      };
      const maxModelTokens =
        typeof raw.model_max_length === 'number' && Number.isFinite(raw.model_max_length)
          ? raw.model_max_length
          : 512;
      return {
        modelRef,
        maxModelTokens,
        encode(text: string): number[] {
          return raw.encode(text, { add_special_tokens: false });
        },
        decode(ids: number[]): string {
          return raw.decode(ids, { skip_special_tokens: true });
        },
      } satisfies Tokenizer;
    })();
    tokenizerCache.set(modelRef, pending);
  }
  return pending;
}

export interface TokenChunk {
  chunkIndex: number;
  tokenStart: number;
  tokenEnd: number;
  tokenCount: number;
  text: string;
  truncated: boolean;
}

export interface TokenChunkOptions {
  /** Window size in model tokens. */
  chunkSize: number;
  /** Number of overlapping tokens between adjacent windows. */
  chunkOverlap: number;
  /** Hard cap; chunks longer than this are dropped or truncated per `truncationStrategy`. */
  maxTokens: number;
  /** What to do if a window exceeds `maxTokens`. */
  truncationStrategy: 'truncate' | 'reject';
  /** Optional warning threshold (kept for parity with profile config; not enforced). */
  warnAtTokens?: number;
}

/**
 * Split text into token-bounded chunks using the supplied tokenizer. The
 * splitter never summarizes — it works directly on token IDs and decodes each
 * window back into text so downstream embedding sees the exact substring.
 */
export function chunkByTokens(
  tokenizer: Pick<Tokenizer, 'encode' | 'decode'>,
  text: string,
  opts: TokenChunkOptions,
): TokenChunk[] {
  const { chunkSize, chunkOverlap, maxTokens, truncationStrategy } = opts;
  if (chunkSize <= 0) throw new Error('chunkByTokens: chunkSize must be > 0');
  if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
    throw new Error('chunkByTokens: chunkOverlap must be in [0, chunkSize)');
  }
  if (maxTokens <= 0) throw new Error('chunkByTokens: maxTokens must be > 0');

  const ids = tokenizer.encode(text);
  if (ids.length === 0) return [];

  const effectiveSize = Math.min(chunkSize, maxTokens);
  const step = Math.max(1, effectiveSize - chunkOverlap);
  const chunks: TokenChunk[] = [];
  let cursor = 0;

  while (cursor < ids.length) {
    const end = Math.min(cursor + effectiveSize, ids.length);
    let windowIds = ids.slice(cursor, end);
    let truncated = false;

    if (windowIds.length > maxTokens) {
      if (truncationStrategy === 'reject') {
        throw new Error(
          `chunkByTokens: window of ${windowIds.length} tokens exceeds maxTokens=${maxTokens} and truncationStrategy='reject'`,
        );
      }
      windowIds = windowIds.slice(0, maxTokens);
      truncated = true;
    }

    const decoded = tokenizer.decode(windowIds);
    chunks.push({
      chunkIndex: chunks.length,
      tokenStart: cursor,
      tokenEnd: cursor + windowIds.length,
      tokenCount: windowIds.length,
      text: decoded,
      truncated,
    });

    if (end >= ids.length) break;
    cursor += step;
  }

  return chunks;
}
