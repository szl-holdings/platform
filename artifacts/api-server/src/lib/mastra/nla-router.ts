import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { listTools, executeTool } from "./tool-registry";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";
import type { AgentExecutionContext } from "./types";

export type ActionRisk = "low" | "medium" | "high" | "critical";

export interface NLAParseResult {
  intent: string;
  domain: string;
  targetAgentId?: string;
  toolChain: Array<{
    toolName: string;
    rationale: string;
    requiredInput: Record<string, unknown>;
    estimatedRisk: ActionRisk;
  }>;
  overallRisk: ActionRisk;
  requiresApproval: boolean;
  approvalReason?: string;
  confidence: number;
}

export interface NLAExecutionPlan {
  planId: string;
  actionId: string;
  command: string;
  parsed: NLAParseResult;
  status: "pending_approval" | "approved" | "rejected" | "executing" | "completed" | "failed";
  triggeredBy: string;
  createdAt: string;
}

export interface NLAExecutionResult {
  planId: string;
  actionId: string;
  status: "completed" | "failed" | "pending_approval" | "rejected";
  results: Array<{ toolName: string; output: unknown; error?: string; latencyMs: number }>;
  summary: string;
  latencyMs: number;
}

const DOMAIN_AGENT_MAP: Record<string, string> = {
  legal: "prism-legal",
  maritime: "vessels-intelligence",
  vessels: "vessels-intelligence",
  cyber: "aegis-defense",
  security: "aegis-defense",
  "real estate": "terra-realestate",
  terra: "terra-realestate",
  ai: "lyte-aiops",
  lyte: "lyte-aiops",
  advisory: "carlota-advisory",
  finance: "carlota-advisory",
  orchestrator: "szl-orchestrator",
  general: "szl-orchestrator",
};

const RISK_REQUIRING_APPROVAL: ActionRisk[] = ["high", "critical"];

const pendingPlans = new Map<string, NLAExecutionPlan>();

export async function parseNLACommand(
  command: string,
  options?: { domain?: string; context?: Record<string, unknown> }
): Promise<NLAParseResult> {
  const availableTools = listTools().map(t => `- ${t.name}: ${t.description}`).join("\n");
  const domainHint = options?.domain ? `The user is operating in the "${options.domain}" domain.` : "";

  const response = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: `You are an AI action router. Parse the natural language command and produce a structured execution plan.

Available tools:
${availableTools}

${domainHint}

Return ONLY valid JSON:
{
  "intent": "brief description of what the user wants to do",
  "domain": "legal|maritime|real_estate|cyber|financial|general",
  "targetAgentId": "optional agent ID from: prism-legal, vessels-intelligence, aegis-defense, terra-realestate, lyte-aiops, carlota-advisory, szl-orchestrator",
  "toolChain": [
    {
      "toolName": "exact tool name from available tools list",
      "rationale": "why this tool is needed",
      "requiredInput": {"key": "value or placeholder if unknown"},
      "estimatedRisk": "low|medium|high|critical"
    }
  ],
  "overallRisk": "low|medium|high|critical",
  "requiresApproval": true|false,
  "approvalReason": "explanation if requiresApproval is true",
  "confidence": 0.0-1.0
}

Risk guidelines:
- low: read-only queries, list operations
- medium: creates that are reversible (comments, notes)
- high: creates that are hard to undo (issues, notifications to people), workflow triggers
- critical: deletions, destructive actions, mass operations

requiresApproval must be true for high and critical risk actions.`,
      },
      { role: "user", content: command },
    ],
    maxTokens: 800,
    strategy: "cheapest",
  });

  try {
    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in NLA parse response");
    return JSON.parse(match[0]) as NLAParseResult;
  } catch {
    return {
      intent: command,
      domain: options?.domain ?? "general",
      toolChain: [],
      overallRisk: "low",
      requiresApproval: false,
      confidence: 0.1,
    };
  }
}

