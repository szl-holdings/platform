import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../lib/ai-engine/src/providers/hf-client.js', () => ({
  chatCompletionWithFallback: vi.fn(),
}));

vi.mock('../../lib/ai-engine/src/governed-structured-call.js', () => ({
  governedStructuredCall: vi.fn(),
  RefusalError: class RefusalError extends Error {
    name = 'RefusalError';
    runId: string;
    incidentId: string;
    domain: string;
    constructor(message: string, runId: string, incidentId: string, domain: string) {
      super(message);
      this.runId = runId;
      this.incidentId = incidentId;
      this.domain = domain;
    }
  },
  PolicyBlockError: class PolicyBlockError extends Error {
    name = 'PolicyBlockError';
    runId: string;
    failedRules: string[];
    constructor(message: string, runId: string, failedRules: string[]) {
      super(message);
      this.runId = runId;
      this.failedRules = failedRules;
    }
  },
}));

import { chatCompletionWithFallback } from '../../lib/ai-engine/src/providers/hf-client.js';
import { governedStructuredCall } from '../../lib/ai-engine/src/governed-structured-call.js';
import { createGatewayAdapter } from '../../lib/ai-engine/src/gateway-adapter.js';
import { routeModel } from '../../lib/ai-engine/src/providers/hf-router.js';

const mockCompletion = chatCompletionWithFallback as ReturnType<typeof vi.fn>;
const mockGovernedCall = governedStructuredCall as ReturnType<typeof vi.fn>;

const MOCK_PROVENANCE = {
  runId: 'gsc_test-run-id',
  agentId: 'maritime-triage',
  domain: 'vessels',
  model: 'Qwen/Qwen3-8B',
  provider: 'huggingface',
  promptHash: 'abc123',
  promptTokens: 10,
  completionTokens: 20,
  totalTokens: 30,
  latencyMs: 100,
  governanceVerdict: 'allowed' as const,
  covenantFailures: [],
  generatedAt: new Date().toISOString(),
};

const MOCK_HF_RESULT = {
  content: 'test response',
  model: 'Qwen/Qwen3-8B',
  provider: 'huggingface',
  finishReason: 'stop',
  usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
  latencyMs: 100,
  toolCalls: [],
  raw: {},
};

const MOCK_TRIAGE_PAYLOAD = {
  priority: 'P1',
  urgency: 'urgent',
  category: 'security',
  subcategory: 'vessel',
  routeTo: 'maritime-ops',
  summary: 'Suspicious vessel activity',
  keyEntities: [],
  suggestedActions: ['alert coast guard'],
  requiresHumanReview: true,
  confidence: 0.9,
};

const MOCK_EXTRACT_PAYLOAD = {
  entities: [],
  relationships: [],
  summary: 'No critical entities found',
  confidence: 0.8,
};

const MOCK_PLAN_PAYLOAD = {
  action: 'Escalate to maritime operations',
  actionType: 'escalate' as const,
  confidence: 0.85,
  evidence: [],
  impactedOwner: 'ops-team',
  approvalRequired: true,
  approvalLevel: 'manager' as const,
  deadline: null,
  sla: null,
  reasoning: 'Vessel proximity to restricted zone warrants escalation',
  alternatives: [],
};

