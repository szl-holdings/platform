import { LocalCpuBackend } from '@workspace/continuum-vector-worker';
import { beforeAll, describe, expect, it } from 'vitest';
import { ALL_FIXTURE_SETS } from './fixtures/index.js';
import { runEval } from './runner.js';
import type { GoldenFixtureSet, RetrievalAdapter, RetrievalResult } from './types.js';

const MIN_NDCG = 0.7;
const TOP_K = 10;

interface IndexedChunk {
  chunkId: string;
  vector: number[];
}

function cosine(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}

async function buildAdapter(
  backend: LocalCpuBackend,
  fixtureSet: GoldenFixtureSet,
): Promise<RetrievalAdapter> {
  if (!fixtureSet.corpus || fixtureSet.corpus.length === 0) {
    throw new Error(`Fixture ${fixtureSet.fixtureSetId} has no corpus`);
  }

  const passageOutputs = await backend.embed(
    fixtureSet.corpus.map((c) => ({
      chunkId: c.chunkId,
      text: c.text,
      modelRef: backend.modelRef,
      profileId: fixtureSet.profileId,
      inputType: 'passage' as const,
    })),
  );

  const index: IndexedChunk[] = passageOutputs.map((o) => ({
    chunkId: o.chunkId,
    vector: o.vector,
  }));

  return {
    async search(query: string, topK: number): Promise<RetrievalResult> {
      const start = Date.now();
      const [embedding] = await backend.embed([
        {
          chunkId: 'query',
          text: query,
          modelRef: backend.modelRef,
          profileId: fixtureSet.profileId,
          inputType: 'query',
        },
      ]);
      if (!embedding) throw new Error('query embedding missing');
      const scored = index
        .map((c) => ({ chunkId: c.chunkId, score: cosine(embedding.vector, c.vector) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      return {
        queryId: 'real',
        retrievedChunkIds: scored.map((s) => s.chunkId),
        latencyMs: Date.now() - start,
      };
    },
  };
}

describe('aef-evals — golden fixtures with real ONNX vectors', () => {
  let backend: LocalCpuBackend;

  beforeAll(async () => {
    backend = new LocalCpuBackend();
    // Warm the model so per-fixture timing is more representative.
    await backend.embed([
      {
        chunkId: 'warm',
        text: 'warm-up',
        modelRef: backend.modelRef,
        profileId: 'warm',
        inputType: 'passage',
      },
    ]);
  }, 240_000);

  for (const fixtureSet of ALL_FIXTURE_SETS) {
    it(`${fixtureSet.profileId}: nDCG@${TOP_K} >= ${MIN_NDCG}`, async () => {
      const adapter = await buildAdapter(backend, fixtureSet);
      const result = await runEval(fixtureSet, adapter, {
        topK: TOP_K,
        metrics: ['ndcg', 'recall', 'precision', 'mrr'],
      });

      const ndcg = result.metrics.find((m) => m.metric === 'ndcg');
      expect(ndcg, `nDCG missing for ${fixtureSet.profileId}`).toBeDefined();
      expect(
        ndcg?.value,
        `nDCG@${TOP_K} for ${fixtureSet.profileId} was ${ndcg?.value.toFixed(3)}`,
      ).toBeGreaterThanOrEqual(MIN_NDCG);
    }, 120_000);
  }
});
