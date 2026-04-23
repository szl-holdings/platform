/**
 * Notifications / push-tokens privacy contributor.
 *
 * Export: surfaces push device tokens held for the user.
 * Deletion: ON DELETE CASCADE on push_tokens.user_id — no explicit action needed.
 */

import { db, pushTokensTable } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import type { PrivacyContributor, PrivacyUserContext } from '../privacy-registry';

export const notificationsContributor: PrivacyContributor = {
  domain: 'notifications',

  async exportForUser({ userId }: PrivacyUserContext) {
    const tokens = await db
      .select({
        id: pushTokensTable.id,
        platform: pushTokensTable.platform,
        createdAt: pushTokensTable.createdAt,
      })
      .from(pushTokensTable)
      .where(eq(pushTokensTable.userId, userId));

    return { pushTokens: tokens };
  },

  async deleteForUser(_ctx: PrivacyUserContext) {
    // ON DELETE CASCADE on push_tokens.user_id — no explicit action needed.
  },
};
