import { bodyShape } from '@szl-holdings/contracts/common';
import { db } from '@szl-holdings/db';
import {
  pcChangeEventsTable,
  pcConnectorAccountsTable,
  pcDeadlinesTable,
  pcForecastsTable,
  pcIngestionJobsTable,
  pcMatterDeskSnapshotsTable,
  pcMattersTable,
  pcNextActionsTable,
  pcQuietRisksTable,
  pcReviewItemsTable,
  pcSignoffQueueTable,
  pcWordExportsTable,
} from '@szl-holdings/db/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';
import { pilotChangeTracker } from '../services/prism-pilot-change-tracker';
import { pilotExport } from '../services/prism-pilot-export';
import { pilotIngestion } from '../services/prism-pilot-ingestion';
import { pilotReview, pilotSignoff } from '../services/prism-pilot-review';

const router = Router();

router.use(authMiddleware());
router.use(tenantScope({ required: true }));

const ReviewStateSchema = z.object({
  state: z.string().min(1).max(100),
});

const SignoffResolveSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
});

const ExportCreateSchema = z.object({
  matterId: z.number().int().positive(),
  exportType: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  reviewItemId: z.number().int().positive().optional(),
});

const ReviewCreateSchema = z.object({
  matterId: z.number().int().positive(),
  reviewType: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  draftContent: z.string().max(50000).optional(),
  sourceSupport: z.unknown().optional(),
  unsupportedStatements: z.unknown().optional(),
  contradictionWarnings: z.unknown().optional(),
  privilegeWarnings: z.unknown().optional(),
});

const MarkReadSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(500),
});

const IngestEmailSchema = z.object({
  matterId: z.number().int().positive(),
  subject: z.string().min(1).max(500),
  from: z.string().min(1).max(500),
  body: z.string().max(100000),
  receivedAt: z.string().datetime(),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1).max(500),
        type: z.string().min(1).max(100),
        size: z.number().int().min(0),
      }),
    )
    .optional(),
});

const IngestFileSchema = z.object({
  matterId: z.number().int().positive(),
  fileName: z.string().min(1).max(500),
  fileType: z.string().min(1).max(100),
  filePath: z.string().min(1).max(1000),
  source: z.string().min(1).max(200),
});

function getOrgId(req: Request): number {
  const orgId = req.tenantOrgId ?? req.user?.orgs[0]?.orgId;
  if (!orgId) throw Object.assign(new Error('Organization context required'), { statusCode: 403 });
  return orgId;
}

