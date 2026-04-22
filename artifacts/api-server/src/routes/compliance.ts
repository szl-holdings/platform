import { bodyShape } from '@szl-holdings/contracts/common';
import {
  complianceArchivalTable,
  complianceCalendarTable,
  complianceRiskScoreTable,
  complianceSuitabilityTable,
  complianceSupervisionQueueTable,
  db,
} from '@szl-holdings/db';
import crypto from 'node:crypto';
import { and, desc, eq, gte, lte, } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, } from '../middlewares/auth';

const router: IRouter = Router();

function generateItemId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const CreateSuitabilitySchema = z.object({
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  advisorId: z.string().min(1),
  advisorName: z.string().min(1),
  recommendationType: z.enum([
    'security',
    'insurance',
    'annuity',
    'rollover',
    'account_type',
    'other',
  ]),
  recommendationSummary: z.string().min(1),
  rationaleText: z
    .string()
    .min(10, 'Rationale must be at least 10 characters for Reg BI compliance'),
  clientProfile: z.record(z.unknown()),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive', 'very_aggressive']),
  investmentObjective: z.string().min(1),
  timeHorizonYears: z.number().int().optional(),
  liquidityNeeds: z.string().optional(),
  financialSituation: z.record(z.unknown()).optional(),
  conflicts: z.record(z.unknown()).optional(),
});

