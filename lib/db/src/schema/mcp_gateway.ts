import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const mcpGatewayApiKeysTable = pgTable(
  'mcp_gateway_api_keys',
  {
    id: serial('id').primaryKey(),
    keyId: text('key_id').notNull().unique(),
    label: text('label').notNull(),
    keyHash: text('key_hash').notNull().unique(),
    prefix: text('prefix').notNull(),
    tenantId: text('tenant_id').notNull(),
    scopes: text('scopes').array().notNull(),
    rateLimit: integer('rate_limit').notNull().default(120),
    revoked: boolean('revoked').notNull().default(false),
    revokedAt: timestamp('revoked_at'),
    lastUsedAt: timestamp('last_used_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('mcp_gw_keys_tenant_idx').on(t.tenantId),
    index('mcp_gw_keys_hash_idx').on(t.keyHash),
  ],
);

export const mcpGatewayToolCallsTable = pgTable(
  'mcp_gateway_tool_calls',
  {
    id: serial('id').primaryKey(),
    callId: text('call_id').notNull().unique(),
    connectionId: text('connection_id').notNull(),
    tenantId: text('tenant_id').notNull(),
    agentName: text('agent_name').notNull(),
    toolName: text('tool_name').notNull(),
    parameters: jsonb('parameters').default({}),
    riskLevel: text('risk_level').notNull(),
    riskClasses: text('risk_classes').array().notNull().default([]),
    disposition: text('disposition').notNull(),
    approvalId: text('approval_id'),
    proofPacketId: text('proof_packet_id'),
    resultHash: text('result_hash'),
    latencyMs: integer('latency_ms').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('mcp_gw_calls_tenant_idx').on(t.tenantId),
    index('mcp_gw_calls_connection_idx').on(t.connectionId),
  ],
);

export const mcpGatewayProofPacketsTable = pgTable(
  'mcp_gateway_proof_packets',
  {
    id: serial('id').primaryKey(),
    packetId: text('packet_id').notNull().unique(),
    callId: text('call_id').notNull(),
    tenantId: text('tenant_id').notNull(),
    connectionId: text('connection_id').notNull(),
    agentName: text('agent_name').notNull(),
    toolName: text('tool_name').notNull(),
    disposition: text('disposition').notNull(),
    riskLevel: text('risk_level').notNull(),
    callerIdentity: text('caller_identity').notNull(),
    parametersHash: text('parameters_hash').notNull(),
    resultHash: text('result_hash'),
    previousHash: text('previous_hash'),
    proofHash: text('proof_hash').notNull(),
    witnessedBy: text('witnessed_by').array().notNull().default([]),
    attestedAt: text('attested_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('mcp_gw_proofs_tenant_idx').on(t.tenantId),
    index('mcp_gw_proofs_call_idx').on(t.callId),
  ],
);

export const mcpGatewayApprovalsTable = pgTable(
  'mcp_gateway_approvals',
  {
    id: serial('id').primaryKey(),
    approvalId: text('approval_id').notNull().unique(),
    callId: text('call_id').notNull(),
    tenantId: text('tenant_id').notNull(),
    connectionId: text('connection_id').notNull(),
    agentName: text('agent_name').notNull(),
    toolName: text('tool_name').notNull(),
    parameters: jsonb('parameters').default({}),
    riskLevel: text('risk_level').notNull(),
    riskClasses: text('risk_classes').array().notNull().default([]),
    requiredTier: text('required_tier').notNull(),
    status: text('status').notNull().default('pending'),
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at'),
    reviewNote: text('review_note'),
    proofPacketId: text('proof_packet_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('mcp_gw_approvals_tenant_idx').on(t.tenantId),
    index('mcp_gw_approvals_status_idx').on(t.status),
  ],
);

export type McpGatewayApiKey = typeof mcpGatewayApiKeysTable.$inferSelect;
export type McpGatewayToolCall = typeof mcpGatewayToolCallsTable.$inferSelect;
export type McpGatewayProofPacket = typeof mcpGatewayProofPacketsTable.$inferSelect;
export type McpGatewayApproval = typeof mcpGatewayApprovalsTable.$inferSelect;
