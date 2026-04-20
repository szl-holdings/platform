import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { pcConnectorAccountsTable, pcMattersTable } from './prism_counsel';

export const pcBackgroundJobsTable = pgTable(
  'pc_background_jobs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    jobType: text('job_type', {
      enum: [
        'document_ingest',
        'document_extract',
        'forecast_recompute',
        'deadline_evaluate',
        'notification_send',
        'export_generate',
        'connector_sync',
        'webhook_process',
        'manual_review',
        'replay_job',
        'clock_evaluate',
        'demand_packet_generate',
        'ai_review',
        'bulk_import',
        'report_generate',
      ],
    }).notNull(),
    status: text('status', { enum: ['pending', 'running', 'completed', 'failed', 'dead_letter'] })
      .notNull()
      .default('pending'),
    payload: jsonb('payload'),
    result: jsonb('result'),
    error: text('error'),
    matterId: integer('matter_id'),
    connectorAccountId: integer('connector_account_id'),
    idempotencyKey: text('idempotency_key'),
    retryCount: integer('retry_count').notNull().default(0),
    maxRetries: integer('max_retries').notNull().default(3),
    nextRetryAt: timestamp('next_retry_at'),
    correlationId: text('correlation_id'),
    actorId: integer('actor_id'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_bg_jobs_status_idx').on(table.status),
    index('pc_bg_jobs_type_idx').on(table.jobType),
    index('pc_bg_jobs_org_idx').on(table.orgId),
    index('pc_bg_jobs_idempotency_idx').on(table.idempotencyKey),
  ],
);

export const pcDeadLetterEventsTable = pgTable('pc_dead_letter_events', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  sourceJobId: integer('source_job_id'),
  jobType: text('job_type').notNull(),
  payload: jsonb('payload'),
  error: text('error'),
  failedAt: timestamp('failed_at').notNull().defaultNow(),
  retryCount: integer('retry_count').notNull().default(0),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: integer('resolved_by'),
  resolution: text('resolution', { enum: ['replayed', 'discarded', 'manual_fix'] }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcDocumentsTable = pgTable(
  'pc_documents',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: integer('file_size'),
    mimeType: text('mime_type'),
    checksum: text('checksum'),
    storageUri: text('storage_uri'),
    storageContainer: text('storage_container', {
      enum: ['raw-ingest', 'normalized-docs', 'generated-artifacts', 'audit-packets', 'exports'],
    }),
    documentType: text('document_type', {
      enum: [
        'medical_record',
        'bill',
        'correspondence',
        'pleading',
        'discovery',
        'deposition_transcript',
        'expert_report',
        'photo',
        'police_report',
        'insurance_doc',
        'demand_letter',
        'settlement_agreement',
        'court_order',
        'motion',
        'affidavit',
        'other',
      ],
    }),
    sourceSystem: text('source_system'),
    sourceRecordId: text('source_record_id'),
    sourceConfidence: numeric('source_confidence', { precision: 5, scale: 2 }),
    isGenerated: boolean('is_generated').default(false),
    privilegeFlag: boolean('privilege_flag').default(false),
    reviewState: text('review_state', {
      enum: ['unreviewed', 'reviewed', 'flagged', 'redacted', 'quarantine'],
    }).default('unreviewed'),
    uploadedBy: integer('uploaded_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_docs_matter_idx').on(table.matterId),
    index('pc_docs_org_idx').on(table.orgId),
    index('pc_docs_checksum_idx').on(table.checksum),
  ],
);

export const pcExtractionJobsTable = pgTable(
  'pc_extraction_jobs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    documentId: integer('document_id')
      .notNull()
      .references(() => pcDocumentsTable.id, { onDelete: 'cascade' }),
    extractionProvider: text('extraction_provider', {
      enum: ['azure_doc_intel', 'manual', 'ocr_fallback'],
    })
      .notNull()
      .default('azure_doc_intel'),
    status: text('status', {
      enum: ['pending', 'processing', 'completed', 'failed', 'review_required'],
    })
      .notNull()
      .default('pending'),
    confidence: numeric('confidence', { precision: 5, scale: 2 }),
    extractedText: text('extracted_text'),
    extractedTables: jsonb('extracted_tables'),
    extractedMetadata: jsonb('extracted_metadata'),
    layoutData: jsonb('layout_data'),
    error: text('error'),
    costCents: integer('cost_cents'),
    processingTimeMs: integer('processing_time_ms'),
    correlationId: text('correlation_id'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_extract_doc_idx').on(table.documentId),
    index('pc_extract_status_idx').on(table.status),
  ],
);

export const pcNotificationsTable = pgTable(
  'pc_notifications',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    userId: integer('user_id'),
    matterId: integer('matter_id'),
    channel: text('channel', { enum: ['in_app', 'email', 'teams', 'webhook'] })
      .notNull()
      .default('in_app'),
    notificationType: text('notification_type', {
      enum: [
        'deadline_warning',
        'deadline_breach',
        'approval_required',
        'approval_resolved',
        'connector_error',
        'extraction_complete',
        'extraction_failed',
        'forecast_update',
        'ai_recommendation',
        'matter_update',
        'system_alert',
        'export_ready',
      ],
    }).notNull(),
    title: text('title').notNull(),
    body: text('body'),
    actionUrl: text('action_url'),
    metadata: jsonb('metadata'),
    isRead: boolean('is_read').default(false),
    sentAt: timestamp('sent_at'),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_notif_user_idx').on(table.userId),
    index('pc_notif_org_idx').on(table.orgId),
  ],
);

