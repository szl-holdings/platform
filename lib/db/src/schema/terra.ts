import {
  pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb, index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const terraBrokeragesTable = pgTable("terra_brokerages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  licenseNumber: text("license_number"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  specialty: text("specialty"),
  headCount: integer("head_count").notNull().default(1),
  activeListings: integer("active_listings").notNull().default(0),
  closedVolumeLtm: numeric("closed_volume_ltm", { precision: 16, scale: 2 }),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_brokerage_slug_idx").on(t.slug),
  index("terra_brokerage_status_idx").on(t.status),
  index("terra_brokerage_created_idx").on(t.createdAt),
]);

export const terraAgentsTable = pgTable("terra_agents", {
  id: serial("id").primaryKey(),
  brokerageId: integer("brokerage_id").references(() => terraBrokeragesTable.id, { onDelete: "set null" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  licenseNumber: text("license_number"),
  specialty: text("specialty", { enum: ["office", "retail", "industrial", "multifamily", "mixed-use", "land", "residential"] }).notNull().default("office"),
  status: text("status", { enum: ["active", "inactive", "on_leave"] }).notNull().default("active"),
  activeListings: integer("active_listings").notNull().default(0),
  closedDealsLtm: integer("closed_deals_ltm").notNull().default(0),
  closeRatePct: numeric("close_rate_pct", { precision: 5, scale: 2 }),
  avgDaysToContract: integer("avg_days_to_contract"),
  inquiryConversionPct: numeric("inquiry_conversion_pct", { precision: 5, scale: 2 }),
  lastActivityAt: timestamp("last_activity_at"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_agent_brokerage_idx").on(t.brokerageId),
  index("terra_agent_status_idx").on(t.status),
  index("terra_agent_specialty_idx").on(t.specialty),
  index("terra_agent_created_idx").on(t.createdAt),
]);

export const terraPropertiesTable = pgTable("terra_properties", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  submarket: text("submarket"),
  propertyType: text("property_type", { enum: ["office", "retail", "industrial", "multifamily", "mixed-use", "land", "hospitality", "other"] }).notNull(),
  sqft: integer("sqft"),
  yearBuilt: integer("year_built"),
  floors: integer("floors"),
  units: integer("units"),
  parkingSpaces: integer("parking_spaces"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  assessedValue: numeric("assessed_value", { precision: 16, scale: 2 }),
  zoning: text("zoning"),
  ownerName: text("owner_name"),
  ownerType: text("owner_type", { enum: ["individual", "llc", "trust", "corporate", "reit", "unknown"] }).notNull().default("unknown"),
  isActive: boolean("is_active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_property_type_idx").on(t.propertyType),
  index("terra_property_submarket_idx").on(t.submarket),
  index("terra_property_zip_idx").on(t.zipCode),
  index("terra_property_active_idx").on(t.isActive),
  index("terra_property_owner_idx").on(t.ownerName),
  index("terra_property_owner_type_idx").on(t.ownerType),
  index("terra_property_created_idx").on(t.createdAt),
]);

export const terraListingsTable = pgTable("terra_listings", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  propertyId: integer("property_id").references(() => terraPropertiesTable.id, { onDelete: "cascade" }),
  agentId: integer("agent_id").references(() => terraAgentsTable.id, { onDelete: "set null" }),
  brokerageId: integer("brokerage_id").references(() => terraBrokeragesTable.id, { onDelete: "set null" }),
  status: text("status", { enum: ["active", "pending", "under_contract", "closed", "expired", "withdrawn"] }).notNull().default("active"),
  listPrice: numeric("list_price", { precision: 16, scale: 2 }).notNull(),
  pricePerSqft: numeric("price_per_sqft", { precision: 10, scale: 2 }),
  originalListPrice: numeric("original_list_price", { precision: 16, scale: 2 }),
  capRate: numeric("cap_rate", { precision: 5, scale: 2 }),
  noi: numeric("noi", { precision: 14, scale: 2 }),
  daysOnMarket: integer("days_on_market").notNull().default(0),
  inquiryCount: integer("inquiry_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  priceReductions: integer("price_reductions").notNull().default(0),
  listDate: text("list_date").notNull(),
  expirationDate: text("expiration_date"),
  closedDate: text("closed_date"),
  closedPrice: numeric("closed_price", { precision: 16, scale: 2 }),
  opportunityScore: integer("opportunity_score").notNull().default(50),
  marketNotes: text("market_notes"),
  priceHistory: jsonb("price_history").$type<Array<{ date: string; price: number; changeType: string }>>().notNull().default([]),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_listing_status_idx").on(t.status),
  index("terra_listing_agent_idx").on(t.agentId),
  index("terra_listing_brokerage_idx").on(t.brokerageId),
  index("terra_listing_property_idx").on(t.propertyId),
  index("terra_listing_created_idx").on(t.createdAt),
  index("terra_listing_score_idx").on(t.opportunityScore),
]);

export const terraInquiriesTable = pgTable("terra_inquiries", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => terraListingsTable.id, { onDelete: "set null" }),
  assignedAgentId: integer("assigned_agent_id").references(() => terraAgentsTable.id, { onDelete: "set null" }),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email"),
  buyerPhone: text("buyer_phone"),
  buyerType: text("buyer_type", { enum: ["investor", "owner_occupant", "developer", "family_office", "reit", "unknown"] }).notNull().default("unknown"),
  financingStatus: text("financing_status", { enum: ["cash", "pre_approved", "seeking_financing", "unknown"] }).notNull().default("unknown"),
  qualificationScore: integer("qualification_score").notNull().default(50),
  status: text("status", { enum: ["new", "contacted", "qualified", "showing_scheduled", "offer_submitted", "converted", "lost", "do_not_contact"] }).notNull().default("new"),
  source: text("source", { enum: ["web", "email", "phone", "referral", "portal", "direct", "other"] }).notNull().default("other"),
  message: text("message"),
  routingReason: text("routing_reason"),
  lastContactAt: timestamp("last_contact_at"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_inquiry_listing_idx").on(t.listingId),
  index("terra_inquiry_agent_idx").on(t.assignedAgentId),
  index("terra_inquiry_status_idx").on(t.status),
  index("terra_inquiry_created_idx").on(t.createdAt),
  index("terra_inquiry_score_idx").on(t.qualificationScore),
]);

export const terraTransactionsTable = pgTable("terra_transactions", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => terraListingsTable.id, { onDelete: "set null" }),
  propertyId: integer("property_id").references(() => terraPropertiesTable.id, { onDelete: "set null" }),
  agentId: integer("agent_id").references(() => terraAgentsTable.id, { onDelete: "set null" }),
  brokerageId: integer("brokerage_id").references(() => terraBrokeragesTable.id, { onDelete: "set null" }),
  buyerName: text("buyer_name"),
  sellerName: text("seller_name"),
  salePrice: numeric("sale_price", { precision: 16, scale: 2 }).notNull(),
  listPrice: numeric("list_price", { precision: 16, scale: 2 }),
  commission: numeric("commission", { precision: 14, scale: 2 }),
  commissionPct: numeric("commission_pct", { precision: 5, scale: 2 }),
  daysOnMarket: integer("days_on_market"),
  daysToClose: integer("days_to_close"),
  closedDate: text("closed_date").notNull(),
  financingType: text("financing_type", { enum: ["cash", "conventional", "bridge", "cmbs", "life_co", "agency", "other"] }).notNull().default("conventional"),
  status: text("status", { enum: ["completed", "fallen_through", "pending_recording"] }).notNull().default("completed"),
  notes: text("notes"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("terra_transaction_agent_idx").on(t.agentId),
  index("terra_transaction_brokerage_idx").on(t.brokerageId),
  index("terra_transaction_property_idx").on(t.propertyId),
  index("terra_transaction_closed_idx").on(t.closedDate),
  index("terra_transaction_status_idx").on(t.status),
]);

export const terraDistressPropertiesTable = pgTable("terra_distress_properties", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  address: text("address").notNull(),
  borough: text("borough", { enum: ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] }).notNull(),
  county: text("county").notNull(),
  zipCode: text("zip_code"),
  propertyType: text("property_type", { enum: ["multifamily", "single-family", "condo", "commercial", "mixed-use", "vacant-land", "unknown"] }).notNull().default("unknown"),
  distressType: text("distress_type", { enum: ["pre-foreclosure", "foreclosure", "auction", "reo", "tax-lien", "expired-listing"] }).notNull(),
  stage: text("stage").notNull(),
  estimatedValue: numeric("estimated_value", { precision: 14, scale: 2 }).notNull(),
  debtAmount: numeric("debt_amount", { precision: 14, scale: 2 }),
  lienAmount: numeric("lien_amount", { precision: 14, scale: 2 }),
  auctionDate: text("auction_date"),
  filingDate: text("filing_date").notNull(),
  lastActivityDate: text("last_activity_date").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerType: text("owner_type", { enum: ["individual", "llc", "trust", "corporate"] }).notNull(),
  opportunityScore: integer("opportunity_score").notNull().default(50),
  confidenceLevel: text("confidence_level", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  scoreRationale: text("score_rationale").notNull().default(""),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  sqft: integer("sqft"),
  yearBuilt: integer("year_built"),
  beds: integer("beds"),
  baths: integer("baths"),
  daysInDistress: integer("days_in_distress").notNull().default(0),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  timeline: jsonb("timeline").$type<Array<{ date: string; type: string; description: string }>>().notNull().default([]),
  priceHistory: jsonb("price_history").$type<Array<{ date: string; price: number }>>(),
  connectorSource: text("connector_source").notNull().default(""),
  notes: text("notes"),
  linkedDealId: text("linked_deal_id"),
  rawData: jsonb("raw_data"),
  ingestSource: text("ingest_source", { enum: ["seed", "csv_upload", "nyc_open_data", "manual"] }).notNull().default("seed"),
  ingestRunId: integer("ingest_run_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_distress_borough_idx").on(t.borough),
  index("terra_distress_zip_idx").on(t.zipCode),
  index("terra_distress_type_idx").on(t.distressType),
  index("terra_distress_score_idx").on(t.opportunityScore),
  index("terra_distress_active_idx").on(t.isActive),
  index("terra_distress_auction_idx").on(t.auctionDate),
]);

