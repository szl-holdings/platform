export type { EmbeddingBackend, EmbeddingBackendDescriptor, RawEmbedRequest, RawEmbedResponse, PoolingStrategy, TruncationPolicy } from "./backends/interface.js";
export { CpuLocalEmbeddingBackend } from "./backends/cpu-local.js";
export { ExternalHttpEmbeddingBackend } from "./backends/external-http.js";
export type { ExternalHttpBackendConfig } from "./backends/external-http.js";
export { GpuEmbeddingBackendStub } from "./backends/gpu-stub.js";
export { AzureEmbeddingBackendStub } from "./backends/azure-stub.js";
export { DevHashEmbeddingBackend } from "./backends/dev-hash.js";
export { MicroBatchQueue } from "./batch-queue.js";
export type { BatchItem, BatchKey, MicroBatchQueueConfig } from "./batch-queue.js";
export { applyPooling, l2Normalize } from "./pooling.js";
export { applyTruncation, applyTruncationBatch } from "./truncation.js";
export type { TruncationResult } from "./truncation.js";
export { WarmPool } from "./warm-pool.js";
export type { WarmPoolEntry } from "./warm-pool.js";

import { CpuLocalEmbeddingBackend } from "./backends/cpu-local.js";
import { GpuEmbeddingBackendStub } from "./backends/gpu-stub.js";
import { AzureEmbeddingBackendStub } from "./backends/azure-stub.js";
import { DevHashEmbeddingBackend } from "./backends/dev-hash.js";
import { MicroBatchQueue } from "./batch-queue.js";
import { WarmPool } from "./warm-pool.js";
import type { EmbeddingBackend } from "./backends/interface.js";

let _defaultQueue: MicroBatchQueue | undefined;
let _defaultWarmPool: WarmPool | undefined;

export function getDefaultEmbedWorker(): { queue: MicroBatchQueue; warmPool: WarmPool } {
  if (!_defaultQueue || !_defaultWarmPool) {
    const backends: EmbeddingBackend[] = [
      new CpuLocalEmbeddingBackend(),
      new GpuEmbeddingBackendStub(),
      new AzureEmbeddingBackendStub(),
      new DevHashEmbeddingBackend(),
    ];

    _defaultQueue = new MicroBatchQueue(backends, {
      maxBatchSize: Number(process.env["AEF_EMBED_BATCH_SIZE"] ?? 32),
      flushIntervalMs: Number(process.env["AEF_EMBED_FLUSH_MS"] ?? 20),
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
    pooling?: import("./backends/interface.js").PoolingStrategy;
    normalize?: boolean;
  } = {},
): Promise<number[][]> {
  const { queue } = getDefaultEmbedWorker();
  const backendId = options.backendId ?? "cpu-local";
  const model = options.model ?? "aef-dev-hash";
  const pooling = options.pooling ?? "mean";
  const normalize = options.normalize ?? true;

  return new Promise<number[][]>((resolve, reject) => {
    queue.enqueue(backendId, { texts, model, pooling, normalize, resolve, reject });
  });
}
