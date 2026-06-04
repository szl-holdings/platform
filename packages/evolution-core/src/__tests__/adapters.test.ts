/**
 * Contract tests — Adapters
 *
 * Verifies that all adapters satisfy the InferenceBackendAdapter interface.
 */

import {
  LocalMockInferenceAdapter,
  LocalSafeInferenceAdapter,
} from '../adapters/index.js';
import type { InferenceBackendAdapter, InferenceRequest } from '../types.js';

function makeRequest(overrides: Partial<InferenceRequest> = {}): InferenceRequest {
  return {
    prompt: 'Assess the risk level of the following transaction.',
    candidateId: 'test-candidate',
    maxTokens: 128,
    temperature: 0.1,
    ...overrides,
  };
}

function adapterContractSuite(name: string, getAdapter: () => InferenceBackendAdapter) {
  describe(`${name} — InferenceBackendAdapter contract`, () => {
    let adapter: InferenceBackendAdapter;

    beforeEach(() => {
      adapter = getAdapter();
    });

    test('has a non-empty backendId', () => {
      expect(typeof adapter.backendId).toBe('string');
      expect(adapter.backendId.length).toBeGreaterThan(0);
    });

    test('infer() resolves with required fields', async () => {
      const result = await adapter.infer(makeRequest());
      expect(typeof result.output).toBe('string');
      expect(result.output.length).toBeGreaterThan(0);
      expect(typeof result.latencyMs).toBe('number');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.tokensOut).toBe('number');
      expect(typeof result.simulated).toBe('boolean');
    });

    test('infer() backend field matches adapter.backendId', async () => {
      const result = await adapter.infer(makeRequest());
      expect(result.backend).toBe(adapter.backendId);
    });

    test('healthCheck() resolves with healthy=true', async () => {
      const result = await adapter.healthCheck();
      expect(result.healthy).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.backend).toBe(adapter.backendId);
    });

    test('infer() tokensOut is positive for non-empty prompt', async () => {
      const result = await adapter.infer(makeRequest({ prompt: 'What is the risk classification?' }));
      expect(result.tokensOut).toBeGreaterThan(0);
    });
  });
}

adapterContractSuite('LocalMockInferenceAdapter', () => new LocalMockInferenceAdapter());
adapterContractSuite('LocalSafeInferenceAdapter', () => new LocalSafeInferenceAdapter());
