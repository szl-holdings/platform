/**
 * Thesis RAG probe for the Frontier classifier.
 *
 * Replaces the keyword-bag thesisFit heuristic with a real
 * embedding+cosine-similarity check against the canonical thesis
 * corpus (`docs/thesis/v{N}-canonical.md`). The probe is wired into
 * the classifier via `registerThesisProbe()` and `scoreArtifact`
 * blends the RAG score with the existing keyword scorer (taking the
 * max), so the embedding signal can only lift thesisFit, never tank
 * a previously-routed artifact below the queue/discard thresholds.
 *
 * Default embedding backend = the Alloy Embedding Fabric:
 *   `@workspace/alloy-embed-worker` — same micro-batched, pooled,
 *   L2-normalized pipeline used by the api-server's /v1/embed route
 *   and by the rest of the platform. We default to the in-process
 *   DevHashEmbeddingBackend (zero deps, no env vars, deterministic)
 *   so the service runs in isolation; ops can opt into the
 *   CpuLocal/External backends by calling `setThesisEmbedFn()` with
 *   a custom function (e.g. routed through `/v1/embed`).
 *
 * Cost discipline:
 *   - Corpus is fetched + chunked + embedded ONCE on first probe.
 *   - Per-artifact embeddings are LRU-cached by artifact.id so
 *     repeated scoring (re-pulls, retries, operator re-review)
 *     costs zero additional embed calls.
 *   - LRU touch-on-read keeps "hot" artifact ids resident; FIFO
 *     eviction would drop a recently-scored item just because it
 *     was inserted earliest.
 *
 * Fallback chain:
 *   1. RAG cosine sim against thesis chunks (this module)
 *   2. Keyword scorer in classifier.ts (preserved as fallback)
 *   3. If both yield 0, thesisFit floors at the keyword score.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DevHashEmbeddingBackend, getDefaultEmbedWorker } from '@workspace/alloy-embed-worker';
import { registerThesisProbe, type ThesisProbe } from './classifier.js';
import type { FrontierArtifact } from './types.js';

const CHUNK_MIN_CHARS = 280;
const CHUNK_MAX_CHARS = 1_400;
const ARTIFACT_CACHE_MAX = 512;
const TOP_K_CITATIONS = 3;

export type ThesisEmbedFn = (texts: string[]) => Promise<number[][]>;

interface ThesisChunk {
  docId: string;
  heading: string;
  text: string;
  vector: number[];
}

// --- Default embedder: the Alloy Embedding Fabric ----------------------------
//
// We instantiate a single DevHashEmbeddingBackend (the fabric's
// zero-dependency deterministic backend) and route every embed call
// through its `embed()` method — the same `EmbeddingBackend`
// interface CpuLocalEmbeddingBackend and ExternalHttpEmbeddingBackend
// implement. Swapping in a network-backed embedder later is a single
// `setThesisEmbedFn()` call from api-server bootstrap.

const fabricBackend = new DevHashEmbeddingBackend();

const fabricEmbed: ThesisEmbedFn = async (texts) => {
  if (texts.length === 0) return [];
  const resp = await fabricBackend.embed({
    texts,
    model: fabricBackend.descriptor.supportedModels[0] ?? 'aef-dev-hash',
    pooling: fabricBackend.descriptor.defaultPooling,
    normalize: true,
  });
  return resp.vectors;
};

let embedFn: ThesisEmbedFn = fabricEmbed;
let corpus: ThesisChunk[] | null = null;
let corpusLoadPromise: Promise<ThesisChunk[]> | null = null;

// LRU cache: Map preserves insertion order. On every read we delete
// and re-insert the key so the most-recently-touched id moves to the
// end; eviction removes the first key (true LRU).
const artifactVectorCache = new Map<string, number[]>();

function touch(id: string, vec: number[]): number[] {
  artifactVectorCache.delete(id);
  artifactVectorCache.set(id, vec);
  while (artifactVectorCache.size > ARTIFACT_CACHE_MAX) {
    const oldest = artifactVectorCache.keys().next().value;
    if (oldest === undefined) break;
    artifactVectorCache.delete(oldest);
  }
  return vec;
}

function readLruCache(id: string): number[] | undefined {
  const v = artifactVectorCache.get(id);
  if (v === undefined) return undefined;
  // Touch on read — move to most-recent end of the LRU list.
  artifactVectorCache.delete(id);
  artifactVectorCache.set(id, v);
  return v;
}

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  const c = dot / Math.sqrt(na * nb);
  if (!Number.isFinite(c)) return 0;
  if (c < 0) return 0;
  if (c > 1) return 1;
  return c;
}

/**
 * Locate `docs/thesis/` relative to this source file. The service is
 * a workspace package, so walking up from src/ finds the repo root
 * regardless of where the consuming process was launched from.
 */
