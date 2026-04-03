export interface ResolutionSummary {
  decisionId: string;
  workflowId: string;
  signalIds: string[];
  resolution: "resolved" | "mitigated" | "accepted_risk" | "false_positive" | "deferred" | "escalated";
  resolutionSummary: string;
  rootCause: string | null;
  rootCauseCategory: string | null;
  actionsTaken: Array<{
    action: string;
    completedBy: string;
    completedAt: string;
    outcome: string;
  }>;
  timeToResolution: {
    totalMs: number;
    detectionToTriageMs: number | null;
    triageToActionMs: number | null;
    actionToResolutionMs: number | null;
  };
  lessonsLearned: string[];
  preventionRecommendations: string[];
  recurrenceRisk: "high" | "medium" | "low" | "none";
  followUpRequired: boolean;
  followUpActions: string[];
  confidence: number;
  evidenceRefs: string[];
  modelRoute: string;
  schemaVersion: "1.0.0";
  createdAt: string;
}

const VALID_RESOLUTIONS = ["resolved", "mitigated", "accepted_risk", "false_positive", "deferred", "escalated"];
const VALID_RECURRENCE_RISKS = ["high", "medium", "low", "none"];

export function validateResolutionSummary(obj: unknown): obj is ResolutionSummary {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.decisionId === "string" && o.decisionId.length > 0 &&
    typeof o.workflowId === "string" && o.workflowId.length > 0 &&
    Array.isArray(o.signalIds) &&
    typeof o.resolution === "string" && VALID_RESOLUTIONS.includes(o.resolution as string) &&
    typeof o.resolutionSummary === "string" &&
    Array.isArray(o.actionsTaken) &&
    typeof o.recurrenceRisk === "string" && VALID_RECURRENCE_RISKS.includes(o.recurrenceRisk as string) &&
    typeof o.followUpRequired === "boolean" &&
    Array.isArray(o.followUpActions) &&
    typeof o.confidence === "number" &&
    o.confidence >= 0 && o.confidence <= 1 &&
    Array.isArray(o.evidenceRefs) &&
    typeof o.modelRoute === "string" &&
    o.schemaVersion === "1.0.0" &&
    typeof o.createdAt === "string"
  );
}
