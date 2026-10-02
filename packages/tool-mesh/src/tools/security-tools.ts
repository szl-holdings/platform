import { z } from 'zod';
import type { ToolHandler } from '../gateway.js';
import type { ToolManifest } from '../manifest.js';

export const ThreatScanInputSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(['host', 'network', 'workload', 'endpoint']),
  depth: z.enum(['surface', 'deep', 'full']).default('surface'),
});
export type ThreatScanInput = z.infer<typeof ThreatScanInputSchema>;

export class SecurityOperationUnavailableError extends Error {
  readonly code = 'SECURITY_OPERATION_UNAVAILABLE';

  constructor(toolId: string, missingEvidence: string) {
    super(`${toolId} is unavailable: ${missingEvidence}. No operation was performed.`);
    this.name = 'SecurityOperationUnavailableError';
  }
}

export const THREAT_SCAN_TOOL_MANIFEST: ToolManifest = {
  id: 'security.threat-scan',
  name: 'Threat Scanner',
  version: '1.0.0',
  description:
    'Unavailable until an authorized, tenant- and target-bound scanner can return observed findings and a scan receipt.',
  domainTags: ['security'],
  policyTier: 'regulated-workflow',
  allowedEnvironments: ['staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      targetId: { type: 'string', description: 'ID of the target host, network, or workload' },
      targetType: {
        type: 'string',
        enum: ['host', 'network', 'workload', 'endpoint'],
        description: 'Type of scan target',
      },
      depth: { type: 'string', enum: ['surface', 'deep', 'full'], description: 'Scan depth level' },
    },
    required: ['targetId', 'targetType'],
  },
  rateLimits: { requestsPerMinute: 10, concurrency: 3 },
  timeoutMs: 60000,
  failureModes: [{ type: 'unavailable', retryable: false, maxRetries: 0 }],
  approvalRequired: true,
  owner: 'security-team',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ['targetId'] },
  enabled: false,
};

export const threatScanHandler: ToolHandler = async (input) => {
  ThreatScanInputSchema.parse(input);
  throw new SecurityOperationUnavailableError(
    THREAT_SCAN_TOOL_MANIFEST.id,
    'no authorized scanner or target-bound scan evidence is connected',
  );
};

export const AlertEscalationInputSchema = z.object({
  alertId: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  reason: z.string(),
  escalateTo: z.string().optional(),
});
export type AlertEscalationInput = z.infer<typeof AlertEscalationInputSchema>;

export const ALERT_ESCALATION_TOOL_MANIFEST: ToolManifest = {
  id: 'security.alert-escalation',
  name: 'Alert Escalator',
  version: '1.0.0',
  description:
    'Unavailable until an approved delivery adapter can confirm recipient acceptance for a security alert.',
  domainTags: ['security'],
  policyTier: 'executive-facing',
  allowedEnvironments: ['staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      alertId: { type: 'string', description: 'Unique identifier of the alert to escalate' },
      severity: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Alert severity level',
      },
      reason: { type: 'string', description: 'Justification for escalation' },
      escalateTo: { type: 'string', description: 'Optional target team or person for escalation' },
    },
    required: ['alertId', 'severity', 'reason'],
  },
  rateLimits: { requestsPerMinute: 30 },
  timeoutMs: 10000,
  failureModes: [{ type: 'unavailable', retryable: false, maxRetries: 0 }],
  approvalRequired: true,
  owner: 'security-team',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
  enabled: false,
};

export const alertEscalationHandler: ToolHandler = async (input) => {
  AlertEscalationInputSchema.parse(input);
  throw new SecurityOperationUnavailableError(
    ALERT_ESCALATION_TOOL_MANIFEST.id,
    'no approved on-call delivery adapter or recipient confirmation is connected',
  );
};

export const ComplianceCheckInputSchema = z.object({
  framework: z.enum(['SOC2', 'ISO27001', 'NIST', 'HIPAA', 'GDPR', 'PCI-DSS']),
  scope: z.string(),
  includeRemediation: z.boolean().default(true),
});
export type ComplianceCheckInput = z.infer<typeof ComplianceCheckInputSchema>;

export const COMPLIANCE_CHECK_TOOL_MANIFEST: ToolManifest = {
  id: 'security.compliance-check',
  name: 'Compliance Checker',
  version: '1.0.0',
  description:
    'Unavailable until framework controls and assessment evidence are bound to a verified organization and scope.',
  domainTags: ['security'],
  policyTier: 'regulated-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      framework: {
        type: 'string',
        enum: ['SOC2', 'ISO27001', 'NIST', 'HIPAA', 'GDPR', 'PCI-DSS'],
        description: 'Compliance framework to evaluate',
      },
      scope: {
        type: 'string',
        description: 'Scope of the compliance check (e.g., service name or data classification)',
      },
      includeRemediation: {
        type: 'boolean',
        description: 'Whether to include remediation recommendations',
      },
    },
    required: ['framework', 'scope'],
  },
  rateLimits: { requestsPerMinute: 20 },
  timeoutMs: 30000,
  failureModes: [{ type: 'unavailable', retryable: false, maxRetries: 0 }],
  approvalRequired: false,
  owner: 'compliance-team',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
  enabled: false,
};

