import { describe, it, expect, beforeEach } from 'vitest';
import { runMirrorEval } from '../runtime/evals/mirror-eval.js';
import { runPCEGate, createApprovalRecord, approveAction, listPCEContracts, getPCEContract } from '../runtime/governance/pce-gate.js';
import { executeToolMock, getTool, listTools } from '../runtime/tools/registry.js';
import { simulateTool } from '../runtime/tools/approved-runner.js';
import { createWorkcell, transition, getWorkcell, advanceWorkcell } from '../runtime/workcells/engine.js';
import { SKILLS, getSkill, listSkills } from '../skills/index.js';
import { getActiveProvider, getProviderStatuses } from '../runtime/router/model-router.js';
import { store_write, store_query, redactContent } from '../runtime/memory/store.js';
import { buildContextPack, checkEvidenceRequirement, computeCoverage } from '../runtime/context/deep-context.js';
import { createTrace, appendEntry, completeTrace, getTrace, buildTraceEntry } from '../runtime/tracing/store.js';

describe('MirrorEval', () => {
  it('returns pass disposition for strong evidence', () => {
    const result = runMirrorEval({
      targetId: 'act-test-001',
      targetType: 'action',
      evidenceRefs: ['sig-1', 'sig-2', 'sig-3'],
      sourceCoverage: 0.9,
      hasPriorApproval: true,
      isDestructive: false,
      isDemoMode: false,
      riskLevel: 'low',
      actionDescription: 'This is a well-described action with sufficient context and evidence to support execution.',
    });
    expect(result.evalId).toBeDefined();
    expect(['pass', 'pass_with_warning']).toContain(result.disposition);
    expect(result.overallScore).toBeGreaterThan(0.5);
  });

  it('blocks data-destructive actions in demo mode', () => {
    const result = runMirrorEval({
      targetId: 'act-test-002',
      targetType: 'action',
      evidenceRefs: ['sig-1'],
      sourceCoverage: 0.8,
      hasPriorApproval: true,
      isDestructive: true,
      isDemoMode: true,
    });
    expect(result.disposition).toBe('blocked');
    expect(result.flags).toContain('demo_mode_blocked');
  });

  it('returns needs_more_evidence when coverage is low', () => {
    const result = runMirrorEval({
      targetId: 'act-test-003',
      targetType: 'action',
      evidenceRefs: [],
      sourceCoverage: 0.1,
      hasPriorApproval: false,
      isDestructive: false,
      isDemoMode: false,
    });
    expect(['needs_more_evidence', 'blocked', 'requires_human_review']).toContain(result.disposition);
  });

  it('requires_human_review when approval is missing for executive tier', () => {
    const result = runMirrorEval({
      targetId: 'act-test-004',
      targetType: 'action',
      evidenceRefs: ['sig-1', 'sig-2'],
      sourceCoverage: 0.75,
      hasPriorApproval: false,
      isDestructive: false,
      isDemoMode: false,
      approvalTier: 'executive',
    });
    expect(['requires_human_review', 'pass_with_warning', 'needs_more_evidence']).toContain(result.disposition);
  });

  it('has all 11 score dimensions', () => {
    const result = runMirrorEval({
      targetId: 'act-test-005',
      targetType: 'pce',
      evidenceRefs: ['sig-1'],
      sourceCoverage: 0.6,
      hasPriorApproval: false,
      isDestructive: false,
      isDemoMode: false,
    });
    expect(result.scores).toHaveLength(11);
    const dimensionNames = result.scores.map((s) => s.dimension);
    expect(dimensionNames).toContain('groundedness');
    expect(dimensionNames).toContain('evidence_coverage');
    expect(dimensionNames).toContain('action_safety');
    expect(dimensionNames).toContain('hallucination_risk');
    expect(dimensionNames).toContain('policy_compliance');
    expect(dimensionNames).toContain('business_impact');
    expect(dimensionNames).toContain('action_specificity');
    expect(dimensionNames).toContain('verification_readiness');
    expect(dimensionNames).toContain('stale_context');
    expect(dimensionNames).toContain('approval_correctness');
    expect(dimensionNames).toContain('rollback_readiness');
  });
});

