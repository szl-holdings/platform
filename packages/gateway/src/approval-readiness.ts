/**
 * Fail-closed readiness contract for the deployed Temporal approval workflow.
 * A TCP-open Temporal frontend is insufficient: live readiness requires an
 * authenticated endpoint that has executed this fixed group/count round trip
 * through the configured namespace, task queue, and workflow type.
 */

import type { ApprovalWorkflowProbeConfig, GatewayConfig } from './types.js';

export interface ApprovalProbeDecision {
  approverUserId: string;
  approverGroups: string[];
}

export interface ApprovalProbeResult {
  acceptedApproverIds: string[];
  outcome: 'approved' | 'pending';
}

export const APPROVAL_PROBE_GROUPS = ['platform-team', 'release-managers'] as const;
export const APPROVAL_PROBE_DECISIONS: readonly ApprovalProbeDecision[] = [
  { approverUserId: 'approval-probe-platform', approverGroups: ['platform-team'] },
  { approverUserId: 'approval-probe-release', approverGroups: ['release-managers'] },
];
export const APPROVAL_PROBE_REQUIRED_COUNT = 2;

function isUniqueNonEmptyStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (entry) => typeof entry === 'string' && entry.length > 0 && entry === entry.trim(),
    ) &&
    new Set(value).size === value.length
  );
}

/** Pure contract used by the source-level round-trip regression. */
export function enforceApprovalGroupCount(
  requiredCount: number,
  requiredGroups: readonly string[],
  decisions: readonly ApprovalProbeDecision[],
): ApprovalProbeResult {
  if (!Number.isSafeInteger(requiredCount) || requiredCount < 1) {
    throw new Error('required approval count must be a positive integer');
  }
  if (!isUniqueNonEmptyStrings(requiredGroups)) {
    throw new Error('required approval groups must be unique non-empty strings');
  }

  const eligibleApprovers = new Set<string>();
  for (const decision of decisions) {
    if (
      typeof decision.approverUserId !== 'string' ||
      decision.approverUserId.length === 0 ||
      !isUniqueNonEmptyStrings(decision.approverGroups)
    ) {
      continue;
    }
    if (decision.approverGroups.some((group) => requiredGroups.includes(group))) {
      eligibleApprovers.add(decision.approverUserId);
    }
  }

  const acceptedApproverIds = [...eligibleApprovers].sort();
  return {
    acceptedApproverIds,
    outcome: acceptedApproverIds.length >= requiredCount ? 'approved' : 'pending',
  };
}

function expectedProbeBody(config: ApprovalWorkflowProbeConfig) {
  return {
    workflowType: 'approvalWorkflow',
    namespace: config.namespace,
    taskQueue: config.taskQueue,
    requiredApprovalCount: APPROVAL_PROBE_REQUIRED_COUNT,
    requestedApproverGroups: [...APPROVAL_PROBE_GROUPS],
    decisions: APPROVAL_PROBE_DECISIONS,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isExactStringArray(value: unknown, expected: readonly string[]): boolean {
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    value.every((entry, index) => entry === expected[index])
  );
}

export async function probeApprovalWorkflow(config: GatewayConfig): Promise<boolean> {
  const workflow = config.approvalWorkflow;
  if (config.temporalEndpoint === 'local') return workflow === null;
  if (!workflow) return false;

  try {
    const response = await fetch(`${workflow.proofEndpoint.replace(/\/$/, '')}/v1/probe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${workflow.proofToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expectedProbeBody(workflow)),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    if (!isRecord(result)) return false;
    const keys = Object.keys(result).sort();
    const expectedKeys = [
      'acceptedApproverIds',
      'namespace',
      'outcome',
      'requestedApproverGroups',
      'requiredApprovalCount',
      'status',
      'taskQueue',
      'workflowType',
    ];
    return (
      keys.length === expectedKeys.length &&
      keys.every((key, index) => key === expectedKeys[index]) &&
      result.status === 'ready' &&
      result.workflowType === 'approvalWorkflow' &&
      result.namespace === workflow.namespace &&
      result.taskQueue === workflow.taskQueue &&
      result.requiredApprovalCount === APPROVAL_PROBE_REQUIRED_COUNT &&
      isExactStringArray(result.requestedApproverGroups, APPROVAL_PROBE_GROUPS) &&
      isExactStringArray(result.acceptedApproverIds, [
        'approval-probe-platform',
        'approval-probe-release',
      ]) &&
      result.outcome === 'approved'
    );
  } catch {
    return false;
  }
}

export async function probeTemporalClientAvailability(config: GatewayConfig): Promise<boolean> {
  if (config.temporalEndpoint === 'local') return true;
  try {
    const temporal = await import('@temporalio/client');
    return (
      typeof temporal.Connection?.connect === 'function' && typeof temporal.Client === 'function'
    );
  } catch {
    return false;
  }
}
