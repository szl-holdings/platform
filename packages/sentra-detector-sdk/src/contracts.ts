/**
 * Detector framework contracts.
 *
 * A `Detector` is anything that can be invoked with a `DetectorContext`
 * and emits zero or more `Finding`s. Detectors live in one of two homes:
 *
 *   - `runtime: 'ts'`     — TypeScript classes registered in-process
 *                           inside the api-server.
 *   - `runtime: 'python'` — Python classes hosted by the sidecar; the
 *                           api-server invokes them over HTTP via the
 *                           wire protocol in `./wire.ts` (mirrored in
 *                           `services/sentra-detector-sidecar`).
 *
 * Both runtimes return the SAME `Finding` shape so the existing alerts /
 * queue / workcell surfaces consume framework output without UI churn.
 */

/** Stable detector identifier (e.g. `ts-example/heuristic-port-scan`). */
export type DetectorId = string;

/** How sensitive the detector is to false positives / mis-calibration. */
export type CostClass = 'free' | 'cheap' | 'moderate' | 'expensive';

/**
 * Governance class — drives policy gating on the finding side:
 *
 *  - `read-only`        — the detector only inspects telemetry.
 *  - `advisory`         — the detector can request human review.
 *  - `mutating`         — the detector recommends action; a11oy gate
 *                         must approve before the workcell executes.
 *  - `auto-remediable`  — pre-approved action class, still receipted.
 */
export type GovernanceClass =
  | 'read-only'
  | 'advisory'
  | 'mutating'
  | 'auto-remediable';

/**
 * `antivenom` (#5503) — adversarial-input detectors that recognise the
 * counter-pattern of an attack instead of the attack itself (prompt
 * injection, jailbreak, model-extraction probing, adversarial-example
 * perturbations). Kept as a first-class kind, not a tag on `ml`, so the
 * Detector Council (MARBLE) can weight antivenom evidence distinctly
 * from baseline-shift evidence when arbitrating overlapping firings.
 */
export type DetectorKind =
  | 'heuristic'
  | 'signature'
  | 'statistical'
  | 'ml'
  | 'correlation'
  | 'antivenom'
  | 'temporal';

export type DetectorRuntime = 'ts' | 'python';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Declarative description of a detector. Used by both the in-process TS
 * registry and the sidecar's registration handshake.
 */
export interface DetectorManifest {
  id: DetectorId;
  /** Short human label shown in the operator UI. */
  label: string;
  /** One-paragraph description shown in the run-history view. */
  description: string;
  kind: DetectorKind;
  runtime: DetectorRuntime;
  /** Free-form input descriptors (telemetry stream names, table names, …). */
  inputs: string[];
  costClass: CostClass;
  governanceClass: GovernanceClass;
  /** ATT&CK technique IDs the detector targets (e.g. ["T1046"]). */
  attackTechniques?: string[];
  /** Optional version tag — distinct deployments of the same id. */
  version?: string;
}

/**
 * Runtime context handed to a detector at evaluation time. Detectors must
 * pull their inputs through `read` instead of reaching into globals so
 * the framework can stub them in tests and account for IO in receipts.
 */
export interface DetectorContext {
  detectorId: DetectorId;
  runId: string;
  /** ISO-8601 — the wall-clock at run start. */
  startedAt: string;
  /** Operator / agent that triggered the run. */
  triggeredBy: string;
  /** Free-form run parameters (e.g. windowMinutes, baselineId). */
  params: Record<string, unknown>;
  /**
   * Read a logical input by name. The framework wires this through to
   * the appropriate telemetry source (db table, in-memory store, mock).
   */
  read: (input: string) => Promise<unknown[]>;
  /** Append a free-form trace line; surfaces in the run-history view. */
  trace: (msg: string, data?: Record<string, unknown>) => void;
}

/**
 * Canonical finding shape. Maps 1:1 onto the existing Sentra alert /
 * queue / workcell surfaces:
 *
 *   - alerts page consumes `severity`, `title`, `summary`, `evidence`.
 *   - queue/workcell consumes `recommendedAction`, `governanceClass`.
 *   - the receipt path consumes `chainReceiptId`.
 */
export interface Finding {
  /** Stable finding ID — `{detectorId}#{runId}#{idx}`. */
  id: string;
  detectorId: DetectorId;
  runId: string;
  severity: FindingSeverity;
  /** Numeric score 0..1 — higher is more suspicious. */
  score: number;
  title: string;
  summary: string;
  /** ATT&CK technique IDs this finding maps to. */
  attackTechniques?: string[];
  /** Asset references — flow into the existing affectedAssets fields. */
  affectedAssets: string[];
  /** Structured evidence dump (queryable rows, drift vectors, etc.). */
  evidence: Record<string, unknown>;
  /** Optional recommendation surfaced to the workcell. */
  recommendedAction?: {
    kind: 'patch' | 'block' | 'quarantine' | 'investigate' | 'tune';
    detail: string;
  };
  /** ISO-8601 emission time. */
  emittedAt: string;
  /** Governance class inherited from the detector that emitted it. */
  governanceClass: GovernanceClass;
}

/**
 * Per-run metadata recorded for the run-history view. Findings emitted
 * during the run reference the same `runId`.
 */
export interface DetectorRun {
  id: string;
  detectorId: DetectorId;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: 'ok' | 'error' | 'timeout';
  triggeredBy: string;
  findingsCount: number;
  /** SHA-256 chain receipt id from `@szl-holdings/szl-receipts`. */
  chainReceiptId?: string;
  errorMessage?: string;
  /** Free-form trace lines emitted via `ctx.trace`. */
  trace: Array<{ ts: string; msg: string; data?: Record<string, unknown> }>;
}

/**
 * The runtime contract a TypeScript detector implements. Python
 * detectors expose the equivalent shape over HTTP via `./wire.ts`.
 */
export interface Detector {
  readonly manifest: DetectorManifest;
  evaluate(ctx: DetectorContext): Promise<Finding[]>;
}

/**
 * Severity threshold at which the framework fires
 * `crossProductHandoff` to A11oy. Centralised here so any consumer can
 * agree on what counts as "high-enough to escalate".
 */
export const A11OY_HANDOFF_THRESHOLD: FindingSeverity = 'high';
export const HANDOFF_RANK: Record<FindingSeverity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function shouldHandoff(severity: FindingSeverity): boolean {
  return HANDOFF_RANK[severity] >= HANDOFF_RANK[A11OY_HANDOFF_THRESHOLD];
}