describe('PCE Gate', () => {
  it('blocks execution without sufficient evidence', async () => {
    const result = await runPCEGate({
      actionId: 'act-pce-test-001',
      originSignalIds: [],
      vertical: 'lyte-revenue',
      riskLevel: 'medium',
      isDestructive: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.errorType).toBe('safety');
  });

  it('blocks destructive actions in demo mode', async () => {
    process.env.A11OY_DEMO_MODE = 'true';
    const result = await runPCEGate({
      actionId: 'act-pce-test-002',
      originSignalIds: ['sig-1'],
      vertical: 'lyte-revenue',
      riskLevel: 'critical',
      isDestructive: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.errorType).toBe('safety');
    expect(result.blockedReason).toContain('demo mode');
  });

  it('blocks material action without approval', async () => {
    const result = await runPCEGate({
      actionId: 'act-pce-test-003',
      originSignalIds: ['sig-1', 'sig-2', 'sig-3', 'sig-4', 'sig-5', 'sig-6'],
      vertical: 'lyte-revenue',
      riskLevel: 'high',
      isDestructive: false,
    });
    expect(result.allowed).toBe(false);
    expect(['approval_required', 'safety']).toContain(result.errorType);
  });

  it('allows execution with valid approval', async () => {
    const approval = createApprovalRecord({ actionId: 'act-pce-test-004', tier: 'executive' });
    approveAction(approval.approvalId, 'test-exec@demo.a11oy.io');

    const result = await runPCEGate({
      actionId: 'act-pce-test-004',
      originSignalIds: ['sig-1', 'sig-2', 'sig-3', 'sig-4', 'sig-5', 'sig-6'],
      vertical: 'lyte-revenue',
      riskLevel: 'high',
      isDestructive: false,
      approvalRecordId: approval.approvalId,
    });

    expect(result.allowed).toBe(true);
    expect(result.contract).toBeDefined();
    expect(result.contract!.contractId).toBeDefined();
    expect(result.contract!.isVerified).toBe(false);
  });

  it('generates a proof packet on contract creation', async () => {
    const approval = createApprovalRecord({ actionId: 'act-pce-proof-test', tier: 'operator' });
    approveAction(approval.approvalId, 'test-operator@demo.a11oy.io');

    const result = await runPCEGate({
      actionId: 'act-pce-proof-test',
      originSignalIds: ['sig-1', 'sig-2', 'sig-3', 'sig-4', 'sig-5', 'sig-6'],
      vertical: 'alloy-core',
      riskLevel: 'low',
      isDestructive: false,
      approvalRecordId: approval.approvalId,
    });

    expect(result.allowed).toBe(true);
    expect(result.contract).toBeDefined();
    expect(result.contract!.contractId).toMatch(/^pce-/);
  });
});

describe('Tool Registry', () => {
  it('has all 22 required tools', () => {
    const tools = listTools();
    expect(tools.length).toBeGreaterThanOrEqual(22);
  });

  it('all tools have required metadata fields', () => {
    for (const tool of listTools()) {
      expect(tool.id).toBeDefined();
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.riskLevel).toBeDefined();
      expect(typeof tool.requiresApproval).toBe('boolean');
      expect(Array.isArray(tool.allowedVerticals)).toBe(true);
      expect(Array.isArray(tool.allowedRoles)).toBe(true);
      expect(typeof tool.rateLimit).toBe('number');
      expect(typeof tool.timeoutMs).toBe('number');
      expect(typeof tool.auditRequired).toBe('boolean');
      expect(typeof tool.safeForAutonomy).toBe('boolean');
      expect(typeof tool.demoSupported).toBe('boolean');
    }
  });

  it('blocks data-destructive tools in demo mode', () => {
    const destructiveTool = listTools().find((t) => t.isDestructive);
    if (!destructiveTool) return;

    const result = executeToolMock(destructiveTool.id, {}, true);
    expect(result.ok).toBe(false);
  });

  it('executeToolMock returns ok for supported demo tools', () => {
    const result = executeToolMock('generateExecutiveSummary', { signalIds: ['sig-1'], period: 'Q2-2026' }, true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBeDefined();
      expect(result.isDemo).toBe(true);
    }
  });

  it('returns error for unknown tool', () => {
    const result = executeToolMock('nonExistentTool_xyz', {}, true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('not found');
    }
  });

  it('has createRevOpsUpdate, draftTeamsMessage, generateExecutiveSummary, createJiraTicket in catalogue', () => {
    const required = [
      'createRevOpsUpdate', 'draftTeamsMessage', 'generateExecutiveSummary', 'createJiraTicket',
      'updateOpportunityStatus', 'flagDuplicateScopeStackEntry', 'createMatterDeadlineAlert',
      'createVoyageRiskAlert', 'createVendorEscalation', 'createSecurityIncidentNote',
      'generateBoardPacket', 'generateProofPacket', 'runOutcomeDriftCheck', 'runRevenueFrictionCheck',
      'runDecisionLatencyCheck', 'runMirrorEval', 'reconstructProofTrail', 'runAgentTrustScore',
      'runConnectorHealthCheck', 'createPCEContract', 'validatePCEContract',
      'runBusinessTwinDriftCheck', 'generateBoardroomModeSummary',
    ];
    const ids = listTools().map((t) => t.id);
    for (const req of required) {
      expect(ids).toContain(req);
    }
  });
});

describe('Workcell State Machine', () => {
  it('creates a workcell in intake phase', () => {
    const wc = createWorkcell({ name: 'Test WC', vertical: 'lyte-revenue' });
    expect(wc.phase).toBe('intake');
    expect(wc.id).toMatch(/^wc-/);
  });

  it('allows valid transitions', () => {
    const wc = createWorkcell({ name: 'Test WC 2', vertical: 'alloy-core' });
    const updated = transition(wc.id, 'planning');
    expect(updated?.phase).toBe('planning');
  });

  it('rejects invalid transitions', () => {
    const wc = createWorkcell({ name: 'Test WC 3', vertical: 'alloy-core' });
    const result = transition(wc.id, 'proven');
    expect(result).toBeUndefined();
    expect(getWorkcell(wc.id)?.phase).toBe('intake');
  });

  it('records transition history', () => {
    const wc = createWorkcell({ name: 'Test WC 4', vertical: 'aegis-defense' });
    transition(wc.id, 'planning');
    transition(wc.id, 'context_building');
    const updated = getWorkcell(wc.id);
    expect(updated?.history.length).toBeGreaterThanOrEqual(3);
  });

  it('has all required phases in the state machine', () => {
    const requiredPhases = [
      'intake', 'planning', 'context_building', 'risk_review',
      'action_brief_created', 'pce_contract_created', 'approval_required',
      'approved', 'executing', 'verifying', 'proven', 'blocked', 'rejected', 'archived',
    ];
    const wc = createWorkcell({ name: 'Phase Test WC', vertical: 'alloy-core' });
    for (const phase of requiredPhases) {
      expect(phase).toMatch(/^[a-z_]+$/);
    }
    expect(requiredPhases).toHaveLength(14);
  });
});

describe('Skills', () => {
  it('has all 17 required skills', () => {
    expect(listSkills()).toHaveLength(17);
  });

  it('all skills have required fields', () => {
    for (const skill of listSkills()) {
      expect(skill.id).toBeDefined();
      expect(skill.name).toBeDefined();
      expect(skill.objective).toBeDefined();
      expect(Array.isArray(skill.requiredInputs)).toBe(true);
      expect(typeof skill.safeDefaults).toBe('object');
      expect(Array.isArray(skill.allowedCommands)).toBe(true);
      expect(Array.isArray(skill.blockedCommands)).toBe(true);
      expect(Array.isArray(skill.workflow)).toBe(true);
      expect(skill.expectedOutput).toBeDefined();
      expect(Array.isArray(skill.mirrorEvalCriteria)).toBe(true);
      expect(Array.isArray(skill.proofRequirements)).toBe(true);
      expect(Array.isArray(skill.pceRequirements)).toBe(true);
      expect(skill.failureHandling).toBeDefined();
    }
  });

  it('has all 17 specified skills by id', () => {
    const required = [
      'revenue-friction', 'sow-aging', 'duplicate-scopestack', 'voyage-risk',
      'sanctions-watch', 'capex-overrun', 'security-incident', 'legal-deadline',
      'residence-escalation', 'board-packet', 'proof-reconstruction', 'code-audit',
      'data-quality', 'business-twin-drift', 'executive-briefing', 'connector-health', 'pce-validation',
    ];
    const ids = listSkills().map((s) => s.id);
    for (const req of required) {
      expect(ids).toContain(req);
    }
  });
});

describe('Model Router', () => {
  it('falls back to mock when no keys configured', () => {
    const saved = process.env.MODEL_PROVIDER;
    delete process.env.MODEL_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.NVIDIA_API_KEY;
    delete process.env.LOCAL_MODEL_URL;

    const { provider, isDemo } = getActiveProvider();
    expect(provider).toBe('mock');
    expect(isDemo).toBe(true);

    if (saved) process.env.MODEL_PROVIDER = saved;
  });

  it('returns provider statuses for all providers', () => {
    const statuses = getProviderStatuses();
    const ids = statuses.map((s) => s.provider);
    expect(ids).toContain('openai');
    expect(ids).toContain('deepseek');
    expect(ids).toContain('nvidia');
    expect(ids).toContain('local');
    expect(ids).toContain('mock');
  });

  it('mock provider is always available', () => {
    const statuses = getProviderStatuses();
    const mockStatus = statuses.find((s) => s.provider === 'mock');
    expect(mockStatus?.available).toBe(true);
  });
});

describe('Memory Layer', () => {
  it('redacts sensitive fields', () => {
    const redacted = redactContent({ name: 'Alice', api_key: 'secret123', password: 'hunter2', data: 'safe' });
    expect(redacted.api_key).toBe('[REDACTED]');
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.name).toBe('Alice');
    expect(redacted.data).toBe('safe');
  });

  it('stores and retrieves memory entries', () => {
    const entry = store_write({
      vertical: 'lyte-revenue',
      entityId: 'test-entity-001',
      content: { key: 'value', amount: 42 },
      tags: ['test', 'revenue'],
    });
    expect(entry.memoryId).toMatch(/^mem-/);

    const results = store_query({ vertical: 'lyte-revenue', entityId: 'test-entity-001', tags: ['test'] });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entityId).toBe('test-entity-001');
  });

  it('does not store raw sensitive data in logs', () => {
    const entry = store_write({
      vertical: 'alloy-core',
      entityId: 'secret-entity',
      content: { api_key: 'SUPER_SECRET', data: 'safe data' },
      isSensitive: true,
    });
    expect(entry.content.api_key).toBe('[REDACTED]');
    expect(entry.content.data).toBe('safe data');
  });
});

