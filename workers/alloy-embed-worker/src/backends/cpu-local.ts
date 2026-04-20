import type {
  EmbeddingBackend,
  EmbeddingBackendDescriptor,
  RawEmbedRequest,
  RawEmbedResponse,
} from './interface.js';

const SUBSTRATE_EMBED_URL = process.env['SUBSTRATE_EMBED_URL'] ?? 'http://localhost:9800';

export class CpuLocalEmbeddingBackend implements EmbeddingBackend {
  readonly descriptor: EmbeddingBackendDescriptor = {
    backendId: 'cpu-local',
    displayName: 'CPU Local (substrate-py-workers)',
    kind: 'cpu-local',
    supportedModels: ['aef-dev-hash', 'aef-default'],
    maxTokens: 512,
    defaultPooling: 'mean',
    defaultTruncation: 'truncate',
  };

  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? SUBSTRATE_EMBED_URL;
  }

  async embed(req: RawEmbedRequest): Promise<RawEmbedResponse> {
    const start = Date.now();
    const url = `${this.baseUrl}/aef/embed`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: req.texts,
          model: req.model,
          pooling: req.pooling,
          normalize: req.normalize,
        }),
      });
    } catch (err) {
      throw new Error(`CpuLocalEmbeddingBackend: network error calling ${url}: ${String(err)}`);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '<unreadable>');
      throw new Error(
        `CpuLocalEmbeddingBackend: upstream returned HTTP ${response.status}: ${body}`,
      );
    }

    const data = (await response.json()) as {
      vectors: number[][];
      model: string;
      dimensions: number;
      token_counts?: number[];
    };

    return {
      vectors: data.vectors,
      model: data.model,
      dimensions: data.dimensions,
      tokenCounts: data.token_counts,
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
