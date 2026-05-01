/**
 * Unit tests for the Aggregator Agent.
 */
import { describe, it, expect } from 'vitest';
import { runAggregator } from '../aggregator.js';
import type { AgenticRagRequest } from '@szl-holdings/contracts/agentic-rag';

const BASE_REQUEST: AgenticRagRequest = {
  query: 'What is the current threat posture for our infrastructure?',
  context: { domain: 'sentra', sessionId: 'test-session-1' },
  policy: { plannerMode: 'cot-decompose', maxSpecialists: 3, topK: 5 },
};

describe('Aggregator Agent', () => {
  it('completes successfully with a cot-decompose plan', async () => {
    const { response, trace } = await runAggregator(BASE_REQUEST);
    expect(response.status).toBe('completed');
    expect(response.runId).toBeTruthy();
    expect(response.traceId).toBeTruthy();
    expect(response.plannerMode).toBe('cot-decompose');
  });

  it('completes successfully with a react plan', async () => {
    const { response } = await runAggregator({
      ...BASE_REQUEST,
      policy: { ...BASE_REQUEST.policy, plannerMode: 'react' },
    });
    expect(response.status).toBe('completed');
    expect(response.plannerMode).toBe('react');
  });

  it('returns an evidence bundle', async () => {
    const { response } = await runAggregator(BASE_REQUEST);
    expect(response.evidence.bundleId).toBeTruthy();
    expect(response.evidence.fusionMethod).toBe('rrf+cross-encoder');
    expect(response.evidence.chunks).toBeDefined();
  });

  it('returns generation metadata', async () => {
    const { response } = await runAggregator(BASE_REQUEST);
    expect(response.generation.provider).toBeTruthy();
    expect(response.generation.model).toBeTruthy();
    expect(typeof response.generation.promptTokens).toBe('number');
    expect(typeof response.generation.estimatedCostUsd).toBe('number');
  });

  it('emits a full trace with all required phases', async () => {
    const { trace } = await runAggregator(BASE_REQUEST);
    expect(trace.traceId).toBeTruthy();
    expect(trace.steps.length).toBeGreaterThan(0);
    const phases = trace.steps.map((s) => s.phase);
    expect(phases).toContain('perceive');
    expect(phases).toContain('plan');
    expect(phases).toContain('execute');
    expect(phases).toContain('reflect');
  });

  it('records MCP calls in the trace', async () => {
    const { trace } = await runAggregator(BASE_REQUEST);
    expect(trace.mcpCalls.length).toBeGreaterThan(0);
    for (const call of trace.mcpCalls) {
      expect(call.callId).toBeTruthy();
      expect(call.specialistAgent).toBeTruthy();
      expect(typeof call.durationMs).toBe('number');
    }
  });

  it('records memory reads and writes in the trace', async () => {
    const { trace } = await runAggregator(BASE_REQUEST);
    expect(typeof trace.memoryReadsShortTerm).toBe('number');
    expect(typeof trace.memoryReadsLongTerm).toBe('number');
    expect(trace.memoryWritesShortTerm).toBeGreaterThan(0);
    expect(trace.memoryWritesLongTerm).toBeGreaterThan(0);
  });

  it('response runId matches trace runId', async () => {
    const { response, trace } = await runAggregator(BASE_REQUEST);
    expect(response.runId).toBe(trace.runId);
    expect(response.traceId).toBe(trace.traceId);
  });

  it('populates specialistsInvoked in the trace', async () => {
    const { trace } = await runAggregator(BASE_REQUEST);
    expect(trace.specialistsInvoked.length).toBeGreaterThan(0);
  });

  it('respects maxSpecialists policy', async () => {
    const { trace } = await runAggregator({
      ...BASE_REQUEST,
      policy: { ...BASE_REQUEST.policy, maxSpecialists: 1 },
    });
    expect(trace.specialistsInvoked.length).toBeLessThanOrEqual(1);
  });
});
