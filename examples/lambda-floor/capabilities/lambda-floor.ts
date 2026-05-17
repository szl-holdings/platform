/**
 * Pepr Capability: lambda-floor
 *
 * Enforces the Doctrine V6 9-axis Λ-floor on AgentInvocation CRs at
 * admission time. On any axis failure the request is denied with reason
 * `MATURITY_GATE_BLOCKED`, mirroring the existing SZL Sentra pattern.
 *
 * Ported from SZL Holdings' a11oy TS runtime (production since 2025-Q4).
 * Source of floor constants: build-time slice of
 * packages/payload/raw/payload.json -> doctrine. See ./payload/lambda-floor-payload.json.
 *
 * License: Apache-2.0 (on the SZL Doctrine V6 license allowlist).
 */

import { Capability, a, Log } from "pepr";
import payload from "../payload/lambda-floor-payload.json" assert { type: "json" };

// ---------------------------------------------------------------------------
// Public floor constants (bundled at build time; no runtime fetch)
// ---------------------------------------------------------------------------

export const LAMBDA_CONJUNCTIVE_FLOOR = payload.lambda_conjunctive_floor; // 0.90
export const MORAL_GROUNDING_FLOOR = payload.moralGrounding_floor;       // 0.95
export const MEASURABILITY_HONESTY_FLOOR = payload.measurabilityHonesty_floor; // 0.95

export interface AxisFloor {
  id: string;
  floor: number;
}

export const AXIS_FLOORS: ReadonlyArray<AxisFloor> = payload.axes;

// ---------------------------------------------------------------------------
// Λ-9 evaluator (pure; identical truth-table to SZL's OPA Rego policy)
// ---------------------------------------------------------------------------

export type LambdaAxes = Record<string, number>;

export interface GateFailure {
  axis: string;
  value: number;
  floor: number;
}

