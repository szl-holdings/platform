import { describe, expect, it } from 'vitest';
import { parsePipelineRun } from './substrate-run-view';

describe('Carlota Jo substrate run presentation', () => {
  it('accepts only a matching live completed run as completed', () => {
    const run = parsePipelineRun(
      { runId: 'run-1', status: 'completed', mode: 'live', finalConfidence: 0.73 },
      'live',
    );
    expect(run.status).toBe('completed');
    expect(run.finalConfidence).toBe(0.73);
  });

  it('keeps dry-run completion separate from live success', () => {
    expect(parsePipelineRun({ status: 'dry-run-complete', mode: 'dry-run' }, 'dry-run').status).toBe(
      'dry-run-complete',
    );
    expect(parsePipelineRun({ status: 'completed', mode: 'dry-run' }, 'dry-run').status).toBe(
      'unknown',
    );
  });

  it('preserves the engine low-confidence dry-run escalation as pending approval', () => {
    // The engine can return this before its explicit ApprovalGate stage.
    const run = parsePipelineRun(
      {
        status: 'pending-approval',
        mode: 'dry-run',
        stageResults: [
          {
            stageId: 'retrieve-client-context',
            stageType: 'Retrieve',
            status: 'pending-approval',
            confidence: 0.2,
            routingDecision: 'escalated-human',
            approvalId: 'sub-approval-test',
          },
        ],
      },
      'dry-run',
    );
    expect(run.status).toBe('pending-approval');
    expect(run.mode).toBe('dry-run');
    expect(run.requestedMode).toBe('dry-run');
    expect(run.stages[0]?.status).toBe('pending-approval');
  });

  it.each([
    ['pending-approval', 'pending-approval'],
    ['failed', 'failed'],
    ['cancelled', 'cancelled'],
    ['running', 'running'],
    ['surprising-status', 'unknown'],
  ])('preserves reported %s as %s', (reported, expected) => {
    const run = parsePipelineRun({ status: reported, mode: 'live' }, 'live');
    expect(run.status).toBe(expected);
    expect(run.reportedStatus).toBe(reported);
  });

  it('treats absent or mismatched modes and malformed responses as unknown', () => {
    expect(parsePipelineRun({ status: 'completed' }, 'live').status).toBe('unknown');
    expect(parsePipelineRun({ status: 'completed', mode: 'live' }, 'dry-run').status).toBe('unknown');
    expect(parsePipelineRun({ status: 'dry-run-complete', mode: 'live' }, 'live').status).toBe(
      'unknown',
    );
    expect(parsePipelineRun(null, 'live').status).toBe('unknown');
  });

  it('does not fabricate confidence when the result omits or invalidates it', () => {
    for (const value of [undefined, null, Number.NaN, -0.1, 1.1, '0.89']) {
      expect(
        parsePipelineRun({ status: 'failed', mode: 'live', finalConfidence: value }, 'live')
          .finalConfidence,
      ).toBeNull();
    }
    expect(
      parsePipelineRun({ status: 'completed', mode: 'live', finalConfidence: 0 }, 'live')
        .finalConfidence,
    ).toBe(0);
  });

  it('bounds stage and retriever data to fields actually returned', () => {
    const run = parsePipelineRun(
      {
        status: 'failed',
        mode: 'live',
        error: 'Verifier failed',
        stageResults: [
          null,
          { status: 'completed' },
          {
            stageId: 'retrieve',
            stageType: 'Retrieve',
            status: 'completed',
            confidence: 0.51,
            output: { retrieverSource: 'synthetic' },
          },
          { stageId: 'verify', status: 'failed', confidence: Infinity },
        ],
      },
      'live',
    );
    expect(run.stages).toHaveLength(2);
    expect(run.stages[0]?.confidence).toBe(0.51);
    expect(run.stages[1]?.confidence).toBeNull();
    expect(run.retriever).toEqual({ source: 'synthetic', adapterId: null });
    expect(run.error).toBe('Verifier failed');
  });
});
