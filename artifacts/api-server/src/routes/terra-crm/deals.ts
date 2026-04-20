import { bodyShape } from '@szl-holdings/contracts/common';
import type { InsertTerraDeal } from '@szl-holdings/db';
import type { IRouter } from 'express';
import { z } from 'zod';
import { listQuerySchema, validateBody, validateQuery } from '../../lib/validation';
import {
  and,
  auditLog,
  authMiddleware,
  broadcastWs,
  CreateDealSchema,
  db,
  desc,
  eq,
  handleRouteError,
  ilike,
  ingestTerraProperty,
  logger,
  nowStr,
  or,
  pubsub,
  sendBadRequest,
  sendSuccess,
  sql,
  TERRA_EVENTS,
  terraDealsTable,
  terraDistressPropertiesTable,
  terraLeadsTable,
  UpdateDealStageSchema,
} from './_shared.js';

export function register(router: IRouter): void {
  router.get(
    '/terra/pipeline/deals',
    authMiddleware({ required: false }),
    validateQuery(listQuerySchema),
    async (req, res) => {
      try {
        const { stage, q, limit, offset } = req.query;

        const conditions = [eq(terraDealsTable.isActive, true)];
        if (stage) conditions.push(eq(terraDealsTable.stage, stage as any));
        if (q) {
          const qStr = String(q);
          conditions.push(
            or(
              ilike(terraDealsTable.address, `%${qStr}%`),
              ilike(terraDealsTable.clientName, `%${qStr}%`),
            )!,
          );
        }

        const lim = Math.min(Number(limit ?? 100), 500);
        const off = Number(offset ?? 0);

        const rows = await db
          .select()
          .from(terraDealsTable)
          .where(and(...conditions))
          .orderBy(desc(terraDealsTable.createdAt))
          .limit(lim)
          .offset(off);

        sendSuccess(res, {
          count: rows.length,
          fetchedAt: new Date().toISOString(),
          dataMode: rows.length > 0 ? 'live' : 'empty',
          deals: rows.map((r) => ({
            id: r.externalId ?? String(r.id),
            address: r.address,
            borough: r.borough,
            county: r.county,
            zipCode: r.zipCode,
            stage: r.stage,
            type: r.type,
            price: r.price ? Number(r.price) : null,
            askingPrice: r.askingPrice ? Number(r.askingPrice) : null,
            arv: r.arv ? Number(r.arv) : null,
            probability: r.probability,
            riskLevel: r.riskLevel,
            ownerName: r.ownerName,
            clientName: r.clientName,
            distressPropertyId:
              r.distressPropertyExternalId ??
              (r.distressPropertyId ? String(r.distressPropertyId) : null),
            leadId: r.leadId ? String(r.leadId) : null,
            estimatedCloseDate: r.estimatedCloseDate,
            nextAction: r.nextAction,
            stageEnteredAt: r.stageEnteredAt,
            daysInStage: Math.ceil((Date.now() - new Date(r.stageEnteredAt).getTime()) / 86400000),
            createdAt: r.createdAt,
          })),
        });
      } catch (err) {
        handleRouteError(res, err, 'Failed to fetch deals');
      }
    },
  );

  router.post(
    '/terra/pipeline/deals',
    authMiddleware({ required: true }),
    validateBody(
      bodyShape({
        address: z.unknown().optional(),
        arv: z.unknown().optional(),
        askingPrice: z.unknown().optional(),
        borough: z.unknown().optional(),
        clientName: z.unknown().optional(),
        county: z.unknown().optional(),
        distressPropertyExternalId: z.unknown().optional(),
        distressPropertyId: z.unknown().optional(),
        estimatedCloseDate: z.unknown().optional(),
        leadId: z.unknown().optional(),
        nextAction: z.unknown().optional(),
        notes: z.unknown().optional(),
        ownerName: z.unknown().optional(),
        ownerUserId: z.unknown().optional(),
        price: z.unknown().optional(),
        probability: z.unknown().optional(),
        riskLevel: z.unknown().optional(),
        stage: z.unknown().optional(),
        type: z.unknown().optional(),
        zipCode: z.unknown().optional(),
      }),
    ),
    async (req, res) => {
      try {
        const parsed = CreateDealSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
          return;
        }
        const body = parsed.data;
        const { stage, type, riskLevel } = body;

        let resolvedLeadId: number | null = null;
        if (body.leadId) {
          const numericId = parseInt(String(body.leadId), 10);
          const conditions = isNaN(numericId)
            ? eq(terraLeadsTable.externalId, String(body.leadId))
            : or(
                eq(terraLeadsTable.externalId, String(body.leadId)),
                eq(terraLeadsTable.id, numericId),
              )!;
          const linkedLead = await db
            .select({ id: terraLeadsTable.id })
            .from(terraLeadsTable)
            .where(conditions)
            .limit(1);
          if (linkedLead.length === 0) {
            res
              .status(422)
              .json({ error: `leadId "${body.leadId}" does not reference a valid lead` });
            return;
          }
          resolvedLeadId = linkedLead[0]!.id;
        }

        let resolvedDistressPropertyId: number | null = null;
        let resolvedDistressPropertyExternalId: string | null =
          body.distressPropertyExternalId ?? null;
        if (body.distressPropertyId) {
          const numericId = parseInt(String(body.distressPropertyId), 10);
          const conditions = isNaN(numericId)
            ? eq(terraDistressPropertiesTable.externalId, String(body.distressPropertyId))
            : or(
                eq(terraDistressPropertiesTable.externalId, String(body.distressPropertyId)),
                eq(terraDistressPropertiesTable.id, numericId),
              )!;
          const linkedProp = await db
            .select({
              id: terraDistressPropertiesTable.id,
              externalId: terraDistressPropertiesTable.externalId,
            })
            .from(terraDistressPropertiesTable)
            .where(conditions)
            .limit(1);
          if (linkedProp.length === 0) {
            res.status(422).json({
              error: `distressPropertyId "${body.distressPropertyId}" does not reference a valid property`,
            });
            return;
          }
          resolvedDistressPropertyId = linkedProp[0]!.id;
          resolvedDistressPropertyExternalId =
            linkedProp[0]!.externalId ?? resolvedDistressPropertyExternalId;
        }

        const STAGE_ORDER = [
          'lead',
          'qualified',
          'showing',
          'offer',
          'negotiation',
          'accepted',
          'inspection',
          'financing',
          'under-contract',
          'clear-to-close',
          'closed',
          'lost',
        ];
        const stageIdx = STAGE_ORDER.indexOf(stage);
        const probability =
          stage === 'closed'
            ? 100
            : stage === 'lost'
              ? 5
              : stage === 'clear-to-close'
                ? 95
                : stage === 'under-contract'
                  ? 85
                  : stage === 'financing'
                    ? 78
                    : stage === 'inspection'
                      ? 70
                      : stage === 'accepted'
                        ? 65
                        : stage === 'negotiation'
                          ? 55
                          : stage === 'offer'
                            ? 40
                            : stage === 'showing'
                              ? 30
                              : stage === 'qualified'
                                ? 20
                                : 10;

        const externalId = `deal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const deal: InsertTerraDeal = {
          externalId,
          address: body.address,
          borough: body.borough ?? null,
          county: body.county ?? null,
          zipCode: body.zipCode ?? null,
          stage: stage as any,
          type: type as any,
          price: body.price ? String(body.price) : null,
          askingPrice: body.askingPrice ? String(body.askingPrice) : null,
          arv: body.arv ? String(body.arv) : null,
          probability: body.probability ?? probability,
          riskLevel,
          ownerName: body.ownerName ?? null,
          ownerUserId: body.ownerUserId ?? null,
          clientName: body.clientName ?? null,
          distressPropertyId: resolvedDistressPropertyId,
          distressPropertyExternalId: resolvedDistressPropertyExternalId,
          leadId: resolvedLeadId,
          estimatedCloseDate: body.estimatedCloseDate ?? null,
          nextAction: body.nextAction ?? 'Initial review',
          notes: body.notes ?? null,
          timeline: [
            {
              date: nowStr(),
              event: 'Deal created',
              type: 'created',
              stage,
              stageIndex: stageIdx,
            } as any,
          ],
          isActive: true,
        };

        const inserted = await db
          .insert(terraDealsTable)
          .values(deal as any)
          .returning();
        await auditLog(
          'deal_created',
          'terra_deal',
          externalId,
          { stage: deal.stage, address: deal.address },
          req.user?.id,
        );
        broadcastWs('terra-signals', 'deal-created', {
          id: externalId,
          stage: deal.stage,
          address: deal.address,
        });
        if (inserted[0])
          void pubsub.publish(TERRA_EVENTS.DEAL_UPDATED, { terraDealUpdated: inserted[0] });

        if (inserted[0] && body.address) {
          const _tid =
            req.user?.orgs[0]?.orgId != null ? String(req.user.orgs[0].orgId) : undefined;
          void ingestTerraProperty(
            {
              id: inserted[0].id,
              address: body.address,
              city:
                ((body as Record<string, unknown>).borough as string) ??
                ((body as Record<string, unknown>).county as string) ??
                '',
              state: 'NY',
              zipCode: (body as Record<string, unknown>).zipCode as string | undefined,
              propertyType: body.type,
              ownerName: body.ownerName ?? undefined,
              currentValue: body.price ? Number(body.price) : undefined,
            },
            _tid,
          ).catch((e: unknown) =>
            logger.error({ err: e }, '[terra-crm] ingestTerraProperty failed'),
          );
        }
        sendSuccess(res, { id: externalId, deal: inserted[0] });
      } catch (err) {
        handleRouteError(res, err, 'Failed to create deal');
      }
    },
  );

  router.patch(
    '/terra/pipeline/deals/:id/stage',
    authMiddleware({ required: true }),
    validateBody(bodyShape({})),
    async (req, res) => {
      try {
        const { id } = req.params as Record<string, string>;
        const parsed = UpdateDealStageSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
          sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
          return;
        }
        const { stage, notes } = parsed.data;

        let rows = await db
          .select()
          .from(terraDealsTable)
          .where(eq(terraDealsTable.externalId, id))
          .limit(1);

        if (rows.length === 0) {
          const numId = parseInt(id, 10);
          if (!isNaN(numId)) {
            rows = await db
              .select()
              .from(terraDealsTable)
              .where(eq(terraDealsTable.id, numId))
              .limit(1);
          }
        }

        if (rows.length === 0) {
          res.status(404).json({ error: 'Deal not found' });
          return;
        }

        const deal = rows[0]!;
        const prevStage = deal.stage;
        const STAGE_ORDER = [
          'lead',
          'qualified',
          'showing',
          'offer',
          'negotiation',
          'accepted',
          'inspection',
          'financing',
          'under-contract',
          'clear-to-close',
          'closed',
          'lost',
        ];
        const prevIdx = STAGE_ORDER.indexOf(prevStage);
        const nextIdx = STAGE_ORDER.indexOf(stage);

        if (nextIdx < prevIdx - 1 && stage !== 'lost') {
          res.status(422).json({
            error: `Cannot regress from ${prevStage} to ${stage} — stage transitions must be forward`,
            prevStage,
            proposedStage: stage,
          });
          return;
        }

        const nowDate = new Date().toISOString().slice(0, 10);
        const newTimeline = [
          ...((deal.timeline as any[]) ?? []),
          {
            date: nowDate,
            event: `Stage changed: ${prevStage} → ${stage}`,
            type: 'stage_change',
            ...(notes ? { notes } : {}),
          },
        ];

        const probability =
          stage === 'closed'
            ? 100
            : stage === 'lost'
              ? 5
              : stage === 'clear-to-close'
                ? 95
                : stage === 'under-contract'
                  ? 85
                  : stage === 'financing'
                    ? 78
                    : stage === 'inspection'
                      ? 70
                      : stage === 'accepted'
                        ? 65
                        : stage === 'negotiation'
                          ? 55
                          : stage === 'offer'
                            ? 40
                            : stage === 'showing'
                              ? 30
                              : stage === 'qualified'
                                ? 20
                                : 10;

        await db
          .update(terraDealsTable)
          .set({
            stage: stage as any,
            stageEnteredAt: new Date(),
            probability,
            actualCloseDate: stage === 'closed' ? nowDate : deal.actualCloseDate,
            timeline: newTimeline,
            updatedAt: new Date(),
          })
          .where(eq(terraDealsTable.id, deal.id));

        await auditLog(
          'deal_stage_changed',
          'terra_deal',
          deal.externalId ?? String(deal.id),
          {
            prevStage,
            newStage: stage,
            address: deal.address,
          },
          req.user?.id,
        );
        broadcastWs('terra-signals', 'deal-stage-changed', {
          id: deal.externalId ?? String(deal.id),
          prevStage,
          newStage: stage,
          address: deal.address,
        });
        void pubsub.publish(TERRA_EVENTS.DEAL_UPDATED, { terraDealUpdated: { ...deal, stage } });

        sendSuccess(res, {
          dealId: deal.externalId ?? String(deal.id),
          prevStage,
          newStage: stage,
          probability,
          message: `Deal moved from ${prevStage} to ${stage}`,
        });
      } catch (err) {
        handleRouteError(res, err, 'Failed to update deal stage');
      }
    },
  );
}