router.get('/today', async (req: Request, res: Response) => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const fiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const tenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    const [
      recentChanges,
      matters,
      deadlines3,
      deadlines5,
      deadlines10,
      pendingSignoffs,
      pendingReviews,
      quietRisks,
      nextActions,
    ] = await Promise.all([
      db
        .select()
        .from(pcChangeEventsTable)
        .where(
          and(
            eq(pcChangeEventsTable.orgId, getOrgId(req)),
            gte(pcChangeEventsTable.createdAt, yesterday),
          ),
        )
        .orderBy(desc(pcChangeEventsTable.createdAt))
        .limit(50),
      db
        .select()
        .from(pcMattersTable)
        .where(
          and(eq(pcMattersTable.orgId, getOrgId(req)), eq(pcMattersTable.status, 'active' as any)),
        ),
      db
        .select()
        .from(pcDeadlinesTable)
        .where(
          and(
            eq((pcDeadlinesTable as any).orgId, getOrgId(req)),
            sql`${pcDeadlinesTable.dueDate} <= ${threeDays}`,
            sql`${pcDeadlinesTable.dueDate} >= NOW()`,
            eq(pcDeadlinesTable.status, 'active' as any),
          ),
        )
        .orderBy(pcDeadlinesTable.dueDate),
      db
        .select()
        .from(pcDeadlinesTable)
        .where(
          and(
            eq((pcDeadlinesTable as any).orgId, getOrgId(req)),
            sql`${pcDeadlinesTable.dueDate} <= ${fiveDays}`,
            sql`${pcDeadlinesTable.dueDate} >= NOW()`,
            eq(pcDeadlinesTable.status, 'active' as any),
          ),
        )
        .orderBy(pcDeadlinesTable.dueDate),
      db
        .select()
        .from(pcDeadlinesTable)
        .where(
          and(
            eq((pcDeadlinesTable as any).orgId, getOrgId(req)),
            sql`${pcDeadlinesTable.dueDate} <= ${tenDays}`,
            sql`${pcDeadlinesTable.dueDate} >= NOW()`,
            eq(pcDeadlinesTable.status, 'active' as any),
          ),
        )
        .orderBy(pcDeadlinesTable.dueDate),
      db
        .select()
        .from(pcSignoffQueueTable)
        .where(
          and(
            eq(pcSignoffQueueTable.orgId, getOrgId(req)),
            eq(pcSignoffQueueTable.status, 'pending'),
          ),
        ),
      db
        .select()
        .from(pcReviewItemsTable)
        .where(
          and(
            eq(pcReviewItemsTable.orgId, getOrgId(req)),
            eq(pcReviewItemsTable.reviewState, 'pending'),
          ),
        ),
      db
        .select()
        .from(pcQuietRisksTable)
        .where(
          and(eq(pcQuietRisksTable.orgId, getOrgId(req)), eq(pcQuietRisksTable.isResolved, false)),
        ),
      db
        .select()
        .from(pcNextActionsTable)
        .where(
          and(
            eq(pcNextActionsTable.orgId, getOrgId(req)),
            eq(pcNextActionsTable.status, 'suggested'),
          ),
        )
        .orderBy(desc(pcNextActionsTable.impactScore))
        .limit(5),
    ]);

    const changedMatterIds = [...new Set(recentChanges.map((c) => c.matterId))];
    const mattersNeedingAttention = changedMatterIds.map((mid) => {
      const m = matters.find((m) => m.id === mid);
      const changes = recentChanges.filter((c) => c.matterId === mid);
      return {
        matterId: mid,
        title: m?.title ?? `Matter #${mid}`,
        caseNumber: m?.caseNumber,
        changeCount: changes.length,
        changeTypes: [...new Set(changes.map((c) => c.changeType))],
        latestChange: changes[0]?.summary,
      };
    });

    res.json({
      asOf: new Date().toISOString(),
      changedSinceYesterday: recentChanges.length,
      mattersNeedingAttention,
      deadlines: {
        next3Days: deadlines3.map((d) => ({
          ...d,
          daysRemaining: Math.ceil((new Date(d.dueDate!).getTime() - Date.now()) / 86400000),
        })),
        next5Days: deadlines5.map((d) => ({
          ...d,
          daysRemaining: Math.ceil((new Date(d.dueDate!).getTime() - Date.now()) / 86400000),
        })),
        next10Days: deadlines10.map((d) => ({
          ...d,
          daysRemaining: Math.ceil((new Date(d.dueDate!).getTime() - Date.now()) / 86400000),
        })),
      },
      waitingOnYou: { signoffs: pendingSignoffs.length, reviews: pendingReviews.length },
      waitingOnOthers: quietRisks.filter((r) => r.riskType === 'no_carrier_response').length,
      quietRisks: quietRisks.map((r) => ({
        matterId: r.matterId,
        riskType: r.riskType,
        title: r.title,
        explanation: r.explanation,
        severity: r.severity,
        daysSilent: r.daysSilent,
      })),
      nextBest30Minutes: nextActions.map((a) => ({
        matterId: a.matterId,
        title: a.title,
        description: a.description,
        impactScore: a.impactScore,
        estimatedMinutes: a.estimatedMinutes,
        actionType: a.actionType,
      })),
      quickMoves: nextActions
        .filter((a) => (a.estimatedMinutes ?? 15) <= 10)
        .map((a) => ({
          matterId: a.matterId,
          title: a.title,
          estimatedMinutes: a.estimatedMinutes,
        })),
    });
  } catch (err: any) {
    logger.error({ err }, 'Error building Today view');
    res.status(500).json({ error: 'Failed to build Today view' });
  }
});

