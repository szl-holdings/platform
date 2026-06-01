/**
 * NEXUS Unified Intelligence Protocol v1 — Zod schemas and inferred types.
 *
 * These schemas define the request/response contract for the single-endpoint
 * API at /api/nexus/v1/*. Import from @szl-holdings/api-zod for typed clients.
 */

import { z } from 'zod';

// ─── Autonomy mode ────────────────────────────────────────────────────────────

export const NexusAutonomyModeSchema = z.enum(['observe', 'advise', 'act', 'auto']);
export type NexusAutonomyMode = z.infer<typeof NexusAutonomyModeSchema>;

// ─── Domains ──────────────────────────────────────────────────────────────────

export const NexusDomainSchema = z.enum([
  'vessels',
  'terra',
  'counsel',
  'sentra',
  'pulse',
  'aegis',
  'alloy',
  'lyte',
  'command',
]);
export type NexusDomain = z.infer<typeof NexusDomainSchema>;

// ─── Evidence reference ───────────────────────────────────────────────────────

export const NexusEvidenceRefSchema = z.object({
  id: z.string(),
  domain: z.string(),
  type: z.enum(['data_point', 'document', 'signal', 'decision', 'alert', 'tool_output']),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  source_url: z.string().optional(),
  retrieved_at: z.string(),
});
export type NexusEvidenceRef = z.infer<typeof NexusEvidenceRefSchema>;

// ─── Tool call record ─────────────────────────────────────────────────────────

export const NexusToolCallSchema = z.object({
  tool_id: z.string(),
  tool_name: z.string(),
  domain: z.string(),
  input: z.record(z.unknown()),
  output: z.unknown().optional(),
  status: z.enum(['pending', 'success', 'failed']),
  duration_ms: z.number().optional(),
});
export type NexusToolCall = z.infer<typeof NexusToolCallSchema>;

// ─── Governance envelope ──────────────────────────────────────────────────────

export const NexusGovernanceSchema = z.object({
  mode: NexusAutonomyModeSchema,
  approval_required: z.boolean(),
  approval_level: z.enum(['none', 'operator', 'admin', 'board']).optional(),
  policy_checks_passed: z.boolean(),
  proof_chain_ref: z.string().nullable(),
  audit_trail_id: z.string().nullable(),
});
export type NexusGovernance = z.infer<typeof NexusGovernanceSchema>;

// ─── Session ──────────────────────────────────────────────────────────────────

export const NexusSessionSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  domains_touched: z.array(NexusDomainSchema.or(z.string())),
  context_summary: z.string(),
  decision_graph: z.array(
    z.object({
      turn: z.number(),
      query: z.string(),
      domains_consulted: z.array(z.string()),
      action_taken: z.string().nullable(),
      timestamp: z.string(),
    }),
  ),
  turn_count: z.number(),
  org_id: z.number().nullable(),
});
export type NexusSession = z.infer<typeof NexusSessionSchema>;

// ─── Query request / response ─────────────────────────────────────────────────

export const NexusQueryRequestSchema = z.object({
  input: z.string().min(1).max(8000),
  mode: NexusAutonomyModeSchema.default('observe'),
  domains: z.array(NexusDomainSchema.or(z.string())).optional(),
  stream: z.boolean().default(false),
  session_id: z.string().optional(),
  depth: z.enum(['shallow', 'standard', 'deep']).default('standard'),
  context: z.string().optional(),
});
export type NexusQueryRequest = z.infer<typeof NexusQueryRequestSchema>;

export const NexusQueryResponseSchema = z.object({
  query_id: z.string(),
  session_id: z.string(),
  answer: z.string(),
  evidence: z.array(NexusEvidenceRefSchema),
  confidence: z.number().min(0).max(1),
  domains_consulted: z.array(z.string()),
  tool_calls: z.array(NexusToolCallSchema),
  governance: NexusGovernanceSchema,
  recommended_actions: z
    .array(
      z.object({
        action: z.string(),
        domain: z.string(),
        reason: z.string(),
        confidence: z.number(),
        requires_approval: z.boolean(),
      }),
    )
    .optional(),
  latency_ms: z.number(),
  model: z.string(),
  created_at: z.string(),
});
export type NexusQueryResponse = z.infer<typeof NexusQueryResponseSchema>;

// ─── Action request / response ────────────────────────────────────────────────

export const NexusActionRequestSchema = z.object({
  action: z.string().min(1),
  params: z.record(z.unknown()).default({}),
  evidence_refs: z.array(z.string()).optional(),
  session_id: z.string().optional(),
  mode: NexusAutonomyModeSchema.default('act'),
  dry_run: z.boolean().default(false),
});
export type NexusActionRequest = z.infer<typeof NexusActionRequestSchema>;

export const NexusActionResponseSchema = z.object({
  action_id: z.string(),
  action: z.string(),
  status: z.enum(['queued', 'pending_approval', 'executing', 'completed', 'failed', 'dry_run']),
  result: z.unknown().nullable(),
  approval_required: z.boolean(),
  approval_level: z.string().nullable(),
  proof_chain_ref: z.string().nullable(),
  audit_trail_id: z.string().nullable(),
  domain: z.string(),
  latency_ms: z.number(),
  created_at: z.string(),
});
export type NexusActionResponse = z.infer<typeof NexusActionResponseSchema>;

// ─── Capability ───────────────────────────────────────────────────────────────

export const NexusCapabilitySchema = z.object({
  domain: z.string(),
  display_name: z.string(),
  description: z.string(),
  tools: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      input_schema: z.record(z.unknown()),
    }),
  ),
  actions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      requires_approval: z.boolean(),
      params_schema: z.record(z.unknown()),
    }),
  ),
  status: z.enum(['active', 'degraded', 'unavailable']),
  autonomy_modes_supported: z.array(NexusAutonomyModeSchema),
});
export type NexusCapability = z.infer<typeof NexusCapabilitySchema>;

export const NexusCapabilitiesResponseSchema = z.object({
  protocol_version: z.string(),
  domains: z.array(NexusCapabilitySchema),
  autonomy_modes: z.array(NexusAutonomyModeSchema),
  session_ttl_seconds: z.number(),
  streaming_supported: z.boolean(),
  generated_at: z.string(),
});
export type NexusCapabilitiesResponse = z.infer<typeof NexusCapabilitiesResponseSchema>;

// ─── SSE streaming event shapes ───────────────────────────────────────────────

export const NexusStreamEventSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('domain_start'),
    data: z.object({ domain: z.string(), query_id: z.string() }),
  }),
  z.object({
    event: z.literal('domain_result'),
    data: z.object({
      domain: z.string(),
      content: z.string(),
      evidence: z.array(NexusEvidenceRefSchema),
      confidence: z.number(),
    }),
  }),
  z.object({
    event: z.literal('synthesis_start'),
    data: z.object({ query_id: z.string(), domains_count: z.number() }),
  }),
  z.object({
    event: z.literal('synthesis_delta'),
    data: z.object({ delta: z.string() }),
  }),
  z.object({
    event: z.literal('done'),
    data: NexusQueryResponseSchema,
  }),
  z.object({
    event: z.literal('error'),
    data: z.object({ message: z.string(), code: z.string() }),
  }),
]);
export type NexusStreamEvent = z.infer<typeof NexusStreamEventSchema>;
