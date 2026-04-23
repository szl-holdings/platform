/**
 * Carlota Jo privacy contributor — userId-linked data.
 *
 * Covers:
 *  - Radar notification preferences and seen-signals (hard-deleted)
 *  - Radar competitor watchlists (hard-deleted)
 *  - Engagements, diagnostics, and scenarios authored by the user
 *    (createdByUserId → NULL; content retained but de-linked)
 *
 * See carlota-inquiries.ts for the email-based inquiries / reservations contributor.
 */

import {
  carlotaDiagnosticsTable,
  carlotaEngagementsTable,
  carlotaRadarCompetitorsTable,
  carlotaRadarNotifPrefsTable,
  carlotaRadarSeenSignalsTable,
  carlotaScenariosTable,
  db,
} from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import type { PrivacyContributor, PrivacyUserContext } from '../privacy-registry';

export const carlotaContributor: PrivacyContributor = {
  domain: 'carlota',

  async exportForUser({ userId }: PrivacyUserContext) {
    const radarPrefs = await db
      .select()
      .from(carlotaRadarNotifPrefsTable)
      .where(eq(carlotaRadarNotifPrefsTable.userId, userId));

    const radarSeen = await db
      .select({ signalHash: carlotaRadarSeenSignalsTable.signalHash })
      .from(carlotaRadarSeenSignalsTable)
      .where(eq(carlotaRadarSeenSignalsTable.userId, userId));

    const radarCompetitors = await db
      .select()
      .from(carlotaRadarCompetitorsTable)
      .where(eq(carlotaRadarCompetitorsTable.userId, userId));

    const engagements = await db
      .select({ id: carlotaEngagementsTable.id, createdAt: carlotaEngagementsTable.createdAt })
      .from(carlotaEngagementsTable)
      .where(eq(carlotaEngagementsTable.createdByUserId, userId));

    const diagnostics = await db
      .select({ id: carlotaDiagnosticsTable.id, createdAt: carlotaDiagnosticsTable.createdAt })
      .from(carlotaDiagnosticsTable)
      .where(eq(carlotaDiagnosticsTable.createdByUserId, userId));

    const scenarios = await db
      .select({ id: carlotaScenariosTable.id, createdAt: carlotaScenariosTable.createdAt })
      .from(carlotaScenariosTable)
      .where(eq(carlotaScenariosTable.createdByUserId, userId));

    return { radarPrefs, radarSeen, radarCompetitors, engagements, diagnostics, scenarios };
  },

  async deleteForUser({ userId }: PrivacyUserContext) {
    await db
      .delete(carlotaRadarSeenSignalsTable)
      .where(eq(carlotaRadarSeenSignalsTable.userId, userId));

    await db
      .delete(carlotaRadarNotifPrefsTable)
      .where(eq(carlotaRadarNotifPrefsTable.userId, userId));

    await db
      .delete(carlotaRadarCompetitorsTable)
      .where(eq(carlotaRadarCompetitorsTable.userId, userId));

    await db
      .update(carlotaEngagementsTable)
      .set({ createdByUserId: null })
      .where(eq(carlotaEngagementsTable.createdByUserId, userId));

    await db
      .update(carlotaDiagnosticsTable)
      .set({ createdByUserId: null })
      .where(eq(carlotaDiagnosticsTable.createdByUserId, userId));

    await db
      .update(carlotaScenariosTable)
      .set({ createdByUserId: null })
      .where(eq(carlotaScenariosTable.createdByUserId, userId));
  },
};
