import { z } from 'zod';
import type { ToolHandler } from '../gateway.js';
import type { ToolManifest } from '../manifest.js';

export const ThreatScanInputSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(['host', 'network', 'workload', 'endpoint']),
  depth: z.enum(['surface', 'deep', 'full']).default('surface'),
});
export type ThreatScanInput = z.infer<typeof ThreatScanInputSchema>;

export const THREAT_SCAN_TOOL_MANIFEST: ToolManifest = {
  id: 'security.threat-scan',
  name: 'Threat Scanner',
  version: '1.0.0',
  description:
    'Initiate a threat scan against a target host, network segment, or workload. Returns threat indicators, severity levels, and recommended mitigations.',
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
  failureModes: [
    { type: 'timeout', retryable: true, maxRetries: 1 },
    { type: 'unavailable', retryable: false, maxRetries: 0 },
  ],
  approvalRequired: false,
  owner: 'security-team',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ['targetId'] },
  enabled: true,
};

export const threatScanHandler: ToolHandler = async (input) => {
  const parsed = ThreatScanInputSchema.parse(input);
  return {
    scanId: `scan-${Date.now()}`,
    targetId: parsed.targetId,
    targetType: parsed.targetType,
    depth: parsed.depth,
    threats: [],
    riskScore: 0,
    message: `Threat scan initiated for ${parsed.targetType}:${parsed.targetId} (stub — wire PARAGON backend for live results)`,
  };
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
    'Escalate a security alert to the appropriate on-call team or executive stakeholder based on severity and domain.',
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
  failureModes: [{ type: 'error', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'security-team',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
  enabled: true,
};

export const alertEscalationHandler: ToolHandler = async (input) => {
  const parsed = AlertEscalationInputSchema.parse(input);
  return {
    alertId: parsed.alertId,
    escalated: true,
    escalatedTo: parsed.escalateTo ?? 'soc-on-call',
    message: `Alert ${parsed.alertId} escalated (stub — wire paging backend for live escalation)`,
  };
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
    'Run a compliance posture check against a specified framework and scope. Returns findings, gap analysis, and optional remediation steps.',
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
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'compliance-team',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
  enabled: true,
};

export const complianceCheckHandler: ToolHandler = async (input) => {
  const parsed = ComplianceCheckInputSchema.parse(input);
  return {
    framework: parsed.framework,
    scope: parsed.scope,
    findings: [],
    passRate: 1.0,
    message: `Compliance check for ${parsed.framework} (stub — wire compliance engine for live results)`,
  };
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
  return {
    incidentId: parsed.incidentId,
    action: parsed.containmentAction,
    applied: false,
    message: `Containment action queued for approval (stub — wire PARAGON response platform)`,
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
    'Retrieve vulnerability reports filtered by CVE, asset, or severity from the platform vulnerability database.',
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
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'security-team',
  observabilityHooks: { emitTrace: true, emitMetrics: false, sensitiveFields: [] },
  enabled: true,
};

export const vulnerabilityReportHandler: ToolHandler = async (input) => {
  const parsed = VulnerabilityReportInputSchema.parse(input);
  return {
    cveId: parsed.cveId,
    assetId: parsed.assetId,
    severity: parsed.severity,
    vulnerabilities: [],
    message: 'Vulnerability report retrieved (stub — wire CVE database for live results)',
  };
};

export const SECURITY_TOOL_MANIFESTS: ToolManifest[] = [
  THREAT_SCAN_TOOL_MANIFEST,
  ALERT_ESCALATION_TOOL_MANIFEST,
  COMPLIANCE_CHECK_TOOL_MANIFEST,
  INCIDENT_CONTAINMENT_TOOL_MANIFEST,
  VULNERABILITY_REPORT_TOOL_MANIFEST,
];
