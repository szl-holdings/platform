/**
 * Sentra → ROSIE observed-vs-baseline bridge.
 *
 * Wraps the canonical `risk-score` formula (FORMULA_REGISTRY §5.2) with
 * `instrument()` so every Sentra scoring call emits a `FormulaInvocation`
 * carrying observed-vs-baseline metadata. The api-server's
 * `setInvocationSink` (artifacts/api-server/src/routes/a11oy-formulas-api.ts)
 * forwards those invocations to `formulaInvocationDriftBridge`
 * (artifacts/api-server/src/jobs/rosie-evolution-loop.ts), which records
 * them into the module-level drift detector that the scheduled
 * `runRosieEvolutionTick` drains into the A11oy Codex tuning queue.
 *
 * Three instrumented callsites consume this module today:
 *   1. POST /sentra/ml/asset-risk        — asset compromise probability
 *   2. POST /sentra/ml/blast-radius      — identity lateral-movement risk
 *   3. POST /sentra/ml/adversary-replay  — adversary scenario success rate
 *
 * Contract documented in: docs/audits/formulas.md
 *   §"Observed-vs-baseline meta contract".
 */

import {
  instrument,
  getFormula,
  type FormulaSpec,
} from '@szl-holdings/formulas';
import { logger } from './logger.js';

const RISK_SCORE_SPEC = getFormula('risk-score') as
  | FormulaSpec<
      { severity: number; likelihood: number; valueAtRisk: number; cap?: number },
      number
    >
  | undefined;

const RISK_CAP_DEFAULT = 1_000_000;
const RISK_CITATION = 'v10-canonical.md §5.2';

/**
 * Sensitivity factor used to project a candidate `cap` when observed
 * performance drifts from baseline. A drift of 1.0 (full saturation)
 * suggests shrinking the cap by 10% — small, conservative steps so the
 * ROSIE loop never proposes wild swings.
 */
const CAP_NUDGE_FACTOR = 0.1;

function projectCandidateCap(gap: number): number {
  const clamped = Math.max(0, Math.min(1, gap));
  return Math.max(1_000, Math.round(RISK_CAP_DEFAULT * (1 - clamped * CAP_NUDGE_FACTOR)));
}

interface ObservationCommon {
  /** Real measured value the route just produced (in [0,1] for ML heads). */
  observed: number;
  /** Expected/target value for this input class (drives the gap). */
  baseline: number;
  /** Approximate severity in [0,1] used to reconstruct the canonical inputs. */
  severity: number;
  /** Approximate likelihood in [0,1]. */
  likelihood: number;
  /** Estimated $ value at risk. */
  valueAtRisk: number;
  /** Optional caller tag for the proof-ledger row. */
  caller?: string;
}

function buildInstrumented(caller: string) {
  if (!RISK_SCORE_SPEC) {
    return null;
  }
  return instrument(RISK_SCORE_SPEC, caller, (input, output) => {
    // The route-supplied observed/baseline live on the input record under
    // `__obs` — we strip them before hashing concerns by reading them here.
    const obs = (input as unknown as { __obs?: ObservationMeta }).__obs;
    if (!obs) return undefined;
    const gap = Math.abs(obs.observed - obs.baseline);
    void output;
    return {
      observed: obs.observed,
      baseline: obs.baseline,
      parameter: 'cap',
      oldValue: RISK_CAP_DEFAULT,
      candidateValue: projectCandidateCap(gap),
      thesisCitation: RISK_CITATION,
      irreversibility: 0.1,
      // Pass-through diagnostic context (ignored by the drift bridge).
      callsite: caller,
    };
  });
}

interface ObservationMeta {
  observed: number;
  baseline: number;
}

const instrumentedByCaller = new Map<string, ReturnType<typeof buildInstrumented>>();

function getInstrumented(caller: string) {
  let i = instrumentedByCaller.get(caller);
  if (i === undefined) {
    i = buildInstrumented(caller);
    instrumentedByCaller.set(caller, i);
  }
  return i;
}

