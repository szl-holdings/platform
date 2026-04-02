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

export function validateResolutionSummary(obj: unknown): obj is ResolutionSummary {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.workflowId === "string" &&
    typeof o.resolution === "string" &&
    typeof o.resolutionSummary === "string" &&
    Array.isArray(o.actionsTaken) &&
    typeof o.recurrenceRisk === "string" &&
    typeof o.followUpRequired === "boolean" &&
    typeof o.confidence === "number" &&
    o.confidence >= 0 && o.confidence <= 1
  );
}
