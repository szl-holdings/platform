import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AtelierAskRequestSchema } from './contracts.js';
import {
  type AtelierProvider,
  AtelierProviderResponseError,
  AtelierProviderUnavailableError,
  GrokBuildCliProvider,
  isGrokBuildQuotaError,
  resolveProvider,
  XaiResponsesProvider,
} from './provider.js';
import { AtelierPolicyDeniedError, askAtelier } from './service.js';

const { execFileMock } = vi.hoisted(() => ({ execFileMock: vi.fn() }));
vi.mock('node:child_process', () => ({ execFile: execFileMock }));

beforeEach(() => {
  vi.stubEnv('SZL_GROK_MODEL', undefined);
  vi.stubEnv('A11OY_ATELIER_MODEL', undefined);
  vi.stubEnv('A11OY_ATELIER_XAI_API_KEY', undefined);
  vi.stubEnv('A11OY_ATELIER_GROK_CLI_PATH', undefined);
  execFileMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

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
      AtelierAskRequestSchema.parse({ prompt: 'hello', provider: 'xai', reasoningEffort: 'xhigh' }),
    );

    expect(response.text).toBe('provider-ok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.x.ai/v1/responses');
    expect(init).toMatchObject({ method: 'POST', redirect: 'manual' });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: 'grok-4.7',
      input: 'hello',
      reasoning: { effort: 'xhigh' },
      store: false,
    });
    expect(AtelierAskRequestSchema.parse({ prompt: 'hello' }).reasoningEffort).toBe('medium');
    expect(response.model).toBe('grok-4.7');
    expect(client.health().model).toBe('grok-4.7');
  });

  it.each([
    'low',
    'medium',
    'high',
    'xhigh',
  ] as const)('preserves the %s reasoning effort in the Grok 4.7 request', async (reasoningEffort) => {
    const fetchMock = vi.fn(async (_input: unknown, _init?: RequestInit) =>
      Response.json({ output_text: 'provider-ok' }),
    );
    const client = new XaiResponsesProvider('secret-for-test', fetchMock as typeof fetch);
    await client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello', reasoningEffort }));
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      model: 'grok-4.7',
      reasoning: { effort: reasoningEffort },
      store: false,
    });
  });

  it.each([
    'SZL_GROK_MODEL',
    'A11OY_ATELIER_MODEL',
  ] as const)('supports the Grok 4.6 rollback through %s', async (environmentVariable) => {
    vi.stubEnv(environmentVariable, 'grok-4.6');
    const fetchMock = vi.fn(async (_input: unknown, _init?: RequestInit) =>
      Response.json({ output_text: 'rollback-ok' }),
    );
    const client = new XaiResponsesProvider('secret-for-test', fetchMock as typeof fetch);
    const result = await client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' }));
    expect(result.model).toBe('grok-4.6');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).model).toBe('grok-4.6');
    expect(client.health().model).toBe('grok-4.6');
  });

  it('prioritizes the estate model override over the legacy override', async () => {
    vi.stubEnv('SZL_GROK_MODEL', 'grok-4.7');
    vi.stubEnv('A11OY_ATELIER_MODEL', 'grok-4.6');
    const fetchMock = vi.fn(async (_input: unknown, _init?: RequestInit) =>
      Response.json({ output_text: 'estate-ok' }),
    );
    const client = new XaiResponsesProvider('secret-for-test', fetchMock as typeof fetch);
    const result = await client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' }));
    expect(result.model).toBe('grok-4.7');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).model).toBe('grok-4.7');
  });

  it('allows an explicit Grok 4.6 request override ahead of the estate default', async () => {
    vi.stubEnv('SZL_GROK_MODEL', 'grok-4.7');
    const fetchMock = vi.fn(async (_input: unknown, _init?: RequestInit) =>
      Response.json({ output_text: 'request-rollback-ok' }),
    );
    const client = new XaiResponsesProvider('secret-for-test', fetchMock as typeof fetch);
    const result = await client.generate(
      AtelierAskRequestSchema.parse({ prompt: 'hello', model: 'grok-4.6' }),
    );
    expect(result.model).toBe('grok-4.6');
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).model).toBe('grok-4.6');
  });

  it.each([
    'SZL_GROK_MODEL',
    'A11OY_ATELIER_MODEL',
  ] as const)('rejects an unreviewed %s override before any API call', async (environmentVariable) => {
    vi.stubEnv(environmentVariable, 'unreviewed-private-model');
    const fetchMock = vi.fn();
    const client = new XaiResponsesProvider('secret-for-test', fetchMock as typeof fetch);
    await expect(
      client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' })),
    ).rejects.toBeInstanceOf(AtelierProviderUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
    const health = client.health();
    expect(health).toMatchObject({
      configured: true,
      available: false,
      model: 'UNAVAILABLE',
      evidenceState: 'UNAVAILABLE',
    });
    expect(health.reason).toContain(environmentVariable);
    expect(JSON.stringify(health)).not.toContain('unreviewed-private-model');
    expect(JSON.stringify(health)).not.toContain('secret-for-test');
  });

  it('rejects an invalid request model without falling back to an allowed environment model', async () => {
    vi.stubEnv('SZL_GROK_MODEL', 'grok-4.7');
    const fetchMock = vi.fn();
    const client = new XaiResponsesProvider('secret-for-test', fetchMock as typeof fetch);
    await expect(
      client.generate(
        AtelierAskRequestSchema.parse({ prompt: 'hello', model: 'unreviewed-private-model' }),
      ),
    ).rejects.toBeInstanceOf(AtelierProviderUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(client.health('unreviewed-private-model')).toMatchObject({
      model: 'UNAVAILABLE',
      available: false,
    });
    expect(client.health('unreviewed-private-model').reason).not.toContain(
      'unreviewed-private-model',
    );
  });

  it('admits only final assistant output text from the Grok 4.7 output array', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        id: 'resp_47',
        output: [
          {
            type: 'reasoning',
            encrypted_content: 'opaque-reasoning-fixture',
            content: [{ type: 'output_text', text: 'reasoning-must-stay-private' }],
          },
          {
            type: 'message',
            role: 'user',
            content: [{ type: 'output_text', text: 'user-input-must-not-be-an-answer' }],
          },
          { type: 'function_call', content: [{ type: 'output_text', text: 'tool-output' }] },
          {
            type: 'message',
            role: 'assistant',
            content: [
              { type: 'reasoning_text', text: 'hidden-reasoning' },
              { type: 'output_text', text: 'final answer' },
              { type: 'output_text', text: { value: 'final detail' } },
            ],
          },
        ],
        usage: {
          input_tokens: 12,
          input_tokens_details: { cached_tokens: 4 },
          output_tokens: 8,
          output_tokens_details: { reasoning_tokens: 6 },
          total_tokens: 20,
        },
      }),
    );
    const client = new XaiResponsesProvider('secret-for-test', fetchMock as typeof fetch);
    const result = await client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' }));
    expect(result).toMatchObject({
      text: 'final answer\nfinal detail',
      model: 'grok-4.7',
      providerRequestId: 'resp_47',
      usage: {
        inputTokens: 12,
        cachedInputTokens: 4,
        outputTokens: 8,
        reasoningTokens: 6,
        totalTokens: 20,
      },
    });
    expect(JSON.stringify(result)).not.toContain('opaque-reasoning-fixture');
    expect(JSON.stringify(result)).not.toContain('hidden-reasoning');
  });

  it('rejects a reasoning-only response instead of treating ciphertext as an answer', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        output: [
          {
            type: 'reasoning',
            encrypted_content: 'opaque-reasoning-fixture',
            content: [{ type: 'output_text', text: 'reasoning-must-stay-private' }],
          },
        ],
      }),
    );
    const client = new XaiResponsesProvider('secret-for-test', fetchMock as typeof fetch);
    await expect(
      client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello' })),
    ).rejects.toBeInstanceOf(AtelierProviderResponseError);
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

  it.each([
    401, 402, 403, 429,
  ])('classifies explicit HTTP %i pre-inference rejection as releasable', async (status) => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: 'private provider diagnostic' } }), {
          status,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const client = new XaiResponsesProvider('secret-for-test', fetchMock as typeof fetch);
    await expect(
      client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello', provider: 'xai' })),
    ).rejects.toBeInstanceOf(AtelierProviderUnavailableError);
    await expect(
      client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello', provider: 'xai' })),
    ).rejects.not.toThrow('private provider diagnostic');
  });

  it('retains ambiguous provider server failures as response errors', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 500 }));
    const client = new XaiResponsesProvider('secret-for-test', fetchMock as typeof fetch);
    await expect(
      client.generate(AtelierAskRequestSchema.parse({ prompt: 'hello', provider: 'xai' })),
    ).rejects.toBeInstanceOf(AtelierProviderResponseError);
  });
});

