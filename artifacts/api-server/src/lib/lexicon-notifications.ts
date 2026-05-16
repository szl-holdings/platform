/**
 * Lexicon review notifications (task #4878).
 *
 * When the inference gate auto-enqueues an unknown model into the Lexicon for
 * operator review, dispatch an in-app notification to every designated
 * approver so the pending item is surfaced in the global "tasks for you"
 * indicator (the NotificationBell, which polls `/api/notifications/count`).
 *
 * Designated approvers are platform users that hold any of the Lexicon-admin
 * roles recognised by the routes file (`super_admin`, `admin`, `compliance`).
 * The notification is in-app only; an external dispatch (email/Slack/SMS) is
 * fanned out automatically by the existing
 * `dispatchToExternalChannels` job for each persisted notification.
 *
 * Failure mode: every step is best-effort and logged. The inference gate must
 * never fail because we could not deliver a courtesy alert.
 */
import {
  db,
  notificationsTable,
  rolesTable,
  userRolesTable,
  usersTable,
} from '@szl-holdings/db';
import { and, eq, inArray } from 'drizzle-orm';
import { logger } from './logger';
import { publish, WS_CHANNELS } from './websocket';
import { dispatchToExternalChannels } from '../routes/notifications';

const LEXICON_APPROVER_ROLES = ['super_admin', 'admin', 'compliance'] as const;

const LEXICON_REVIEW_URL = '/governance/lexicon';

export interface LexiconReviewAlertInput {
  reviewRequestId: string;
  entryId: string;
  targetId: string;
  provider?: string | null;
  context?: Record<string, unknown> | null;
}

/**
 * Resolve the platform user IDs that should be alerted when a new Lexicon
 * review is enqueued. Mirrors `isLexiconAdmin` in
 * `routes/a11oy-lexicon-api.ts` (super_admin / admin / compliance).
 */
async function resolveLexiconApproverUserIds(): Promise<number[]> {
  try {
    const roleRows = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(
        inArray(
          rolesTable.name,
          LEXICON_APPROVER_ROLES as unknown as Array<typeof rolesTable.$inferSelect.name>,
        ),
      );
    if (roleRows.length === 0) return [];

    const userRows = await db
      .select({ userId: userRolesTable.userId })
      .from(userRolesTable)
      .where(
        inArray(
          userRolesTable.roleId,
          roleRows.map((r) => r.id),
        ),
      );

    const candidateIds = Array.from(new Set(userRows.map((r) => r.userId)));
    if (candidateIds.length === 0) return [];

    const activeRows = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(and(inArray(usersTable.id, candidateIds), eq(usersTable.isActive, true)));
    return activeRows.map((r) => r.id);
  } catch (err) {
    logger.warn({ err }, '[lexicon-notifications] Failed to resolve approver users');
    return [];
  }
}

/**
 * Notify every designated Lexicon approver about a newly-enqueued review.
 * Idempotency is the caller's responsibility: only invoke when a fresh
 * review-request row was created (not when an existing one was reused).
 */
export async function notifyLexiconReviewers(input: LexiconReviewAlertInput): Promise<{
  recipientCount: number;
  notificationIds: number[];
}> {
  try {
    const approverIds = await resolveLexiconApproverUserIds();
    if (approverIds.length === 0) {
      logger.info(
        { targetId: input.targetId, reviewRequestId: input.reviewRequestId },
        '[lexicon-notifications] No designated approvers found — skipping alert',
      );
      return { recipientCount: 0, notificationIds: [] };
    }

    const sourceLabel = (() => {
      const src = (input.context as { source?: unknown } | null)?.source;
      return typeof src === 'string' && src.length > 0 ? src : 'inference_gate';
    })();

    const title = `License review needed: ${input.targetId}`;
    const message =
      `A new model was auto-enqueued into the Lexicon for license review by the ` +
      `${sourceLabel.replace(/_/g, ' ')}. Inference calls to this target are blocked ` +
      `until an operator approves or denies the entry.`;
    const actionUrl = `${LEXICON_REVIEW_URL}?entry=${encodeURIComponent(input.entryId)}`;

    const inserted = await db
      .insert(notificationsTable)
      .values(
        approverIds.map((userId) => ({
          userId,
          type: 'action_required' as const,
          channel: 'in_app' as const,
          title,
          message,
          actionUrl,
        })),
      )
      .returning({ id: notificationsTable.id, userId: notificationsTable.userId });

    // Fan out to email/Slack/SMS per each approver's preferences.
    for (const row of inserted) {
      void dispatchToExternalChannels({
        notificationId: row.id,
        userId: row.userId,
        type: 'action_required',
        title,
        message,
        actionUrl,
      });
    }

    // Broadcast on the shared NOTIFICATIONS WS channel so the
    // NotificationBell badge updates in real time without waiting for the
    // 60s poll. The payload intentionally contains only non-sensitive
    // metadata (target id + review id + recipient count) — per-user
    // discovery still goes through the auth-scoped /api/notifications.
    try {
      publish(WS_CHANNELS.NOTIFICATIONS, 'new_notification', {
        kind: 'lexicon_review_pending',
        reviewRequestId: input.reviewRequestId,
        entryId: input.entryId,
        targetId: input.targetId,
        recipientCount: inserted.length,
        actionUrl,
      });
    } catch (err) {
      logger.warn({ err }, '[lexicon-notifications] WS publish failed (non-fatal)');
    }

    logger.info(
      {
        targetId: input.targetId,
        reviewRequestId: input.reviewRequestId,
        recipientCount: inserted.length,
      },
      '[lexicon-notifications] Approvers alerted to new pending Lexicon review',
    );

    return {
      recipientCount: inserted.length,
      notificationIds: inserted.map((r) => r.id),
    };
  } catch (err) {
    logger.warn(
      { err, targetId: input.targetId, reviewRequestId: input.reviewRequestId },
      '[lexicon-notifications] Failed to dispatch reviewer alerts (non-fatal)',
    );
    return { recipientCount: 0, notificationIds: [] };
  }
}

export const __test__ = { resolveLexiconApproverUserIds, LEXICON_APPROVER_ROLES };