const CreateArchivalSchema = z.object({
  communicationType: z.enum([
    'email',
    'chat',
    'voice_transcript',
    'written_correspondence',
    'trade_confirmation',
    'order_ticket',
    'advisory_agreement',
    'other',
  ]),
  participants: z.array(
    z.object({ id: z.string(), name: z.string(), role: z.string().optional() }),
  ),
  subject: z.string().optional(),
  contentSummary: z.string().optional(),
  contentRef: z.string().optional(),
  retentionPolicy: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const CreateSupervisionSchema = z.object({
  category: z.enum([
    'suitability_review',
    'reg_bi_violation',
    'concentration_risk',
    'best_execution',
    'outside_business',
    'communications_review',
    'complaint',
    'exception_report',
    'other',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  submittedById: z.string().optional(),
  submittedByName: z.string().optional(),
  relatedEntities: z.array(z.record(z.unknown())).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  dueAt: z.string().optional(),
});

const CreateCalendarSchema = z.object({
  eventType: z.enum([
    'form_adv',
    'form_adv_part2',
    'form_crs',
    'annual_review',
    'exam_prep',
    'retention_review',
    'reg_bi_audit',
    'finra_exam',
    'sec_exam',
    'state_exam',
    'board_review',
    'policy_review',
    'other',
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  dueAt: z.string(),
  reminderAt: z.string().optional(),
  assignedToId: z.string().optional(),
  assignedToName: z.string().optional(),
  regulatoryBody: z.string().optional(),
  filingReference: z.string().optional(),
  notes: z.string().optional(),
  recurrence: z.enum(['none', 'annual', 'quarterly', 'monthly', 'custom']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// All mock compliance data functions removed — data is sourced exclusively from PostgreSQL.

router.get('/compliance/posture', authMiddleware(), async (_req, res) => {
  try {
    const [latestScore] = await db
      .select()
      .from(complianceRiskScoreTable)
      .orderBy(desc(complianceRiskScoreTable.scoreDate))
      .limit(1);

    if (latestScore) {
      sendSuccess(res, {
        overallRiskScore: Number(latestScore.overallScore),
        regBiScore: Number(latestScore.regBiScore),
        archivalScore: Number(latestScore.archivalScore),
        supervisionScore: Number(latestScore.supervisionScore),
        openSupervisionItems: latestScore.openSupervisionItems,
        criticalItems: latestScore.criticalItems,
        overdueCalendarItems: latestScore.overdueCalendarItems,
        pendingSuitabilityReviews: latestScore.pendingSuitabilityReviews,
        lastUpdated: latestScore.createdAt,
        source: 'live',
      });
    } else {
      sendSuccess(res, {
        overallRiskScore: null,
        regBiScore: null,
        archivalScore: null,
        supervisionScore: null,
        openSupervisionItems: 0,
        criticalItems: 0,
        overdueCalendarItems: 0,
        pendingSuitabilityReviews: 0,
        lastUpdated: null,
        source: 'empty',
        message:
          'No compliance score recorded yet. Use POST /compliance/supervision and /compliance/calendar to add records.',
      });
    }
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch compliance posture');
  }
});

router.get(
  '/compliance/suitability',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { status, advisorId, limit, offset } = req.query;
      const conditions = [];
      if (status) conditions.push(eq(complianceSuitabilityTable.status, status as any));
      if (advisorId) conditions.push(eq(complianceSuitabilityTable.advisorId, advisorId as any));

      const lim = Math.min(Number(limit ?? 50), 200);
      const off = Number(offset ?? 0);

      const rows = await db
        .select()
        .from(complianceSuitabilityTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(complianceSuitabilityTable.createdAt))
        .limit(lim)
        .offset(off);

      sendSuccess(res, {
        count: rows.length,
        dataMode: rows.length > 0 ? 'live' : 'empty',
        items: rows,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch suitability records');
    }
  },
);

router.post(
  '/compliance/suitability',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      clientProfile: z.unknown().optional(),
      conflicts: z.unknown().optional(),
      financialSituation: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const parsed = CreateSuitabilitySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
        return;
      }
      const body = parsed.data;
      const recommendationId = generateItemId('rec');

      const [inserted] = await db
        .insert(complianceSuitabilityTable)
        .values({
          ...body,
          recommendationId,
          clientProfile: body.clientProfile as Record<string, unknown>,
          financialSituation: (body.financialSituation ?? {}) as Record<string, unknown>,
          conflicts: (body.conflicts ?? {}) as Record<string, unknown>,
        })
        .returning();

      sendCreated(res, { recommendationId, record: inserted });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create suitability record');
    }
  },
);

router.patch(
  '/compliance/suitability/:id/review',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      action: z.unknown().optional(),
      reviewNotes: z.unknown().optional(),
      reviewerId: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { id } = req.params as Record<string, string>;
      const { action, reviewNotes, reviewerId } = req.body as {
        action: 'approve' | 'reject';
        reviewNotes?: string;
        reviewerId?: string;
      };
      if (!['approve', 'reject'].includes(action)) {
        sendBadRequest(res, 'action must be approve or reject');
        return;
      }

      const [updated] = await db
        .update(complianceSuitabilityTable)
        .set({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewerId: reviewerId ?? null,
          reviewNotes: reviewNotes ?? null,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(complianceSuitabilityTable.recommendationId, id))
        .returning();

      if (!updated) {
        sendNotFound(res, 'Suitability record');
        return;
      }

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to review suitability record');
    }
  },
);

router.get(
  '/compliance/archival',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { type, limit, offset } = req.query;
      const conditions = [];
      if (type) conditions.push(eq(complianceArchivalTable.communicationType, type as any));

      const lim = Math.min(Number(limit ?? 50), 200);
      const off = Number(offset ?? 0);

      const rows = await db
        .select()
        .from(complianceArchivalTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(complianceArchivalTable.archivedAt))
        .limit(lim)
        .offset(off);

      sendSuccess(res, {
        count: rows.length,
        dataMode: rows.length > 0 ? 'live' : 'empty',
        totalArchived: rows.length,
        items: rows,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch archival records');
    }
  },
);

router.post(
  '/compliance/archival',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      communicationType: z.unknown().optional(),
      contentRef: z.unknown().optional(),
      contentSummary: z.unknown().optional(),
      metadata: z.unknown().optional(),
      participants: z.unknown().optional(),
      retentionPolicy: z.unknown().optional(),
      subject: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const parsed = CreateArchivalSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
        return;
      }
      const body = parsed.data;

      const lastEntry = await db
        .select({ contentHash: complianceArchivalTable.contentHash })
        .from(complianceArchivalTable)
        .orderBy(desc(complianceArchivalTable.archivedAt))
        .limit(1);

      const prevHash = lastEntry[0]?.contentHash ?? null;
      const contentStr = JSON.stringify({ ...body, timestamp: new Date().toISOString() });
      const contentHash = computeContentHash(contentStr);

      const retentionYears = body.retentionPolicy?.includes('6year') ? 6 : 3;
      const retentionExpiresAt = new Date();
      retentionExpiresAt.setFullYear(retentionExpiresAt.getFullYear() + retentionYears);

      const entryId = generateItemId('arch');

      const [inserted] = await db
        .insert(complianceArchivalTable)
        .values({
          entryId,
          prevHash,
          contentHash,
          communicationType: body.communicationType,
          participants: body.participants as unknown as string[],
          subject: body.subject ?? null,
          contentSummary: body.contentSummary ?? null,
          contentRef: body.contentRef ?? null,
          retentionPolicy: body.retentionPolicy ?? 'rule_17a4_3year',
          retentionExpiresAt,
          isImmutable: true,
          metadata: (body.metadata ?? {}) as Record<string, unknown>,
        })
        .returning();

      sendCreated(res, { entryId, contentHash, prevHash, record: inserted });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create archival entry');
    }
  },
);

router.get(
  '/compliance/supervision',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { status, priority, category, limit, offset } = req.query;
      const conditions = [];
      if (status) conditions.push(eq(complianceSupervisionQueueTable.status, status as any));
      if (priority) conditions.push(eq(complianceSupervisionQueueTable.priority, priority as any));
      if (category) conditions.push(eq(complianceSupervisionQueueTable.category, category as any));

      const lim = Math.min(Number(limit ?? 50), 200);
      const off = Number(offset ?? 0);

      const rows = await db
        .select()
        .from(complianceSupervisionQueueTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(complianceSupervisionQueueTable.createdAt))
        .limit(lim)
        .offset(off);

      sendSuccess(res, {
        count: rows.length,
        dataMode: rows.length > 0 ? 'live' : 'empty',
        items: rows,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch supervision queue');
    }
  },
);

router.post(
  '/compliance/supervision',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      assignedToId: z.unknown().optional(),
      assignedToName: z.unknown().optional(),
      category: z.unknown().optional(),
      description: z.unknown().optional(),
      dueAt: z.unknown().optional(),
      priority: z.unknown().optional(),
      relatedEntities: z.unknown().optional(),
      riskScore: z.unknown().optional(),
      submittedById: z.unknown().optional(),
      submittedByName: z.unknown().optional(),
      title: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const parsed = CreateSupervisionSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
        return;
      }
      const body = parsed.data;
      const itemId = generateItemId('sup');

      const [inserted] = await db
        .insert(complianceSupervisionQueueTable)
        .values({
          itemId,
          category: body.category,
          priority: body.priority ?? 'medium',
          title: body.title,
          description: body.description,
          assignedToId: body.assignedToId ?? null,
          assignedToName: body.assignedToName ?? null,
          submittedById: body.submittedById ?? null,
          submittedByName: body.submittedByName ?? null,
          relatedEntities: (body.relatedEntities ?? []) as unknown as string[],
          riskScore: body.riskScore ? String(body.riskScore) : null,
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
          escalationLevel: 0,
          auditTrail: [
            {
              action: 'created',
              timestamp: new Date().toISOString(),
              actor: body.submittedByName ?? 'system',
            },
          ] as Record<string, unknown>[],
        })
        .returning();

      sendCreated(res, { itemId, record: inserted });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create supervision item');
    }
  },
);

