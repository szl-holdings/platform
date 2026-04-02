export interface ApprovalRecommendation {
  decisionId: string;
  workflowId: string | null;
  actionId: string;
  approvalRequired: boolean;
  approvalLevel: "auto" | "operator" | "manager" | "executive" | "board";
  approvalReason: string;
  riskClassification: "low" | "medium" | "high" | "critical";
  policyRef: string | null;
  policyName: string | null;
  estimatedImpact: {
    financial: string | null;
    operational: string | null;
    reputational: string | null;
    compliance: string | null;
  };
  autoApprovalEligible: boolean;
  autoApprovalConditions: string[];
  requiredApprovers: string[];
  escalationIfDenied: string | null;
  timeConstraint: string | null;
  confidence: number;
  evidenceRefs: string[];
  modelRoute: string;
  schemaVersion: "1.0.0";
  createdAt: string;
}

export function validateApprovalRecommendation(obj: unknown): obj is ApprovalRecommendation {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.approvalRequired === "boolean" &&
    typeof o.approvalLevel === "string" &&
    typeof o.approvalReason === "string" &&
    typeof o.riskClassification === "string" &&
    typeof o.confidence === "number" &&
    o.confidence >= 0 && o.confidence <= 1 &&
    o.estimatedImpact !== null && typeof o.estimatedImpact === "object"
  );
}
