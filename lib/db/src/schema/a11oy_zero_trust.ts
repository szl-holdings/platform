import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const a11oyAgentIdentitiesTable = pgTable(
  'a11oy_agent_identities',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull().unique(),
    agentName: text('agent_name').notNull(),
    publicKey: text('public_key').notNull(),
    publicKeyAlgorithm: text('public_key_algorithm').notNull().default('Ed25519'),
    keyFingerprint: text('key_fingerprint').notNull(),
    capabilities: jsonb('capabilities').default([]),
    maxAutonomy: text('max_autonomy', {
      enum: ['recommend_only', 'execute_approved', 'full_demo_autopilot'],
    }).notNull().default('recommend_only'),
    certId: text('cert_id'),
    certIssuer: text('cert_issuer'),
    certIssuedAt: timestamp('cert_issued_at'),
    certExpiresAt: timestamp('cert_expires_at'),
    certSignatureHex: text('cert_signature_hex'),
    certPayload: text('cert_payload'),
    attestationStatus: text('attestation_status', {
      enum: ['valid', 'expired', 'revoked', 'pending'],
    }).notNull().default('pending'),
    domain: text('domain'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_agent_id_status_idx').on(t.attestationStatus),
    index('a11oy_agent_id_domain_idx').on(t.domain),
  ],
);

export type A11oyAgentIdentity = typeof a11oyAgentIdentitiesTable.$inferSelect;
export type InsertA11oyAgentIdentity = typeof a11oyAgentIdentitiesTable.$inferInsert;
export const insertA11oyAgentIdentitySchema = createInsertSchema(a11oyAgentIdentitiesTable);
export type InsertA11oyAgentIdentityInput = z.infer<typeof insertA11oyAgentIdentitySchema>;

export const a11oyHfAccessAuditTable = pgTable(
  'a11oy_hf_access_audit',
  {
    id: serial('id').primaryKey(),
    externalId: text('external_id').notNull().unique(),
    agentId: text('agent_id').notNull(),
    agentName: text('agent_name').notNull(),
    resourceUri: text('resource_uri').notNull(),
    resourceType: text('resource_type', {
      enum: ['model', 'dataset', 'space'],
    }).notNull(),
    purpose: text('purpose').notNull(),
    identityToken: text('identity_token'),
    durationMs: integer('duration_ms').notNull().default(0),
    success: boolean('success').notNull().default(true),
    proofHash: text('proof_hash').notNull(),
    metadata: jsonb('metadata').default({}),
    accessedAt: timestamp('accessed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_hf_audit_agent_idx').on(t.agentId),
    index('a11oy_hf_audit_resource_type_idx').on(t.resourceType),
    index('a11oy_hf_audit_accessed_idx').on(t.accessedAt),
    index('a11oy_hf_audit_success_idx').on(t.success),
  ],
);

export type A11oyHfAccessAudit = typeof a11oyHfAccessAuditTable.$inferSelect;
export type InsertA11oyHfAccessAudit = typeof a11oyHfAccessAuditTable.$inferInsert;
export const insertA11oyHfAccessAuditSchema = createInsertSchema(a11oyHfAccessAuditTable);

export const a11oyProvenanceNodesTable = pgTable(
  'a11oy_provenance_nodes',
  {
    id: serial('id').primaryKey(),
    nodeId: text('node_id').notNull().unique(),
    kind: text('kind', {
      enum: ['base_model', 'dataset', 'fine_tuned_model', 'evaluation', 'deployment', 'agent'],
    }).notNull(),
    label: text('label').notNull(),
    description: text('description').notNull().default(''),
    proofHash: text('proof_hash').notNull(),
    metadata: jsonb('metadata').default({}),
    nodeCreatedAt: timestamp('node_created_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_prov_node_kind_idx').on(t.kind),
  ],
);

export type A11oyProvenanceNode = typeof a11oyProvenanceNodesTable.$inferSelect;
export type InsertA11oyProvenanceNode = typeof a11oyProvenanceNodesTable.$inferInsert;
export const insertA11oyProvenanceNodeSchema = createInsertSchema(a11oyProvenanceNodesTable);

export const a11oyProvenanceEdgesTable = pgTable(
  'a11oy_provenance_edges',
  {
    id: serial('id').primaryKey(),
    edgeId: text('edge_id').notNull().unique(),
    sourceNodeId: text('source_node_id').notNull(),
    targetNodeId: text('target_node_id').notNull(),
    relation: text('relation', {
      enum: ['trained_on', 'evaluated_by', 'deployed_under', 'accessed_by', 'fine_tuned_from', 'derived_from'],
    }).notNull(),
    proofHash: text('proof_hash').notNull(),
    signerAgentId: text('signer_agent_id'),
    signerFingerprint: text('signer_fingerprint'),
    edgeSignatureHex: text('edge_signature_hex'),
    metadata: jsonb('metadata').default({}),
    edgeTimestamp: timestamp('edge_timestamp').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_prov_edge_source_idx').on(t.sourceNodeId),
    index('a11oy_prov_edge_target_idx').on(t.targetNodeId),
    index('a11oy_prov_edge_relation_idx').on(t.relation),
  ],
);

export type A11oyProvenanceEdge = typeof a11oyProvenanceEdgesTable.$inferSelect;
export type InsertA11oyProvenanceEdge = typeof a11oyProvenanceEdgesTable.$inferInsert;
export const insertA11oyProvenanceEdgeSchema = createInsertSchema(a11oyProvenanceEdgesTable);

export const a11oyAgentReputationTable = pgTable(
  'a11oy_agent_reputation',
  {
    id: serial('id').primaryKey(),
    agentId: text('agent_id').notNull(),
    agentName: text('agent_name').notNull(),
    overallScore: real('overall_score').notNull().default(0),
    successfulDeployments: integer('successful_deployments').notNull().default(0),
    totalDeployments: integer('total_deployments').notNull().default(0),
    evaluationPassRate: real('evaluation_pass_rate').notNull().default(0),
    governanceComplianceRate: real('governance_compliance_rate').notNull().default(0),
    costEfficiency: real('cost_efficiency').notNull().default(0),
    provenanceDepth: integer('provenance_depth').notNull().default(0),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('a11oy_reputation_agent_idx').on(t.agentId),
    index('a11oy_reputation_score_idx').on(t.overallScore),
    index('a11oy_reputation_computed_idx').on(t.computedAt),
  ],
);

export type A11oyAgentReputation = typeof a11oyAgentReputationTable.$inferSelect;
export type InsertA11oyAgentReputation = typeof a11oyAgentReputationTable.$inferInsert;
export const insertA11oyAgentReputationSchema = createInsertSchema(a11oyAgentReputationTable);
