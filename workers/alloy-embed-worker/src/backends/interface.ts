export interface RawEmbedRequest {
  texts: string[];
  model: string;
  pooling: PoolingStrategy;
  normalize: boolean;
}

export interface RawEmbedResponse {
  vectors: number[][];
  model: string;
  dimensions: number;
  tokenCounts?: number[];
  backendLatencyMs?: number;
}

export type PoolingStrategy = "cls" | "mean" | "last_token";

export type TruncationPolicy = "reject" | "truncate";

export interface EmbeddingBackendDescriptor {
  backendId: string;
  displayName: string;
  kind: "cpu-local" | "external-http" | "gpu" | "azure";
  supportedModels: string[];
  maxTokens: number;
  defaultPooling: PoolingStrategy;
  defaultTruncation: TruncationPolicy;
}

export interface EmbeddingBackend {
  readonly descriptor: EmbeddingBackendDescriptor;
  embed(req: RawEmbedRequest): Promise<RawEmbedResponse>;
  health(): Promise<{ healthy: boolean; latencyMs?: number; detail?: string }>;
}
