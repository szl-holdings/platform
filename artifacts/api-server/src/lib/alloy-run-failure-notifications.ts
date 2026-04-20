import {
  alloyRunFailureNotificationsTable,
  alloyWorkflowRunsTable,
  alloyWorkflowsTable,
  db,
  usersTable,
} from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import { isAlertCategoryAllowedForUser, sendPushToUser } from './expo-push';
import { logger } from './logger';

const PUSH_APP_ID = 'platform';
const DEEP_LINK = '/(shell)/intelligence/run-review';

export type RunFailureKind = 'failed' | 'stuck';

interface ResolvedRecipient {
  userId: number;
  source: 'owner' | 'on_call';
}

/**
 * Resolve who should be notified for a failed/stuck run.
 *  1. Run.triggeredBy (active) — the operator who launched the run.
 *  2. On-call user for the workflow creator's team — covers system /
 *     anonymous runs and the case where the original triggerer has been
 *     deactivated.
 * Returns null when neither is resolvable; the caller skips notification
 * rather than fanning out to all admins (avoids cross-tenant leakage).
 */
async function resolveRecipient(
  run: typeof alloyWorkflowRunsTable.$inferSelect,
): Promise<ResolvedRecipient | null> {
  if (run.triggeredBy != null) {
    const [owner] = await db
      .select({ id: usersTable.id, isActive: usersTable.isActive })
      .from(usersTable)
      .where(eq(usersTable.id, run.triggeredBy))
      .limit(1);
    if (owner?.isActive) return { userId: owner.id, source: 'owner' };
  }

  // Fallback: on-call user for the workflow creator's team.
  let workflowCreatorId: number | null = null;
  try {
    const [wf] = await db
      .select({ createdBy: alloyWorkflowsTable.createdBy })
      .from(alloyWorkflowsTable)
      .where(eq(alloyWorkflowsTable.id, run.workflowId))
      .limit(1);
    workflowCreatorId = wf?.createdBy ?? null;
  } catch {
    workflowCreatorId = null;
  }
  if (workflowCreatorId == null) return null;

  const [creator] = await db
    .select({ team: usersTable.team })
    .from(usersTable)
    .where(eq(usersTable.id, workflowCreatorId))
    .limit(1);
  const team = creator?.team ?? null;
  if (!team) return null;

  try {
    const { resolveOnCall } = await import('../routes/teams');
    const memberRows = await db
      .select({
        id: usersTable.id,
        displayName: usersTable.displayName,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        platformRole: usersTable.platformRole,
        isActive: usersTable.isActive,
      })
      .from(usersTable)
      .where(eq(usersTable.team, team));
    const { onCall } = await resolveOnCall(team, memberRows, new Date());
    if (onCall?.isActive) return { userId: onCall.id, source: 'on_call' };
  } catch (err) {
    logger.debug({ err, team }, '[run-failure-notify] On-call resolution failed');
  }
  return null;
}

/**
 * Server-initiated push for an Alloy workflow run that has either
 * transitioned to "failed" or been detected as "stuck" by the sweeper.
 *
 * Recipient = run owner (run.triggeredBy) when active, otherwise the
 * current on-call user for the workflow creator's team. Avoids fanning
 * out to all admins to prevent cross-tenant leakage.
 *
 * Idempotent: claims a (run_id, user_id, kind) slot in
 * alloy_run_failure_notifications via INSERT ... ON CONFLICT DO NOTHING
 * and exits early if some other tick has already notified the same user
 * about the same run+kind. Dedup is only finalized once the push
 * actually dispatches successfully — transient send failures (e.g. no
 * active push tokens, network errors) DELETE the claim so the next
 * sweeper tick can retry.
 *
 * Honours the user's "run_failures" alert preference and quiet-hours
 * (failed/stuck runs are not classified as critical).
 */
