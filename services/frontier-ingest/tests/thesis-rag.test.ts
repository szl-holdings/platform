import { afterEach, describe, expect, it } from 'vitest';
import {
  _getArtifactCacheSizeForTests,
  _getCorpusSizeForTests,
  _resetThesisRagForTests,
  classify,
  createEmbedWorkerThesisFn,
  defaultThesisProbe,
  featureHashEmbed,
  installDefaultThesisProbe,
  prewarmThesisCorpus,
  registerThesisProbe,
  scoreArtifact,
  setThesisEmbedFn,
} from '../src/index.js';
import type { FrontierArtifact } from '../src/index.js';

function art(partial: Partial<FrontierArtifact>): FrontierArtifact {
  return {
    id: 'a-1',
    provider: 'anthropic',
    kind: 'paper',
    externalId: 'ext-1',
    title: '',
    url: 'https://example.com',
    tags: [],
    discoveredAt: new Date().toISOString(),
    ...partial,
  };
}

afterEach(() => {
  _resetThesisRagForTests();
  installDefaultThesisProbe();
});

describe('thesis-rag probe', () => {
  it('loads the canonical thesis corpus and produces chunks (via embedding fabric)', async () => {
    const size = await _getCorpusSizeForTests();
    expect(size).toBeGreaterThan(0);
  });

  it('prewarmThesisCorpus() returns the corpus chunk count', async () => {
    const n = await prewarmThesisCorpus();
    expect(n).toBeGreaterThan(0);
  });

  it('feature-hash embedder yields high cosine sim for overlapping text and low for unrelated', () => {
    const a = featureHashEmbed('lutar invariant ouroboros thesis closure audit');
    const b = featureHashEmbed('ouroboros thesis lutar audit closure invariant');
    const c = featureHashEmbed('cooking pasta carbonara recipe with eggs and pancetta');
    const dot = (x: number[], y: number[]) => x.reduce((s, v, i) => s + v * (y[i] ?? 0), 0);
    expect(dot(a, b)).toBeGreaterThan(0.7);
    expect(dot(a, c)).toBeLessThan(dot(a, b));
  });

  it('thesisFit is never lower than the keyword-only score (blend = max)', async () => {
    installDefaultThesisProbe();
    const a = art({
      id: 'kw-rich',
      title: 'agent governance rag retrieval router doctrine',
      summary: 'agentic orchestration reasoning safety alignment',
      tags: ['agent', 'governance', 'rag', 'router'],
    });
    const withProbe = await scoreArtifact(a);
    registerThesisProbe(undefined);
    const kwOnly = await scoreArtifact(a);
    expect(withProbe.thesisFit).toBeGreaterThanOrEqual(kwOnly.thesisFit);
  });

  it('LRU artifact cache touches on read (recently-scored ids stay resident)', async () => {
    installDefaultThesisProbe();
    const a = art({
      id: 'cached-1',
      title: 'Reasoning, alignment, and routing for agentic orchestration',
      summary: 'Notes on RAG retrieval and inference distillation.',
      tags: ['agent', 'router'],
    });
    const first = await scoreArtifact(a);
    expect(_getArtifactCacheSizeForTests()).toBeGreaterThanOrEqual(1);
    const second = await scoreArtifact(a);
    expect(second.thesisFit).toBe(first.thesisFit);
    expect(second.composite).toBe(first.composite);
  });

  it('falls back to the keyword scorer when no probe is registered', async () => {
    registerThesisProbe(undefined);
    const score = await scoreArtifact(
      art({
        title: 'agent governance rag retrieval router doctrine',
        tags: ['agent', 'governance', 'rag', 'router'],
      }),
    );
    expect(score.thesisFit).toBeGreaterThan(0);
    expect(score.rationale.some((r) => r.startsWith('thesis-RAG:'))).toBe(false);
  });

  it('falls back gracefully when a custom embedder returns empty vectors', async () => {
    setThesisEmbedFn(async () => []);
    installDefaultThesisProbe();
    const probe = await defaultThesisProbe(
      art({ title: 'anything', summary: 'anything', tags: [] }),
    );
    expect(probe).toBeUndefined();
  });

  it('semantic embedder lifts paraphrased thesis-aligned text meaningfully above the keyword-only path', async () => {
    // Mock "semantic" embedder: maps any text containing one of a small
    // set of concept tokens onto a shared concept axis. Both the
    // canonical phrasing ("self-distillation curriculum") and a
    // lexically-disjoint paraphrase ("auto-evaluation feedback loop")
    // resolve to the same concept vector, so cosine similarity stays
    // high across paraphrases — exactly the property a real semantic
    // backend (BGE-M3 etc.) provides and the keyword scorer cannot.
    // Concept axis aggregates BOTH the doctrine's native vocabulary
    // (present in the canonical thesis corpus) AND a set of
    // paraphrase tokens that express the same ideas using language
    // the keyword scorer's THESIS bag does NOT recognize. So:
    //   - Corpus chunks mentioning "alloy"/"lutar"/"ouroboros"/...
    //     land on the concept axis.
    //   - The paraphrase artifact (zero classifier-thesis keywords)
    //     also lands on the concept axis via its paraphrase tokens.
    //   - Cosine alignment ≈ 1 → high RAG thesisFit despite kw=0.
    const CONCEPT_TOKENS = [
      // Native doctrine vocab — guaranteed to appear in canonical thesis.
      'alloy',
      'lutar',
      'ouroboros',
      'codex',
      'doctrine',
      'lambda',
      // Paraphrase vocab — semantically aligned, lexically disjoint
      // from KEYWORDS_THESIS in classifier.ts.
      'self-improving',
      'critique',
      'reflection',
      'iterative',
      'feedback',
      'curriculum',
    ];
    const DIM = 8;
    const semanticEmbed = async (texts: string[]): Promise<number[][]> => {
      return texts.map((t) => {
        const lower = t.toLowerCase();
        const hit = CONCEPT_TOKENS.some((tok) => lower.includes(tok));
        // Concept axis = unit vector on dim 0; off-axis = unit on dim 1.
        // Deterministic and L2-normalized — mimics the embedding fabric.
        const v = new Array<number>(DIM).fill(0);
        v[hit ? 0 : 1] = 1;
        return v;
      });
    };

    setThesisEmbedFn(semanticEmbed);
    installDefaultThesisProbe();

    // Paraphrase artifact: NONE of the classifier's KEYWORDS_THESIS
    // ("agent", "rag", "router", "evaluation", "distillation", ...)
    // appear in title/summary/tags, so the keyword thesis-fit floors
    // at zero. Concept tokens DO appear, so the semantic probe should
    // find tight cosine alignment with at least one corpus chunk.
    const paraphrase = art({
      id: 'paraphrase-1',
      title: 'Self-improving critique loop with reflection-based curriculum',
      summary: 'Continual reflection over iterative feedback cycles.',
      tags: [],
    });

    const withSemantic = await scoreArtifact(paraphrase);
    expect(withSemantic.rationale.some((r) => r.startsWith('thesis-RAG:'))).toBe(true);

    registerThesisProbe(undefined);
    const kwOnly = await scoreArtifact(paraphrase);

    // Lock non-triviality: the artifact must score ~zero on the
    // pure keyword path so the lift below is provably from the
    // semantic embedder, not from incidental keyword overlap.
    expect(kwOnly.thesisFit).toBeLessThan(0.1);
    // The semantic path must lift thesisFit by a meaningful margin
    // over the pure keyword path — not just nudge it within FP noise.
    expect(withSemantic.thesisFit).toBeGreaterThan(kwOnly.thesisFit + 0.2);
    // And it should be a genuinely high score, since the mock encodes
    // a perfect concept match (cosine ≈ 1 against at least one chunk).
    expect(withSemantic.thesisFit).toBeGreaterThan(0.5);
  });

  it('createEmbedWorkerThesisFn falls back to dev-hash when the upstream backend throws', async () => {
    // Pointing at a backend id the MicroBatchQueue does not know
    // causes every enqueue to reject with "no backend registered for
    // id ...". The per-call fallback inside createEmbedWorkerThesisFn
    // must swallow that and return dev-hash vectors so the probe
    // keeps running instead of crashing the pull pipeline.
    const fn = createEmbedWorkerThesisFn({ backendId: '__nonexistent_backend__' });
    const vecs = await fn(['hello world', 'second text']);

    expect(vecs).toHaveLength(2);
    expect(vecs[0]!.length).toBeGreaterThan(0);
    expect(vecs[1]!.length).toBeGreaterThan(0);

    // Wire it into the probe end-to-end and confirm the probe doesn't
    // throw — it should either return a usable result (corpus loaded
    // via dev-hash fallback) or undefined (corpus empty), never reject.
    setThesisEmbedFn(fn);
    installDefaultThesisProbe();
    const probe = await defaultThesisProbe(
      art({
        id: 'fallback-probe-1',
        title: 'agent governance rag retrieval',
        summary: 'doctrine alignment routing',
        tags: ['agent', 'rag'],
      }),
    );
    if (probe !== undefined) {
      expect(probe.score).toBeGreaterThanOrEqual(0);
      expect(probe.score).toBeLessThanOrEqual(1);
    }
  });

  it('createEmbedWorkerThesisFn falls back to dev-hash when the upstream returns malformed vectors', async () => {
    // Simulate a misbehaving upstream by stubbing the embed worker's
    // queue to "succeed" with a wrong-shape response (length mismatch
    // and empty inner arrays). The shape guard inside
    // createEmbedWorkerThesisFn must reject the bad payload and route
    // to the dev-hash fabric instead of poisoning the corpus cache.
    const workerMod = await import('@workspace/alloy-embed-worker');
    const real = workerMod.getDefaultEmbedWorker();
    const originalEnqueue = real.queue.enqueue.bind(real.queue);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (real.queue as unknown as { enqueue: (id: string, item: any) => void }).enqueue = (
      _id,
      item,
    ) => {
      // Resolve with malformed payload: wrong length AND empty vectors.
      queueMicrotask(() => item.resolve([[]]));
    };

    try {
      const fn = createEmbedWorkerThesisFn({ backendId: 'cpu-local' });
      const vecs = await fn(['alpha', 'beta', 'gamma']);
      expect(vecs).toHaveLength(3);
      // All entries must be non-empty — proof we landed on the
      // dev-hash fallback, not the malformed upstream payload.
      for (const v of vecs) expect(v.length).toBeGreaterThan(0);
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (real.queue as unknown as { enqueue: (id: string, item: any) => void }).enqueue =
        originalEnqueue;
    }
  });

  it('classify() still routes a low-safety artifact to discard', async () => {
    const decision = await classify(
      art({
        kind: 'model',
        title: 'uncensored jailbreak build',
        summary: 'nsfw exploit malware',
        tags: ['jailbreak', 'unsafe'],
      }),
    );
    expect(decision.decision).toBe('discard');
  });

  it('classify() routes claude-opus-5 to queue (regression guard for review #1)', async () => {
    // Previous code review caught a regression where the new RAG score
    // dropped composite below 0.18 and sent expensive frontier models to
    // discard. The max(RAG, keyword) blend in scoreArtifact, together
    // with the "opus" cost-signal trigger, must keep this at "queue".
    // Mirrors the synthetic "claude-opus-5" artifact in e2e.test.ts.
    const decision = await classify(
      art({
        kind: 'model',
        id: 'anthropic:model:claude-opus-5',
        title: 'Anthropic claude-opus-5',
        summary: 'Capable, expensive, doctrine-shifting reasoning frontier',
        tags: ['anthropic', 'claude', 'frontier'],
      }),
    );
    expect(decision.decision).toBe('queue');
  });
});
