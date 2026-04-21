import type {
  EmbeddingBackend,
  EmbeddingBackendDescriptor,
  RawEmbedRequest,
  RawEmbedResponse,
} from './interface.js';

export interface ExternalHttpBackendConfig {
  backendId: string;
  displayName: string;
  baseUrl: string;
  embedPath?: string;
  healthPath?: string;
  apiKey?: string;
  model: string;
  dimensions: number;
  maxTokens: number;
}

export class ExternalHttpEmbeddingBackend implements EmbeddingBackend {
  readonly descriptor: EmbeddingBackendDescriptor;
  private readonly cfg: Required<ExternalHttpBackendConfig>;

  constructor(config: ExternalHttpBackendConfig) {
    this.cfg = {
      embedPath: '/embed',
      healthPath: '/health',
      apiKey: '',
      ...config,
    };
    this.descriptor = {
      backendId: config.backendId,
      displayName: config.displayName,
      kind: 'external-http',
      supportedModels: [config.model],
      maxTokens: config.maxTokens,
      defaultPooling: 'mean',
      defaultTruncation: 'reject',
    };
  }

  async embed(req: RawEmbedRequest): Promise<RawEmbedResponse> {
    const start = Date.now();
    const url = `${this.cfg.baseUrl}${this.cfg.embedPath}`;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.cfg.apiKey) {
      headers['Authorization'] = `Bearer ${this.cfg.apiKey}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          texts: req.texts,
          model: req.model,
          pooling: req.pooling,
          normalize: req.normalize,
        }),
      });
    } catch (err) {
      throw new Error(
        `ExternalHttpEmbeddingBackend[${this.cfg.backendId}]: network error: ${String(err)}`,
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '<unreadable>');
      throw new Error(
        `ExternalHttpEmbeddingBackend[${this.cfg.backendId}]: HTTP ${response.status}: ${body}`,
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
      ...(data.token_counts !== undefined && { tokenCounts: data.token_counts }),
      backendLatencyMs: Date.now() - start,
    };
  }

  async health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.cfg.baseUrl}${this.cfg.healthPath}`, {
        signal: AbortSignal.timeout(3000),
      });
      return { healthy: res.ok, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, detail: String(err) };
    }
  }
}
