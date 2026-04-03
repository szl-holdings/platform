import type {
  GoldenDatasetCase,
  EvalCaseResult,
  EvalSuiteReport,
  EvalAssertion,
  EvalDomain,
  PulseEvalConfig,
} from "./types.js";
import { ALL_DATASETS, DOMAIN_DATASETS } from "./golden-datasets.js";

type EvalExecutor = (
  input: string | Record<string, unknown>,
  caseId: string,
  domain: EvalDomain,
) => Promise<{
  output: Record<string, unknown>;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
  costUsd?: number;
}>;

function getNestedField(obj: Record<string, unknown>, field: string): unknown {
  const parts = field.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    const idx = part.match(/\[(\d+)\]/);
    if (idx) {
      const arrKey = part.replace(/\[\d+\]/, "");
      const arr = (current as Record<string, unknown>)[arrKey];
      if (Array.isArray(arr)) {
        current = arr[parseInt(idx[1], 10)];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }
  return current;
}

function checkAssertion(
  output: Record<string, unknown>,
  assertion: EvalAssertion,
): { passed: boolean; actual: unknown } {
  const actual = getNestedField(output, assertion.field);
  switch (assertion.operator) {
    case "equals":
      return { passed: actual === assertion.value, actual };
    case "contains":
      return { passed: typeof actual === "string" && actual.includes(assertion.value as string), actual };
    case "not_contains":
      return { passed: typeof actual !== "string" || !actual.includes(assertion.value as string), actual };
    case "exists":
      return { passed: actual !== undefined && actual !== null, actual };
    case "not_exists":
      return { passed: actual === undefined || actual === null, actual };
    case "gt":
      return { passed: typeof actual === "number" && actual > (assertion.value as number), actual };
    case "lt":
      return { passed: typeof actual === "number" && actual < (assertion.value as number), actual };
    case "gte":
      return { passed: typeof actual === "number" && actual >= (assertion.value as number), actual };
    case "lte":
      return { passed: typeof actual === "number" && actual <= (assertion.value as number), actual };
    case "oneOf":
      return { passed: Array.isArray(assertion.value) && (assertion.value as unknown[]).includes(actual), actual };
    case "notEmpty":
      return {
        passed: Array.isArray(actual) ? actual.length > 0 : typeof actual === "string" ? actual.length > 0 : actual != null,
        actual,
      };
    case "within_range": {
      const range = assertion.value as { min: number; max: number };
      return { passed: typeof actual === "number" && actual >= range.min && actual <= range.max, actual };
    }
    default:
      return { passed: false, actual };
  }
}

function computeScore(assertionResults: Array<{ passed: boolean; weight?: number }>): number {
  if (assertionResults.length === 0) return 0;
  const totalWeight = assertionResults.reduce((s, a) => s + (a.weight ?? 1), 0);
  const passedWeight = assertionResults.reduce((s, a) => s + (a.passed ? (a.weight ?? 1) : 0), 0);
  return passedWeight / totalWeight;
}

export async function runPulseEvals(
  executor: EvalExecutor,
  options: {
    domains?: EvalDomain[];
    caseIds?: string[];
    includeRedTeam?: boolean;
    suiteId?: string;
    suiteName?: string;
    config?: PulseEvalConfig;
  } = {},
): Promise<EvalSuiteReport> {
  const {
    domains,
    caseIds,
    includeRedTeam = true,
    suiteId = `pulse_eval_${Date.now()}`,
    suiteName = "PULSE EVALS — Full Suite",
    config = {},
  } = options;

  let cases: GoldenDatasetCase[] = ALL_DATASETS;

  if (domains?.length) {
    cases = cases.filter(c => domains.includes(c.domain));
  }

  if (caseIds?.length) {
    cases = cases.filter(c => caseIds.includes(c.id));
  }

  if (!includeRedTeam) {
    cases = cases.filter(c => !c.isRedTeam);
  }

  const results: EvalCaseResult[] = [];
  let totalLatency = 0;
  let totalTokens = 0;
  let totalCost = 0;
  let topModel = "unknown";

  for (const evalCase of cases) {
    try {
      const { output, model, latencyMs, tokensUsed, costUsd } = await executor(
        evalCase.input,
        evalCase.id,
        evalCase.domain,
      );

      topModel = model;
      totalLatency += latencyMs;
      totalTokens += tokensUsed ?? 0;
      totalCost += costUsd ?? 0;

      const assertionResults = evalCase.assertions.map(assertion => {
        const { passed, actual } = checkAssertion(output, assertion);
        return {
          field: assertion.field,
          operator: assertion.operator,
          expected: assertion.value ?? "exists",
          actual,
          passed,
          description: assertion.description,
        };
      });

      const score = computeScore(assertionResults);

      results.push({
        caseId: evalCase.id,
        domain: evalCase.domain,
        isRedTeam: evalCase.isRedTeam ?? false,
        passed: assertionResults.every(a => a.passed),
        score,
        assertions: assertionResults,
        model,
        latencyMs,
        tokensUsed,
        costUsd,
        error: null,
      });
    } catch (err) {
      results.push({
        caseId: evalCase.id,
        domain: evalCase.domain,
        isRedTeam: evalCase.isRedTeam ?? false,
        passed: false,
        score: 0,
        assertions: [],
        model: "error",
        latencyMs: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const passed = results.filter(r => r.passed).length;

  const domainForReport = domains?.length === 1 ? domains[0] : "ranking";

  return {
    suiteId,
    suiteName,
    domain: domainForReport,
    timestamp: new Date().toISOString(),
    model: topModel,
    totalCases: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length > 0 ? passed / results.length : 0,
    avgLatencyMs: results.length > 0 ? Math.round(totalLatency / results.length) : 0,
    avgScore: results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0,
    totalTokensUsed: totalTokens,
    totalCostUsd: totalCost,
    results,
  };
}

export async function runDomainEvals(
  domain: EvalDomain,
  executor: EvalExecutor,
  options?: { suiteId?: string; config?: PulseEvalConfig },
): Promise<EvalSuiteReport> {
  const cases = DOMAIN_DATASETS[domain] ?? [];
  return runPulseEvals(executor, {
    domains: [domain],
    suiteId: options?.suiteId ?? `pulse_${domain}_${Date.now()}`,
    suiteName: `PULSE EVALS — ${domain.toUpperCase()} Suite`,
    config: options?.config,
  });
}

export async function runRedTeamEvals(
  executor: EvalExecutor,
  options?: { suiteId?: string; config?: PulseEvalConfig },
): Promise<EvalSuiteReport> {
  return runPulseEvals(executor, {
    domains: ["red_team"],
    includeRedTeam: true,
    suiteId: options?.suiteId ?? `pulse_redteam_${Date.now()}`,
    suiteName: "PULSE EVALS — Red Team Suite",
    config: options?.config,
  });
}
