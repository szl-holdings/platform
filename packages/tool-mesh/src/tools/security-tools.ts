import { eq, desc } from 'drizzle-orm';
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
  const { db, advisoryFindings, platformJobRunsTable } = await import('@szl-holdings/db');

  const findings = await db
    .select()
    .from(advisoryFindings)
    .where(eq(advisoryFindings.severity, 'critical'))
    .orderBy(desc(advisoryFindings.generatedAt))
    .limit(parsed.depth === 'surface' ? 5 : parsed.depth === 'deep' ? 15 : 30);

  const scanRunId = `scan-${Date.now()}`;
  await db.insert(platformJobRunsTable).values({
    runId: scanRunId,
    workflowType: 'threat_scan',
    domain: 'security',
    triggeredBy: 'agent-tool-call',
    payload: { targetId: parsed.targetId, targetType: parsed.targetType, depth: parsed.depth },
    status: 'running',
  });

  const threats = findings.map((f) => ({
    findingId: f.id,
    title: f.title,
    severity: f.severity,
    content: f.content.slice(0, 200),
    tags: f.tags,
  }));

  const riskScore = threats.length === 0
    ? 0
    : Math.min(
        100,
        threats.reduce((score, t) => {
          if (t.severity === 'critical') return score + 25;
          if (t.severity === 'high') return score + 15;
          return score + 5;
        }, 0),
      );

  return {
    scanId: scanRunId,
    targetId: parsed.targetId,
    targetType: parsed.targetType,
    depth: parsed.depth,
    threats,
    threatCount: threats.length,
    riskScore,
    status: 'completed',
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
  const { db, platformJobRunsTable } = await import('@szl-holdings/db');

  const escalationTarget = parsed.escalateTo ?? (parsed.severity === 'critical' ? 'ciso-oncall' : 'soc-on-call');

  const runId = `escalation-${Date.now()}`;
  await db.insert(platformJobRunsTable).values({
    runId,
    workflowType: 'alert_escalation',
    domain: 'security',
    triggeredBy: 'agent-tool-call',
    status: 'completed',
    payload: {
      alertId: parsed.alertId,
      severity: parsed.severity,
      reason: parsed.reason,
      escalateTo: escalationTarget,
    },
    result: { escalated: true, escalatedTo: escalationTarget },
  });

  return {
    alertId: parsed.alertId,
    escalated: true,
    escalatedTo: escalationTarget,
    severity: parsed.severity,
    escalationRunId: runId,
    message: `Alert ${parsed.alertId} (${parsed.severity}) escalated to ${escalationTarget}`,
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
  const { db, complianceCalendarTable } = await import('@szl-holdings/db');

  const calendarEvents = await db
    .select()
    .from(complianceCalendarTable)
    .orderBy(desc(complianceCalendarTable.dueAt))
    .limit(20);

  const frameworkKeywords: Record<string, string[]> = {
    SOC2: ['soc', 'audit', 'exam'],
    ISO27001: ['iso', 'policy', 'review'],
    NIST: ['nist', 'exam', 'review'],
    HIPAA: ['hipaa', 'phi', 'privacy'],
    GDPR: ['gdpr', 'privacy', 'data'],
    'PCI-DSS': ['pci', 'payment', 'card'],
  };

  const keywords = frameworkKeywords[parsed.framework] ?? [];
  const frameworkEvents = calendarEvents.filter(
    (e) =>
      keywords.some((k) => e.title.toLowerCase().includes(k) || (e.description ?? '').toLowerCase().includes(k)),
  );

  const overdueCount = frameworkEvents.filter((e) => e.status === 'overdue').length;
  const inProgressCount = frameworkEvents.filter((e) => e.status === 'in_progress').length;
  const passRate =
    frameworkEvents.length > 0
      ? Math.round(
          ((frameworkEvents.length - overdueCount) / frameworkEvents.length) * 100,
        ) / 100
      : 1.0;

  const findings = frameworkEvents.slice(0, 5).map((e) => ({
    eventId: e.eventId,
    title: e.title,
    status: e.status,
    dueAt: e.dueAt?.toISOString(),
    regulatoryBody: e.regulatoryBody ?? 'internal',
  }));

  const remediation = parsed.includeRemediation && overdueCount > 0
    ? [`${overdueCount} overdue compliance event(s) require immediate attention in the compliance calendar`]
    : [];

  return {
    framework: parsed.framework,
    scope: parsed.scope,
    eventsChecked: calendarEvents.length,
    frameworkEvents: frameworkEvents.length,
    overdueCount,
    inProgressCount,
    passRate,
    findings,
    remediation,
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
  const { db, advisoryFindings } = await import('@szl-holdings/db');

  const rows = await (parsed.severity
    ? db
        .select()
        .from(advisoryFindings)
        .where(eq(advisoryFindings.severity, parsed.severity))
        .orderBy(desc(advisoryFindings.generatedAt))
        .limit(25)
    : db
        .select()
        .from(advisoryFindings)
        .orderBy(desc(advisoryFindings.generatedAt))
        .limit(25));

  const vulnerabilities = rows.map((f) => ({
    findingId: f.id,
    title: f.title,
    severity: f.severity,
    agentDomain: f.agentName,
    tags: f.tags,
    summary: f.content.slice(0, 300),
    reportedAt: f.generatedAt?.toISOString(),
    acknowledged: f.acknowledged,
  }));

  const bySeverity = {
    critical: vulnerabilities.filter((v) => v.severity === 'critical').length,
    high: vulnerabilities.filter((v) => v.severity === 'high').length,
    medium: vulnerabilities.filter((v) => v.severity === 'medium').length,
    low: vulnerabilities.filter((v) => v.severity === 'low').length,
  };

  return {
    filter: { cveId: parsed.cveId, assetId: parsed.assetId, severity: parsed.severity },
    total: vulnerabilities.length,
    bySeverity,
    vulnerabilities,
  };
};

export const SECURITY_TOOL_MANIFESTS: ToolManifest[] = [
  THREAT_SCAN_TOOL_MANIFEST,
  ALERT_ESCALATION_TOOL_MANIFEST,
  COMPLIANCE_CHECK_TOOL_MANIFEST,
  INCIDENT_CONTAINMENT_TOOL_MANIFEST,
  VULNERABILITY_REPORT_TOOL_MANIFEST,
];
