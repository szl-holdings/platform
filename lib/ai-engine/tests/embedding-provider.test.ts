import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { embeddingAnalytics } from '../src/embedding/analytics.js';
import {
  EmbeddingPipeline,
  type EmbeddingProviderType,
  type ProviderHealth,
} from '../src/embedding/provider.js';

interface TestProvider {
  type: EmbeddingProviderType;
  getHealth(): ProviderHealth;
  embed(
    text: string,
    model?: string,
    expectedDimensions?: number | null,
  ): Promise<number[]>;
}

function provider(
  type: EmbeddingProviderType,
  vector:
    | number[]
    | ((expectedDimensions: number | null | undefined, text: string) => number[]),
) {
  const embed: TestProvider['embed'] = async (text, _model, expectedDimensions) =>
    typeof vector === 'function' ? vector(expectedDimensions, text) : vector;

  return {
    type,
    getHealth: () => ({
      available: true,
      latencyMs: null,
      errorRate: 0,
      lastChecked: 0,
      consecutiveFailures: 0,
    }),
    embed: vi.fn(embed),
  };
}

function pipelineWith(...providers: TestProvider[]): EmbeddingPipeline {
  const pipeline = new EmbeddingPipeline();
  const internals = pipeline as unknown as { providers: TestProvider[] };
  internals.providers.splice(0, internals.providers.length, ...providers);
  return pipeline;
}

beforeEach(() => {
  embeddingAnalytics.reset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('EmbeddingPipeline provider output admission', () => {
  it.each([
    ['wrong dimensions', [1]],
    ['NaN', [Number.NaN, 1]],
    ['positive infinity', [Number.POSITIVE_INFINITY, 1]],
    ['negative infinity', [Number.NEGATIVE_INFINITY, 1]],
    ['empty vector', []],
  ])('rejects a %s vector before cache and success accounting', async (_label, invalidVector) => {
    const invalid = provider('huggingface', invalidVector as number[]);
    const valid = provider('mock', [0.6, 0.8]);
    const pipeline = pipelineWith(invalid, valid);

    const result = await pipeline.embed('admission test', {
      model: 'test-model',
      dimensions: 2,
    });

    expect(result.provider).toBe('mock');
    expect(result.embedding).toEqual([0.6, 0.8]);
    expect(invalid.embed).toHaveBeenCalledOnce();
    expect(valid.embed).toHaveBeenCalledOnce();

    const report = embeddingAnalytics.getAnalyticsReport();
    expect(report.providers.huggingface).toMatchObject({
      totalRequests: 1,
      successRequests: 0,
    });
    expect(report.providers.mock).toMatchObject({
      totalRequests: 1,
      successRequests: 1,
    });
  });

  it('isolates cache entries by requested dimensions', async () => {
    const variable = provider('mock', (expectedDimensions) =>
      Array.from({ length: expectedDimensions ?? 1 }, (_value, index) => index + 1),
    );
    const pipeline = pipelineWith(variable);

    const twoDimensions = await pipeline.embed('same text', {
      model: 'test-model',
      dimensions: 2,
    });
    const threeDimensions = await pipeline.embed('same text', {
      model: 'test-model',
      dimensions: 3,
    });

    expect(twoDimensions.embedding).toEqual([1, 2]);
    expect(threeDimensions.embedding).toEqual([1, 2, 3]);
    expect(variable.embed).toHaveBeenCalledTimes(2);
  });

  it('keeps cached vectors valid when a caller mutates a returned result', async () => {
    const valid = provider('mock', [0.6, 0.8]);
    const pipeline = pipelineWith(valid);

    const first = await pipeline.embed('cache isolation', {
      model: 'test-model',
      dimensions: 2,
    });
    first.embedding[0] = Number.NaN;

    const cached = await pipeline.embed('cache isolation', {
      model: 'test-model',
      dimensions: 2,
    });

    expect(cached.cached).toBe(true);
    expect(cached.embedding).toEqual([0.6, 0.8]);
    expect(valid.embed).toHaveBeenCalledOnce();
  });

  it('does not alias same-length texts that share the first 200 characters', async () => {
    const commonPrefix = 'x'.repeat(200);
    const distinct = provider('mock', (_expectedDimensions, text) =>
      text.endsWith('a') ? [1, 0] : [0, 1],
    );
    const pipeline = pipelineWith(distinct);

    const first = await pipeline.embed(`${commonPrefix}a`, {
      model: 'test-model',
      dimensions: 2,
    });
    const second = await pipeline.embed(`${commonPrefix}b`, {
      model: 'test-model',
      dimensions: 2,
    });

    expect(first.embedding).toEqual([1, 0]);
    expect(second.embedding).toEqual([0, 1]);
    expect(distinct.embed).toHaveBeenCalledTimes(2);
  });

  it('records a wrong-dimension provider response as a provider failure', async () => {
    const pipeline = new EmbeddingPipeline();
    const internals = pipeline as unknown as { providers: TestProvider[] };
    const huggingFace = internals.providers.find((candidate) => candidate.type === 'huggingface');
    if (!huggingFace) throw new Error('HuggingFace provider missing from pipeline');
    internals.providers.splice(0, internals.providers.length, huggingFace);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => [[1]],
      })),
    );

    await expect(
      pipeline.embed('bad provider response', {
        model: 'test-model',
        dimensions: 2,
      }),
    ).rejects.toThrow('[embedding-pipeline] All embedding providers failed');

    expect(pipeline.getProviderHealth().huggingface).toMatchObject({
      consecutiveFailures: 1,
      errorRate: 1,
      latencyMs: null,
    });
  });

  it('uses domain dimensions for validation without changing compatible API payloads', async () => {
    vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', 'INERT_TEST_KEY');
    const pipeline = new EmbeddingPipeline();
    const internals = pipeline as unknown as { providers: TestProvider[] };
    const compatible = internals.providers.find(
      (candidate) => candidate.type === 'openai-compatible',
    );
    if (!compatible) throw new Error('OpenAI-compatible provider missing from pipeline');
    internals.providers.splice(0, internals.providers.length, compatible);
    let requestBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input, init?: RequestInit) => {
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            data: [{ embedding: Array.from({ length: 1536 }, () => 1) }],
          }),
        };
      }),
    );

    await pipeline.embed('compatible request', {
      domain: 'general',
      model: 'text-embedding-ada-002',
    });

    expect(requestBody).toEqual({
      model: 'text-embedding-ada-002',
      input: 'compatible request',
    });
  });
});

