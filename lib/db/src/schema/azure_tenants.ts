import { pgTable, text, serial, integer, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const azureTenantsTable = pgTable("azure_tenants", {
  id: serial("id").primaryKey(),
  azureTenantId: text("azure_tenant_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  domain: text("domain"),
  status: text("status", { enum: ["pending", "active", "suspended"] }).notNull().default("pending"),
  adminConsentGranted: text("admin_consent_granted", { enum: ["pending", "granted", "revoked"] }).notNull().default("pending"),
  organizationId: integer("organization_id").references(() => organizationsTable.id, { onDelete: "set null" }),
  config: jsonb("config").default("{}"),
  provisionedAt: timestamp("provisioned_at"),
  provisionedByUserId: text("provisioned_by_user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("azure_tenants_tenant_id_idx").on(table.azureTenantId),
]);

export const dataverseConnectionsTable = pgTable("dataverse_connections", {
  id: serial("id").primaryKey(),
  azureTenantId: text("azure_tenant_id").notNull(),
  orgUrl: text("org_url").notNull(),
  orgName: text("org_name"),
  authMethod: text("auth_method", { enum: ["client_credentials", "delegated"] }).notNull().default("client_credentials"),
  clientId: text("client_id"),
  clientSecret: text("client_secret"),
  status: text("status", { enum: ["pending", "active", "error", "disconnected"] }).notNull().default("pending"),
  syncConfig: jsonb("sync_config").default("{}"),
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: text("last_sync_status"),
  lastSyncError: text("last_sync_error"),
  entitySyncCounts: jsonb("entity_sync_counts").default("{}"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAzureTenantSchema = createInsertSchema(azureTenantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAzureTenant = z.infer<typeof insertAzureTenantSchema>;
export type AzureTenant = typeof azureTenantsTable.$inferSelect;

export const insertDataverseConnectionSchema = createInsertSchema(dataverseConnectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDataverseConnection = z.infer<typeof insertDataverseConnectionSchema>;
export type DataverseConnection = typeof dataverseConnectionsTable.$inferSelect;

export type AzureTenantStatus = "pending" | "active" | "suspended";
export type DataverseConnectionStatus = "pending" | "active" | "error" | "disconnected";
export type DataverseAuthMethod = "client_credentials" | "delegated";
