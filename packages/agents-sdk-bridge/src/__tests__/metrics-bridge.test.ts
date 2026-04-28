import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@workspace/cognitive-observability', () => ({
  globalCollector: {
    recordKnown: vi.fn(),
    record: vi.fn(),
    flush: vi.fn(() => []),
    snapshot: vi.fn(() => []),
  },
}));

import {
  recordGenerationMetrics,
  recordToolMetrics,
  recordApprovalBottleneck,
  recordRunStart,
  recordRunComplete,
} from '../metrics-bridge.js';
import { globalCollector } from '@workspace/cognitive-observability';

describe('metrics-bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordGenerationMetrics', () => {
    it('emits token_count when total tokens > 0', () => {
      recordGenerationMetrics({
        model: 'gpt-4o',
        traceId: 'trace-1',
        inputTokens: 200,
        outputTokens: 100,
        latencyMs: 500,
      });

      expect(globalCollector.recordKnown).toHaveBeenCalledWith(
        'token_count',
        300,
        expect.objectContaining({ model: 'gpt-4o', traceId: 'trace-1' }),
      );
    });

    it('emits latency_ms regardless of token count', () => {
      recordGenerationMetrics({
        model: 'gpt-4o-mini',
        traceId: 'trace-2',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 250,
      });

      expect(globalCollector.recordKnown).toHaveBeenCalledWith(
        'latency_ms',
        250,
        expect.objectContaining({ model: 'gpt-4o-mini', spanType: 'generation' }),
      );
    });

    it('does not emit token_count when tokens are zero', () => {
      recordGenerationMetrics({
        model: 'gpt-4o',
        traceId: 'trace-3',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 100,
      });

      const calls = (globalCollector.recordKnown as any).mock.calls as any[];
      const tokenCalls = calls.filter((c) => c[0] === 'token_count');
      expect(tokenCalls.length).toBe(0);
    });
  });

  describe('recordToolMetrics', () => {
    it('emits latency_ms for successful tool calls', () => {
      recordToolMetrics({
        toolName: 'maritime_data',
        traceId: 'trace-tool',
        latencyMs: 120,
        success: true,
      });

      expect(globalCollector.recordKnown).toHaveBeenCalledWith(
        'latency_ms',
        120,
        expect.objectContaining({ toolName: 'maritime_data', spanType: 'function' }),
      );

      const calls = (globalCollector.recordKnown as any).mock.calls as any[];
      const errorCalls = calls.filter((c) => c[0] === 'tool_error_rate');
      expect(errorCalls.length).toBe(0);
    });

    it('emits tool_error_rate for failed tool calls', () => {
      recordToolMetrics({
        toolName: 'threat_feeds',
        traceId: 'trace-err',
        latencyMs: 50,
        success: false,
      });

      expect(globalCollector.recordKnown).toHaveBeenCalledWith(
        'tool_error_rate',
        1,
        expect.objectContaining({ toolName: 'threat_feeds' }),
      );
    });
  });

  describe('recordApprovalBottleneck', () => {
    it('emits approval_bottleneck_ms', () => {
      recordApprovalBottleneck({ traceId: 'trace-ap', waitMs: 30000 });

      expect(globalCollector.recordKnown).toHaveBeenCalledWith(
        'approval_bottleneck_ms',
        30000,
        expect.objectContaining({ traceId: 'trace-ap' }),
      );
    });
  });

  describe('recordRunStart / recordRunComplete', () => {
    it('emits run_started', () => {
      recordRunStart('trace-run', 'Continuum');
      expect(globalCollector.recordKnown).toHaveBeenCalledWith(
        'run_started',
        1,
        expect.objectContaining({ traceId: 'trace-run', agentName: 'Continuum' }),
      );
    });

    it('emits run_completed with latency', () => {
      recordRunComplete('trace-run', 'Continuum', 2500);
      expect(globalCollector.recordKnown).toHaveBeenCalledWith(
        'run_completed',
        2500,
        expect.objectContaining({ traceId: 'trace-run', agentName: 'Continuum' }),
      );
    });
  });
});
