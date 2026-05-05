import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

// Signature status for a row (computed, not stored)
export type AuditChainSigStatus = 'hybrid_verified' | 'legacy_unsigned' | 'broken';

export type AuditChainActionType =
  | 'ai_decision'
  | 'agent_action'
  | 'cross_domain_correlation'
  | 'data_access'
  | 'config_change'
  | 'policy_violation'
  | 'alert_triggered'
  | 'compliance_check';

export type AuditChainDomain =
  | 'vessels'
  | 'firestorm'
  | 'terra'
  | 'lyte'
  | 'inca'
  | 'szl-holdings'
  | 'prism-counsel'
  | 'carlota-jo'
  | 'platform';

export type AuditChainRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type AuditChainComplianceTag = 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'CCPA' | 'PCI-DSS';

/**
 * audit_chain_events — immutable, server-side SHA-256 hash-chained audit log.
 *
 * Each event stores:
 *   - A SHA-256 hash of (prevHash + content) computed server-side
 *   - The previous event's hash (genesis = 'genesis')
 *   - Compliance framework tags for filtered reporting
 *
 * The chain integrity can be verified by recomputing hashes server-side.
 * Rows are append-only: no UPDATE or DELETE is performed on this table.
 */
export const auditChainEventsTable = pgTable(
  'audit_chain_events',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    actorUserId: integer('actor_user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    actorLabel: text('actor_label').notNull(),
    action: text('action').notNull(),
    actionType: text('action_type').notNull(),
    domain: text('domain').notNull(),
    entityId: text('entity_id'),
    entityType: text('entity_type'),
    riskLevel: text('risk_level').notNull().default('low'),
    complianceTags: jsonb('compliance_tags').notNull().default([]),
    outcome: text('outcome').notNull().default('success'),
    details: text('details'),
    metadata: jsonb('metadata').default({}),
    prevHash: text('prev_hash').notNull().default('genesis'),
    eventHash: text('event_hash').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    // Hybrid-signature columns (nullable — NULL = legacy_unsigned, populated = hybrid_verified)
    ed25519Sig: text('ed25519_sig'),
    mldsa65Sig: text('mldsa65_sig'),
    signingDid: text('signing_did'),
    keyId: text('key_id'),
    schemeVersion: text('scheme_version'),
    sigPublicKeyEd25519: text('sig_public_key_ed25519'),
    sigPublicKeyMldsa65: text('sig_public_key_mldsa65'),
  },
  (table) => [
    index('audit_chain_org_idx').on(table.orgId),
    index('audit_chain_action_type_idx').on(table.actionType),
    index('audit_chain_domain_idx').on(table.domain),
    index('audit_chain_risk_level_idx').on(table.riskLevel),
    index('audit_chain_created_at_idx').on(table.createdAt),
    index('audit_chain_signing_did_idx').on(table.signingDid),
    index('audit_chain_sig_scheme_idx').on(table.schemeVersion),
  ],
);

export const insertAuditChainEventSchema = createInsertSchema(auditChainEventsTable).omit({
  id: true,
  prevHash: true,
  eventHash: true,
  createdAt: true,
});
export type InsertAuditChainEvent = z.infer<typeof insertAuditChainEventSchema>;
export type AuditChainEvent = typeof auditChainEventsTable.$inferSelect;
