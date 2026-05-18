/**
 * Frontier Retention Workflow — periodically prunes old `frontier_timeline`
 * rows and stale discarded inbox items so the operator-facing tables stay
 * fast and storage growth is bounded.
 *
 * - Single `pruneFrontierRetentionActivity` per tick. The activity returns
 *   row-deleted counts so workflow history doubles as an audit log.
 * - `continueAsNew` keeps history bounded for the long-running schedule.
 * - Default cadence is daily (24h) — matches the typical operations cadence
 *   for storage maintenance and is configurable via env / scheduler args.
 */

import {
  proxyActivities,
  sleep,
  continueAsNew,
  workflowInfo,
} from '@temporalio/workflow';
import type * as retentionActivities from '../activities/frontier-retention-activities.js';

const { pruneFrontierRetentionActivity } = proxyActivities<typeof retentionActivities>({
  startToCloseTimeout: '5m',
  retry: {
    maximumAttempts: 3,
    initialInterval: '30s',
    backoffCoefficient: 2,
    maximumInterval: '5m',
  },
});

export interface FrontierRetentionWorkflowInput {
  /** Days of `frontier_timeline` to retain. Default: 30. */
  timelineDays?: number;
  /** Days of discarded inbox items to retain. Default: same as timelineDays. */
  discardedInboxDays?: number;
  /** Interval between prune sweeps (ms). Default: 24h. */
  intervalMs?: number;
  /** Sweep this many times before continueAsNew. Default: 30. */
  ticksBeforeContinue?: number;
}

export interface FrontierRetentionWorkflowResult {
  ticks: number;
  totalTimelineDeleted: number;
  totalDiscardedInboxDeleted: number;
  totalOrphanArtifactsDeleted: number;
}

export async function frontierRetentionWorkflow(
  input: FrontierRetentionWorkflowInput = {},
): Promise<FrontierRetentionWorkflowResult> {
  const interval = input.intervalMs ?? 24 * 60 * 60 * 1000;
  const ticksBeforeContinue = input.ticksBeforeContinue ?? 30;

  let ticks = 0;
  let totalTimelineDeleted = 0;
  let totalDiscardedInboxDeleted = 0;
  let totalOrphanArtifactsDeleted = 0;

  while (ticks < ticksBeforeContinue) {
    const result = await pruneFrontierRetentionActivity({
      timelineDays: input.timelineDays,
      discardedInboxDays: input.discardedInboxDays,
    });
    if (!result.skipped) {
      totalTimelineDeleted += result.timelineDeleted;
      totalDiscardedInboxDeleted += result.discardedInboxDeleted;
      totalOrphanArtifactsDeleted += result.orphanArtifactsDeleted;
    }
    ticks += 1;
    if (ticks < ticksBeforeContinue) await sleep(interval);
  }

  if (workflowInfo().historyLength > 1_000) {
    return continueAsNew<typeof frontierRetentionWorkflow>(input);
  }
  return {
    ticks,
    totalTimelineDeleted,
    totalDiscardedInboxDeleted,
    totalOrphanArtifactsDeleted,
  };
}
