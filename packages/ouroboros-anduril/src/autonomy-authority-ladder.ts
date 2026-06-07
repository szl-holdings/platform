/**
 * Primitive 83 — Autonomy / authority ladder
 *
 * Inspired by the Air Force CCA Autonomy Government Reference
 * Architecture (A-GRA) and Lattice's open architecture: an autonomous
 * agent's authorized action set must be a strict function of its
 * declared autonomy level. Promotion or demotion between levels must
 * be receipted, and a refusal at level N is never auto-escalated to
 * level N+1.
 *
 * The ladder enforces: every action carries the minimum-authority
 * level required, and an agent at level L can only execute actions
 * with required-level <= L. Promotion is by explicit, signed
 * authority — never silent.
 *
 * Source: af.mil A-GRA framing, anduril.com/lattice. No code lifted.
 */

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5; // 0 teleop, 5 fully autonomous

export interface ActionRequest {
  id: string;
  description: string;
  requiredLevel: AutonomyLevel;
  reversible: boolean;
}

export interface AgentState {
  agentId: string;
  currentLevel: AutonomyLevel;
  promotionLedger: PromotionEvent[];
}

export interface PromotionEvent {
  agentId: string;
  fromLevel: AutonomyLevel;
  toLevel: AutonomyLevel;
  authorizedBy: string;
  timestamp: string;
  reason: string;
}

export interface AuthorityVerdict {
  actionId: string;
  permitted: boolean;
  reason: string;
}

export function checkAuthority(action: ActionRequest, agent: AgentState): AuthorityVerdict {
  if (agent.currentLevel < action.requiredLevel) {
    return {
      actionId: action.id,
      permitted: false,
      reason: `agent level ${agent.currentLevel} < required ${action.requiredLevel}`,
    };
  }
  // Even at sufficient level, irreversible high-level actions
  // require explicit re-confirmation.
  if (!action.reversible && action.requiredLevel >= 4) {
    return {
      actionId: action.id,
      permitted: false,
      reason: "irreversible action at level >= 4 needs explicit confirm step",
    };
  }
  return { actionId: action.id, permitted: true, reason: "authority sufficient" };
}

export function promote(
  agent: AgentState,
  toLevel: AutonomyLevel,
  authorizedBy: string,
  timestamp: string,
  reason: string
): AgentState {
  if (!authorizedBy) {
    throw new Error("promotion requires named authority");
  }
  const event: PromotionEvent = {
    agentId: agent.agentId,
    fromLevel: agent.currentLevel,
    toLevel,
    authorizedBy,
    timestamp,
    reason,
  };
  return {
    agentId: agent.agentId,
    currentLevel: toLevel,
    promotionLedger: [...agent.promotionLedger, event],
  };
}
