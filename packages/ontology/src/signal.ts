/**
 * Signal — the universal first-class event for the living signal mesh.
 *
 * Every emitter (browser, API, worker, connector, model, human) produces
 * a Signal. The 9-stage pipeline processes it through intake → telemetry-writeback.
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const SignalSourceSchema = z.enum([
  'browser',
  'api',
  'worker',
  'connector',
  'model',
  'human',
  'system',
  'synthetic',
]);
export type SignalSource = z.infer<typeof SignalSourceSchema>;

export const SignalTypeSchema = z.enum([
  'anomaly',
  'risk',
  'opportunity',
  'threshold-breach',
  'state-change',
  'position-update',
  'sanctions-match',
  'deadline',
  'escalation',
  'market-signal',
  'compliance-flag',
  'recommendation',
  'approval',
  'execution',
  'outcome',
  'telemetry',
  'heartbeat',
  'connector-event',
  'cognitive-reflexive',
  'custom',
]);
export type SignalType = z.infer<typeof SignalTypeSchema>;

export const SignalSeveritySchema = z.enum(['info', 'low', 'medium', 'high', 'critical']);
export type SignalSeverity = z.infer<typeof SignalSeveritySchema>;

export const SignalDomainSchema = z.enum([
  'maritime',
  'real-estate',
  'legal',
  'security',
  'finance',
  'workforce',
  'hospitality',
  'platform',
  'ai',
  'cross-domain',
]);
export type SignalDomain = z.infer<typeof SignalDomainSchema>;

export const SignalStageSchema = z.enum([
  'intake',
  'normalize',
  'enrich',
  'entity-resolve',
  'correlate',
  'score',
  'recommend',
  'policy-evaluate',
  'telemetry-writeback',
]);
export type SignalStage = z.infer<typeof SignalStageSchema>;

export const EntityRefSchema = z.object({
  entityId: z.string(),
  entityType: z.string(),
  displayName: z.string().optional(),
  domain: SignalDomainSchema.optional(),
  externalIds: z.record(z.string()).optional(),
});
export type EntityRef = z.infer<typeof EntityRefSchema>;

export const ProvenanceSchema = z.object({
  sourceService: z.string().optional(),
  connectorId: z.string().optional(),
  connectorCategory: z.string().optional(),
  modelId: z.string().optional(),
  traceId: z.string().optional(),
  runId: z.string().optional(),
  correlationId: z.string().optional(),
  causationId: z.string().optional(),
  workflowId: z.string().optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const SignalSchema = z.object({
  signalId: z.string().uuid(),

  source: SignalSourceSchema,
  type: SignalTypeSchema,
  domain: SignalDomainSchema,

  occurredAt: z.string().datetime(),
  receivedAt: z.string().datetime(),
  processedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),

  freshness: z.number().min(0).max(1).default(1),
  confidence: z.number().min(0).max(1).default(1),
  severity: SignalSeveritySchema.optional(),
  opportunityScore: z.number().min(0).max(1).optional(),

  entityRefs: z.array(EntityRefSchema).default([]),
  tenantId: z.string().optional(),
  sessionId: z.string().optional(),

  rawPayload: z.record(z.unknown()).default({}),
  normalizedPayload: z.record(z.unknown()).optional(),

  tags: z.array(z.string()).default([]),
  provenance: ProvenanceSchema.optional(),

  stage: SignalStageSchema.default('intake'),
  processingErrors: z.array(z.string()).default([]),

  correlatedSignalIds: z.array(z.string()).default([]),
  evidenceItemIds: z.array(z.string()).default([]),
  recommendationIds: z.array(z.string()).default([]),

  schemaVersion: z.string().default('signal/1.0'),
});
export type Signal = z.infer<typeof SignalSchema>;

export type SignalInput = Omit<
  Signal,
  | 'signalId'
  | 'receivedAt'
  | 'schemaVersion'
  | 'stage'
  | 'processingErrors'
  | 'correlatedSignalIds'
  | 'evidenceItemIds'
  | 'recommendationIds'
>;

export function createSignal(input: SignalInput): Signal {
  return SignalSchema.parse({
    ...input,
    signalId: randomUUID(),
    receivedAt: new Date().toISOString(),
    schemaVersion: 'signal/1.0',
  });
}

export function fromAtlasEvent(
  eventName: string,
  payload: Record<string, unknown>,
  domain: SignalDomain,
  tenantId?: string,
): Signal {
  return createSignal({
    source: 'api',
    type: 'connector-event',
    domain,
    occurredAt: (payload.occurredAt as string | undefined) ?? new Date().toISOString(),
    expiresAt: undefined,
    freshness: 1,
    confidence: 0.9,
    entityRefs: [],
    tenantId,
    rawPayload: { eventName, ...payload },
    tags: ['atlas-event', eventName.split('.')[0] ?? 'unknown'],
    provenance: { sourceService: 'atlas-events' },
  });
}

export function fromBusinessEvent(
  eventClass: string,
  payload: Record<string, unknown>,
  domain: SignalDomain,
): Signal {
  return createSignal({
    source: 'api',
    type: 'connector-event',
    domain,
    occurredAt: new Date().toISOString(),
    freshness: 1,
    confidence: 0.85,
    entityRefs: [],
    rawPayload: { eventClass, ...payload },
    tags: ['business-event', eventClass.split('.')[0] ?? 'unknown'],
    provenance: { sourceService: 'business-events' },
  });
}
