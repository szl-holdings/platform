/**
 * Frontier retention activities — invoked by `frontierRetentionWorkflow`.
 *
 * Activities perform external I/O (Postgres DELETEs via the frontier
 * service). Workflow code stays deterministic and just records the result
 * in workflow history for an auditable proof-record of what was pruned.
 */

export interface PruneFrontierRetentionInput {
  /** Days of `frontier_timeline` to retain. */
  timelineDays?: number;
  /** Days of discarded inbox items (and their orphan artifacts) to retain. */
  discardedInboxDays?: number;
}

export interface PruneFrontierRetentionResult {
  timelineDeleted: number;
  discardedInboxDeleted: number;
  orphanArtifactsDeleted: number;
  timelineCutoff: string;
  discardedInboxCutoff: string;
  skipped: boolean;
}

/**
 * Run a single retention sweep against the shared frontier DB. When the
 * DB backend isn't available (e.g. ephemeral CI) returns `{ skipped: true }`
 * so the workflow simply records a no-op tick instead of failing.
 */
export async function pruneFrontierRetentionActivity(
  input: PruneFrontierRetentionInput = {},
): Promise<PruneFrontierRetentionResult> {
  const { pruneFrontierRetention } = await import('@workspace/frontier-ingest');
  const result = await pruneFrontierRetention({
    timelineDays: input.timelineDays,
    discardedInboxDays: input.discardedInboxDays,
  });
  if (!result) {
    const nowIso = new Date().toISOString();
    return {
      timelineDeleted: 0,
      discardedInboxDeleted: 0,
      orphanArtifactsDeleted: 0,
      timelineCutoff: nowIso,
      discardedInboxCutoff: nowIso,
      skipped: true,
    };
  }
  return { ...result, skipped: false };
}
