import { GOLDEN_SET, type GoldenTestCase } from './golden-set.js';

export interface EvalResult {
  testId: string;
  category: string;
  passed: boolean;
  assertions: Array<{
    field: string;
    operator: string;
    expected: unknown;
    actual: unknown;
    passed: boolean;
  }>;
  model: string;
  latencyMs: number;
  error: string | null;
}

export interface EvalReport {
  timestamp: string;
  model: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: string;
  byCategory: Record<string, { total: number; passed: number; failed: number }>;
  results: EvalResult[];
  avgLatencyMs: number;
}

function getNestedField(obj: Record<string, unknown>, field: string): unknown {
  const parts = field.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function checkAssertion(
  output: Record<string, unknown>,
  assertion: GoldenTestCase['assertions'][number],
): { passed: boolean; actual: unknown } {
  const actual = getNestedField(output, assertion.field);

  switch (assertion.operator) {
    case 'equals':
      return { passed: actual === assertion.value, actual };
    case 'contains':
      return {
        passed: typeof actual === 'string' && actual.includes(assertion.value as string),
        actual,
      };
    case 'exists':
      return { passed: actual !== undefined && actual !== null, actual };
    case 'gt':
      return { passed: typeof actual === 'number' && actual > (assertion.value as number), actual };
    case 'lt':
      return { passed: typeof actual === 'number' && actual < (assertion.value as number), actual };
    case 'oneOf':
      return {
        passed: Array.isArray(assertion.value) && (assertion.value as unknown[]).includes(actual),
        actual,
      };
    case 'notEmpty':
      return {
        passed: Array.isArray(actual)
          ? actual.length > 0
          : typeof actual === 'string'
            ? actual.length > 0
            : actual != null,
        actual,
      };
    default:
      return { passed: false, actual };
  }
}

export async function runEvals(
  executor: (
    input: string,
    category: string,
  ) => Promise<{ output: Record<string, unknown>; model: string; latencyMs: number }>,
  options?: { categories?: string[]; testIds?: string[] },
): Promise<EvalReport> {
  const tests = GOLDEN_SET.filter((t) => {
    if (options?.testIds?.length) return options.testIds.includes(t.id);
    if (options?.categories?.length) return options.categories.includes(t.category);
    return true;
  });

  const results: EvalResult[] = [];
  let totalLatency = 0;
  let model = 'unknown';

  for (const test of tests) {
    try {
      const { output, model: usedModel, latencyMs } = await executor(test.input, test.category);
      model = usedModel;
      totalLatency += latencyMs;

      const assertionResults = test.assertions.map((assertion) => {
        const { passed, actual } = checkAssertion(output, assertion);
        return {
          field: assertion.field,
          operator: assertion.operator,
          expected: assertion.value ?? 'exists',
          actual,
          passed,
        };
      });

      results.push({
        testId: test.id,
        category: test.category,
        passed: assertionResults.every((a) => a.passed),
        assertions: assertionResults,
        model: usedModel,
        latencyMs,
        error: null,
      });
    } catch (err) {
      results.push({
        testId: test.id,
        category: test.category,
        passed: false,
        assertions: [],
        model: 'error',
        latencyMs: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const byCategory: EvalReport['byCategory'] = {};
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = { total: 0, passed: 0, failed: 0 };
    byCategory[r.category].total++;
    if (r.passed) byCategory[r.category].passed++;
    else byCategory[r.category].failed++;
  }

  return {
    timestamp: new Date().toISOString(),
    model,
    totalTests: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length > 0 ? `${((passed / results.length) * 100).toFixed(1)}%` : '0.0%',
    byCategory,
    results,
    avgLatencyMs: results.length > 0 ? Math.round(totalLatency / results.length) : 0,
  };
}
