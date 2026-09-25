import type {
  EmbeddingBackend,
  PoolingStrategy,
  RawEmbedResponse,
  TruncationPolicy,
} from './backends/interface.js';

export interface BatchItem {
  texts: string[];
  model: string;
  pooling: PoolingStrategy;
  normalize: boolean;
  /** Backward-compatible vector-only resolver. */
  resolve: (vectors: number[][]) => void;
  /** Receipt-preserving resolver used by governed routes. */
  resolveResponse?: (response: RawEmbedResponse) => void;
  reject: (err: Error) => void;
}

export interface BatchKey {
  backendId: string;
  model: string;
  pooling: PoolingStrategy;
  normalize: boolean;
}

function batchKeyString(key: BatchKey): string {
  return JSON.stringify([key.backendId, key.model, key.pooling, key.normalize]);
}

interface PendingBatch {
  items: BatchItem[];
  timer: ReturnType<typeof setTimeout>;
}

export interface MicroBatchQueueConfig {
  maxBatchSize: number;
  flushIntervalMs: number;
  maxTokens: number;
  truncationPolicy: TruncationPolicy;
}

const DEFAULT_CONFIG: MicroBatchQueueConfig = {
  maxBatchSize: 32,
  flushIntervalMs: 20,
  maxTokens: 512,
  truncationPolicy: 'truncate',
};

export class MicroBatchQueue {
  private readonly batches = new Map<string, PendingBatch>();
  private readonly backends: Map<string, EmbeddingBackend>;
  private readonly cfg: MicroBatchQueueConfig;

  constructor(backends: EmbeddingBackend[], config?: Partial<MicroBatchQueueConfig>) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.backends = new Map(backends.map((backend) => [backend.descriptor.backendId, backend]));
  }

  enqueue(backendId: string, item: BatchItem): void {
    const key: BatchKey = {
      backendId,
      model: item.model,
      pooling: item.pooling,
      normalize: item.normalize,
    };
    const keyStr = batchKeyString(key);

    let pending = this.batches.get(keyStr);
    if (!pending) {
      const timer = setTimeout(() => {
        void this.flush(keyStr);
      }, this.cfg.flushIntervalMs);
      pending = { items: [], timer };
      this.batches.set(keyStr, pending);
    }

    pending.items.push(item);
    const totalTexts = pending.items.reduce((count, queued) => count + queued.texts.length, 0);
    if (totalTexts >= this.cfg.maxBatchSize) {
      clearTimeout(pending.timer);
      void this.flush(keyStr);
    }
  }

  private async flush(keyStr: string): Promise<void> {
    const pending = this.batches.get(keyStr);
    if (!pending) return;
    this.batches.delete(keyStr);

    let key: [string, string, PoolingStrategy, boolean];
    try {
      key = JSON.parse(keyStr) as [string, string, PoolingStrategy, boolean];
    } catch {
      const error = new Error('MicroBatchQueue: invalid internal batch key');
      for (const item of pending.items) item.reject(error);
      return;
    }

    const [backendId, model, pooling, normalize] = key;
    const backend = this.backends.get(backendId);
    if (!backend) {
      const error = new Error(`MicroBatchQueue: no backend registered for id '${backendId}'`);
      for (const item of pending.items) item.reject(error);
      return;
    }

    const allTexts = pending.items.flatMap((item) => item.texts);
    try {
      const response = await backend.embed({ texts: allTexts, model, pooling, normalize });
      if (response.vectors.length !== allTexts.length) {
        throw new Error(
          `MicroBatchQueue: backend '${backendId}' returned ${response.vectors.length} vectors for ${allTexts.length} texts`,
        );
      }

      let offset = 0;
      for (const item of pending.items) {
        const end = offset + item.texts.length;
        const sliced: RawEmbedResponse = {
          ...response,
          vectors: response.vectors.slice(offset, end),
          ...(response.tokenCounts ? { tokenCounts: response.tokenCounts.slice(offset, end) } : {}),
        };
        offset = end;
        if (item.resolveResponse) item.resolveResponse(sliced);
        else item.resolve(sliced.vectors);
      }
    } catch (error) {
      const wrapped = error instanceof Error ? error : new Error(String(error));
      for (const item of pending.items) item.reject(wrapped);
    }
  }

  async stop(): Promise<void> {
    for (const [keyStr, pending] of this.batches.entries()) {
      clearTimeout(pending.timer);
      await this.flush(keyStr);
    }
  }
}