export const terraDistressAlertsTable = pgTable("terra_distress_alerts", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  propertyId: integer("property_id").references(() => terraDistressPropertiesTable.id, { onDelete: "cascade" }),
  propertyExternalId: text("property_external_id"),
  alertType: text("alert_type", { enum: ["auction", "foreclosure", "lien", "reo", "signal", "price_drop"] }).notNull(),
  message: text("message").notNull(),
  severity: text("severity", { enum: ["critical", "high", "medium", "low", "info"] }).notNull().default("medium"),
  borough: text("borough"),
  zipCode: text("zip_code"),
  isRead: boolean("is_read").notNull().default(false),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
}, (t) => [
  index("terra_alert_property_idx").on(t.propertyId),
  index("terra_alert_severity_idx").on(t.severity),
  index("terra_alert_type_idx").on(t.alertType),
  index("terra_alert_borough_idx").on(t.borough),
]);

export const terraIngestionRunsTable = pgTable("terra_ingestion_runs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  status: text("status", { enum: ["running", "completed", "failed", "partial"] }).notNull().default("running"),
  recordsFetched: integer("records_fetched").notNull().default(0),
  recordsInserted: integer("records_inserted").notNull().default(0),
  recordsSkipped: integer("records_skipped").notNull().default(0),
  recordsFailed: integer("records_failed").notNull().default(0),
  alertsGenerated: integer("alerts_generated").notNull().default(0),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (t) => [
  index("terra_ingestion_source_idx").on(t.source),
  index("terra_ingestion_status_idx").on(t.status),
]);

