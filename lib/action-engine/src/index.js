const _runs = new Map();

export function executeWorkflow(def, context = {}, options = {}) {
  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const run = {
    id: runId,
    workflowId: def.id,
    workflowName: def.name,
    domain: def.domain,
    status: options.dryRun ? "dry_run" : (options.simulate ? "simulated" : "completed"),
    triggeredBy: context.userId ?? "system",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: 0,
    steps: (def.steps ?? []).map((step) => ({
      id: step.id,
      name: step.name,
      status: "completed",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      output: {},
    })),
    context: context,
    isDryRun: options.dryRun ?? false,
    isSimulation: options.simulate ?? false,
    cost: { estimatedUsd: def.estimatedCostUsd ?? 0 },
    auditTrail: [],
  };
  if (!options.dryRun && !options.simulate) {
    _runs.set(runId, run);
  }
  return run;
}

export function recordRun(run) {
  _runs.set(run.id, run);
}

export function listRuns(filter = {}) {
  let runs = Array.from(_runs.values());
  if (filter.workflowId) runs = runs.filter((r) => r.workflowId === filter.workflowId);
  if (filter.status) runs = runs.filter((r) => r.status === filter.status);
  runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;
  return { runs: runs.slice(offset, offset + limit), total: runs.length };
}

export function getRunById(id) {
  return _runs.get(id) ?? null;
}

export function getHistoryStats() {
  const runs = Array.from(_runs.values());
  const byStatus = runs.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  return {
    totalRuns: runs.length,
    byStatus,
    averageDurationMs: runs.length ? runs.reduce((s, r) => s + (r.durationMs ?? 0), 0) / runs.length : 0,
    lastRunAt: runs[0]?.startedAt ?? null,
  };
}
