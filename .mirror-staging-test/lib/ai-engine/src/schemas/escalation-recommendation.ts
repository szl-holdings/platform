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

const VALID_ESCALATION_LEVELS = ["none", "team_lead", "manager", "director", "executive", "external"];
const VALID_URGENCIES = ["immediate", "urgent", "standard", "deferred"];

export function validateEscalationRecommendation(obj: unknown): obj is EscalationRecommendation {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.decisionId === "string" && o.decisionId.length > 0 &&
    Array.isArray(o.signalIds) &&
    typeof o.shouldEscalate === "boolean" &&
    typeof o.escalationLevel === "string" && VALID_ESCALATION_LEVELS.includes(o.escalationLevel as string) &&
    typeof o.urgency === "string" && VALID_URGENCIES.includes(o.urgency as string) &&
    typeof o.escalationReason === "string" &&
    Array.isArray(o.triggerFactors) &&
    typeof o.confidence === "number" &&
    o.confidence >= 0 && o.confidence <= 1 &&
    o.impactAssessment !== null && typeof o.impactAssessment === "object" &&
    Array.isArray(o.evidenceRefs) &&
    typeof o.modelRoute === "string" &&
    o.schemaVersion === "1.0.0" &&
    typeof o.createdAt === "string"
  );
}
