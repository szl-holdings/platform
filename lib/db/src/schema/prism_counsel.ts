import { pgTable, text, serial, timestamp, integer, numeric, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pcMattersTable = pgTable("pc_matters", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  title: text("title").notNull(),
  caseNumber: text("case_number"),
  matterType: text("matter_type", { enum: ["auto_injury", "premises_liability", "insurance_coverage", "medical_malpractice", "product_liability", "wrongful_death", "workers_comp", "no_fault", "other"] }).notNull(),
  status: text("status", { enum: ["intake", "investigation", "discovery", "pre_trial", "trial", "settlement", "closed", "archived"] }).notNull().default("intake"),
  stage: text("stage"),
  jurisdiction: text("jurisdiction"),
  courtName: text("court_name"),
  venueId: integer("venue_id").references(() => pcVenueProfilesTable.id),
  filingDate: timestamp("filing_date"),
  statOfLimitations: timestamp("stat_of_limitations"),
  healthScore: integer("health_score"),
  settlementLow: numeric("settlement_low", { precision: 14, scale: 2 }),
  settlementHigh: numeric("settlement_high", { precision: 14, scale: 2 }),
  settlementMid: numeric("settlement_mid", { precision: 14, scale: 2 }),
  totalDamages: numeric("total_damages", { precision: 14, scale: 2 }),
  totalLiens: numeric("total_liens", { precision: 14, scale: 2 }),
  assignedAttorneyId: integer("assigned_attorney_id"),
  assignedParalegalId: integer("assigned_paralegal_id"),
  tags: jsonb("tags"),
  notes: text("notes"),
  sourceLineage: text("source_lineage"),
  privilegeFlag: boolean("privilege_flag").default(false),
  exportSafe: boolean("export_safe").default(true),
  createdBy: integer("created_by"),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcPartiesTable = pgTable("pc_parties", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["plaintiff", "defendant", "carrier", "adjuster", "witness", "expert", "provider", "judge", "mediator", "opposing_counsel"] }).notNull(),
  name: text("name").notNull(),
  organization: text("organization"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcClaimsTable = pgTable("pc_claims", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  claimNumber: text("claim_number"),
  policyNumber: text("policy_number"),
  carrierName: text("carrier_name"),
  adjusterId: integer("adjuster_id"),
  coverageType: text("coverage_type", { enum: ["bodily_injury", "uninsured_motorist", "underinsured_motorist", "pip", "med_pay", "premises", "general_liability", "umbrella", "excess", "no_fault", "other"] }).notNull(),
  policyLimit: numeric("policy_limit", { precision: 14, scale: 2 }),
  status: text("status", { enum: ["open", "pending", "denied", "accepted", "settled", "litigated"] }).notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcOffersTable = pgTable("pc_offers", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  claimId: integer("claim_id").references(() => pcClaimsTable.id),
  offerType: text("offer_type", { enum: ["demand", "offer", "counter_offer", "final_offer", "mediator_proposal"] }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  source: text("source"),
  notes: text("notes"),
  offerDate: timestamp("offer_date").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcMedicalEventsTable = pgTable("pc_medical_events", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  providerName: text("provider_name").notNull(),
  providerType: text("provider_type", { enum: ["er", "hospital", "orthopedic", "chiropractic", "physical_therapy", "pain_management", "neurologist", "surgeon", "primary_care", "imaging", "other"] }).notNull(),
  eventType: text("event_type", { enum: ["visit", "procedure", "surgery", "imaging", "therapy_session", "consultation", "follow_up", "discharge"] }).notNull(),
  description: text("description"),
  diagnosis: text("diagnosis"),
  eventDate: timestamp("event_date").notNull(),
  billedAmount: numeric("billed_amount", { precision: 12, scale: 2 }),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }),
  outstandingAmount: numeric("outstanding_amount", { precision: 12, scale: 2 }),
  documentRef: text("document_ref"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcDamagesTable = pgTable("pc_damages", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  category: text("category", { enum: ["medical_specials", "lost_wages", "future_medical", "pain_suffering", "loss_of_consortium", "property_damage", "out_of_pocket", "other"] }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  isProjected: boolean("is_projected").default(false),
  verificationStatus: text("verification_status", { enum: ["verified", "pending", "disputed", "estimated"] }).notNull().default("pending"),
  sourceDocument: text("source_document"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcLiensTable = pgTable("pc_liens", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  lienHolder: text("lien_holder").notNull(),
  lienType: text("lien_type", { enum: ["health_insurance", "medicaid", "medicare", "hospital", "provider", "erisa", "workers_comp", "child_support", "government", "other"] }).notNull(),
  assertedAmount: numeric("asserted_amount", { precision: 14, scale: 2 }).notNull(),
  negotiatedAmount: numeric("negotiated_amount", { precision: 14, scale: 2 }),
  status: text("status", { enum: ["asserted", "negotiating", "resolved", "disputed", "waived"] }).notNull().default("asserted"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcDeadlinesTable = pgTable("pc_deadlines", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  deadlineType: text("deadline_type", { enum: ["statute_of_limitations", "discovery_cutoff", "deposition", "mediation", "trial", "motion", "filing", "response", "expert_disclosure", "settlement_conference", "notice_of_claim", "no_fault_ack", "no_fault_verify", "no_fault_pay_deny", "bill_submission", "other"] }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  status: text("status", { enum: ["pending", "completed", "overdue", "waived", "extended"] }).notNull().default("pending"),
  assignedTo: integer("assigned_to"),
  clockRuleId: integer("clock_rule_id").references(() => pcClockRulesTable.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcDiscoveryTable = pgTable("pc_discovery", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  discoveryType: text("discovery_type", { enum: ["interrogatories", "requests_for_production", "requests_for_admission", "subpoena", "deposition_notice", "expert_report", "imt_request"] }).notNull(),
  direction: text("direction", { enum: ["sent", "received"] }).notNull(),
  title: text("title").notNull(),
  servedDate: timestamp("served_date"),
  dueDate: timestamp("due_date"),
  status: text("status", { enum: ["draft", "served", "pending_response", "responded", "objected", "overdue", "completed"] }).notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcDepositionsTable = pgTable("pc_depositions", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  deponentName: text("deponent_name").notNull(),
  deponentRole: text("deponent_role", { enum: ["plaintiff", "defendant", "witness", "expert", "adjuster", "treating_physician", "corporate_rep"] }).notNull(),
  scheduledDate: timestamp("scheduled_date"),
  location: text("location"),
  status: text("status", { enum: ["scheduled", "completed", "cancelled", "rescheduled", "pending"] }).notNull().default("pending"),
  keyFindings: text("key_findings"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcForecastsTable = pgTable("pc_forecasts", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  forecastType: text("forecast_type", { enum: ["settlement_range", "cycle_time", "mediation_readiness", "trial_readiness", "evidence_sufficiency", "lien_resolution", "deadline_breach", "no_fault_evidence_lock", "demand_readiness", "offer_movement", "reserve_drift", "mediation_conversion", "chronology_integrity", "damages_completeness", "venue_velocity", "ai_defensibility"] }).notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  valueLow: numeric("value_low", { precision: 14, scale: 2 }),
  valueHigh: numeric("value_high", { precision: 14, scale: 2 }),
  valueMid: numeric("value_mid", { precision: 14, scale: 2 }),
  signals: jsonb("signals"),
  drivers: jsonb("drivers"),
  previousSnapshot: jsonb("previous_snapshot"),
  explanation: text("explanation"),
  requiresAttorneyReview: boolean("requires_attorney_review").default(false),
  modelRoute: text("model_route"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcReadinessScoresTable = pgTable("pc_readiness_scores", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  pillar: text("pillar", { enum: ["posture", "readiness", "integrity", "strategy", "money", "governance"] }).notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull().default(100),
  details: jsonb("details"),
  computedAt: timestamp("computed_at").notNull().defaultNow(),
});

export const pcCommunicationsTable = pgTable("pc_communications", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  direction: text("direction", { enum: ["inbound", "outbound", "internal"] }).notNull(),
  channel: text("channel", { enum: ["email", "phone", "letter", "portal", "fax", "teams", "sms"] }).notNull(),
  fromParty: text("from_party"),
  toParty: text("to_party"),
  subject: text("subject"),
  summary: text("summary"),
  extractedAsks: jsonb("extracted_asks"),
  extractedCommitments: jsonb("extracted_commitments"),
  isPrivileged: boolean("is_privileged").default(false),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcAiRecommendationsTable = pgTable("pc_ai_recommendations", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  recommendationType: text("recommendation_type", { enum: ["next_best_action", "missing_evidence", "demand_readiness", "discovery_follow_up", "deposition_prep", "mediation_prep", "privilege_warning", "inconsistency_alert", "deadline_risk", "insurer_silence", "clock_violation"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  citations: jsonb("citations"),
  status: text("status", { enum: ["pending", "accepted", "dismissed", "completed"] }).notNull().default("pending"),
  defensibilityScore: integer("defensibility_score"),
  modelRoute: text("model_route"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcApprovalRequestsTable = pgTable("pc_approval_requests", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  requestType: text("request_type", { enum: ["demand_send", "settlement_acceptance", "external_communication", "expert_engagement", "filing", "client_disclosure", "fee_approval", "export_approval"] }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sourceBasis: jsonb("source_basis"),
  requestedBy: integer("requested_by"),
  approvedBy: integer("approved_by"),
  status: text("status", { enum: ["pending", "approved", "rejected", "expired"] }).notNull().default("pending"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const pcAuditEventsTable = pgTable("pc_audit_events", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").references(() => pcMattersTable.id),
  orgId: integer("org_id").notNull(),
  actorId: integer("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcNoFaultClaimsTable = pgTable("pc_no_fault_claims", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  claimNumber: text("claim_number").notNull(),
  carrier: text("carrier").notNull(),
  claimType: text("claim_type", { enum: ["no_fault_pip", "supplemental_um", "sum", "basic_pip", "optional_pip"] }).notNull(),
  dateOfLoss: timestamp("date_of_loss").notNull(),
  noticeDate: timestamp("notice_date"),
  ackDeadline: timestamp("ack_deadline"),
  ackStatus: text("ack_status", { enum: ["pending", "acknowledged", "acknowledged_late", "no_response"] }).default("pending"),
  verificationSent: boolean("verification_sent").default(false),
  verificationDeadline: timestamp("verification_deadline"),
  payDenyDeadline: timestamp("pay_deny_deadline"),
  status: text("status", { enum: ["open", "partial_payment", "paid", "denied", "arbitration", "closed"] }).notNull().default("open"),
  totalBilled: numeric("total_billed", { precision: 14, scale: 2 }).default("0"),
  totalPaid: numeric("total_paid", { precision: 14, scale: 2 }).default("0"),
  totalDenied: numeric("total_denied", { precision: 14, scale: 2 }).default("0"),
  arbitrationRisk: text("arbitration_risk", { enum: ["low", "medium", "high", "critical"] }).default("low"),
  pendingBills: integer("pending_bills").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcClockRulesTable = pgTable("pc_clock_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ruleRef: text("rule_ref"),
  matterType: text("matter_type").notNull(),
  triggerEvent: text("trigger_event").notNull(),
  durationDays: integer("duration_days").notNull(),
  tollingApplies: boolean("tolling_applies").default(false),
  description: text("description"),
  escalationLadder: jsonb("escalation_ladder"),
  nextAction: text("next_action"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcClockEventsTable = pgTable("pc_clock_events", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  clockRuleId: integer("clock_rule_id").notNull().references(() => pcClockRulesTable.id),
  triggerDate: timestamp("trigger_date").notNull(),
  deadlineDate: timestamp("deadline_date").notNull(),
  status: text("status", { enum: ["running", "tolled", "completed", "breached", "waived"] }).notNull().default("running"),
  tolledAt: timestamp("tolled_at"),
  resumedAt: timestamp("resumed_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcVenueProfilesTable = pgTable("pc_venue_profiles", {
  id: serial("id").primaryKey(),
  state: text("state").notNull(),
  county: text("county").notNull(),
  court: text("court").notNull(),
  part: text("part"),
  track: text("track"),
  avgDaysToTrial: integer("avg_days_to_trial"),
  avgDaysToMediation: integer("avg_days_to_mediation"),
  avgDaysNoteOfIssue: integer("avg_days_note_of_issue"),
  conferenceType: text("conference_type"),
  adrTendency: text("adr_tendency"),
  schedulingNotes: text("scheduling_notes"),
  observedVelocity: text("observed_velocity", { enum: ["fast", "moderate", "slow"] }),
  staffingGuidance: text("staffing_guidance"),
  escalationGuidance: text("escalation_guidance"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcInsurerProfilesTable = pgTable("pc_insurer_profiles", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  carrierName: text("carrier_name").notNull(),
  region: text("region"),
  avgResponseDays: integer("avg_response_days"),
  avgOfferToSettlementRatio: numeric("avg_offer_to_settlement_ratio", { precision: 5, scale: 4 }),
  denialRate: numeric("denial_rate", { precision: 5, scale: 4 }),
  mediationWillingness: text("mediation_willingness", { enum: ["low", "moderate", "high"] }),
  negotiationPosture: text("negotiation_posture"),
  silenceWindowDays: integer("silence_window_days"),
  verificationBehavior: text("verification_behavior"),
  tags: jsonb("tags"),
  notes: text("notes"),
  mattersHandled: integer("matters_handled").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcAdjusterProfilesTable = pgTable("pc_adjuster_profiles", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  name: text("name").notNull(),
  carrier: text("carrier").notNull(),
  region: text("region"),
  avgResponseDays: integer("avg_response_days"),
  communicationStyle: text("communication_style"),
  verificationTendency: text("verification_tendency"),
  offerPattern: text("offer_pattern"),
  mattersHandled: integer("matters_handled").default(0),
  tags: jsonb("tags"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcCommunicationWindowsTable = pgTable("pc_communication_windows", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  party: text("party").notNull(),
  lastContact: timestamp("last_contact"),
  daysSilent: integer("days_silent"),
  expectedResponse: text("expected_response"),
  silenceRisk: text("silence_risk", { enum: ["low", "medium", "high", "critical"] }),
  recommendedAction: text("recommended_action"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcDemandPacketsTable = pgTable("pc_demand_packets", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  readinessScore: integer("readiness_score"),
  missingItems: jsonb("missing_items"),
  completedItems: jsonb("completed_items"),
  targetDate: timestamp("target_date"),
  status: text("status", { enum: ["not_started", "in_progress", "blocked", "review", "complete", "sent"] }).notNull().default("not_started"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcDemandReadinessSnapshotsTable = pgTable("pc_demand_readiness_snapshots", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  missingCount: integer("missing_count").default(0),
  completedCount: integer("completed_count").default(0),
  snapshot: jsonb("snapshot"),
  computedAt: timestamp("computed_at").notNull().defaultNow(),
});

export const pcWitnessesTable = pgTable("pc_witnesses", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role", { enum: ["fact", "expert", "character", "treating_physician", "corporate_rep"] }).notNull(),
  affiliation: text("affiliation"),
  contactInfo: text("contact_info"),
  deposed: boolean("deposed").default(false),
  depositionDate: timestamp("deposition_date"),
  keyTestimony: text("key_testimony"),
  credibility: text("credibility", { enum: ["strong", "moderate", "weak", "unknown"] }).default("unknown"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcDocumentChunksTable = pgTable("pc_document_chunks", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  documentRef: text("document_ref").notNull(),
  documentType: text("document_type", { enum: ["medical_record", "bill", "correspondence", "pleading", "discovery", "deposition_transcript", "expert_report", "photo", "police_report", "insurance_doc", "other"] }).notNull(),
  chunkIndex: integer("chunk_index").default(0),
  content: text("content"),
  extractedFacts: jsonb("extracted_facts"),
  privilegeFlag: boolean("privilege_flag").default(false),
  reviewState: text("review_state", { enum: ["unreviewed", "reviewed", "flagged", "redacted"] }).default("unreviewed"),
  isGenerated: boolean("is_generated").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcPrivilegeFlagsTable = pgTable("pc_privilege_flags", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  flagType: text("flag_type", { enum: ["attorney_client", "work_product", "joint_defense", "common_interest"] }).notNull(),
  flaggedBy: integer("flagged_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcInconsistencyFlagsTable = pgTable("pc_inconsistency_flags", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  flagType: text("flag_type", { enum: ["factual_conflict", "chronology_gap", "treatment_gap", "document_conflict", "testimony_conflict"] }).notNull(),
  description: text("description").notNull(),
  sourceA: text("source_a"),
  sourceB: text("source_b"),
  severity: text("severity", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  status: text("status", { enum: ["open", "resolved", "dismissed"] }).notNull().default("open"),
  resolvedBy: integer("resolved_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcDefensibilityScoresTable = pgTable("pc_defensibility_scores", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  score: integer("score").notNull(),
  sourceTraceCount: integer("source_trace_count").default(0),
  unsupportedClaimCount: integer("unsupported_claim_count").default(0),
  privilegeRiskCount: integer("privilege_risk_count").default(0),
  details: jsonb("details"),
  computedAt: timestamp("computed_at").notNull().defaultNow(),
});

export const pcExportsTable = pgTable("pc_exports", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").references(() => pcMattersTable.id),
  orgId: integer("org_id").notNull(),
  exportType: text("export_type", { enum: ["demand_packet", "review_packet", "audit_report", "matter_summary", "medical_chronology", "damages_summary", "bulk_export"] }).notNull(),
  format: text("format", { enum: ["pdf", "docx", "csv", "json"] }).notNull(),
  scope: jsonb("scope"),
  status: text("status", { enum: ["pending", "generating", "complete", "failed"] }).notNull().default("pending"),
  exportedBy: integer("exported_by"),
  approvedBy: integer("approved_by"),
  filePath: text("file_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcMatterTagsTable = pgTable("pc_matter_tags", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcConnectorAccountsTable = pgTable("pc_connector_accounts", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  connectorType: text("connector_type", { enum: ["microsoft_365", "filevine", "clio", "litify", "docusign", "file_upload", "custom"] }).notNull(),
  displayName: text("display_name").notNull(),
  status: text("status", { enum: ["active", "inactive", "error", "pending_auth"] }).notNull().default("pending_auth"),
  config: jsonb("config"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcConnectorSyncRunsTable = pgTable("pc_connector_sync_runs", {
  id: serial("id").primaryKey(),
  connectorAccountId: integer("connector_account_id").notNull().references(() => pcConnectorAccountsTable.id),
  status: text("status", { enum: ["running", "completed", "partial_failure", "failed"] }).notNull(),
  recordsSynced: integer("records_synced").default(0),
  recordsFailed: integer("records_failed").default(0),
  errorDetails: jsonb("error_details"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const pcNyRuleProfilesTable = pgTable("pc_ny_rule_profiles", {
  id: serial("id").primaryKey(),
  matterType: text("matter_type").notNull(),
  ruleSet: text("rule_set").notNull(),
  rules: jsonb("rules"),
  effectiveDate: timestamp("effective_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pcPlaybooksTable = pgTable("pc_playbooks", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  matterType: text("matter_type"),
  steps: jsonb("steps"),
  requiredArtifacts: jsonb("required_artifacts"),
  approvalCheckpoints: jsonb("approval_checkpoints"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pcTasksTable = pgTable("pc_tasks", {
  id: serial("id").primaryKey(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  playbookId: integer("playbook_id").references(() => pcPlaybooksTable.id),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to"),
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).notNull().default("medium"),
  status: text("status", { enum: ["pending", "in_progress", "review", "completed", "blocked"] }).notNull().default("pending"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  source: text("source", { enum: ["manual", "ai_recommendation", "playbook", "clock_rule"] }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMatterSchema = createInsertSchema(pcMattersTable);
export const insertPartySchema = createInsertSchema(pcPartiesTable);
export const insertClaimSchema = createInsertSchema(pcClaimsTable);
export const insertOfferSchema = createInsertSchema(pcOffersTable);
export const insertMedicalEventSchema = createInsertSchema(pcMedicalEventsTable);
export const insertDamagesSchema = createInsertSchema(pcDamagesTable);
export const insertLienSchema = createInsertSchema(pcLiensTable);
export const insertDeadlineSchema = createInsertSchema(pcDeadlinesTable);
export const insertForecastSchema = createInsertSchema(pcForecastsTable);
export const insertNoFaultClaimSchema = createInsertSchema(pcNoFaultClaimsTable);
export const insertClockRuleSchema = createInsertSchema(pcClockRulesTable);
export const insertVenueProfileSchema = createInsertSchema(pcVenueProfilesTable);
export const insertInsurerProfileSchema = createInsertSchema(pcInsurerProfilesTable);

export type PcMatter = typeof pcMattersTable.$inferSelect;
export type PcParty = typeof pcPartiesTable.$inferSelect;
export type PcClaim = typeof pcClaimsTable.$inferSelect;
export type PcOffer = typeof pcOffersTable.$inferSelect;
export type PcMedicalEvent = typeof pcMedicalEventsTable.$inferSelect;
export type PcDamages = typeof pcDamagesTable.$inferSelect;
export type PcLien = typeof pcLiensTable.$inferSelect;
export type PcDeadline = typeof pcDeadlinesTable.$inferSelect;
export type PcForecast = typeof pcForecastsTable.$inferSelect;
export type PcReadinessScore = typeof pcReadinessScoresTable.$inferSelect;
export type PcCommunication = typeof pcCommunicationsTable.$inferSelect;
export type PcAiRecommendation = typeof pcAiRecommendationsTable.$inferSelect;
export type PcApprovalRequest = typeof pcApprovalRequestsTable.$inferSelect;
export type PcAuditEvent = typeof pcAuditEventsTable.$inferSelect;
export type PcNoFaultClaim = typeof pcNoFaultClaimsTable.$inferSelect;
export type PcClockRule = typeof pcClockRulesTable.$inferSelect;
export type PcClockEvent = typeof pcClockEventsTable.$inferSelect;
export type PcVenueProfile = typeof pcVenueProfilesTable.$inferSelect;
export type PcInsurerProfile = typeof pcInsurerProfilesTable.$inferSelect;
export type PcAdjusterProfile = typeof pcAdjusterProfilesTable.$inferSelect;
export type PcCommunicationWindow = typeof pcCommunicationWindowsTable.$inferSelect;
export type PcDemandPacket = typeof pcDemandPacketsTable.$inferSelect;
export type PcWitness = typeof pcWitnessesTable.$inferSelect;
export type PcDocumentChunk = typeof pcDocumentChunksTable.$inferSelect;
export type PcPrivilegeFlag = typeof pcPrivilegeFlagsTable.$inferSelect;
export type PcInconsistencyFlag = typeof pcInconsistencyFlagsTable.$inferSelect;
export type PcDefensibilityScore = typeof pcDefensibilityScoresTable.$inferSelect;
export type PcExport = typeof pcExportsTable.$inferSelect;
export type PcMatterTag = typeof pcMatterTagsTable.$inferSelect;
export type PcConnectorAccount = typeof pcConnectorAccountsTable.$inferSelect;
export type PcConnectorSyncRun = typeof pcConnectorSyncRunsTable.$inferSelect;
export type PcPlaybook = typeof pcPlaybooksTable.$inferSelect;
export type PcTask = typeof pcTasksTable.$inferSelect;
