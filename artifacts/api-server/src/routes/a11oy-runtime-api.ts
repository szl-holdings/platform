import { Router, type Request, type Response } from 'express';
import { logger } from '../lib/logger.js';
import {
  SEED_SIGNALS,
  SEED_OUTCOMES,
  SEED_POLICIES,
  SEED_PROOF_PACKETS,
} from '@workspace/a11oy-fabric/seed';

import { listOperators, getOperator, routeOperator, handoff } from '../a11oy/runtime/agents/registry.js';
import { listTools, getTool, getMcpToolDescriptions } from '../a11oy/runtime/tools/registry.js';
import { simulateTool, runApprovedTool } from '../a11oy/runtime/tools/approved-runner.js';
import { listEvals, getEval, runMirrorEval, storeEval } from '../a11oy/runtime/evals/mirror-eval.js';
import { listEntries as listMemoryEntries, getStats as getMemoryStats } from '../a11oy/runtime/memory/store.js';
import {
  listPCEContracts,
  getPCEContract,
  verifyPCEContract,
  listProofPackets,
  listApprovalRecords,
  findApprovalByAction,
  approveAction,
  rejectAction,
  runPCEGate,
} from '../a11oy/runtime/governance/pce-gate.js';
import {
  createWorkcell,
  getWorkcell,
  listWorkcells,
  advanceWorkcell,
  approveWorkcell,
  replayWorkcell,
} from '../a11oy/runtime/workcells/engine.js';
import { listTraces, getTrace, exportTrace } from '../a11oy/runtime/tracing/store.js';
import { listSkills, getSkill, executeSkill } from '../a11oy/skills/index.js';
import { getProviderStatuses, getActiveProvider, getGateSummary } from '../a11oy/runtime/router/model-router.js';
import { getBridgeStatus, startHealthCheckLoop } from '../a11oy/runtime/substrate-worker-bridge.js';
import { listModelEntries, getModelEntry, getRegistrySummary, checkHfLiveRoutingGate } from '../a11oy/runtime/model-registry.js';
import { generatePlan } from '../a11oy/runtime/operator/planner.js';
import {
  createRun,
  getRun,
  fetchRun,
  listRuns,
  listRunsFromDb,
  approveStep,
  rejectStep,
  recordStepExecution,
  getReplayData,
} from '../a11oy/runtime/operator/run-store.js';
import { executeToolMock, getTool } from '../a11oy/runtime/tools/registry.js';
import { randomUUID } from 'node:crypto';

const router = Router();
const now = () => new Date().toISOString();

const DEMO_MODE = process.env.A11OY_DEMO_MODE !== 'false';

const LIVE_ACTIONS: Array<{
  id: string;
  title: string;
  description: string;
  vertical: string;
  status: string;
  priority: string;
  requiresApproval: boolean;
  approvalTier: string;
  linkedSignalIds: string[];
  mirrorEvalId?: string;
  pceContractId?: string;
  approvalRecordId?: string;
  riskLevel: string;
  isDestructive: boolean;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: 'act-001',
    title: 'Executive Outreach to At-Risk Mid-Market Accounts',
    description: 'Coordinate executive-level touchpoints for accounts with churn probability > 70%.',
    vertical: 'lyte-revenue',
    status: 'approved',
    priority: 'urgent',
    requiresApproval: true,
    approvalTier: 'executive',
    linkedSignalIds: ['sig-lyte-002'],
    riskLevel: 'high',
    isDestructive: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'act-002',
    title: 'Emergency Covenant Remediation: Lease-Up Campaign',
    description: 'Launch aggressive lease-up campaign to recover covenant compliance within 90 days.',
    vertical: 'terra-real-estate',
    status: 'pending_approval',
    priority: 'urgent',
    requiresApproval: true,
    approvalTier: 'executive',
    linkedSignalIds: ['sig-terra-001'],
    riskLevel: 'critical',
    isDestructive: false,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'act-003',
    title: 'Notify Lender: Covenant Remediation Plan Submission',
    description: 'Submit formal remediation plan to lender within 48 hours per covenant terms.',
    vertical: 'terra-real-estate',
    status: 'recommended',
    priority: 'urgent',
    requiresApproval: true,
    approvalTier: 'executive',
    linkedSignalIds: ['sig-terra-001'],
    riskLevel: 'critical',
    isDestructive: false,
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'act-004',
    title: 'Dispatch SIRE 2.0 Remediation Team to 4 Non-Compliant Tankers',
    description: 'Deploy SIRE 2.0 inspection team to address PSC deficiencies across 4 tankers.',
    vertical: 'vessels-maritime',
    status: 'recommended',
    priority: 'high',
    requiresApproval: true,
    approvalTier: 'operator',
    linkedSignalIds: ['sig-vessels-002'],
    riskLevel: 'high',
    isDestructive: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'act-005',
    title: 'Resolve State Engine Snapshot Contention',
    description: 'Auto-resolve snapshot contention in the A11oy state engine.',
    vertical: 'alloy-core',
    status: 'executing',
    priority: 'high',
    requiresApproval: false,
    approvalTier: 'auto',
    linkedSignalIds: ['sig-alloy-001'],
    riskLevel: 'low',
    isDestructive: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({
    ok: true,
    data,
    meta: { ...meta, timestamp: now(), mode: DEMO_MODE ? 'demo' : 'governed', phase: 'Phase 2 — Runtime' },
  });
}

