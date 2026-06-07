import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const outboundDeliveriesTable = pgTable(
  'outbound_deliveries',
  {
    id: serial('id').primaryKey(),
    deliveryId: text('delivery_id').notNull().unique(),
    channel: text('channel', {
      enum: ['webhook', 'email', 'sms', 'slack', 'teams', 'discord', 'siem', 'custom'],
    }).notNull(),
    status: text('status', {
      enum: ['queued', 'delivering', 'delivered', 'failed', 'retrying'],
    })
      .notNull()
      .default('queued'),
    sourceDomain: text('source_domain').notNull(),
    sourceEvent: text('source_event').notNull(),
    sourceSignalId: text('source_signal_id'),
    recipient: text('recipient'),
    payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),
    channelConfig: jsonb('channel_config').$type<Record<string, unknown>>(),
    providerMessageId: text('provider_message_id'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    lastError: text('last_error'),
    nextRetryAt: timestamp('next_retry_at'),
    deliveredAt: timestamp('delivered_at'),
    orgId: text('org_id'),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('outbound_deliveries_status_idx').on(t.status),
    index('outbound_deliveries_channel_idx').on(t.channel),
    index('outbound_deliveries_source_domain_idx').on(t.sourceDomain),
    index('outbound_deliveries_org_idx').on(t.orgId),
    index('outbound_deliveries_retry_idx').on(t.nextRetryAt),
  ],
);

export const outboundChannelConfigsTable = pgTable(
  'outbound_channel_configs',
  {
    id: serial('id').primaryKey(),
    configId: text('config_id').notNull().unique(),
    orgId: text('org_id'),
    channel: text('channel', {
      enum: ['webhook', 'email', 'sms', 'slack', 'teams', 'discord', 'siem', 'custom'],
    }).notNull(),
    name: text('name').notNull(),
    enabled: text('enabled').notNull().default('true'),
    config: jsonb('config').notNull().$type<Record<string, unknown>>(),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('outbound_channel_configs_org_idx').on(t.orgId),
    uniqueIndex('outbound_channel_configs_org_channel_name_idx').on(t.orgId, t.channel, t.name),
  ],
);

export const outboundAuditLogTable = pgTable(
  'outbound_audit_log',
  {
    id: serial('id').primaryKey(),
    deliveryId: text('delivery_id'),
    action: text('action').notNull(),
    channel: text('channel'),
    status: text('status'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    orgId: text('org_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('outbound_audit_log_delivery_idx').on(t.deliveryId),
    index('outbound_audit_log_org_idx').on(t.orgId),
  ],
);

export type OutboundDelivery = typeof outboundDeliveriesTable.$inferSelect;
export type OutboundChannelConfig = typeof outboundChannelConfigsTable.$inferSelect;
export type OutboundAuditLog = typeof outboundAuditLogTable.$inferSelect;
