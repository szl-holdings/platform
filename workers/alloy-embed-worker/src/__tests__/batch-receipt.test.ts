import { describe, expect, it } from 'vitest';
import type { EmbeddingBackend } from '../backends/interface.js';
import { MicroBatchQueue } from '../batch-queue.js';

const backend: EmbeddingBackend = {
  descriptor: {
    backendId: 'receipt-backend',
    displayName: 'Receipt backend',
    kind: 'external-http',
    supportedModels: ['example/model'],
    maxTokens: 128,
    defaultPooling: 'mean',
    defaultTruncation: 'reject',
  },
  async embed(request) {
    return {
      vectors: request.texts.map((_text, index) => [index, 1]),
      model: request.model,
      dimensions: 2,
      tokenCounts: request.texts.map(() => 1),
      execution: {
        backendId: 'receipt-backend',
        modelId: request.model,
        dimensions: 2,
        normalized: request.normalize,
        promotionState: 'QUALIFIED',
        supportedModalities: ['text'],
      },
    };
  },
  async health() {
    return { healthy: true };
  },
};

describe('MicroBatchQueue receipt preservation', () => {
  it('splits vectors and token counts while retaining one execution identity', async () => {
    const queue = new MicroBatchQueue([backend], { maxBatchSize: 2, flushIntervalMs: 1 });
    const makeRequest = (text: string) =>
      new Promise<import('../backends/interface.js').RawEmbedResponse>((resolveResponse, reject) => {
        queue.enqueue('receipt-backend', {
          texts: [text],
          model: 'example/model',
          pooling: 'mean',
          normalize: true,
          resolve: () => undefined,
          resolveResponse,
          reject,
        });
      });

    const [first, second] = await Promise.all([makeRequest('one'), makeRequest('two')]);
    expect(first.vectors).toHaveLength(1);
    expect(second.vectors).toHaveLength(1);
    expect(first.tokenCounts).toEqual([1]);
    expect(second.tokenCounts).toEqual([1]);
    expect(first.execution).toEqual(second.execution);
    await queue.stop();
  });
});
