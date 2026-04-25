export type ToolRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
  allowedVerticals: string[];
  allowedRoles: string[];
  blockedActions: string[];
  rateLimit: number;
  timeoutMs: number;
  auditRequired: boolean;
  safeForAutonomy: boolean;
  demoSupported: boolean;
  isDestructive: boolean;
  category: string;
}

export type ToolResult = {
  ok: true;
  toolId: string;
  output: Record<string, unknown>;
  durationMs: number;
  isDemo: boolean;
} | {
  ok: false;
  toolId: string;
  error: string;
  durationMs: number;
};

type MockFn = (input: Record<string, unknown>, isDemoMode: boolean) => Record<string, unknown>;

const TOOL_CATALOGUE: ToolMetadata[] = [
  {
    id: 'createRevOpsUpdate',
    name: 'Create RevOps Update',
    description: 'Creates a RevOps status update with pipeline changes, deal risk flags, and recommended actions.',
    inputSchema: { opportunityId: 'string', updateType: 'string', summary: 'string' },
    outputSchema: { updateId: 'string', status: 'string', notified: 'boolean' },
    riskLevel: 'medium', requiresApproval: true, allowedVerticals: ['lyte-revenue', 'alloy-core'],
    allowedRoles: ['operator', 'executive', 'board'], blockedActions: ['delete_opportunity'],
    rateLimit: 20, timeoutMs: 5000, auditRequired: true, safeForAutonomy: false,
    demoSupported: true, isDestructive: false, category: 'revenue',
  },
  {
    id: 'draftTeamsMessage',
    name: 'Draft Teams Message',
    description: 'Drafts a Microsoft Teams message for stakeholder communication. Does not send without approval.',
    inputSchema: { channel: 'string', message: 'string', recipients: 'string[]' },
    outputSchema: { draftId: 'string', previewUrl: 'string', requiresSend: 'boolean' },
    riskLevel: 'low', requiresApproval: true, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'executive', 'board', 'analyst'], blockedActions: [],
    rateLimit: 50, timeoutMs: 3000, auditRequired: true, safeForAutonomy: false,
    demoSupported: true, isDestructive: false, category: 'communication',
  },
  {
    id: 'generateExecutiveSummary',
    name: 'Generate Executive Summary',
    description: 'Synthesizes signals and outcomes into a structured executive briefing document.',
    inputSchema: { signalIds: 'string[]', outcomeIds: 'string[]', period: 'string' },
    outputSchema: { summaryId: 'string', content: 'string', wordCount: 'number' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'executive', 'board', 'analyst'], blockedActions: [],
    rateLimit: 100, timeoutMs: 10000, auditRequired: false, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'reporting',
  },
  {
    id: 'createJiraTicket',
    name: 'Create Jira Ticket',
    description: 'Creates a Jira ticket for tracked remediation action items.',
    inputSchema: { project: 'string', summary: 'string', priority: 'string', assignee: 'string' },
    outputSchema: { ticketId: 'string', url: 'string', status: 'string' },
    riskLevel: 'low', requiresApproval: true, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'executive'], blockedActions: [],
    rateLimit: 30, timeoutMs: 5000, auditRequired: true, safeForAutonomy: false,
    demoSupported: true, isDestructive: false, category: 'workflow',
  },
  {
    id: 'updateOpportunityStatus',
    name: 'Update Opportunity Status',
    description: 'Updates CRM opportunity status and next steps based on signal intelligence.',
    inputSchema: { opportunityId: 'string', newStatus: 'string', reason: 'string' },
    outputSchema: { success: 'boolean', previousStatus: 'string', newStatus: 'string' },
    riskLevel: 'high', requiresApproval: true, allowedVerticals: ['lyte-revenue'],
    allowedRoles: ['executive', 'board'], blockedActions: ['delete'],
    rateLimit: 10, timeoutMs: 5000, auditRequired: true, safeForAutonomy: false,
    demoSupported: true, isDestructive: false, category: 'revenue',
  },
  {
    id: 'flagDuplicateScopeStackEntry',
    name: 'Flag Duplicate ScopeStack Entry',
    description: 'Flags and routes duplicate entries in the ScopeStack contract pipeline for human review.',
    inputSchema: { entryId: 'string', duplicateOf: 'string', reason: 'string' },
    outputSchema: { flagId: 'string', routed: 'boolean', reviewAssignee: 'string' },
    riskLevel: 'medium', requiresApproval: false, allowedVerticals: ['prism-counsel', 'alloy-core'],
    allowedRoles: ['operator', 'analyst'], blockedActions: [],
    rateLimit: 30, timeoutMs: 3000, auditRequired: true, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'legal',
  },
  {
    id: 'createMatterDeadlineAlert',
    name: 'Create Matter Deadline Alert',
    description: 'Creates a deadline alert for a legal matter, routing to counsel and operations.',
    inputSchema: { matterId: 'string', deadlineDate: 'string', urgency: 'string' },
    outputSchema: { alertId: 'string', notified: 'string[]', escalatedTo: 'string' },
    riskLevel: 'medium', requiresApproval: true, allowedVerticals: ['prism-counsel'],
    allowedRoles: ['operator', 'executive'], blockedActions: [],
    rateLimit: 20, timeoutMs: 3000, auditRequired: true, safeForAutonomy: false,
    demoSupported: true, isDestructive: false, category: 'legal',
  },
  {
    id: 'createVoyageRiskAlert',
    name: 'Create Voyage Risk Alert',
    description: 'Issues a voyage risk alert for maritime fleet operations and port authority notification.',
    inputSchema: { vesselId: 'string', riskType: 'string', coordinates: 'string', severity: 'string' },
    outputSchema: { alertId: 'string', notified: 'string[]', codiAdvisoryId: 'string' },
    riskLevel: 'high', requiresApproval: true, allowedVerticals: ['vessels-maritime'],
    allowedRoles: ['operator', 'executive'], blockedActions: [],
    rateLimit: 15, timeoutMs: 5000, auditRequired: true, safeForAutonomy: false,
    demoSupported: true, isDestructive: false, category: 'maritime',
  },
  {
    id: 'createVendorEscalation',
    name: 'Create Vendor Escalation',
    description: 'Creates a formal vendor escalation record with SLA tracking and escalation path.',
    inputSchema: { vendorId: 'string', issue: 'string', priority: 'string', slaDeadline: 'string' },
    outputSchema: { escalationId: 'string', slaTracked: 'boolean', assignedTo: 'string' },
    riskLevel: 'medium', requiresApproval: true, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'executive'], blockedActions: [],
    rateLimit: 20, timeoutMs: 5000, auditRequired: true, safeForAutonomy: false,
    demoSupported: true, isDestructive: false, category: 'operations',
  },
  {
    id: 'createSecurityIncidentNote',
    name: 'Create Security Incident Note',
    description: 'Creates a formal security incident note for cyber operations response tracking.',
    inputSchema: { incidentId: 'string', severity: 'string', summary: 'string', affectedSystems: 'string[]' },
    outputSchema: { noteId: 'string', incidentStatus: 'string', escalated: 'boolean' },
    riskLevel: 'critical', requiresApproval: true, allowedVerticals: ['aegis-defense', 'alloy-core'],
    allowedRoles: ['executive', 'board'], blockedActions: [],
    rateLimit: 5, timeoutMs: 10000, auditRequired: true, safeForAutonomy: false,
    demoSupported: true, isDestructive: false, category: 'security',
  },
  {
    id: 'generateBoardPacket',
    name: 'Generate Board Packet',
    description: 'Generates a structured board-ready briefing packet from current signals, outcomes, and proof.',
    inputSchema: { period: 'string', verticals: 'string[]', includeProof: 'boolean' },
    outputSchema: { packetId: 'string', pdfUrl: 'string', sections: 'string[]', pageCount: 'number' },
    riskLevel: 'low', requiresApproval: true, allowedVerticals: ['*'],
    allowedRoles: ['executive', 'board'], blockedActions: [],
    rateLimit: 5, timeoutMs: 30000, auditRequired: true, safeForAutonomy: false,
    demoSupported: true, isDestructive: false, category: 'reporting',
  },
  {
    id: 'generateProofPacket',
    name: 'Generate Proof Packet',
    description: 'Generates a cryptographically-linked proof packet for an executed action.',
    inputSchema: { actionId: 'string', traceId: 'string', approvalRecordId: 'string' },
    outputSchema: { packetId: 'string', hash: 'string', verified: 'boolean' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'executive', 'board', 'analyst'], blockedActions: [],
    rateLimit: 50, timeoutMs: 5000, auditRequired: true, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'proof',
  },
  {
    id: 'runOutcomeDriftCheck',
    name: 'Run Outcome Drift Check',
    description: 'Evaluates deviation between predicted and actual outcome trajectories.',
    inputSchema: { outcomeId: 'string', lookbackDays: 'number' },
    outputSchema: { driftScore: 'number', trend: 'string', alerts: 'string[]' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'analyst', 'executive'], blockedActions: [],
    rateLimit: 100, timeoutMs: 5000, auditRequired: false, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'analytics',
  },
  {
    id: 'runRevenueFrictionCheck',
    name: 'Run Revenue Friction Check',
    description: 'Analyzes pipeline friction points impeding revenue recognition.',
    inputSchema: { vertical: 'string', period: 'string', accountIds: 'string[]' },
    outputSchema: { frictionScore: 'number', blockers: 'string[]', recommendations: 'string[]' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['lyte-revenue', 'alloy-core'],
    allowedRoles: ['operator', 'analyst', 'executive'], blockedActions: [],
    rateLimit: 50, timeoutMs: 10000, auditRequired: false, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'revenue',
  },
  {
    id: 'runDecisionLatencyCheck',
    name: 'Run Decision Latency Check',
    description: 'Measures elapsed time between signal detection and approval/execution decisions.',
    inputSchema: { signalId: 'string', actionId: 'string' },
    outputSchema: { latencyMs: 'number', phase: 'string', benchmark: 'string', status: 'string' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'analyst', 'executive', 'board'], blockedActions: [],
    rateLimit: 200, timeoutMs: 2000, auditRequired: false, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'analytics',
  },
  {
    id: 'runMirrorEval',
    name: 'Run MirrorEval',
    description: 'Runs the MirrorEval evaluation layer against an action brief or PCE contract.',
    inputSchema: { targetId: 'string', targetType: 'string', evidenceRefs: 'string[]', sourceCoverage: 'number' },
    outputSchema: { evalId: 'string', disposition: 'string', overallScore: 'number', flags: 'string[]' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'analyst', 'executive', 'board'], blockedActions: [],
    rateLimit: 100, timeoutMs: 5000, auditRequired: true, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'evaluation',
  },
  {
    id: 'reconstructProofTrail',
    name: 'Reconstruct Proof Trail',
    description: 'Reconstructs the full causal proof trail from signal ingestion to action execution.',
    inputSchema: { actionId: 'string', depth: 'number' },
    outputSchema: { trailId: 'string', nodes: 'object[]', edges: 'object[]', verified: 'boolean' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'analyst', 'executive', 'board'], blockedActions: [],
    rateLimit: 50, timeoutMs: 10000, auditRequired: false, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'proof',
  },
  {
    id: 'runAgentTrustScore',
    name: 'Run Agent Trust Score',
    description: 'Computes the trust score for an operator based on execution history, accuracy, and policy compliance.',
    inputSchema: { operatorId: 'string', lookbackDays: 'number' },
    outputSchema: { trustScore: 'number', trend: 'string', factors: 'object' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'executive', 'board'], blockedActions: [],
    rateLimit: 50, timeoutMs: 5000, auditRequired: false, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'analytics',
  },
  {
    id: 'runConnectorHealthCheck',
    name: 'Run Connector Health Check',
    description: 'Validates the health and connectivity of registered external connectors.',
    inputSchema: { connectorId: 'string' },
    outputSchema: { connectorId: 'string', status: 'string', latencyMs: 'number', lastCheckedAt: 'string' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'analyst'], blockedActions: [],
    rateLimit: 100, timeoutMs: 5000, auditRequired: false, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'operations',
  },
  {
    id: 'createPCEContract',
    name: 'Create PCE Contract',
    description: 'Creates a Proof-Carrying Execution contract binding an action to its evidence chain.',
    inputSchema: { actionId: 'string', signalIds: 'string[]', mirrorEvalId: 'string', approvalRecordId: 'string' },
    outputSchema: { contractId: 'string', isValid: 'boolean', blockedReason: 'string | null' },
    riskLevel: 'medium', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'executive', 'board'], blockedActions: [],
    rateLimit: 30, timeoutMs: 5000, auditRequired: true, safeForAutonomy: false,
    demoSupported: true, isDestructive: false, category: 'governance',
  },
  {
    id: 'validatePCEContract',
    name: 'Validate PCE Contract',
    description: 'Validates an existing PCE contract\'s evidence chain and policy compliance.',
    inputSchema: { contractId: 'string' },
    outputSchema: { valid: 'boolean', violations: 'string[]', coverageScore: 'number' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'analyst', 'executive', 'board'], blockedActions: [],
    rateLimit: 50, timeoutMs: 3000, auditRequired: false, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'governance',
  },
  {
    id: 'runBusinessTwinDriftCheck',
    name: 'Run Business Twin Drift Check',
    description: 'Measures drift between the Business Twin model state and live signal data.',
    inputSchema: { twinId: 'string', vertical: 'string' },
    outputSchema: { driftScore: 'number', driftFields: 'string[]', recommendation: 'string' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['operator', 'analyst', 'executive'], blockedActions: [],
    rateLimit: 50, timeoutMs: 5000, auditRequired: false, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'analytics',
  },
  {
    id: 'generateBoardroomModeSummary',
    name: 'Generate Boardroom Mode Summary',
    description: 'Generates a condensed, executive-ready boardroom summary from the current fabric state.',
    inputSchema: { period: 'string', highlightCount: 'number' },
    outputSchema: { summaryId: 'string', content: 'string', keyMetrics: 'object' },
    riskLevel: 'safe', requiresApproval: false, allowedVerticals: ['*'],
    allowedRoles: ['executive', 'board'], blockedActions: [],
    rateLimit: 20, timeoutMs: 10000, auditRequired: false, safeForAutonomy: true,
    demoSupported: true, isDestructive: false, category: 'reporting',
  },
];

