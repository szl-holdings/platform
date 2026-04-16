export type AgentTierName = "assistant" | "analyst" | "operator" | "autonomous";

export interface AgentTierDefinition {
  name: AgentTierName;
  label: string;
  description: string;
  maxCostPerRequestUsd: number;
  maxTokensPerRequest: number;
  requiresHumanApproval: boolean;
  approvalRequired: "never" | "high_risk" | "always";
  allowedRouteClasses: string[];
  allowedTools: string[];
  canWriteState: boolean;
  canExecuteActions: boolean;
  canDelegateToAgents: boolean;
  maxAutonomousSteps: number;
  auditRequired: boolean;
  evalThreshold: number;
}

export const AGENT_TIER_DEFINITIONS: Record<AgentTierName, AgentTierDefinition> = {
  assistant: {
    name: "assistant",
    label: "Assistant",
    description: "Read-only conversational AI — answers questions, summarizes data, generates drafts. No write access, no action execution. Requires human approval for any output used in external communications.",
    maxCostPerRequestUsd: 0.05,
    maxTokensPerRequest: 8192,
    requiresHumanApproval: false,
    approvalRequired: "never",
    allowedRouteClasses: ["triage", "summarization", "generation", "extraction"],
    allowedTools: ["search", "retrieve", "summarize"],
    canWriteState: false,
    canExecuteActions: false,
    canDelegateToAgents: false,
    maxAutonomousSteps: 1,
    auditRequired: true,
    evalThreshold: 0.70,
  },
  analyst: {
    name: "analyst",
    label: "Analyst",
    description: "Research and analysis tier — reads all domain data, generates structured insights, proposes actions for human review. Can write analysis artifacts but cannot execute actions directly.",
    maxCostPerRequestUsd: 0.50,
    maxTokensPerRequest: 32768,
    requiresHumanApproval: false,
    approvalRequired: "high_risk",
    allowedRouteClasses: ["reasoning", "planning", "extraction", "triage", "summarization", "generation", "classification"],
    allowedTools: ["search", "retrieve", "summarize", "analyze", "propose", "write_artifact"],
    canWriteState: true,
    canExecuteActions: false,
    canDelegateToAgents: false,
    maxAutonomousSteps: 5,
    auditRequired: true,
    evalThreshold: 0.78,
  },
  operator: {
    name: "operator",
    label: "Operator",
    description: "Semi-autonomous operations tier — can execute pre-approved action types, trigger workflows, and write state. All high-risk actions require human approval. Full audit trail mandatory.",
    maxCostPerRequestUsd: 2.00,
    maxTokensPerRequest: 65536,
    requiresHumanApproval: false,
    approvalRequired: "high_risk",
    allowedRouteClasses: ["reasoning", "planning", "extraction", "triage", "summarization", "generation", "classification"],
    allowedTools: ["search", "retrieve", "summarize", "analyze", "propose", "write_artifact", "execute_workflow", "trigger_alert", "update_record"],
    canWriteState: true,
    canExecuteActions: true,
    canDelegateToAgents: true,
    maxAutonomousSteps: 15,
    auditRequired: true,
    evalThreshold: 0.84,
  },
  autonomous: {
    name: "autonomous",
    label: "Autonomous",
    description: "Fully autonomous execution tier — can plan and execute multi-step workflows, write state, trigger external systems, and delegate to sub-agents. Requires pre-authorization and continuous audit. Reserved for trusted automation pipelines.",
    maxCostPerRequestUsd: 10.00,
    maxTokensPerRequest: 128000,
    requiresHumanApproval: false,
    approvalRequired: "never",
    allowedRouteClasses: ["reasoning", "planning", "extraction", "triage", "summarization", "generation", "classification"],
    allowedTools: ["*"],
    canWriteState: true,
    canExecuteActions: true,
    canDelegateToAgents: true,
    maxAutonomousSteps: 100,
    auditRequired: true,
    evalThreshold: 0.90,
  },
};

export function getTierDefinition(tier: AgentTierName): AgentTierDefinition {
  return AGENT_TIER_DEFINITIONS[tier];
}

export function isToolAllowedForTier(tier: AgentTierName, tool: string): boolean {
  const def = AGENT_TIER_DEFINITIONS[tier];
  if (def.allowedTools.includes("*")) return true;
  return def.allowedTools.includes(tool);
}

export function isRouteClassAllowedForTier(tier: AgentTierName, routeClass: string): boolean {
  return AGENT_TIER_DEFINITIONS[tier].allowedRouteClasses.includes(routeClass);
}

export function requiresApproval(tier: AgentTierName, isHighRisk: boolean): boolean {
  const def = AGENT_TIER_DEFINITIONS[tier];
  if (def.approvalRequired === "always") return true;
  if (def.approvalRequired === "high_risk" && isHighRisk) return true;
  return false;
}

export function getAllTiers(): AgentTierDefinition[] {
  return Object.values(AGENT_TIER_DEFINITIONS);
}
