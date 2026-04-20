import { z } from 'zod';

export const CaptureContextSchema = z.object({
  capturedAt: z.string().datetime(),
  capturedBy: z.string().optional(),
  source: z.enum(['manual', 'automatic', 'scheduled', 'triggered']),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export const IncidentSnapshotSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  domain: z.string(),
  incidentType: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  description: z.string(),
  inputContext: z.record(z.unknown()),
  agentDecision: z.record(z.unknown()).optional(),
  humanOverride: z.record(z.unknown()).optional(),
  outcome: z.enum(['resolved', 'escalated', 'overridden', 'failed', 'pending']),
  durationMs: z.number().optional(),
  tokensUsed: z.number().optional(),
  costUsd: z.number().optional(),
  captureContext: CaptureContextSchema,
  sanitized: z.boolean().default(false),
  piiRedacted: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
});

export const FlowSnapshotSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  domain: z.string(),
  flowType: z.string(),
  title: z.string(),
  steps: z.array(
    z.object({
      stepIndex: z.number(),
      stepName: z.string(),
      agentId: z.string().optional(),
      input: z.record(z.unknown()),
      output: z.record(z.unknown()),
      durationMs: z.number(),
      tokensUsed: z.number().optional(),
      toolsInvoked: z.array(z.string()).default([]),
      policyChecks: z
        .array(
          z.object({
            policy: z.string(),
            passed: z.boolean(),
          }),
        )
        .default([]),
    }),
  ),
  captureContext: CaptureContextSchema,
  sanitized: z.boolean().default(false),
  piiRedacted: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
});

export type IncidentSnapshot = z.infer<typeof IncidentSnapshotSchema>;
export type FlowSnapshot = z.infer<typeof FlowSnapshotSchema>;
export type CaptureContext = z.infer<typeof CaptureContextSchema>;

const PII_FIELDS = [
  'email',
  'phone',
  'ssn',
  'name',
  'address',
  'ip',
  'creditCard',
  'dob',
  'passport',
];

const incidentStore: IncidentSnapshot[] = [];
const flowStore: FlowSnapshot[] = [];

export function captureIncident(
  raw: Omit<IncidentSnapshot, 'captureContext' | 'sanitized' | 'piiRedacted'>,
  options?: Partial<CaptureContext>,
): IncidentSnapshot {
  const snapshot: IncidentSnapshot = {
    ...raw,
    sanitized: false,
    piiRedacted: false,
    captureContext: {
      capturedAt: new Date().toISOString(),
      source: options?.source ?? 'manual',
      capturedBy: options?.capturedBy,
      tags: options?.tags ?? [],
      description: options?.description,
    },
  };
  incidentStore.push(snapshot);
  return snapshot;
}

export function captureFlow(
  raw: Omit<FlowSnapshot, 'captureContext' | 'sanitized' | 'piiRedacted'>,
  options?: Partial<CaptureContext>,
): FlowSnapshot {
  const snapshot: FlowSnapshot = {
    ...raw,
    sanitized: false,
    piiRedacted: false,
    captureContext: {
      capturedAt: new Date().toISOString(),
      source: options?.source ?? 'manual',
      capturedBy: options?.capturedBy,
      tags: options?.tags ?? [],
      description: options?.description,
    },
  };
  flowStore.push(snapshot);
  return snapshot;
}

export function getIncidents(filter?: {
  domain?: string;
  severity?: string;
  outcome?: string;
}): IncidentSnapshot[] {
  return incidentStore.filter((inc) => {
    if (filter?.domain && inc.domain !== filter.domain) return false;
    if (filter?.severity && inc.severity !== filter.severity) return false;
    if (filter?.outcome && inc.outcome !== filter.outcome) return false;
    return true;
  });
}

export function getFlows(filter?: { domain?: string; flowType?: string }): FlowSnapshot[] {
  return flowStore.filter((flow) => {
    if (filter?.domain && flow.domain !== filter.domain) return false;
    if (filter?.flowType && flow.flowType !== filter.flowType) return false;
    return true;
  });
}

/**
 * Apply field-level PII redaction to an incident snapshot using the standard PII field list.
 * The caller can supply additional sensitive keys. Returns a new object with piiRedacted = true.
 */
export function redactIncidentPII(
  snapshot: IncidentSnapshot,
  additionalFields: string[] = [],
): IncidentSnapshot {
  const fields = [...PII_FIELDS, ...additionalFields];

  function deepRedact(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(deepRedact);
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const shouldRedact = fields.some((f) => k.toLowerCase().includes(f.toLowerCase()));
      result[k] = shouldRedact ? '[REDACTED]' : deepRedact(v);
    }
    return result;
  }

  return {
    ...snapshot,
    inputContext: deepRedact(snapshot.inputContext) as Record<string, unknown>,
    agentDecision: snapshot.agentDecision
      ? (deepRedact(snapshot.agentDecision) as Record<string, unknown>)
      : undefined,
    humanOverride: snapshot.humanOverride
      ? (deepRedact(snapshot.humanOverride) as Record<string, unknown>)
      : undefined,
    sanitized: true,
    piiRedacted: true,
  };
}

/**
 * Export all captured datasets with mandatory PII redaction applied.
 *
 * Each snapshot is deep-redacted for known PII fields before export.
 * Snapshots are marked sanitized=true and piiRedacted=true in the output.
 * This export is suitable for sharing with eval/replay pipelines.
 */
export function exportDataset(additionalPIIFields: string[] = []): {
  incidents: IncidentSnapshot[];
  flows: FlowSnapshot[];
  exportedAt: string;
  totalIncidents: number;
  totalFlows: number;
} {
  const redactedIncidents = incidentStore.map((inc) => redactIncidentPII(inc, additionalPIIFields));

  const flowPIIFields = [...PII_FIELDS, ...additionalPIIFields];

  function deepRedactObj(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(deepRedactObj);
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const shouldRedact = flowPIIFields.some((f) => k.toLowerCase().includes(f.toLowerCase()));
      result[k] = shouldRedact ? '[REDACTED]' : deepRedactObj(v);
    }
    return result;
  }

  const redactedFlows = flowStore.map((flow) => ({
    ...flow,
    steps: flow.steps.map((step) => ({
      ...step,
      input: deepRedactObj(step.input) as Record<string, unknown>,
      output: deepRedactObj(step.output) as Record<string, unknown>,
    })),
    sanitized: true as const,
    piiRedacted: true as const,
  }));

  return {
    incidents: redactedIncidents,
    flows: redactedFlows,
    exportedAt: new Date().toISOString(),
    totalIncidents: redactedIncidents.length,
    totalFlows: redactedFlows.length,
  };
}

/**
 * Low-level sanitization helper — marks sanitized flag and allows caller-specified field redaction.
 * For full PII redaction, prefer `redactIncidentPII()` or `exportDataset()`.
 */
export function sanitizeSnapshot<
  T extends { sanitized: boolean; metadata: Record<string, unknown> },
>(snapshot: T, redactFields: string[] = []): T {
  const sanitized = { ...snapshot, sanitized: true };
  for (const field of redactFields) {
    if (field in sanitized) {
      (sanitized as Record<string, unknown>)[field] = '[REDACTED]';
    }
  }
  return sanitized;
}
