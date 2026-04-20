import {
  clearApprovalInbox,
  clearPendingApprovalRequests,
  getPendingApprovalRequest,
  submitApprovalAction,
} from '@workspace/approvals-inbox';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { preloadApproval, requestApproval } from '../approval-gate.js';
import { AgentRunError } from '../errors.js';

const baseRequest = {
  runId: 'run-test',
  stepId: 'step-1',
  stepName: 'execute_action',
  action: 'execute_action',
  justification: 'test',
  projectedImpact: 'low',
  projectedRisk: 'low',
};

beforeEach(() => {
  clearApprovalInbox();
  clearPendingApprovalRequests();
});

afterEach(() => {
  clearApprovalInbox();
  clearPendingApprovalRequests();
});

describe('ApprovalGate', () => {
  it('resumes immediately when an approval is preloaded', async () => {
    preloadApproval('run-test', 'step-1', 'approved', { actor: 'ops' });

    const result = await requestApproval({ ...baseRequest, pollIntervalMs: 5, timeoutMs: 1_000 });

    expect(result.approved).toBe(true);
    expect(result.verdict).toBe('approved');
    expect(result.actor).toBe('ops');
    expect(result.decisionLatencyMs).toBe(0);
  });

  it('throws when the preloaded approval is a rejection', async () => {
    preloadApproval('run-test', 'step-1', 'rejected', { actor: 'ops', note: 'too risky' });

    await expect(
      requestApproval({ ...baseRequest, pollIntervalMs: 5, timeoutMs: 1_000 }),
    ).rejects.toMatchObject({
      name: 'AgentRunError',
      category: 'approval_rejected',
      retryable: false,
    });
  });

  it('resolves when an approval is submitted while polling', async () => {
    const promise = requestApproval({ ...baseRequest, pollIntervalMs: 10, timeoutMs: 2_000 });

    // Submit approval after the request is in flight.
    setTimeout(() => {
      submitApprovalAction('run-test::step-1', 'approved', { actor: 'late-approver' });
    }, 30);

    const result = await promise;
    expect(result.approved).toBe(true);
    expect(result.actor).toBe('late-approver');
    expect(result.decisionLatencyMs).toBeGreaterThan(0);
  });

  it('auto-rejects and throws when the timeout elapses', async () => {
    await expect(
      requestApproval({ ...baseRequest, pollIntervalMs: 10, timeoutMs: 40 }),
    ).rejects.toMatchObject({
      name: 'AgentRunError',
      category: 'approval_timeout',
      retryable: false,
    });

    const pending = getPendingApprovalRequest('run-test', 'step-1');
    expect(pending?.status).toBe('timed_out');
  });

  it('throws an AgentRunError instance on rejection', async () => {
    preloadApproval('run-test', 'step-1', 'rejected');

    try {
      await requestApproval({ ...baseRequest, pollIntervalMs: 5, timeoutMs: 1_000 });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AgentRunError);
    }
  });
});