export interface GateResult {
  admitted: boolean;
  lambdaConjunctive: number;
  failures: GateFailure[];
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

/**
 * Conjunctive Λ score: geometric mean of all 9 axes, clamped to [0,1].
 * Matches platform/policy/lambda/lambda-floor.rego and the SZL a11oy runtime.
 */
export function lambdaConjunctive(axes: LambdaAxes): number {
  const ids = AXIS_FLOORS.map((a) => a.id);
  const vals = ids.map((id) => clamp01(axes[id] ?? 0));
  if (vals.some((v) => v <= 0)) return 0;
  const logSum = vals.reduce((acc, v) => acc + Math.log(v), 0);
  return Math.exp(logSum / vals.length);
}

/**
 * Evaluate a candidate AgentInvocation's Λ-9 vector against the bundled
 * floors. Returns the per-axis failure list (empty on admit).
 */
export function evaluateLambdaFloor(axes: LambdaAxes): GateResult {
  const failures: GateFailure[] = [];
  for (const { id, floor } of AXIS_FLOORS) {
    const v = clamp01(axes[id] ?? 0);
    if (v < floor) failures.push({ axis: id, value: v, floor });
  }
  const lambdaConj = lambdaConjunctive(axes);
  if (lambdaConj < LAMBDA_CONJUNCTIVE_FLOOR) {
    failures.push({
      axis: "lambdaConjunctive",
      value: lambdaConj,
      floor: LAMBDA_CONJUNCTIVE_FLOOR,
    });
  }
  return {
    admitted: failures.length === 0,
    lambdaConjunctive: lambdaConj,
    failures,
  };
}

// ---------------------------------------------------------------------------
// Audit event shape (emitted to the proof-ledger sidecar, Plane 3 / Fix A)
// ---------------------------------------------------------------------------

export interface MaturityGateAudit {
  reason: "MATURITY_GATE_BLOCKED" | "MATURITY_GATE_OK";
  resource: { namespace: string; name: string; uid: string };
  failures: GateFailure[];
  lambdaConjunctive: number;
  doctrineVersion: string;
  replayRoot: string;
  ts: string;
}

function buildAudit(
  result: GateResult,
  meta: { namespace?: string; name?: string; uid?: string },
): MaturityGateAudit {
  return {
    reason: result.admitted ? "MATURITY_GATE_OK" : "MATURITY_GATE_BLOCKED",
    resource: {
      namespace: meta.namespace ?? "default",
      name: meta.name ?? "<unknown>",
      uid: meta.uid ?? "<unknown>",
    },
    failures: result.failures,
    lambdaConjunctive: result.lambdaConjunctive,
    doctrineVersion: payload.doctrine_version,
    replayRoot: payload.replay_root,
    ts: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// AgentInvocation CR (matches ../crd/agent-invocation.yaml)
// ---------------------------------------------------------------------------

export interface AgentInvocationSpec {
  agent: string;
  invocationId: string;
  lambda: LambdaAxes;
}

const AgentInvocation = a.GenericKind;
const AgentInvocationGVK = {
  group: "doctrine.szl.io",
  version: "v1alpha1",
  kind: "AgentInvocation",
  plural: "agentinvocations",
};

// ---------------------------------------------------------------------------
// Admission decision (pure) — the exact function the webhook handler calls.
// Exposed so fixture tests can drive the same code path as the live webhook
// without needing a kube-apiserver round trip.
// ---------------------------------------------------------------------------

export interface AdmissionDecision {
  admit: boolean;
  /** Human-readable message returned to the API server on deny; "" on admit. */
  message: string;
  /** HTTP status the webhook returns alongside `message`. */
  status: number;
  audit: MaturityGateAudit;
}

export function decideAdmission(
  spec: AgentInvocationSpec | null | undefined,
  meta: { namespace?: string; name?: string; uid?: string } = {},
): AdmissionDecision {
  if (!spec || !spec.lambda) {
    const audit = buildAudit(
      { admitted: false, lambdaConjunctive: 0, failures: [] },
      meta,
    );
    return {
      admit: false,
      message: "MATURITY_GATE_BLOCKED: missing spec.lambda",
      status: 422,
      audit,
    };
  }
  const result = evaluateLambdaFloor(spec.lambda);
  const audit = buildAudit(result, meta);
  if (result.admitted) {
    return { admit: true, message: "", status: 200, audit };
  }
  const head = result.failures[0];
  const detail = result.failures
    .map((f) => `${f.axis}=${f.value.toFixed(3)}<${f.floor.toFixed(3)}`)
    .join(",");
  const message =
    `MATURITY_GATE_BLOCKED: ${head.axis}=${head.value.toFixed(3)} ` +
    `below floor ${head.floor.toFixed(3)} [${detail}]`;
  return { admit: false, message, status: 422, audit };
}

// ---------------------------------------------------------------------------
// Capability registration
// ---------------------------------------------------------------------------

export const LambdaFloor = new Capability({
  name: "lambda-floor",
  description:
    "Enforces the Doctrine V6 9-axis Λ-floor on AgentInvocation CRs. " +
    "Denies admission with reason MATURITY_GATE_BLOCKED on any axis failure.",
  namespaces: [],
});

const { When } = LambdaFloor;

When(AgentInvocation)
  .IsCreatedOrUpdated()
  .WithKind(AgentInvocationGVK)
  .Mutate((request) => {
    // Stamp the evaluator metadata so the audit trail is consistent even when
    // the request is admitted. Mutation only — no field mangling.
    const annotations = request.Raw.metadata?.annotations ?? {};
    annotations["doctrine.szl.io/lambda-floor-evaluated-at"] =
      new Date().toISOString();
    annotations["doctrine.szl.io/doctrine-version"] = payload.doctrine_version;
    request.Raw.metadata = { ...(request.Raw.metadata ?? {}), annotations };
  })
  .Validate((request) => {
    const spec =
      (request.Raw as unknown as { spec?: AgentInvocationSpec }).spec ?? null;
    const decision = decideAdmission(spec, {
      namespace: request.Raw.metadata?.namespace,
      name: request.Raw.metadata?.name,
      uid: request.Raw.metadata?.uid,
    });

    // Structured audit event — picked up by the Plane 3 / Fix A proof-ledger
    // sidecar via stdout JSON. Single line so log shippers don't split it.
    Log.info(JSON.stringify({ kind: "lambda-floor-audit", ...decision.audit }));

    if (decision.admit) return request.Approve();
    return request.Deny(decision.message, decision.status);
  });
