import {
  pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb, index, bigint,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── PORTFOLIO COMPANY FINANCIAL REPORTING ────────────────────────────────────

export const fundPortfolioFinancialsTable = pgTable("fund_portfolio_financials", {
  id: serial("id").primaryKey(),
  companySlug: text("company_slug").notNull(),
  companyName: text("company_name").notNull(),
  periodType: text("period_type", { enum: ["monthly", "quarterly", "annual"] }).notNull().default("quarterly"),
  periodLabel: text("period_label").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  reportingStatus: text("reporting_status", { enum: ["draft", "submitted", "reviewed", "final"] }).notNull().default("draft"),

  // Income Statement
  revenue: numeric("revenue", { precision: 18, scale: 2 }),
  revenuePriorPeriod: numeric("revenue_prior_period", { precision: 18, scale: 2 }),
  grossProfit: numeric("gross_profit", { precision: 18, scale: 2 }),
  grossMarginPct: numeric("gross_margin_pct", { precision: 8, scale: 4 }),
  operatingExpenses: numeric("operating_expenses", { precision: 18, scale: 2 }),
  ebitda: numeric("ebitda", { precision: 18, scale: 2 }),
  netIncome: numeric("net_income", { precision: 18, scale: 2 }),
  cogs: numeric("cogs", { precision: 18, scale: 2 }),
  salesMarketingExpense: numeric("sales_marketing_expense", { precision: 18, scale: 2 }),
  rdExpense: numeric("rd_expense", { precision: 18, scale: 2 }),
  gaExpense: numeric("ga_expense", { precision: 18, scale: 2 }),

  // Balance Sheet
  cashAndEquivalents: numeric("cash_and_equivalents", { precision: 18, scale: 2 }),
  totalAssets: numeric("total_assets", { precision: 18, scale: 2 }),
  totalLiabilities: numeric("total_liabilities", { precision: 18, scale: 2 }),
  totalEquity: numeric("total_equity", { precision: 18, scale: 2 }),
  accountsReceivable: numeric("accounts_receivable", { precision: 18, scale: 2 }),
  accountsPayable: numeric("accounts_payable", { precision: 18, scale: 2 }),
  deferredRevenue: numeric("deferred_revenue", { precision: 18, scale: 2 }),

  // Cash Flow
  operatingCashFlow: numeric("operating_cash_flow", { precision: 18, scale: 2 }),
  investingCashFlow: numeric("investing_cash_flow", { precision: 18, scale: 2 }),
  financingCashFlow: numeric("financing_cash_flow", { precision: 18, scale: 2 }),
  freeCashFlow: numeric("free_cash_flow", { precision: 18, scale: 2 }),
  burnRate: numeric("burn_rate", { precision: 18, scale: 2 }),
  runwayMonths: numeric("runway_months", { precision: 6, scale: 1 }),
  capitalRaised: numeric("capital_raised", { precision: 18, scale: 2 }),

  notes: text("notes"),
  metadata: jsonb("metadata"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_financials_company_idx").on(t.companySlug),
  index("fund_financials_period_idx").on(t.periodLabel),
  index("fund_financials_status_idx").on(t.reportingStatus),
]);

export const fundPortfolioKpisTable = pgTable("fund_portfolio_kpis", {
  id: serial("id").primaryKey(),
  companySlug: text("company_slug").notNull(),
  companyName: text("company_name").notNull(),
  periodLabel: text("period_label").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),

  // Unit Economics
  mrr: numeric("mrr", { precision: 18, scale: 2 }),
  arr: numeric("arr", { precision: 18, scale: 2 }),
  mrrGrowthPct: numeric("mrr_growth_pct", { precision: 8, scale: 4 }),
  totalCustomers: integer("total_customers"),
  newCustomers: integer("new_customers"),
  churnedCustomers: integer("churned_customers"),
  churnRatePct: numeric("churn_rate_pct", { precision: 8, scale: 4 }),
  netRevenueRetentionPct: numeric("net_revenue_retention_pct", { precision: 8, scale: 4 }),
  cac: numeric("cac", { precision: 18, scale: 2 }),
  ltv: numeric("ltv", { precision: 18, scale: 2 }),
  ltvCacRatio: numeric("ltv_cac_ratio", { precision: 8, scale: 4 }),
  magicNumber: numeric("magic_number", { precision: 8, scale: 4 }),
  paybackPeriodMonths: numeric("payback_period_months", { precision: 6, scale: 1 }),
  avgContractValue: numeric("avg_contract_value", { precision: 18, scale: 2 }),
  headcount: integer("headcount"),
  revenuePerEmployee: numeric("revenue_per_employee", { precision: 18, scale: 2 }),

  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_kpis_company_idx").on(t.companySlug),
  index("fund_kpis_period_idx").on(t.periodLabel),
]);

// ─── SEC COMPLIANCE & INVESTOR REPORTING ──────────────────────────────────────

export const fundFormDFilingsTable = pgTable("fund_form_d_filings", {
  id: serial("id").primaryKey(),
  entityName: text("entity_name").notNull(),
  cikNumber: text("cik_number"),
  filingType: text("filing_type", { enum: ["initial", "amendment", "annual_amendment"] }).notNull().default("initial"),
  exemption: text("exemption", { enum: ["rule_506b", "rule_506c", "rule_504", "rule_505", "other"] }).notNull().default("rule_506b"),
  offeringAmount: numeric("offering_amount", { precision: 18, scale: 2 }),
  amountSold: numeric("amount_sold", { precision: 18, scale: 2 }),
  investorCount: integer("investor_count"),
  dateOfFirstSale: text("date_of_first_sale"),
  filedAt: timestamp("filed_at"),
  status: text("status", { enum: ["pending", "filed", "amended", "closed"] }).notNull().default("pending"),
  regDStatus: text("reg_d_status", { enum: ["compliant", "review_needed", "non_compliant"] }).notNull().default("review_needed"),
  edgarLink: text("edgar_link"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_form_d_entity_idx").on(t.entityName),
  index("fund_form_d_status_idx").on(t.status),
]);

export const fundAccreditedInvestorsTable = pgTable("fund_accredited_investors", {
  id: serial("id").primaryKey(),
  lpName: text("lp_name").notNull(),
  lpType: text("lp_type", { enum: ["individual", "entity", "trust", "fund_of_funds", "family_office"] }).notNull().default("individual"),
  accreditationBasis: text("accreditation_basis", {
    enum: ["income_200k", "income_300k_joint", "net_worth_1m", "qualified_purchaser", "entity_5m_assets", "knowledgeable_employee", "other"],
  }).notNull().default("net_worth_1m"),
  verificationMethod: text("verification_method", { enum: ["self_certification", "third_party_verification", "letter_from_cpa", "letter_from_attorney", "finra_check"] }).notNull().default("self_certification"),
  verifiedAt: timestamp("verified_at"),
  verificationExpiresAt: timestamp("verification_expires_at"),
  verificationStatus: text("verification_status", { enum: ["pending", "verified", "expired", "rejected"] }).notNull().default("pending"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  jurisdiction: text("jurisdiction"),
  qualifiedEligiblePerson: boolean("qualified_eligible_person").notNull().default(false),
  notesInternal: text("notes_internal"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_investors_name_idx").on(t.lpName),
  index("fund_investors_status_idx").on(t.verificationStatus),
]);

export const fundLpReportsTable = pgTable("fund_lp_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type", { enum: ["quarterly", "annual", "capital_call_notice", "distribution_notice", "special"] }).notNull().default("quarterly"),
  reportingPeriod: text("reporting_period").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  version: integer("version").notNull().default(1),
  status: text("status", { enum: ["draft", "under_review", "approved", "distributed", "archived"] }).notNull().default("draft"),

  // Performance Metrics
  grossIrr: numeric("gross_irr", { precision: 8, scale: 4 }),
  netIrr: numeric("net_irr", { precision: 8, scale: 4 }),
  tvpi: numeric("tvpi", { precision: 8, scale: 4 }),
  dpi: numeric("dpi", { precision: 8, scale: 4 }),
  rvpi: numeric("rvpi", { precision: 8, scale: 4 }),
  pme: numeric("pme", { precision: 8, scale: 4 }),
  fundNav: numeric("fund_nav", { precision: 18, scale: 2 }),
  totalCommitments: numeric("total_commitments", { precision: 18, scale: 2 }),
  calledCapital: numeric("called_capital", { precision: 18, scale: 2 }),
  distributedCapital: numeric("distributed_capital", { precision: 18, scale: 2 }),
  unrealizedValue: numeric("unrealized_value", { precision: 18, scale: 2 }),

  // Fee & Carry
  managementFeesAccrued: numeric("management_fees_accrued", { precision: 18, scale: 2 }),
  managementFeesPaid: numeric("management_fees_paid", { precision: 18, scale: 2 }),
  carriedInterestAccrued: numeric("carried_interest_accrued", { precision: 18, scale: 2 }),
  carriedInterestPaid: numeric("carried_interest_paid", { precision: 18, scale: 2 }),
  preferredReturnAccrued: numeric("preferred_return_accrued", { precision: 18, scale: 2 }),
  preferredReturnRate: numeric("preferred_return_rate", { precision: 6, scale: 4 }),
  carryRate: numeric("carry_rate", { precision: 6, scale: 4 }),
  managementFeeRate: numeric("management_fee_rate", { precision: 6, scale: 4 }),

  narrativeSummary: text("narrative_summary"),
  disclosures: text("disclosures"),
  disclaimers: text("disclaimers"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  distributedAt: timestamp("distributed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_lp_reports_period_idx").on(t.reportingPeriod),
  index("fund_lp_reports_status_idx").on(t.status),
  index("fund_lp_reports_type_idx").on(t.reportType),
]);

// ─── CAP TABLE ENGINE ─────────────────────────────────────────────────────────

export const fundShareClassesTable = pgTable("fund_share_classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  classType: text("class_type", {
    enum: ["common", "preferred_a", "preferred_b", "preferred_c", "preferred_seed", "convertible_note", "safe", "warrant", "option_pool", "rsu", "other"],
  }).notNull().default("common"),
  issuedShares: numeric("issued_shares", { precision: 18, scale: 0 }),
  authorizedShares: numeric("authorized_shares", { precision: 18, scale: 0 }),
  parValueCents: integer("par_value_cents").default(0),
  liquidationPreferencePct: numeric("liquidation_preference_pct", { precision: 8, scale: 4 }),
  liquidationMultiple: numeric("liquidation_multiple", { precision: 6, scale: 2 }),
  participationCap: text("participation_cap"),
  isParticipating: boolean("is_participating").notNull().default(false),
  antiDilutionProvision: text("anti_dilution_provision", { enum: ["none", "broad_based_weighted_average", "narrow_based_weighted_average", "full_ratchet"] }).notNull().default("none"),
  conversionRatio: numeric("conversion_ratio", { precision: 8, scale: 4 }).default("1"),
  votesPerShare: numeric("votes_per_share", { precision: 8, scale: 4 }).default("1"),
  dividendRatePct: numeric("dividend_rate_pct", { precision: 8, scale: 4 }),
  seniority: integer("seniority").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_share_classes_type_idx").on(t.classType),
]);

