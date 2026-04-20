import { bodyShape } from '@szl-holdings/contracts/common';
import type { IRouter } from 'express';
import { z } from 'zod';
import { validateBody } from '../../lib/validation';
import {
  and,
  authMiddleware,
  db,
  desc,
  eq,
  handleRouteError,
  inArray,
  SaveOpportunitySchema,
  sendBadRequest,
  sendSuccess,
  sql,
  terraDealsTable,
  terraDistressPropertiesTable,
  terraSavedOpportunitiesTable,
} from './_shared.js';

export function register(router: IRouter): void {
  router.get(
    '/terra/opportunities/saved',
    authMiddleware({ required: false }),
    async (req, res) => {
      try {
        const userId = req.user?.id ?? null;

        const rows = await db
          .select({
            id: terraSavedOpportunitiesTable.id,
            note: terraSavedOpportunitiesTable.note,
            savedAt: terraSavedOpportunitiesTable.savedAt,
            propertyId: terraDistressPropertiesTable.externalId,
            propertyDbId: terraDistressPropertiesTable.id,
            address: terraDistressPropertiesTable.address,
            borough: terraDistressPropertiesTable.borough,
            distressType: terraDistressPropertiesTable.distressType,
            opportunityScore: terraDistressPropertiesTable.opportunityScore,
            estimatedValue: terraDistressPropertiesTable.estimatedValue,
            stage: terraDistressPropertiesTable.stage,
            propertyUpdatedAt: terraDistressPropertiesTable.updatedAt,
          })
          .from(terraSavedOpportunitiesTable)
          .leftJoin(
            terraDistressPropertiesTable,
            eq(terraSavedOpportunitiesTable.distressPropertyId, terraDistressPropertiesTable.id),
          )
          .where(userId ? eq(terraSavedOpportunitiesTable.userId, userId) : sql`1=1`)
          .orderBy(desc(terraSavedOpportunitiesTable.savedAt))
          .limit(200);

        const propertyDbIds = rows
          .map((r) => r.propertyDbId)
          .filter((id): id is number => id != null);
        const activeDealsByProperty =
          propertyDbIds.length > 0
            ? await db
                .select({
                  distressPropertyId: terraDealsTable.distressPropertyId,
                  stage: terraDealsTable.stage,
                })
                .from(terraDealsTable)
                .where(
                  and(
                    eq(terraDealsTable.isActive, true),
                    inArray(terraDealsTable.distressPropertyId, propertyDbIds),
                  ),
                )
            : [];

        const dealLookup = new Map<number, string>();
        for (const d of activeDealsByProperty) {
          if (d.distressPropertyId != null) dealLookup.set(d.distressPropertyId, d.stage);
        }

        const now = Date.now();
        const enriched = rows.map((r) => {
          const savedMs = r.savedAt ? new Date(r.savedAt).getTime() : now;
          const updatedMs = r.propertyUpdatedAt ? new Date(r.propertyUpdatedAt).getTime() : savedMs;
          const daysSinceSaved = Math.floor((now - savedMs) / 86400000);
          const daysSinceUpdate = Math.floor((now - updatedMs) / 86400000);
          const isStale = daysSinceSaved > 7 && daysSinceUpdate > 7;
          const linkedDealStage =
            r.propertyDbId != null ? (dealLookup.get(r.propertyDbId) ?? null) : null;
          const isConverted = linkedDealStage === 'closed';
          const hasActiveDeal = linkedDealStage != null && linkedDealStage !== 'lost';
          const { propertyDbId: _drop, ...rest } = r;
          return {
            ...rest,
            linkedDealStage,
            hasActiveDeal,
            daysSinceSaved,
            daysSincePropertyUpdate: daysSinceUpdate,
            isStale,
            isConverted,
            watchlistState: isConverted
              ? 'converted'
              : hasActiveDeal
                ? 'in-deal'
                : r.stage === 'acquired'
                  ? 'closed'
                  : isStale
                    ? 'stale'
                    : 'active',
          };
        });

        sendSuccess(res, {
          count: enriched.length,
          fetchedAt: new Date().toISOString(),
          dataMode: enriched.length > 0 ? 'live' : 'empty',
          opportunities: enriched,
        });
      } catch (err) {
        handleRouteError(res, err, 'Failed to fetch saved opportunities');
      }
    },
  );

  router.post(
    '/terra/opportunities/save',
    authMiddleware({ required: true }),
    validateBody(bodyShape({})),
    async (req, res) => {
      try {
        const parsed = SaveOpportunitySchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
          return;
        }
        const { propertyId, note } = parsed.data;

        let propRows = await db
          .select()
          .from(terraDistressPropertiesTable)
          .where(eq(terraDistressPropertiesTable.externalId, String(propertyId)))
          .limit(1);

        if (propRows.length === 0) {
          const numId = parseInt(String(propertyId), 10);
          if (!isNaN(numId)) {
            propRows = await db
              .select()
              .from(terraDistressPropertiesTable)
              .where(eq(terraDistressPropertiesTable.id, numId))
              .limit(1);
          }
        }

        if (propRows.length === 0) {
          res.status(404).json({ error: 'Distress property not found' });
          return;
        }

        const prop = propRows[0]!;
        const userId = req.user?.id ?? null;

        const inserted = await db
          .insert(terraSavedOpportunitiesTable)
          .values({
            userId,
            distressPropertyId: prop.id,
            note: note ?? null,
          })
          .returning();

        sendSuccess(res, {
          savedId: inserted[0]?.id,
          property: { id: prop.externalId ?? String(prop.id), address: prop.address },
        });
      } catch (err) {
        handleRouteError(res, err, 'Failed to save opportunity');
      }
    },
  );
}
