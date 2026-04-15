import {
  pgTable, text, serial, timestamp, integer, boolean, jsonb, unique, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";
import { usersTable } from "./auth";

/**
 * Partner Portal — Multi-Tenancy & White-Label Extension Tables
 *
 * org_branding            — per-org white-label configuration (logo, colors, CSS, app name)
 * org_custom_domains      — tenant custom domain mapping + verification state
 * partner_accounts        — reseller/agency accounts that manage multiple orgs
 * partner_org_assignments — many-to-many: partners <> managed orgs
 */

// ─── Org Branding ─────────────────────────────────────────────────────────────

export const orgBrandingTable = pgTable("org_branding", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }).unique(),
  appName: text("app_name"),
  tagline: text("tagline"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").notNull().default("#6366f1"),
  secondaryColor: text("secondary_color").notNull().default("#7c3aed"),
  accentColor: text("accent_color").notNull().default("#06b6d4"),
  backgroundColor: text("background_color").notNull().default("#0f172a"),
  surfaceColor: text("surface_color").notNull().default("#1e293b"),
  textColor: text("text_color").notNull().default("#f8fafc"),
  customCss: text("custom_css"),
  emailFromName: text("email_from_name"),
  emailFooterText: text("email_footer_text"),
  supportEmail: text("support_email"),
  supportUrl: text("support_url"),
  privacyUrl: text("privacy_url"),
  termsUrl: text("terms_url"),
  isActive: boolean("is_active").notNull().default(true),
  updatedByUserId: integer("updated_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("org_branding_org_id_idx").on(t.orgId),
]);

// ─── Custom Domains ───────────────────────────────────────────────────────────

export const orgCustomDomainsTable = pgTable("org_custom_domains", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  status: text("status", { enum: ["pending_verification", "verified", "active", "failed", "disabled"] }).notNull().default("pending_verification"),
  verificationMethod: text("verification_method", { enum: ["dns_txt", "dns_cname", "http_file"] }).notNull().default("dns_txt"),
  verificationToken: text("verification_token").notNull(),
  verificationRecord: text("verification_record"),
  sslStatus: text("ssl_status", { enum: ["pending", "provisioning", "active", "failed", "expired"] }).notNull().default("pending"),
  sslProvider: text("ssl_provider"),
  sslExpiresAt: timestamp("ssl_expires_at"),
  lastVerifiedAt: timestamp("last_verified_at"),
  lastCheckAt: timestamp("last_check_at"),
  failureReason: text("failure_reason"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("org_custom_domains_domain_idx").on(t.domain),
  index("org_custom_domains_org_id_idx").on(t.orgId),
  index("org_custom_domains_status_idx").on(t.status),
]);

// ─── Partner Accounts ─────────────────────────────────────────────────────────

export const partnerAccountsTable = pgTable("partner_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  ownerUserId: integer("owner_user_id").notNull().references(() => usersTable.id, { onDelete: "restrict" }),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "set null" }),
  status: text("status", { enum: ["active", "suspended", "pending_approval"] }).notNull().default("pending_approval"),
  tier: text("tier", { enum: ["referral", "reseller", "white_label", "oem"] }).notNull().default("reseller"),
  commissionRate: text("commission_rate").notNull().default("0.20"),
  maxManagedTenants: integer("max_managed_tenants").notNull().default(10),
  contactEmail: text("contact_email"),
  contactName: text("contact_name"),
  website: text("website"),
  notes: text("notes"),
  metadata: jsonb("metadata").default("{}"),
  approvedAt: timestamp("approved_at"),
  approvedByUserId: integer("approved_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("partner_accounts_slug_idx").on(t.slug),
  index("partner_accounts_owner_idx").on(t.ownerUserId),
  index("partner_accounts_status_idx").on(t.status),
]);

// ─── Partner ↔ Org Assignments ────────────────────────────────────────────────

export const partnerOrgAssignmentsTable = pgTable("partner_org_assignments", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => partnerAccountsTable.id, { onDelete: "cascade" }),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  accessLevel: text("access_level", { enum: ["view", "manage", "admin"] }).notNull().default("manage"),
  provisionedByUserId: integer("provisioned_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  unique("partner_org_assignments_uq").on(t.partnerId, t.orgId),
  index("partner_org_assignments_partner_idx").on(t.partnerId),
  index("partner_org_assignments_org_idx").on(t.orgId),
]);

// ─── Partner Users ────────────────────────────────────────────────────────────

export const partnerUsersTable = pgTable("partner_users", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => partnerAccountsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "admin", "member"] }).notNull().default("member"),
  invitedByUserId: integer("invited_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (t) => [
  unique("partner_users_uq").on(t.partnerId, t.userId),
  index("partner_users_partner_idx").on(t.partnerId),
  index("partner_users_user_idx").on(t.userId),
]);

// ─── Zod Schemas & Types ──────────────────────────────────────────────────────

export const insertOrgBrandingSchema = createInsertSchema(orgBrandingTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrgBranding = z.infer<typeof insertOrgBrandingSchema>;
export type OrgBranding = typeof orgBrandingTable.$inferSelect;

export const insertOrgCustomDomainSchema = createInsertSchema(orgCustomDomainsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrgCustomDomain = z.infer<typeof insertOrgCustomDomainSchema>;
export type OrgCustomDomain = typeof orgCustomDomainsTable.$inferSelect;

export const insertPartnerAccountSchema = createInsertSchema(partnerAccountsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPartnerAccount = z.infer<typeof insertPartnerAccountSchema>;
export type PartnerAccount = typeof partnerAccountsTable.$inferSelect;

export const insertPartnerOrgAssignmentSchema = createInsertSchema(partnerOrgAssignmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPartnerOrgAssignment = z.infer<typeof insertPartnerOrgAssignmentSchema>;
export type PartnerOrgAssignment = typeof partnerOrgAssignmentsTable.$inferSelect;

export const insertPartnerUserSchema = createInsertSchema(partnerUsersTable).omit({ id: true, joinedAt: true });
export type InsertPartnerUser = z.infer<typeof insertPartnerUserSchema>;
export type PartnerUser = typeof partnerUsersTable.$inferSelect;

export type PartnerTier = "referral" | "reseller" | "white_label" | "oem";
export type PartnerStatus = "active" | "suspended" | "pending_approval";
export type DomainStatus = "pending_verification" | "verified" | "active" | "failed" | "disabled";
export type SslStatus = "pending" | "provisioning" | "active" | "failed" | "expired";