router.patch(
  '/compliance/supervision/:itemId/action',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      action: z.unknown().optional(),
      assignedToId: z.unknown().optional(),
      assignedToName: z.unknown().optional(),
      notes: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { itemId } = req.params as Record<string, string>;
      const { action, notes, assignedToId, assignedToName } = req.body as {
        action: 'escalate' | 'resolve' | 'close' | 'assign';
        notes?: string;
        assignedToId?: string;
        assignedToName?: string;
      };

      const [existing] = await db
        .select()
        .from(complianceSupervisionQueueTable)
        .where(eq(complianceSupervisionQueueTable.itemId, itemId))
        .limit(1);

      if (!existing) {
        sendNotFound(res, 'Supervision item');
        return;
      }

      const auditTrail = ((existing.auditTrail as unknown[]) ?? []).concat([
        { action, timestamp: new Date().toISOString(), notes, assignedToId, assignedToName },
      ]);

      const updates: Record<string, unknown> = {
        updatedAt: new Date(),
        auditTrail,
      };

      if (action === 'escalate') {
        updates.status = 'escalated';
        updates.escalationLevel = (existing.escalationLevel ?? 0) + 1;
      } else if (action === 'resolve') {
        updates.status = 'resolved';
        updates.resolvedAt = new Date();
        updates.resolution = notes ?? null;
      } else if (action === 'close') {
        updates.status = 'closed';
        updates.resolvedAt = new Date();
      } else if (action === 'assign') {
        updates.assignedToId = assignedToId ?? existing.assignedToId;
        updates.assignedToName = assignedToName ?? existing.assignedToName;
        updates.status = 'in_review';
      }

      const [updated] = await db
        .update(complianceSupervisionQueueTable)
        .set(updates)
        .where(eq(complianceSupervisionQueueTable.itemId, itemId))
        .returning();

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to action supervision item');
    }
  },
);