router.get('/today/brief', async (req: Request, res: Response) => {
  try {
    const brief = await pilotChangeTracker.getLatestBrief(getOrgId(req), req.user!.id);
    res.json({ brief });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch brief' });
  }
});

router.post(
  '/today/brief/generate',
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const brief = await pilotChangeTracker.generateMorningBrief(getOrgId(req), req.user!.id);
      res.json({ brief });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate brief' });
    }
  },
);

router.get('/today/quiet-risks', async (req: Request, res: Response) => {
  try {
    const risks = await pilotChangeTracker.getQuietRisks(getOrgId(req));
    res.json({ risks });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch quiet risks' });
  }
});

router.post(
  '/today/detect-risks',
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const newRisks = await pilotChangeTracker.detectQuietRisks(getOrgId(req));
      res.json({ detected: newRisks.length, risks: newRisks });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to detect risks' });
    }
  },
);

router.get(
  '/today/next-actions',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
      const actions = await pilotChangeTracker.getNextActions(getOrgId(req), matterId);
      res.json({ actions });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch next actions' });
    }
  },
);

router.post(
  '/today/next-actions/:id/complete',
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const result = await pilotChangeTracker.completeAction(
        getOrgId(req),
        parseInt(req.params.id as string),
      );
      res.json({ action: result[0] });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to complete action' });
    }
  },
);

router.get('/matter-desk/:id', async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.id as string);
    const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [matter, changes, deadlines, reviews, signoffs, forecasts, quietRisks, nextActions] =
      await Promise.all([
        db
          .select()
          .from(pcMattersTable)
          .where(and(eq(pcMattersTable.id, matterId), eq(pcMattersTable.orgId, getOrgId(req))))
          .limit(1),
        db
          .select()
          .from(pcChangeEventsTable)
          .where(
            and(
              eq(pcChangeEventsTable.matterId, matterId),
              eq(pcChangeEventsTable.orgId, getOrgId(req)),
            ),
          )
          .orderBy(desc(pcChangeEventsTable.createdAt))
          .limit(20),
        db
          .select()
          .from(pcDeadlinesTable)
          .where(
            and(
              eq((pcDeadlinesTable as any).orgId, getOrgId(req)),
              eq(pcDeadlinesTable.matterId, matterId),
              eq(pcDeadlinesTable.status, 'active' as any),
            ),
          )
          .orderBy(pcDeadlinesTable.dueDate)
          .limit(10),
        db
          .select()
          .from(pcReviewItemsTable)
          .where(
            and(
              eq(pcReviewItemsTable.matterId, matterId),
              eq(pcReviewItemsTable.orgId, getOrgId(req)),
            ),
          )
          .orderBy(desc(pcReviewItemsTable.createdAt))
          .limit(10),
        db
          .select()
          .from(pcSignoffQueueTable)
          .where(
            and(
              eq(pcSignoffQueueTable.matterId, matterId),
              eq(pcSignoffQueueTable.orgId, getOrgId(req)),
              eq(pcSignoffQueueTable.status, 'pending'),
            ),
          ),
        db
          .select()
          .from(pcForecastsTable)
          .where(eq(pcForecastsTable.matterId, matterId))
          .orderBy(desc(pcForecastsTable.createdAt))
          .limit(5),
        db
          .select()
          .from(pcQuietRisksTable)
          .where(
            and(
              eq(pcQuietRisksTable.orgId, getOrgId(req)),
              eq(pcQuietRisksTable.matterId, matterId),
              eq(pcQuietRisksTable.isResolved, false),
            ),
          ),
        db
          .select()
          .from(pcNextActionsTable)
          .where(
            and(
              eq(pcNextActionsTable.orgId, getOrgId(req)),
              eq(pcNextActionsTable.matterId, matterId),
              eq(pcNextActionsTable.status, 'suggested'),
            ),
          )
          .orderBy(desc(pcNextActionsTable.impactScore))
          .limit(5),
      ]);

    if (!matter.length) return void res.status(404).json({ error: 'Matter not found' });
    const m = matter[0];

    const newComms = changes.filter((c) => c.changeType === 'new_communication');
    const newFiles = changes.filter((c) => c.changeType === 'new_file');

    res.json({
      matter: {
        id: m.id,
        title: m.title,
        caseNumber: m.caseNumber,
        status: m.status,
        jurisdiction: m.jurisdiction,
        healthScore: m.healthScore,
      },
      lastChanges: changes.slice(0, 10).map((c) => ({
        type: c.changeType,
        title: c.title,
        summary: c.summary,
        severity: c.severity,
        createdAt: c.createdAt,
      })),
      commsSummary: { recent: newComms.length, latest: newComms[0]?.summary },
      newFiles: newFiles.map((f) => ({
        title: f.title,
        sourceType: f.sourceType,
        createdAt: f.createdAt,
      })),
      deadlineWatch: deadlines.map((d) => ({
        title: d.title,
        dueDate: d.dueDate,
        priority: d.priority,
        daysRemaining: d.dueDate
          ? Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000)
          : null,
      })),
      missingSupport: reviews
        .filter((r) => r.unsupportedStatements && (r.unsupportedStatements as any[]).length > 0)
        .map((r) => ({ reviewTitle: r.title, count: (r.unsupportedStatements as any[]).length })),
      forecastSummary: forecasts.map((f) => ({
        type: f.forecastType,
        confidence: f.confidence,
        explanation: f.explanation,
      })),
      nextBestAction: nextActions[0]
        ? {
            title: nextActions[0].title,
            description: nextActions[0].description,
            impactScore: nextActions[0].impactScore,
          }
        : null,
      signoffStatus: signoffs.length > 0 ? 'pending' : 'clear',
      pendingSignoffs: signoffs.length,
      quietRisks: quietRisks.map((r) => ({
        riskType: r.riskType,
        title: r.title,
        severity: r.severity,
      })),
    });
  } catch (err: any) {
    logger.error({ err }, 'Error building matter desk');
    res.status(500).json({ error: 'Failed to build matter desk' });
  }
});