describe('createGatewayAdapter', () => {
  const ctx = { domain: 'vessels', agentId: 'maritime-triage' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCompletion.mockResolvedValue(MOCK_HF_RESULT);
    mockGovernedCall.mockResolvedValue({
      result: MOCK_TRIAGE_PAYLOAD,
      runId: 'gsc_test-run-id',
      provenance: MOCK_PROVENANCE,
      completion: MOCK_HF_RESULT,
    });
  });

  it('creates an adapter with all required methods', () => {
    const adapter = createGatewayAdapter(ctx);
    expect(typeof adapter.respond).toBe('function');
    expect(typeof adapter.triage).toBe('function');
    expect(typeof adapter.extract).toBe('function');
    expect(typeof adapter.plan).toBe('function');
  });

  it('respond() calls chatCompletionWithFallback with reasoning route class', async () => {
    const adapter = createGatewayAdapter(ctx);
    const result = await adapter.respond('What is the vessel status?');
    expect(mockCompletion).toHaveBeenCalledOnce();
    expect(mockGovernedCall).not.toHaveBeenCalled();
    const [messages, route] = mockCompletion.mock.lastCall!;
    expect(route.role).toBe('reasoning');
    expect(messages.some((m: { role: string }) => m.role === 'system')).toBe(true);
    expect(messages.some((m: { content: string }) => m.content.includes('What is the vessel status?'))).toBe(true);
    expect(result.routeClass).toBe('reasoning');
    expect(result.domain).toBe('vessels');
    expect(result.agentId).toBe('maritime-triage');
    expect(result.strategy).toBe('preferred');
  });

  it('triage() calls governedStructuredCall with triage route class and triageDecision schema', async () => {
    mockGovernedCall.mockResolvedValue({
      result: MOCK_TRIAGE_PAYLOAD,
      runId: 'gsc_test-run-id',
      provenance: MOCK_PROVENANCE,
      completion: MOCK_HF_RESULT,
    });
    const adapter = createGatewayAdapter(ctx);
    const result = await adapter.triage('Suspicious vessel near port Alpha');

    expect(mockGovernedCall).toHaveBeenCalledOnce();
    expect(mockCompletion).not.toHaveBeenCalled();

    const [, route, , options] = mockGovernedCall.mock.lastCall!;
    expect(route.role).toBe('triage');
    expect(options.schemaName).toBe('triageDecision');
    expect(options.domain).toBe('vessels');

    expect(result.outcome).toBe('success');
    if (result.outcome === 'success') {
      expect(result.payload.priority).toBe('P1');
      expect(result.payload.urgency).toBe('urgent');
      expect(result.payload.confidence).toBe(0.9);
      expect(result.runId).toBe('gsc_test-run-id');
    }
  });

  it('extract() calls governedStructuredCall with extraction route class and extractedEntities schema', async () => {
    mockGovernedCall.mockResolvedValue({
      result: MOCK_EXTRACT_PAYLOAD,
      runId: 'gsc_extract-run-id',
      provenance: MOCK_PROVENANCE,
      completion: MOCK_HF_RESULT,
    });
    const adapter = createGatewayAdapter(ctx);
    const result = await adapter.extract('IMO 9123456 at coordinates 35.2N 24.1E');

    expect(mockGovernedCall).toHaveBeenCalledOnce();
    const [, route, , options] = mockGovernedCall.mock.lastCall!;
    expect(route.role).toBe('extraction');
    expect(options.schemaName).toBe('extractedEntities');

    expect(result.outcome).toBe('success');
    if (result.outcome === 'success') {
      expect(Array.isArray(result.payload.entities)).toBe(true);
      expect(result.payload.confidence).toBe(0.8);
    }
  });

  it('plan() calls governedStructuredCall with planning route class and planningResult schema', async () => {
    mockGovernedCall.mockResolvedValue({
      result: MOCK_PLAN_PAYLOAD,
      runId: 'gsc_plan-run-id',
      provenance: MOCK_PROVENANCE,
      completion: MOCK_HF_RESULT,
    });
    const adapter = createGatewayAdapter(ctx);
    const result = await adapter.plan('Coordinate port security response for vessel alert');

    expect(mockGovernedCall).toHaveBeenCalledOnce();
    const [, route, , options] = mockGovernedCall.mock.lastCall!;
    expect(route.role).toBe('planning');
    expect(options.schemaName).toBe('planningResult');
    expect(options.riskTier).toBe('high');

    expect(result.outcome).toBe('success');
    if (result.outcome === 'success') {
      expect(result.payload.action).toBe('Escalate to maritime operations');
      expect(result.payload.actionType).toBe('escalate');
      expect(result.payload.reasoning).toBeTruthy();
      expect(result.payload.approvalRequired).toBe(true);
    }
  });

  it('plan() prompt asks for action/actionType fields, not goal/steps', async () => {
    mockGovernedCall.mockResolvedValue({
      result: MOCK_PLAN_PAYLOAD,
      runId: 'gsc_plan-run-id',
      provenance: MOCK_PROVENANCE,
      completion: MOCK_HF_RESULT,
    });
    const adapter = createGatewayAdapter(ctx);
    await adapter.plan('Decide how to handle security breach');

    const [messages] = mockGovernedCall.mock.lastCall!;
    const sys = messages.find((m: { role: string }) => m.role === 'system');
    expect(sys?.content).toContain('actionType');
    expect(sys?.content).toContain('action');
    expect(sys?.content).not.toContain('goal');
    expect(sys?.content).not.toContain('steps');
  });

  it('respond() result includes content, model, provider, latencyMs, usage, and strategy', async () => {
    const adapter = createGatewayAdapter(ctx);
    const result = await adapter.respond('Status check');
    expect(result.content).toBe('test response');
    expect(result.model).toBe('Qwen/Qwen3-8B');
    expect(result.provider).toBe('huggingface');
    expect(result.latencyMs).toBe(100);
    expect(result.usage?.promptTokens).toBe(10);
    expect(result.strategy).toBe('preferred');
  });

  it('uses custom systemPrompt when provided', async () => {
    const adapter = createGatewayAdapter({ ...ctx, systemPrompt: 'Custom system instructions' });
    await adapter.respond('Hello');
    const [messages] = mockCompletion.mock.lastCall!;
    const sys = messages.find((m: { role: string }) => m.role === 'system');
    expect(sys?.content).toBe('Custom system instructions');
  });

  it('passes maxTokens override through to route for respond()', async () => {
    const adapter = createGatewayAdapter(ctx);
    await adapter.respond('Test', { maxTokens: 512 });
    const [, route] = mockCompletion.mock.lastCall!;
    expect(route.maxTokens).toBe(512);
  });

  it('cheapest strategy selects fallback/smaller model', async () => {
    const adapter = createGatewayAdapter({ ...ctx, strategy: 'cheapest' });
    await adapter.respond('Test');
    const [, route] = mockCompletion.mock.lastCall!;
    const expectedModel = process.env.HF_FALLBACK_LLM ?? 'Qwen/Qwen3-0.6B';
    expect(route.model).toBe(expectedModel);
  });

  it('fastest strategy uses reduced token limit', async () => {
    const adapter = createGatewayAdapter({ ...ctx, strategy: 'fastest' });
    await adapter.respond('Test');
    const [, route] = mockCompletion.mock.lastCall!;
    expect(route.maxTokens).toBeLessThanOrEqual(768);
  });

  it('fallback strategy selects secondary model', async () => {
    const adapter = createGatewayAdapter({ ...ctx, strategy: 'fallback' });
    await adapter.respond('Test');
    const [, route] = mockCompletion.mock.lastCall!;
    const expectedModel = process.env.HF_SECONDARY_LLM ?? 'Qwen/Qwen3-8B';
    expect(route.model).toBe(expectedModel);
  });

  it('triage() returns outcome:refusal when governedStructuredCall throws RefusalError', async () => {
    const { RefusalError } = await import('../../lib/ai-engine/src/governed-structured-call.js');
    const err = new RefusalError('Model refused to produce JSON', 'gsc_run1', 'ref_inc1', 'vessels');
    mockGovernedCall.mockRejectedValue(err);

    const adapter = createGatewayAdapter(ctx);
    const result = await adapter.triage('trigger refusal');

    expect(result.outcome).toBe('refusal');
    if (result.outcome === 'refusal') {
      expect(result.runId).toBe('gsc_run1');
      expect(result.incidentId).toBe('ref_inc1');
    }
  });

  it('triage() returns outcome:policy_block when governedStructuredCall throws PolicyBlockError', async () => {
    const { PolicyBlockError } = await import('../../lib/ai-engine/src/governed-structured-call.js');
    const err = new PolicyBlockError('Covenant violation', 'gsc_run2', ['no-pii-in-output']);
    mockGovernedCall.mockRejectedValue(err);

    const adapter = createGatewayAdapter(ctx);
    const result = await adapter.triage('trigger block');

    expect(result.outcome).toBe('policy_block');
    if (result.outcome === 'policy_block') {
      expect(result.failedRules).toContain('no-pii-in-output');
    }
  });

  it('extract() returns outcome:refusal on RefusalError', async () => {
    const { RefusalError } = await import('../../lib/ai-engine/src/governed-structured-call.js');
    const err = new RefusalError('Cannot extract', 'gsc_run3', 'ref_inc2', 'vessels');
    mockGovernedCall.mockRejectedValue(err);

    const adapter = createGatewayAdapter(ctx);
    const result = await adapter.extract('classified content');

    expect(result.outcome).toBe('refusal');
  });

  it('plan() returns outcome:refusal on RefusalError', async () => {
    const { RefusalError } = await import('../../lib/ai-engine/src/governed-structured-call.js');
    const err = new RefusalError('Cannot plan', 'gsc_run4', 'ref_inc3', 'vessels');
    mockGovernedCall.mockRejectedValue(err);

    const adapter = createGatewayAdapter(ctx);
    const result = await adapter.plan('unsafe planning request');

    expect(result.outcome).toBe('refusal');
  });

  it('triage() re-throws unexpected errors', async () => {
    mockGovernedCall.mockRejectedValue(new Error('Network timeout'));

    const adapter = createGatewayAdapter(ctx);
    await expect(adapter.triage('test')).rejects.toThrow('Network timeout');
  });

  it('triage result includes provenance when successful', async () => {
    mockGovernedCall.mockResolvedValue({
      result: MOCK_TRIAGE_PAYLOAD,
      runId: 'gsc_prov-test',
      provenance: { ...MOCK_PROVENANCE, runId: 'gsc_prov-test' },
      completion: MOCK_HF_RESULT,
    });

    const adapter = createGatewayAdapter(ctx);
    const result = await adapter.triage('test input');

    expect(result.outcome).toBe('success');
    if (result.outcome === 'success') {
      expect(result.provenance.runId).toBe('gsc_prov-test');
      expect(result.provenance.governanceVerdict).toBe('allowed');
    }
  });
});