export const terraLeadsTable = pgTable("terra_leads", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  type: text("type", { enum: ["buyer", "seller", "investor", "both"] }).notNull().default("buyer"),
  source: text("source", { enum: ["distress-engine", "referral", "website", "zillow", "realtor", "open-house", "social", "cold-call", "past-client", "csv-import", "manual"] }).notNull().default("manual"),
  stage: text("stage", { enum: ["new", "engaged", "nurtured", "hot", "inactive", "converted"] }).notNull().default("new"),
  score: integer("score").notNull().default(50),
  conversionProbability: numeric("conversion_probability", { precision: 5, scale: 4 }).notNull().default("0.5"),
  ownerUserId: integer("owner_user_id"),
  ownerName: text("owner_name"),
  assignedDate: text("assigned_date"),
  lastContact: text("last_contact"),
  nextFollowUp: text("next_follow_up"),
  distressPropertyId: integer("distress_property_id").references(() => terraDistressPropertiesTable.id, { onDelete: "set null" }),
  distressPropertyExternalId: text("distress_property_external_id"),
  linkedDealId: integer("linked_deal_id"),
  budget: jsonb("budget").$type<{ min: number; max: number } | null>(),
  desiredAreas: jsonb("desired_areas").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  timeline: jsonb("timeline").$type<Array<{ date: string; event: string; type: string }>>().notNull().default([]),
  nextAction: text("next_action"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_leads_stage_idx").on(t.stage),
  index("terra_leads_source_idx").on(t.source),
  index("terra_leads_score_idx").on(t.score),
  index("terra_leads_active_idx").on(t.isActive),
  index("terra_leads_distress_idx").on(t.distressPropertyId),
]);

export const terraDealsTable = pgTable("terra_deals", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  address: text("address").notNull(),
  borough: text("borough"),
  county: text("county"),
  zipCode: text("zip_code"),
  stage: text("stage", {
    enum: ["lead", "qualified", "showing", "offer", "negotiation", "accepted", "inspection", "financing", "under-contract", "clear-to-close", "closed", "lost"]
  }).notNull().default("lead"),
  type: text("type", { enum: ["acquisition", "disposition", "assignment", "wholesale"] }).notNull().default("acquisition"),
  price: numeric("price", { precision: 14, scale: 2 }),
  askingPrice: numeric("asking_price", { precision: 14, scale: 2 }),
  arv: numeric("arv", { precision: 14, scale: 2 }),
  probability: integer("probability").notNull().default(25),
  riskLevel: text("risk_level", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  ownerUserId: integer("owner_user_id"),
  ownerName: text("owner_name"),
  clientName: text("client_name"),
  distressPropertyId: integer("distress_property_id").references(() => terraDistressPropertiesTable.id, { onDelete: "set null" }),
  distressPropertyExternalId: text("distress_property_external_id"),
  leadId: integer("lead_id").references(() => terraLeadsTable.id, { onDelete: "set null" }),
  stageEnteredAt: timestamp("stage_entered_at").notNull().defaultNow(),
  estimatedCloseDate: text("estimated_close_date"),
  actualCloseDate: text("actual_close_date"),
  nextAction: text("next_action"),
  notes: text("notes"),
  timeline: jsonb("timeline").$type<Array<{ date: string; event: string; type: string; userId?: number }>>().notNull().default([]),
  documents: jsonb("documents").$type<Array<{ name: string; status: string; url?: string }>>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_deals_stage_idx").on(t.stage),
  index("terra_deals_active_idx").on(t.isActive),
  index("terra_deals_distress_idx").on(t.distressPropertyId),
  index("terra_deals_lead_idx").on(t.leadId),
]);