function findThesisDir(): string | null {
  const here = dirname(fileURLToPath(import.meta.url));
  let dir = here;
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, 'docs', 'thesis');
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Split a markdown doc into chunks at `##`/`###`/`####` heading
 * boundaries. Long sections are sliced into CHUNK_MAX_CHARS windows;
 * tiny sections are merged into the previous chunk so we don't emit
 * 1-line preamble chunks that dilute the cosine ranking.
 */
function chunkMarkdown(docId: string, md: string): ThesisChunk[] {
  const lines = md.split('\n');
  const sections: { heading: string; body: string }[] = [];
  let currentHeading = docId;
  let buf: string[] = [];
  const flush = () => {
    const body = buf.join('\n').trim();
    if (body.length > 0) sections.push({ heading: currentHeading, body });
    buf = [];
  };
  for (const line of lines) {
    const h = /^#{2,4}\s+(.+?)\s*$/.exec(line);
    if (h) {
      flush();
      currentHeading = h[1] ?? currentHeading;
      continue;
    }
    buf.push(line);
  }
  flush();

  const chunks: ThesisChunk[] = [];
  for (const sec of sections) {
    if (sec.body.length <= CHUNK_MAX_CHARS) {
      if (sec.body.length < CHUNK_MIN_CHARS && chunks.length > 0) {
        const prev = chunks[chunks.length - 1]!;
        prev.text = `${prev.text}\n\n${sec.body}`;
        continue;
      }
      chunks.push({ docId, heading: sec.heading, text: sec.body, vector: [] });
      continue;
    }
    for (let i = 0; i < sec.body.length; i += CHUNK_MAX_CHARS) {
      chunks.push({
        docId,
        heading: sec.heading,
        text: sec.body.slice(i, i + CHUNK_MAX_CHARS),
        vector: [],
      });
    }
  }
  return chunks;
}

async function loadCorpus(): Promise<ThesisChunk[]> {
  if (corpus !== null) return corpus;
  if (corpusLoadPromise !== null) return corpusLoadPromise;
  corpusLoadPromise = (async () => {
    const dir = findThesisDir();
    if (!dir) {
      corpus = [];
      return corpus;
    }
    let files: string[];
    try {
      files = readdirSync(dir).filter((f) => /^v\d+-canonical\.md$/.test(f));
    } catch {
      corpus = [];
      return corpus;
    }
    if (files.length === 0) {
      corpus = [];
      return corpus;
    }
    // Newest-version-first so current canonical doc seeds top citations.
    files.sort((a, b) => {
      const va = Number(/^v(\d+)/.exec(a)?.[1] ?? '0');
      const vb = Number(/^v(\d+)/.exec(b)?.[1] ?? '0');
      return vb - va;
    });

    const raw: { docId: string; heading: string; text: string }[] = [];
    for (const f of files) {
      const docId = f.replace(/\.md$/, '');
      let body = '';
      try {
        body = readFileSync(join(dir, f), 'utf8');
      } catch {
        continue;
      }
      for (const c of chunkMarkdown(docId, body)) {
        raw.push({ docId: c.docId, heading: c.heading, text: c.text });
      }
    }
    if (raw.length === 0) {
      corpus = [];
      return corpus;
    }

    let vectors: number[][] = [];
    try {
      // Single batched fabric call for the whole corpus — bounded
      // cost (one embed per service lifetime, not per discovery).
      vectors = await embedFn(raw.map((r) => r.text));
    } catch {
      corpus = [];
      return corpus;
    }

    const out: ThesisChunk[] = [];
    for (let i = 0; i < raw.length; i++) {
      const v = vectors[i];
      if (!v || v.length === 0) continue;
      const r = raw[i]!;
      out.push({ docId: r.docId, heading: r.heading, text: r.text, vector: v });
    }
    corpus = out;
    return corpus;
  })();
  return corpusLoadPromise;
}

