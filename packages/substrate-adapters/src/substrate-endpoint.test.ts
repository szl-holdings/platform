import { afterEach, describe, expect, it, vi } from 'vitest';

import { SubstrateEndpointManager, type SubstrateEndpointConfig } from './substrate-endpoint.js';

const TEST_API_KEY = 'substrate-adapter-unit-credential';
const TEST_ENDPOINT: SubstrateEndpointConfig = {
  id: 'substrate-test',
  name: 'Substrate Test',
  modelId: 'test-model',
  baseUrl: 'http://inference.internal/v1',
  gpuRequired: false,
  modalities: ['text'],
  ssdOffload: false,
  tags: ['test'],
  enabled: true,
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.SUBSTRATE_API_KEY;
  delete process.env.SUBSTRATE_INFERENCE_URL;
});

describe('SubstrateEndpointManager inference authentication', () => {
  it('forwards the configured internal credential to chat completion', async () => {
    process.env.SUBSTRATE_API_KEY = TEST_API_KEY;
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
          model: 'test-model',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const manager = new SubstrateEndpointManager([TEST_ENDPOINT]);
    await manager.complete({
      endpointId: TEST_ENDPOINT.id,
      messages: [{ role: 'user', content: 'hello' }],
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.headers).toMatchObject({
      Authorization: `Bearer ${TEST_API_KEY}`,
    });
  });

  it('does not place the credential in propagated server errors', async () => {
    process.env.SUBSTRATE_API_KEY = TEST_API_KEY;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(`upstream echoed ${TEST_API_KEY}`, {
          status: 401,
        }),
      ),
    );

    const manager = new SubstrateEndpointManager([TEST_ENDPOINT]);
    const completion = manager.complete({
      endpointId: TEST_ENDPOINT.id,
      messages: [{ role: 'user', content: 'hello' }],
    });

    await expect(completion).rejects.not.toThrow(TEST_API_KEY);
    await expect(completion).rejects.toThrow('[REDACTED]');
  });
});
