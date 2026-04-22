import type { TraceRecord } from './schema.js';
import type { TraceStore } from './store.js';

export type QueuedWrite =
  | { type: 'save'; trace: TraceRecord }
  | { type: 'delete'; traceId: string };

export interface WriteQueueOptions {
  flushIntervalMs?: number;
  maxBatchSize?: number;
  onFlushError?: (err: unknown) => void;
}

export class WriteQueue {
  private readonly queue: QueuedWrite[] = [];
  private readonly store: TraceStore;
  private readonly options: Required<WriteQueueOptions>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(store: TraceStore, options: WriteQueueOptions = {}) {
    this.store = store;
    this.options = {
      flushIntervalMs: options.flushIntervalMs ?? 100,
      maxBatchSize: options.maxBatchSize ?? 256,
      onFlushError:
        options.onFlushError ?? ((_err) => {}),
    };
  }

  enqueue(write: QueuedWrite): void {
    this.queue.push(write);
    if (this.queue.length >= this.options.maxBatchSize) {
      void this.flush();
    }
  }

  start(): this {
    if (this.timer !== null) return this;
    this.timer = setInterval(() => {
      void this.flush();
    }, this.options.flushIntervalMs);
    if (typeof this.timer === 'object' && this.timer !== null && 'unref' in this.timer) {
      (this.timer as NodeJS.Timeout).unref();
    }
    return this;
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) return;
    this.flushing = true;
    const batch = this.queue.splice(0, this.options.maxBatchSize);
    try {
      for (const write of batch) {
        if (write.type === 'save') {
          this.store.save(write.trace);
        } else {
          this.store.delete(write.traceId);
        }
      }
    } catch (err) {
      this.options.onFlushError(err);
      this.queue.unshift(...batch);
    } finally {
      this.flushing = false;
    }
  }

  get pendingCount(): number {
    return this.queue.length;
  }
}

export class QueuedTraceStore implements TraceStore {
  private readonly inner: TraceStore;
  readonly queue: WriteQueue;

  constructor(inner: TraceStore, options: WriteQueueOptions = {}) {
    this.inner = inner;
    this.queue = new WriteQueue(inner, options);
    this.queue.start();
  }

  save(trace: TraceRecord): void {
    this.inner.save(trace);
    this.queue.enqueue({ type: 'save', trace });
  }

  get(traceId: string): TraceRecord | undefined {
    return this.inner.get(traceId);
  }

  list(filter?: {
    sessionId?: string;
    workflowId?: string;
    agentId?: string;
    status?: TraceRecord['status'];
  }): TraceRecord[] {
    return this.inner.list(filter);
  }

  delete(traceId: string): boolean {
    this.queue.enqueue({ type: 'delete', traceId });
    return this.inner.delete(traceId);
  }

  count(): number {
    return this.inner.count();
  }
}
