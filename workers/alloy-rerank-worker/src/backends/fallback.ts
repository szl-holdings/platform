import type {
  RawRerankRequest,
  RawRerankResponse,
  RerankBackend,
  RerankBackendDescriptor,
} from './interface.js';

function termFrequencyScore(query: string, text: string): number {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTerms.length === 0) return 0;

  const textLower = text.toLowerCase();
  let hits = 0;
  for (const term of queryTerms) {
    if (textLower.includes(term)) hits++;
  }

  return hits / queryTerms.length;
}

export class DeterministicFallbackRerankBackend implements RerankBackend {
  readonly descriptor: RerankBackendDescriptor = {
    backendId: 'fallback-deterministic',
    displayName: 'Deterministic TF Fallback Reranker',
    kind: 'fallback-deterministic',
    supportedModels: ['aef-fallback'],
    isFallback: true,
  };

  async rerank(req: RawRerankRequest): Promise<RawRerankResponse> {
    const start = Date.now();

    const scored = req.candidates.map((c) => ({
      id: c.id,
      tfScore: termFrequencyScore(req.query, c.text),
      originalScore: c.score ?? 0,
    }));

    scored.sort((a, b) => {
      const combined_a = 0.7 * a.tfScore + 0.3 * a.originalScore;
      const combined_b = 0.7 * b.tfScore + 0.3 * b.originalScore;
      return combined_b - combined_a;
    });

    const topK = req.topK <= 0 ? scored.length : Math.min(req.topK, scored.length);
    const results = scored.slice(0, topK).map((s, idx) => ({
      id: s.id,
      score: 0.7 * s.tfScore + 0.3 * s.originalScore,
      rank: idx + 1,
    }));

    return {
      results,
      model: 'aef-fallback',
      backendLatencyMs: Date.now() - start,
    };
  }

  async health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }> {
    return { healthy: true, latencyMs: 0, detail: 'deterministic fallback — always healthy' };
  }
}
