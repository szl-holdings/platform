import { pgTable, text, serial, timestamp, integer, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const organizationsTable = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  domain: text("domain"),
  orgType: text("org_type"),
  status: text("status", { enum: ["active", "inactive", "suspended"] }).notNull().default("active"),
  plan: text("plan", { enum: ["free", "starter", "professional", "enterprise"] }).notNull().default("free"),
  billingCustomerId: text("billing_customer_id"),
  mfaRequired: boolean("mfa_required").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orgMembersTable = pgTable("org_members", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "admin", "member", "viewer"] }).notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (t) => [unique("org_members_org_user_uq").on(t.orgId, t.userId)]);

export const organizationMembershipsTable = pgTable("organization_memberships", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["public", "authenticated", "member", "client", "editor", "admin", "super_admin"] }).notNull().default("member"),
  status: text("status", { enum: ["active", "invited", "suspended"] }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizationsTable.$inferSelect;

export const insertOrgMemberSchema = createInsertSchema(orgMembersTable).omit({ id: true, joinedAt: true });
export type InsertOrgMember = z.infer<typeof insertOrgMemberSchema>;
export type OrgMember = typeof orgMembersTable.$inferSelect;

export const insertOrganizationMembershipSchema = createInsertSchema(organizationMembershipsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganizationMembership = z.infer<typeof insertOrganizationMembershipSchema>;
export type OrganizationMembership = typeof organizationMembershipsTable.$inferSelect;

export type CmsRole = "public" | "authenticated" | "member" | "client" | "editor" | "admin" | "super_admin";

export const CMS_ROLES: CmsRole[] = ["public", "authenticated", "member", "client", "editor", "admin", "super_admin"];

export const CMS_ROLE_HIERARCHY: Record<CmsRole, number> = {
  public: 0,
  authenticated: 1,
  member: 2,
  client: 2,
  editor: 3,
  admin: 4,
  super_admin: 5,
};

export function hasRequiredRole(userRole: CmsRole, requiredRole: CmsRole): boolean {
  return CMS_ROLE_HIERARCHY[userRole] >= CMS_ROLE_HIERARCHY[requiredRole];
}

export function canManageContent(role: CmsRole): boolean {
  return hasRequiredRole(role, "editor");
}

export function canAdminSite(role: CmsRole): boolean {
  return hasRequiredRole(role, "admin");
}

export function isSuperAdmin(role: CmsRole): boolean {
  return role === "super_admin";
}
