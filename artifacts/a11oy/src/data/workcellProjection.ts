import type { Workcell } from '@workspace/a11oy-fabric';

export type FixtureOutcome = 'success' | 'failed' | 'blocked' | 'running' | 'pending';
export type FixtureTraceStage = 'input' | 'agent' | 'gate' | 'evaluation' | 'receipt';
export type FixtureTraceStatus = 'completed' | 'running' | 'pending' | 'failed';

export interface WorkcellProjection {
  readonly outcome: FixtureOutcome;
  readonly awaitingApproval: boolean;
  readonly actionExecuting: boolean;
  readonly terminal: boolean;
  readonly showFixtureResult: boolean;
  readonly showProofShape: boolean;
  readonly canRecordDemoDecision: boolean;
}

export function projectWorkcellState(workcell: Workcell): WorkcellProjection {
  const actionStatus = workcell.actionBrief.status;
  const awaitingApproval = workcell.requiresApproval && actionStatus === 'pending_approval';
  const actionExecuting = actionStatus === 'executing';

  let outcome: FixtureOutcome;
  if (workcell.status === 'error' || actionStatus === 'failed' || actionStatus === 'rejected') {
    outcome = 'failed';
  } else if (workcell.status === 'completed') {
    outcome = 'success';
  } else if (workcell.status === 'paused' || awaitingApproval) {
    outcome = 'blocked';
  } else if (workcell.status === 'running') {
    outcome = 'running';
  } else {
    outcome = 'pending';
  }

  const terminal = outcome === 'success' || outcome === 'failed';

  return {
    outcome,
    awaitingApproval,
    actionExecuting,
    terminal,
    showFixtureResult: terminal,
    showProofShape: outcome === 'success',
    canRecordDemoDecision: awaitingApproval,
  };
}

export function projectTraceStatus(
  workcell: Workcell,
  stage: FixtureTraceStage,
): FixtureTraceStatus {
  const projection = projectWorkcellState(workcell);

  if (stage === 'input') {
    return workcell.status === 'idle' || workcell.status === 'paused' ? 'pending' : 'completed';
  }

  if (stage === 'agent') {
    if (projection.outcome === 'success') return 'completed';
    if (projection.outcome === 'failed') return 'failed';
    if (projection.outcome === 'running') return 'running';
    return 'pending';
  }

  if (stage === 'gate') {
    if (projection.outcome === 'success') return 'completed';
    if (projection.outcome === 'failed') return 'failed';
    if (projection.awaitingApproval) return 'running';
    if (
      projection.actionExecuting ||
      workcell.actionBrief.status === 'approved' ||
      workcell.actionBrief.status === 'completed'
    ) {
      return 'completed';
    }
    return 'pending';
  }

  if (stage === 'evaluation') {
    if (projection.outcome === 'success') return 'completed';
    if (projection.outcome === 'failed') return 'failed';
    return 'pending';
  }

  if (projection.outcome === 'success') return 'completed';
  if (projection.outcome === 'failed') return 'failed';
  return 'pending';
}