function err(res: Response, statusCode: number, type: string, message: string, retryable = false) {
  res.status(statusCode).json({
    ok: false,
    error: { type, message, retryable, timestamp: now() },
  });
}

function findAction(id: string) {
  return LIVE_ACTIONS.find((a) => a.id === id);
}

router.post('/a11oy/signals', async (req: Request, res: Response) => {
  try {
    const { vertical, entity, title, description, severity, businessImpact, evidenceRefs, tags, metadata } = req.body as {
      vertical?: string;
      entity?: string;
      title?: string;
      description?: string;
      severity?: string;
      businessImpact?: string;
      evidenceRefs?: string[];
      tags?: string[];
      metadata?: Record<string, unknown>;
    };

    if (!vertical || !title || !severity) {
      return err(res, 400, 'validation', 'Required fields: vertical, title, severity');
    }

    const validVerticals = ['lyte-revenue', 'vessels-maritime', 'terra-real-estate', 'aegis-defense', 'prism-counsel', 'carlota-jo', 'alloy-core'];
    if (!validVerticals.includes(vertical)) {
      return err(res, 400, 'validation', `Invalid vertical. Must be one of: ${validVerticals.join(', ')}`);
    }

    const signal = {
      id: `sig-runtime-${randomUUID().slice(0, 8)}`,
      vertical,
      entity: entity ?? 'unknown',
      title,
      description: description ?? '',
      severity,
      status: 'active',
      businessImpact: businessImpact ?? 'Under analysis',
      evidenceRefs: evidenceRefs ?? [],
      owner: 'a11oy-runtime',
      detectedAt: now(),
      updatedAt: now(),
      tags: tags ?? [],
      metadata: metadata ?? {},
    };

    const operator = getOperator(routeOperator({ signalSeverity: severity, vertical }));
    const operatorOutput = await operator.run({
      actionId: `action-for-${signal.id}`,
      signalIds: [signal.id],
      vertical,
      input: { signal, severity },
    });

    ok(res, { signal, operatorOutput: { operatorId: operatorOutput.operatorId, result: operatorOutput.result } });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /signals error');
    err(res, 500, 'execution', 'Signal ingestion failed.');
  }
});

router.post('/a11oy/actions/:id/approve', async (req: Request, res: Response) => {
  try {
    const action = findAction(req.params.id);
    if (!action) return err(res, 404, 'not_found', `Action "${req.params.id}" not found.`);

    if (!action.requiresApproval) {
      return err(res, 400, 'validation', 'This action does not require approval.');
    }

    if (action.status === 'approved' || action.status === 'executing' || action.status === 'completed') {
      return err(res, 409, 'conflict', `Action is already in "${action.status}" state.`);
    }

    const { approvedBy: rawApprovedBy, acknowledged, justification } = req.body as { approvedBy?: string; acknowledged?: boolean; justification?: string };
    const approvedBy = rawApprovedBy ?? (acknowledged === true ? 'acknowledged-via-cli' : undefined);
    if (!approvedBy) return err(res, 400, 'validation', 'approvedBy or acknowledged:true is required.');

    let approvalRecord = findApprovalByAction(action.id);
    if (!approvalRecord) {
      const { createApprovalRecord } = await import('../a11oy/runtime/governance/pce-gate.js');
      approvalRecord = createApprovalRecord({ actionId: action.id, tier: action.approvalTier });
    }

    const updated = approveAction(approvalRecord.approvalId, approvedBy);
    action.status = 'approved';
    action.approvalRecordId = approvalRecord.approvalId;
    action.updatedAt = now();

    ok(res, {
      actionId: action.id,
      status: 'approved',
      approvalRecord: updated,
      justification,
    });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /actions/:id/approve error');
    err(res, 500, 'execution', 'Approval failed.');
  }
});

