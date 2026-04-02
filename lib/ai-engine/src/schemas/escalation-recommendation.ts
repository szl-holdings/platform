export interface EscalationRecommendation {
  decisionId: string;
  workflowId: string | null;
  signalIds: string[];
  shouldEscalate: boolean;
  escalationLevel: "none" | "team_lead" | "manager" | "director" | "executive" | "external";
  urgency: "immediate" | "urgent" | "standard" | "deferred";
  escalationReason: string;
  triggerFactors: string[];
  impactAssessment: {
    severity: "critical" | "high" | "medium" | "low";
    scope: string;
    timeToImpact: string | null;
    financialExposure: string | null;
  };
  recommendedRecipients: string[];
  communicationChannel: "in-app" | "email" | "sms" | "phone" | "slack" | "pagerduty";
  confidence: number;
  evidenceRefs: string[];
  modelRoute: string;
  schemaVersion: "1.0.0";
  createdAt: string;
}

export function validateEscalationRecommendation(obj: unknown): obj is EscalationRecommendation {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.shouldEscalate === "boolean" &&
    typeof o.escalationLevel === "string" &&
    typeof o.urgency === "string" &&
    typeof o.escalationReason === "string" &&
    Array.isArray(o.triggerFactors) &&
    typeof o.confidence === "number" &&
    o.confidence >= 0 && o.confidence <= 1 &&
    o.impactAssessment !== null && typeof o.impactAssessment === "object"
  );
}
