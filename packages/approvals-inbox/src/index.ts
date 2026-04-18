/**
 * @workspace/approvals-inbox
 *
 * Shared approvals inbox for the Lyte platform.
 *
 * Receives approval actions from Decision Center and other governed surfaces.
 * Each action is stored with full provenance: verdict, proof ref, simulation ID,
 * actor, timestamp. Acts as the single source of truth for approval state
 * across surfaces (Decision Center, Run Console, Policy Center).
 *
 * Usage:
 *   import { submitApprovalAction, getApprovalForRecommendation } from "@workspace/approvals-inbox";
 */

export type ApprovalVerdict = "approved" | "rejected" | "escalated";

export interface ApprovalAction {
  id: string;
  recommendationId: string;
  verdict: ApprovalVerdict;
  actor: string;
  timestamp: number;
  proofRef: string;
  simulationId: string | undefined;
  note: string | undefined;
  domain: string;
  surface: string;
}

export interface SubmitApprovalOptions {
  simulationId?: string;
  note?: string;
  actor?: string;
  domain?: string;
  surface?: string;
}

const _inbox: ApprovalAction[] = [];
let _seq = 1000;

function makeProofRef(verdict: ApprovalVerdict): string {
  const prefix = verdict === "approved" ? "APP" : verdict === "rejected" ? "REJ" : "ESC";
  return `PROOF-${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export function submitApprovalAction(
  recommendationId: string,
  verdict: ApprovalVerdict,
  options?: SubmitApprovalOptions
): ApprovalAction {
  const action: ApprovalAction = {
    id: `approval-${++_seq}`,
    recommendationId,
    verdict,
    actor: options?.actor ?? "Demo Mode — LYTE-SEED-v2",
    timestamp: Date.now(),
    proofRef: makeProofRef(verdict),
    simulationId: options?.simulationId,
    note: options?.note,
    domain: options?.domain ?? "decision-center",
    surface: options?.surface ?? "lyte",
  };
  _inbox.push(action);
  return action;
}

export function getApprovalActions(): readonly ApprovalAction[] {
  return _inbox;
}

export function getApprovalForRecommendation(recommendationId: string): ApprovalAction | undefined {
  return [..._inbox].reverse().find(a => a.recommendationId === recommendationId);
}

export function getInboxByVerdict(verdict: ApprovalVerdict): readonly ApprovalAction[] {
  return _inbox.filter(a => a.verdict === verdict);
}

export function clearApprovalInbox(): void {
  _inbox.length = 0;
}

export function getInboxStats() {
  return {
    total: _inbox.length,
    approved: _inbox.filter(a => a.verdict === "approved").length,
    rejected: _inbox.filter(a => a.verdict === "rejected").length,
    escalated: _inbox.filter(a => a.verdict === "escalated").length,
  };
}
