/**
 * Integration test — runs a simple agent through the SzlTracingProcessor
 * and verifies that spans appear in the Trace Graph store.
 *
 * NOTE: This test does NOT make real LLM calls. It simulates the SDK span
 * lifecycle by calling the processor methods directly, mirroring what
 * the SDK would emit during an actual run() invocation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SzlTracingProcessor } from '../tracing-processor.js';
import { InMemoryTraceStore } from '@workspace/trace-graph/store';

vi.mock('@workspace/cognitive-observability', () => ({
  globalCollector: {
    recordKnown: vi.fn(),
    record: vi.fn(),
    flush: vi.fn(() => []),
    snapshot: vi.fn(() => []),
  },
}));

const TRACE_ID = 'integration-test-trace-001';

describe('SzlTracingProcessor — integration', () => {
  let store: InMemoryTraceStore;
  let processor: SzlTracingProcessor;

  beforeEach(() => {
    store = new InMemoryTraceStore();
    processor = new SzlTracingProcessor({ traceStore: store });
  });

  it('full agent lifecycle — trace appears in Trace Graph with spans, tool calls, and guardrail results', async () => {
    const now = Date.now();

    const trace = {
      traceId: TRACE_ID,
      name: 'Continuum orchestration run',
      groupId: 'conv-001',
      metadata: {},
      type: 'trace' as const,
    };

    await processor.onTraceStart(trace as any);

    const agentSpan = {
      traceId: TRACE_ID,
      spanId: 'span-agent-1',
      parentId: null,
      spanData: {
        type: 'agent',
        name: 'Continuum',
        tools: ['system_health', 'admin_overview'],
        handoffs: ['sentinel'],
      },
      startedAt: new Date(now).toISOString(),
      endedAt: new Date(now + 1200).toISOString(),
      error: null,
      type: 'trace.span' as const,
    };

    await processor.onSpanStart(agentSpan as any);

    const generationSpan = {
      traceId: TRACE_ID,
      spanId: 'span-gen-1',
      parentId: 'span-agent-1',
      spanData: {
        type: 'generation',
        model: 'gpt-4o',
        usage: { input_tokens: 300, output_tokens: 150 },
      },
      startedAt: new Date(now + 100).toISOString(),
      endedAt: new Date(now + 800).toISOString(),
      error: null,
      type: 'trace.span' as const,
    };

    await processor.onSpanStart(generationSpan as any);
    await processor.onSpanEnd(generationSpan as any);

    const functionSpan = {
      traceId: TRACE_ID,
      spanId: 'span-fn-1',
      parentId: 'span-agent-1',
      spanData: {
        type: 'function',
        name: 'system_health',
        input: '{}',
        output: '{"status":"healthy"}',
      },
      startedAt: new Date(now + 850).toISOString(),
      endedAt: new Date(now + 1000).toISOString(),
      error: null,
      type: 'trace.span' as const,
    };

    await processor.onSpanStart(functionSpan as any);
    await processor.onSpanEnd(functionSpan as any);

    const guardrailSpan = {
      traceId: TRACE_ID,
      spanId: 'span-guard-1',
      parentId: 'span-agent-1',
      spanData: {
        type: 'guardrail',
        name: 'output-safety',
        triggered: false,
      },
      startedAt: new Date(now + 1000).toISOString(),
      endedAt: new Date(now + 1050).toISOString(),
      error: null,
      type: 'trace.span' as const,
    };

    await processor.onSpanStart(guardrailSpan as any);
    await processor.onSpanEnd(guardrailSpan as any);

    await processor.onSpanEnd(agentSpan as any);

    await processor.onTraceEnd(trace as any);

    const record = store.get(TRACE_ID);

    expect(record).toBeDefined();
    expect(record!.traceId).toBe(TRACE_ID);
    expect(record!.status).toBe('completed');

    expect(record!.toolCalls.length).toBeGreaterThanOrEqual(2);

    const genToolCall = record!.toolCalls.find((tc) => tc.toolId.includes('gpt-4o'));
    expect(genToolCall).toBeDefined();
    expect(genToolCall!.tokens).toBe(450);
    expect(genToolCall!.success).toBe(true);

    const fnToolCall = record!.toolCalls.find((tc) => tc.toolId === 'function:system_health');
    expect(fnToolCall).toBeDefined();
    expect(fnToolCall!.success).toBe(true);

    expect(record!.guardrailResults.length).toBeGreaterThanOrEqual(1);
    const guardrailResult = record!.guardrailResults.find((g) => g.guardId === 'sdk:output-safety');
    expect(guardrailResult).toBeDefined();
    expect(guardrailResult!.outcome).toBe('pass');

    expect(record!.spans.length).toBeGreaterThan(0);
  });

  it('records handoff span and calls behavioral tracer with routing fork', async () => {
    const mockTracer = { recordRoutingFork: vi.fn().mockResolvedValue(undefined) };
    const p = new SzlTracingProcessor({
      traceStore: store,
      behavioralTracer: mockTracer,
      includeSensitiveData: false,
    });

    const traceId = 'trace-handoff-integration';
    const t = {
      traceId,
      name: 'Multi-agent run',
      groupId: null,
      metadata: {},
      type: 'trace' as const,
    };

    await p.onTraceStart(t as any);

    const handoffSpan = {
      traceId,
      spanId: 'span-handoff-1',
      parentId: null,
      spanData: {
        type: 'handoff',
        from_agent: 'continuum',
        to_agent: 'sentinel',
      },
      startedAt: new Date().toISOString(),
      endedAt: new Date(Date.now() + 50).toISOString(),
      error: null,
      type: 'trace.span' as const,
    };

    await p.onSpanEnd(handoffSpan as any);

    expect(mockTracer.recordRoutingFork).toHaveBeenCalledWith(
      expect.objectContaining({
        traceId,
        agentId: 'continuum',
        decision: expect.stringContaining('sentinel'),
      }),
    );
  });
});
