/**
 * AI & agent infrastructure schemas — used by trace capture, review queue,
 * job payloads, and LLM structured output parsing.
 *
 * Includes Zod-native schemas for all AI decision types used by
 * governedStructuredCall() — the schema-guaranteed AI pipeline.
 */
import { z } from 'zod';

export const aiTraceSchema = z.object({
  traceId: z.string().min(1),
  correlationId: z.string().optional(),
  orgId: z.number().int().positive().optional(),
  model: z.string(),
  modelProvider: z.string(),
  modelVersion: z.string().optional(),
  routeClass: z.enum(['critical', 'standard', 'economy']).optional(),
  domain: z.string().optional(),
  recommendationType: z.string().optional(),
  promptHash: z.string().optional(),
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  latencyMs: z.number().min(0),
  costEstimateUsd: z.number().min(0),
  confidence: z.number().min(0).max(1).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  toolsUsed: z.array(z.string()).optional(),
  requiresReview: z.boolean().optional(),
  reviewReason: z.string().optional(),
  evalScore: z.number().min(0).max(1).optional(),
  evalPassed: z.boolean().optional(),
  status: z.enum(['pending', 'evaluated', 'reviewed', 'flagged', 'archived']).optional(),
  capturedAt: z.coerce.date(),
});
export type AITrace = z.infer<typeof aiTraceSchema>;

export const toolCallSchema = z.object({
  toolName: z.string().min(1),
  toolArgs: z.record(z.unknown()).optional(),
  toolResult: z.record(z.unknown()).optional(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  durationMs: z.number().min(0).optional(),
  spanId: z.string().optional(),
  correlationId: z.string().optional(),
  orgId: z.number().int().positive().optional(),
  invokedAt: z.coerce.date(),
});
export type ToolCall = z.infer<typeof toolCallSchema>;

export const llmStructuredOutputSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    content: schema,
    confidence: z.number().min(0).max(1).optional(),
    model: z.string().optional(),
    promptTokens: z.number().int().min(0).optional(),
    completionTokens: z.number().int().min(0).optional(),
  });

export const sourceCitationSchema = z.object({
  sourceId: z.string().min(1),
  sourceUri: z.string().optional(),
  chunkId: z.string().optional(),
  title: z.string().optional(),
  score: z.number().min(0).max(1).optional(),
  retrievedAt: z.string(),
});

export const toolCallRecordSchema = z.object({
  toolId: z.string().min(1),
  inputSummary: z.string().optional(),
  outputSummary: z.string().optional(),
  durationMs: z.number().min(0).optional(),
  status: z.enum(['success', 'error', 'skipped']),
  error: z.string().optional(),
  timestamp: z.string(),
});

export const provenanceEnvelopeSchema = z.object({
  runId: z.string().min(1),
  agentId: z.string().min(1),
  domain: z.string(),
  model: z.string(),
  provider: z.string(),
  promptHash: z.string(),
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  costEstimateUsd: z.number().min(0),
  confidence: z.number().min(0).max(100),
  latencyMs: z.number().min(0),
  sources: z.array(sourceCitationSchema),
  toolCalls: z.array(toolCallRecordSchema),
  governanceVerdict: z.enum(['allowed', 'blocked']),
  generatedAt: z.string(),
});
export type ProvenanceEnvelopeZ = z.infer<typeof provenanceEnvelopeSchema>;

export const provenanceLineageSchema = z.object({
  runId: z.string().min(1),
  envelope: provenanceEnvelopeSchema,
  parentRunIds: z.array(z.string()),
  consultations: z.array(provenanceEnvelopeSchema),
});

export const aiOpsMetricSchema = z.object({
  totalTraces: z.number().int().min(0),
  reviewRequired: z.number().int().min(0),
  reviewRate: z.number().min(0).max(1),
  avgLatencyMs: z.number().min(0),
  p50LatencyMs: z.number().min(0),
  p95LatencyMs: z.number().min(0),
  avgConfidence: z.number().min(0).max(1).optional(),
  totalCostUsd: z.number().min(0),
  evalPassRate: z.number().min(0).max(1).optional(),
});
export type AIOpMetric = z.infer<typeof aiOpsMetricSchema>;

// ─── Governed Structured Output Schemas ─────────────────────────────────────
// Zod-native schemas for all AI decision types. These feed governedStructuredCall()
// which replaces the old regex + manual validation pipeline.

export const triageDecisionSchema = z.object({
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']),
  urgency: z.enum(['immediate', 'urgent', 'standard', 'deferred']),
  category: z.string().min(1),
  subcategory: z.string().nullable().optional(),
  routeTo: z.string().min(1),
  routeReason: z.string().default(''),
  summary: z.string().min(1),
  keyEntities: z.array(z.object({
    type: z.string(),
    value: z.string(),
    confidence: z.number().min(0).max(1),
  }).strict()).default([]),
  suggestedActions: z.array(z.object({
    action: z.string(),
    reason: z.string(),
    confidence: z.number().min(0).max(1),
  }).strict()).default([]),
  requiresHumanReview: z.boolean().default(true),
  confidence: z.number().min(0).max(1),
}).strict();
export type TriageDecisionZ = z.infer<typeof triageDecisionSchema>;

export const evidenceItemSchema = z.object({
  source: z.string(),
  sourceType: z.enum(['workflow', 'audit', 'signal', 'connector', 'policy', 'prior_incident', 'playbook']),
  content: z.string(),
  relevanceScore: z.number().min(0).max(1),
  timestamp: z.string().nullable().optional(),
  objectId: z.string().nullable().optional(),
}).strict();

