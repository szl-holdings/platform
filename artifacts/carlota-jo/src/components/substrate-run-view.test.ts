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
    expect(
      parsePipelineRun({ runId: 'demo-1', status: 'dry-run-complete', mode: 'dry-run' }, 'dry-run')
        .status,
    ).toBe('dry-run-complete');
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

  // Absent, undefined, null, empty, whitespace, number, object and array IDs.
  const MISSING_IDENTITIES: Array<[string, Record<string, unknown>]> = [
    ['absent', {}],
    ['undefined', { runId: undefined }],
    ['null', { runId: null }],
    ['empty', { runId: '' }],
    ['whitespace', { runId: ' \t\n ' }],
    ['number', { runId: 42 }],
    ['zero', { runId: 0 }],
    ['object', { runId: { id: 'run-1' } }],
    ['array', { runId: ['run-1'] }],
  ];

  it.each([
    ['running', 'live'],
    ['running', 'dry-run'],
    ['completed', 'live'],
    ['dry-run-complete', 'dry-run'],
  ] as const)('requires a nonblank string run identity for %s in %s mode', (status, mode) => {
    for (const [label, identity] of MISSING_IDENTITIES) {
      const run = parsePipelineRun(
        { status, mode, ...identity, finalConfidence: 0.4, error: 'diagnostic retained' },
        mode,
      );
      expect(run.status, label).toBe('unknown');
      expect(run.runId, label).toBeNull();
      expect(run.reportedStatus, label).toBe(status);
      expect(run.mode, label).toBe(mode);
      expect(run.requestedMode, label).toBe(mode);
      expect(run.finalConfidence, label).toBe(0.4);
      expect(run.error, label).toBe('diagnostic retained');
    }
    const identified = parsePipelineRun({ status, mode, runId: 'run-identified' }, mode);
    expect(identified.status).toBe(status);
    expect(identified.runId).toBe('run-identified');
  });

  it.each([
    'live',
    'dry-run',
  ] as const)('keeps an identified %s running run active with its original identity string', (mode) => {
    const run = parsePipelineRun({ runId: '  run-7\t', status: 'running', mode }, mode);
    expect(run.status).toBe('running');
    expect(run.runId).toBe('  run-7\t');
    expect(run.reportedStatus).toBe('running');
    expect(run.mode).toBe(mode);
  });

  it('keeps an identified running run with a mismatched or missing mode unknown', () => {
    const mismatched = parsePipelineRun(
      { runId: 'run-1', status: 'running', mode: 'live' },
      'dry-run',
    );
    expect(mismatched.status).toBe('unknown');
    expect(mismatched.runId).toBe('run-1');
    expect(mismatched.mode).toBe('live');
    expect(mismatched.requestedMode).toBe('dry-run');
    expect(
      parsePipelineRun({ runId: 'run-1', status: 'running', mode: 'dry-run' }, 'live').status,
    ).toBe('unknown');
    expect(parsePipelineRun({ runId: 'run-1', status: 'running' }, 'live').status).toBe('unknown');
  });

  it('keeps an identity-less running run diagnostics without inventing an identity', () => {
    const run = parsePipelineRun(
      {
        status: 'running',
        mode: 'live',
        stageResults: [{ stageId: 'retrieve', stageType: 'Retrieve', status: 'running' }],
      },
      'live',
    );
    expect(run.status).toBe('unknown');
    expect(run.runId).toBeNull();
    expect(run.stages).toEqual([
      {
        stageId: 'retrieve',
        stageName: 'retrieve',
        stageType: 'Retrieve',
        status: 'running',
        confidence: null,
      },
    ]);
  });

  it.each([
    ['pending-approval', 'pending-approval'],
    ['failed', 'failed'],
    ['cancelled', 'cancelled'],
    ['surprising-status', 'unknown'],
  ])('preserves reported %s as %s without requiring an identity', (reported, expected) => {
    const run = parsePipelineRun({ status: reported, mode: 'live' }, 'live');
    expect(run.status).toBe(expected);
    expect(run.reportedStatus).toBe(reported);
  });

  it('treats absent or mismatched modes and malformed responses as unknown', () => {
    expect(parsePipelineRun({ status: 'completed' }, 'live').status).toBe('unknown');
    expect(parsePipelineRun({ status: 'completed', mode: 'live' }, 'dry-run').status).toBe(
      'unknown',
    );
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
