/**
 * Audit-events privacy contributor.
 *
 * Export: returns up to 5 000 audit events where the user was the actor.
 * Deletion: retained under the legitimate-interest/legal-obligation exception
 * (Article 17(3)(b) GDPR); the actor_user_id FK is set to NULL by the database's
 * ON DELETE SET NULL rule when the user row is removed, pseudonymizing the record.
 */

import { auditEventsTable, db } from '@szl-holdings/db';
import { desc, eq } from 'drizzle-orm';
import type { PrivacyContributor, PrivacyUserContext } from '../privacy-registry';

export const auditContributor: PrivacyContributor = {
  domain: 'audit',

  async exportForUser({ userId }: PrivacyUserContext) {
    const events = await db
      .select({
        id: auditEventsTable.id,
        action: auditEventsTable.action,
        entityType: auditEventsTable.entityType,
        entityId: auditEventsTable.entityId,
        createdAt: auditEventsTable.createdAt,
        product: auditEventsTable.product,
      })
      .from(auditEventsTable)
      .where(eq(auditEventsTable.userId, userId))
      .orderBy(desc(auditEventsTable.createdAt))
      .limit(5000);

    return {
      events,
      retentionNote:
        'Audit records are retained under the legal-obligation exception (GDPR Art 17(3)(b)); actor identity is pseudonymized on account deletion.',
    };
  },

  async deleteForUser(_ctx: PrivacyUserContext) {
    // ON DELETE SET NULL on audit_events.user_id — no explicit action needed.
  },
};
