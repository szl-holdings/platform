/**
 * Command / SZL Holdings mobile privacy contributor.
 *
 * Covers user-linked data from the Command and mobile platform layers:
 *  - Constellation saved views (custom dashboard layouts owned by the user)
 *  - Alloy run failure notifications targeted at the user
 *  - Feedback submitted by the user
 *
 * Deletion:
 *  - Saved views and run notifications are hard-deleted.
 *  - Feedback has ON DELETE SET NULL on user_id — no explicit action needed.
 */

import {
  alloyRunFailureNotificationsTable,
  constellationSavedViewsTable,
  db,
  feedbackTable,
} from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import type { PrivacyContributor, PrivacyUserContext } from '../privacy-registry';

export const commandContributor: PrivacyContributor = {
  domain: 'command',

  async exportForUser({ userId }: PrivacyUserContext) {
    const savedViews = await db
      .select({
        id: constellationSavedViewsTable.id,
        domain: constellationSavedViewsTable.domain,
        name: constellationSavedViewsTable.name,
        visibility: constellationSavedViewsTable.visibility,
        createdAt: constellationSavedViewsTable.createdAt,
      })
      .from(constellationSavedViewsTable)
      .where(eq(constellationSavedViewsTable.userId, userId));

    const runNotifications = await db
      .select({
        id: alloyRunFailureNotificationsTable.id,
        runId: alloyRunFailureNotificationsTable.runId,
        kind: alloyRunFailureNotificationsTable.kind,
        createdAt: alloyRunFailureNotificationsTable.createdAt,
      })
      .from(alloyRunFailureNotificationsTable)
      .where(eq(alloyRunFailureNotificationsTable.userId, userId));

    const feedback = await db
      .select({
        id: feedbackTable.id,
        type: feedbackTable.type,
        createdAt: feedbackTable.createdAt,
      })
      .from(feedbackTable)
      .where(eq(feedbackTable.userId, userId));

    return { savedViews, runNotifications, feedback };
  },

  async deleteForUser({ userId }: PrivacyUserContext) {
    await db
      .delete(constellationSavedViewsTable)
      .where(eq(constellationSavedViewsTable.userId, userId));

    await db
      .delete(alloyRunFailureNotificationsTable)
      .where(eq(alloyRunFailureNotificationsTable.userId, userId));

    // feedbackTable.userId has ON DELETE SET NULL — no explicit action needed.
  },
};
