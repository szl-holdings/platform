export { AzureEmbeddingBackendStub } from './backends/azure-stub.js';
export { CpuLocalEmbeddingBackend } from './backends/cpu-local.js';
export { DevHashEmbeddingBackend } from './backends/dev-hash.js';
export type { ExternalHttpBackendConfig } from './backends/external-http.js';
export { ExternalHttpEmbeddingBackend } from './backends/external-http.js';
export { GpuEmbeddingBackendStub } from './backends/gpu-stub.js';
export type {
  EmbeddingBackend,
  EmbeddingBackendDescriptor,
  PoolingStrategy,
  RawEmbedRequest,
  RawEmbedResponse,
  TruncationPolicy,
} from './backends/interface.js';
export type { BatchItem, BatchKey, MicroBatchQueueConfig } from './batch-queue.js';
export { MicroBatchQueue } from './batch-queue.js';
export { applyPooling, l2Normalize } from './pooling.js';
export type { TruncationResult } from './truncation.js';
export { applyTruncation, applyTruncationBatch } from './truncation.js';
export type { WarmPoolEntry } from './warm-pool.js';
export { WarmPool } from './warm-pool.js';

import { AzureEmbeddingBackendStub } from './backends/azure-stub.js';
import { CpuLocalEmbeddingBackend } from './backends/cpu-local.js';
import { DevHashEmbeddingBackend } from './backends/dev-hash.js';
import { ExternalHttpEmbeddingBackend } from './backends/external-http.js';
import { GpuEmbeddingBackendStub } from './backends/gpu-stub.js';
import type { EmbeddingBackend } from './backends/interface.js';
import { MicroBatchQueue } from './batch-queue.js';
import { WarmPool } from './warm-pool.js';

/**
 * Build the real-model embedding backend (id `external-http`) when an inference
 * endpoint is configured. Routes to bge-m3 (1024-dim) by default. When unset,
 * returns null and the worker stays on the dev/CPU backends only.
 *
 * Env:
 *   SUBSTRATE_EMBED_URL  base URL of the embedding inference service (required to enable)
 *   HF_EMBED_MODEL       model id (default BAAI/bge-m3)
 *   VECTOR_DIM           embedding dimension (default 1024 — must match the store)
 *   SUBSTRATE_EMBED_API_KEY  optional bearer token
 */
function buildExternalHttpBackend(): ExternalHttpEmbeddingBackend | null {
  const baseUrl = process.env.SUBSTRATE_EMBED_URL ?? process.env.HF_EMBED_URL;
  if (!baseUrl) return null;
  return new ExternalHttpEmbeddingBackend({
    backendId: 'external-http',
    displayName: 'External HTTP embedder (bge-m3)',
    baseUrl,
    model: process.env.HF_EMBED_MODEL ?? 'BAAI/bge-m3',
    dimensions: Number(process.env.VECTOR_DIM ?? 1024),
    maxTokens: Number(process.env.AEF_EMBED_MAX_TOKENS ?? 8192),
    ...(process.env.SUBSTRATE_EMBED_API_KEY
      ? { apiKey: process.env.SUBSTRATE_EMBED_API_KEY }
      : {}),
  });
}

/** True when a real embedding inference endpoint is configured. */
export function hasRealEmbedderConfigured(): boolean {
  return Boolean(process.env.SUBSTRATE_EMBED_URL ?? process.env.HF_EMBED_URL);
}

let _defaultQueue: MicroBatchQueue | undefined;
let _defaultWarmPool: WarmPool | undefined;

export function getDefaultEmbedWorker(): { queue: MicroBatchQueue; warmPool: WarmPool } {
  if (!_defaultQueue || !_defaultWarmPool) {
    const externalHttp = buildExternalHttpBackend();
    const backends: EmbeddingBackend[] = [
      ...(externalHttp ? [externalHttp] : []),
      new CpuLocalEmbeddingBackend(),
      new GpuEmbeddingBackendStub(),
      new AzureEmbeddingBackendStub(),
      new DevHashEmbeddingBackend(),
    ];

    _defaultQueue = new MicroBatchQueue(backends, {
      maxBatchSize: Number(process.env.AEF_EMBED_BATCH_SIZE ?? 32),
      flushIntervalMs: Number(process.env.AEF_EMBED_FLUSH_MS ?? 20),
    });

    _defaultWarmPool = new WarmPool(backends, 30_000);
    void _defaultWarmPool.pingAll();
  }

  return { queue: _defaultQueue, warmPool: _defaultWarmPool };
}

export async function embedTexts(
  texts: string[],
  options: {
    backendId?: string;
    model?: string;
    pooling?: import('./backends/interface.js').PoolingStrategy;
    normalize?: boolean;
  } = {},
): Promise<number[][]> {
  const { queue } = getDefaultEmbedWorker();
  const backendId = options.backendId ?? 'cpu-local';
  const model = options.model ?? 'aef-dev-hash';
  const pooling = options.pooling ?? 'mean';
  const normalize = options.normalize ?? true;

  return new Promise<number[][]>((resolve, reject) => {
    queue.enqueue(backendId, { texts, model, pooling, normalize, resolve, reject });
  });
}
