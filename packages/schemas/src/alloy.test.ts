import { describe, expect, it } from 'vitest';
import {
  agentDecisionSchema,
  approvalSchema,
  jobQueuePayloadSchema,
  skillSchema,
  workflowStepResultSchema,
} from './alloy';

describe('workflowStepResultSchema', () => {
  const valid = { stepId: 's1', stepType: 'task', status: 'success' as const };
  it('accepts a minimal step result', () => {
    expect(workflowStepResultSchema.parse(valid)).toBeTruthy();
  });
  it('rejects unknown status', () => {
    expect(() => workflowStepResultSchema.parse({ ...valid, status: 'done' })).toThrow();
  });
  it('rejects negative durationMs', () => {
    expect(() => workflowStepResultSchema.parse({ ...valid, durationMs: -1 })).toThrow();
  });
  it('coerces dates', () => {
    const r = workflowStepResultSchema.parse({
      ...valid,
      startedAt: '2026-01-01T00:00:00Z',
      completedAt: '2026-01-01T00:01:00Z',
    });
    expect(r.startedAt).toBeInstanceOf(Date);
  });
});

describe('agentDecisionSchema', () => {
  const valid = {
    id: 1,
    agentId: 'a1',
    decision: 'approve',
    requiresApproval: false,
    createdAt: new Date(),
  };
  it('accepts a minimal decision', () => {
    expect(agentDecisionSchema.parse(valid)).toBeTruthy();
  });
  it('rejects confidence outside [0,1]', () => {
    expect(() => agentDecisionSchema.parse({ ...valid, confidence: 1.5 })).toThrow();
  });
  it('rejects unknown riskLevel', () => {
    expect(() => agentDecisionSchema.parse({ ...valid, riskLevel: 'extreme' })).toThrow();
  });
  it('rejects when requiresApproval is missing', () => {
    const { requiresApproval: _, ...rest } = valid;
    expect(() => agentDecisionSchema.parse(rest)).toThrow();
  });
});

describe('approvalSchema', () => {
  const valid = {
    id: 1,
    action: 'deploy',
    requestedBy: 5,
    status: 'pending' as const,
    requestedAt: new Date(),
  };
  it('accepts a minimal pending approval', () => {
    expect(approvalSchema.parse(valid)).toBeTruthy();
  });
  it('accepts a null approvedBy', () => {
    expect(approvalSchema.parse({ ...valid, approvedBy: null }).approvedBy).toBeNull();
  });
  it('rejects unknown status', () => {
    expect(() => approvalSchema.parse({ ...valid, status: 'x' })).toThrow();
  });
  it('rejects requestedBy <= 0', () => {
    expect(() => approvalSchema.parse({ ...valid, requestedBy: 0 })).toThrow();
  });
});

describe('skillSchema', () => {
  it('accepts a minimal skill', () => {
    expect(
      skillSchema.parse({
        id: 's1',
        name: 'Lookup',
        description: 'Looks things up.',
        domain: 'global',
      }),
    ).toBeTruthy();
  });
  it('rejects missing name', () => {
    expect(() =>
      skillSchema.parse({
        id: 's1',
        description: 'x',
        domain: 'global',
      }),
    ).toThrow();
  });
});

describe('jobQueuePayloadSchema', () => {
  const valid = {
    jobId: 'j1',
    jobType: 'test',
    payload: { foo: 'bar' },
  };
  it('applies priority/attempts/maxAttempts defaults', () => {
    const r = jobQueuePayloadSchema.parse(valid);
    expect(r.priority).toBe('medium');
    expect(r.attempts).toBe(0);
    expect(r.maxAttempts).toBe(3);
  });
  it('rejects negative attempts', () => {
    expect(() => jobQueuePayloadSchema.parse({ ...valid, attempts: -1 })).toThrow();
  });
  it('rejects maxAttempts <= 0', () => {
    expect(() => jobQueuePayloadSchema.parse({ ...valid, maxAttempts: 0 })).toThrow();
  });
  it('rejects unknown priority', () => {
    expect(() => jobQueuePayloadSchema.parse({ ...valid, priority: 'yesterday' })).toThrow();
  });
  it('rejects when payload is missing', () => {
    const { payload: _, ...rest } = valid;
    expect(() => jobQueuePayloadSchema.parse(rest)).toThrow();
  });
});
