import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AtelierAskRequestSchema } from './contracts.js';
import {
  ALLOWED_GROK_MODELS,
  type AtelierProvider,
  AtelierProviderResponseError,
  AtelierProviderUnavailableError,
  DEFAULT_GROK_MODEL,
  GrokBuildCliProvider,
  getAtelierProviderHealth,
  resolveGrokModel,
  resolveProvider,
  tryResolveGrokModel,
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

// Provider tests must not depend on the developer's or CI runner's environment.
beforeEach(() => {
  vi.stubEnv('SZL_GROK_MODEL', '');
  vi.stubEnv('A11OY_ATELIER_MODEL', '');
  vi.stubEnv('A11OY_ATELIER_XAI_API_KEY', '');
  vi.stubEnv('A11OY_ATELIER_GROK_CLI_PATH', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function okFetch() {
  return vi.fn(
    async (_input: string | URL | Request, _init?: RequestInit) =>
      new Response(JSON.stringify({ id: 'resp_test', output_text: 'provider-ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
}

function sentBody(fetchMock: ReturnType<typeof okFetch>): Record<string, unknown> {
  return JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
}

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
      model: 'grok-4.7',
      input: 'hello',
      store: false,
    });
    expect(response.model).toBe('grok-4.7');
  });

  it('never sends stop or penalty parameters, which xAI rejects on reasoning models', async () => {
    const fetchMock = okFetch();
    const client = new XaiResponsesProvider(
      'secret-for-test',
      fetchMock as unknown as typeof fetch,
    );
    await client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' }));
    const body = sentBody(fetchMock);
    expect(Object.keys(body)).toEqual(['model', 'input', 'max_output_tokens', 'store']);
    expect(body).not.toHaveProperty('stop');
    expect(body).not.toHaveProperty('presence_penalty');
    expect(body).not.toHaveProperty('frequency_penalty');
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

describe('Grok model pin', () => {
  it('pins grok-4.7 with grok-4.6 as the single rollback target', () => {
    expect(DEFAULT_GROK_MODEL).toBe('grok-4.7');
    expect([...ALLOWED_GROK_MODELS]).toEqual(['grok-4.7', 'grok-4.6']);
    expect(Object.isFrozen(ALLOWED_GROK_MODELS)).toBe(true);
    expect(resolveGrokModel()).toBe('grok-4.7');
  });

  it('honours SZL_GROK_MODEL set to the rollback target (trimmed)', async () => {
    vi.stubEnv('SZL_GROK_MODEL', '  grok-4.6  ');
    const fetchMock = okFetch();
    const client = new XaiResponsesProvider(
      'secret-for-test',
      fetchMock as unknown as typeof fetch,
    );
    const response = await client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentBody(fetchMock)).toMatchObject({ model: 'grok-4.6' });
    expect(response.model).toBe('grok-4.6');
    expect(client.health()).toMatchObject({ model: 'grok-4.6', available: true });
  });

  it.each([
    'grok-4.5',
    'grok-latest',
    'grok-4.7-latest',
    'GROK-4.7',
    'grok 4.7',
  ])('fails closed with zero fetch calls when SZL_GROK_MODEL is %j', async (value) => {
    vi.stubEnv('SZL_GROK_MODEL', value);
    const fetchMock = vi.fn();
    const client = new XaiResponsesProvider(
      'secret-for-test',
      fetchMock as unknown as typeof fetch,
    );
    const failure = client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' }));
    await expect(failure).rejects.toBeInstanceOf(AtelierProviderUnavailableError);
    await expect(failure).rejects.toThrow(/SZL_GROK_MODEL is not an allowlisted Grok model id/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not echo the rejected value', () => {
    vi.stubEnv('SZL_GROK_MODEL', 'grok-4.5');
    const resolution = tryResolveGrokModel();
    expect(resolution.ok).toBe(false);
    if (!resolution.ok) expect(resolution.reason).not.toContain('grok-4.5');
  });

  it('uses the default when SZL_GROK_MODEL is blank or whitespace', async () => {
    vi.stubEnv('SZL_GROK_MODEL', '   ');
    const fetchMock = okFetch();
    const client = new XaiResponsesProvider(
      'secret-for-test',
      fetchMock as unknown as typeof fetch,
    );
    await client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' }));
    expect(sentBody(fetchMock)).toMatchObject({ model: 'grok-4.7' });
  });

  it('honours the deprecated A11OY_ATELIER_MODEL fallback only when allowlisted', async () => {
    vi.stubEnv('A11OY_ATELIER_MODEL', 'grok-4.6');
    expect(tryResolveGrokModel()).toEqual({
      ok: true,
      model: 'grok-4.6',
      source: 'A11OY_ATELIER_MODEL',
    });

    vi.stubEnv('A11OY_ATELIER_MODEL', 'grok-4.5');
    const fetchMock = vi.fn();
    const client = new XaiResponsesProvider(
      'secret-for-test',
      fetchMock as unknown as typeof fetch,
    );
    await expect(
      client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' })),
    ).rejects.toThrow(/A11OY_ATELIER_MODEL is not an allowlisted Grok model id/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('prefers SZL_GROK_MODEL and never falls back past a rejected value', () => {
    vi.stubEnv('SZL_GROK_MODEL', 'grok-4.7');
    vi.stubEnv('A11OY_ATELIER_MODEL', 'grok-4.6');
    expect(tryResolveGrokModel()).toMatchObject({ ok: true, model: 'grok-4.7' });

    vi.stubEnv('SZL_GROK_MODEL', 'grok-4.5');
    expect(tryResolveGrokModel().ok).toBe(false);
    expect(() => resolveGrokModel()).toThrow(AtelierProviderUnavailableError);
  });

  it('reports the pinned default from health() when nothing is overridden', () => {
    const client = new XaiResponsesProvider('secret-for-test', vi.fn() as unknown as typeof fetch);
    expect(client.health()).toMatchObject({
      model: 'grok-4.7',
      available: true,
      evidenceState: 'OBSERVED',
    });
  });

  it('reports UNAVAILABLE from health() without throwing on a rejected override', () => {
    vi.stubEnv('SZL_GROK_MODEL', 'grok-4.5');
    const client = new XaiResponsesProvider('secret-for-test', vi.fn() as unknown as typeof fetch);
    const health = client.health();
    expect(health).toMatchObject({
      provider: 'xai',
      configured: true,
      available: false,
      evidenceState: 'UNAVAILABLE',
    });
    expect(health.model).not.toBe('grok-4.5');
    expect(health.reason).toMatch(/SZL_GROK_MODEL/);
    expect(() => getAtelierProviderHealth()).not.toThrow();
    expect(getAtelierProviderHealth().every((entry) => !entry.available)).toBe(true);
  });

  it('fails provider auto-selection closed on a rejected override', () => {
    vi.stubEnv('A11OY_ATELIER_XAI_API_KEY', 'secret-for-test');
    expect(resolveProvider('auto')).toBeInstanceOf(XaiResponsesProvider);
    vi.stubEnv('SZL_GROK_MODEL', 'grok-4.5');
    expect(() => resolveProvider('auto')).toThrow(/SZL_GROK_MODEL is not an allowlisted/);
  });

  it('applies the same allowlist to the Grok Build CLI adapter before exec', async () => {
    // process.execPath is only an existing file for the health check; a rejected
    // override must fail before anything is executed.
    const cli = new GrokBuildCliProvider(process.execPath);
    expect(cli.health()).toMatchObject({ model: 'grok-4.7', available: true });
    vi.stubEnv('SZL_GROK_MODEL', 'grok-4.5');
    expect(cli.health()).toMatchObject({ available: false, evidenceState: 'UNAVAILABLE' });
    await expect(
      cli.generate(AtelierAskRequestSchema.parse({ prompt: 'hello', provider: 'grok-build' })),
    ).rejects.toBeInstanceOf(AtelierProviderUnavailableError);
  });
});
