/**
 * End-to-end integration test for the Alloy Agentic RAG loop.
 *
 * Runs the full pipeline (memory → plan → specialist fan-out → merge → generate → reflect)
 * against the in-memory stores and mock MCP servers (no real DB / HTTP calls).
 *
 * Asserts:
 *   - evidence ledger contains expected entries
 *   - trace covers all phases
 *   - final answer is non-empty
 *   - both planner modes produce equivalent output shapes
 */
import { describe, it, expect } from 'vitest';
import { runAgenticRag } from '../index.js';
import type { AgenticRagRequest } from '@szl-holdings/contracts/agentic-rag';

const MARITIME_QUERY: AgenticRagRequest = {
  query: 'Identify anomalous vessel activity in the North Atlantic corridor for the past 48 hours',
  context: {
    domain: 'vessels',
    sessionId: 'integration-test-session',
    orgId: 1,
    metadata: { test: true },
  },
  policy: {
    plannerMode: 'cot-decompose',
    maxSpecialists: 3,
    topK: 8,
    maxBudgetUsd: 1.0,
  },
};

describe('Agentic RAG — end-to-end integration', () => {
  it('runs the full loop and returns a completed response', async () => {
    const { response, trace } = await runAgenticRag(MARITIME_QUERY);

    expect(response.status).toBe('completed');
    expect(response.answer.length).toBeGreaterThan(0);
    expect(response.query).toBe(MARITIME_QUERY.query);
  });

  it('evidence ledger (bundle) contains entries from multiple specialists', async () => {
    const { response } = await runAgenticRag(MARITIME_QUERY);

    expect(response.evidence.chunks.length).toBeGreaterThan(0);
    const specialists = new Set(response.evidence.chunks.map((c) => c.specialistAgent));
    expect(specialists.size).toBeGreaterThan(1);
  });

  it('trace covers all required phases', async () => {
    const { trace } = await runAgenticRag(MARITIME_QUERY);

    const phases = new Set(trace.steps.map((s) => s.phase));
    expect(phases.has('perceive')).toBe(true);
    expect(phases.has('plan')).toBe(true);
    expect(phases.has('execute')).toBe(true);
    expect(phases.has('reflect')).toBe(true);
  });

  it('trace records MCP calls for each specialist', async () => {
    const { trace } = await runAgenticRag(MARITIME_QUERY);

    expect(trace.mcpCalls.length).toBeGreaterThanOrEqual(1);
    const successfulCalls = trace.mcpCalls.filter((c) => c.success);
    expect(successfulCalls.length).toBeGreaterThan(0);
  });

  it('generation record is present with cost and token data', async () => {
    const { response } = await runAgenticRag(MARITIME_QUERY);

    expect(response.generation.provider).toBeTruthy();
    expect(response.generation.totalTokens).toBeGreaterThan(0);
    expect(response.generation.estimatedCostUsd).toBeGreaterThanOrEqual(0);
    expect(response.generation.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('both planner modes produce equivalent response shapes', async () => {
    const [cotResult, reactResult] = await Promise.all([
      runAgenticRag({ ...MARITIME_QUERY, policy: { ...MARITIME_QUERY.policy, plannerMode: 'cot-decompose' } }),
      runAgenticRag({ ...MARITIME_QUERY, policy: { ...MARITIME_QUERY.policy, plannerMode: 'react' } }),
    ]);

    for (const { response } of [cotResult, reactResult]) {
      expect(response.runId).toBeTruthy();
      expect(response.traceId).toBeTruthy();
      expect(response.plan.planId).toBeTruthy();
      expect(response.evidence.bundleId).toBeTruthy();
      expect(response.generation.provider).toBeTruthy();
      expect(response.answer.length).toBeGreaterThan(0);
    }

    expect(cotResult.response.plannerMode).toBe('cot-decompose');
    expect(reactResult.response.plannerMode).toBe('react');
  });

  it('memory writes happen in both tiers', async () => {
    const { trace } = await runAgenticRag(MARITIME_QUERY);

    expect(trace.memoryWritesShortTerm).toBeGreaterThan(0);
    expect(trace.memoryWritesLongTerm).toBeGreaterThan(0);
  });

  it('total duration is tracked', async () => {
    const { response, trace } = await runAgenticRag(MARITIME_QUERY);

    expect(response.totalDurationMs).toBeGreaterThanOrEqual(0);
    expect(trace.totalDurationMs).toBeGreaterThanOrEqual(0);
  });
});
