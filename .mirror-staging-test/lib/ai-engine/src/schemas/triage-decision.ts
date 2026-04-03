export interface TriageDecision {
  priority: "P0" | "P1" | "P2" | "P3" | "P4";
  urgency: "immediate" | "urgent" | "standard" | "deferred";
  category: string;
  subcategory: string | null;
  routeTo: string;
  routeReason: string;
  summary: string;
  keyEntities: Array<{ type: string; value: string; confidence: number }>;
  suggestedActions: Array<{ action: string; reason: string; confidence: number }>;
  requiresHumanReview: boolean;
  confidence: number;
}

export const TRIAGE_DECISION_SCHEMA = {
  type: "object",
  required: ["priority", "urgency", "category", "routeTo", "summary", "confidence"],
  properties: {
    priority: { type: "string", enum: ["P0", "P1", "P2", "P3", "P4"] },
    urgency: { type: "string", enum: ["immediate", "urgent", "standard", "deferred"] },
    category: { type: "string" },
    subcategory: { type: "string", nullable: true },
    routeTo: { type: "string" },
    routeReason: { type: "string" },
    summary: { type: "string" },
    keyEntities: { type: "array", items: { type: "object", properties: { type: { type: "string" }, value: { type: "string" }, confidence: { type: "number" } } } },
    suggestedActions: { type: "array", items: { type: "object", properties: { action: { type: "string" }, reason: { type: "string" }, confidence: { type: "number" } } } },
    requiresHumanReview: { type: "boolean" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
} as const;

export function validateTriageDecision(raw: unknown): { valid: boolean; decision: TriageDecision | null; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") return { valid: false, decision: null, errors: ["Not an object"] };
  const obj = raw as Record<string, unknown>;
  if (!["P0", "P1", "P2", "P3", "P4"].includes(obj.priority as string)) errors.push("Invalid priority");
  if (typeof obj.category !== "string") errors.push("Missing category");
  if (typeof obj.routeTo !== "string") errors.push("Missing routeTo");
  if (typeof obj.summary !== "string") errors.push("Missing summary");
  if (typeof obj.confidence !== "number") errors.push("Missing confidence");
  if (errors.length > 0) return { valid: false, decision: null, errors };
  return {
    valid: true,
    decision: {
      priority: obj.priority as TriageDecision["priority"],
      urgency: (obj.urgency as TriageDecision["urgency"]) || "standard",
      category: obj.category as string,
      subcategory: (obj.subcategory as string) || null,
      routeTo: obj.routeTo as string,
      routeReason: (obj.routeReason as string) || "",
      summary: obj.summary as string,
      keyEntities: (obj.keyEntities as TriageDecision["keyEntities"]) || [],
      suggestedActions: (obj.suggestedActions as TriageDecision["suggestedActions"]) || [],
      requiresHumanReview: (obj.requiresHumanReview as boolean) ?? true,
      confidence: obj.confidence as number,
    },
    errors: [],
  };
}
