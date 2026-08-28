import { describe, expect, it, vi } from 'vitest';
import { AtelierAskRequestSchema } from './contracts.js';
import {
  type AtelierProvider,
  AtelierProviderResponseError,
  AtelierProviderUnavailableError,
  XaiResponsesProvider,
} from './provider.js';
import { AtelierPolicyDeniedError, askAtelier } from './service.js';

const provider: AtelierProvider = {
  id: 'xai',
  label: 'xAI API',
  localOnly: false,
  health: () => ({
    provider: 'xai',
    model: 'grok-4.6',
    configured: true,
    available: true,
    localOnly: false,
    evidenceState: 'OBSERVED',
    reason: 'test',
  }),
  generate: vi.fn(async () => ({
    text: 'A11OY_ATELIER_OK',
    provider: 'xai' as const,
    providerLabel: 'xAI API',
    model: 'grok-4.6',
    providerRequestId: 'req_test',
    usage: { inputTokens: 4, outputTokens: 2, totalTokens: 6 },
    localOnly: false,
  })),
};

describe('askAtelier', () => {
  it('returns a disclosed, hashed, evidence-bound receipt', async () => {
    const response = await askAtelier({
      request: { prompt: 'hello', provider: 'xai' },
      tenantId: 'solo-builder',
      provider,
      now: () => new Date('2026-08-26T00:00:00.000Z'),
    });
    expect(response.answer).toBe('A11OY_ATELIER_OK');
    expect(response.disclosure).toContain('xAI API');
    expect(response.disclosure).toContain('grok-4.6');
    expect(response.receipt).toMatchObject({
      provider: 'xai',
      model: 'grok-4.6',
      providerRequestId: 'req_test',
      evidenceState: 'OBSERVED',
      memoryState: 'PENDING_API_COMMIT',
      generatedAt: '2026-08-26T00:00:00.000Z',
    });
    expect(response.receipt.promptSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(response.receipt.responseSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it.each([
    'tools',
    'search',
    'durableStorage',
    'subagents',
  ] as const)('fails closed when %s is requested', async (capability) => {
    await expect(
      askAtelier({
        request: { prompt: 'hello', capabilities: { [capability]: true } },
        tenantId: 'solo-builder',
        provider,
      }),
    ).rejects.toBeInstanceOf(AtelierPolicyDeniedError);
  });

  it('rejects unknown request fields', async () => {
    await expect(
      askAtelier({
        request: { prompt: 'hello', bypassPolicy: true },
        tenantId: 'solo-builder',
        provider,
      }),
    ).rejects.toThrow();
  });
});

describe('XaiResponsesProvider', () => {
  it('uses the fixed endpoint, refuses redirects, and disables provider storage', async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            id: 'resp_test',
            output_text: 'provider-ok',
            usage: { input_tokens: 3, output_tokens: 2, total_tokens: 5 },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    );
    const client = new XaiResponsesProvider(
      'secret-for-test',
      fetchMock as unknown as typeof fetch,
    );

    const response = await client.generate(
      AtelierAskRequestSchema.parse({ prompt: 'hello', provider: 'xai' }),
    );

    expect(response.text).toBe('provider-ok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.x.ai/v1/responses');
    expect(init).toMatchObject({ method: 'POST', redirect: 'manual' });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: 'grok-4.6',
      input: 'hello',
      store: false,
    });
  });

  it('fails closed when the direct API key is missing', async () => {
    const client = new XaiResponsesProvider('', vi.fn() as unknown as typeof fetch);
    await expect(
      client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' })),
    ).rejects.toBeInstanceOf(AtelierProviderUnavailableError);
  });

  it('rejects provider redirects without following them', async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        new Response(null, { status: 307 }),
    );
    const client = new XaiResponsesProvider(
      'secret-for-test',
      fetchMock as unknown as typeof fetch,
    );
    await expect(
      client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' })),
    ).rejects.toBeInstanceOf(AtelierProviderResponseError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