export const fundCapTableHoldersTable = pgTable("fund_cap_table_holders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  holderType: text("holder_type", { enum: ["founder", "employee", "advisor", "angel", "vc_fund", "strategic", "option_pool", "other"] }).notNull().default("founder"),
  email: text("email"),
  linkedLpId: integer("linked_lp_id"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_holders_type_idx").on(t.holderType),
]);

export const fundCapTableTransactionsTable = pgTable("fund_cap_table_transactions", {
  id: serial("id").primaryKey(),
  holderId: integer("holder_id").notNull().references(() => fundCapTableHoldersTable.id, { onDelete: "restrict" }),
  shareClassId: integer("share_class_id").notNull().references(() => fundShareClassesTable.id, { onDelete: "restrict" }),
  transactionType: text("transaction_type", {
    enum: ["issuance", "transfer", "conversion", "cancellation", "exercise", "repurchase", "split", "note_issuance", "safe_issuance", "warrant_issuance"],
  }).notNull(),
  shares: numeric("shares", { precision: 18, scale: 0 }).notNull(),
  pricePerShareCents: integer("price_per_share_cents"),
  totalConsiderationCents: integer("total_consideration_cents"),
  transactionDate: text("transaction_date").notNull(),
  vestingScheduleId: integer("vesting_schedule_id"),
  fromHolderId: integer("from_holder_id"),
  notes: text("notes"),
  documentReference: text("document_reference"),
  isAuditLocked: boolean("is_audit_locked").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("fund_cap_txn_holder_idx").on(t.holderId),
  index("fund_cap_txn_class_idx").on(t.shareClassId),
  index("fund_cap_txn_date_idx").on(t.transactionDate),
  index("fund_cap_txn_type_idx").on(t.transactionType),
]);