export async function notifyRunFailure(
  runId: number,
  kind: RunFailureKind,
): Promise<{ notified: boolean; reason?: string }> {
  let run: typeof alloyWorkflowRunsTable.$inferSelect | undefined;
  try {
    [run] = await db
      .select()
      .from(alloyWorkflowRunsTable)
      .where(eq(alloyWorkflowRunsTable.id, runId))
      .limit(1);
  } catch (err) {
    logger.warn({ err, runId, kind }, '[run-failure-notify] Failed to load run');
    return { notified: false, reason: 'lookup_failed' };
  }
  if (!run) return { notified: false, reason: 'run_not_found' };

  const recipient = await resolveRecipient(run);
  if (!recipient) {
    return { notified: false, reason: 'no_recipient' };
  }
  const { userId } = recipient;

  // Claim the dedup slot before sending so concurrent ticks don't
  // double-fire. We will release the claim if the dispatch fails.
  let claimedId: number | undefined;
  try {
    const claimed = await db
      .insert(alloyRunFailureNotificationsTable)
      .values({ runId, userId, kind })
      .onConflictDoNothing()
      .returning({ id: alloyRunFailureNotificationsTable.id });
    claimedId = claimed[0]?.id;
  } catch (err) {
    logger.warn({ err, runId, userId, kind }, '[run-failure-notify] Dedup claim failed');
    return { notified: false, reason: 'dedup_claim_failed' };
  }
  if (claimedId == null) {
    return { notified: false, reason: 'already_notified' };
  }

  const releaseClaim = async (reason: string) => {
    try {
      await db
        .delete(alloyRunFailureNotificationsTable)
        .where(
          and(
            eq(alloyRunFailureNotificationsTable.runId, runId),
            eq(alloyRunFailureNotificationsTable.userId, userId),
            eq(alloyRunFailureNotificationsTable.kind, kind),
          ),
        );
    } catch (err) {
      logger.warn(
        { err, runId, userId, kind, reason },
        '[run-failure-notify] Failed to release dedup claim after send failure',
      );
    }
  };

  const allowed = await isAlertCategoryAllowedForUser(userId, 'run_failures', {
    severity: 'high',
  });
  if (!allowed) {
    // Suppression by user preference is a deliberate choice, not a
    // delivery failure — keep the dedup row so we don't keep "trying"
    // every 5 minutes for the same run.
    logger.debug(
      { runId, userId, kind },
      '[run-failure-notify] Suppressed by user alert preferences',
    );
    return { notified: false, reason: 'user_preference' };
  }

  let workflowName = `Workflow #${run.workflowId}`;
  try {
    const [wf] = await db
      .select({ name: alloyWorkflowsTable.name })
      .from(alloyWorkflowsTable)
      .where(eq(alloyWorkflowsTable.id, run.workflowId))
      .limit(1);
    if (wf?.name) workflowName = wf.name;
  } catch {
    // Non-fatal — fall back to the default name.
  }

  const title = kind === 'failed' ? 'Agent run failed' : 'Agent run stuck';
  const body =
    kind === 'failed'
      ? `${workflowName} (run #${runId})${run.errorMessage ? `: ${run.errorMessage.slice(0, 80)}` : ' failed.'}`
      : `${workflowName} (run #${runId}) has been running over the stuck threshold.`;

  try {
    const result = await sendPushToUser(
      userId,
      {
        title,
        body,
        data: {
          kind: kind === 'failed' ? 'run_failed' : 'run_stuck',
          runId,
          workflowId: run.workflowId,
          deepLink: DEEP_LINK,
        },
        sound: 'default',
        channelId: 'default',
      },
      { appId: PUSH_APP_ID },
    );
    if (result.sent === 0) {
      // No active tokens, rate-limited, or all delivery attempts failed.
      // Release the dedup slot so the next sweeper tick can retry.
      await releaseClaim('zero_sent');
      logger.info(
        { runId, userId, kind, recipientSource: recipient.source, failed: result.failed },
        '[run-failure-notify] No tokens delivered; dedup slot released for retry',
      );
      return { notified: false, reason: 'no_active_tokens' };
    }
    logger.info(
      {
        runId,
        userId,
        kind,
        recipientSource: recipient.source,
        sent: result.sent,
        failed: result.failed,
      },
      '[run-failure-notify] Push dispatched',
    );
    return { notified: true };
  } catch (err) {
    await releaseClaim('send_threw');
    logger.warn({ err, runId, userId, kind }, '[run-failure-notify] sendPushToUser threw');
    return { notified: false, reason: 'send_failed' };
  }
}