async function embedArtifact(a: FrontierArtifact): Promise<number[]> {
  const cached = readLruCache(a.id);
  if (cached) return cached;
  const text = [a.title, a.summary ?? '', a.tags.join(' ')]
    .filter((s) => s.length > 0)
    .join('\n');
  let vec: number[] = [];
  try {
    const out = await embedFn([text]);
    vec = out[0] ?? [];
  } catch {
    vec = [];
  }
  touch(a.id, vec);
  return vec;
}

/**
 * The default thesis probe registered with the classifier. Async —
 * scoreArtifact awaits it. Returns undefined when the corpus is
 * empty so the classifier transparently falls back to its keyword
 * scorer rather than fabricating a zero score.
 */
export const defaultThesisProbe: ThesisProbe = async (artifact) => {
  const chunks = await loadCorpus();
  if (chunks.length === 0) return undefined;
  const av = await embedArtifact(artifact);
  if (av.length === 0) return undefined;

  // Top-K mean is more stable than single-best (which can spike on a
  // tangential keyword collision) while still rewarding artifacts
  // that resonate strongly with a few thesis sections rather than
  // weakly with all of them.
  const scored = chunks.map((c) => ({ c, s: cosine(av, c.vector) }));
  scored.sort((x, y) => y.s - x.s);
  const top = scored.slice(0, TOP_K_CITATIONS);
  if (top.length === 0) return undefined;

  const meanTop = top.reduce((acc, x) => acc + x.s, 0) / top.length;
  // Cosine on the fabric's hashed vectors saturates well below 1.0
  // for even highly-related texts; rescale into roughly [0,1] so the
  // downstream Lutar axis floors and queue/auto-promote thresholds
  // stay calibrated. scoreArtifact additionally takes the max of
  // (RAG, keyword) so this can only lift thesisFit, never depress it.
  const score = Math.min(1, meanTop * 2.5);

  const citations = top
    .filter((x) => x.s > 0.05)
    .map((x) => `${x.c.docId}#${x.c.heading} (cos=${x.s.toFixed(2)})`);

  return citations.length > 0 ? { score, citations } : { score };
};

/**
 * Install the default thesis-RAG probe. Idempotent; safe to call
 * from any process that imports the service. The corpus is embedded
 * lazily on first probe call (no startup cost). Returns true once
 * the probe is registered — the corpus may still be empty in which
 * case the probe will return undefined and the keyword fallback
 * runs.
 */
export function installDefaultThesisProbe(): boolean {
  registerThesisProbe(defaultThesisProbe);
  return true;
}

/**
 * Pre-warm the corpus by triggering the one-time embed call ahead
 * of the first artifact scoring. Optional — purely a latency
 * optimization for the first pull.
 */
export async function prewarmThesisCorpus(): Promise<number> {
  const chunks = await loadCorpus();
  return chunks.length;
}

/**
 * Build a ThesisEmbedFn that routes through the Alloy Embedding
 * Fabric's micro-batched worker queue (same queue powering `/v1/embed`).
 * Uses the `cpu-local` backend by default — that backend talks to the
 * substrate-py-workers BGE-M3 service, which gives real semantic
 * embeddings (catches "self-distillation curriculum" ≈ "auto-evaluation
 * feedback loop") instead of the deterministic hash-bag.
 *
 * Fallback chain (per-call, never throws):
 *   1. Configured backend (default `cpu-local` / BGE-M3)
 *   2. Local DevHashEmbeddingBackend (deterministic, zero-dep)
 *   3. Empty vectors — the probe then returns `undefined` and the
 *      keyword scorer takes over.
 *
 * This is the install hook referenced from api-server bootstrap and
 * the Temporal worker: call once at startup, then
 * `installDefaultThesisProbe()` (already idempotent — auto-installs
 * on first import of `@workspace/frontier-ingest`).
 */
