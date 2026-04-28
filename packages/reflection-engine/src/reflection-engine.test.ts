import { InMemoryStore } from '@workspace/memory-fabric';
import { type TraceRecord, defaultTraceStore } from '@workspace/trace-graph';
import { describe, expect, it } from 'vitest';
import { InMemoryCandidateSkillLibrary } from './candidate-skill-library.js';
import { classifyFailureMode } from './classifier.js';
import { writeLessons } from './lesson-writer.js';
import { reflect, TraceNotFoundError } from './reflect.js';
import { extractBestRoute, scoreTrace } from './scorer.js';
import { draftCandidateSkill, shouldDraftSkill } from './skill-drafter.js';
import { InMemoryReflectionStore } from './store.js';

function makeTrace(overrides: Partial<TraceRecord> = {}): TraceRecord {
  return {
    traceId: 'trace-test-001',
    requestId: 'req-001',
    sessionId: 'sess-001',
    workflowId: 'wf-001',
    agentId: 'continuum',
    model: 'gpt-4o',
    promptVersion: 'v1.2',
    toolCalls: [],
    retrieval: [],
    memoryIO: [],
    citations: [],
    guardrailResults: [],
    spans: [],
    latencyMs: 1500,
    totalTokens: 400,
    promptTokens: 300,
    completionTokens: 100,
    costUsd: 0.005,
    approvals: [],
    errors: [],
    retries: 0,
    status: 'completed',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

describe('scorer', () => {
  it('gives a high score to a clean successful trace', () => {
    const trace = makeTrace({
      toolCalls: [
        { toolId: 't1', toolName: 'search', success: true, approvalRequired: false, retries: 0 },
        { toolId: 't2', toolName: 'summarize', success: true, approvalRequired: false, retries: 0 },
      ],
    });
    const score = scoreTrace(trace);
    expect(score.overall).toBeGreaterThan(0.8);
    expect(score.toolSuccessRate).toBe(1);
  });

  it('penalizes tool failures', () => {
    const trace = makeTrace({
      toolCalls: [
        {
          toolId: 't1',
          toolName: 'search',
          success: false,
          errorCode: 'TIMEOUT',
          approvalRequired: false,
          retries: 1,
        },
        { toolId: 't2', toolName: 'summarize', success: true, approvalRequired: false, retries: 0 },
      ],
      status: 'failed',
      errors: [
        { code: 'TOOL_FAILED', message: 'search timed out', timestamp: new Date().toISOString() },
      ],
    });
    const score = scoreTrace(trace);
    expect(score.overall).toBeLessThan(0.8);
    expect(score.toolSuccessRate).toBe(0.5);
  });

  it('penalizes guardrail blocks', () => {
    const trace = makeTrace({
      guardrailResults: [
        { guardId: 'pii-guard', tier: 'output', outcome: 'block', reason: 'PII detected' },
        { guardId: 'harm-guard', tier: 'output', outcome: 'block', reason: 'Harmful content' },
      ],
    });
    const score = scoreTrace(trace);
    expect(score.guardrailHealth).toBeLessThan(0.6);
  });

  it('penalizes high latency', () => {
    const trace = makeTrace({ latencyMs: 20000 });
    const score = scoreTrace(trace);
    expect(score.efficiencyScore).toBeLessThan(0.7);
  });

  it('extracts best route from trace', () => {
    const trace = makeTrace({
      toolCalls: [
        { toolId: 't1', toolName: 'search', success: true, approvalRequired: false, retries: 0 },
        { toolId: 't2', toolName: 'summarize', success: true, approvalRequired: false, retries: 0 },
      ],
    });
    const route = extractBestRoute(trace);
    expect(route.model).toBe('gpt-4o');
    expect(route.tools).toContain('search');
    expect(route.tools).toContain('summarize');
    expect(route.avgToolSuccessRate).toBe(1);
  });
});

describe('classifier', () => {
  it('classifies no_failure for a clean trace', () => {
    const trace = makeTrace();
    expect(classifyFailureMode(trace)).toBe('no_failure');
  });

  it('classifies tool_failure when tools fail', () => {
    const trace = makeTrace({
      toolCalls: [
        {
          toolId: 't1',
          toolName: 'fetch',
          success: false,
          errorCode: 'ERR',
          approvalRequired: false,
          retries: 0,
        },
      ],
      status: 'failed',
      errors: [{ code: 'TOOL_ERR', message: 'fetch failed', timestamp: new Date().toISOString() }],
    });
    expect(classifyFailureMode(trace)).toBe('tool_failure');
  });

  it('classifies guardrail_block when a guardrail blocks', () => {
    const trace = makeTrace({
      guardrailResults: [{ guardId: 'g1', tier: 'output', outcome: 'block', reason: 'blocked' }],
      status: 'failed',
    });
    expect(classifyFailureMode(trace)).toBe('guardrail_block');
  });

  it('classifies retrieval_miss when all retrievals miss', () => {
    const trace = makeTrace({
      retrieval: [{ source: 'kb', hitCount: 0, missCount: 3 }],
      status: 'failed',
    });
    expect(classifyFailureMode(trace)).toBe('retrieval_miss');
  });

  it('classifies timeout for slow traces even when completed', () => {
    const trace = makeTrace({ latencyMs: 20000 });
    expect(classifyFailureMode(trace)).toBe('timeout');
  });

  it('classifies timeout for slow failed traces', () => {
    const trace = makeTrace({ latencyMs: 20000, status: 'failed' });
    expect(classifyFailureMode(trace)).toBe('timeout');
  });

  it('classifies high_cost for expensive completed runs', () => {
    const trace = makeTrace({ costUsd: 1.5 });
    expect(classifyFailureMode(trace)).toBe('high_cost');
  });

  it('classifies retrieval_miss for completed runs with zero hits', () => {
    const trace = makeTrace({
      retrieval: [{ source: 'kb', hitCount: 0, missCount: 3 }],
    });
    expect(classifyFailureMode(trace)).toBe('retrieval_miss');
  });

  it('classifies policy_violation for policy errors', () => {
    const trace = makeTrace({
      status: 'failed',
      errors: [
        {
          code: 'POLICY_BLOCKED',
          message: 'policy denied this action',
          timestamp: new Date().toISOString(),
        },
      ],
    });
    expect(classifyFailureMode(trace)).toBe('policy_violation');
  });
});

describe('lesson-writer', () => {
  it('produces non-empty lesson for a clean run', () => {
    const trace = makeTrace({
      toolCalls: [
        { toolId: 't1', toolName: 'search', success: true, approvalRequired: false, retries: 0 },
      ],
    });
    const score = scoreTrace(trace);
    const route = extractBestRoute(trace);
    const result = writeLessons(trace, score, 'no_failure', route);
    expect(result.lesson).toBeTruthy();
    expect(result.whatWorked.length).toBeGreaterThan(0);
    expect(result.whatFailed.length).toBe(0);
  });

  it('produces failure analysis for a failed run', () => {
    const trace = makeTrace({
      toolCalls: [
        {
          toolId: 't1',
          toolName: 'fetch',
          success: false,
          errorCode: 'TIMEOUT',
          approvalRequired: false,
          retries: 0,
        },
      ],
      status: 'failed',
      errors: [
        { code: 'TOOL_ERR', message: 'fetch timed out', timestamp: new Date().toISOString() },
      ],
    });
    const score = scoreTrace(trace);
    const route = extractBestRoute(trace);
    const result = writeLessons(trace, score, 'tool_failure', route);
    expect(result.whatFailed.length).toBeGreaterThan(0);
    expect(result.whatToTryNext.length).toBeGreaterThan(0);
    expect(result.lesson).toContain('tool_failure');
  });

  it('includes retrieval miss analysis', () => {
    const trace = makeTrace({
      retrieval: [{ source: 'kb', hitCount: 0, missCount: 5 }],
      status: 'failed',
    });
    const score = scoreTrace(trace);
    const route = extractBestRoute(trace);
    const result = writeLessons(trace, score, 'retrieval_miss', route);
    expect(result.whatFailed.join(' ')).toContain('zero results');
    expect(result.whatWasMissing.join(' ')).toContain('Relevant documents');
  });
});

describe('skill-drafter', () => {
  it('should draft a skill for high-quality traces with multiple tools', () => {
    const trace = makeTrace({
      toolCalls: [
        { toolId: 't1', toolName: 'search', success: true, approvalRequired: false, retries: 0 },
        { toolId: 't2', toolName: 'analyze', success: true, approvalRequired: false, retries: 0 },
        { toolId: 't3', toolName: 'summarize', success: true, approvalRequired: false, retries: 0 },
      ],
    });
    const score = scoreTrace(trace);
    expect(shouldDraftSkill(trace, score, 'no_failure')).toBe(true);
  });

  it('should not draft a skill for low-quality traces', () => {
    const trace = makeTrace({
      toolCalls: [
        { toolId: 't1', toolName: 'fetch', success: false, approvalRequired: false, retries: 0 },
      ],
      status: 'failed',
    });
    const score = scoreTrace(trace);
    expect(shouldDraftSkill(trace, score, 'tool_failure')).toBe(false);
  });

  it('should not draft a skill for traces with few tool calls', () => {
    const trace = makeTrace({
      toolCalls: [
        { toolId: 't1', toolName: 'search', success: true, approvalRequired: false, retries: 0 },
      ],
    });
    const score = scoreTrace(trace);
    expect(shouldDraftSkill(trace, score, 'no_failure')).toBe(false);
  });

  it('drafts a valid candidate skill with required fields', () => {
    const trace = makeTrace({
      toolCalls: [
        { toolId: 't1', toolName: 'search', success: true, approvalRequired: false, retries: 0 },
        { toolId: 't2', toolName: 'analyze', success: true, approvalRequired: false, retries: 0 },
      ],
    });
    const score = scoreTrace(trace);
    const skill = draftCandidateSkill(trace, score);
    expect(skill.skillId).toBeTruthy();
    expect(skill.status).toBe('draft');
    expect(skill.derivedFromTraceId).toBe('trace-test-001');
    expect(skill.triggerKeywords).toContain('continuum');
    expect(skill.inputFields.length).toBeGreaterThan(0);
    expect(skill.outputFields.length).toBeGreaterThan(0);
  });
});

describe('reflection store', () => {
  it('stores and retrieves reflections', () => {
    const store = new InMemoryReflectionStore();
    const reflection = {
      reflectionId: 'r-001',
      traceId: 't-001',
      createdAt: new Date().toISOString(),
      qualityScore: 0.9,
      failureMode: 'no_failure' as const,
      whatWorked: ['tools succeeded'],
      whatFailed: [],
      whatWasMissing: [],
      whatToTryNext: ['promote this route'],
      bestRoute: { tools: ['search'], avgToolSuccessRate: 1 },
      lesson: 'Clean run.',
      memoryIds: {},
    };
    store.put(reflection);
    expect(store.get('r-001')).toEqual(reflection);
    expect(store.getByTrace('t-001')).toEqual(reflection);
    expect(store.count()).toBe(1);
  });

  it('lists with pagination', () => {
    const store = new InMemoryReflectionStore();
    for (let i = 0; i < 5; i++) {
      store.put({
        reflectionId: `r-${i}`,
        traceId: `t-${i}`,
        createdAt: new Date(Date.now() - i * 1000).toISOString(),
        qualityScore: 0.8,
        failureMode: 'no_failure' as const,
        whatWorked: [],
        whatFailed: [],
        whatWasMissing: [],
        whatToTryNext: [],
        bestRoute: { tools: [], avgToolSuccessRate: 1 },
        lesson: 'ok',
        memoryIds: {},
      });
    }
    const page = store.list({ limit: 2, offset: 1 });
    expect(page.length).toBe(2);
  });
});

describe('reflect()', () => {
  it('throws TraceNotFoundError for missing trace', async () => {
    await expect(
      reflect('nonexistent-trace', {
        traceStore: defaultTraceStore,
        memoryStore: new InMemoryStore(),
        reflectionStore: new InMemoryReflectionStore(),
      }),
    ).rejects.toThrow(TraceNotFoundError);
  });

  it('produces a full reflection for a known trace', async () => {
    const { TraceWriter, InMemoryTraceStore } = await import('@workspace/trace-graph');
    const traceStore = new InMemoryTraceStore();
    const writer = new TraceWriter(traceStore);
    writer.startTrace({
      traceId: 'reflect-trace-001',
      agentId: 'continuum',
      model: 'gpt-4o',
      workflowId: 'wf-test',
    });
    writer.appendToolCall('reflect-trace-001', {
      toolId: 't1',
      toolName: 'search',
      success: true,
      approvalRequired: false,
      retries: 0,
    });
    writer.appendToolCall('reflect-trace-001', {
      toolId: 't2',
      toolName: 'summarize',
      success: true,
      approvalRequired: false,
      retries: 0,
    });
    writer.completeTrace('reflect-trace-001', {
      status: 'completed',
      latencyMs: 1200,
      totalTokens: 400,
      costUsd: 0.004,
    });

    const memStore = new InMemoryStore();
    const refStore = new InMemoryReflectionStore();
    const skillLib = new InMemoryCandidateSkillLibrary();

    const reflection = await reflect('reflect-trace-001', {
      traceStore,
      memoryStore: memStore,
      reflectionStore: refStore,
      skillLibrary: skillLib,
    });

    expect(reflection.traceId).toBe('reflect-trace-001');
    expect(reflection.qualityScore).toBeGreaterThan(0);
    expect(reflection.failureMode).toBe('no_failure');
    expect(reflection.lesson).toBeTruthy();
    expect(reflection.bestRoute.tools).toContain('search');
    expect(reflection.memoryIds.episodicId).toBeTruthy();
    expect(memStore.count()).toBeGreaterThan(0);
    expect(refStore.get(reflection.reflectionId)).toEqual(reflection);

    if (reflection.candidateSkill) {
      const draft = skillLib.getDraft(reflection.candidateSkill.skillId);
      expect(draft).toBeDefined();
      expect(draft?.status).toBe('draft');
      expect(draft?.derivedFromTraceId).toBe('reflect-trace-001');
      expect(skillLib.count('draft')).toBeGreaterThan(0);
    }
  });

  it('returns the same reflection on second call for same traceId', async () => {
    const { InMemoryTraceStore, TraceWriter } = await import('@workspace/trace-graph');
    const traceStore = new InMemoryTraceStore();
    const writer = new TraceWriter(traceStore);
    writer.startTrace({ traceId: 'reflect-dedup-001', agentId: 'test' });
    writer.completeTrace('reflect-dedup-001', { status: 'completed' });

    const refStore = new InMemoryReflectionStore();
    const r1 = await reflect('reflect-dedup-001', {
      traceStore,
      memoryStore: new InMemoryStore(),
      reflectionStore: refStore,
    });
    const r2 = await reflect('reflect-dedup-001', {
      traceStore,
      memoryStore: new InMemoryStore(),
      reflectionStore: refStore,
    });
    expect(r1.reflectionId).toBe(r2.reflectionId);
  });
});