describe('hf-router Qwen3-8B alignment', () => {
  it('reasoning route defaults to primary model (Qwen3-8B)', () => {
    const route = routeModel('reasoning');
    const model = process.env.HF_PRIMARY_LLM ?? 'Qwen/Qwen3-8B';
    expect(route.model).toBe(model);
  });

  it('triage route defaults to secondary model (Qwen3-8B)', () => {
    const route = routeModel('triage');
    const model = process.env.HF_SECONDARY_LLM ?? 'Qwen/Qwen3-8B';
    expect(route.model).toBe(model);
  });

  it('extraction route defaults to secondary model (Qwen3-8B)', () => {
    const route = routeModel('extraction');
    const model = process.env.HF_SECONDARY_LLM ?? 'Qwen/Qwen3-8B';
    expect(route.model).toBe(model);
  });

  it('planning route defaults to primary model (Qwen3-8B)', () => {
    const route = routeModel('planning');
    const model = process.env.HF_PRIMARY_LLM ?? 'Qwen/Qwen3-8B';
    expect(route.model).toBe(model);
  });

  it('classification route uses fallback model (Qwen3-0.6B)', () => {
    const route = routeModel('classification');
    const model = process.env.HF_FALLBACK_LLM ?? 'Qwen/Qwen3-0.6B';
    expect(route.model).toBe(model);
  });

  it('model override takes priority over defaults', () => {
    const route = routeModel('reasoning', { model: 'Qwen/Qwen3-14B' });
    expect(route.model).toBe('Qwen/Qwen3-14B');
  });
});