export const pcFeatureFlagsTable = pgTable('pc_feature_flags', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id'),
  flagKey: text('flag_key').notNull(),
  enabled: boolean('enabled').notNull().default(false),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pcWebhookSubscriptionsTable = pgTable(
  'pc_webhook_subscriptions',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    connectorAccountId: integer('connector_account_id').references(
      () => pcConnectorAccountsTable.id,
    ),
    provider: text('provider', {
      enum: ['microsoft_graph', 'docusign', 'clio', 'custom'],
    }).notNull(),
    resourceType: text('resource_type').notNull(),
    subscriptionId: text('subscription_id'),
    notificationUrl: text('notification_url'),
    expiresAt: timestamp('expires_at'),
    status: text('status', { enum: ['active', 'expired', 'failed', 'pending'] })
      .notNull()
      .default('pending'),
    lastNotificationAt: timestamp('last_notification_at'),
    renewalCount: integer('renewal_count').default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_webhook_status_idx').on(table.status),
    index('pc_webhook_expires_idx').on(table.expiresAt),
  ],
);

export const pcEmailsTable = pgTable(
  'pc_emails',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    messageId: text('message_id'),
    conversationId: text('conversation_id'),
    fromAddress: text('from_address'),
    toAddresses: jsonb('to_addresses'),
    ccAddresses: jsonb('cc_addresses'),
    subject: text('subject'),
    bodyPreview: text('body_preview'),
    hasAttachments: boolean('has_attachments').default(false),
    attachmentCount: integer('attachment_count').default(0),
    receivedAt: timestamp('received_at'),
    isLinked: boolean('is_linked').default(false),
    sourceSystem: text('source_system').default('microsoft_graph'),
    sourceRecordId: text('source_record_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('pc_emails_matter_idx').on(table.matterId),
    index('pc_emails_msg_id_idx').on(table.messageId),
  ],
);

export const pcSourceItemsTable = pgTable(
  'pc_source_items',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull(),
    matterId: integer('matter_id').references(() => pcMattersTable.id),
    sourceSystem: text('source_system').notNull(),
    sourceRecordId: text('source_record_id').notNull(),
    sourceType: text('source_type').notNull(),
    title: text('title'),
    metadata: jsonb('metadata'),
    lastSyncedAt: timestamp('last_synced_at'),
    syncCursor: text('sync_cursor'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('pc_source_system_idx').on(table.sourceSystem, table.sourceRecordId)],
);

export const pcApprovalStepsTable = pgTable('pc_approval_steps', {
  id: serial('id').primaryKey(),
  approvalRequestId: integer('approval_request_id').notNull(),
  stepOrder: integer('step_order').notNull().default(1),
  approverRole: text('approver_role').notNull(),
  approverId: integer('approver_id'),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'escalated', 'expired'] })
    .notNull()
    .default('pending'),
  comments: text('comments'),
  escalationDeadline: timestamp('escalation_deadline'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pcGraphSubscriptionStateTable = pgTable('pc_graph_subscription_state', {
  id: serial('id').primaryKey(),
  orgId: integer('org_id').notNull(),
  connectorAccountId: integer('connector_account_id').notNull(),
  resourcePath: text('resource_path').notNull(),
  subscriptionId: text('subscription_id').notNull(),
  changeType: text('change_type').notNull(),
  expirationDateTime: timestamp('expiration_date_time'),
  clientState: text('client_state'),
  status: text('status', { enum: ['active', 'expired', 'failed'] })
    .notNull()
    .default('active'),
  lastRenewedAt: timestamp('last_renewed_at'),
  renewalFailureCount: integer('renewal_failure_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insertBackgroundJobSchema = createInsertSchema(pcBackgroundJobsTable);
export type PcBackgroundJob = typeof pcBackgroundJobsTable.$inferSelect;
export type PcDeadLetterEvent = typeof pcDeadLetterEventsTable.$inferSelect;
export type PcDocument = typeof pcDocumentsTable.$inferSelect;
export type PcExtractionJob = typeof pcExtractionJobsTable.$inferSelect;
export type PcNotification = typeof pcNotificationsTable.$inferSelect;
export type PcFeatureFlag = typeof pcFeatureFlagsTable.$inferSelect;
export type PcWebhookSubscription = typeof pcWebhookSubscriptionsTable.$inferSelect;
export type PcEmail = typeof pcEmailsTable.$inferSelect;
export type PcSourceItem = typeof pcSourceItemsTable.$inferSelect;
export type PcApprovalStep = typeof pcApprovalStepsTable.$inferSelect;
export type PcGraphSubscriptionState = typeof pcGraphSubscriptionStateTable.$inferSelect;
