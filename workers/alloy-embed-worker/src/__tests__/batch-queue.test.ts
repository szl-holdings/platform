import { describe, expect, it } from 'vitest';
import { MicroBatchQueue } from '../batch-queue.js';

describe('MicroBatchQueue', () => {
  it('can be instantiated with empty backends', () => {
    const queue = new MicroBatchQueue([], { maxBatchSize: 4, flushIntervalMs: 50 });
    expect(queue).toBeDefined();
  });

  it('respects maxBatchSize configuration', () => {
    const queue = new MicroBatchQueue([], { maxBatchSize: 8 });
    expect((queue as unknown as { cfg: { maxBatchSize: number } }).cfg.maxBatchSize).toBe(8);
  });

  it('respects flushIntervalMs configuration', () => {
    const queue = new MicroBatchQueue([], { flushIntervalMs: 100 });
    expect((queue as unknown as { cfg: { flushIntervalMs: number } }).cfg.flushIntervalMs).toBe(
      100,
    );
  });
});
