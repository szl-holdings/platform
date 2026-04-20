import type { TraceRecord } from '@workspace/trace-graph';
import type { FailureMode } from './types.js';

const HIGH_LATENCY_THRESHOLD_MS = 15000;
const HIGH_COST_THRESHOLD_USD = 0.5;

export function classifyFailureMode(trace: TraceRecord): FailureMode {
  const hasGuardrailBlock = trace.guardrailResults.some((g) => g.outcome === 'block');
  if (hasGuardrailBlock) return 'guardrail_block';

  if (trace.latencyMs !== undefined && trace.latencyMs > HIGH_LATENCY_THRESHOLD_MS) {
    return 'timeout';
  }

  if (trace.costUsd !== undefined && trace.costUsd > HIGH_COST_THRESHOLD_USD) {
    return 'high_cost';
  }

  const hasRetrievalMiss =
    trace.retrieval.length > 0 && trace.retrieval.every((r) => r.hitCount === 0 && r.missCount > 0);
  if (hasRetrievalMiss) return 'retrieval_miss';

  if (trace.status === 'completed' && trace.errors.length === 0) {
    return 'no_failure';
  }

  const hasToolFailure = trace.toolCalls.some((t) => !t.success);

  const hasPolicyError = trace.errors.some(
    (e) =>
      e.code.toLowerCase().includes('policy') ||
      e.message.toLowerCase().includes('policy') ||
      e.message.toLowerCase().includes('permission'),
  );
  if (hasPolicyError) return 'policy_violation';

  if (hasToolFailure) return 'tool_failure';

  if (trace.errors.length > 0) return 'unknown';

  return 'no_failure';
}

export function describeFailureMode(mode: FailureMode): string {
  const descriptions: Record<FailureMode, string> = {
    no_failure: 'No significant failures detected in this run.',
    tool_failure: 'One or more tool calls failed during execution.',
    guardrail_block: 'A guardrail blocked or required approval for an action.',
    retrieval_miss: 'Retrieval returned zero results for all queries.',
    timeout: 'Execution exceeded acceptable latency thresholds.',
    policy_violation: 'A policy or permission constraint was violated.',
    high_cost: 'Token or API cost exceeded acceptable thresholds.',
    unknown: 'An unclassified error occurred during execution.',
  };
  return descriptions[mode];
}