export const fundVestingSchedulesTable = pgTable("fund_vesting_schedules", {
  id: serial("id").primaryKey(),
  holderId: integer("holder_id").notNull().references(() => fundCapTableHoldersTable.id, { onDelete: "restrict" }),
  shareClassId: integer("share_class_id").references(() => fundShareClassesTable.id, { onDelete: "set null" }),
  grantDate: text("grant_date").notNull(),
  totalShares: numeric("total_shares", { precision: 18, scale: 0 }).notNull(),
  vestedShares: numeric("vested_shares", { precision: 18, scale: 0 }).notNull().default("0"),
  vestingPeriodMonths: integer("vesting_period_months").notNull().default(48),
  cliffMonths: integer("cliff_months").notNull().default(12),
  accelerationTrigger: text("acceleration_trigger", { enum: ["none", "single_trigger", "double_trigger"] }).notNull().default("none"),
  lastCalculatedAt: timestamp("last_calculated_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_vesting_holder_idx").on(t.holderId),
]);

// ─── FUND ADMINISTRATION ──────────────────────────────────────────────────────

export const fundCapitalCallsTable = pgTable("fund_capital_calls", {
  id: serial("id").primaryKey(),
  callNumber: integer("call_number").notNull(),
  callDate: text("call_date").notNull(),
  dueDate: text("due_date").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull(),
  purpose: text("purpose").notNull(),
  purposeDetail: text("purpose_detail"),
  status: text("status", { enum: ["draft", "notices_sent", "partially_funded", "fully_funded", "overdue", "cancelled"] }).notNull().default("draft"),
  fundedAmountCents: integer("funded_amount_cents").notNull().default(0),
  noticesSentAt: timestamp("notices_sent_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_capital_calls_status_idx").on(t.status),
  index("fund_capital_calls_due_idx").on(t.dueDate),
]);

