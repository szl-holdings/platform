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
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const pulseBriefingsTable = pgTable('pulse_briefings', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  edition: text('edition').notNull(),
  classification: text('classification').notNull(),
  status: text('status', { enum: ['published', 'draft', 'archived'] })
    .notNull()
    .default('published'),
  overallRisk: text('overall_risk').notNull(),
  overallConfidence: numeric('overall_confidence').notNull(),
  headline: text('headline').notNull(),
  leadSentence: text('lead_sentence').notNull(),
  domains: jsonb('domains').notNull().$type<string[]>(),
  sections: jsonb('sections').notNull().$type<unknown[]>(),
  recommendedActions: jsonb('recommended_actions').notNull().$type<unknown[]>(),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pulseDissentsTable = pgTable('pulse_dissents', {
  id: serial('id').primaryKey(),
  dissentId: text('dissent_id').notNull().unique(),
  briefingId: text('briefing_id').notNull(),
  sectionId: text('section_id').notNull(),
  sectionTitle: text('section_title').notNull(),
  dissentingView: text('dissenting_view').notNull(),
  basis: text('basis').notNull(),
  impactIfCorrect: text('impact_if_correct').notNull().default(''),
  filedBy: text('filed_by').notNull(),
  filedAt: timestamp('filed_at').notNull().defaultNow(),
  status: text('status', { enum: ['open', 'under_review', 'acknowledged', 'resolved'] })
    .notNull()
    .default('open'),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pulseCustomBriefsTable = pgTable('pulse_custom_briefs', {
  id: serial('id').primaryKey(),
  requestId: text('request_id').notNull().unique(),
  topic: text('topic').notNull(),
  entity: text('entity'),
  scenario: text('scenario'),
  domains: jsonb('domains').$type<string[]>(),
  agents: jsonb('agents').$type<string[]>(),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  status: text('status', { enum: ['pending', 'generating', 'complete', 'failed'] })
    .notNull()
    .default('pending'),
  briefingId: text('briefing_id'),
});

export const pulseEmailSubscriptionsTable = pgTable('pulse_email_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  email: text('email').notNull(),
  domains: jsonb('domains').$type<string[]>().notNull().default([]),
  status: text('status', { enum: ['active', 'paused', 'cancelled'] })
    .notNull()
    .default('active'),
  unsubscribeToken: text('unsubscribe_token').notNull().unique(),
  lastSentBriefingId: text('last_sent_briefing_id'),
  lastSentAt: timestamp('last_sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pulseSavedBriefingsTable = pgTable(
  'pulse_saved_briefings',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    briefingId: text('briefing_id').notNull(),
    savedAt: timestamp('saved_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('pulse_saved_briefings_user_briefing_unique').on(t.userId, t.briefingId)],
);

export const pulseWatchlistTable = pgTable(
  'pulse_watchlist',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    entityUri: text('entity_uri').notNull(),
    entityType: text('entity_type').notNull(),
    entityLabel: text('entity_label').notNull(),
    domain: text('domain').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    addedAt: timestamp('added_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('pulse_watchlist_user_entity_unique').on(t.userId, t.entityUri)],
);

export const pulseFollowUpsTable = pgTable('pulse_follow_ups', {
  id: serial('id').primaryKey(),
  followUpId: text('follow_up_id').notNull().unique(),
  briefingId: text('briefing_id').notNull(),
  sectionId: text('section_id'),
  userId: integer('user_id').notNull(),
  question: text('question').notNull(),
  answer: text('answer'),
  status: text('status', { enum: ['pending', 'answered', 'failed'] })
    .notNull()
    .default('pending'),
  provenance: jsonb('provenance').$type<Record<string, unknown>>(),
  askedAt: timestamp('asked_at').notNull().defaultNow(),
  answeredAt: timestamp('answered_at'),
});

export const pulsePushScheduleTable = pgTable(
  'pulse_push_schedule',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().unique(),
    enabled: boolean('enabled').notNull().default(true),
    deliveryHourUtc: integer('delivery_hour_utc').notNull().default(7),
    lastDeliveredAt: timestamp('last_delivered_at'),
    lastBriefingId: text('last_briefing_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
);

// Per-user generated personalized briefing narratives.
// Generated asynchronously from last-24h published sections scoped to the
// user's watchlist domains and entity labels. Cached per (userId, dateKey).
export const pulsePersonalizedNarrativesTable = pgTable(
  'pulse_personalized_narratives',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    dateKey: text('date_key').notNull(),
    sourceBriefingId: text('source_briefing_id'),
    narrative: text('narrative'),
    watchedDomains: jsonb('watched_domains').$type<string[]>().notNull().default([]),
    watchedEntityUris: jsonb('watched_entity_uris').$type<string[]>().notNull().default([]),
    filteredSectionCount: integer('filtered_section_count'),
    status: text('status', { enum: ['pending', 'ready', 'failed'] })
      .notNull()
      .default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('pulse_personalized_narratives_user_date_unique').on(t.userId, t.dateKey)],
);

export const pulseOrgPublicationsTable = pgTable(
  'pulse_org_publications',
  {
    id: serial('id').primaryKey(),
    publicationId: text('publication_id').notNull().unique(),
    briefingId: text('briefing_id').notNull(),
    domain: text('domain').notNull().default('consolidated'),
    channels: jsonb('channels').notNull().$type<string[]>().default([]),
    scheduleId: integer('schedule_id'),
    status: text('status', { enum: ['queued', 'in_progress', 'completed', 'failed', 'cancelled'] })
      .notNull()
      .default('queued'),
    totalRecipients: integer('total_recipients').notNull().default(0),
    deliveredCount: integer('delivered_count').notNull().default(0),
    failedCount: integer('failed_count').notNull().default(0),
    suppressedCount: integer('suppressed_count').notNull().default(0),
    publishedBy: integer('published_by'),
    audienceFilter: jsonb('audience_filter').$type<Record<string, unknown>>(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    enqueuedAt: timestamp('enqueued_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
);

export const pulseOrgPublicationDeliveriesTable = pgTable(
  'pulse_org_publication_deliveries',
  {
    id: serial('id').primaryKey(),
    publicationId: text('publication_id').notNull(),
    userId: integer('user_id').notNull(),
    channel: text('channel').notNull(),
    status: text('status', { enum: ['queued', 'delivered', 'failed', 'suppressed', 'retrying'] })
      .notNull()
      .default('queued'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    providerMessageId: text('provider_message_id'),
    suppressReason: text('suppress_reason'),
    deliveredAt: timestamp('delivered_at'),
    nextRetryAt: timestamp('next_retry_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('pulse_org_deliveries_pub_user_channel_unique').on(
      t.publicationId,
      t.userId,
      t.channel,
    ),
    index('pulse_org_deliveries_pub_status_idx').on(t.publicationId, t.status),
    index('pulse_org_deliveries_retry_idx').on(t.nextRetryAt),
  ],
);

export const pulseOrgSchedulesTable = pgTable('pulse_org_schedules', {
  id: serial('id').primaryKey(),
  scheduleId: text('schedule_id').notNull().unique(),
  orgId: integer('org_id'),
  domain: text('domain').notNull().default('consolidated'),
  channels: jsonb('channels').notNull().$type<string[]>().default([]),
  pinnedBriefingId: text('pinned_briefing_id'),
  frequency: text('frequency', {
    enum: ['daily', 'weekdays', 'weekly', 'monthly', 'custom'],
  }).notNull(),
  interval: integer('interval').notNull().default(1),
  weekdays: jsonb('weekdays').$type<number[]>().default([]),
  timeOfDay: text('time_of_day').notNull().default('09:00'),
  timezone: text('timezone').notNull().default('UTC'),
  paused: boolean('paused').notNull().default(false),
  nextRunAt: timestamp('next_run_at'),
  lastRunAt: timestamp('last_run_at'),
  createdBy: integer('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pulseOrgUserPreferencesTable = pgTable(
  'pulse_org_user_preferences',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    emailOptOut: boolean('email_opt_out').notNull().default(false),
    smsOptOut: boolean('sms_opt_out').notNull().default(false),
    slackDmOptOut: boolean('slack_dm_opt_out').notNull().default(false),
    pushOptOut: boolean('push_opt_out').notNull().default(false),
    unsubscribeToken: text('unsubscribe_token').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('pulse_org_user_prefs_user_unique').on(t.userId)],
);

export const pulseOrgChannelConfigsTable = pgTable(
  'pulse_org_channel_configs',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').notNull().unique(),
    slackWebhookUrl: text('slack_webhook_url'),
    slackChannel: text('slack_channel'),
    teamsWebhookUrl: text('teams_webhook_url'),
    smsSenderId: text('sms_sender_id'),
    outboundWebhookUrl: text('outbound_webhook_url'),
    outboundWebhookSecret: text('outbound_webhook_secret'),
    emailFromName: text('email_from_name'),
    emailFromAddress: text('email_from_address'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
);

export const pulseOrgAuditLogTable = pgTable('pulse_org_audit_log', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  userId: integer('user_id'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pulseExecBriefsTable = pgTable('pulse_exec_briefs', {
  id: text('id').primaryKey(),
  briefingId: text('briefing_id'),
  domain: text('domain').notNull(),
  status: text('status', { enum: ['published', 'draft', 'revision_required'] })
    .notNull()
    .default('draft'),
  headline: text('headline').notNull(),
  situation: text('situation').notNull(),
  autonomyTier: text('autonomy_tier').notNull(),
  confidence: numeric('confidence').notNull(),
  overallRisk: text('overall_risk').notNull(),
  verifierStatus: text('verifier_status', { enum: ['passed', 'revision_required', 'pending'] })
    .notNull()
    .default('pending'),
  verifierFeedback: text('verifier_feedback'),
  whatWeBelieve: jsonb('what_we_believe').notNull().$type<unknown[]>(),
  whyCitations: jsonb('why_citations').notNull().$type<unknown[]>(),
  whatWeRecommend: jsonb('what_we_recommend').notNull().$type<unknown[]>(),
  sourceTraceIds: jsonb('source_trace_ids').notNull().$type<string[]>().default([]),
  entityProvenance: jsonb('entity_provenance').notNull().$type<unknown[]>().default([]),
  sections: jsonb('sections').notNull().$type<unknown[]>().default([]),
  scheduled: boolean('scheduled').notNull().default(false),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