export const terraSavedOpportunitiesTable = pgTable("terra_saved_opportunities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  distressPropertyId: integer("distress_property_id").notNull().references(() => terraDistressPropertiesTable.id, { onDelete: "cascade" }),
  note: text("note"),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
}, (t) => [
  index("terra_saved_user_idx").on(t.userId),
  index("terra_saved_property_idx").on(t.distressPropertyId),
]);

export const insertTerraDistressPropertySchema = createInsertSchema(terraDistressPropertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraDistressProperty = z.infer<typeof insertTerraDistressPropertySchema>;
export type TerraDistressProperty = typeof terraDistressPropertiesTable.$inferSelect;

export const insertTerraDistressAlertSchema = createInsertSchema(terraDistressAlertsTable).omit({ id: true });
export type InsertTerraDistressAlert = z.infer<typeof insertTerraDistressAlertSchema>;
export type TerraDistressAlert = typeof terraDistressAlertsTable.$inferSelect;

export const insertTerraIngestionRunSchema = createInsertSchema(terraIngestionRunsTable).omit({ id: true, startedAt: true });
export type InsertTerraIngestionRun = z.infer<typeof insertTerraIngestionRunSchema>;
export type TerraIngestionRun = typeof terraIngestionRunsTable.$inferSelect;

export const insertTerraBrokerageSchema = createInsertSchema(terraBrokeragesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraBrokerage = z.infer<typeof insertTerraBrokerageSchema>;
export type TerraBrokerage = typeof terraBrokeragesTable.$inferSelect;

export const insertTerraAgentSchema = createInsertSchema(terraAgentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraAgent = z.infer<typeof insertTerraAgentSchema>;
export type TerraAgent = typeof terraAgentsTable.$inferSelect;

export const insertTerraPropertySchema = createInsertSchema(terraPropertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraProperty = z.infer<typeof insertTerraPropertySchema>;
export type TerraProperty = typeof terraPropertiesTable.$inferSelect;

export const insertTerraListingSchema = createInsertSchema(terraListingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraListing = z.infer<typeof insertTerraListingSchema>;
export type TerraListing = typeof terraListingsTable.$inferSelect;

export const insertTerraInquirySchema = createInsertSchema(terraInquiriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraInquiry = z.infer<typeof insertTerraInquirySchema>;
export type TerraInquiry = typeof terraInquiriesTable.$inferSelect;

export const insertTerraTransactionSchema = createInsertSchema(terraTransactionsTable).omit({ id: true, createdAt: true });
export type InsertTerraTransaction = z.infer<typeof insertTerraTransactionSchema>;
export type TerraTransaction = typeof terraTransactionsTable.$inferSelect;

export const insertTerraLeadSchema = createInsertSchema(terraLeadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraLead = z.infer<typeof insertTerraLeadSchema>;
export type TerraLead = typeof terraLeadsTable.$inferSelect;

export const insertTerraDealSchema = createInsertSchema(terraDealsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraDeal = z.infer<typeof insertTerraDealSchema>;
export type TerraDeal = typeof terraDealsTable.$inferSelect;

export const insertTerraSavedOpportunitySchema = createInsertSchema(terraSavedOpportunitiesTable).omit({ id: true, savedAt: true });
export type InsertTerraSavedOpportunity = z.infer<typeof insertTerraSavedOpportunitySchema>;
export type TerraSavedOpportunity = typeof terraSavedOpportunitiesTable.$inferSelect;

export const terraCovenantsTable = pgTable("terra_covenants", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  propertyExternalId: text("property_external_id").notNull(),
  propertyAddress: text("property_address").notNull(),
  borough: text("borough"),
  lender: text("lender").notNull(),
  loanAgreementId: text("loan_agreement_id"),
  loanAgreementUrl: text("loan_agreement_url"),
  covenantType: text("covenant_type", { enum: ["dscr", "ltv", "occupancy", "debt_yield"] }).notNull(),
  label: text("label"),
  thresholdValue: numeric("threshold_value", { precision: 12, scale: 4 }).notNull(),
  comparator: text("comparator", { enum: ["gte", "lte"] }).notNull().default("gte"),
  remedyPeriodDays: integer("remedy_period_days").notNull().default(60),
  requiredApprovers: jsonb("required_approvers").$type<string[]>().notNull().default(["terra-risk-officer"]),
  active: boolean("active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  lastEvaluatedAt: timestamp("last_evaluated_at"),
  lastStatus: text("last_status"),
  lastMeasuredValue: numeric("last_measured_value", { precision: 12, scale: 4 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_covenant_property_idx").on(t.propertyExternalId),
  index("terra_covenant_lender_idx").on(t.lender),
  index("terra_covenant_type_idx").on(t.covenantType),
  index("terra_covenant_active_idx").on(t.active),
]);

export const insertTerraCovenantSchema = createInsertSchema(terraCovenantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraCovenant = z.infer<typeof insertTerraCovenantSchema>;
export type TerraCovenant = typeof terraCovenantsTable.$inferSelect;

// ─── Diligence Matters & Evidence Chain ──────────────────────────────────────

export const terraDiligenceMattersTable = pgTable("terra_diligence_matters", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  propertyId: integer("property_id").references(() => terraDistressPropertiesTable.id, { onDelete: "set null" }),
  propertyExternalId: text("property_external_id"),
  borough: text("borough"),
  status: text("status", { enum: ["in_progress", "on_hold", "completed", "withdrawn"] }).notNull().default("in_progress"),
  stage: text("stage", {
    enum: ["pre_diligence", "initial_review", "title_review", "environmental", "financial_audit", "legal_review", "final_approval"],
  }).notNull().default("pre_diligence"),
  completionPct: integer("completion_pct").notNull().default(0),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  targetCloseDate: text("target_close_date"),
  ownerUserId: integer("owner_user_id"),
  ownerName: text("owner_name"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_diligence_matter_status_idx").on(t.status),
  index("terra_diligence_matter_stage_idx").on(t.stage),
  index("terra_diligence_matter_property_idx").on(t.propertyId),
  index("terra_diligence_matter_active_idx").on(t.isActive),
]);

export const terraDiligenceEvidenceTable = pgTable("terra_diligence_evidence", {
  id: text("id").primaryKey(),
  matterId: text("matter_id").notNull().references(() => terraDiligenceMattersTable.id, { onDelete: "cascade" }),
  category: text("category", {
    enum: ["title", "environmental", "financial", "lease", "structural", "legal"],
  }).notNull(),
  label: text("label").notNull(),
  source: text("source").notNull().default(""),
  summary: text("summary").notNull().default(""),
  status: text("status", { enum: ["pending", "in_review", "verified", "rejected"] }).notNull().default("pending"),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull().default("0.5"),
  evidenceDate: text("evidence_date"),
  documentUrl: text("document_url"),
  documentName: text("document_name"),
  documentSize: integer("document_size"),
  documentMimeType: text("document_mime_type"),
  documentSha256: text("document_sha256"),
  citations: jsonb("citations").$type<Array<{ ref: string; page?: number; excerpt: string }>>().notNull().default([]),
  reviewedByUserId: integer("reviewed_by_user_id"),
  reviewedByName: text("reviewed_by_name"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_diligence_evidence_matter_idx").on(t.matterId),
  index("terra_diligence_evidence_status_idx").on(t.status),
  index("terra_diligence_evidence_category_idx").on(t.category),
]);

export const insertTerraDiligenceMatterSchema = createInsertSchema(terraDiligenceMattersTable).omit({ createdAt: true, updatedAt: true });
export type InsertTerraDiligenceMatter = z.infer<typeof insertTerraDiligenceMatterSchema>;
export type TerraDiligenceMatter = typeof terraDiligenceMattersTable.$inferSelect;

export const insertTerraDiligenceEvidenceSchema = createInsertSchema(terraDiligenceEvidenceTable).omit({ createdAt: true, updatedAt: true });
export type InsertTerraDiligenceEvidence = z.infer<typeof insertTerraDiligenceEvidenceSchema>;
export type TerraDiligenceEvidence = typeof terraDiligenceEvidenceTable.$inferSelect;

export const terraMlsListingsTable = pgTable("terra_mls_listings", {
  id: serial("id").primaryKey(),
  listingKey: text("listing_key").notNull().unique(),
  listingId: text("listing_id"),
  mlsName: text("mls_name").notNull(),
  standardStatus: text("standard_status", {
    enum: ["Active", "Pending", "Closed", "Expired", "Withdrawn", "Coming Soon"],
  }).notNull().default("Active"),
  listPrice: numeric("list_price", { precision: 16, scale: 2 }).notNull(),
  originalListPrice: numeric("original_list_price", { precision: 16, scale: 2 }),
  address: text("address").notNull(),
  city: text("city").notNull(),
  stateOrProvince: text("state_or_province").notNull(),
  postalCode: text("postal_code"),
  county: text("county"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  propertyType: text("property_type").notNull().default("Residential"),
  propertySubType: text("property_sub_type"),
  bedroomsTotal: integer("bedrooms_total"),
  bathroomsTotalInteger: integer("bathrooms_total_integer"),
  livingArea: integer("living_area"),
  lotSizeSquareFeet: integer("lot_size_square_feet"),
  yearBuilt: integer("year_built"),
  daysOnMarket: integer("days_on_market").notNull().default(0),
  modificationTimestamp: text("modification_timestamp").notNull(),
  listingContractDate: text("listing_contract_date"),
  media: jsonb("media").$type<Array<{ mediaUrl: string; mediaType: string; order: number }>>().notNull().default([]),
  listAgentFullName: text("list_agent_full_name"),
  listOfficeName: text("list_office_name"),
  publicRemarks: text("public_remarks"),
  hasDistressCrossRef: boolean("has_distress_cross_ref").notNull().default(false),
  distressPropertyId: integer("distress_property_id").references(() => terraDistressPropertiesTable.id, { onDelete: "set null" }),
  rawData: jsonb("raw_data"),
  isActive: boolean("is_active").notNull().default(true),
  ingestSource: text("ingest_source", { enum: ["mls_sync", "manual", "demo"] }).notNull().default("demo"),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_mls_status_idx").on(t.standardStatus),
  index("terra_mls_postal_idx").on(t.postalCode),
  index("terra_mls_mls_name_idx").on(t.mlsName),
  index("terra_mls_property_type_idx").on(t.propertyType),
  index("terra_mls_price_idx").on(t.listPrice),
  index("terra_mls_active_idx").on(t.isActive),
  index("terra_mls_modification_idx").on(t.modificationTimestamp),
  index("terra_mls_distress_idx").on(t.distressPropertyId),
]);

export const terraCommercialPropertiesTable = pgTable("terra_commercial_properties", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  source: text("source", { enum: ["costar", "compstak", "manual", "demo"] }).notNull(),
  propertyName: text("property_name"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  county: text("county"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  propertyType: text("property_type", {
    enum: ["Office", "Retail", "Industrial", "Multifamily", "Hotel", "Land", "Mixed-Use", "Other"],
  }).notNull(),
  buildingClass: text("building_class", { enum: ["Class A", "Class B", "Class C"] }),
  rentableArea: integer("rentable_area"),
  yearBuilt: integer("year_built"),
  stories: integer("stories"),
  units: integer("units"),
  parkingSpaces: integer("parking_spaces"),
  occupancyRate: numeric("occupancy_rate", { precision: 5, scale: 2 }),
  marketVacancyRate: numeric("market_vacancy_rate", { precision: 5, scale: 2 }),
  askingRentPerSqft: numeric("asking_rent_per_sqft", { precision: 8, scale: 2 }),
  effectiveRentPerSqft: numeric("effective_rent_per_sqft", { precision: 8, scale: 2 }),
  capRate: numeric("cap_rate", { precision: 5, scale: 2 }),
  lastSalePrice: numeric("last_sale_price", { precision: 16, scale: 2 }),
  lastSaleDate: text("last_sale_date"),
  tenants: jsonb("tenants").$type<Array<{
    tenantName: string;
    leaseExpiration: string;
    leasedSqft: number;
    floorOccupied: string;
  }>>().notNull().default([]),
  submarketName: text("submarket_name"),
  ownerName: text("owner_name"),
  ownerType: text("owner_type"),
  rawData: jsonb("raw_data"),
  isActive: boolean("is_active").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_comm_type_idx").on(t.propertyType),
  index("terra_comm_source_idx").on(t.source),
  index("terra_comm_zip_idx").on(t.zipCode),
  index("terra_comm_class_idx").on(t.buildingClass),
  index("terra_comm_active_idx").on(t.isActive),
  index("terra_comm_submarket_idx").on(t.submarketName),
]);

export const terraCommercialCompsTable = pgTable("terra_commercial_comps", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  source: text("source", { enum: ["costar", "compstak", "manual", "demo"] }).notNull(),
  compType: text("comp_type", { enum: ["lease", "sale"] }).notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  propertyType: text("property_type").notNull(),
  tenantName: text("tenant_name"),
  tenantIndustry: text("tenant_industry"),
  transactionType: text("transaction_type"),
  leasedSqft: integer("leased_sqft"),
  rentableArea: integer("rentable_area"),
  startingRentPerSqft: numeric("starting_rent_per_sqft", { precision: 8, scale: 2 }),
  effectiveRentPerSqft: numeric("effective_rent_per_sqft", { precision: 8, scale: 2 }),
  salePrice: numeric("sale_price", { precision: 16, scale: 2 }),
  pricePerSqft: numeric("price_per_sqft", { precision: 8, scale: 2 }),
  capRate: numeric("cap_rate", { precision: 5, scale: 2 }),
  freeRentMonths: integer("free_rent_months"),
  tenantImprovementAllowance: numeric("tenant_improvement_allowance", { precision: 8, scale: 2 }),
  leaseTermMonths: integer("lease_term_months"),
  transactionDate: text("transaction_date").notNull(),
  leaseExpirationDate: text("lease_expiration_date"),
  floorOccupied: text("floor_occupied"),
  buildingClass: text("building_class"),
  landlordName: text("landlord_name"),
  buyerName: text("buyer_name"),
  sellerName: text("seller_name"),
  buyerType: text("buyer_type"),
  financeType: text("finance_type"),
  submarketName: text("submarket_name"),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_comps_type_idx").on(t.compType),
  index("terra_comps_source_idx").on(t.source),
  index("terra_comps_prop_type_idx").on(t.propertyType),
  index("terra_comps_date_idx").on(t.transactionDate),
  index("terra_comps_zip_idx").on(t.zipCode),
]);

export const insertTerraMlsListingSchema = createInsertSchema(terraMlsListingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraMlsListing = z.infer<typeof insertTerraMlsListingSchema>;
export type TerraMlsListing = typeof terraMlsListingsTable.$inferSelect;

export const insertTerraCommercialPropertySchema = createInsertSchema(terraCommercialPropertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraCommercialProperty = z.infer<typeof insertTerraCommercialPropertySchema>;
export type TerraCommercialProperty = typeof terraCommercialPropertiesTable.$inferSelect;

export const insertTerraCommercialCompSchema = createInsertSchema(terraCommercialCompsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraCommercialComp = z.infer<typeof insertTerraCommercialCompSchema>;
export type TerraCommercialComp = typeof terraCommercialCompsTable.$inferSelect;

export const terraActionItemsTable = pgTable("terra_action_items", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  propertyId: text("property_id").notNull(),
  issue: text("issue").notNull(),
  severity: text("severity", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  ownerName: text("owner_name").notNull(),
  ownerRole: text("owner_role").notNull(),
  dueDate: text("due_date"),
  status: text("status", { enum: ["open", "in_progress", "resolved"] }).notNull().default("open"),
  recommendedAction: text("recommended_action"),
  resolvedAt: timestamp("resolved_at"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_action_property_idx").on(t.propertyId),
  index("terra_action_status_idx").on(t.status),
  index("terra_action_severity_idx").on(t.severity),
  index("terra_action_created_idx").on(t.createdAt),
]);

export const insertTerraActionItemSchema = createInsertSchema(terraActionItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraActionItem = z.infer<typeof insertTerraActionItemSchema>;
export type TerraActionItem = typeof terraActionItemsTable.$inferSelect;

export const terraLeasesTable = pgTable("terra_leases", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  documentName: text("document_name").notNull(),
  tenant: text("tenant").notNull(),
  premises: text("premises"),
  propertyAddress: text("property_address"),
  leaseType: text("lease_type"),
  commencementDate: text("commencement_date"),
  expirationDate: text("expiration_date"),
  baseRent: numeric("base_rent", { precision: 16, scale: 2 }),
  rentPerSqft: numeric("rent_per_sqft", { precision: 10, scale: 2 }),
  sqft: integer("sqft"),
  escalations: text("escalations"),
  options: jsonb("options").$type<string[]>().notNull().default([]),
  cam: numeric("cam", { precision: 14, scale: 2 }),
  tiAllowance: numeric("ti_allowance", { precision: 14, scale: 2 }),
  securityDeposit: numeric("security_deposit", { precision: 14, scale: 2 }),
  terminationOption: text("termination_option"),
  exclusiveUse: text("exclusive_use"),
  coTenancy: text("co_tenancy"),
  confidence: integer("confidence").notNull().default(85),
  flags: jsonb("flags").$type<Array<{ field: string; issue: string; severity: string }>>().notNull().default([]),
  rawData: jsonb("raw_data"),
  ownerUserId: integer("owner_user_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_lease_tenant_idx").on(t.tenant),
  index("terra_lease_created_idx").on(t.createdAt),
  index("terra_lease_expiration_idx").on(t.expirationDate),
]);

export const insertTerraLeaseSchema = createInsertSchema(terraLeasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraLease = z.infer<typeof insertTerraLeaseSchema>;
export type TerraLease = typeof terraLeasesTable.$inferSelect;

export const terraProFormaProjectsTable = pgTable("terra_pro_forma_projects", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  projectName: text("project_name").notNull(),
  propertyType: text("property_type"),
  inputs: jsonb("inputs").$type<Record<string, unknown>>().notNull().default({}),
  results: jsonb("results").$type<Record<string, unknown>>(),
  ownerName: text("owner_name"),
  ownerUserId: integer("owner_user_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_pro_forma_name_idx").on(t.projectName),
  index("terra_pro_forma_created_idx").on(t.createdAt),
]);

export const insertTerraProFormaProjectSchema = createInsertSchema(terraProFormaProjectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraProFormaProject = z.infer<typeof insertTerraProFormaProjectSchema>;
export type TerraProFormaProject = typeof terraProFormaProjectsTable.$inferSelect;

export const terraExchanges1031Table = pgTable("terra_exchanges_1031", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  relinquishedProperty: text("relinquished_property").notNull(),
  relinquishedAddress: text("relinquished_address"),
  saleDate: text("sale_date"),
  salePrice: numeric("sale_price", { precision: 16, scale: 2 }),
  adjustedBasis: numeric("adjusted_basis", { precision: 16, scale: 2 }),
  deferredGain: numeric("deferred_gain", { precision: 16, scale: 2 }),
  qi: text("qi"),
  qiContact: text("qi_contact"),
  status: text("status", { enum: ["identification", "exchange", "completed", "failed"] }).notNull().default("identification"),
  identificationDeadline: text("identification_deadline"),
  exchangeDeadline: text("exchange_deadline"),
  identifiedProperties: jsonb("identified_properties").$type<Array<Record<string, unknown>>>().notNull().default([]),
  complianceItems: jsonb("compliance_items").$type<Array<Record<string, unknown>>>().notNull().default([]),
  taxSavings: numeric("tax_savings", { precision: 14, scale: 2 }),
  ownerUserId: integer("owner_user_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_exchange_status_idx").on(t.status),
  index("terra_exchange_created_idx").on(t.createdAt),
]);

export const insertTerraExchange1031Schema = createInsertSchema(terraExchanges1031Table).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraExchange1031 = z.infer<typeof insertTerraExchange1031Schema>;
export type TerraExchange1031 = typeof terraExchanges1031Table.$inferSelect;

export const terraTaxAppealsTable = pgTable("terra_tax_appeals", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  name: text("name").notNull(),
  address: text("address"),
  propertyType: text("property_type"),
  sqft: integer("sqft"),
  assessedValue: numeric("assessed_value", { precision: 16, scale: 2 }),
  avmValue: numeric("avm_value", { precision: 16, scale: 2 }),
  taxRate: numeric("tax_rate", { precision: 8, scale: 4 }),
  overAssessedPct: numeric("over_assessed_pct", { precision: 8, scale: 2 }),
  annualTax: numeric("annual_tax", { precision: 14, scale: 2 }),
  potentialSavings: numeric("potential_savings", { precision: 14, scale: 2 }),
  appealDeadline: text("appeal_deadline"),
  appealStatus: text("appeal_status", { enum: ["eligible", "filed", "hearing", "won", "lost", "not-eligible"] }).notNull().default("eligible"),
  juris: text("juris"),
  comparables: jsonb("comparables").$type<Array<Record<string, unknown>>>().notNull().default([]),
  appealStrength: text("appeal_strength", { enum: ["strong", "moderate", "weak"] }).notNull().default("moderate"),
  notes: text("notes"),
  ownerUserId: integer("owner_user_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_tax_appeal_status_idx").on(t.appealStatus),
  index("terra_tax_appeal_created_idx").on(t.createdAt),
]);

export const insertTerraTaxAppealSchema = createInsertSchema(terraTaxAppealsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraTaxAppeal = z.infer<typeof insertTerraTaxAppealSchema>;
export type TerraTaxAppeal = typeof terraTaxAppealsTable.$inferSelect;

export const terraWaterfallStructuresTable = pgTable("terra_waterfall_structures", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  name: text("name").notNull(),
  description: text("description"),
  inputs: jsonb("inputs").$type<Record<string, unknown>>().notNull().default({}),
  results: jsonb("results").$type<Record<string, unknown>>(),
  ownerName: text("owner_name"),
  ownerUserId: integer("owner_user_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_waterfall_name_idx").on(t.name),
  index("terra_waterfall_created_idx").on(t.createdAt),
]);

export const insertTerraWaterfallStructureSchema = createInsertSchema(terraWaterfallStructuresTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraWaterfallStructure = z.infer<typeof insertTerraWaterfallStructureSchema>;
export type TerraWaterfallStructure = typeof terraWaterfallStructuresTable.$inferSelect;

export const terraConstructionProjectsTable = pgTable("terra_construction_projects", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  name: text("name").notNull(),
  address: text("address"),
  type: text("type"),
  totalBudget: numeric("total_budget", { precision: 16, scale: 2 }),
  totalSpent: numeric("total_spent", { precision: 16, scale: 2 }),
  overallPct: integer("overall_pct").notNull().default(0),
  startDate: text("start_date"),
  projectedCompletion: text("projected_completion"),
  revisedCompletion: text("revised_completion"),
  status: text("status", { enum: ["on-track", "behind", "at-risk", "complete"] }).notNull().default("on-track"),
  gc: text("gc"),
  architect: text("architect"),
  milestones: jsonb("milestones").$type<Array<Record<string, unknown>>>().notNull().default([]),
  budgetLines: jsonb("budget_lines").$type<Array<Record<string, unknown>>>().notNull().default([]),
  photos: jsonb("photos").$type<Array<Record<string, unknown>>>().notNull().default([]),
  ownerUserId: integer("owner_user_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_construction_status_idx").on(t.status),
  index("terra_construction_created_idx").on(t.createdAt),
]);

export const insertTerraConstructionProjectSchema = createInsertSchema(terraConstructionProjectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraConstructionProject = z.infer<typeof insertTerraConstructionProjectSchema>;
export type TerraConstructionProject = typeof terraConstructionProjectsTable.$inferSelect;

export const terraTenantApplicationsTable = pgTable("terra_tenant_applications", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  name: text("name").notNull(),
  type: text("type", { enum: ["individual", "entity"] }).notNull().default("individual"),
  targetUnit: text("target_unit"),
  proposedRent: numeric("proposed_rent", { precision: 14, scale: 2 }),
  leaseTermMonths: integer("lease_term_months"),
  submittedDate: text("submitted_date"),
  status: text("status", { enum: ["pending", "approved", "conditional", "declined"] }).notNull().default("pending"),
  overallScore: integer("overall_score").notNull().default(50),
  recommendation: text("recommendation", { enum: ["approve", "conditional", "decline"] }).notNull().default("conditional"),
  creditScore: integer("credit_score"),
  annualIncome: numeric("annual_income", { precision: 14, scale: 2 }),
  incomeVerified: boolean("income_verified").notNull().default(false),
  rentToIncomeRatio: numeric("rent_to_income_ratio", { precision: 6, scale: 2 }),
  priorEvictions: integer("prior_evictions").notNull().default(0),
  backgroundClear: boolean("background_clear").notNull().default(true),
  screeningData: jsonb("screening_data").$type<Record<string, unknown>>().notNull().default({}),
  flags: jsonb("flags").$type<Array<Record<string, unknown>>>().notNull().default([]),
  notes: text("notes"),
  ownerUserId: integer("owner_user_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("terra_tenant_status_idx").on(t.status),
  index("terra_tenant_recommendation_idx").on(t.recommendation),
  index("terra_tenant_created_idx").on(t.createdAt),
]);

export const insertTerraTenantApplicationSchema = createInsertSchema(terraTenantApplicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTerraTenantApplication = z.infer<typeof insertTerraTenantApplicationSchema>;
export type TerraTenantApplication = typeof terraTenantApplicationsTable.$inferSelect;
