import { describe, expect, it, vi } from 'vitest';
import { AgentRunError } from '../errors.js';
import { withRetry } from '../retry.js';

describe('withRetry', () => {
  it('returns the value on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(
      fn,
      { maxAttempts: 3, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 },
      'run-1',
      'step-1',
    );
    expect(result.value).toBe('ok');
    expect(result.attempts).toBe(1);
    expect(result.retryLog).toHaveLength(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries retryable errors and eventually succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Provider LLM unavailable'))
      .mockRejectedValueOnce(new Error('timeout reaching provider'))
      .mockResolvedValueOnce('done');

    const result = await withRetry(
      fn,
      { maxAttempts: 3, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 },
      'run-1',
      'step-1',
    );

    expect(result.value).toBe('done');
    expect(result.attempts).toBe(3);
    expect(result.retryLog).toHaveLength(2);
    expect(result.retryLog[0].errorCategory).toBe('provider');
    expect(result.retryLog[1].errorCategory).toBe('timeout');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws an AgentRunError after exhausting retries on retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('provider blew up'));

    await expect(
      withRetry(
        fn,
        { maxAttempts: 3, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 },
        'run-1',
        'step-1',
      ),
    ).rejects.toMatchObject({
      name: 'AgentRunError',
      category: 'provider',
      retryable: false,
    });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws immediately on non-retryable errors without retrying', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('zod validation failed: bad input'));

    await expect(
      withRetry(
        fn,
        { maxAttempts: 5, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 },
        'run-1',
        'step-1',
      ),
    ).rejects.toMatchObject({
      name: 'AgentRunError',
      category: 'validation',
      retryable: false,
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry when AgentRunError is marked non-retryable', async () => {
    const fn = vi.fn().mockRejectedValue(
      new AgentRunError({
        message: 'policy block',
        category: 'policy',
        runId: 'run-1',
        stepId: 'step-1',
        retryable: false,
      }),
    );

    await expect(
      withRetry(
        fn,
        { maxAttempts: 4, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 },
        'run-1',
        'step-1',
      ),
    ).rejects.toMatchObject({ category: 'policy' });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
