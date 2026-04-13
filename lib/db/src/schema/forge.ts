import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  serial,
  index,
  uniqueIndex,
  bigserial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { usersTable } from "./auth";

// ─── Forge Revenue Engine ─────────────────────────────────────────────────────

export const forgeOnboarding = pgTable("forge_onboarding", {
  id: serial("id").primaryKey(),
  recordId: text("record_id").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  status: text("status", { enum: ["in_progress", "completed", "pending_review"] }).notNull().default("in_progress"),
  currentStep: integer("current_step").notNull().default(1),
  totalSteps: integer("total_steps").notNull().default(6),
  companyProfile: jsonb("company_profile"),
  domainInterests: jsonb("domain_interests").default([]),
  kycStatus: text("kyc_status", { enum: ["pending", "uploaded", "verified", "rejected"] }).notNull().default("pending"),
  kycDocuments: jsonb("kyc_documents").default([]),
  portfolioConfig: jsonb("portfolio_config"),
  teamInvitations: jsonb("team_invitations").default([]),
  billingSetup: jsonb("billing_setup"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("forge_onboarding_user_idx").on(t.userId),
  index("forge_onboarding_status_idx").on(t.status),
]);

export const forgeClientHealth = pgTable("forge_client_health", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  overallScore: real("overall_score").notNull().default(0),
  trend: text("trend", { enum: ["improving", "stable", "declining"] }).notNull().default("stable"),
  trendDelta: real("trend_delta").notNull().default(0),
  dimensions: jsonb("dimensions").notNull().default({}),
  riskLevel: text("risk_level", { enum: ["low", "medium", "high", "critical"] }).notNull().default("low"),
  churnProbability: real("churn_probability").notNull().default(0),
  daysSinceLastLogin: integer("days_since_last_login").notNull().default(0),
  reportsViewedLast30d: integer("reports_viewed_last_30d").notNull().default(0),
  featuresAdopted: integer("features_adopted").notNull().default(0),
  totalFeatures: integer("total_features").notNull().default(0),
  supportTicketsOpen: integer("support_tickets_open").notNull().default(0),
  npsScore: integer("nps_score"),
  recommendations: jsonb("recommendations").default([]),
  computedAt: timestamp("computed_at").notNull().defaultNow(),
}, (t) => [
  index("forge_client_health_risk_idx").on(t.riskLevel),
]);

