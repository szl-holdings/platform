/**
 * Alloy Contract Bridge
 *
 * Maps Alloy OS runtime types (@workspace/alloy) onto
 * proof-envelope UI prop shapes so components are provably grounded
 * in the platform's canonical contract — not bespoke ad-hoc types.
 *
 * Import Alloy types from packages/alloy/src/types.ts (peer contract).
 */
import type { RunState, RunStatus, LedgerEntry, ApprovalGate } from "@workspace/alloy/types";
import type { PolicyState } from "./proof/PolicyStateChip";
import type { AutonomyMode } from "./proof/AutonomyModeToggle";
import type { FreshnessLevel } from "./proof/FreshnessChip";
import type { EvidenceSource } from "./proof/EvidenceBadge";
import type { TimelineEvent, TimelineEventSeverity } from "./cockpit/TimelineLane";

// ── RunStatus → PolicyState ─────────────────────────────────────────────────

/**
 * Map an Alloy `RunStatus` to the visual PolicyState displayed in a ProofEnvelope.
 *
 * - "awaiting-approval"          → requires-approval
 * - "failed" | "rolled-back"     → blocked
 * - everything else (active)     → allowed
 */
export function runStatusToPolicyState(status: RunStatus): PolicyState {
  if (status === "awaiting-approval") return "requires-approval";
  if (status === "failed" || status === "rolled-back") return "blocked";
  return "allowed";
}

/**
 * Derive a human-readable policy reason from a RunState.
 * Returns undefined when no specific reason is known.
 */
export function runStateToPolicyReason(state: RunState): string | undefined {
  if (state.status === "awaiting-approval") return "Approval required by policy";
  if (state.status === "failed") return state.error ?? "Run failed";
  if (state.status === "rolled-back") return "Rolled back — see audit trail";
  return undefined;
}

// ── RunStatus → FreshnessLevel ───────────────────────────────────────────────

/**
 * Derive a freshness level from the run's last update timestamp.
 * A run updated less than 5 minutes ago is "fresh"; stale after 1 hour.
 */
export function runStateToFreshnessLevel(state: RunState): FreshnessLevel {
  const updatedAt = new Date(state.updatedAt);
  if (isNaN(updatedAt.getTime())) return "unknown";
  const ageMs = Date.now() - updatedAt.getTime();
  if (ageMs < 5 * 60_000)  return "fresh";
  if (ageMs < 60 * 60_000) return "aging";
  return "stale";
}

// ── LedgerEntry[] → EvidenceSource[] ─────────────────────────────────────────

/**
 * Convert Alloy LedgerEntries into EvidenceSource objects suitable for
 * the EvidenceBadge popover.  Filters to tool-call and approval entries
 * which represent verifiable evidence of what the agent did.
 */
export function ledgerEntriesToEvidence(entries: LedgerEntry[]): EvidenceSource[] {
  return entries
    .filter((e) => e.type === "tool-call" || e.type === "approval")
    .map((e) => ({
      id:        e.entryId,
      label:     e.description,
      type:      (e.type === "approval" ? "user" : "api") as "signal" | "model" | "user" | "document" | "api",
      timestamp: e.timestamp,
      ...(e.metadata?.summary !== undefined ? { excerpt: e.metadata.summary as string } : {}),
    }));
}

// ── LedgerEntry[] → TimelineEvent[] ──────────────────────────────────────────

const LEDGER_SEVERITY: Partial<Record<LedgerEntry["type"], TimelineEventSeverity>> = {
  "workflow-start":  "info",
  "workflow-end":    "success",
  "approval":        "warning",
  "rollback":        "critical",
  "checkpoint":      "neutral",
  "tool-call":       "info",
  "model-selection": "neutral",
};

/**
 * Convert Alloy LedgerEntries into TimelineEvent objects for TimelineLane.
 * Preserves full entry metadata for drill-down display.
 */
export function ledgerEntriesToTimeline(entries: LedgerEntry[]): TimelineEvent[] {
  return entries.map((e) => ({
    id:          e.entryId,
    timestamp:   e.timestamp,
    label:       e.description,
    severity:    LEDGER_SEVERITY[e.type] ?? "neutral",
    actor:       (e.metadata?.actor as string) ?? e.type,
    meta:        Object.fromEntries(
      Object.entries(e.metadata ?? {})
        .filter(([, v]) => typeof v === "string" || typeof v === "number")
        .map(([k, v]) => [k, String(v)])
    ),
  }));
}

// ── RunState → confidence heuristic ──────────────────────────────────────────

/**
 * Derive a proxy confidence value (0–100) from a RunState for use in ConfidenceMeter.
 *
 * In the absence of an explicit model confidence score on the RunState,
 * this heuristic uses step completion ratio and status as signals.
 * Pass an explicit value if the agent output carries a confidence score.
 */
export function runStateToConfidence(
  state: RunState,
  config: { maxSteps: number },
): number {
  if (state.status === "failed" || state.status === "rolled-back") return 0;
  if (state.status === "completed") return 95;
  if (config.maxSteps === 0) return 50;
  const ratio = Math.min(state.currentStep / config.maxSteps, 1);
  return Math.round(30 + ratio * 60);
}

// ── ApprovalGate status → AutonomyMode ───────────────────────────────────────

/**
 * Map an Alloy policy tier string to the closest AutonomyMode displayed in the toggle.
 *
 * Convention (matches Guardian tiers):
 *   tier-0 = approved-act   (no approval required)
 *   tier-1 = ask-to-act     (approval required per high-value action)
 *   tier-2 = draft          (outputs drafted, sent for review before dispatch)
 *   tier-3 = recommend      (recommendations surfaced, no execution)
 *   tier-4 = observe        (passive monitoring only)
 */
export function policyTierToAutonomyMode(tier: string | undefined): AutonomyMode {
  switch (tier) {
    case "tier-0": return "approved-act";
    case "tier-1": return "ask-to-act";
    case "tier-2": return "draft";
    case "tier-3": return "recommend";
    case "tier-4": return "observe";
    default:       return "ask-to-act";
  }
}

// Re-export Alloy types used above for convenience
export type { RunState, RunStatus, LedgerEntry, ApprovalGate };
