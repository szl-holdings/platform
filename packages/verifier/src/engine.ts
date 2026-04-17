import { randomUUID } from "node:crypto";
import { aggregateDecision } from "./aggregator.js";
import { BUILT_IN_CHECKS, type Check, type RegisteredCheck } from "./checks.js";
import {
  VerifierContextSchema,
  VerifierOutputSchema,
  VerifierTargetSchema,
  type CheckResult,
  type VerifierContext,
  type VerifierDecision,
  type VerifierOutput,
  type VerifierTarget,
} from "./types.js";

const registry: RegisteredCheck[] = [...BUILT_IN_CHECKS];

/** Replace or add a check by name. */
export function registerCheck(name: string, fn: Check): void {
  const idx = registry.findIndex((c) => c.name === name);
  if (idx >= 0) registry[idx] = { name, fn };
  else registry.push({ name, fn });
}

export function unregisterCheck(name: string): boolean {
  const idx = registry.findIndex((c) => c.name === name);
  if (idx < 0) return false;
  registry.splice(idx, 1);
  return true;
}

export function listChecks(): string[] {
  return registry.map((c) => c.name);
}

/**
 * Run every applicable check against the output and aggregate into a
 * VerifierDecision. Checks that opt out (return undefined) are skipped.
 *
 * Two call shapes are supported:
 *   verify(output, target, context?)   — full form with explicit target
 *   verify(output, context?)           — short form; target defaults to
 *                                        a synthetic "output" target
 */
export function verify(
  output: VerifierOutput,
  context?: Partial<VerifierContext>,
): VerifierDecision;
export function verify(
  output: VerifierOutput,
  target: VerifierTarget,
  context?: Partial<VerifierContext>,
): VerifierDecision;
export function verify(
  output: VerifierOutput,
  targetOrContext?: VerifierTarget | Partial<VerifierContext>,
  maybeContext: Partial<VerifierContext> = {},
): VerifierDecision {
  const targetParse =
    targetOrContext !== undefined
      ? VerifierTargetSchema.safeParse(targetOrContext)
      : null;
  const target: VerifierTarget = targetParse?.success
    ? targetParse.data
    : { targetType: "output", targetId: randomUUID() };
  const context: Partial<VerifierContext> =
    targetParse?.success
      ? maybeContext
      : ((targetOrContext as Partial<VerifierContext> | undefined) ?? {});

  const parsedOutput = VerifierOutputSchema.parse(output);
  const parsedTarget = target;
  const parsedContext = VerifierContextSchema.parse(context);

  const disabled = new Set(parsedContext.disabledChecks);
  const results: CheckResult[] = [];
  for (const reg of registry) {
    if (disabled.has(reg.name)) continue;
    const r = reg.fn(parsedOutput, parsedContext);
    if (!r) continue;
    results.push(r);
    // Short-circuit: if any check raises a blocker, stop running further
    // checks. The aggregator will still emit a fully-populated decision
    // from the partial results.
    if (r.outcome === "blocked") break;
  }

  const aggregated = aggregateDecision(results);
  return {
    verifierId: randomUUID(),
    target: parsedTarget,
    action: aggregated.action,
    outcome: aggregated.outcome,
    overallScore: aggregated.overallScore,
    reasoning: aggregated.reasoning,
    checks: results,
    blockerCount: aggregated.totals.blockerCount,
    warningCount: aggregated.totals.warningCount,
    passCount: aggregated.totals.passCount,
    failCount: aggregated.totals.failCount,
    evaluatedAt: Date.now(),
    orgId: parsedContext.orgId ?? null,
    metadata: parsedContext.metadata,
  };
}
