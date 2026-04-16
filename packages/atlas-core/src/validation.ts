import { z } from "zod";
import {
  SignalSchema,
  EventSchema,
  RiskSchema,
  OpportunitySchema,
  ControlSchema,
  WorkflowSchema,
  RecommendationSchema,
  ActionSchema,
  ApprovalSchema,
  EvidenceSchema,
  OutcomeSchema,
  PolicySchema,
  KpiSchema,
  SloSchema,
  type AtlasSignal,
  type AtlasEvent,
  type AtlasRisk,
  type AtlasOpportunity,
  type AtlasControl,
  type AtlasWorkflow,
  type AtlasRecommendation,
  type AtlasAction,
  type AtlasApproval,
  type AtlasEvidence,
  type AtlasOutcome,
  type AtlasPolicy,
  type AtlasKpi,
  type AtlasSlo,
} from "./primitives";
import {
  CaseSchema,
  MatterSchema,
  MissionSchema,
  DealSchema,
  VoyageSchema,
  IncidentSchema,
  type AtlasCase,
  type AtlasMatter,
  type AtlasMission,
  type AtlasDeal,
  type AtlasVoyage,
  type AtlasIncident,
} from "./domain";

export const AtlasPrimitiveSchema = z.discriminatedUnion("entityType", [
  SignalSchema,
  EventSchema,
  RiskSchema,
  OpportunitySchema,
  ControlSchema,
  WorkflowSchema,
  RecommendationSchema,
  ActionSchema,
  ApprovalSchema,
  EvidenceSchema,
  OutcomeSchema,
  PolicySchema,
  KpiSchema,
  SloSchema,
]);
export type AtlasPrimitive = z.infer<typeof AtlasPrimitiveSchema>;

export const AtlasDomainEntitySchema = z.discriminatedUnion("entityType", [
  CaseSchema,
  MatterSchema,
  MissionSchema,
  DealSchema,
  VoyageSchema,
  IncidentSchema,
]);
export type AtlasDomainEntityUnion = z.infer<typeof AtlasDomainEntitySchema>;

export const AtlasEntitySchema = z.union([AtlasPrimitiveSchema, AtlasDomainEntitySchema]);
export type AtlasEntity = z.infer<typeof AtlasEntitySchema>;

export type AtlasEntityMap = {
  signal: AtlasSignal;
  event: AtlasEvent;
  risk: AtlasRisk;
  opportunity: AtlasOpportunity;
  control: AtlasControl;
  workflow: AtlasWorkflow;
  recommendation: AtlasRecommendation;
  action: AtlasAction;
  approval: AtlasApproval;
  evidence: AtlasEvidence;
  outcome: AtlasOutcome;
  policy: AtlasPolicy;
  kpi: AtlasKpi;
  slo: AtlasSlo;
  case: AtlasCase;
  matter: AtlasMatter;
  mission: AtlasMission;
  deal: AtlasDeal;
  voyage: AtlasVoyage;
  incident: AtlasIncident;
};

export type AtlasEntityType = keyof AtlasEntityMap;

export const ATLAS_ENTITY_TYPES: AtlasEntityType[] = [
  "signal",
  "event",
  "risk",
  "opportunity",
  "control",
  "workflow",
  "recommendation",
  "action",
  "approval",
  "evidence",
  "outcome",
  "policy",
  "kpi",
  "slo",
  "case",
  "matter",
  "mission",
  "deal",
  "voyage",
  "incident",
];

export function validateAtlasEntity(data: unknown): { success: true; data: AtlasEntity } | { success: false; errors: z.ZodError } {
  const result = AtlasEntitySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function isAtlasEntityType(type: string): type is AtlasEntityType {
  return ATLAS_ENTITY_TYPES.includes(type as AtlasEntityType);
}

export const CrossDomainRelationshipSchema = z.object({
  id: z.string().uuid(),
  fromEntityType: z.string(),
  fromEntityId: z.string(),
  toEntityType: z.string(),
  toEntityId: z.string(),
  relationshipType: z.enum([
    "triggers",
    "caused_by",
    "mitigates",
    "relates_to",
    "escalates_to",
    "parent_of",
    "child_of",
    "precedes",
    "follows",
    "supersedes",
    "evidences",
    "references",
  ]),
  tenantId: z.string(),
  createdAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});
export type AtlasCrossDomainRelationship = z.infer<typeof CrossDomainRelationshipSchema>;