export const complianceCheckHandler: ToolHandler = async (input) => {
  ComplianceCheckInputSchema.parse(input);
  throw new SecurityOperationUnavailableError(
    COMPLIANCE_CHECK_TOOL_MANIFEST.id,
    'calendar events are not scope-bound control assessments',
  );
};

export const IncidentContainmentInputSchema = z.object({
  incidentId: z.string(),
  containmentAction: z.enum(['isolate-host', 'block-ip', 'revoke-credentials', 'disable-account']),
  justification: z.string(),
});

export const INCIDENT_CONTAINMENT_TOOL_MANIFEST: ToolManifest = {
  id: 'security.incident-containment',
  name: 'Incident Containment',
  version: '1.0.0',
  description:
    'Apply a containment action to an active security incident. Irreversible actions require human approval.',
  domainTags: ['security'],
  policyTier: 'human-approval-mandatory',
  allowedEnvironments: ['production'],
  inputSchema: {
    type: 'object',
    properties: {
      incidentId: {
        type: 'string',
        description: 'Unique identifier of the active security incident',
      },
      containmentAction: {
        type: 'string',
        enum: ['isolate-host', 'block-ip', 'revoke-credentials', 'disable-account'],
        description: 'The containment action to apply',
      },
      justification: {
        type: 'string',
        description: 'Documented justification for the containment action',
      },
    },
    required: ['incidentId', 'containmentAction', 'justification'],
  },
  rateLimits: { requestsPerMinute: 5, concurrency: 1 },
  timeoutMs: 30000,
  failureModes: [{ type: 'error', retryable: false, maxRetries: 0 }],
  approvalRequired: true,
  owner: 'soc-team',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ['justification'] },
  enabled: true,
};

export const incidentContainmentHandler: ToolHandler = async (input) => {
  const parsed = IncidentContainmentInputSchema.parse(input);
  const { db, platformJobRunsTable } = await import('@szl-holdings/db');

  const runId = `containment-${Date.now()}`;
  await db.insert(platformJobRunsTable).values({
    runId,
    workflowType: 'incident_containment',
    domain: 'security',
    triggeredBy: 'agent-tool-call',
    status: 'pending',
    payload: {
      incidentId: parsed.incidentId,
      action: parsed.containmentAction,
      justification: parsed.justification,
      requiresApproval: true,
    },
  });

  return {
    incidentId: parsed.incidentId,
    action: parsed.containmentAction,
    applied: false,
    runId,
    status: 'pending-approval',
    message: `Containment action '${parsed.containmentAction}' for incident ${parsed.incidentId} queued for human approval`,
  };
};

export const VulnerabilityReportInputSchema = z.object({
  cveId: z.string().optional(),
  assetId: z.string().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
});

export const VULNERABILITY_REPORT_TOOL_MANIFEST: ToolManifest = {
  id: 'security.vulnerability-report',
  name: 'Vulnerability Report',
  version: '1.0.0',
  description:
    'Unavailable until a tenant- and asset-bound vulnerability source can verify CVE and severity filters.',
  domainTags: ['security'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      cveId: { type: 'string', description: 'CVE identifier to filter by (e.g. CVE-2024-1234)' },
      assetId: { type: 'string', description: 'Asset identifier to scope results' },
      severity: {
        type: 'string',
        enum: ['critical', 'high', 'medium', 'low'],
        description: 'Minimum severity filter',
      },
    },
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 15000,
  failureModes: [{ type: 'unavailable', retryable: false, maxRetries: 0 }],
  approvalRequired: false,
  owner: 'security-team',
  observabilityHooks: { emitTrace: true, emitMetrics: false, sensitiveFields: [] },
  enabled: false,
};

export const vulnerabilityReportHandler: ToolHandler = async (input) => {
  VulnerabilityReportInputSchema.parse(input);
  throw new SecurityOperationUnavailableError(
    VULNERABILITY_REPORT_TOOL_MANIFEST.id,
    'advisory findings are not tenant- or asset-bound and cannot verify CVE filters',
  );
};

export const SECURITY_TOOL_MANIFESTS: ToolManifest[] = [
  THREAT_SCAN_TOOL_MANIFEST,
  ALERT_ESCALATION_TOOL_MANIFEST,
  COMPLIANCE_CHECK_TOOL_MANIFEST,
  INCIDENT_CONTAINMENT_TOOL_MANIFEST,
  VULNERABILITY_REPORT_TOOL_MANIFEST,
];
