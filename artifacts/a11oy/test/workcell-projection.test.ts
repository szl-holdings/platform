import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Workcell } from '@workspace/a11oy-fabric';
import { projectTraceStatus, projectWorkcellState } from '../src/data/workcellProjection.ts';

function fixture(
  workflowStatus: Workcell['status'],
  actionStatus: Workcell['actionBrief']['status'],
  requiresApproval = true,
): Workcell {
  return {
    status: workflowStatus,
    requiresApproval,
    actionBrief: { status: actionStatus },
  } as Workcell;
}

test('projects workflow and action state without treating requiresApproval as a block', () => {
  const cases = [
    { workcell: fixture('completed', 'completed'), outcome: 'success' },
    { workcell: fixture('error', 'failed'), outcome: 'failed' },
    { workcell: fixture('running', 'pending_approval'), outcome: 'blocked' },
    { workcell: fixture('running', 'executing'), outcome: 'running' },
    { workcell: fixture('paused', 'approved'), outcome: 'blocked' },
    { workcell: fixture('idle', 'recommended', false), outcome: 'pending' },
  ] as const;

  for (const entry of cases) {
    assert.equal(projectWorkcellState(entry.workcell).outcome, entry.outcome);
  }
});

test('only a real pending-approval action exposes the local demo decision control', () => {
  assert.equal(
    projectWorkcellState(fixture('running', 'pending_approval')).canRecordDemoDecision,
    true,
  );
  assert.equal(projectWorkcellState(fixture('running', 'executing')).canRecordDemoDecision, false);
  assert.equal(
    projectWorkcellState(fixture('completed', 'completed')).canRecordDemoDecision,
    false,
  );
});

test('proof and result visibility stay bound to terminal workflow outcomes', () => {
  assert.deepEqual(
    {
      result: projectWorkcellState(fixture('completed', 'completed')).showFixtureResult,
      proof: projectWorkcellState(fixture('completed', 'completed')).showProofShape,
    },
    { result: true, proof: true },
  );
  assert.equal(projectWorkcellState(fixture('error', 'failed')).showFixtureResult, true);
  assert.equal(projectWorkcellState(fixture('error', 'failed')).showProofShape, false);
  assert.equal(projectWorkcellState(fixture('running', 'executing')).showFixtureResult, false);
  assert.equal(projectWorkcellState(fixture('running', 'executing')).showProofShape, false);
});

test('trace stages preserve pending approval and executing distinctions', () => {
  const awaiting = fixture('running', 'pending_approval');
  const executing = fixture('running', 'executing');

  assert.equal(projectTraceStatus(awaiting, 'gate'), 'running');
  assert.equal(projectTraceStatus(awaiting, 'receipt'), 'pending');
  assert.equal(projectTraceStatus(executing, 'gate'), 'completed');
  assert.equal(projectTraceStatus(executing, 'agent'), 'running');
  assert.equal(projectTraceStatus(executing, 'receipt'), 'pending');
});