export const fundLpCapitalAccountsTable = pgTable("fund_lp_capital_accounts", {
  id: serial("id").primaryKey(),
  lpId: integer("lp_id").notNull().references(() => fundAccreditedInvestorsTable.id, { onDelete: "restrict" }),
  commitmentCents: integer("commitment_cents").notNull().default(0),
  calledCents: integer("called_cents").notNull().default(0),
  uncalledCents: integer("uncalled_cents").notNull().default(0),
  distributionsCents: integer("distributions_cents").notNull().default(0),
  currentNavCents: integer("current_nav_cents").notNull().default(0),
  ownershipPct: numeric("ownership_pct", { precision: 8, scale: 6 }),
  managementFeesPaidCents: integer("management_fees_paid_cents").notNull().default(0),
  carriedInterestPaidCents: integer("carried_interest_paid_cents").notNull().default(0),
  vintage: text("vintage"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_lp_accounts_lp_idx").on(t.lpId),
]);

export const fundCapitalCallLinesTable = pgTable("fund_capital_call_lines", {
  id: serial("id").primaryKey(),
  capitalCallId: integer("capital_call_id").notNull().references(() => fundCapitalCallsTable.id, { onDelete: "cascade" }),
  lpId: integer("lp_id").notNull().references(() => fundAccreditedInvestorsTable.id, { onDelete: "restrict" }),
  requestedCents: integer("requested_cents").notNull(),
  receivedCents: integer("received_cents").notNull().default(0),
  receivedAt: timestamp("received_at"),
  paymentReference: text("payment_reference"),
  status: text("status", { enum: ["pending", "received", "overdue", "waived"] }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_call_lines_call_idx").on(t.capitalCallId),
  index("fund_call_lines_lp_idx").on(t.lpId),
]);

export const fundDistributionsTable = pgTable("fund_distributions", {
  id: serial("id").primaryKey(),
  distributionNumber: integer("distribution_number").notNull(),
  distributionDate: text("distribution_date").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull(),
  distributionType: text("distribution_type", { enum: ["return_of_capital", "realized_gain", "income", "carried_interest", "management_fee", "other"] }).notNull().default("realized_gain"),
  source: text("source"),
  status: text("status", { enum: ["planned", "approved", "processing", "completed", "cancelled"] }).notNull().default("planned"),
  waterfallApplied: boolean("waterfall_applied").notNull().default(false),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_distributions_status_idx").on(t.status),
  index("fund_distributions_date_idx").on(t.distributionDate),
]);

export const fundDistributionLinesTable = pgTable("fund_distribution_lines", {
  id: serial("id").primaryKey(),
  distributionId: integer("distribution_id").notNull().references(() => fundDistributionsTable.id, { onDelete: "cascade" }),
  lpId: integer("lp_id").notNull().references(() => fundAccreditedInvestorsTable.id, { onDelete: "restrict" }),
  amountCents: integer("amount_cents").notNull(),
  returnOfCapitalCents: integer("return_of_capital_cents").notNull().default(0),
  gainCents: integer("gain_cents").notNull().default(0),
  carriedInterestCents: integer("carried_interest_cents").notNull().default(0),
  paymentDate: text("payment_date"),
  paymentReference: text("payment_reference"),
  status: text("status", { enum: ["pending", "sent", "confirmed", "returned"] }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_dist_lines_dist_idx").on(t.distributionId),
  index("fund_dist_lines_lp_idx").on(t.lpId),
]);

export const fundNavRecordsTable = pgTable("fund_nav_records", {
  id: serial("id").primaryKey(),
  navDate: text("nav_date").notNull(),
  totalNavCents: bigint("total_nav_cents", { mode: "number" }).notNull(),
  calledCapitalCents: bigint("called_capital_cents", { mode: "number" }).notNull(),
  uncalledCommitmentsCents: bigint("uncalled_commitments_cents", { mode: "number" }).notNull().default(0),
  distributedCents: bigint("distributed_cents", { mode: "number" }).notNull().default(0),
  unrealizedValueCents: bigint("unrealized_value_cents", { mode: "number" }).notNull().default(0),
  managementFeesPaidCents: bigint("management_fees_paid_cents", { mode: "number" }).notNull().default(0),
  carryAccruedCents: bigint("carry_accrued_cents", { mode: "number" }).notNull().default(0),
  grossIrr: numeric("gross_irr", { precision: 8, scale: 4 }),
  netIrr: numeric("net_irr", { precision: 8, scale: 4 }),
  tvpi: numeric("tvpi", { precision: 8, scale: 4 }),
  dpi: numeric("dpi", { precision: 8, scale: 4 }),
  rvpi: numeric("rvpi", { precision: 8, scale: 4 }),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("fund_nav_date_idx").on(t.navDate),
]);

export const fundCapTableAuditLogTable = pgTable("fund_cap_table_audit_log", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  actionType: text("action_type", { enum: ["create", "update", "delete", "convert", "vest", "exercise"] }).notNull(),
  summary: text("summary").notNull(),
  changedBy: text("changed_by"),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
}, (t) => [
  index("fund_audit_entity_idx").on(t.entityType, t.entityId),
  index("fund_audit_occurred_idx").on(t.occurredAt),
]);

// ─── LP PORTAL: DATA ROOM, MESSAGES, ACTIVITY ─────────────────────────────────

export const fundLpDataRoomDocsTable = pgTable("fund_lp_data_room_docs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  folder: text("folder").notNull(),
  fileType: text("file_type", { enum: ["pdf", "xlsx", "pptx", "docx", "csv", "other"] }).notNull().default("pdf"),
  sizeLabel: text("size_label").notNull().default("0 MB"),
  uploadedAt: text("uploaded_at").notNull(),
  permissionTier: text("permission_tier", { enum: ["public", "all_lp", "qualified_lp", "co_investor", "gp_only"] }).notNull().default("all_lp"),
  watermarked: boolean("watermarked").notNull().default(false),
  sourceUri: text("source_uri"),
  uploadedBy: text("uploaded_by"),
  isDemo: boolean("is_demo").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("fund_lp_docs_folder_idx").on(t.folder),
  index("fund_lp_docs_perm_idx").on(t.permissionTier),
  index("fund_lp_docs_demo_idx").on(t.isDemo),
]);

export const fundLpMessagesTable = pgTable("fund_lp_messages", {
  id: serial("id").primaryKey(),
  lpId: integer("lp_id").notNull().references(() => fundAccreditedInvestorsTable.id, { onDelete: "cascade" }),
  fromRole: text("from_role", { enum: ["lp", "gp"] }).notNull(),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  metadata: jsonb("metadata"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
}, (t) => [
  index("fund_lp_messages_lp_idx").on(t.lpId),
  index("fund_lp_messages_sent_idx").on(t.sentAt),
]);

export const fundLpActivityEventsTable = pgTable("fund_lp_activity_events", {
  id: serial("id").primaryKey(),
  lpId: integer("lp_id").notNull().references(() => fundAccreditedInvestorsTable.id, { onDelete: "cascade" }),
  action: text("action", { enum: ["viewed", "downloaded", "messaged_gp", "logged_in"] }).notNull(),
  target: text("target").notNull(),
  documentId: integer("document_id").references(() => fundLpDataRoomDocsTable.id, { onDelete: "set null" }),
  reportId: integer("report_id").references(() => fundLpReportsTable.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isDemo: boolean("is_demo").notNull().default(false),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
}, (t) => [
  index("fund_lp_activity_lp_idx").on(t.lpId),
  index("fund_lp_activity_occurred_idx").on(t.occurredAt),
]);

// ─── INSERT SCHEMAS & TYPES ───────────────────────────────────────────────────

export const insertFundPortfolioFinancialSchema = createInsertSchema(fundPortfolioFinancialsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundPortfolioFinancial = z.infer<typeof insertFundPortfolioFinancialSchema>;
export type FundPortfolioFinancial = typeof fundPortfolioFinancialsTable.$inferSelect;

export const insertFundPortfolioKpiSchema = createInsertSchema(fundPortfolioKpisTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundPortfolioKpi = z.infer<typeof insertFundPortfolioKpiSchema>;
export type FundPortfolioKpi = typeof fundPortfolioKpisTable.$inferSelect;

export const insertFundFormDFilingSchema = createInsertSchema(fundFormDFilingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundFormDFiling = z.infer<typeof insertFundFormDFilingSchema>;
export type FundFormDFiling = typeof fundFormDFilingsTable.$inferSelect;

export const insertFundAccreditedInvestorSchema = createInsertSchema(fundAccreditedInvestorsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundAccreditedInvestor = z.infer<typeof insertFundAccreditedInvestorSchema>;
export type FundAccreditedInvestor = typeof fundAccreditedInvestorsTable.$inferSelect;

export const insertFundLpReportSchema = createInsertSchema(fundLpReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundLpReport = z.infer<typeof insertFundLpReportSchema>;
export type FundLpReport = typeof fundLpReportsTable.$inferSelect;

export const insertFundShareClassSchema = createInsertSchema(fundShareClassesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundShareClass = z.infer<typeof insertFundShareClassSchema>;
export type FundShareClass = typeof fundShareClassesTable.$inferSelect;

export const insertFundCapTableHolderSchema = createInsertSchema(fundCapTableHoldersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundCapTableHolder = z.infer<typeof insertFundCapTableHolderSchema>;
export type FundCapTableHolder = typeof fundCapTableHoldersTable.$inferSelect;

export const insertFundCapTableTransactionSchema = createInsertSchema(fundCapTableTransactionsTable).omit({ id: true, createdAt: true });
export type InsertFundCapTableTransaction = z.infer<typeof insertFundCapTableTransactionSchema>;
export type FundCapTableTransaction = typeof fundCapTableTransactionsTable.$inferSelect;

export const insertFundVestingScheduleSchema = createInsertSchema(fundVestingSchedulesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundVestingSchedule = z.infer<typeof insertFundVestingScheduleSchema>;
export type FundVestingSchedule = typeof fundVestingSchedulesTable.$inferSelect;

export const insertFundCapitalCallSchema = createInsertSchema(fundCapitalCallsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundCapitalCall = z.infer<typeof insertFundCapitalCallSchema>;
export type FundCapitalCall = typeof fundCapitalCallsTable.$inferSelect;

export const insertFundLpCapitalAccountSchema = createInsertSchema(fundLpCapitalAccountsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundLpCapitalAccount = z.infer<typeof insertFundLpCapitalAccountSchema>;
export type FundLpCapitalAccount = typeof fundLpCapitalAccountsTable.$inferSelect;

export const insertFundCapitalCallLineSchema = createInsertSchema(fundCapitalCallLinesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundCapitalCallLine = z.infer<typeof insertFundCapitalCallLineSchema>;
export type FundCapitalCallLine = typeof fundCapitalCallLinesTable.$inferSelect;

export const insertFundDistributionSchema = createInsertSchema(fundDistributionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundDistribution = z.infer<typeof insertFundDistributionSchema>;
export type FundDistribution = typeof fundDistributionsTable.$inferSelect;

export const insertFundDistributionLineSchema = createInsertSchema(fundDistributionLinesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundDistributionLine = z.infer<typeof insertFundDistributionLineSchema>;
export type FundDistributionLine = typeof fundDistributionLinesTable.$inferSelect;

export const insertFundNavRecordSchema = createInsertSchema(fundNavRecordsTable).omit({ id: true, createdAt: true });
export type InsertFundNavRecord = z.infer<typeof insertFundNavRecordSchema>;
export type FundNavRecord = typeof fundNavRecordsTable.$inferSelect;

export const insertFundLpDataRoomDocSchema = createInsertSchema(fundLpDataRoomDocsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFundLpDataRoomDoc = z.infer<typeof insertFundLpDataRoomDocSchema>;
export type FundLpDataRoomDoc = typeof fundLpDataRoomDocsTable.$inferSelect;

export const insertFundLpMessageSchema = createInsertSchema(fundLpMessagesTable).omit({ id: true, sentAt: true });
export type InsertFundLpMessage = z.infer<typeof insertFundLpMessageSchema>;
export type FundLpMessage = typeof fundLpMessagesTable.$inferSelect;

export const insertFundLpActivityEventSchema = createInsertSchema(fundLpActivityEventsTable).omit({ id: true, occurredAt: true });
export type InsertFundLpActivityEvent = z.infer<typeof insertFundLpActivityEventSchema>;
export type FundLpActivityEvent = typeof fundLpActivityEventsTable.$inferSelect;
