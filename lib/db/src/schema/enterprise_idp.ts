import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { azureTenantsTable } from './azure_tenants.js';

/**
 * Enterprise IdP Registry — MCP Enterprise-Managed Authorization
 *
 * Each row represents an approved enterprise identity provider (OIDC/JWT) that
 * is allowed to issue ID-JAG assertions for MCP gateway access.
 *
 * The ID-JAG flow (RFC urn:ietf:params:oauth:grant-type:jwt-bearer) allows
 * employees to authenticate once with their corporate SSO and exchange an
 * IdP-issued JWT for a scoped MCP access token — without per-server auth prompts.
 */
export const enterpriseIdpRegistryTable = pgTable('enterprise_idp_registry', {
  id: serial('id').primaryKey(),

  tenantId: integer('tenant_id')
    .notNull()
    .references(() => azureTenantsTable.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),

  issuerUrl: text('issuer_url').notNull(),

  jwksUri: text('jwks_uri').notNull(),

  expectedAudience: text('expected_audience').notNull(),

  allowedRedirectUris: jsonb('allowed_redirect_uris').default('[]'),

  claimsToRoleMapping: jsonb('claims_to_role_mapping').default('{}'),

  autoProvisionUsers: boolean('auto_provision_users').notNull().default(false),

  defaultRole: text('default_role').notNull().default('viewer'),

  enabled: boolean('enabled').notNull().default(true),

  jwksCacheTtlSeconds: integer('jwks_cache_ttl_seconds').notNull().default(3600),

  requireEmailVerified: boolean('require_email_verified').notNull().default(true),

  notes: text('notes'),

  createdByUserId: integer('created_by_user_id'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Audit log for all ID-JAG exchange events and MCP token issuances via the
 * enterprise-managed authorization flow.
 */
export const mcpEnterpriseAuditTable = pgTable('mcp_enterprise_audit', {
  id: serial('id').primaryKey(),

  tenantId: integer('tenant_id').references(() => azureTenantsTable.id, { onDelete: 'set null' }),

  idpId: integer('idp_id').references(() => enterpriseIdpRegistryTable.id, { onDelete: 'set null' }),

  eventType: text('event_type', {
    enum: [
      'idjag_validation_success',
      'idjag_validation_failure',
      'token_issued',
      'token_revoked',
      'user_linked',
      'user_provisioned',
      'revocation_webhook',
    ],
  }).notNull(),

  issuer: text('issuer'),

  subject: text('subject'),

  email: text('email'),

  mappedRole: text('mapped_role'),

  mcpScope: text('mcp_scope'),

  userId: integer('user_id'),

  errorCode: text('error_code'),

  errorMessage: text('error_message'),

  metadata: jsonb('metadata').default('{}'),

  ipAddress: text('ip_address'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Revocation registry — subjects that have been revoked at the IdP level.
 * The MCP token validation layer checks this table on every request to implement
 * centralized revocation without requiring token expiry.
 */
export const mcpRevokedSubjectsTable = pgTable('mcp_revoked_subjects', {
  id: serial('id').primaryKey(),

  tenantId: integer('tenant_id').references(() => azureTenantsTable.id, { onDelete: 'cascade' }),

  idpId: integer('idp_id').references(() => enterpriseIdpRegistryTable.id, { onDelete: 'cascade' }),

  issuer: text('issuer').notNull(),

  subject: text('subject').notNull(),

  revokedAt: timestamp('revoked_at').notNull().defaultNow(),

  revokedBy: text('revoked_by'),

  reason: text('reason'),
});

export const insertEnterpriseIdpSchema = createInsertSchema(enterpriseIdpRegistryTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEnterpriseIdp = z.infer<typeof insertEnterpriseIdpSchema>;
export type EnterpriseIdp = typeof enterpriseIdpRegistryTable.$inferSelect;

export const insertMcpEnterpriseAuditSchema = createInsertSchema(mcpEnterpriseAuditTable).omit({
  id: true,
  createdAt: true,
});
export type InsertMcpEnterpriseAudit = z.infer<typeof insertMcpEnterpriseAuditSchema>;
