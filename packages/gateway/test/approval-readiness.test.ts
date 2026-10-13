import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  APPROVAL_PROBE_DECISIONS,
  APPROVAL_PROBE_GROUPS,
  APPROVAL_PROBE_REQUIRED_COUNT,
  enforceApprovalGroupCount,
  probeApprovalWorkflow,
  probeTemporalClientAvailability,
} from '../src/approval-readiness.js';
import type { GatewayConfig } from '../src/types.js';

const originalFetch = globalThis.fetch;

const CONFIG: GatewayConfig = {
  jwt: { algorithm: 'HS256', secret: 'test-only' },
  opaEndpoint: 'local',
  temporalEndpoint: 'temporal.example.test:7233',
  openAiApiKey: 'local',
  approvalWorkflow: {
    namespace: 'szl-production',
    taskQueue: 'approval-task-queue',
    proofEndpoint: 'https://approval-proof.example.test',
    proofToken: 'approval-proof-token',
  },
  evidenceLedger: null,
  auditLogPath: '/tmp/approval-readiness-test.ndjson',
  approvalTimeoutMs: 5_000,
};

const VALID_PROOF = {
  status: 'ready',
  workflowType: 'approvalWorkflow',
  namespace: 'szl-production',
  taskQueue: 'approval-task-queue',
  requiredApprovalCount: 2,
  requestedApproverGroups: ['platform-team', 'release-managers'],
  acceptedApproverIds: ['approval-probe-platform', 'approval-probe-release'],
  outcome: 'approved',
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('Temporal approvalWorkflow readiness contract', () => {
  it('executes a non-skippable source round trip enforcing group and unique-count rules', () => {
    expect(
      enforceApprovalGroupCount(
        APPROVAL_PROBE_REQUIRED_COUNT,
        APPROVAL_PROBE_GROUPS,
        APPROVAL_PROBE_DECISIONS,
      ),
    ).toEqual({
      acceptedApproverIds: ['approval-probe-platform', 'approval-probe-release'],
      outcome: 'approved',
    });

    expect(
      enforceApprovalGroupCount(2, APPROVAL_PROBE_GROUPS, [
        APPROVAL_PROBE_DECISIONS[0],
        APPROVAL_PROBE_DECISIONS[0],
        { approverUserId: 'outsider', approverGroups: ['untrusted-group'] },
      ]),
    ).toEqual({ acceptedApproverIds: ['approval-probe-platform'], outcome: 'pending' });
  });

  it('probes the configured namespace and task queue with the fixed compiled contract', async () => {
    const mockedFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(VALID_PROOF), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    globalThis.fetch = mockedFetch;

    await expect(probeApprovalWorkflow(CONFIG)).resolves.toBe(true);
    expect(mockedFetch).toHaveBeenCalledWith(
      'https://approval-proof.example.test/v1/probe',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
        headers: expect.objectContaining({ Authorization: 'Bearer approval-proof-token' }),
      }),
    );
    const body = JSON.parse(String(mockedFetch.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      workflowType: 'approvalWorkflow',
      namespace: 'szl-production',
      taskQueue: 'approval-task-queue',
      requiredApprovalCount: 2,
      requestedApproverGroups: ['platform-team', 'release-managers'],
    });
  });

  it('keeps live runtime on HOLD while the Temporal client is absent from the checkout', async () => {
    await expect(probeTemporalClientAvailability(CONFIG)).resolves.toBe(false);
  });

  it.each([
    ['empty proof', {}],
    ['wrong workflow', { ...VALID_PROOF, workflowType: 'differentWorkflow' }],
    ['wrong task queue', { ...VALID_PROOF, taskQueue: 'empty-queue' }],
    ['count not enforced', { ...VALID_PROOF, requiredApprovalCount: 1 }],
    ['groups not enforced', { ...VALID_PROOF, requestedApproverGroups: ['platform-team'] }],
    [
      'duplicate approver accepted',
      {
        ...VALID_PROOF,
        acceptedApproverIds: ['approval-probe-platform', 'approval-probe-platform'],
      },
    ],
  ])('fails closed for %s', async (_name, proof) => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(proof), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(probeApprovalWorkflow(CONFIG)).resolves.toBe(false);
  });
});