router.post('/a11oy/actions/:id/execute', async (req: Request, res: Response) => {
  try {
    const action = findAction(req.params.id);
    if (!action) return err(res, 404, 'not_found', `Action "${req.params.id}" not found.`);

    if (action.requiresApproval && action.status !== 'approved') {
      return err(res, 403, 'approval_required', `Action requires approval (tier: ${action.approvalTier}) before execution.`);
    }

    if (action.isDestructive && DEMO_MODE) {
      return err(res, 403, 'safety', 'Destructive actions cannot be executed in demo mode.');
    }

    const pceResult = await runPCEGate({
      actionId: action.id,
      originSignalIds: action.linkedSignalIds,
      vertical: action.vertical,
      riskLevel: action.riskLevel,
      isDestructive: action.isDestructive,
      approvalRecordId: action.approvalRecordId,
    });

    if (!pceResult.allowed) {
      const statusCode = pceResult.errorType === 'approval_required' ? 403 : 400;
      return err(res, statusCode, pceResult.errorType ?? 'policy', pceResult.blockedReason ?? 'PCE gate blocked execution.');
    }

    action.status = 'executing';
    action.pceContractId = pceResult.contract?.contractId;
    action.updatedAt = now();

    ok(res, {
      actionId: action.id,
      status: 'executing',
      pceContractId: pceResult.contract?.contractId,
      mode: pceResult.contract?.mode,
      message: 'Action is now executing under governed conditions.',
    });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /actions/:id/execute error');
    err(res, 500, 'execution', 'Execution failed.');
  }
});

router.post('/a11oy/actions/:id/verify', async (req: Request, res: Response) => {
  try {
    const action = findAction(req.params.id);
    if (!action) return err(res, 404, 'not_found', `Action "${req.params.id}" not found.`);

    if (!action.pceContractId) {
      return err(res, 400, 'validation', 'No PCE contract found for this action. Execute first.');
    }

    const result = await verifyPCEContract(action.pceContractId);
    if (!result.verified) {
      return err(res, 400, 'execution', result.reason ?? 'Verification failed.');
    }

    action.status = 'completed';
    action.updatedAt = now();

    const contract = getPCEContract(action.pceContractId);

    ok(res, {
      actionId: action.id,
      status: 'completed',
      verified: true,
      proofPacketId: contract?.proofPacketId,
      pceContractId: action.pceContractId,
    });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /actions/:id/verify error');
    err(res, 500, 'execution', 'Verification failed.');
  }
});

router.post('/a11oy/workcells', async (req: Request, res: Response) => {
  try {
    const { name, vertical, operatorId, approvalTier, originSignalIds, description, tools } = req.body as {
      name?: string;
      vertical?: string;
      operatorId?: string;
      approvalTier?: string;
      originSignalIds?: string[];
      description?: string;
      tools?: string[];
    };

    if (!name || !vertical) {
      return err(res, 400, 'validation', 'Required fields: name, vertical');
    }

    const wc = createWorkcell({
      name,
      description,
      vertical,
      operatorId,
      approvalTier: (approvalTier as 'auto' | 'operator' | 'executive' | undefined),
      originSignalIds,
      tools,
    });

    ok(res, wc, { created: true });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /workcells error');
    err(res, 500, 'execution', 'Workcell creation failed.');
  }
});

router.post('/a11oy/workcells/:id/advance', async (req: Request, res: Response) => {
  try {
    const wc = await advanceWorkcell(req.params.id);
    if (!wc) return err(res, 404, 'not_found', `Workcell "${req.params.id}" not found.`);
    ok(res, wc);
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /workcells/:id/advance error');
    err(res, 500, 'execution', 'Workcell advancement failed.');
  }
});

router.post('/a11oy/workcells/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body as { approvedBy?: string };
    if (!approvedBy) return err(res, 400, 'validation', 'approvedBy is required.');
    const wc = approveWorkcell(req.params.id, approvedBy);
    if (!wc) return err(res, 404, 'not_found', `Workcell "${req.params.id}" not found or not in approval_required phase.`);
    ok(res, wc);
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /workcells/:id/approve error');
    err(res, 500, 'execution', 'Workcell approval failed.');
  }
});