function emit(callsite: string, params: ObservationCommon): void {
  const i = getInstrumented(callsite);
  if (!i) {
    return;
  }
  try {
    i({
      severity: Math.max(0, Math.min(1, params.severity)),
      likelihood: Math.max(0, Math.min(1, params.likelihood)),
      valueAtRisk: Math.max(0, params.valueAtRisk),
      cap: RISK_CAP_DEFAULT,
      // Carrier for the metaFn; not part of the formula's pure inputs but
      // tolerated by the impl (it destructures only the named fields).
      __obs: { observed: params.observed, baseline: params.baseline },
    } as unknown as Parameters<NonNullable<typeof i>>[0]);
  } catch (err) {
    logger.debug({ err, callsite }, '[sentra-formula-observations] emit failed (non-fatal)');
  }
}

/**
 * Expected baseline p30d compromise probability per asset-criticality
 * band. Drawn from the ML model's median back-test bucket so observed
 * scores that consistently exceed these flag a tuning opportunity.
 */
const ASSET_RISK_BASELINE: Record<string, number> = {
  critical: 0.35,
  high: 0.25,
  medium: 0.15,
  low: 0.08,
};

export function recordAssetRiskObservation(args: {
  criticality: 'critical' | 'high' | 'medium' | 'low';
  internetExposure: boolean;
  cvssScore?: number;
  observed: number;
  valueAtRisk?: number;
}): void {
  const baseline = ASSET_RISK_BASELINE[args.criticality] ?? 0.15;
  const severity = Math.min(1, (args.cvssScore ?? 5) / 10);
  const likelihood = args.internetExposure ? 0.65 : 0.3;
  const valueAtRisk =
    args.valueAtRisk ??
    ({ critical: 5_000_000, high: 1_500_000, medium: 400_000, low: 80_000 }[args.criticality] ?? 100_000);
  emit('sentra-ml/asset-risk', {
    observed: args.observed,
    baseline,
    severity,
    likelihood,
    valueAtRisk,
  });
}

const BLAST_RADIUS_BASELINE_BY_TYPE: Record<string, number> = {
  human: 0.18,
  'service-account': 0.28,
  machine: 0.22,
};

export function recordBlastRadiusObservation(args: {
  identityType: 'human' | 'service-account' | 'machine';
  hasAdminRights: boolean;
  accessibleSystems: number;
  observed: number;
  estimatedBlastRadius?: number;
}): void {
  const baseline = BLAST_RADIUS_BASELINE_BY_TYPE[args.identityType] ?? 0.2;
  const severity = args.hasAdminRights ? 0.85 : 0.5;
  const likelihood = Math.min(1, args.accessibleSystems / 100);
  const valueAtRisk = Math.max(50_000, (args.estimatedBlastRadius ?? args.accessibleSystems * 25_000));
  emit('sentra-ml/blast-radius', {
    observed: args.observed,
    baseline,
    severity,
    likelihood,
    valueAtRisk,
  });
}

const ADVERSARY_REPLAY_BASELINE = 0.3;

export function recordAdversaryReplayObservation(args: {
  observed: number;
  kevListedCount: number;
  webApps: number;
  endpoints: number;
}): void {
  const severity = Math.min(1, 0.4 + args.kevListedCount * 0.1);
  const likelihood = Math.min(1, (args.webApps + args.endpoints / 25) / 20);
  const valueAtRisk = Math.max(100_000, (args.webApps * 200_000) + (args.endpoints * 5_000));
  emit('sentra-ml/adversary-replay', {
    observed: args.observed,
    baseline: ADVERSARY_REPLAY_BASELINE,
    severity,
    likelihood,
    valueAtRisk,
  });
}

/** Test-only: expose the baseline tables so the smoke test can assert drift math. */
export const _testing = {
  ASSET_RISK_BASELINE,
  BLAST_RADIUS_BASELINE_BY_TYPE,
  ADVERSARY_REPLAY_BASELINE,
  RISK_CAP_DEFAULT,
  projectCandidateCap,
};
