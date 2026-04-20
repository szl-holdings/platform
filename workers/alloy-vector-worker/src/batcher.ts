import type { EmbeddingBackend, EmbedInput, EmbedOutput } from './backends.js';

interface BatchEntry {
  input: EmbedInput;
  resolve: (output: EmbedOutput) => void;
  reject: (err: Error) => void;
  enqueuedAt: number;
}

interface PartitionQueue {
  entries: BatchEntry[];
  flushTimer: ReturnType<typeof setTimeout> | null;
  flushing: boolean;
  stats: PartitionStats;
}

interface PartitionStats {
  enqueued: number;
  flushed: number;
  errors: number;
  batchCount: number;
  queueFullRejected: number;
}

interface BatcherOptions {
  maxBatchSize?: number;
  maxWaitMs?: number;
  maxTokensPerBatch?: number;
  maxQueueDepth?: number;
  oversizeTokenThreshold?: number;
}

/**
 * Key-partitioned micro-batcher keyed by (profileId, backend.kind, modelRef, inputType).
 * Each partition has an independent queue, flush timer, and backpressure accounting so
 * cross-tenant/cross-profile traffic cannot starve or pollute sibling queues.
 */
export class MicroBatcher {
  private readonly backend: EmbeddingBackend;
  private readonly maxBatchSize: number;
  private readonly maxWaitMs: number;
  private readonly maxTokensPerBatch: number;
  private readonly maxQueueDepth: number;
  private readonly oversizeTokenThreshold: number;

  private readonly partitions = new Map<string, PartitionQueue>();

  constructor(backend: EmbeddingBackend, opts: BatcherOptions = {}) {
    this.backend = backend;
    this.maxBatchSize = opts.maxBatchSize ?? 32;
    this.maxWaitMs = opts.maxWaitMs ?? 20;
    this.maxTokensPerBatch = opts.maxTokensPerBatch ?? 4096;
    this.maxQueueDepth = opts.maxQueueDepth ?? 512;
    this.oversizeTokenThreshold = opts.oversizeTokenThreshold ?? 2048;
  }

  private partitionKey(input: EmbedInput): string {
    return `${input.profileId}:${this.backend.kind}:${input.modelRef}:${input.inputType}`;
  }

  private getOrCreatePartition(key: string): PartitionQueue {
    let partition = this.partitions.get(key);
    if (partition === undefined) {
      partition = {
        entries: [],
        flushTimer: null,
        flushing: false,
        stats: { enqueued: 0, flushed: 0, errors: 0, batchCount: 0, queueFullRejected: 0 },
      };
      this.partitions.set(key, partition);
    }
    return partition;
  }

  enqueue(input: EmbedInput): Promise<EmbedOutput> {
    const estimatedTokens = Math.ceil(input.text.split(/\s+/).length * 1.3);

    if (estimatedTokens > this.oversizeTokenThreshold) {
      return Promise.reject(
        new Error(
          `Input for chunkId "${input.chunkId}" exceeds oversize threshold of ${this.oversizeTokenThreshold} tokens (estimated ${estimatedTokens}). Split the chunk before embedding.`,
        ),
      );
    }

    const key = this.partitionKey(input);
    const partition = this.getOrCreatePartition(key);

    if (partition.entries.length >= this.maxQueueDepth) {
      partition.stats.queueFullRejected++;
      return Promise.reject(
        new Error(
          `Partition "${key}" queue is full (depth ${this.maxQueueDepth}). Apply backpressure — retry after queue drains.`,
        ),
      );
    }

    return new Promise<EmbedOutput>((resolve, reject) => {
      partition.stats.enqueued++;
      partition.entries.push({ input, resolve, reject, enqueuedAt: Date.now() });
      this.scheduleFlush(key, partition);
    });
  }

  private scheduleFlush(key: string, partition: PartitionQueue): void {
    if (partition.entries.length >= this.maxBatchSize) {
      this.triggerFlush(key, partition);
      return;
    }
    if (partition.flushTimer === null) {
      partition.flushTimer = setTimeout(() => this.triggerFlush(key, partition), this.maxWaitMs);
    }
  }

  private triggerFlush(key: string, partition: PartitionQueue): void {
    if (partition.flushTimer !== null) {
      clearTimeout(partition.flushTimer);
      partition.flushTimer = null;
    }
    if (!partition.flushing) {
      void this.flush(key, partition);
    }
  }

  private async flush(key: string, partition: PartitionQueue): Promise<void> {
    if (partition.entries.length === 0) return;
    partition.flushing = true;

    const batch: BatchEntry[] = [];
    let tokenBudget = 0;

    while (partition.entries.length > 0 && batch.length < this.maxBatchSize) {
      const next = partition.entries[0]!;
      const tokens = Math.ceil(next.input.text.split(/\s+/).length * 1.3);
      if (batch.length > 0 && tokenBudget + tokens > this.maxTokensPerBatch) break;
      partition.entries.shift();
      batch.push(next);
      tokenBudget += tokens;
    }

    partition.stats.batchCount++;
    const inputs = batch.map((e) => e.input);

    try {
      const outputs = await this.backend.embed(inputs);
      const outputMap = new Map(outputs.map((o) => [o.chunkId, o]));
      for (const entry of batch) {
        const output = outputMap.get(entry.input.chunkId);
        if (output) {
          partition.stats.flushed++;
          entry.resolve(output);
        } else {
          partition.stats.errors++;
          entry.reject(
            new Error(
              `Backend returned no output for chunkId "${entry.input.chunkId}" in partition "${key}"`,
            ),
          );
        }
      }
    } catch (err) {
      partition.stats.errors += batch.length;
      for (const entry of batch) {
        entry.reject(err instanceof Error ? err : new Error(String(err)));
      }
    }

    partition.flushing = false;

    if (partition.entries.length > 0) {
      void this.flush(key, partition);
    }
  }

  getStats(): {
    totalPartitions: number;
    partitions: Record<string, PartitionStats & { queueDepth: number }>;
  } {
    const partitions: Record<string, PartitionStats & { queueDepth: number }> = {};
    for (const [key, partition] of this.partitions) {
      partitions[key] = { ...partition.stats, queueDepth: partition.entries.length };
    }
    return { totalPartitions: this.partitions.size, partitions };
  }

  async drain(): Promise<void> {
    while ([...this.partitions.values()].some((p) => p.entries.length > 0 || p.flushing)) {
      await new Promise<void>((r) => setTimeout(r, 5));
    }
  }
}
