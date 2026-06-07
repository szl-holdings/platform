import { randomUUID } from 'node:crypto';
import { ATLAS_DOMAINS } from '@szl-holdings/atlas-core';
import { z } from 'zod';
import { ATLAS_ALL_EVENTS, type AtlasEventName } from './taxonomy';

export const AtlasEventMetadataSchema = z.object({
  eventId: z.string().uuid(),
  eventName: z.string(),
  eventVersion: z.string().default('1.0'),
  occurredAt: z.string().datetime(),
  publishedAt: z.string().datetime(),
  domain: z.enum(ATLAS_DOMAINS),
  tenantId: z.string(),

  actor: z.object({
    actorId: z.string(),
    actorType: z.enum(['human', 'agent', 'system', 'external']),
    displayName: z.string().optional(),
    role: z.string().optional(),
  }),

  workflowId: z.string().optional(),
  correlationId: z.string().optional(),
  causationId: z.string().optional(),

  entityIds: z
    .object({
      primaryId: z.string().optional(),
      primaryType: z.string().optional(),
      relatedIds: z.record(z.string()).optional(),
    })
    .optional(),

  businessValue: z
    .object({
      financialImpactUsd: z.number().optional(),
      operationalSeverity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
      affectedUsers: z.number().int().nonnegative().optional(),
      affectedRevenue: z.number().optional(),
    })
    .optional(),

  slaImpact: z
    .object({
      sloId: z.string().optional(),
      sloName: z.string().optional(),
      slaDeadline: z.string().datetime().optional(),
      slaAtRisk: z.boolean().optional(),
      slaBreached: z.boolean().optional(),
    })
    .optional(),

  tags: z.array(z.string()).optional(),
  environment: z.enum(['development', 'staging', 'production']).optional(),
  sourceService: z.string().optional(),
  schemaVersion: z.string().default('atlas-events/1.0'),
});
export type AtlasEventMetadata = z.infer<typeof AtlasEventMetadataSchema>;

export const AtlasEventEnvelopeSchema = <T extends z.ZodTypeAny>(payloadSchema: T) =>
  z.object({
    metadata: AtlasEventMetadataSchema,
    payload: payloadSchema,
  });

export type AtlasEventEnvelope<T = unknown> = {
  metadata: AtlasEventMetadata;
  payload: T;
};

export function createEventEnvelope<T>(
  eventName: AtlasEventName | string,
  payload: T,
  metadata: Omit<
    AtlasEventMetadata,
    'eventId' | 'eventName' | 'publishedAt' | 'schemaVersion' | 'eventVersion'
  >,
): AtlasEventEnvelope<T> {
  return {
    metadata: {
      ...metadata,
      eventId: randomUUID(),
      eventName,
      eventVersion: '1.0',
      publishedAt: new Date().toISOString(),
      schemaVersion: 'atlas-events/1.0',
    },
    payload,
  };
}

export class AtlasUnknownEventError extends Error {
  constructor(eventName: string) {
    super(
      `Unknown ATLAS event: "${eventName}". Use a canonical AtlasEventName or createEventEnvelope() for custom events.`,
    );
    this.name = 'AtlasUnknownEventError';
  }
}

export function createStrictEventEnvelope<T>(
  eventName: AtlasEventName,
  payload: T,
  metadata: Omit<
    AtlasEventMetadata,
    'eventId' | 'eventName' | 'publishedAt' | 'schemaVersion' | 'eventVersion'
  >,
): AtlasEventEnvelope<T> {
  if (!(eventName in ATLAS_ALL_EVENTS)) {
    throw new AtlasUnknownEventError(eventName);
  }
  return createEventEnvelope(eventName, payload, metadata);
}

export const AtlasEventRoutingRuleSchema = z.object({
  eventPattern: z.string(),
  targetDomain: z.enum(ATLAS_DOMAINS),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  transformations: z.array(z.string()).optional(),
  filterConditions: z.array(z.string()).optional(),
  retentionDays: z.number().int().positive().default(90),
});
export type AtlasEventRoutingRule = z.infer<typeof AtlasEventRoutingRuleSchema>;

export const STANDARD_RETENTION_DAYS: Record<string, number> = {
  'auth.*': 365,
  'security.incident.*': 2555,
  'security.*': 365,
  'business.*': 730,
  'maritime.*': 730,
  'real_estate.*': 1095,
  'legal.*': 2555,
  'ai.*': 365,
  'workflow.*': 730,
  'billing.*': 2555,
  'platform.*': 180,
};

export function getRetentionDays(eventName: string): number {
  for (const [pattern, days] of Object.entries(STANDARD_RETENTION_DAYS)) {
    const isWildcard = pattern.endsWith('.*');
    const prefix = isWildcard ? pattern.slice(0, -2) : pattern;
    const escapedPrefix = prefix.replace(/\./g, '\\.');
    const regex = isWildcard
      ? new RegExp(`^${escapedPrefix}\\..*$`)
      : new RegExp(`^${escapedPrefix}$`);
    if (regex.test(eventName)) return days;
  }
  return 365;
}
