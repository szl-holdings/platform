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
export { MultimodalHttpEmbeddingClient } from './multimodal-http.js';
export type { MultimodalHttpEmbeddingClientConfig } from './multimodal-http.js';
export { OVIS_OMNI_ARTIFACT_SET_DIGEST, OVIS_OMNI_MODEL_ID, OVIS_OMNI_REVISION } from './ovis-omni.js';
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
import type { EmbeddingBackend, PoolingStrategy, RawEmbedResponse } from './backends/interface.js';
import { MicroBatchQueue } from './batch-queue.js';
import { WarmPool } from './warm-pool.js';

/**
 * Build the real-model text embedding backend when an inference endpoint is
 * configured. BGE-M3 remains the default production text lane. Ovis is exposed
 * through the separately governed multimodal client and is never substituted
 * into this path implicitly.
 */
export function buildExternalHttpBackend(): ExternalHttpEmbeddingBackend | null {
  const baseUrl = process.env.SUBSTRATE_EMBED_URL ?? process.env.HF_EMBED_URL;
  if (!baseUrl) return null;

  const model = process.env.HF_EMBED_MODEL ?? 'BAAI/bge-m3';
  return new ExternalHttpEmbeddingBackend({
    backendId: 'external-http',
    displayName: `External HTTP embedder (${model})`,
    baseUrl,
    model,
    dimensions: Number(process.env.VECTOR_DIM ?? 1024),
    maxTokens: Number(process.env.AEF_EMBED_MAX_TOKENS ?? 8192),
    timeoutMs: Number(process.env.AEF_EMBED_TIMEOUT_MS ?? 120_000),
    maxResponseBytes: Number(process.env.AEF_EMBED_MAX_RESPONSE_BYTES ?? 32 * 1024 * 1024),
    promotionState:
      (process.env.AEF_EMBED_PROMOTION_STATE as
        | 'DEVELOPMENT'
        | 'EVALUATION_HOLD'
        | 'QUALIFIED'
        | 'REVOKED'
        | undefined) ?? 'DEVELOPMENT',
    ...(process.env.HF_EMBED_MODEL_REVISION
      ? { modelRevision: process.env.HF_EMBED_MODEL_REVISION }
      : {}),
    ...(process.env.HF_EMBED_ARTIFACT_SET_DIGEST
      ? { artifactSetDigest: process.env.HF_EMBED_ARTIFACT_SET_DIGEST }
      : {}),
    ...(process.env.SUBSTRATE_EMBED_API_KEY
      ? { apiKey: process.env.SUBSTRATE_EMBED_API_KEY }
      : {}),
  });
}

export function hasRealEmbedderConfigured(): boolean {
  return Boolean(process.env.SUBSTRATE_EMBED_URL ?? process.env.HF_EMBED_URL);
}

let defaultQueue: MicroBatchQueue | undefined;
let defaultWarmPool: WarmPool | undefined;

export function getDefaultEmbedWorker(): { queue: MicroBatchQueue; warmPool: WarmPool } {
  if (!defaultQueue || !defaultWarmPool) {
    const externalHttp = buildExternalHttpBackend();
    const backends: EmbeddingBackend[] = [
      ...(externalHttp ? [externalHttp] : []),
      new CpuLocalEmbeddingBackend(),
      new GpuEmbeddingBackendStub(),
      new AzureEmbeddingBackendStub(),
      new DevHashEmbeddingBackend(),
    ];

    defaultQueue = new MicroBatchQueue(backends, {
      maxBatchSize: Number(process.env.AEF_EMBED_BATCH_SIZE ?? 32),
      flushIntervalMs: Number(process.env.AEF_EMBED_FLUSH_MS ?? 20),
    });
    defaultWarmPool = new WarmPool(backends, 30_000);
    void defaultWarmPool.pingAll();
  }
  return { queue: defaultQueue, warmPool: defaultWarmPool };
}

export interface EmbedTextOptions {
  backendId?: string;
  model?: string;
  pooling?: PoolingStrategy;
  normalize?: boolean;
}

export async function embedTextsWithReceipt(
  texts: string[],
  options: EmbedTextOptions = {},
): Promise<RawEmbedResponse> {
  const { queue } = getDefaultEmbedWorker();
  const backendId = options.backendId ?? 'cpu-local';
  const model = options.model ?? 'aef-dev-hash';
  const pooling = options.pooling ?? 'mean';
  const normalize = options.normalize ?? true;

  return new Promise<RawEmbedResponse>((resolveResponse, reject) => {
    queue.enqueue(backendId, {
      texts,
      model,
      pooling,
      normalize,
      resolve: () => undefined,
      resolveResponse,
      reject,
    });
  });
}

export async function embedTexts(
  texts: string[],
  options: EmbedTextOptions = {},
): Promise<number[][]> {
  return (await embedTextsWithReceipt(texts, options)).vectors;
}
