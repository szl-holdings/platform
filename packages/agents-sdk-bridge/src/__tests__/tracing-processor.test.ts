import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SzlTracingProcessor } from '../tracing-processor.js';
import { InMemoryTraceStore } from '@workspace/trace-graph/store';
import { TraceWriter } from '@workspace/trace-graph/writer';

vi.mock('@workspace/cognitive-observability', () => ({
  globalCollector: {
    recordKnown: vi.fn(),
    record: vi.fn(),
    flush: vi.fn(() => []),
    snapshot: vi.fn(() => []),
  },
}));

function makeTrace(traceId = 'trace-1', name = 'test-agent') {
  return {
    traceId,
    name,
    groupId: null,
    metadata: {},
    type: 'trace' as const,
    start: vi.fn(),
    end: vi.fn(),
    clone: vi.fn(),
    toJSON: vi.fn(() => ({ traceId })),
  };
}

function makeSpan(
  traceId: string,
  spanData: { type: string; [key: string]: unknown },
  opts: {
    spanId?: string;
    parentId?: string | null;
    startedAt?: string;
    endedAt?: string;
    error?: { message: string } | null;
  } = {},
) {
  return {
    traceId,
    spanId: opts.spanId ?? 'span-1',
    parentId: opts.parentId ?? null,
    spanData,
    startedAt: opts.startedAt ?? new Date(Date.now() - 100).toISOString(),
    endedAt: opts.endedAt ?? new Date().toISOString(),
    error: opts.error ?? null,
    type: 'trace.span' as const,
    start: vi.fn(),
    end: vi.fn(),
    setError: vi.fn(),
    clone: vi.fn(),
    toJSON: vi.fn(() => ({})),
    previousSpan: undefined,
  };
}

describe('SzlTracingProcessor', () => {
  let store: InMemoryTraceStore;
  let processor: SzlTracingProcessor;

  beforeEach(() => {
    store = new InMemoryTraceStore();
    processor = new SzlTracingProcessor({ traceStore: store });
  });

  describe('onTraceStart', () => {
    it('creates a trace record in the store', async () => {
      const trace = makeTrace('trace-abc', 'my-agent');
      await processor.onTraceStart(trace as any);

      const record = store.get('trace-abc');
      expect(record).toBeDefined();
      expect(record?.traceId).toBe('trace-abc');
      expect(record?.status).toBe('running');
    });
  });

  describe('onTraceEnd', () => {
    it('marks the trace as completed', async () => {
      const trace = makeTrace('trace-end', 'my-agent');
      await processor.onTraceStart(trace as any);
      await processor.onTraceEnd(trace as any);

      const record = store.get('trace-end');
      expect(record?.status).toBe('completed');
    });
  });

  describe('onSpanEnd — GenerationSpan', () => {
    it('records token counts as a ToolCallRecord and emits metrics', async () => {
      const { globalCollector } = await import('@workspace/cognitive-observability');

      const trace = makeTrace('trace-gen');
      await processor.onTraceStart(trace as any);

      const span = makeSpan('trace-gen', {
        type: 'generation',
        model: 'gpt-4o',
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      await processor.onSpanEnd(span as any);

      const record = store.get('trace-gen');
      expect(record?.toolCalls.length).toBeGreaterThan(0);
      const toolCall = record?.toolCalls[0];
      expect(toolCall?.toolName).toContain('gpt-4o');
      expect(toolCall?.tokens).toBe(150);

      expect(globalCollector.recordKnown).toHaveBeenCalledWith(
        'token_count',
        150,
        expect.objectContaining({ model: 'gpt-4o' }),
      );
    });

    it('does not emit token_count when usage is zero', async () => {
      const { globalCollector } = await import('@workspace/cognitive-observability');
      vi.clearAllMocks();

      const trace = makeTrace('trace-gen-zero');
      await processor.onTraceStart(trace as any);

      const span = makeSpan('trace-gen-zero', {
        type: 'generation',
        model: 'gpt-4o-mini',
        usage: { input_tokens: 0, output_tokens: 0 },
      });

      await processor.onSpanEnd(span as any);

      const tokenCalls = (globalCollector.recordKnown as any).mock.calls.filter(
        (c: any[]) => c[0] === 'token_count',
      );
      expect(tokenCalls.length).toBe(0);
    });
  });

  describe('onSpanEnd — FunctionSpan', () => {
    it('records a ToolCallRecord for the function', async () => {
      const trace = makeTrace('trace-fn');
      await processor.onTraceStart(trace as any);

      const span = makeSpan('trace-fn', {
        type: 'function',
        name: 'maritime_data',
        input: '{"query":"vessel-123"}',
        output: '{"position":"50.0N 1.0W"}',
      });

      await processor.onSpanEnd(span as any);

      const record = store.get('trace-fn');
      const toolCall = record?.toolCalls.find((tc) => tc.toolId === 'function:maritime_data');
      expect(toolCall).toBeDefined();
      expect(toolCall?.success).toBe(true);
    });

    it('marks a failed function as success:false', async () => {
      const trace = makeTrace('trace-fn-err');
      await processor.onTraceStart(trace as any);

      const span = makeSpan(
        'trace-fn-err',
        {
          type: 'function',
          name: 'threat_feeds',
          input: '{}',
          output: '',
        },
        { error: { message: 'network timeout' } },
      );

      await processor.onSpanEnd(span as any);

      const record = store.get('trace-fn-err');
      const toolCall = record?.toolCalls.find((tc) => tc.toolId === 'function:threat_feeds');
      expect(toolCall?.success).toBe(false);
    });
  });

  describe('onSpanEnd — GuardrailSpan', () => {
    it('records a GuardrailResult with block outcome when triggered', async () => {
      const trace = makeTrace('trace-guard');
      await processor.onTraceStart(trace as any);

      const span = makeSpan('trace-guard', {
        type: 'guardrail',
        name: 'pii-filter',
        triggered: true,
      });

      await processor.onSpanEnd(span as any);

      const record = store.get('trace-guard');
      const guardrail = record?.guardrailResults.find((g) => g.guardId === 'sdk:pii-filter');
      expect(guardrail?.outcome).toBe('block');
    });

    it('records a GuardrailResult with pass outcome when not triggered', async () => {
      const trace = makeTrace('trace-guard-pass');
      await processor.onTraceStart(trace as any);

      const span = makeSpan('trace-guard-pass', {
        type: 'guardrail',
        name: 'content-policy',
        triggered: false,
      });

      await processor.onSpanEnd(span as any);

      const record = store.get('trace-guard-pass');
      const guardrail = record?.guardrailResults.find((g) => g.guardId === 'sdk:content-policy');
      expect(guardrail?.outcome).toBe('pass');
    });
  });

  describe('onSpanEnd — HandoffSpan', () => {
    it('calls behavioralTracer.recordRoutingFork with routing type', async () => {
      const mockTracer = { recordRoutingFork: vi.fn().mockResolvedValue(undefined) };
      const p = new SzlTracingProcessor({
        traceStore: store,
        behavioralTracer: mockTracer,
      });

      const trace = makeTrace('trace-handoff');
      await p.onTraceStart(trace as any);

      const span = makeSpan('trace-handoff', {
        type: 'handoff',
        from_agent: 'alloy',
        to_agent: 'sentinel',
      });

      await p.onSpanEnd(span as any);

      expect(mockTracer.recordRoutingFork).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'alloy',
          traceId: 'trace-handoff',
        }),
      );
    });
  });
});