describe('PROVIDER_MODELS Qwen3-8B alignment', () => {
  it('no HuggingFace entries should still reference Mixtral', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile('./artifacts/api-server/src/lib/ai-gateway.ts', 'utf-8');
    expect(source).not.toContain('mistralai/Mixtral');
  });

  it('all HuggingFace PROVIDER_MODELS entries use Qwen3-8B', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile('./artifacts/api-server/src/lib/ai-gateway.ts', 'utf-8');
    const hfEntries = source.match(/provider: 'huggingface', model: '([^']+)'/g) ?? [];
    expect(hfEntries.length).toBeGreaterThan(0);
    for (const entry of hfEntries) {
      expect(entry).toContain('Qwen/Qwen3-8B');
    }
  });

  it('hf-client uses router.huggingface.co endpoint by default', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile('./lib/ai-engine/src/providers/hf-client.ts', 'utf-8');
    expect(source).toContain('router.huggingface.co/hf-inference/v1');
    expect(source).not.toContain('api-inference.huggingface.co');
  });

  it('ai.ts huggingface completion uses router.huggingface.co endpoint', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile('./lib/services/src/adapters/ai.ts', 'utf-8');
    expect(source).toContain('router.huggingface.co/hf-inference/v1');
    expect(source).not.toContain('api-inference.huggingface.co');
  });

  it('ai.ts huggingface completion defaults to Qwen3-8B', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile('./lib/services/src/adapters/ai.ts', 'utf-8');
    expect(source).toContain('Qwen/Qwen3-8B');
    expect(source).not.toContain('mistralai/Mixtral');
  });

  it('ai.ts huggingfaceKey getter accepts HF_TOKEN alias', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile('./lib/services/src/adapters/ai.ts', 'utf-8');
    expect(source).toContain('HF_TOKEN');
    expect(source).toContain('HUGGINGFACE_API_KEY');
  });
});
