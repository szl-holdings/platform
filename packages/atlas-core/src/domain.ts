import { z } from 'zod';
import { ActorRefSchema, BaseEntitySchema, ConfidenceScoreSchema, RISK_LEVELS } from './primitives';

export const CaseSchema = BaseEntitySchema.extend({
  entityType: z.literal('case'),
  caseNumber: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['open', 'investigating', 'pending_action', 'resolved', 'closed', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']),
  category: z.string(),
  subcategory: z.string().optional(),
  assignedTo: ActorRefSchema.optional(),
  reportedBy: ActorRefSchema.optional(),
  relatedEntityIds: z.array(z.string()).optional(),
  resolution: z.string().optional(),
  closedAt: z.string().datetime().optional(),
  slaDeadline: z.string().datetime().optional(),
  slaBreached: z.boolean().optional(),
});
export type AtlasCase = z.infer<typeof CaseSchema>;

export const MatterSchema = BaseEntitySchema.extend({
  entityType: z.literal('matter'),
  matterNumber: z.string(),
  title: z.string(),
  description: z.string().optional(),
  matterType: z.enum([
    'litigation',
    'advisory',
    'compliance',
    'regulatory',
    'transactional',
    'ip',
    'employment',
  ]),
  status: z.enum(['intake', 'active', 'discovery', 'trial', 'settlement', 'closed', 'archived']),
  clientId: z.string(),
  clientName: z.string(),
  leadCounsel: ActorRefSchema.optional(),
  supportTeam: z.array(ActorRefSchema).optional(),
  jurisdiction: z.string().optional(),
  practiceArea: z.string().optional(),
  estimatedValueUsd: z.number().nonnegative().optional(),
  actualValueUsd: z.number().nonnegative().optional(),
  billedHours: z.number().nonnegative().optional(),
  retainerUsd: z.number().nonnegative().optional(),
  deadlines: z
    .array(
      z.object({
        title: z.string(),
        dueDate: z.string().datetime(),
        completed: z.boolean().default(false),
      }),
    )
    .optional(),
  closedAt: z.string().datetime().optional(),
});
export type AtlasMatter = z.infer<typeof MatterSchema>;

export const MissionSchema = BaseEntitySchema.extend({
  entityType: z.literal('mission'),
  missionId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  missionType: z.enum([
    'surveillance',
    'threat_response',
    'cyber_defense',
    'intelligence_collection',
    'force_protection',
    'critical_infrastructure',
    'joint_operation',
    'training',
  ]),
  status: z.enum(['planned', 'briefing', 'active', 'paused', 'completed', 'aborted', 'debrief']),
  classification: z
    .enum(['unclassified', 'confidential', 'secret', 'top_secret'])
    .default('unclassified'),
  commandingOfficer: ActorRefSchema.optional(),
  missionTeam: z.array(ActorRefSchema).optional(),
  area_of_operation: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  objectiveIds: z.array(z.string()).optional(),
  threatLevel: z.enum(RISK_LEVELS).optional(),
  roePolicy: z.string().optional(),
});
export type AtlasMission = z.infer<typeof MissionSchema>;

export const DealSchema = BaseEntitySchema.extend({
  entityType: z.literal('deal'),
  dealId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dealType: z.enum([
    'acquisition',
    'sale',
    'lease',
    'joint_venture',
    'financing',
    'voyage_charter',
    'advisory_mandate',
  ]),
  status: z.enum([
    'prospect',
    'qualifying',
    'due_diligence',
    'negotiation',
    'under_contract',
    'closed_won',
    'closed_lost',
    'withdrawn',
  ]),
  estimatedValueUsd: z.number().nonnegative().optional(),
  actualValueUsd: z.number().nonnegative().optional(),
  currency: z.string().default('USD'),
  dealLead: ActorRefSchema.optional(),
  counterpartyName: z.string().optional(),
  counterpartyId: z.string().optional(),
  probability: ConfidenceScoreSchema,
  expectedCloseDate: z.string().datetime().optional(),
  actualCloseDate: z.string().datetime().optional(),
  relatedEntityIds: z.array(z.string()).optional(),
  keyRisks: z.array(z.string()).optional(),
});
export type AtlasDeal = z.infer<typeof DealSchema>;

export const VoyageSchema = BaseEntitySchema.extend({
  entityType: z.literal('voyage'),
  voyageId: z.string(),
  vesselId: z.string(),
  vesselName: z.string().optional(),
  imo: z.string().optional(),
  status: z.enum([
    'scheduled',
    'loading',
    'ballasting',
    'laden',
    'discharging',
    'completed',
    'cancelled',
    'diverted',
  ]),
  charterType: z.enum(['spot', 'time_charter', 'bareboat', 'coa', 'own']).optional(),
  originPort: z.string(),
  destinationPort: z.string(),
  cargo: z.string().optional(),
  cargoQuantityMt: z.number().nonnegative().optional(),
  etd: z.string().datetime().optional(),
  eta: z.string().datetime().optional(),
  atd: z.string().datetime().optional(),
  ata: z.string().datetime().optional(),
  revenueUsd: z.number().optional(),
  costUsd: z.number().optional(),
  tcePd: z.number().optional(),
  sanctionsStatus: z.enum(['clear', 'flagged', 'investigating', 'blocked']).default('clear'),
  darkPeriodDetected: z.boolean().default(false),
  anomalyFlags: z.array(z.string()).optional(),
  lastAisUpdate: z.string().datetime().optional(),
  currentLatitude: z.number().min(-90).max(90).optional(),
  currentLongitude: z.number().min(-180).max(180).optional(),
});
export type AtlasVoyage = z.infer<typeof VoyageSchema>;

export const IncidentSchema = BaseEntitySchema.extend({
  entityType: z.literal('incident'),
  incidentId: z.string(),
  title: z.string(),
  description: z.string(),
  incidentType: z.enum([
    'security_breach',
    'data_loss',
    'service_outage',
    'performance_degradation',
    'compliance_violation',
    'fraud',
    'physical_security',
    'cyber_attack',
    'insider_threat',
    'supply_chain',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical', 'catastrophic']),
  status: z.enum([
    'detected',
    'triaged',
    'investigating',
    'containing',
    'eradicating',
    'recovering',
    'post_incident',
    'closed',
  ]),
  detectedAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().optional(),
  containedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  closedAt: z.string().datetime().optional(),
  incidentCommander: ActorRefSchema.optional(),
  responseTeam: z.array(ActorRefSchema).optional(),
  affectedSystems: z.array(z.string()).optional(),
  affectedUsers: z.number().int().nonnegative().optional(),
  mitreAttackTechniques: z.array(z.string()).optional(),
  iocs: z.array(z.string()).optional(),
  cveIds: z.array(z.string()).optional(),
  playbookId: z.string().optional(),
  notificationsSent: z.array(z.string()).optional(),
  postMortemId: z.string().optional(),
});
export type AtlasIncident = z.infer<typeof IncidentSchema>;

export type AtlasDomainEntity =
  | AtlasCase
  | AtlasMatter
  | AtlasMission
  | AtlasDeal
  | AtlasVoyage
  | AtlasIncident;

export const DOMAIN_ENTITY_TYPES = [
  'case',
  'matter',
  'mission',
  'deal',
  'voyage',
  'incident',
] as const;
export type AtlasDomainEntityType = (typeof DOMAIN_ENTITY_TYPES)[number];
