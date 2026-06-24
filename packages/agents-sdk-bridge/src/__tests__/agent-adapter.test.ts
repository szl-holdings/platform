/**
 * Unit tests for SzlAgentAdapter.
 *
 * Tests cover:
 *   - OpenAI model routing (preferredModel passed through)
 *   - Non-OpenAI provider routing (model name preserved, not silently dropped)
 *   - Input/output guardrail attachment
 *   - Handoff resolution
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@workspace/tool-mesh', () => {
  const gateway = { invoke: vi.fn() };
  return {
    ToolMeshGateway: function MockGateway() { return gateway; },
    defaultToolRegistry: { get: vi.fn().mockReturnValue(null), register: vi.fn(), unregister: vi.fn() },
    defaultGateway: gateway,
  };
});

const mockGateway = { invoke: vi.fn() };

vi.mock('@szl-holdings/policy-engine', () => ({
  evaluateFull: vi.fn().mockResolvedValue({
    evaluationId: 'test-eval',
    allowed: true,
    requiresApproval: false,
    requiresDualApproval: false,
    policyResult: { effect: 'allow', matchedRules: [], evaluatedAt: Date.now() },
    evaluatedAt: Date.now(),
    layersRun: [],
  }),
}));

vi.mock('@workspace/trace-graph', () => {
  function MockTraceWriter() {
    return { appendGuardrailResult: vi.fn() };
  }
  return {
    defaultTraceStore: { get: vi.fn(), save: vi.fn() },
    TraceWriter: MockTraceWriter,
  };
});

vi.mock('@openai/agents', () => {
  function MockAgent(this: Record<string, unknown>, config: Record<string, unknown>) {
    Object.assign(this, config);
    this._type = 'Agent';
  }

  return { Agent: MockAgent };
});

import { SzlAgentAdapter } from '../agent-adapter.js';

function makeDefinition(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-agent',
    name: 'Test Agent',
    domain: 'maritime',
    systemPrompt: 'You are a maritime assistant.',
    tools: [],
    collaboratesWith: [],
    useAgentsSdk: true,
    ...overrides,
  };
}

describe('SzlAgentAdapter', () => {
  let adapter: SzlAgentAdapter;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SzlAgentAdapter({
      domain: 'maritime',
      enableGuardrails: false,
      gateway: mockGateway as any,
    });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('resolveModel — provider routing', () => {
    it('passes preferredModel through for OpenAI provider', () => {
      const def = makeDefinition({ preferredProvider: 'openai', preferredModel: 'gpt-4o' });
      const agent = adapter.adapt(def) as any;
      expect(agent.model).toBe('gpt-4o');
    });

    it('passes preferredModel through for Azure provider', () => {
      const def = makeDefinition({ preferredProvider: 'azure', preferredModel: 'gpt-4-turbo' });
      const agent = adapter.adapt(def) as any;
      expect(agent.model).toBe('gpt-4-turbo');
    });

    it('returns undefined when no preferredModel is set for OpenAI', () => {
      const def = makeDefinition({ preferredProvider: 'openai', preferredModel: undefined });
      const agent = adapter.adapt(def) as any;
      expect(agent.model).toBeUndefined();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('passes model name through for Anthropic provider (not silently dropped) and warns', () => {
      const def = makeDefinition({
        preferredProvider: 'anthropic',
        preferredModel: 'claude-3-5-sonnet-20241022',
      });
      const agent = adapter.adapt(def) as any;

      // Model name must NOT be silently discarded — the caller needs it to configure
      // a custom ModelProvider on the Runner that can route to Anthropic.
      expect(agent.model).toBe('claude-3-5-sonnet-20241022');

      // A clear warning should explain the limitation and the required action
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('anthropic'),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('ModelProvider'),
      );
    });

    it('passes model name through for Gemini provider and warns', () => {
      const def = makeDefinition({
        preferredProvider: 'gemini',
        preferredModel: 'gemini-1.5-pro',
      });
      const agent = adapter.adapt(def) as any;

      expect(agent.model).toBe('gemini-1.5-pro');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('gemini'));
    });

    it('returns undefined and warns for non-OpenAI provider with no model set', () => {
      const def = makeDefinition({ preferredProvider: 'anthropic', preferredModel: undefined });
      const agent = adapter.adapt(def) as any;

      expect(agent.model).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('anthropic'));
    });

    it('uses openai as default when no preferredProvider is set — no warning emitted', () => {
      const def = makeDefinition({ preferredProvider: undefined, preferredModel: 'gpt-4o-mini' });
      const agent = adapter.adapt(def) as any;
      expect(agent.model).toBe('gpt-4o-mini');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('adapt()', () => {
    it('maps systemPrompt to instructions', () => {
      const def = makeDefinition({ systemPrompt: 'Be concise.' });
      const agent = adapter.adapt(def) as any;
      expect(agent.instructions).toBe('Be concise.');
    });

    it('registers the adapted agent in the internal registry', () => {
      const def = makeDefinition({ id: 'navigator' });
      adapter.adapt(def);
      expect(adapter.get('navigator')).toBeDefined();
    });
  });

  describe('adaptAll()', () => {
    it('processes all definitions and returns a Map keyed by agent ID', () => {
      const defs = [
        makeDefinition({ id: 'alpha', name: 'Alpha', collaboratesWith: [] }),
        makeDefinition({ id: 'beta', name: 'Beta', collaboratesWith: [] }),
      ];

      const registry = adapter.adaptAll(defs);
      expect(registry.size).toBe(2);
      expect(registry.has('alpha')).toBe(true);
      expect(registry.has('beta')).toBe(true);
    });

    it('resolves handoffs when the handoff target exists in the same batch', () => {
      const defs = [
        makeDefinition({ id: 'target', name: 'Target', collaboratesWith: [] }),
        makeDefinition({ id: 'source', name: 'Source', collaboratesWith: ['target'] }),
      ];

      const registry = adapter.adaptAll(defs);
      const sourceAgent = registry.get('source') as any;
      expect(sourceAgent.handoffs).toHaveLength(1);
    });

    it('warns and skips handoffs for unknown collaborator IDs', () => {
      const defs = [
        makeDefinition({ id: 'source', name: 'Source', collaboratesWith: ['nonexistent-agent'] }),
      ];

      const registry = adapter.adaptAll(defs);
      const sourceAgent = registry.get('source') as any;
      expect(sourceAgent.handoffs).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('nonexistent-agent'),
      );
    });
  });
});
