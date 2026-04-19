/**
 * Per-tenant + per-domain autonomy mode store.
 *
 * Backs the AutonomyModeToggle wired into ProofEnvelope surfaces.
 * Side-effecting Alloy workflow steps consult this store to decide whether
 * to execute, draft, queue for approval, or block.
 *
 * In-memory by design (matches existing Alloy in-memory stores under
 * @szl/alloy). Persistence to a durable store is out of scope for this task.
 */

export type AutonomyMode =
  | "observe"
  | "recommend"
  | "draft"
  | "ask-to-act"
  | "approved-act";

export const AUTONOMY_MODES: AutonomyMode[] = [
  "observe",
  "recommend",
  "draft",
  "ask-to-act",
  "approved-act",
];

export const DEFAULT_AUTONOMY_MODE: AutonomyMode = "ask-to-act";

export interface AutonomyModeRecord {
  tenantOrgId: number | null;
  domain: string;
  mode: AutonomyMode;
  updatedAt: string;
  updatedBy: string | null;
  reason: string | null;
}

export interface AutonomyDecision {
  /** Effective UI policy state for the proof envelope */
  policyState: "allowed" | "requires-approval" | "blocked";
  /** Human-readable reason — surfaced on the proof envelope */
  policyReason?: string;
  /**
   * What happens to a side-effecting workflow step at this mode:
   *  - execute: run inline
   *  - queue:   create approval record, do not execute
   *  - draft:   create artifact in draft state, no execution
   *  - block:   reject (observe mode — agent must not act)
   */
  disposition: "execute" | "queue" | "draft" | "block";
  mode: AutonomyMode;
}

const store = new Map<string, AutonomyModeRecord>();

function makeKey(tenantOrgId: number | null, domain: string): string {
  return `${tenantOrgId ?? "global"}::${domain.toLowerCase()}`;
}

export function getAutonomyMode(
  tenantOrgId: number | null,
  domain: string,
): AutonomyModeRecord {
  const key = makeKey(tenantOrgId, domain);
  const existing = store.get(key);
  if (existing) return existing;
  return {
    tenantOrgId,
    domain,
    mode: DEFAULT_AUTONOMY_MODE,
    updatedAt: new Date(0).toISOString(),
    updatedBy: null,
    reason: null,
  };
}

export function setAutonomyMode(params: {
  tenantOrgId: number | null;
  domain: string;
  mode: AutonomyMode;
  updatedBy?: string | null;
  reason?: string | null;
}): AutonomyModeRecord {
  const record: AutonomyModeRecord = {
    tenantOrgId: params.tenantOrgId,
    domain: params.domain,
    mode: params.mode,
    updatedAt: new Date().toISOString(),
    updatedBy: params.updatedBy ?? null,
    reason: params.reason ?? null,
  };
  store.set(makeKey(params.tenantOrgId, params.domain), record);
  return record;
}

export function listAutonomyModes(
  tenantOrgId: number | null,
): AutonomyModeRecord[] {
  const out: AutonomyModeRecord[] = [];
  for (const rec of store.values()) {
    if (rec.tenantOrgId === tenantOrgId) out.push(rec);
  }
  return out;
}

/** For tests only. */
export function _clearAutonomyStore(): void {
  store.clear();
}

/**
 * Decide what should happen to a side-effecting action under the current
 * autonomy mode for (tenant, domain). Returns the policy state to display
 * in the ProofEnvelope and the runtime disposition for the workflow engine.
 */
export function evaluateAutonomyForAction(
  tenantOrgId: number | null,
  domain: string,
  opts?: { actionLabel?: string },
): AutonomyDecision {
  const record = getAutonomyMode(tenantOrgId, domain);
  const action = opts?.actionLabel ?? "this action";
  switch (record.mode) {
    case "observe":
      return {
        mode: record.mode,
        policyState: "blocked",
        policyReason: `Autonomy mode is OBSERVE for ${domain} — agents may monitor but must not execute ${action}.`,
        disposition: "block",
      };
    case "recommend":
      return {
        mode: record.mode,
        policyState: "requires-approval",
        policyReason: `Autonomy mode is RECOMMEND — ${action} surfaced for human action; no agent execution.`,
        disposition: "queue",
      };
    case "draft":
      return {
        mode: record.mode,
        policyState: "requires-approval",
        policyReason: `Autonomy mode is DRAFT — ${action} prepared for human review before send.`,
        disposition: "draft",
      };
    case "ask-to-act":
      return {
        mode: record.mode,
        policyState: "requires-approval",
        policyReason: `Autonomy mode is ASK-TO-ACT — approval required before ${action}.`,
        disposition: "queue",
      };
    case "approved-act":
      return {
        mode: record.mode,
        policyState: "allowed",
        policyReason: `Autonomy mode is APPROVED-ACT — ${action} executes within policy without per-action approval.`,
        disposition: "execute",
      };
    default:
      return {
        mode: DEFAULT_AUTONOMY_MODE,
        policyState: "requires-approval",
        policyReason: "Defaulting to ASK-TO-ACT — approval required.",
        disposition: "queue",
      };
  }
}