router.post('/a11oy/workcells/:id/replay', async (req: Request, res: Response) => {
  try {
    const wc = replayWorkcell(req.params.id);
    if (!wc) return err(res, 404, 'not_found', `Workcell "${req.params.id}" not found.`);
    ok(res, wc, { replayed: true });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /workcells/:id/replay error');
    err(res, 500, 'execution', 'Workcell replay failed.');
  }
});

router.post('/a11oy/tools/:id/simulate', async (req: Request, res: Response) => {
  try {
    const tool = getTool(req.params.id);
    if (!tool) return err(res, 404, 'not_found', `Tool "${req.params.id}" not found.`);

    const result = await simulateTool(req.params.id, req.body as Record<string, unknown> ?? {});
    ok(res, result);
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /tools/:id/simulate error');
    err(res, 500, 'execution', 'Tool simulation failed.');
  }
});

router.post('/a11oy/tools/:id/run', async (req: Request, res: Response) => {
  try {
    const tool = getTool(req.params.id);
    if (!tool) return err(res, 404, 'not_found', `Tool "${req.params.id}" not found.`);

    const { actionId, vertical, approvalRecordId, originSignalIds, riskLevel } = req.body as {
      actionId?: string;
      vertical?: string;
      approvalRecordId?: string;
      originSignalIds?: string[];
      riskLevel?: string;
    };

    if (!actionId) return err(res, 400, 'validation', 'actionId is required to run a tool.');

    const result = await runApprovedTool({
      toolId: req.params.id,
      input: req.body as Record<string, unknown>,
      actionId,
      vertical: vertical ?? 'alloy-core',
      riskLevel: riskLevel ?? tool.riskLevel,
      originSignalIds: originSignalIds ?? [],
      approvalRecordId,
    });

    if (!result.ok) {
      const statusCode = result.errorType === 'approval_required' ? 403 : result.errorType === 'not_found' ? 404 : 400;
      return err(res, statusCode, result.errorType ?? 'policy', result.blockedReason ?? 'Tool execution blocked.');
    }

    ok(res, result.toolResult, { pceContractId: result.pceContractId });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /tools/:id/run error');
    err(res, 500, 'execution', 'Tool execution failed.');
  }
});

router.post('/a11oy/evals/run', async (req: Request, res: Response) => {
  try {
    const { targetId, targetType, evidenceRefs, sourceCoverage, isDestructive, hasPriorApproval, isDemoMode, policyViolations, riskLevel, actionDescription } = req.body as {
      targetId?: string;
      targetType?: string;
      evidenceRefs?: string[];
      sourceCoverage?: number;
      isDestructive?: boolean;
      hasPriorApproval?: boolean;
      isDemoMode?: boolean;
      policyViolations?: string[];
      riskLevel?: string;
      actionDescription?: string;
    };

    if (!targetId || !targetType) {
      return err(res, 400, 'validation', 'Required fields: targetId, targetType');
    }

    const result = runMirrorEval({
      targetId,
      targetType: targetType as 'action' | 'workcell' | 'signal' | 'pce',
      evidenceRefs: evidenceRefs ?? [],
      sourceCoverage: sourceCoverage ?? 0.5,
      isDestructive: isDestructive ?? false,
      hasPriorApproval: hasPriorApproval ?? false,
      isDemoMode: isDemoMode ?? DEMO_MODE,
      policyViolations,
      riskLevel,
      actionDescription,
    });

    storeEval(result);
    ok(res, result);
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /evals/run error');
    err(res, 500, 'execution', 'MirrorEval run failed.');
  }
});

router.post('/a11oy/pce', async (req: Request, res: Response) => {
  try {
    const { actionId, workcellId, originSignalIds, vertical, riskLevel, isDestructive, policyViolations, approvalRecordId } = req.body as {
      actionId?: string;
      workcellId?: string;
      originSignalIds?: string[];
      vertical?: string;
      riskLevel?: string;
      isDestructive?: boolean;
      policyViolations?: string[];
      approvalRecordId?: string;
    };

    if (!actionId || !vertical) {
      return err(res, 400, 'validation', 'Required fields: actionId, vertical');
    }

    const result = await runPCEGate({
      actionId,
      workcellId,
      originSignalIds: originSignalIds ?? [],
      vertical,
      riskLevel: riskLevel ?? 'medium',
      isDestructive: isDestructive ?? false,
      policyViolations,
      approvalRecordId,
    });

    if (!result.allowed) {
      const statusCode = result.errorType === 'approval_required' ? 403 : 400;
      return err(res, statusCode, result.errorType ?? 'policy', result.blockedReason ?? 'PCE gate blocked.');
    }

    ok(res, result.contract, { allowed: true });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /pce error');
    err(res, 500, 'execution', 'PCE contract creation failed.');
  }
});

