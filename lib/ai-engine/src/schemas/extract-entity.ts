export interface ExtractedEntities {
  entities: ExtractedEntity[];
  relationships: EntityRelationship[];
  summary: string;
  confidence: number;
}

export interface ExtractedEntity {
  type: "person" | "organization" | "location" | "asset" | "vulnerability" | "indicator" | "date" | "amount" | "reference";
  value: string;
  confidence: number;
  context: string;
  normalizedValue: string | null;
}

export interface EntityRelationship {
  from: string;
  to: string;
  relationType: string;
  confidence: number;
}

export const EXTRACT_ENTITY_SCHEMA = {
  type: "object",
  required: ["entities", "summary", "confidence"],
  properties: {
    entities: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "value", "confidence"],
        properties: {
          type: { type: "string", enum: ["person", "organization", "location", "asset", "vulnerability", "indicator", "date", "amount", "reference"] },
          value: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          context: { type: "string" },
          normalizedValue: { type: "string", nullable: true },
        },
      },
    },
    relationships: {
      type: "array",
      items: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          relationType: { type: "string" },
          confidence: { type: "number" },
        },
      },
    },
    summary: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
} as const;

export function validateExtractedEntities(raw: unknown): { valid: boolean; result: ExtractedEntities | null; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") return { valid: false, result: null, errors: ["Not an object"] };
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.entities)) errors.push("Missing entities array");
  if (typeof obj.summary !== "string") errors.push("Missing summary");
  if (typeof obj.confidence !== "number") errors.push("Missing confidence");
  if (errors.length > 0) return { valid: false, result: null, errors };
  return {
    valid: true,
    result: {
      entities: (obj.entities as ExtractedEntity[]) || [],
      relationships: (obj.relationships as EntityRelationship[]) || [],
      summary: obj.summary as string,
      confidence: obj.confidence as number,
    },
    errors: [],
  };
}
