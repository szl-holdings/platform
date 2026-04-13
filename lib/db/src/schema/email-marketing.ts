import { pgTable, text, serial, timestamp, integer, boolean, jsonb, index, numeric } from "drizzle-orm/pg-core";
import { dosLeadsTable } from "./distribution-os";

export const dosSessionsTable = pgTable("dos_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  anonymousId: text("anonymous_id"),
  referrer: text("referrer"),
  referrerChain: jsonb("referrer_chain").$type<string[]>().default([]),
  entryPage: text("entry_page"),
  exitPage: text("exit_page"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  userAgent: text("user_agent"),
  app: text("app"),
  deviceType: text("device_type", { enum: ["desktop", "mobile", "tablet", "unknown"] }).notNull().default("unknown"),
  country: text("country"),
  city: text("city"),
  pageSequence: jsonb("page_sequence").$type<Array<{ path: string; ts: number; durationMs?: number }>>().default([]),
  eventCount: integer("event_count").notNull().default(0),
  durationMs: integer("duration_ms"),
  didConvert: boolean("did_convert").notNull().default(false),
  conversionEvent: text("conversion_event"),
  pageCount: integer("page_count").notNull().default(1),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
}, (table) => [
  index("dos_sessions_session_id_idx").on(table.sessionId),
  index("dos_sessions_started_at_idx").on(table.startedAt),
  index("dos_sessions_utm_source_idx").on(table.utmSource),
]);

export const dosEmailCampaignsTable = pgTable("dos_email_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  subjectLineA: text("subject_line_a").notNull(),
  subjectLineB: text("subject_line_b"),
  htmlBody: text("html_body").notNull(),
  plainTextBody: text("plain_text_body"),
  fromName: text("from_name").notNull().default("SZL Holdings"),
  fromEmail: text("from_email").notNull().default("inquiries@szlholdings.com"),
  replyToEmail: text("reply_to_email"),
  status: text("status", { enum: ["draft", "scheduled", "sending", "sent", "paused", "cancelled"] }).notNull().default("draft"),
  sendgridCampaignId: text("sendgrid_campaign_id"),
  sendgridListId: text("sendgrid_list_id"),
  segmentFilters: jsonb("segment_filters").$type<{
    stage?: string[];
    interestArea?: string[];
    source?: string[];
    scoreMin?: number;
    scoreMax?: number;
    engagementLevel?: string;
    tags?: string[];
  }>().default({}),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  bounceCount: integer("bounce_count").notNull().default(0),
  unsubscribeCount: integer("unsubscribe_count").notNull().default(0),
  spamCount: integer("spam_count").notNull().default(0),
  openRate: numeric("open_rate", { precision: 5, scale: 2 }),
  clickRate: numeric("click_rate", { precision: 5, scale: 2 }),
  revenueAttributed: numeric("revenue_attributed", { precision: 12, scale: 2 }),
  winnerSubjectLine: text("winner_subject_line", { enum: ["a", "b"] }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("dos_email_campaigns_status_idx").on(table.status),
  index("dos_email_campaigns_sent_at_idx").on(table.sentAt),
]);

export const dosDripSequencesTable = pgTable("dos_drip_sequences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  triggerEvent: text("trigger_event", {
    enum: ["signup", "demo_request", "pricing_visit", "article_view", "cta_click", "manual"]
  }).notNull().default("signup"),
  triggerConditions: jsonb("trigger_conditions").$type<Record<string, unknown>>().default({}),
  status: text("status", { enum: ["draft", "active", "paused", "archived"] }).notNull().default("draft"),
  totalEnrolled: integer("total_enrolled").notNull().default(0),
  totalCompleted: integer("total_completed").notNull().default(0),
  totalUnsubscribed: integer("total_unsubscribed").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dosDripStepsTable = pgTable("dos_drip_steps", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").notNull().references(() => dosDripSequencesTable.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  name: text("name").notNull(),
  subjectLine: text("subject_line").notNull(),
  htmlBody: text("html_body").notNull(),
  plainTextBody: text("plain_text_body"),
  delayDays: integer("delay_days").notNull().default(0),
  delayHours: integer("delay_hours").notNull().default(0),
  condition: text("condition", { enum: ["always", "opened_previous", "clicked_previous", "not_opened_previous", "not_clicked_previous"] }).notNull().default("always"),
  isActive: boolean("is_active").notNull().default(true),
  sentCount: integer("sent_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("dos_drip_steps_sequence_idx").on(table.sequenceId),
]);