export function createEmbedWorkerThesisFn(opts: {
  backendId?: string;
  model?: string;
} = {}): ThesisEmbedFn {
  const backendId = opts.backendId ?? 'cpu-local';
  const model = opts.model ?? 'aef-default';

  return async (texts) => {
    if (texts.length === 0) return [];
    try {
      const { queue } = getDefaultEmbedWorker();
      const vectors = await new Promise<number[][]>((res, rej) => {
        queue.enqueue(backendId, {
          texts,
          model,
          pooling: 'mean',
          normalize: true,
          resolve: res,
          reject: rej,
        });
      });
      // Defensive: if the upstream returned the wrong shape, fall through
      // to the deterministic backend so we never poison the corpus cache
      // with empty vectors.
      if (
        Array.isArray(vectors) &&
        vectors.length === texts.length &&
        vectors.every((v) => Array.isArray(v) && v.length > 0)
      ) {
        return vectors;
      }
    } catch {
      // Swallow and fall through to the dev-hash fallback.
    }
    try {
      return await fabricEmbed(texts);
    } catch {
      return texts.map(() => [] as number[]);
    }
  };
}

/**
 * Convenience installer: swap in the worker-backed embedder and
 * register the default probe. Safe to call multiple times. Returns
 * the backend id actually wired so the caller can log it.
 */
export function installEmbedWorkerThesisProbe(opts: {
  backendId?: string;
  model?: string;
} = {}): { backendId: string; model: string } {
  const backendId = opts.backendId ?? 'cpu-local';
  const model = opts.model ?? 'aef-default';
  setThesisEmbedFn(createEmbedWorkerThesisFn({ backendId, model }));
  installDefaultThesisProbe();
  return { backendId, model };
}

/**
 * Swap in a different embedding function (e.g. routed through the
 * fabric's external HTTP backend, or through `/v1/embed`). Resets
 * the corpus + per-artifact caches so the new function gets used on
 * the next probe call.
 */
export function setThesisEmbedFn(fn: ThesisEmbedFn): void {
  embedFn = fn;
  corpus = null;
  corpusLoadPromise = null;
  artifactVectorCache.clear();
}

/**
 * Test/diagnostic helpers. Not part of the public contract.
 */
export function _resetThesisRagForTests(): void {
  embedFn = fabricEmbed;
  corpus = null;
  corpusLoadPromise = null;
  artifactVectorCache.clear();
  registerThesisProbe(undefined);
}

export async function _getCorpusSizeForTests(): Promise<number> {
  const c = await loadCorpus();
  return c.length;
}

export function _getArtifactCacheSizeForTests(): number {
  return artifactVectorCache.size;
}

// Exported helper retained for tests that want a synchronous
// embedding (the previous default). Pure CPU, no I/O.
export function featureHashEmbed(text: string, dim = 256): number[] {
  const vec = new Array<number>(dim).fill(0);
  const re = /[a-z0-9][a-z0-9\-_]{2,}/g;
  const lower = text.toLowerCase();
  let m: RegExpExecArray | null;
  let any = false;
  while ((m = re.exec(lower)) !== null) {
    any = true;
    const h = createHash('sha256').update(m[0]).digest();
    const bucket =
      (((h[0]! << 24) | (h[1]! << 16) | (h[2]! << 8) | h[3]!) >>> 0) % dim;
    const sign = (h[4]! & 1) === 0 ? 1 : -1;
    vec[bucket] = (vec[bucket] ?? 0) + sign;
  }
  if (!any) return vec;
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  for (let i = 0; i < dim; i++) vec[i] = vec[i]! / norm;
  return vec;
}
