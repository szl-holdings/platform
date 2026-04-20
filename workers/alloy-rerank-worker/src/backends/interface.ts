export interface RawRerankRequest {
  query: string;
  candidates: Array<{ id: string; text: string; score?: number }>;
  topK: number;
  model: string;
}

export interface RawRerankResult {
  id: string;
  score: number;
  rank: number;
}

export interface RawRerankResponse {
  results: RawRerankResult[];
  model: string;
  backendLatencyMs?: number;
}

export interface RerankBackendDescriptor {
  backendId: string;
  displayName: string;
  kind: 'cross-encoder-http' | 'fallback-deterministic';
  supportedModels: string[];
  isFallback: boolean;
}

export interface RerankBackend {
  readonly descriptor: RerankBackendDescriptor;
  rerank(req: RawRerankRequest): Promise<RawRerankResponse>;
  health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }>;
}
