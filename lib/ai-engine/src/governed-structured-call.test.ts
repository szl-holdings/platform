import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { governedStructuredCall } from './governed-structured-call.js';
import { chatCompletionWithFallback } from './providers/hf-client.js';
import type { RouteResult } from './providers/hf-router.js';

vi.mock('./providers/hf-client.js', () => ({ chatCompletionWithFallback: vi.fn() }));

const route = {} as RouteResult;
const options = { domain: 'test', schemaName: 'LocalSchema', riskTier: 'low' as const };

beforeEach(() => {
  vi.mocked(chatCompletionWithFallback).mockReset();
  vi.mocked(chatCompletionWithFallback).mockResolvedValue({
    content: '{"answer":"bounded local response"}',
    model: 'test-model',
    provider: 'test-provider',
    latencyMs: 0,
  } as Awaited<ReturnType<typeof chatCompletionWithFallback>>);
});

describe('governed structured schema shape', () => {
  it('uses object fields in the prompt and still validates the returned structure', async () => {
    await governedStructuredCall(
      [{ role: 'system', content: 'Return the requested structure.' }],
      route,
      z.object({ answer: z.string() }),
      options,
    );
    expect(vi.mocked(chatCompletionWithFallback).mock.calls[0][0][0].content)
      .toContain('Required fields: answer.');

    await expect(governedStructuredCall(
      [{ role: 'system', content: 'Return the requested structure.' }],
      route,
      z.object({ answer: z.number() }),
      options,
    )).rejects.toThrow();
  });

  it('accepts non-object schemas without attempting to call an object shape', async () => {
    vi.mocked(chatCompletionWithFallback).mockResolvedValueOnce({
      content: '"bounded local response"', model: 'test-model', provider: 'test-provider', latencyMs: 0,
    } as Awaited<ReturnType<typeof chatCompletionWithFallback>>);
    await governedStructuredCall(
      [{ role: 'system', content: 'Return the requested structure.' }], route, z.string(), options,
    );
    expect(vi.mocked(chatCompletionWithFallback).mock.calls[0][0][0].content)
      .toContain('Required fields: .');
  });
});