describe('EmbeddingPipeline batch failure contract', () => {
  it('returns a non-indexable discriminated failure without a fallback vector', async () => {
    const invalid = provider('mock', [Number.NaN, 1]);
    const pipeline = pipelineWith(invalid);

    const batch = await pipeline.embedBatch(['cannot index'], {
      model: 'test-model',
      dimensions: 2,
    });

    expect(batch.successCount).toBe(0);
    expect(batch.errorCount).toBe(1);
    expect(batch.provider).toBeNull();
    expect(batch.model).toBeNull();
    expect(batch.results[0]).toEqual({
      ok: false,
      text: 'cannot index',
      index: 0,
      error: '[embedding-pipeline] All embedding providers failed',
    });
    expect(batch.results[0]).not.toHaveProperty('embedding');
    expect(batch.results[0]).not.toHaveProperty('dimensions');
    expect(batch.results[0]).not.toHaveProperty('provider');
    expect(batch.results[0]).not.toHaveProperty('model');
  });

  it('marks successful items with the success discriminant', async () => {
    const valid = provider('mock', [0.6, 0.8]);
    const pipeline = pipelineWith(valid);

    const batch = await pipeline.embedBatch(['can index'], {
      model: 'test-model',
      dimensions: 2,
    });

    expect(batch.successCount).toBe(1);
    expect(batch.errorCount).toBe(0);
    expect(batch.provider).toBe('mock');
    expect(batch.model).toBe('test-model');
    expect(batch.results[0]).toMatchObject({
      ok: true,
      text: 'can index',
      index: 0,
      embedding: [0.6, 0.8],
      dimensions: 2,
      provider: 'mock',
      model: 'test-model',
    });
  });
});