export const forgeProposals = pgTable("forge_proposals", {
  id: serial("id").primaryKey(),
  proposalId: text("proposal_id").notNull().unique(),
  clientId: text("client_id").notNull(),
  title: text("title").notNull(),
  type: text("type", { enum: ["consulting", "advisory", "intelligence", "custom"] }).notNull().default("consulting"),
  status: text("status", { enum: ["draft", "sent", "viewed", "accepted", "declined", "expired"] }).notNull().default("draft"),
  executiveSummary: text("executive_summary"),
  services: jsonb("services").default([]),
  timeline: jsonb("timeline").default([]),
  pricing: jsonb("pricing").notNull().default({}),
  domains: jsonb("domains").default([]),
  validUntil: text("valid_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  respondedAt: timestamp("responded_at"),
}, (t) => [
  index("forge_proposals_client_idx").on(t.clientId),
  index("forge_proposals_status_idx").on(t.status),
]);

export const forgeIntelligencePackages = pgTable("forge_intelligence_packages", {
  id: serial("id").primaryKey(),
  packageId: text("package_id").notNull().unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  domains: jsonb("domains").default([]),
  tier: text("tier", { enum: ["starter", "professional", "enterprise"] }).notNull().default("professional"),
  features: jsonb("features").default([]),
  deliverables: jsonb("deliverables").default([]),
  pricing: jsonb("pricing").notNull().default({}),
  agentWorkflows: jsonb("agent_workflows").default([]),
  usageLimits: jsonb("usage_limits").default([]),
  subscriberCount: integer("subscriber_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("forge_packages_tier_idx").on(t.tier),
  index("forge_packages_active_idx").on(t.isActive),
]);

export const forgeCommunications = pgTable("forge_communications", {
  id: serial("id").primaryKey(),
  commId: text("comm_id").notNull().unique(),
  clientId: text("client_id").notNull(),
  type: text("type", { enum: ["briefing", "alert", "milestone", "newsletter", "report"] }).notNull(),
  subject: text("subject").notNull(),
  summary: text("summary"),
  body: text("body"),
  domain: text("domain").notNull().default("general"),
  priority: text("priority", { enum: ["urgent", "high", "normal", "low"] }).notNull().default("normal"),
  status: text("status", { enum: ["scheduled", "sent", "read", "archived"] }).notNull().default("scheduled"),
  metadata: jsonb("metadata").default({}),
  scheduledAt: timestamp("scheduled_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
}, (t) => [
  index("forge_comms_client_idx").on(t.clientId),
  index("forge_comms_status_idx").on(t.status),
  index("forge_comms_domain_idx").on(t.domain),
]);

export const forgeCommunicationPreferences = pgTable("forge_communication_preferences", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  briefingFrequency: text("briefing_frequency", { enum: ["daily", "weekly", "monthly"] }).notNull().default("weekly"),
  alertThreshold: text("alert_threshold", { enum: ["all", "high", "critical"] }).notNull().default("high"),
  newsletterOptIn: boolean("newsletter_opt_in").notNull().default(true),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  inPortalNotifications: boolean("in_portal_notifications").notNull().default(true),
  domainPreferences: jsonb("domain_preferences").default({}),
  quietHoursStart: text("quiet_hours_start"),
  quietHoursEnd: text("quiet_hours_end"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Forge Portal ─────────────────────────────────────────────────────────────

export const forgePortalClients = pgTable("forge_portal_clients", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id).unique(),
  name: text("name").notNull(),
  companyName: text("company_name").notNull(),
  email: text("email").notNull(),
  relationship: text("relationship"),
  memberSince: text("member_since"),
  tier: text("tier", { enum: ["platinum", "gold", "silver"] }).notNull().default("silver"),
  domains: jsonb("domains").default([]),
  avatarInitials: text("avatar_initials"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("forge_portal_clients_user_idx").on(t.userId),
]);

export const forgePortfolioHoldings = pgTable("forge_portfolio_holdings", {
  id: serial("id").primaryKey(),
  holdingId: text("holding_id").notNull().unique(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  domain: text("domain", { enum: ["vessels", "terra", "legal", "security"] }).notNull(),
  capitalDeployed: real("capital_deployed").notNull().default(0),
  currentValue: real("current_value").notNull().default(0),
  irr: text("irr"),
  vintage: text("vintage"),
  status: text("status", { enum: ["active", "exited", "pending"] }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("forge_holdings_client_idx").on(t.clientId),
  index("forge_holdings_status_idx").on(t.status),
]);

export const forgeLegalMatters = pgTable("forge_legal_matters", {
  id: serial("id").primaryKey(),
  matterId: text("matter_id").notNull().unique(),
  clientId: text("client_id").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  status: text("status", { enum: ["active", "pending", "resolved", "on-hold"] }).notNull().default("active"),
  nextDeadline: text("next_deadline"),
  recoveryProgress: integer("recovery_progress").notNull().default(0),
  leadAttorney: text("lead_attorney"),
  openedDate: text("opened_date"),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("forge_matters_client_idx").on(t.clientId),
  index("forge_matters_status_idx").on(t.status),
]);

export const forgePortalAssets = pgTable("forge_portal_assets", {
  id: serial("id").primaryKey(),
  assetId: text("asset_id").notNull().unique(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  domain: text("domain", { enum: ["vessels", "terra"] }).notNull(),
  type: text("type").notNull(),
  status: text("status", { enum: ["active", "docked", "transit", "listed", "under-contract"] }).notNull().default("active"),
  value: text("value"),
  lastUpdate: text("last_update"),
  location: text("location"),
  alert: text("alert"),
  notificationThreshold: integer("notification_threshold"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("forge_assets_client_idx").on(t.clientId),
  index("forge_assets_domain_idx").on(t.domain),
]);

export const forgePortalDocuments = pgTable("forge_portal_documents", {
  id: serial("id").primaryKey(),
  docId: text("doc_id").notNull().unique(),
  clientId: text("client_id").notNull(),
  title: text("title").notNull(),
  domain: text("domain").notNull(),
  type: text("type", { enum: ["report", "filing", "contract", "briefing", "invoice"] }).notNull(),
  uploadedBy: text("uploaded_by"),
  uploadedDate: text("uploaded_date"),
  size: text("size"),
  version: text("version").default("1.0"),
  accessLog: jsonb("access_log").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("forge_docs_client_idx").on(t.clientId),
  index("forge_docs_domain_idx").on(t.domain),
  index("forge_docs_type_idx").on(t.type),
]);

export const forgeMessageThreads = pgTable("forge_message_threads", {
  id: serial("id").primaryKey(),
  threadId: text("thread_id").notNull().unique(),
  clientId: text("client_id").notNull(),
  subject: text("subject").notNull(),
  status: text("status", { enum: ["open", "resolved", "archived"] }).notNull().default("open"),
  participants: jsonb("participants").default([]),
  messages: jsonb("messages").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("forge_threads_client_idx").on(t.clientId),
  index("forge_threads_status_idx").on(t.status),
]);

// ─── Types ────────────────────────────────────────────────────────────────────

export type ForgeOnboarding = typeof forgeOnboarding.$inferSelect;
export type InsertForgeOnboarding = typeof forgeOnboarding.$inferInsert;
export type ForgeClientHealth = typeof forgeClientHealth.$inferSelect;
export type ForgeProposal = typeof forgeProposals.$inferSelect;
export type ForgePackage = typeof forgeIntelligencePackages.$inferSelect;
export type ForgeCommunication = typeof forgeCommunications.$inferSelect;
export type ForgeCommPrefs = typeof forgeCommunicationPreferences.$inferSelect;
export type ForgePortalClient = typeof forgePortalClients.$inferSelect;
export type ForgeHolding = typeof forgePortfolioHoldings.$inferSelect;
export type ForgeMatter = typeof forgeLegalMatters.$inferSelect;
export type ForgeAsset = typeof forgePortalAssets.$inferSelect;
export type ForgeDoc = typeof forgePortalDocuments.$inferSelect;
export type ForgeThread = typeof forgeMessageThreads.$inferSelect;
