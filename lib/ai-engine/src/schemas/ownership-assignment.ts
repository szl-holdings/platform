export interface OwnershipAssignment {
  decisionId: string;
  signalIds: string[];
  assignedOwner: string;
  ownerRole: string;
  ownerTeam: string | null;
  assignmentReason: string;
  alternativeOwners: Array<{
    ownerId: string;
    reason: string;
    confidence: number;
  }>;
  escalationPath: string[];
  confidence: number;
  evidenceRefs: string[];
  workloadContext: {
    currentAssignments: number;
    avgResolutionTime: string | null;
    availability: "available" | "busy" | "unavailable" | "unknown";
  } | null;
  modelRoute: string;
  schemaVersion: "1.0.0";
  createdAt: string;
}

export function validateOwnershipAssignment(obj: unknown): obj is OwnershipAssignment {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.decisionId === "string" && o.decisionId.length > 0 &&
    Array.isArray(o.signalIds) &&
    typeof o.assignedOwner === "string" && o.assignedOwner.length > 0 &&
    typeof o.ownerRole === "string" &&
    typeof o.assignmentReason === "string" &&
    typeof o.confidence === "number" &&
    o.confidence >= 0 && o.confidence <= 1 &&
    Array.isArray(o.alternativeOwners) &&
    Array.isArray(o.escalationPath) &&
    Array.isArray(o.evidenceRefs) &&
    typeof o.modelRoute === "string" &&
    o.schemaVersion === "1.0.0" &&
    typeof o.createdAt === "string"
  );
}
