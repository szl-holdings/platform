import type { TraceRecord } from '@workspace/trace-graph';
import type { QualityScore } from './scorer.js';
import type { FailureMode, RouteQuality } from './types.js';

export interface LessonOutput {
  whatWorked: string[];
  whatFailed: string[];
  whatWasMissing: string[];
  whatToTryNext: string[];
  lesson: string;
}

export function writeLessons(
  trace: TraceRecord,
  score: QualityScore,
  failureMode: FailureMode,
  bestRoute: RouteQuality,
): LessonOutput {
  const whatWorked: string[] = [];
  const whatFailed: string[] = [];
  const whatWasMissing: string[] = [];
  const whatToTryNext: string[] = [];

  if (score.toolSuccessRate === 1 && trace.toolCalls.length > 0) {
    whatWorked.push(
      `All ${trace.toolCalls.length} tool call(s) succeeded (${bestRoute.tools.join(', ')}).`,
    );
  } else if (score.toolSuccessRate > 0.5 && trace.toolCalls.length > 0) {
    const successes = trace.toolCalls.filter((t) => t.success).length;
    whatWorked.push(`${successes}/${trace.toolCalls.length} tool calls succeeded.`);
  }

  if (score.retrievalQuality >= 0.8 && trace.retrieval.length > 0) {
    whatWorked.push(
      `Retrieval performed well (avg quality: ${(score.retrievalQuality * 100).toFixed(0)}%).`,
    );
  }

  if (trace.status === 'completed' && trace.errors.length === 0) {
    whatWorked.push('Run completed successfully with no errors.');
  }

  if (score.efficiencyScore >= 0.8) {
    whatWorked.push(
      `Execution was efficient (latency: ${trace.latencyMs ?? 'N/A'}ms, cost: $${(trace.costUsd ?? 0).toFixed(4)}).`,
    );
  }

  if (failureMode === 'tool_failure' || score.toolSuccessRate < 1) {
    const failed = trace.toolCalls.filter((t) => !t.success);
    for (const f of failed) {
      whatFailed.push(
        `Tool "${f.toolName}" failed${f.errorCode ? ` with code ${f.errorCode}` : ''}.`,
      );
    }
  }

  if (failureMode === 'guardrail_block') {
    const blocks = trace.guardrailResults.filter(
      (g) => g.outcome === 'block' || g.outcome === 'require-approval',
    );
    for (const b of blocks) {
      whatFailed.push(`Guardrail "${b.guardId}" triggered: ${b.reason ?? 'no reason provided'}.`);
    }
  }

  if (failureMode === 'retrieval_miss') {
    whatFailed.push(
      'All retrieval queries returned zero results. Knowledge base may be incomplete.',
    );
    whatWasMissing.push('Relevant documents or records in the retrieval sources.');
  }

  if (failureMode === 'timeout') {
    whatFailed.push(`Execution was too slow (${trace.latencyMs}ms), exceeding acceptable limits.`);
  }

  if (failureMode === 'policy_violation') {
    for (const e of trace.errors) {
      if (e.code.toLowerCase().includes('policy') || e.message.toLowerCase().includes('policy')) {
        whatFailed.push(`Policy violation: ${e.message}`);
      }
    }
  }

  if (failureMode === 'high_cost') {
    whatFailed.push(
      `Cost exceeded threshold: $${trace.costUsd?.toFixed(4)} with ${trace.totalTokens ?? 'unknown'} tokens.`,
    );
  }

  for (const e of trace.errors) {
    if (!whatFailed.some((f) => f.includes(e.message))) {
      whatFailed.push(`Error [${e.code}]: ${e.message}`);
    }
  }

  if (trace.retrieval.length === 0 && failureMode !== 'no_failure') {
    whatWasMissing.push('No retrieval was attempted; grounding data may have improved outcome.');
  }

  if (!trace.model) {
    whatWasMissing.push('Model was not recorded; model attribution is missing from this trace.');
  }

  if (trace.toolCalls.length === 0 && failureMode !== 'no_failure') {
    whatWasMissing.push('No tools were called; additional tool use may have resolved the failure.');
  }

  if (failureMode === 'tool_failure') {
    const failedTools = trace.toolCalls.filter((t) => !t.success).map((t) => t.toolName);
    whatToTryNext.push(`Retry with fallback tools in place of: ${failedTools.join(', ')}.`);
    if (trace.toolCalls.some((t) => !t.success && t.retries === 0)) {
      whatToTryNext.push('Add retry logic with exponential back-off for failed tool calls.');
    }
  }

  if (failureMode === 'guardrail_block') {
    whatToTryNext.push(
      'Reformulate the request to avoid triggering guardrails, or request operator approval.',
    );
  }

  if (failureMode === 'retrieval_miss') {
    whatToTryNext.push(
      'Broaden retrieval queries or seed the knowledge base with relevant documents.',
    );
  }

  if (failureMode === 'timeout') {
    whatToTryNext.push(
      `Switch to a faster model or reduce tool parallelism to cut latency below acceptable threshold.`,
    );
  }

  if (failureMode === 'high_cost') {
    whatToTryNext.push(
      'Use a cheaper model for initial passes and reserve high-cost models for final synthesis.',
    );
    whatToTryNext.push('Implement token budgets to cap spend per run.');
  }

  if (score.overall >= 0.85) {
    whatToTryNext.push(
      'Run is high-quality; consider promoting this route as the canonical strategy.',
    );
  }

  const lessonParts: string[] = [];
  if (failureMode !== 'no_failure') {
    lessonParts.push(`Failure mode: ${failureMode}.`);
  }
  if (whatWorked.length > 0) {
    lessonParts.push(`Worked well: ${whatWorked[0]}`);
  }
  if (whatFailed.length > 0) {
    lessonParts.push(`Root issue: ${whatFailed[0]}`);
  }
  if (whatToTryNext.length > 0) {
    lessonParts.push(`Next action: ${whatToTryNext[0]}`);
  }
  lessonParts.push(`Quality score: ${(score.overall * 100).toFixed(0)}/100.`);

  const lesson = lessonParts.join(' ') || 'Run completed without notable observations.';

  return { whatWorked, whatFailed, whatWasMissing, whatToTryNext, lesson };
}
