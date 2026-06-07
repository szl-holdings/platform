import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InMemoryTraceStore } from '@workspace/trace-graph/store';

vi.mock('@szl-holdings/policy-engine', () => ({
  evaluateFull: vi.fn(),
}));

import { SzlGuardrailAdapter } from '../guardrail-adapter.js';
import { evaluateFull } from '@szl-holdings/policy-engine';

const mockEvaluateFull = vi.mocked(evaluateFull);

function makeAllowResult() {
  return {
    evaluationId: 'eval-' + Math.random(),
    allowed: true,
    requiresApproval: false,
    requiresDualApproval: false,
    policyResult: { effect: 'allow', matchedRules: [], evaluatedAt: Date.now() } as any,
    evaluatedAt: Date.now(),
    layersRun: [],
  };
}

describe('SzlGuardrailAdapter', () => {
  let adapter: SzlGuardrailAdapter;
  let store: InMemoryTraceStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new InMemoryTraceStore();
    adapter = new SzlGuardrailAdapter({
      agentId: 'test-agent',
      domain: 'maritime',
      action: 'chat-completion',
      traceStore: store,
    });
  });

  describe('checkInput', () => {
    it('returns allowed:true when policy engine allows', async () => {
      mockEvaluateFull.mockResolvedValueOnce(makeAllowResult());

      const result = await adapter.checkInput('What is the vessel position?');
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(false);
    });

    it('returns allowed:false when policy engine blocks', async () => {
      mockEvaluateFull.mockResolvedValueOnce({
        evaluationId: 'eval-2',
        allowed: false,
        requiresApproval: false,
        requiresDualApproval: false,
        blockedReason: 'Sanctions violation detected',
        policyResult: { effect: 'block', matchedRules: [], evaluatedAt: Date.now() } as any,
        evaluatedAt: Date.now(),
        layersRun: [],
      });

      const result = await adapter.checkInput('Transfer funds to blacklisted entity');
      expect(result.allowed).toBe(false);
      expect(result.blockedReason).toBe('Sanctions violation detected');
    });

    it('returns allowed:true with requiresApproval when policy requires it', async () => {
      mockEvaluateFull.mockResolvedValueOnce({
        evaluationId: 'eval-3',
        allowed: true,
        requiresApproval: true,
        requiresDualApproval: false,
        policyResult: {
          effect: 'require_approval',
          matchedRules: [],
          evaluatedAt: Date.now(),
        } as any,
        evaluatedAt: Date.now(),
        layersRun: [],
      });

      const result = await adapter.checkInput('Modify vessel route through restricted waters');
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(true);
    });

    it('returns allowed:false when evaluateFull throws (fail closed)', async () => {
      mockEvaluateFull.mockRejectedValueOnce(new Error('Policy engine unavailable'));

      const result = await adapter.checkInput('any input');
      expect(result.allowed).toBe(false);
      expect(result.blockedReason).toBe('Policy evaluation unavailable');
    });
  });

  describe('checkOutput', () => {
    it('calls evaluateFull with output phase context', async () => {
      mockEvaluateFull.mockResolvedValueOnce(makeAllowResult());

      await adapter.checkOutput('The vessel is at 50.0N 1.0W');

      expect(mockEvaluateFull).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'chat-completion',
          domain: 'maritime',
          subject: expect.objectContaining({ id: 'test-agent' }),
          context: expect.objectContaining({ phase: 'output' }),
        }),
      );
    });
  });

  describe('inputGuardrailFn / outputGuardrailFn', () => {
    it('returns a function that delegates to checkInput', async () => {
      mockEvaluateFull.mockResolvedValue(makeAllowResult());

      const fn = adapter.inputGuardrailFn();
      const result = await fn('test input');
      expect(result.allowed).toBe(true);
    });

    it('returns a function that delegates to checkOutput', async () => {
      mockEvaluateFull.mockResolvedValue(makeAllowResult());

      const fn = adapter.outputGuardrailFn();
      const result = await fn('test output');
      expect(result.allowed).toBe(true);
    });
  });
});