router.post('/a11oy/pce/:id/validate', async (req: Request, res: Response) => {
  try {
    const contract = getPCEContract(req.params.id);
    if (!contract) return err(res, 404, 'not_found', `PCE contract "${req.params.id}" not found.`);

    const result = await verifyPCEContract(req.params.id);
    ok(res, { contractId: req.params.id, verified: result.verified, reason: result.reason });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /pce/:id/validate error');
    err(res, 500, 'execution', 'PCE validation failed.');
  }
});

router.get('/a11oy/agents', (_req: Request, res: Response) => {
  const operators = listOperators();
  const { provider, model, isDemo } = getActiveProvider();
  ok(res, {
    operators,
    modelRouter: {
      activeProvider: provider,
      activeModel: model,
      isDemo,
      providers: getProviderStatuses(),
    },
  }, { total: operators.length });
});

router.get('/a11oy/tools', (req: Request, res: Response) => {
  const tools = listTools();
  const { category, riskLevel } = req.query as Record<string, string>;
  let filtered = tools;
  if (category) filtered = filtered.filter((t) => t.category === category);
  if (riskLevel) filtered = filtered.filter((t) => t.riskLevel === riskLevel);
  ok(res, filtered, { total: filtered.length, mcpCatalog: getMcpToolDescriptions().length });
});

router.get('/a11oy/tools/:id', (req: Request, res: Response) => {
  const tool = getTool(req.params.id);
  if (!tool) return err(res, 404, 'not_found', `Tool "${req.params.id}" not found.`);
  ok(res, tool);
});

router.get('/a11oy/evals', (_req: Request, res: Response) => {
  const evals = listEvals();
  ok(res, evals, { total: evals.length });
});

router.get('/a11oy/evals/:id', (req: Request, res: Response) => {
  const evaluation = getEval(req.params.id);
  if (!evaluation) return err(res, 404, 'not_found', `Eval "${req.params.id}" not found.`);
  ok(res, evaluation);
});

router.get('/a11oy/memory', (_req: Request, res: Response) => {
  const entries = listMemoryEntries(50);
  const stats = getMemoryStats();
  ok(res, entries, { stats, total: entries.length });
});

router.get('/a11oy/pce', (_req: Request, res: Response) => {
  const contracts = listPCEContracts();
  ok(res, contracts, { total: contracts.length });
});

router.get('/a11oy/pce/:id', (req: Request, res: Response) => {
  const contract = getPCEContract(req.params.id);
  if (!contract) return err(res, 404, 'not_found', `PCE contract "${req.params.id}" not found.`);
  ok(res, contract);
});

router.get('/a11oy/boardroom', (_req: Request, res: Response) => {
  const criticalSignals = SEED_SIGNALS.filter((s) => s.severity === 'critical');
  const proofPackets = listProofPackets(10);
  const pceContracts = listPCEContracts(10);
  const approvals = listApprovalRecords(10);

  ok(res, {
    criticalSignalCount: criticalSignals.length,
    topSignals: criticalSignals.slice(0, 5).map((s) => ({
      id: s.id,
      title: s.title,
      vertical: s.vertical,
      severity: s.severity,
      businessImpact: s.businessImpact,
    })),
    pendingApprovals: approvals.filter((a) => a.status === 'pending').length,
    proofCoverage: proofPackets.length > 0 ? 0.88 : 0,
    pceContracts: pceContracts.length,
    fabricHealth: 'degraded',
    keyMetrics: {
      activeWorkcells: listWorkcells().filter((w) => ['executing', 'verifying'].includes(w.phase)).length,
      provenActions: listWorkcells().filter((w) => w.phase === 'proven').length,
      avgDecisionLatencyMs: 4320000,
    },
  });
});

router.get('/a11oy/terminal/catalog', (_req: Request, res: Response) => {
  ok(res, {
    skills: listSkills().map((s) => ({
      id: s.id,
      name: s.name,
      objective: s.objective,
      vertical: s.vertical,
      primaryOperator: s.primaryOperator,
    })),
    tools: listTools().map((t) => ({
      id: t.id,
      name: t.name,
      riskLevel: t.riskLevel,
      requiresApproval: t.requiresApproval,
      category: t.category,
    })),
    operators: listOperators().map((o) => ({
      operatorId: o.operatorId,
      displayName: o.displayName,
      restrictions: o.restrictions,
    })),
  });
});

