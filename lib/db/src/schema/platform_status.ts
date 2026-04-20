import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const platformStatusChecks = pgTable('platform_status_checks', {
  id: serial('id').primaryKey(),
  serviceId: text('service_id').notNull(),
  status: text('status').notNull().default('operational'),
  latencyMs: integer('latency_ms'),
  checkedAt: timestamp('checked_at').notNull().defaultNow(),
});

export const platformPublicIncidents = pgTable('platform_incidents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  status: text('status').notNull().default('investigating'),
  severity: text('severity').notNull().default('minor'),
  affectedServices: text('affected_services').array().notNull().default([]),
  description: text('description').notNull(),
  assignee: text('assignee'),
  postmortem: text('postmortem'),
  resolvedAt: timestamp('resolved_at'),
  postedBy: text('posted_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const platformIncidentUpdates = pgTable('platform_incident_updates', {
  id: serial('id').primaryKey(),
  incidentId: integer('incident_id')
    .notNull()
    .references(() => platformPublicIncidents.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  status: text('status').notNull(),
  author: text('author'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const platformStatusSubscriptions = pgTable('platform_status_subscriptions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  subscribedAt: timestamp('subscribed_at').notNull().defaultNow(),
  active: boolean('active').notNull().default(true),
});

export const platformContactRequests = pgTable('platform_contact_requests', {
  id: serial('id').primaryKey(),
  type: text('type').notNull().default('general'),
  app: text('app').notNull().default('unknown'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailHash: text('email_hash'),
  company: text('company'),
  role: text('role'),
  message: text('message'),
  metadata: jsonb('metadata'),
  status: text('status').notNull().default('new'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const platformAlertRules = pgTable('platform_alert_rules', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  metricName: text('metric_name').notNull(),
  condition: text('condition').notNull().default('gt'),
  threshold: real('threshold').notNull(),
  windowMinutes: integer('window_minutes').notNull().default(5),
  severity: text('severity').notNull().default('warning'),
  enabled: boolean('enabled').notNull().default(true),
  notifyInApp: boolean('notify_in_app').notNull().default(true),
  notifyEmail: boolean('notify_email').notNull().default(false),
  emailRecipients: text('email_recipients').array().notNull().default([]),
  runbookId: integer('runbook_id'),
  lastEvaluatedAt: timestamp('last_evaluated_at'),
  lastFiredAt: timestamp('last_fired_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const platformAlertEvents = pgTable('platform_alert_events', {
  id: serial('id').primaryKey(),
  ruleId: integer('rule_id')
    .notNull()
    .references(() => platformAlertRules.id, { onDelete: 'cascade' }),
  ruleName: text('rule_name').notNull(),
  severity: text('severity').notNull(),
  metricName: text('metric_name').notNull(),
  metricValue: real('metric_value').notNull(),
  threshold: real('threshold').notNull(),
  condition: text('condition').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('firing'),
  resolvedAt: timestamp('resolved_at'),
  acknowledgedAt: timestamp('acknowledged_at'),
  acknowledgedBy: text('acknowledged_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const platformRunbooks = pgTable('platform_runbooks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull().default('general'),
  content: text('content').notNull(),
  tags: text('tags').array().notNull().default([]),
  alertRuleIds: integer('alert_rule_ids').array().notNull().default([]),
  incidentCategories: text('incident_categories').array().notNull().default([]),
  affectedServices: text('affected_services').array().notNull().default([]),
  severity: text('severity').notNull().default('any'),
  author: text('author'),
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const platformServiceDeps = pgTable('platform_service_deps', {
  id: serial('id').primaryKey(),
  sourceId: text('source_id').notNull(),
  sourceName: text('source_name').notNull(),
  sourceCategory: text('source_category').notNull().default('service'),
  targetId: text('target_id').notNull(),
  targetName: text('target_name').notNull(),
  targetCategory: text('target_category').notNull().default('service'),
  depType: text('dep_type').notNull().default('depends_on'),
  isCritical: boolean('is_critical').notNull().default(false),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
