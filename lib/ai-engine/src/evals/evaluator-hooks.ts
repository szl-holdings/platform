/**
 * Evaluator Hook System
 *
 * Domain packs register evaluation functions that score AI recommendation
 * quality against domain-specific criteria. Hooks run offline (golden-set
 * regression) and online (post-capture quality check on live traces).
 *
 * Each evaluator receives:
 *   - The captured trace
 *   - Domain-specific context
 * And returns a score [0, 1] plus pass/fail per assertion.
 */

import type { AITrace, TraceDomain } from './trace-capture.js';

export type EvalAssertionOperator =
  | 'equals'
  | 'contains'
  | 'exists'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'oneOf'
  | 'notEmpty'
  | 'matches';

export interface EvalAssertion {
  field: string;
  operator: EvalAssertionOperator;
  value?: unknown;
  weight?: number;
}

export interface DomainEvalContext {
  domain: TraceDomain;
  entityType?: string;
  entityId?: string;
  referenceOutput?: Record<string, unknown>;
  goldenLabels?: Record<string, unknown>;
  customContext?: Record<string, unknown>;
}

export interface EvalHookResult {
  hookId: string;
  domain: TraceDomain;
  traceId: string;
  score: number;
  passed: boolean;
  assertions: Array<{
    field: string;
    operator: string;
    expected: unknown;
    actual: unknown;
    passed: boolean;
    weight: number;
  }>;
  feedback?: string;
  evaluatedAt: string;
}

export type EvalHookFn = (trace: AITrace, context: DomainEvalContext) => Promise<EvalHookResult>;

export interface RegisteredEvalHook {
  id: string;
  name: string;
  domain: TraceDomain | 'global';
  description: string;
  version: string;
  fn: EvalHookFn;
  registeredAt: string;
}

const registry = new Map<string, RegisteredEvalHook>();
const hookResults: EvalHookResult[] = [];
const MAX_RESULTS = 10000;

export function registerEvaluatorHook(hook: Omit<RegisteredEvalHook, 'registeredAt'>): void {
  registry.set(hook.id, {
    ...hook,
    registeredAt: new Date().toISOString(),
  });
}

export function unregisterEvaluatorHook(hookId: string): boolean {
  return registry.delete(hookId);
}

export function listEvaluatorHooks(domain?: TraceDomain | 'global'): RegisteredEvalHook[] {
  const hooks = Array.from(registry.values());
  if (!domain) return hooks;
  return hooks.filter((h) => h.domain === domain || h.domain === 'global');
}

export function getEvaluatorHook(hookId: string): RegisteredEvalHook | undefined {
  return registry.get(hookId);
}

export async function runEvaluatorHooksForTrace(
  trace: AITrace,
  context: DomainEvalContext,
): Promise<EvalHookResult[]> {
  const hooks = listEvaluatorHooks(trace.domain);
  const results: EvalHookResult[] = [];

  for (const hook of hooks) {
    try {
      const result = await hook.fn(trace, context);
      results.push(result);
      hookResults.unshift(result);
      if (hookResults.length > MAX_RESULTS) hookResults.length = MAX_RESULTS;
    } catch (err) {
      const failResult: EvalHookResult = {
        hookId: hook.id,
        domain: trace.domain,
        traceId: trace.traceId,
        score: 0,
        passed: false,
        assertions: [],
        feedback: `Evaluator hook error: ${err instanceof Error ? err.message : String(err)}`,
        evaluatedAt: new Date().toISOString(),
      };
      results.push(failResult);
      hookResults.unshift(failResult);
    }
  }

  return results;
}

export function getHookResults(
  options: {
    traceId?: string;
    domain?: TraceDomain;
    hookId?: string;
    passed?: boolean;
    limit?: number;
  } = {},
): EvalHookResult[] {
  let results = hookResults;
  if (options.traceId) results = results.filter((r) => r.traceId === options.traceId);
  if (options.domain) results = results.filter((r) => r.domain === options.domain);
  if (options.hookId) results = results.filter((r) => r.hookId === options.hookId);
  if (options.passed != null) results = results.filter((r) => r.passed === options.passed);
  return results.slice(0, options.limit ?? 100);
}

