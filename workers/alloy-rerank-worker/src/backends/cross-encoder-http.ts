import type {
  RawRerankRequest,
  RawRerankResponse,
  RerankBackend,
  RerankBackendDescriptor,
} from './interface.js';

const SUBSTRATE_RERANK_URL = process.env['SUBSTRATE_RERANK_URL'] ?? 'http://localhost:9800';

export class CrossEncoderHttpRerankBackend implements RerankBackend {
  readonly descriptor: RerankBackendDescriptor = {
    backendId: 'cross-encoder-http',
    displayName: 'Cross-Encoder via HTTP (substrate-py-workers)',
    kind: 'cross-encoder-http',
    supportedModels: ['aef-dev-rerank', 'aef-default-rerank'],
    isFallback: false,
  };

  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? SUBSTRATE_RERANK_URL;
  }

  async rerank(req: RawRerankRequest): Promise<RawRerankResponse> {
    const start = Date.now();
    const url = `${this.baseUrl}/aef/rerank`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: req.query,
          candidates: req.candidates,
          top_k: req.topK,
          model: req.model,
        }),
      });
    } catch (err) {
      throw new Error(
        `CrossEncoderHttpRerankBackend: network error calling ${url}: ${String(err)}`,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '<unreadable>');
      throw new Error(`CrossEncoderHttpRerankBackend: HTTP ${response.status}: ${body}`);
    }

    const data = (await response.json()) as {
      results: Array<{ id: string; score: number; rank: number }>;
      model: string;
    };

    return {
      results: data.results,
      model: data.model,
      backendLatencyMs: Date.now() - start,
    };
  }

  async health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      return { healthy: res.ok, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, detail: String(err) };
    }
  }
}