export async function createNLAExecutionPlan(
  command: string,
  triggeredBy: string,
  options?: { domain?: string; context?: Record<string, unknown>; autoApprove?: boolean }
): Promise<NLAExecutionPlan> {
  const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const actionId = generateActionId();

  await logAction({
    actionId,
    actionType: "nla_routed",
    triggeredBy,
    domain: options?.domain,
    input: { command, options },
    status: "running",
    approvalRequired: false,
  });

  const parsed = await parseNLACommand(command, options);

  const requiresApproval = parsed.requiresApproval ||
    RISK_REQUIRING_APPROVAL.includes(parsed.overallRisk);

  const status = requiresApproval && !options?.autoApprove
    ? "pending_approval"
    : "approved";

  const plan: NLAExecutionPlan = {
    planId,
    actionId,
    command,
    parsed: { ...parsed, requiresApproval },
    status,
    triggeredBy,
    createdAt: new Date().toISOString(),
  };

  pendingPlans.set(planId, plan);

  await updateActionStatus(actionId, requiresApproval && !options?.autoApprove ? "awaiting_approval" : "running", {
    output: { planId, parsed, requiresApproval },
  });

  logger.info({ planId, intent: parsed.intent, overallRisk: parsed.overallRisk, requiresApproval }, "NLA execution plan created");
  return plan;
}

export async function approveNLAPlan(
  planId: string,
  approvedBy: string,
  decision: "approved" | "rejected",
  notes?: string
): Promise<NLAExecutionPlan> {
  const plan = pendingPlans.get(planId);
  if (!plan) throw new Error(`Plan "${planId}" not found or already expired`);

  plan.status = decision === "approved" ? "approved" : "rejected";
  pendingPlans.set(planId, plan);

  await updateActionStatus(plan.actionId, decision === "approved" ? "running" : "rejected", {
    approvedBy,
    approvalDecision: decision,
    approvalNotes: notes,
  });

  return plan;
}

export async function executeNLAPlan(
  planId: string,
  context: AgentExecutionContext,
  options?: { overrideInputs?: Record<string, Record<string, unknown>> }
): Promise<NLAExecutionResult> {
  const plan = pendingPlans.get(planId);
  if (!plan) throw new Error(`Plan "${planId}" not found`);
  if (plan.status === "pending_approval") throw new Error(`Plan requires approval before execution`);
  if (plan.status === "rejected") throw new Error(`Plan was rejected`);

  const startTime = Date.now();
  plan.status = "executing";

  const results: NLAExecutionResult["results"] = [];

  for (const step of plan.parsed.toolChain) {
    const toolInput = {
      ...step.requiredInput,
      ...(options?.overrideInputs?.[step.toolName] ?? {}),
    };

    const toolResult = await executeTool(step.toolName, toolInput, context);
    results.push({
      toolName: step.toolName,
      output: toolResult.output,
      error: toolResult.error,
      latencyMs: toolResult.latencyMs,
    });

    if (toolResult.error && step.estimatedRisk !== "low") {
      logger.warn({ planId, toolName: step.toolName, error: toolResult.error }, "Tool step failed during NLA execution");
      break;
    }
  }

  const latencyMs = Date.now() - startTime;
  const hasErrors = results.some(r => r.error);
  const finalStatus = hasErrors ? "failed" : "completed";

  plan.status = finalStatus;

  const summary = hasErrors
    ? `Execution completed with errors. ${results.filter(r => !r.error).length}/${results.length} steps succeeded.`
    : `Successfully executed ${results.length} step(s): ${results.map(r => r.toolName).join(", ")}`;

  await updateActionStatus(plan.actionId, finalStatus, {
    output: { results: results.length, hasErrors, summary },
    latencyMs,
  });

  pendingPlans.delete(planId);

  return {
    planId,
    actionId: plan.actionId,
    status: finalStatus,
    results,
    summary,
    latencyMs,
  };
}

export async function routeAndExecuteNLA(
  command: string,
  triggeredBy: string,
  context: AgentExecutionContext,
  options?: { domain?: string; autoApprove?: boolean }
): Promise<NLAExecutionResult | { requiresApproval: true; planId: string; plan: NLAExecutionPlan }> {
  const plan = await createNLAExecutionPlan(command, triggeredBy, options);

  if (plan.status === "pending_approval") {
    return { requiresApproval: true, planId: plan.planId, plan };
  }

  return executeNLAPlan(plan.planId, context);
}

export function getPendingPlans(): NLAExecutionPlan[] {
  return Array.from(pendingPlans.values()).filter(p => p.status === "pending_approval");
}

export function getPlan(planId: string): NLAExecutionPlan | undefined {
  return pendingPlans.get(planId);
}