describe('automatic Atelier provider selection', () => {
  it('rejects invalid configured models but honors an explicit allowed request model', async () => {
    vi.stubEnv('SZL_GROK_MODEL', 'unreviewed-private-model');
    vi.stubEnv('A11OY_ATELIER_XAI_API_KEY', 'secret-for-test');
    vi.stubEnv('A11OY_ATELIER_GROK_CLI_PATH', process.execPath);
    const fetchMock = vi.fn(async (_input: unknown, _init?: RequestInit) =>
      Response.json({ output_text: 'request-model-ok' }),
    );
    vi.stubGlobal('fetch', fetchMock);
    expect(() => resolveProvider('auto')).toThrow(AtelierProviderUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(execFileMock).not.toHaveBeenCalled();
    expect(resolveProvider('auto', 'grok-4.7')).toBeInstanceOf(XaiResponsesProvider);
    const result = await askAtelier({
      request: { prompt: 'hello', model: 'grok-4.7' },
      tenantId: 'solo-builder',
    });
    expect(result.receipt.model).toBe('grok-4.7');
    expect(result.answer).toBe('request-model-ok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).model).toBe('grok-4.7');
    fetchMock.mockClear();
    await expect(
      askAtelier({
        request: { prompt: 'hello', model: 'another-unreviewed-model' },
        tenantId: 'solo-builder',
      }),
    ).rejects.toBeInstanceOf(AtelierProviderUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(execFileMock).not.toHaveBeenCalled();
  });
});

describe('Grok Build failure classification', () => {
  it('rejects an unreviewed request model before executing the local CLI', async () => {
    vi.stubEnv('SZL_GROK_MODEL', 'grok-4.7');
    const client = new GrokBuildCliProvider(process.execPath);
    expect(client.health().available).toBe(true);
    expect(client.health().model).toBe('grok-4.7');
    await expect(
      client.generate(
        AtelierAskRequestSchema.parse({ prompt: 'hello', model: 'unreviewed-private-model' }),
      ),
    ).rejects.toBeInstanceOf(AtelierProviderUnavailableError);
    expect(execFileMock).not.toHaveBeenCalled();
    const health = client.health('unreviewed-private-model');
    expect(health).toMatchObject({
      configured: true,
      available: false,
      model: 'UNAVAILABLE',
      evidenceState: 'UNAVAILABLE',
    });
    expect(JSON.stringify(health)).not.toContain('unreviewed-private-model');
  });

  it('recognizes a known quota rejection without treating all CLI errors as unavailable', () => {
    expect(
      isGrokBuildQuotaError({
        stderr:
          'responses API error status=402 Payment Required error_message=Grok Build usage balance exhausted',
        stdout: '{"type":"error"}',
      }),
    ).toBe(true);
    expect(
      isGrokBuildQuotaError({
        stderr:
          '\u001b[31mERROR\u001b[0m responses API error status=402 Payment Required error_message=Grok Build usage balance exhausted',
        stdout: '{"type":"error"}',
      }),
    ).toBe(true);
    expect(isGrokBuildQuotaError({ stderr: 'network timeout' })).toBe(false);
    expect(isGrokBuildQuotaError(new Error('Grok Build usage balance exhausted'))).toBe(false);
    expect(
      isGrokBuildQuotaError({
        stderr:
          'responses API error status=402 Payment Required error_message=Grok Build usage balance exhausted',
        stdout: '{"text":"A completed provider answer"}',
      }),
    ).toBe(false);
    expect(
      isGrokBuildQuotaError({
        stdout:
          'responses API error status=402 Payment Required error_message=Grok Build usage balance exhausted',
      }),
    ).toBe(false);
  });
});