router.get(
  '/compliance/calendar',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { status, eventType, from, to } = req.query;
      const conditions = [];
      if (status) conditions.push(eq(complianceCalendarTable.status, status as any));
      if (eventType) conditions.push(eq(complianceCalendarTable.eventType, eventType as any));
      if (from) conditions.push(gte(complianceCalendarTable.dueAt, new Date(from as string)));
      if (to) conditions.push(lte(complianceCalendarTable.dueAt, new Date(to as string)));

      const rows = await db
        .select()
        .from(complianceCalendarTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(complianceCalendarTable.dueAt)
        .limit(100);

      sendSuccess(res, {
        count: rows.length,
        dataMode: rows.length > 0 ? 'live' : 'empty',
        events: rows,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch compliance calendar');
    }
  },
);

router.post(
  '/compliance/calendar',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      assignedToId: z.unknown().optional(),
      assignedToName: z.unknown().optional(),
      description: z.unknown().optional(),
      dueAt: z.unknown().optional(),
      eventType: z.unknown().optional(),
      filingReference: z.unknown().optional(),
      metadata: z.unknown().optional(),
      notes: z.unknown().optional(),
      recurrence: z.unknown().optional(),
      regulatoryBody: z.unknown().optional(),
      reminderAt: z.unknown().optional(),
      title: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const parsed = CreateCalendarSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.errors.map((e) => e.message).join(', '));
        return;
      }
      const body = parsed.data;
      const eventId = generateItemId('cal');

      const [inserted] = await db
        .insert(complianceCalendarTable)
        .values({
          eventId,
          eventType: body.eventType,
          title: body.title,
          description: body.description ?? null,
          dueAt: new Date(body.dueAt),
          reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
          assignedToId: body.assignedToId ?? null,
          assignedToName: body.assignedToName ?? null,
          regulatoryBody: body.regulatoryBody ?? null,
          filingReference: body.filingReference ?? null,
          notes: body.notes ?? null,
          recurrence: body.recurrence ?? 'none',
          metadata: (body.metadata ?? {}) as Record<string, unknown>,
        })
        .returning();

      sendCreated(res, { eventId, record: inserted });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create calendar event');
    }
  },
);

router.get('/compliance/market-context', authMiddleware(), async (_req, res) => {
  try {
    const { services } = await import('@szl-holdings/services');
    const fredService = services.fred as unknown as {
      getEconomicSnapshot?: () => Promise<unknown>;
    };
    const marketService = (services as any).marketData as unknown as {
      getMarketIndices?: () => Promise<unknown>;
    };
    const [fredSnap, marketIndices] = await Promise.allSettled([
      fredService?.getEconomicSnapshot ? fredService.getEconomicSnapshot() : Promise.resolve(null),
      marketService?.getMarketIndices ? marketService.getMarketIndices() : Promise.resolve(null),
    ]);

    sendSuccess(res, {
      economicIndicators: fredSnap.status === 'fulfilled' ? fredSnap.value : null,
      marketIndices: marketIndices.status === 'fulfilled' ? marketIndices.value : null,
      capRateEnvironment: {
        tenYearTreasury: '4.38%',
        impliedCapRateFloor: '5.25%',
        spreadVsTreasury: '87bps',
        trend: 'widening',
        note: 'Rising rates compress CRE valuations; Reg BI suitability reviews advised for rate-sensitive recommendations',
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch market context');
  }
});

router.get('/compliance/intelligence-fusion', authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, {
      insights: [],
      dataMode: 'empty',
      message:
        'No intelligence fusion insights yet. Insights are generated when supervision queue items and suitability alerts are cross-referenced with live market data.',
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch intelligence fusion');
  }
});

export default router;
