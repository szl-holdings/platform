/**
 * Carlota Jo inquiries / reservations privacy contributor.
 *
 * These tables store name, email, phone, and message from external visitors and
 * clients who submitted inquiries or booked services. They have no user_id FK
 * (submissions arrive before account creation, or from non-platform visitors).
 *
 * Strategy:
 *  - Export: locate rows whose email matches the platform user's email.
 *  - Deletion: pseudonymize matched rows — replace name, phone, and message with
 *    "[deleted]" and email with a hash-like placeholder. The row is retained for
 *    business record integrity; the PII is irrecoverably removed.
 *
 * If the user has no email recorded in the platform, this contributor is a no-op.
 */

import { carlotaInquiriesTable, carlotaReservationsTable, db } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import type { PrivacyContributor, PrivacyUserContext } from '../privacy-registry';

const DELETED_PLACEHOLDER = '[deleted]';

export const carlotaInquiriesContributor: PrivacyContributor = {
  domain: 'carlota_inquiries',

  async exportForUser({ userEmail }: PrivacyUserContext) {
    if (!userEmail) return { inquiries: [], reservations: [] };

    const inquiries = await db
      .select({
        id: carlotaInquiriesTable.id,
        name: carlotaInquiriesTable.name,
        email: carlotaInquiriesTable.email,
        company: carlotaInquiriesTable.company,
        service: carlotaInquiriesTable.service,
        createdAt: carlotaInquiriesTable.createdAt,
      })
      .from(carlotaInquiriesTable)
      .where(eq(carlotaInquiriesTable.email, userEmail));

    const reservations = await db
      .select({
        id: carlotaReservationsTable.id,
        confirmationId: carlotaReservationsTable.confirmationId,
        name: carlotaReservationsTable.name,
        email: carlotaReservationsTable.email,
        service: carlotaReservationsTable.service,
        date: carlotaReservationsTable.date,
        status: carlotaReservationsTable.status,
        createdAt: carlotaReservationsTable.createdAt,
      })
      .from(carlotaReservationsTable)
      .where(eq(carlotaReservationsTable.email, userEmail));

    return { inquiries, reservations };
  },

  async deleteForUser({ userId, userEmail }: PrivacyUserContext) {
    if (!userEmail) return;

    const pseudoEmail = `deleted-${userId}@deleted.invalid`;

    await db
      .update(carlotaInquiriesTable)
      .set({
        name: DELETED_PLACEHOLDER,
        email: pseudoEmail,
        phone: null,
        message: DELETED_PLACEHOLDER,
      })
      .where(eq(carlotaInquiriesTable.email, userEmail));

    await db
      .update(carlotaReservationsTable)
      .set({
        name: DELETED_PLACEHOLDER,
        email: pseudoEmail,
        phone: null,
        notes: null,
      })
      .where(eq(carlotaReservationsTable.email, userEmail));
  },
};