router.get('/what-changed', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const hours = parseInt(req.query.hours as string) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const changes = await pilotChangeTracker.getChanges(getOrgId(req), matterId, {
      since,
      limit: 100,
    });

    const grouped: Record<string, any[]> = {};
    for (const c of changes) {
      const key = c.changeType;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        matterId: c.matterId,
        title: c.title,
        summary: c.summary,
        severity: c.severity,
        sourceType: c.sourceType,
        isRead: c.isRead,
        createdAt: c.createdAt,
        id: c.id,
      });
    }

    res.json({
      since: since.toISOString(),
      totalChanges: changes.length,
      byType: grouped,
      categories: [
        {
          key: 'new_communication',
          label: 'New Communications',
          icon: 'mail',
          count: grouped['new_communication']?.length ?? 0,
        },
        {
          key: 'new_file',
          label: 'New Files',
          icon: 'file',
          count: grouped['new_file']?.length ?? 0,
        },
        {
          key: 'deadline_updated',
          label: 'Updated Deadlines',
          icon: 'clock',
          count: grouped['deadline_updated']?.length ?? 0,
        },
        {
          key: 'forecast_shift',
          label: 'Forecast Shifts',
          icon: 'trending-up',
          count: grouped['forecast_shift']?.length ?? 0,
        },
        {
          key: 'pressure_change',
          label: 'Pressure Changes',
          icon: 'activity',
          count: grouped['pressure_change']?.length ?? 0,
        },
        {
          key: 'missing_evidence',
          label: 'New Missing Evidence',
          icon: 'alert-triangle',
          count: grouped['missing_evidence']?.length ?? 0,
        },
        {
          key: 'contradiction',
          label: 'New Contradictions',
          icon: 'alert-circle',
          count: grouped['contradiction']?.length ?? 0,
        },
        {
          key: 'signoff_approved',
          label: 'Sign-off Approved',
          icon: 'check-circle',
          count: grouped['signoff_approved']?.length ?? 0,
        },
        {
          key: 'signoff_rejected',
          label: 'Sign-off Rejected',
          icon: 'x-circle',
          count: grouped['signoff_rejected']?.length ?? 0,
        },
        {
          key: 'export_created',
          label: 'Exports Created',
          icon: 'download',
          count: grouped['export_created']?.length ?? 0,
        },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch changes' });
  }
});

