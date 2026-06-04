import type { EmbeddingBackend, PoolingStrategy, TruncationPolicy } from './backends/interface.js';

export interface BatchItem {
  texts: string[];
  model: string;
  pooling: PoolingStrategy;
  normalize: boolean;
  resolve: (vectors: number[][]) => void;
  reject: (err: Error) => void;
}

export interface BatchKey {
  backendId: string;
  model: string;
  pooling: PoolingStrategy;
}

function batchKeyString(key: BatchKey): string {
  return `${key.backendId}|${key.model}|${key.pooling}`;
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
    this.backends = new Map(backends.map((b) => [b.descriptor.backendId, b]));
  }

  enqueue(backendId: string, item: BatchItem): void {
    const key: BatchKey = { backendId, model: item.model, pooling: item.pooling };
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

    const totalTexts = pending.items.reduce((n, it) => n + it.texts.length, 0);
    if (totalTexts >= this.cfg.maxBatchSize) {
      clearTimeout(pending.timer);
      void this.flush(keyStr);
    }
  }

  private async flush(keyStr: string): Promise<void> {
    const pending = this.batches.get(keyStr);
    if (!pending) return;

    this.batches.delete(keyStr);

    const [backendId, model, pooling] = keyStr.split('|') as [string, string, PoolingStrategy];
    const backend = this.backends.get(backendId);

    if (!backend) {
      const err = new Error(`MicroBatchQueue: no backend registered for id '${backendId}'`);
      for (const item of pending.items) item.reject(err);
      return;
    }

    const allTexts: string[] = pending.items.flatMap((it) => it.texts);
    const normalize = pending.items[0]?.normalize ?? true;

    try {
      const response = await backend.embed({
        texts: allTexts,
        model,
        pooling,
        normalize,
      });

      let offset = 0;
      for (const item of pending.items) {
        const slice = response.vectors.slice(offset, offset + item.texts.length);
        offset += item.texts.length;
        item.resolve(slice);
      }
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      for (const item of pending.items) {
        item.reject(wrapped);
      }
    }
  }

  async stop(): Promise<void> {
    for (const [keyStr, pending] of this.batches.entries()) {
      clearTimeout(pending.timer);
      await this.flush(keyStr);
    }
  }
}