export const dosDripEnrollmentsTable = pgTable("dos_drip_enrollments", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").notNull().references(() => dosDripSequencesTable.id, { onDelete: "cascade" }),
  leadId: integer("lead_id").references(() => dosLeadsTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  currentStep: integer("current_step").notNull().default(0),
  status: text("status", { enum: ["active", "paused", "completed", "unsubscribed", "bounced"] }).notNull().default("active"),
  lastEmailSentAt: timestamp("last_email_sent_at"),
  nextEmailDue: timestamp("next_email_due"),
  lastOpenedAt: timestamp("last_opened_at"),
  lastClickedAt: timestamp("last_clicked_at"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("dos_drip_enrollments_sequence_idx").on(table.sequenceId),
  index("dos_drip_enrollments_email_idx").on(table.email),
  index("dos_drip_enrollments_next_due_idx").on(table.nextEmailDue),
]);

export const dosEmailPreferencesTable = pgTable("dos_email_preferences", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  globalUnsubscribe: boolean("global_unsubscribe").notNull().default(false),
  marketingEmails: boolean("marketing_emails").notNull().default(true),
  transactionalEmails: boolean("transactional_emails").notNull().default(true),
  newsletterEmails: boolean("newsletter_emails").notNull().default(true),
  productUpdates: boolean("product_updates").notNull().default(true),
  researchReports: boolean("research_reports").notNull().default(true),
  frequency: text("frequency", { enum: ["daily", "weekly", "monthly", "never"] }).notNull().default("weekly"),
  topics: jsonb("topics").$type<string[]>().default([]),
  unsubscribeToken: text("unsubscribe_token").notNull(),
  dataExportRequestedAt: timestamp("data_export_requested_at"),
  dataDeletionRequestedAt: timestamp("data_deletion_requested_at"),
  gdprConsentGivenAt: timestamp("gdpr_consent_given_at"),
  gdprConsentVersion: text("gdpr_consent_version"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("dos_email_preferences_email_idx").on(table.email),
  index("dos_email_preferences_token_idx").on(table.unsubscribeToken),
]);

export const dosCookieConsentsTable = pgTable("dos_cookie_consents", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),
  anonymousId: text("anonymous_id"),
  analyticsConsent: boolean("analytics_consent").notNull().default(false),
  marketingConsent: boolean("marketing_consent").notNull().default(false),
  functionalConsent: boolean("functional_consent").notNull().default(true),
  consentVersion: text("consent_version").notNull().default("1.0"),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("dos_cookie_consents_session_idx").on(table.sessionId),
]);

export const dosAudienceSegmentsTable = pgTable("dos_audience_segments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  filters: jsonb("filters").$type<{
    stage?: string[];
    interestArea?: string[];
    source?: string[];
    scoreMin?: number;
    scoreMax?: number;
    tags?: string[];
    engagementLevel?: string;
    pagesVisited?: string[];
    events?: string[];
    createdAfter?: string;
    createdBefore?: string;
  }>().notNull().default({}),
  memberCount: integer("member_count").notNull().default(0),
  sendgridListId: text("sendgrid_list_id"),
  lastSyncedAt: timestamp("last_synced_at"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dosFunnelDefinitionsTable = pgTable("dos_funnel_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").$type<Array<{ name: string; event: string; path?: string }>>().notNull().default([]),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