router.get('/a11oy/traces', (_req: Request, res: Response) => {
  const traces = listTraces(50);
  ok(res, traces, { total: traces.length });
});

router.get('/a11oy/traces/:id', (req: Request, res: Response) => {
  const trace = getTrace(req.params.id);
  if (!trace) return err(res, 404, 'not_found', `Trace "${req.params.id}" not found.`);
  ok(res, exportTrace(req.params.id));
});

router.get('/a11oy/skills', (_req: Request, res: Response) => {
  ok(res, listSkills(), { total: listSkills().length });
});

router.get('/a11oy/skills/:id', (req: Request, res: Response) => {
  const skill = getSkill(req.params.id);
  if (!skill) return err(res, 404, 'not_found', `Skill "${req.params.id}" not found.`);
  ok(res, skill);
});

router.post('/a11oy/skills/:id/run', async (req: Request, res: Response) => {
  try {
    const result = await executeSkill(req.params.id, req.body as Record<string, unknown> ?? {});
    if (!result.ok) return err(res, 400, 'validation', result.error ?? 'Skill execution failed.');
    ok(res, result.result);
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /skills/:id/run error');
    err(res, 500, 'execution', 'Skill execution failed.');
  }
});

router.get('/a11oy/workcells/:id', (req: Request, res: Response) => {
  const wc = getWorkcell(req.params.id);
  if (!wc) return err(res, 404, 'not_found', `Workcell "${req.params.id}" not found.`);
  ok(res, wc);
});

router.get('/a11oy/approvals', (_req: Request, res: Response) => {
  const approvals = listApprovalRecords();
  ok(res, approvals, { total: approvals.length });
});

router.get('/a11oy/proofs', (_req: Request, res: Response) => {
  const packets = listProofPackets();
  ok(res, packets, { total: packets.length });
});

router.post('/a11oy/operator/plan', async (req: Request, res: Response) => {
  try {
    const { intent } = req.body as { intent?: string };
    if (!intent || intent.trim().length < 5) {
      return err(res, 400, 'validation', 'intent must be at least 5 characters.');
    }
    const plan = await generatePlan(intent.trim(), DEMO_MODE);
    ok(res, plan, { mode: DEMO_MODE ? 'demo' : 'live' });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /operator/plan error');
    err(res, 500, 'execution', 'Plan generation failed.');
  }
});

router.post('/a11oy/operator/runs', async (req: Request, res: Response) => {
  try {
    const { intent, requestedBy, vertical, plan: bodyPlan, planSummary, estimatedSideEffects } = req.body as {
      intent?: string;
      requestedBy?: string;
      vertical?: string;
      plan?: Array<Omit<import('../a11oy/runtime/operator/run-store.js').PlanStep, 'stepId' | 'status'>>;
      planSummary?: string;
      estimatedSideEffects?: string[];
    };
    if (!intent || intent.trim().length < 5) {
      return err(res, 400, 'validation', 'intent is required.');
    }
    // Use the caller-supplied plan (already reviewed by the human) if present;
    // otherwise fall back to generating a fresh plan so the endpoint remains usable standalone.
    let resolvedPlan: Omit<import('../a11oy/runtime/operator/run-store.js').PlanStep, 'stepId' | 'status'>[];
    let resolvedVertical: string;
    let resolvedSummary: string;
    let resolvedSideEffects: string[];
    if (bodyPlan && bodyPlan.length > 0) {
      // Re-derive requiresApproval server-side from the tool registry.
      // Client-supplied requiresApproval is NEVER trusted — the tool
      // catalogue is the authoritative source of approval requirements.
      const toolList = listTools();
      resolvedPlan = bodyPlan.map((step) => {
        const toolMeta = getTool(step.toolId) ?? toolList.find((t) => t.name === step.toolName);
        return {
          ...step,
          requiresApproval: toolMeta?.requiresApproval ?? true, // default to requiring approval if tool unknown
        };
      });
      resolvedVertical = vertical ?? 'default';
      resolvedSummary = planSummary ?? `Run for: ${intent.trim().slice(0, 120)}`;
      resolvedSideEffects = estimatedSideEffects ?? [];
    } else {
      const generated = await generatePlan(intent.trim(), DEMO_MODE);
      resolvedPlan = generated.steps;
      resolvedVertical = generated.vertical;
      resolvedSummary = generated.planSummary;
      resolvedSideEffects = generated.estimatedSideEffects;
    }
    const run = createRun({
      intent: intent.trim(),
      vertical: resolvedVertical,
      requestedBy: requestedBy ?? 'operator',
      plan: resolvedPlan,
      planSummary: resolvedSummary,
      estimatedSideEffects: resolvedSideEffects,
    });
    ok(res, run, { created: true });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /operator/runs error');
    err(res, 500, 'execution', 'Run creation failed.');
  }
});