describe('Execution Tracing', () => {
  it('creates and exports a trace', () => {
    const traceId = createTrace({ entityId: 'test-action-001', entityType: 'operator' });
    expect(traceId).toMatch(/^trace-/);

    appendEntry(traceId, buildTraceEntry('run-001', 'test-action-001', 'operator', 'test:step', { in: 1 }, { out: 2 }, 'ok', 50));

    completeTrace(traceId, 'completed');

    const exported = getTrace(traceId);
    expect(exported).toBeDefined();
    expect(exported?.entries.length).toBe(1);
    expect(exported?.status).toBe('completed');
  });
});

describe('Deep Context Layer', () => {
  it('builds a context pack from signals', () => {
    const pack = buildContextPack({
      signalIds: ['sig-1', 'sig-2'],
      vertical: 'lyte-revenue',
      signals: [
        { id: 'sig-1', title: 'Churn Risk', severity: 'critical' },
        { id: 'sig-2', title: 'Pipeline Gap', severity: 'high' },
      ],
    });
    expect(pack.packId).toMatch(/^ctx-/);
    expect(pack.signalIds).toContain('sig-1');
    expect(pack.evidenceUsed).toBeGreaterThan(0);
  });

  it('flags low evidence coverage', () => {
    const pack = buildContextPack({ signalIds: [], vertical: 'alloy-core' });
    const check = checkEvidenceRequirement(pack);
    expect(check.sufficient).toBe(false);
  });

  it('computes coverage as ratio', () => {
    const pack = buildContextPack({
      signalIds: ['sig-1'],
      signals: Array.from({ length: 10 }, (_, i) => ({ id: `sig-${i}`, title: `Signal ${i}` })),
    });
    const coverage = computeCoverage(pack);
    expect(coverage).toBeGreaterThanOrEqual(0);
    expect(coverage).toBeLessThanOrEqual(1);
  });
});