export const actionDecisionSchema = z.object({
  action: z.string().min(1),
  actionType: z.enum(['approve', 'escalate', 'defer', 'route', 'close', 'investigate']),
  confidence: z.number().min(0).max(1),
  evidence: z.array(evidenceItemSchema).default([]),
  impactedOwner: z.string().nullable().optional(),
  approvalRequired: z.boolean(),
  approvalLevel: z.enum(['none', 'operator', 'manager', 'executive']).default('none'),
  deadline: z.string().nullable().optional(),
  sla: z.string().nullable().optional(),
  reasoning: z.string().min(1),
  alternatives: z.array(z.object({
    action: z.string(),
    confidence: z.number().min(0).max(1),
    tradeoff: z.string(),
  }).strict()).default([]),
}).strict();
export type ActionDecisionZ = z.infer<typeof actionDecisionSchema>;

export const extractedEntitySchema = z.object({
  type: z.enum(['person', 'organization', 'location', 'asset', 'vulnerability', 'indicator', 'date', 'amount', 'reference']),
  value: z.string().min(1),
  confidence: z.number().min(0).max(1),
  context: z.string().default(''),
  normalizedValue: z.string().nullable().optional(),
}).strict();

export const extractedEntitiesSchema = z.object({
  entities: z.array(extractedEntitySchema).default([]),
  relationships: z.array(z.object({
    from: z.string(),
    to: z.string(),
    relationType: z.string(),
    confidence: z.number().min(0).max(1),
  }).strict()).default([]),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
}).strict();
export type ExtractedEntitiesZ = z.infer<typeof extractedEntitiesSchema>;

export const fusionAlertOutputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum([
    'cross_domain_risk',
    'entity_correlation',
    'pattern_anomaly',
    'sanctions_exposure',
    'litigation_impact',
    'financial_stress',
    'threat_escalation',
    'opportunity_signal',
  ]),
  confidence: z.number().min(0).max(1),
  affectedDomains: z.array(z.string()).min(1),
  recommendedActions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
}).strict();
export type FusionAlertOutputZ = z.infer<typeof fusionAlertOutputSchema>;

export const alloyDecisionOutputSchema = z.object({
  recommendedAction: z.string().min(1),
  rationaleSummary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']),
  approvalRequired: z.boolean(),
  ownerSuggestion: z.string().nullable().optional(),
  fallbackPlan: z.string().nullable().optional(),
  evidenceRefs: z.array(z.object({
    refId: z.string(),
    source: z.string(),
    sourceType: z.enum(['workflow', 'audit', 'signal', 'connector', 'policy', 'prior_incident', 'playbook', 'retrieval']),
    content: z.string(),
    relevanceScore: z.number().min(0).max(1),
    timestamp: z.string().nullable().optional(),
    objectId: z.string().nullable().optional(),
  }).strict()).default([]),
}).strict();
export type AlloyDecisionOutputZ = z.infer<typeof alloyDecisionOutputSchema>;

export const planningResultSchema = z.object({
  action: z.string().min(1),
  actionType: z.enum(['approve', 'escalate', 'defer', 'route', 'close', 'investigate']),
  confidence: z.number().min(0).max(1),
  evidence: z.array(evidenceItemSchema).default([]),
  impactedOwner: z.string().nullable().optional(),
  approvalRequired: z.boolean(),
  approvalLevel: z.enum(['none', 'operator', 'manager', 'executive']).default('none'),
  deadline: z.string().nullable().optional(),
  sla: z.string().nullable().optional(),
  reasoning: z.string().min(1),
  alternatives: z.array(z.object({
    action: z.string(),
    confidence: z.number().min(0).max(1),
    tradeoff: z.string(),
  }).strict()).default([]),
}).strict();
export type PlanningResultZ = z.infer<typeof planningResultSchema>;

// ─── Governed Response Envelope ──────────────────────────────────────────────
// Every schema produced by governedStructuredCall() is wrapped in this envelope
// at the type level, making refusal a first-class outcome alongside valid output.

export const governedResponseEnvelopeSchema = <T extends z.ZodTypeAny>(payloadSchema: T) =>
  z.discriminatedUnion('outcome', [
    z.object({
      outcome: z.literal('success'),
      runId: z.string(),
      payload: payloadSchema,
      provenance: z.object({
        agentId: z.string(),
        domain: z.string(),
        model: z.string(),
        provider: z.string(),
        promptHash: z.string(),
        latencyMs: z.number(),
        governanceVerdict: z.enum(['allowed', 'blocked']),
        covenantFailures: z.array(z.string()),
        generatedAt: z.string(),
      }),
    }),
    z.object({
      outcome: z.literal('refusal'),
      runId: z.string(),
      incidentId: z.string(),
      domain: z.string(),
      reason: z.string(),
      riskTier: z.enum(['low', 'medium', 'high', 'critical']),
      escalatedTo: z.string().nullable(),
      recordedAt: z.string(),
    }),
    z.object({
      outcome: z.literal('policy_block'),
      runId: z.string(),
      failedRules: z.array(z.string()),
      reasons: z.array(z.string()),
    }),
  ]);

export type GovernedResponseEnvelope<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof governedResponseEnvelopeSchema<T>>
>;

// ─── Eval Response Schema ─────────────────────────────────────────────────────
// Generic structured response for the eval runner (golden-set evaluation).
// All fields optional to allow partial model outputs to be scored by assertions.
export const evalResponseSchema = z.object({
  action: z.string().optional(),
  recommendedAction: z.string().optional(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']).optional(),
  severity: z.string().optional(),
  riskLevel: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']).optional(),
  confidence: z.number().min(0).max(1).optional(),
  rationaleSummary: z.string().optional(),
  entities: z.array(z.string()).optional(),
  owner: z.string().optional(),
  requiresApproval: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});
export type EvalResponseZ = z.infer<typeof evalResponseSchema>;