router.get('/a11oy/operator/runs', async (_req: Request, res: Response) => {
  const runs = await listRunsFromDb(50);
  ok(res, runs, { total: runs.length });
});

router.get('/a11oy/operator/runs/:id', async (req: Request, res: Response) => {
  const run = await fetchRun(req.params.id);
  if (!run) return err(res, 404, 'not_found', `Run "${req.params.id}" not found.`);
  ok(res, run);
});

router.post('/a11oy/operator/runs/:id/steps/:stepId/approve', (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body as { approvedBy?: string };
    if (!approvedBy) return err(res, 400, 'validation', 'approvedBy is required.');
    const run = approveStep(req.params.id, req.params.stepId, approvedBy);
    if (!run) return err(res, 404, 'not_found', 'Run or step not found, or step is not awaiting approval.');
    ok(res, run);
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /operator/runs/:id/steps/:stepId/approve error');
    err(res, 500, 'execution', 'Step approval failed.');
  }
});

router.post('/a11oy/operator/runs/:id/steps/:stepId/reject', (req: Request, res: Response) => {
  try {
    const { rejectedBy, reason } = req.body as { rejectedBy?: string; reason?: string };
    if (!rejectedBy) return err(res, 400, 'validation', 'rejectedBy is required.');
    const run = rejectStep(req.params.id, req.params.stepId, rejectedBy, reason ?? 'No reason provided.');
    if (!run) return err(res, 404, 'not_found', 'Run or step not found.');
    ok(res, run);
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /operator/runs/:id/steps/:stepId/reject error');
    err(res, 500, 'execution', 'Step rejection failed.');
  }
});

router.post('/a11oy/operator/runs/:id/steps/:stepId/execute', async (req: Request, res: Response) => {
  try {
    const { executedBy } = req.body as {
      executedBy?: string;
    };
    const run = await fetchRun(req.params.id);
    if (!run) return err(res, 404, 'not_found', `Run "${req.params.id}" not found.`);
    const step = run.plan.find((s) => s.stepId === req.params.stepId);
    if (!step) return err(res, 404, 'not_found', `Step "${req.params.stepId}" not found.`);

    // RBAC / vertical gate: role and vertical are ALWAYS server-derived.
    // actorRole comes from the authenticated session (req.user) in production;
    // in dev/demo mode we use the conservative default 'operator'.
    // actorVertical is always the run's stored vertical — never caller-supplied.
    const toolMeta = getTool(step.toolId);
    if (toolMeta) {
      const userRoles: string[] = (req.user as { roles?: string[] } | undefined)?.roles ?? [];
      const role = userRoles.length > 0 ? userRoles[0] : 'operator';
      const vertical = run.vertical;
      const roleAllowed =
        toolMeta.allowedRoles.length === 0 ||
        toolMeta.allowedRoles.includes('*') ||
        toolMeta.allowedRoles.includes(role);
      const verticalAllowed =
        toolMeta.allowedVerticals.length === 0 ||
        toolMeta.allowedVerticals.includes('*') ||
        toolMeta.allowedVerticals.some((v) => vertical.startsWith(v.replace('-*', '')) || v === vertical);
      if (!roleAllowed) {
        return err(res, 403, 'rbac_denied', `Role "${role}" is not permitted to execute tool "${step.toolName}". Allowed: ${toolMeta.allowedRoles.join(', ')}.`);
      }
      if (!verticalAllowed) {
        return err(res, 403, 'vertical_denied', `Vertical "${vertical}" is not permitted for tool "${step.toolName}". Allowed: ${toolMeta.allowedVerticals.join(', ')}.`);
      }
    }

    if (step.requiresApproval && step.status !== 'approved') {
      return err(res, 403, 'approval_required', `Step "${step.title}" requires approval before execution.`);
    }
    if (!['approved', 'pending'].includes(step.status)) {
      return err(res, 409, 'conflict', `Step is in "${step.status}" state and cannot be executed.`);
    }

    step.status = 'executing';
    step.startedAt = new Date().toISOString();

    const t = Date.now();
    const toolResult = executeToolMock(step.toolId, step.toolInput, DEMO_MODE);
    const durationMs = Date.now() - t;

    const updatedRun = recordStepExecution(
      req.params.id,
      req.params.stepId,
      toolResult.ok ? (toolResult as { output: Record<string, unknown> }).output : null,
      toolResult.ok ? null : (toolResult as { error: string }).error,
      durationMs,
    );

    ok(res, { run: updatedRun, stepResult: toolResult });
  } catch (e) {
    logger.error({ err: e }, '[a11oy] POST /operator/runs/:id/steps/:stepId/execute error');
    err(res, 500, 'execution', 'Step execution failed.');
  }
});

