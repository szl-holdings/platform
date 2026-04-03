export interface ActionDecision {
  action: string;
  actionType: "approve" | "escalate" | "defer" | "route" | "close" | "investigate";
  confidence: number;
  evidence: EvidenceItem[];
  impactedOwner: string | null;
  approvalRequired: boolean;
  approvalLevel: "none" | "operator" | "manager" | "executive";
  deadline: string | null;
  sla: string | null;
  reasoning: string;
  alternatives: Array<{ action: string; confidence: number; tradeoff: string }>;
  metadata: DecisionMetadata;
}

export interface EvidenceItem {
  source: string;
  sourceType: "workflow" | "audit" | "signal" | "connector" | "policy" | "prior_incident" | "playbook";
  content: string;
  relevanceScore: number;
  timestamp: string | null;
  objectId: string | null;
}

export interface DecisionMetadata {
  promptClass: string;
  model: string;
  provider: string;
  responseFormat: "structured" | "text";
  schemaVersion: string;
  retrievedSourceCount: number;
  latencyMs: number;
  tokenUsage: { prompt: number; completion: number; total: number } | null;
  timestamp: string;
}

export interface AuditRecord {
  id: string;
  decisionId: string;
  promptClass: string;
  model: string;
  provider: string;
  schemaVersion: string;
  rawInput: string;
  rawOutput: string;
  parsedDecision: ActionDecision | null;
  retrievedSources: EvidenceItem[];
  chosenAction: string;
  confidence: number;
  approvalRequired: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  executionOutcome: "pending" | "executed" | "failed" | "rejected" | "expired";
  executionError: string | null;
  createdAt: string;
}

export const ACTION_DECISION_SCHEMA = {
  type: "object",
  required: ["action", "actionType", "confidence", "evidence", "approvalRequired", "reasoning"],
  properties: {
    action: { type: "string", description: "Specific recommended action" },
    actionType: { type: "string", enum: ["approve", "escalate", "defer", "route", "close", "investigate"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    evidence: {
      type: "array",
      items: {
        type: "object",
        required: ["source", "sourceType", "content", "relevanceScore"],
        properties: {
          source: { type: "string" },
          sourceType: { type: "string", enum: ["workflow", "audit", "signal", "connector", "policy", "prior_incident", "playbook"] },
          content: { type: "string" },
          relevanceScore: { type: "number", minimum: 0, maximum: 1 },
          timestamp: { type: "string", nullable: true },
          objectId: { type: "string", nullable: true },
        },
      },
    },
    impactedOwner: { type: "string", nullable: true },
    approvalRequired: { type: "boolean" },
    approvalLevel: { type: "string", enum: ["none", "operator", "manager", "executive"] },
    deadline: { type: "string", nullable: true },
    sla: { type: "string", nullable: true },
    reasoning: { type: "string" },
    alternatives: {
      type: "array",
      items: {
        type: "object",
        required: ["action", "confidence", "tradeoff"],
        properties: {
          action: { type: "string" },
          confidence: { type: "number" },
          tradeoff: { type: "string" },
        },
      },
    },
  },
} as const;

export function validateActionDecision(raw: unknown): { valid: boolean; decision: ActionDecision | null; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { valid: false, decision: null, errors: ["Response is not an object"] };
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj.action !== "string") errors.push("Missing or invalid 'action'");
  if (!["approve", "escalate", "defer", "route", "close", "investigate"].includes(obj.actionType as string)) errors.push("Invalid 'actionType'");
  if (typeof obj.confidence !== "number" || obj.confidence < 0 || obj.confidence > 1) errors.push("Invalid 'confidence' (must be 0-1)");
  if (!Array.isArray(obj.evidence)) errors.push("Missing 'evidence' array");
  if (typeof obj.approvalRequired !== "boolean") errors.push("Missing 'approvalRequired'");
  if (typeof obj.reasoning !== "string") errors.push("Missing 'reasoning'");

  if (errors.length > 0) {
    return { valid: false, decision: null, errors };
  }

  return {
    valid: true,
    decision: {
      action: obj.action as string,
      actionType: obj.actionType as ActionDecision["actionType"],
      confidence: obj.confidence as number,
      evidence: (obj.evidence as EvidenceItem[]) || [],
      impactedOwner: (obj.impactedOwner as string) || null,
      approvalRequired: obj.approvalRequired as boolean,
      approvalLevel: (obj.approvalLevel as ActionDecision["approvalLevel"]) || "none",
      deadline: (obj.deadline as string) || null,
      sla: (obj.sla as string) || null,
      reasoning: obj.reasoning as string,
      alternatives: (obj.alternatives as ActionDecision["alternatives"]) || [],
      metadata: (obj.metadata as DecisionMetadata) || {
        promptClass: "unknown",
        model: "unknown",
        provider: "unknown",
        responseFormat: "structured",
        schemaVersion: "1.0.0",
        retrievedSourceCount: 0,
        latencyMs: 0,
        tokenUsage: null,
        timestamp: new Date().toISOString(),
      },
    },
    errors: [],
  };
}

export function safeFallbackDecision(reason: string): ActionDecision {
  return {
    action: "Unable to generate recommendation — manual review required",
    actionType: "escalate",
    confidence: 0,
    evidence: [],
    impactedOwner: null,
    approvalRequired: true,
    approvalLevel: "operator",
    deadline: null,
    sla: null,
    reasoning: `Safe fallback triggered: ${reason}`,
    alternatives: [],
    metadata: {
      promptClass: "fallback",
      model: "none",
      provider: "none",
      responseFormat: "structured",
      schemaVersion: "1.0.0",
      retrievedSourceCount: 0,
      latencyMs: 0,
      tokenUsage: null,
      timestamp: new Date().toISOString(),
    },
  };
}
