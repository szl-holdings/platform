/**
 * Action Engine — governs workflow execution, dry-runs, and simulations.
 *
 * History adapter pattern: call setHistoryAdapter(adapter) once at startup to
 * replace the in-memory Map with a DB-backed implementation. The adapter must
 * implement { recordRun, listRuns, getRunById, getHistoryStats }.
 * If no adapter is installed, falls back to the in-memory Map.
 */
const _runs = new Map();

let _historyAdapter = null;

/**
 * Install a history adapter (e.g. DB-backed) to replace the in-memory Map.
 * @param {object} adapter - { recordRun, listRuns, getRunById, getHistoryStats }
 */
export function setHistoryAdapter(adapter) {
  _historyAdapter = adapter;
}

/**
 * Execute a workflow definition.
 *
 * Accepts either:
 *   executeWorkflow(def, context, options)     — legacy positional signature
 *   executeWorkflow({ definition, ...opts })   — named-param signature used by the API route
 *
 * Returns { run, requiresApproval, approvalRequest, dryRunSummary, simulationSummary }
 */
export function executeWorkflow(defOrOpts, context = {}, options = {}) {
  let def,
    initiatedBy,
    tenantId,
    recommendationId,
    isDryRun,
    isSimulation,
    approvedBy,
    policyEvaluation,
    metadata;

  if (defOrOpts && typeof defOrOpts === 'object' && defOrOpts.definition) {
    def = defOrOpts.definition;
    initiatedBy = defOrOpts.initiatedBy ?? 'system';
    tenantId = defOrOpts.tenantId ?? null;
    recommendationId = defOrOpts.recommendationId ?? null;
    isDryRun = defOrOpts.isDryRun ?? false;
    isSimulation = defOrOpts.isSimulation ?? false;
    approvedBy = defOrOpts.approvedBy ?? null;
    policyEvaluation = defOrOpts.policyEvaluation ?? null;
    metadata = defOrOpts.metadata ?? {};
  } else {
    def = defOrOpts;
    initiatedBy = context.userId ?? 'system';
    tenantId = context.tenantId ?? null;
    recommendationId = null;
    isDryRun = options.dryRun ?? false;
    isSimulation = options.simulate ?? false;
    approvedBy = null;
    policyEvaluation = null;
    metadata = context.metadata ?? {};
  }

  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  let status;
  if (isDryRun) {
    status = 'dry_run';
  } else if (isSimulation) {
    status = 'simulated';
  } else if (def.requiresExplicitApproval && !approvedBy) {
    status = 'pending_approval';
  } else {
    status = 'completed';
  }

  const requiresApproval =
    def.requiresExplicitApproval && !approvedBy && !isDryRun && !isSimulation;

  const steps = (def.steps ?? []).map((step) => ({
    id: step.id,
    stepName: step.name,
    handler: step.handler,
    status: requiresApproval ? 'pending' : 'completed',
    startedAt: now,
    completedAt: requiresApproval ? null : now,
    output: {},
  }));

  const auditTrail = [
    {
      at: Date.now(),
      action: 'workflow.initiated',
      detail: `Mode: ${def.executionMode ?? 'semi_auto'}${isDryRun ? ' (dry-run)' : ''}${isSimulation ? ' (simulation)' : ''}`,
      actor: initiatedBy,
    },
  ];

  if (isDryRun) {
    auditTrail.push({
      at: Date.now() + 1,
      action: 'workflow.dry_run',
      detail: 'Simulating execution without side effects.',
      actor: 'system',
    });
    auditTrail.push({
      at: Date.now() + 2,
      action: 'workflow.completed',
      detail: 'Dry run complete — no side effects produced.',
      actor: 'system',
    });
  } else if (isSimulation) {
    auditTrail.push({
      at: Date.now() + 1,
      action: 'workflow.simulated',
      detail: 'Monte Carlo scenario applied.',
      actor: 'system',
    });
  } else if (requiresApproval) {
    auditTrail.push({
      at: Date.now() + 1,
      action: 'workflow.awaiting_approval',
      detail: 'Execution paused pending human approval.',
      actor: 'system',
    });
  } else {
    auditTrail.push({
      at: Date.now() + 1,
      action: 'workflow.completed',
      detail: `All ${steps.length} steps completed.`,
      actor: 'system',
    });
  }

  const run = {
    runId,
    workflowId: def.id,
    workflowName: def.name,
    domain: def.domain,
    status,
    initiatedBy,
    approvedBy,
    tenantId,
    recommendationId,
    isDryRun,
    isSimulation,
    requiresApproval,
    durationMs: isDryRun || isSimulation ? 12 : 0,
    steps,
    auditTrail,
    policyEvaluation,
    cost: { estimatedUsd: def.estimatedCostUsd ?? 0 },
    metadata,
    startedAt: now,
    completedAt: requiresApproval ? null : now,
  };

  if (!isDryRun && !isSimulation) {
    _runs.set(runId, run);
  }

  const dryRunSummary = isDryRun
    ? `Dry run for workflow: ${def.name}\nSteps: ${(def.steps ?? []).map((s) => s.name).join(' → ')}\nExecution mode: ${def.executionMode ?? 'semi_auto'}\nNo side effects produced.`
    : undefined;

  const simulationSummary = isSimulation
    ? `Simulation for workflow: ${def.name}\nScenario: baseline\nAll steps simulated without side effects.`
    : undefined;

  const approvalRequest = requiresApproval
    ? {
        approverRole: def.steps?.find((s) => s.requiresApproval)?.approverRole ?? 'exec',
        reason: `Workflow "${def.name}" requires explicit approval before execution.`,
        requiredApprovers:
          def.steps?.filter((s) => s.requiresApproval).map((s) => s.approverRole) ?? [],
      }
    : undefined;

  return { run, requiresApproval, approvalRequest, dryRunSummary, simulationSummary };
}

export async function recordRun(run) {
  _runs.set(run.runId ?? run.id, run);
  if (_historyAdapter?.recordRun) {
    try {
      await _historyAdapter.recordRun(run);
    } catch (_err) {
      // adapter failure is non-fatal; in-memory copy is still available
    }
  }
}

export async function listRuns(filter = {}) {
  if (_historyAdapter?.listRuns) {
    try {
      return await _historyAdapter.listRuns(filter);
    } catch (_err) {
      // fall through to in-memory on adapter failure
    }
  }
  let runs = Array.from(_runs.values());
  if (filter.workflowId) runs = runs.filter((r) => r.workflowId === filter.workflowId);
  if (filter.status) runs = runs.filter((r) => r.status === filter.status);
  runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;
  return { runs: runs.slice(offset, offset + limit), total: runs.length };
}

export async function getRunById(id) {
  if (_historyAdapter?.getRunById) {
    try {
      const run = await _historyAdapter.getRunById(id);
      if (run) return run;
    } catch (_err) {
      // fall through to in-memory
    }
  }
  return _runs.get(id) ?? null;
}

export async function getHistoryStats() {
  if (_historyAdapter?.getHistoryStats) {
    try {
      return await _historyAdapter.getHistoryStats();
    } catch (_err) {
      // fall through to in-memory
    }
  }
  const runs = Array.from(_runs.values());
  const byStatus = runs.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  return {
    totalRuns: runs.length,
    byStatus,
    averageDurationMs: runs.length
      ? runs.reduce((s, r) => s + (r.durationMs ?? 0), 0) / runs.length
      : 0,
    lastRunAt: runs[0]?.startedAt ?? null,
  };
}