router.post(
  '/what-changed/mark-read',
  validateBody(MarkReadSchema),
  async (req: Request, res: Response) => {
    try {
      const { ids } = req.body as z.infer<typeof MarkReadSchema>;
      await pilotChangeTracker.markRead(getOrgId(req), ids);
      res.json({ marked: ids.length });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to mark read' });
    }
  },
);

router.get('/reviews', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const state = req.query.state as string | undefined;
    const reviews = await pilotReview.getReviews(getOrgId(req), { matterId, state });
    res.json({ reviews });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const review = await pilotReview.getReview(getOrgId(req), parseInt(req.params.id as string));
    if (!review) return void res.status(404).json({ error: 'Review not found' });
    res.json({ review });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

router.post('/reviews', validateBody(ReviewCreateSchema), async (req: Request, res: Response) => {
  try {
    const review = await pilotReview.createReview(
      getOrgId(req),
      req.body as z.infer<typeof ReviewCreateSchema>,
    );
    res.json({ review });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

router.patch(
  '/reviews/:id/state',
  validateBody(ReviewStateSchema),
  async (req: Request, res: Response) => {
    try {
      const { state } = req.body as z.infer<typeof ReviewStateSchema>;
      const review = await pilotReview.updateReviewState(
        getOrgId(req),
        parseInt(req.params.id as string),
        state,
        req.user!.id,
      );
      res.json({ review });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update review state' });
    }
  },
);

router.post(
  '/reviews/:id/submit-signoff',
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const signoff = await pilotReview.submitForSignoff(
        getOrgId(req),
        parseInt(req.params.id as string),
        req.user!.id,
      );
      res.json({ signoff });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to submit for signoff' });
    }
  },
);

router.get('/signoffs', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const signoffs = await pilotSignoff.getAll(getOrgId(req), { status });
    res.json({ signoffs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch signoffs' });
  }
});

router.get('/signoffs/pending', async (req: Request, res: Response) => {
  try {
    const signoffs = await pilotSignoff.getPending(getOrgId(req));
    res.json({ signoffs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch pending signoffs' });
  }
});

router.post(
  '/signoffs/:id/resolve',
  validateBody(SignoffResolveSchema),
  async (req: Request, res: Response) => {
    try {
      const { decision } = req.body as z.infer<typeof SignoffResolveSchema>;
      const result = await pilotSignoff.resolve(
        getOrgId(req),
        parseInt(req.params.id as string),
        decision,
        req.user!.id,
      );
      res.json({ signoff: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to resolve signoff' });
    }
  },
);

router.get('/exports', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const matterId = req.query.matterId ? parseInt(req.query.matterId as string) : undefined;
    const exports = await pilotExport.getExports(getOrgId(req), { matterId });
    res.json({ exports });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch exports' });
  }
});

router.post('/exports', validateBody(ExportCreateSchema), async (req: Request, res: Response) => {
  try {
    const exp = await pilotExport.generateExport(getOrgId(req), {
      ...(req.body as z.infer<typeof ExportCreateSchema>),
      generatedBy: req.user!.id,
    });
    res.json({ export: exp });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate export' });
  }
});

router.get('/exports/:id', async (req: Request, res: Response) => {
  try {
    const exp = await pilotExport.getExport(getOrgId(req), parseInt(req.params.id as string));
    if (!exp) return void res.status(404).json({ error: 'Export not found' });
    await pilotExport.logAccess(getOrgId(req), exp.id, req.user!.id);
    res.json({ export: exp });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch export' });
  }
});

router.get('/exports/:id/content', async (req: Request, res: Response) => {
  try {
    const content = await pilotExport.buildDocxContent(
      getOrgId(req),
      parseInt(req.params.id as string),
    );
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to build export content' });
  }
});

router.post(
  '/ingest/email',
  validateBody(IngestEmailSchema),
  async (req: Request, res: Response) => {
    try {
      const job = await pilotIngestion.ingestEmail(
        getOrgId(req),
        req.body as z.infer<typeof IngestEmailSchema>,
      );
      res.json({ job });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to ingest email' });
    }
  },
);

router.post('/ingest/file', validateBody(IngestFileSchema), async (req: Request, res: Response) => {
  try {
    const job = await pilotIngestion.ingestFile(
      getOrgId(req),
      req.body as z.infer<typeof IngestFileSchema>,
    );
    res.json({ job });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to ingest file' });
  }
});

router.get(
  '/admin/jobs',
  requireRole('super_admin', 'admin'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const jobs = await pilotIngestion.getJobs(getOrgId(req), { status });
      const stats = await pilotIngestion.getJobStats(getOrgId(req));
      res.json({ jobs, stats });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  },
);

router.get(
  '/admin/connectors',
  requireRole('super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const connectors = await db
        .select()
        .from(pcConnectorAccountsTable)
        .where(eq(pcConnectorAccountsTable.orgId, getOrgId(req)));
      res.json({ connectors });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch connectors' });
    }
  },
);

router.get(
  '/admin/health',
  requireRole('super_admin', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const [connectors, jobStats, pendingReviews, pendingSignoffs, recentExports] =
        await Promise.all([
          db
            .select()
            .from(pcConnectorAccountsTable)
            .where(eq(pcConnectorAccountsTable.orgId, getOrgId(req))),
          pilotIngestion.getJobStats(getOrgId(req)),
          db
            .select()
            .from(pcReviewItemsTable)
            .where(
              and(
                eq(pcReviewItemsTable.orgId, getOrgId(req)),
                eq(pcReviewItemsTable.reviewState, 'pending'),
              ),
            ),
          db
            .select()
            .from(pcSignoffQueueTable)
            .where(
              and(
                eq(pcSignoffQueueTable.orgId, getOrgId(req)),
                eq(pcSignoffQueueTable.status, 'pending'),
              ),
            ),
          db
            .select()
            .from(pcWordExportsTable)
            .where(eq(pcWordExportsTable.orgId, getOrgId(req)))
            .orderBy(desc(pcWordExportsTable.createdAt))
            .limit(10),
        ]);

      res.json({
        connectors: connectors.map((c) => ({
          type: c.connectorType,
          status: c.status,
          lastSync: c.lastSyncAt,
        })),
        jobs: jobStats,
        reviewBacklog: pendingReviews.length,
        signoffBacklog: pendingSignoffs.length,
        recentExports: recentExports.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch admin health' });
    }
  },
);

router.get('/forecasts/:matterId', async (req: Request, res: Response) => {
  try {
    const matterId = parseInt(req.params.matterId as string);
    const [matter] = await db
      .select({ id: pcMattersTable.id })
      .from(pcMattersTable)
      .where(and(eq(pcMattersTable.id, matterId), eq(pcMattersTable.orgId, getOrgId(req))))
      .limit(1);
    if (!matter) return void res.status(404).json({ error: 'Matter not found' });
    const forecasts = await db
      .select()
      .from(pcForecastsTable)
      .where(eq(pcForecastsTable.matterId, matterId))
      .orderBy(desc(pcForecastsTable.createdAt));

    const pilotTypes = [
      'deadline_breach_risk',
      'demand_readiness',
      'communication_silence_risk',
      'chronology_integrity_risk',
      'ai_defensibility_score',
    ];
    const filtered = forecasts.filter((f) => pilotTypes.includes(f.forecastType));

    res.json({ forecasts: filtered });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch forecasts' });
  }
});

export const prismCounselPilotRouter = router;
