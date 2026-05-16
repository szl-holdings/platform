import { afterEach, describe, expect, it } from 'vitest';
import {
  _getArtifactCacheSizeForTests,
  _getCorpusSizeForTests,
  _resetThesisRagForTests,
  classify,
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