export interface HookAggregateStats {
  hookId: string;
  hookName: string;
  domain: TraceDomain | 'global';
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  avgScore: number;
  passRate: number;
}

export function aggregateHookStats(): HookAggregateStats[] {
  const stats = new Map<string, { hook: RegisteredEvalHook; results: EvalHookResult[] }>();

  for (const hook of registry.values()) {
    stats.set(hook.id, { hook, results: [] });
  }

  for (const result of hookResults) {
    const entry = stats.get(result.hookId);
    if (entry) entry.results.push(result);
  }

  return Array.from(stats.values()).map(({ hook, results }) => {
    const passed = results.filter((r) => r.passed).length;
    const totalScore = results.reduce((s, r) => s + r.score, 0);
    return {
      hookId: hook.id,
      hookName: hook.name,
      domain: hook.domain,
      totalRuns: results.length,
      passedRuns: passed,
      failedRuns: results.length - passed,
      avgScore: results.length > 0 ? totalScore / results.length : 0,
      passRate: results.length > 0 ? passed / results.length : 0,
    };
  });
}

registerEvaluatorHook({
  id: 'global:confidence-threshold',
  name: 'Global Confidence Threshold',
  domain: 'global',
  description: 'Fails any recommendation with confidence below the platform floor (0.4)',
  version: '1.0.0',
  fn: async (trace, _ctx) => {
    const threshold = 0.4;
    const passed = trace.confidence >= threshold;
    return {
      hookId: 'global:confidence-threshold',
      domain: trace.domain,
      traceId: trace.traceId,
      score: Math.min(1, trace.confidence / threshold),
      passed,
      assertions: [
        {
          field: 'confidence',
          operator: 'gte',
          expected: threshold,
          actual: trace.confidence,
          passed,
          weight: 1.0,
        },
      ],
      feedback: passed
        ? `Confidence ${trace.confidence.toFixed(2)} meets floor`
        : `Confidence ${trace.confidence.toFixed(2)} below floor ${threshold}`,
      evaluatedAt: new Date().toISOString(),
    };
  },
});

registerEvaluatorHook({
  id: 'global:latency-budget',
  name: 'Global Latency Budget',
  domain: 'global',
  description: 'Warns when AI recommendation latency exceeds 10 seconds',
  version: '1.0.0',
  fn: async (trace, _ctx) => {
    const budgetMs = 10000;
    const passed = trace.latencyMs <= budgetMs;
    const score = Math.min(1, budgetMs / Math.max(trace.latencyMs, 1));
    return {
      hookId: 'global:latency-budget',
      domain: trace.domain,
      traceId: trace.traceId,
      score,
      passed,
      assertions: [
        {
          field: 'latencyMs',
          operator: 'lte',
          expected: budgetMs,
          actual: trace.latencyMs,
          passed,
          weight: 0.5,
        },
      ],
      feedback: passed
        ? `Latency ${trace.latencyMs}ms within budget`
        : `Latency ${trace.latencyMs}ms exceeds ${budgetMs}ms budget`,
      evaluatedAt: new Date().toISOString(),
    };
  },
});

registerEvaluatorHook({
  id: 'global:cost-budget',
  name: 'Global Cost Budget',
  domain: 'global',
  description: 'Fails recommendations that exceed the per-call cost budget ($1.00)',
  version: '1.0.0',
  fn: async (trace, _ctx) => {
    const budgetUsd = 1.0;
    const passed = trace.costEstimateUsd <= budgetUsd;
    const score = passed ? 1 : Math.max(0, 1 - (trace.costEstimateUsd - budgetUsd) / budgetUsd);
    return {
      hookId: 'global:cost-budget',
      domain: trace.domain,
      traceId: trace.traceId,
      score,
      passed,
      assertions: [
        {
          field: 'costEstimateUsd',
          operator: 'lte',
          expected: budgetUsd,
          actual: trace.costEstimateUsd,
          passed,
          weight: 0.8,
        },
      ],
      feedback: passed
        ? `Cost $${trace.costEstimateUsd.toFixed(4)} within budget`
        : `Cost $${trace.costEstimateUsd.toFixed(4)} exceeds $${budgetUsd.toFixed(2)} budget`,
      evaluatedAt: new Date().toISOString(),
    };
  },
});