const MOCK_OUTPUTS: Record<string, MockFn> = {
  createRevOpsUpdate: (input, demo) => ({
    updateId: `rou-${Date.now()}`, status: 'created', notified: true,
    message: `RevOps update created for opportunity ${(input as { opportunityId?: string }).opportunityId ?? 'unknown'}`,
    demo,
  }),
  draftTeamsMessage: (input, demo) => ({
    draftId: `draft-${Date.now()}`, previewUrl: 'https://teams.microsoft.com/preview/demo',
    requiresSend: true,
    preview: `[DEMO] ${(input as { message?: string }).message?.slice(0, 100) ?? '...'}`,
    demo,
  }),
  generateExecutiveSummary: (input, demo) => ({
    summaryId: `sum-${Date.now()}`,
    content: `Executive Summary (${demo ? 'Demo' : 'Live'}): Analyzed ${((input as { signalIds?: unknown[] }).signalIds ?? []).length} signals and ${((input as { outcomeIds?: unknown[] }).outcomeIds ?? []).length} outcomes for period ${(input as { period?: string }).period ?? 'current'}. Overall business posture: elevated risk with identified remediation paths.`,
    wordCount: 47, demo,
  }),
  createJiraTicket: (_input, demo) => ({
    ticketId: `DEMO-${Math.floor(Math.random() * 9000) + 1000}`,
    url: 'https://jira.demo.a11oy.io/browse/DEMO-1234', status: 'open', demo,
  }),
  updateOpportunityStatus: (input, demo) => ({
    success: true, previousStatus: 'at_risk', newStatus: (input as { newStatus?: string }).newStatus ?? 'closed_won', demo,
  }),
  flagDuplicateScopeStackEntry: (input, demo) => ({
    flagId: `flag-${Date.now()}`, routed: true, reviewAssignee: 'counsel-team@demo.a11oy.io',
    entryId: (input as { entryId?: string }).entryId, demo,
  }),
  createMatterDeadlineAlert: (input, demo) => ({
    alertId: `alert-${Date.now()}`, notified: ['counsel@demo.a11oy.io'],
    escalatedTo: 'senior-counsel@demo.a11oy.io',
    deadline: (input as { deadlineDate?: string }).deadlineDate, demo,
  }),
  createVoyageRiskAlert: (input, demo) => ({
    alertId: `vra-${Date.now()}`, notified: ['ops@demo.vessels.io'],
    codiAdvisoryId: `codi-${Date.now()}`, vessel: (input as { vesselId?: string }).vesselId, demo,
  }),
  createVendorEscalation: (input, demo) => ({
    escalationId: `esc-${Date.now()}`, slaTracked: true,
    assignedTo: 'vendor-ops@demo.a11oy.io', vendor: (input as { vendorId?: string }).vendorId, demo,
  }),
  createSecurityIncidentNote: (input, demo) => ({
    noteId: `sec-${Date.now()}`, incidentStatus: 'open',
    escalated: (input as { severity?: string }).severity === 'critical', demo,
  }),
  generateBoardPacket: (_input, demo) => ({
    packetId: `bp-${Date.now()}`, pdfUrl: 'https://boardroom.demo.a11oy.io/packet/demo.pdf',
    sections: ['Executive Summary', 'Signal Analysis', 'Risk Assessment', 'Actions', 'Proof Ledger'],
    pageCount: 12, demo,
  }),
  generateProofPacket: (input, demo) => ({
    packetId: `pp-${Date.now()}`,
    hash: `sha256:${Buffer.from(JSON.stringify(input)).toString('base64').slice(0, 32)}`,
    verified: true, demo,
  }),
  runOutcomeDriftCheck: (_input, demo) => ({
    driftScore: 0.23, trend: 'improving', alerts: [], demo,
  }),
  runRevenueFrictionCheck: (_input, demo) => ({
    frictionScore: 0.41,
    blockers: ['Delayed contract signing', 'Pending legal review'],
    recommendations: ['Accelerate legal review cycle', 'Assign dedicated CSM to at-risk accounts'], demo,
  }),
  runDecisionLatencyCheck: (_input, demo) => ({
    latencyMs: 4320000, phase: 'approval_wait', benchmark: '2h',
    status: 'exceeded', demo,
  }),
  runMirrorEval: (_input, demo) => ({
    evalId: `eval-${Date.now()}`, disposition: 'pass', overallScore: 0.82,
    flags: [], demo,
  }),
  reconstructProofTrail: (_input, demo) => ({
    trailId: `trail-${Date.now()}`,
    nodes: [{ id: 'signal', type: 'signal' }, { id: 'analysis', type: 'operator' }, { id: 'action', type: 'action' }],
    edges: [{ from: 'signal', to: 'analysis' }, { from: 'analysis', to: 'action' }],
    verified: true, demo,
  }),
  runAgentTrustScore: (_input, demo) => ({
    trustScore: 0.91, trend: 'stable',
    factors: { accuracy: 0.94, policyCompliance: 0.89, approvalAccuracy: 0.92 }, demo,
  }),
  runConnectorHealthCheck: (input, demo) => ({
    connectorId: (input as { connectorId?: string }).connectorId ?? 'unknown',
    status: 'healthy', latencyMs: 42, lastCheckedAt: new Date().toISOString(), demo,
  }),
  createPCEContract: (input, demo) => ({
    contractId: `pce-${Date.now()}`, isValid: true, blockedReason: null,
    actionId: (input as { actionId?: string }).actionId, demo,
  }),
  validatePCEContract: (input, demo) => ({
    valid: true, violations: [], coverageScore: 0.88,
    contractId: (input as { contractId?: string }).contractId, demo,
  }),
  runBusinessTwinDriftCheck: (_input, demo) => ({
    driftScore: 0.12, driftFields: [],
    recommendation: 'Business Twin is aligned with live signals. No action required.', demo,
  }),
  generateBoardroomModeSummary: (_input, demo) => ({
    summaryId: `brs-${Date.now()}`,
    content: 'Boardroom Summary (Demo): 3 critical signals active across 2 verticals. 1 action pending executive approval. Proof coverage: 92%.',
    keyMetrics: { criticalSignals: 3, pendingActions: 1, proofCoverage: 0.92, fabricHealth: 'degraded' }, demo,
  }),
};

const toolMap = new Map<string, ToolMetadata>(TOOL_CATALOGUE.map((t) => [t.id, t]));

export function getTool(toolId: string): ToolMetadata | undefined {
  return toolMap.get(toolId);
}

export function listTools(): ToolMetadata[] {
  return TOOL_CATALOGUE;
}

export function executeToolMock(toolId: string, input: Record<string, unknown>, isDemoMode: boolean): ToolResult {
  const tool = toolMap.get(toolId);
  if (!tool) {
    return { ok: false, toolId, error: `Tool "${toolId}" not found in registry.`, durationMs: 0 };
  }
  if (isDemoMode && !tool.demoSupported) {
    return { ok: false, toolId, error: `Tool "${toolId}" is not available in demo mode.`, durationMs: 0 };
  }
  const t = Date.now();
  const mockFn = MOCK_OUTPUTS[toolId];
  const output = mockFn ? mockFn(input, isDemoMode) : { status: 'ok', toolId, demo: isDemoMode };
  return { ok: true, toolId, output, durationMs: Date.now() - t, isDemo: isDemoMode };
}

export function getMcpToolDescriptions(): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return TOOL_CATALOGUE.map((t) => ({
    name: t.id,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
}