router.get('/a11oy/operator/runs/:id/replay', (req: Request, res: Response) => {
  const replay = getReplayData(req.params.id);
  if (!replay) return err(res, 404, 'not_found', `Run "${req.params.id}" not found.`);
  ok(res, replay, { replayable: true });
});

router.get('/a11oy/operator/runs/:id/audit', async (req: Request, res: Response) => {
  const run = await fetchRun(req.params.id);
  if (!run) return err(res, 404, 'not_found', `Run "${req.params.id}" not found.`);
  ok(res, run.auditLog, { runId: run.runId, total: run.auditLog.length });
});

router.get('/orchestrator/python-worker/status', (_req: Request, res: Response) => {
  const bridge = getBridgeStatus();
  const gateSummary = getGateSummary();
  ok(res, {
    workerUrl: bridge.workerUrl,
    configured: bridge.configured,
    health: bridge.healthy ? 'healthy' : 'unhealthy',
    ready: bridge.ready,
    capabilities: bridge.capabilities,
    activeClaims: bridge.activeClaims,
    safetyGates: {
      ...bridge.safetyGates,
      hfLiveInferenceEnabled: gateSummary.liveInferenceEnabled,
      hfProductionApproved: gateSummary.productionApproved,
    },
    livePythonStagesPermitted: bridge.livePythonStagesPermitted,
    lastHealthCheck: bridge.lastHealthCheck,
    lastError: bridge.lastError,
  });
});

router.get('/a11oy/models/registry', (req: Request, res: Response) => {
  const { provider, capability } = req.query as Record<string, string>;
  const entries = listModelEntries({ provider, capability });
  const summary = getRegistrySummary();
  ok(res, entries, { ...summary, total: entries.length });
});

router.get('/a11oy/models/registry/:id', (req: Request, res: Response) => {
  const entry = getModelEntry(req.params.id);
  if (!entry) return err(res, 404, 'not_found', `Model "${req.params.id}" not found in registry.`);
  const hfGate = entry.provider === 'huggingface' ? checkHfLiveRoutingGate(entry.modelId) : null;
  ok(res, { ...entry, hfGateResult: hfGate });
});

router.get('/a11oy/control-tower/status', (_req: Request, res: Response) => {
  const bridge = getBridgeStatus();
  const modelSummary = getRegistrySummary();
  const { provider, model, isDemo } = getActiveProvider();
  const gateSummary = getGateSummary();
  const providers = getProviderStatuses();

  ok(res, {
    workerBridge: {
      status: bridge.configured ? (bridge.healthy ? 'connected' : 'disconnected') : 'not-configured',
      configured: bridge.configured,
      healthy: bridge.healthy,
      ready: bridge.ready,
      livePythonStagesPermitted: bridge.livePythonStagesPermitted,
      capabilities: bridge.capabilities,
      activeClaims: bridge.activeClaims,
    },
    modelRouter: {
      activeProvider: provider,
      activeModel: model,
      isDemo,
      providers,
      gateSummary,
    },
    modelRegistry: modelSummary,
    safetyGates: bridge.safetyGates,
  });
});

startHealthCheckLoop();

logger.debug('[a11oy-runtime-api] Phase 2 runtime routes registered — operators, tools, MirrorEval, PCE gate, Workcells, Skills all active');
logger.debug('[a11oy-runtime-api] Operator Runtime routes registered — /operator/plan, /operator/runs, step approve/reject/execute, replay');
logger.debug('[a11oy-runtime-api] Orchestrator routes registered — /orchestrator/python-worker/status, /a11oy/models/registry, /a11oy/control-tower/status');

export default router;
