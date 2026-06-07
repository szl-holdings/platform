import { index, jsonb, pgEnum, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const eventSeverityEnum = pgEnum('event_severity', [
  'info',
  'low',
  'medium',
  'high',
  'critical',
]);

export const eventActionEnum = pgEnum('event_action', [
  'created',
  'updated',
  'deleted',
  'detected',
  'resolved',
  'escalated',
  'routed',
  'recommended',
  'executed',
  'triggered',
  'scored',
  'forecasted',
]);

export const platformEventsTable = pgTable(
  'platform_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityType: text('entity_type').notNull(),
    action: eventActionEnum('action').notNull(),
    sourceApp: text('source_app').notNull(),
    severity: eventSeverityEnum('severity').notNull().default('info'),
    confidence: real('confidence'),
    impactedEntityIds: uuid('impacted_entity_ids').array().default([]),
    causalFactors: jsonb('causal_factors').$type<string[]>().default([]),
    suggestedAction: text('suggested_action'),
    businessImpact: text('business_impact'),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    actorId: text('actor_id'),
    traceId: uuid('trace_id'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
  },
  (t) => ({
    sourceAppIdx: index('platform_events_source_app_idx').on(t.sourceApp),
    entityTypeIdx: index('platform_events_entity_type_idx').on(t.entityType),
    severityIdx: index('platform_events_severity_idx').on(t.severity),
    timestampIdx: index('platform_events_timestamp_idx').on(t.timestamp),
    traceIdx: index('platform_events_trace_idx').on(t.traceId),
  }),
);

export type PlatformEvent = typeof platformEventsTable.$inferSelect;
export type NewPlatformEvent = typeof platformEventsTable.$inferInsert;
