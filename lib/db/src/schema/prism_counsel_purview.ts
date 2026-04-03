import { pgTable, text, serial, timestamp, integer, numeric, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { pcMattersTable, pcConnectorAccountsTable } from "./prism_counsel";

export const pcPurviewCaseLinksTable = pgTable("pc_purview_case_links", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  eDiscoveryCaseId: text("ediscovery_case_id").notNull(),
  eDiscoveryCaseName: text("ediscovery_case_name"),
  purviewTenantId: text("purview_tenant_id"),
  linkStatus: text("link_status", { enum: ["active", "closed", "pending", "error"] }).notNull().default("active"),
  linkedBy: integer("linked_by"),
  linkNotes: text("link_notes"),
  provenanceSource: text("provenance_source").notNull().default("manual"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("pc_purview_case_links_matter_idx").on(table.matterId),
  index("pc_purview_case_links_org_idx").on(table.orgId),
  index("pc_purview_case_links_ediscovery_idx").on(table.eDiscoveryCaseId),
]);

export const pcPurviewHoldAwarenessTable = pgTable("pc_purview_hold_awareness", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  caseLinkId: integer("case_link_id").references(() => pcPurviewCaseLinksTable.id),
  holdId: text("hold_id"),
  holdName: text("hold_name").notNull(),
  holdScope: text("hold_scope"),
  holdStatus: text("hold_status", { enum: ["active", "released", "pending", "error"] }).notNull().default("active"),
  custodians: jsonb("custodians"),
  contentSources: jsonb("content_sources"),
  issuedBy: text("issued_by"),
  issuedAt: timestamp("issued_at"),
  releasedAt: timestamp("released_at"),
  provenanceSource: text("provenance_source").notNull().default("purview_api"),
  auditTag: text("audit_tag"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("pc_purview_hold_matter_idx").on(table.matterId),
  index("pc_purview_hold_org_idx").on(table.orgId),
  index("pc_purview_hold_status_idx").on(table.holdStatus),
]);

export const pcPurviewExportHandoffsTable = pgTable("pc_purview_export_handoffs", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  caseLinkId: integer("case_link_id").references(() => pcPurviewCaseLinksTable.id),
  exportJobId: text("export_job_id"),
  exportName: text("export_name").notNull(),
  exportFormat: text("export_format", { enum: ["PST", "EML", "Relativity_RSMF", "native", "PDF", "custom"] }).notNull(),
  exportStatus: text("export_status", { enum: ["pending", "in_progress", "ready", "transferred", "failed", "expired"] }).notNull().default("pending"),
  documentCount: integer("document_count"),
  sizeBytes: integer("size_bytes"),
  handoffDestination: text("handoff_destination"),
  handoffMethod: text("handoff_method", { enum: ["secure_link", "sftp", "azure_blob", "manual"] }),
  handoffCompletedAt: timestamp("handoff_completed_at"),
  handoffCompletedBy: integer("handoff_completed_by"),
  provenanceRecord: jsonb("provenance_record"),
  auditTag: text("audit_tag"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("pc_purview_export_matter_idx").on(table.matterId),
  index("pc_purview_export_org_idx").on(table.orgId),
  index("pc_purview_export_status_idx").on(table.exportStatus),
]);

export const pcPurviewScopeLinksTable = pgTable("pc_purview_scope_links", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  matterId: integer("matter_id").notNull().references(() => pcMattersTable.id, { onDelete: "cascade" }),
  caseLinkId: integer("case_link_id").references(() => pcPurviewCaseLinksTable.id),
  contentSourceType: text("content_source_type", { enum: ["mailbox", "sharepoint_site", "onedrive", "teams_channel", "teams_chat", "public_folder", "custom"] }).notNull(),
  contentSourceId: text("content_source_id").notNull(),
  contentSourceName: text("content_source_name"),
  inScope: boolean("in_scope").notNull().default(true),
  reviewSetId: text("review_set_id"),
  reviewSetName: text("review_set_name"),
  reviewSetStatus: text("review_set_status", { enum: ["pending", "in_review", "complete", "exported"] }),
  documentCount: integer("document_count"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("pc_purview_scope_matter_idx").on(table.matterId),
  index("pc_purview_scope_org_idx").on(table.orgId),
]);

export const pcPurviewDiagnosticsTable = pgTable("pc_purview_diagnostics", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  connectorAccountId: integer("connector_account_id").references(() => pcConnectorAccountsTable.id),
  checkType: text("check_type", { enum: ["connection", "permissions", "case_access", "export_access", "hold_access", "review_set_access", "token_validity"] }).notNull(),
  status: text("status", { enum: ["pass", "warn", "fail", "unknown"] }).notNull(),
  details: jsonb("details"),
  requiredScopes: jsonb("required_scopes"),
  grantedScopes: jsonb("granted_scopes"),
  errorMessage: text("error_message"),
  recoveryHint: text("recovery_hint"),
  replayPath: text("replay_path"),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
  nextCheckAt: timestamp("next_check_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("pc_purview_diag_org_idx").on(table.orgId),
  index("pc_purview_diag_status_idx").on(table.status),
  index("pc_purview_diag_check_idx").on(table.checkType),
]);

export type PcPurviewCaseLink = typeof pcPurviewCaseLinksTable.$inferSelect;
export type PcPurviewHoldAwareness = typeof pcPurviewHoldAwarenessTable.$inferSelect;
export type PcPurviewExportHandoff = typeof pcPurviewExportHandoffsTable.$inferSelect;
export type PcPurviewScopeLink = typeof pcPurviewScopeLinksTable.$inferSelect;
export type PcPurviewDiagnostic = typeof pcPurviewDiagnosticsTable.$inferSelect;
