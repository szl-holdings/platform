import type { HFToolDef } from "../providers/hf-client.js";

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  output: unknown;
  auditEntry: ToolAuditEntry;
}

export interface ToolAuditEntry {
  toolName: string;
  arguments: Record<string, unknown>;
  timestamp: string;
  calledBy: string;
  policyChecked: boolean;
  approvalRequired: boolean;
  approvalStatus: "approved" | "pending" | "rejected" | "not_required";
  result: "success" | "failure" | "blocked";
  error: string | null;
}

export const ALLOY_TOOL_DEFINITIONS: HFToolDef[] = [
  {
    type: "function",
    function: {
      name: "lookup_workflow",
      description: "Look up an Alloy workflow by ID to get its current status, steps, and run history.",
      parameters: { type: "object", required: ["workflowId"], properties: { workflowId: { type: "string", description: "The workflow ID to look up" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_signal",
      description: "Look up a Lyte signal by ID to get its details, severity, and related context.",
      parameters: { type: "object", required: ["signalId"], properties: { signalId: { type: "string", description: "The signal ID to look up" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_owner",
      description: "Look up an owner or operator by ID to get their role, permissions, and assignment history.",
      parameters: { type: "object", required: ["ownerId"], properties: { ownerId: { type: "string", description: "The owner/operator ID" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "create_action_item",
      description: "Create a new action item in the Alloy execution queue with an assigned owner and deadline.",
      parameters: {
        type: "object",
        required: ["title", "description", "priority"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["P0", "P1", "P2", "P3"] },
          assignTo: { type: "string" },
          deadline: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "route_for_approval",
      description: "Route a proposed action to the appropriate approver based on risk level and policy.",
      parameters: {
        type: "object",
        required: ["actionId", "approvalLevel", "reason"],
        properties: {
          actionId: { type: "string" },
          approvalLevel: { type: "string", enum: ["operator", "manager", "executive"] },
          reason: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_human_review",
      description: "Flag an AI decision for mandatory human review before execution.",
      parameters: {
        type: "object",
        required: ["decisionId", "reason"],
        properties: {
          decisionId: { type: "string" },
          reason: { type: "string" },
          urgency: { type: "string", enum: ["immediate", "urgent", "standard"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "append_audit_note",
      description: "Append an immutable note to an audit trail record.",
      parameters: {
        type: "object",
        required: ["recordId", "note"],
        properties: {
          recordId: { type: "string" },
          note: { type: "string" },
          author: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_connector_context",
      description: "Fetch context from a connected system (e.g., Jira, Slack, PagerDuty) to enrich a decision.",
      parameters: {
        type: "object",
        required: ["connectorType", "query"],
        properties: {
          connectorType: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "close_action",
      description: "Close an action item with a resolution status and notes.",
      parameters: {
        type: "object",
        required: ["actionId", "resolution"],
        properties: {
          actionId: { type: "string" },
          resolution: { type: "string", enum: ["resolved", "mitigated", "accepted_risk", "false_positive"] },
          notes: { type: "string" },
        },
      },
    },
  },
];

const HIGH_RISK_TOOLS = new Set(["create_action_item", "route_for_approval", "close_action"]);
const PROPOSE_ONLY_TOOLS = new Set(["create_action_item", "route_for_approval", "close_action", "request_human_review"]);

export function isHighRiskTool(toolName: string): boolean {
  return HIGH_RISK_TOOLS.has(toolName);
}

export function checkToolPolicy(toolName: string, args: Record<string, unknown>): {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
} {
  const executionMode = process.env["AI_EXECUTION_MODE"] || "propose_only";
  const requireApproval = (process.env["AI_REQUIRE_APPROVAL_FOR_HIGH_RISK"] ?? "true") === "true";

  if (executionMode === "propose_only" && PROPOSE_ONLY_TOOLS.has(toolName)) {
    return { allowed: false, requiresApproval: true, reason: `Tool '${toolName}' blocked — execution mode is 'propose_only'. Action proposed but not executed.` };
  }

  if (requireApproval && HIGH_RISK_TOOLS.has(toolName)) {
    return { allowed: false, requiresApproval: true, reason: `Tool '${toolName}' requires human approval before execution.` };
  }

  return { allowed: true, requiresApproval: false, reason: "Policy check passed" };
}

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  calledBy: string = "alloy",
): Promise<ToolExecutionResult> {
  const timestamp = new Date().toISOString();
  const policyCheck = checkToolPolicy(toolName, args);

  const auditEntry: ToolAuditEntry = {
    toolName,
    arguments: args,
    timestamp,
    calledBy,
    policyChecked: true,
    approvalRequired: policyCheck.requiresApproval,
    approvalStatus: policyCheck.requiresApproval ? "pending" : "not_required",
    result: "success",
    error: null,
  };

  if (!policyCheck.allowed) {
    auditEntry.result = "blocked";
    auditEntry.error = policyCheck.reason;
    return {
      toolName,
      success: false,
      output: { blocked: true, reason: policyCheck.reason, proposedAction: { tool: toolName, args } },
      auditEntry,
    };
  }

  try {
    const output = await executeToolInternal(toolName, args);
    return { toolName, success: true, output, auditEntry };
  } catch (err) {
    auditEntry.result = "failure";
    auditEntry.error = err instanceof Error ? err.message : String(err);
    return {
      toolName,
      success: false,
      output: { error: auditEntry.error },
      auditEntry,
    };
  }
}

async function executeToolInternal(toolName: string, args: Record<string, unknown>): Promise<unknown> {
  switch (toolName) {
    case "lookup_workflow":
      return { id: args.workflowId, name: `Workflow ${args.workflowId}`, status: "active", steps: 5, lastRunAt: new Date().toISOString() };
    case "lookup_signal":
      return { id: args.signalId, severity: "high", source: "lyte-observability", timestamp: new Date().toISOString(), acknowledged: false };
    case "lookup_owner":
      return { id: args.ownerId, name: "Operator", role: "platform-operator", activeAssignments: 3 };
    case "create_action_item":
      return { id: `action-${Date.now()}`, created: true, ...args, status: "open" };
    case "route_for_approval":
      return { routed: true, approver: `approver-${args.approvalLevel}`, estimatedResponseTime: "15m" };
    case "request_human_review":
      return { reviewRequested: true, reviewId: `review-${Date.now()}`, urgency: args.urgency || "standard" };
    case "append_audit_note":
      return { appended: true, recordId: args.recordId, noteId: `note-${Date.now()}` };
    case "fetch_connector_context":
      return { connector: args.connectorType, results: [], query: args.query, fetchedAt: new Date().toISOString() };
    case "close_action":
      return { closed: true, actionId: args.actionId, resolution: args.resolution };
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
