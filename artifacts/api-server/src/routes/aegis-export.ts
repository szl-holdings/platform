import { randomUUID } from 'crypto';
import { Router, type Request, type Response } from 'express';
import { and, desc, eq, inArray } from 'drizzle-orm';
import {
  db,
  documentLifecycleTable,
  documentAuditTrailTable,
} from '@szl-holdings/db';
import {
  handleRouteError,
  sendBadRequest,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';
import {
  renderReportToPdf,
  getTemplateForDomain,
  BRAND_THEMES,
  type ReportTemplate,
  type ReportBlock,
} from '../lib/report-engine';

const router = Router();

interface RenderJob {
  jobId: string;
  snapshotDocumentId: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  queuedAt: string;
  completedAt: string | null;
  error: string | null;
  outputUrl: string | null;
  outputSizeBytes: number | null;
  requestedBy: number;
  orgId: number;
}

const renderJobs = new Map<string, RenderJob>();

function buildAegisExportTemplate(
  frozenData: Record<string, unknown>,
): ReportTemplate {
  const baseTemplate = getTemplateForDomain('aegis', 'security_assessment');

  const metricsEntries = Object.entries(
    (frozenData.metrics as Record<string, string>) ?? {},
  );

  const metricBlocks: ReportBlock[] = [];
  if (metricsEntries.length > 0) {
    metricBlocks.push({
      id: 'frozen_metrics_header',
      type: 'section_header',
      data: { text: 'Frozen Metrics Snapshot' },
    });
    metricBlocks.push({
      id: 'frozen_metrics',
      type: 'metrics_row',
      data: {
        metrics: metricsEntries.map(([label, value]) => ({
          label,
          value: String(value),
        })),
      },
    });
  }

  const sectionsIncluded = (frozenData.sectionsIncluded as string[]) ?? [];
  const sectionBlocks: ReportBlock[] = [];
  if (sectionsIncluded.length > 0) {
    sectionBlocks.push({
      id: 'sections_header',
      type: 'section_header',
      data: { text: 'Report Sections Included' },
    });
    sectionBlocks.push({
      id: 'sections_list',
      type: 'bullet_list',
      data: {
        items: sectionsIncluded.map(
          (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '),
        ),
        color: BRAND_THEMES.aegis.primary,
      },
    });
  }

  if (baseTemplate) {
    return {
      ...baseTemplate,
      blocks: [
        ...baseTemplate.blocks.slice(0, 2),
        ...metricBlocks,
        ...sectionBlocks,
        ...baseTemplate.blocks.slice(2),
      ],
    };
  }

  return {
    name: 'Aegis — Export Snapshot Report',
    domain: 'aegis',
    reportType: 'export_snapshot',
    brandTheme: 'aegis',
    blocks: [
      {
        id: 'cover',
        type: 'cover',
        data: {
          title: 'Cyber Resilience Export',
          subtitle: `Aegis — Unified Defense & Intelligence Command  |  Frozen Snapshot`,
          classification: 'CONFIDENTIAL — RESTRICTED DISTRIBUTION',
        },
      },
      {
        id: 'exec',
        type: 'executive_summary',
        data: {
          text: `This document represents a frozen point-in-time snapshot of the Aegis security posture. All metrics were immutably captured at export time to ensure audit integrity.`,
        },
      },
      ...metricBlocks,
      ...sectionBlocks,
      {
        id: 'classification',
        type: 'body_text',
        data: {
          text: 'This report is CONFIDENTIAL and intended solely for authorized personnel. Contents describe the security posture and must be handled accordingly.',
        },
      },
      {
        id: 'sig',
        type: 'signature_block',
        data: { name: 'Aegis', title: 'Unified Defense & Intelligence Command' },
      },
    ],
  };
}

async function executeRenderJob(job: RenderJob): Promise<void> {
  try {
    job.status = 'rendering';
    logger.info({ jobId: job.jobId }, 'PDF render started');

    const conditions = [eq(documentLifecycleTable.documentId, job.snapshotDocumentId)];
    const [snapshot] = await db
      .select()
      .from(documentLifecycleTable)
      .where(and(...conditions))
      .limit(1);

    if (!snapshot) {
      job.status = 'failed';
      job.error = 'Snapshot not found in database';
      job.completedAt = new Date().toISOString();
      return;
    }

    const frozenData = (snapshot.frozenMetrics ?? {}) as Record<string, unknown>;
    const template = buildAegisExportTemplate(frozenData);

    const pdfBuffer = await renderReportToPdf({
      template,
      data: {
        ...frozenData,
        assessmentType: 'Export Snapshot',
        targetEnvironment: 'Production',
        scope: 'Full Platform',
        status: 'Frozen',
        date: snapshot.createdAt?.toISOString?.() ?? new Date().toISOString(),
        frozenAt: snapshot.createdAt?.toISOString?.() ?? new Date().toISOString(),
      },
    });

    const outputPath = `aegis-exports/${job.jobId}.pdf`;

    let outputUrl: string;
    try {
      const { ObjectStorageService } = await import('../lib/objectStorage');
      const storage = new ObjectStorageService();
      outputUrl = await storage.uploadBuffer(pdfBuffer, outputPath, 'application/pdf');
    } catch {
      outputUrl = `/api/aegis-export/download/${job.jobId}`;
      (job as RenderJob & { _pdfBuffer?: Buffer })._pdfBuffer = pdfBuffer;
      logger.debug({ jobId: job.jobId }, 'Object storage unavailable, serving PDF from memory');
    }

    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    job.outputUrl = outputUrl;
    job.outputSizeBytes = pdfBuffer.length;

    logger.info(
      { jobId: job.jobId, sizeBytes: pdfBuffer.length, outputUrl },
      'PDF render completed',
    );
  } catch (err) {
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : 'Unknown render error';
    job.completedAt = new Date().toISOString();
    logger.error({ jobId: job.jobId, err }, 'PDF render failed');
  }
}

router.use(authMiddleware());

router.post('/freeze', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = user.orgs[0]?.orgId;
    if (!orgId) {
      sendBadRequest(res, 'User must belong to an organization');
      return;
    }

    const { format, sectionsIncluded, metrics } = req.body;
    if (!format || !sectionsIncluded || !metrics) {
      sendBadRequest(res, 'format, sectionsIncluded, and metrics are required');
      return;
    }

    const snapshotId = `SNAP-${randomUUID().slice(0, 8).toUpperCase()}`;

    const [inserted] = await db.insert(documentLifecycleTable).values({
      documentId: snapshotId,
      orgId,
      title: `Aegis Export Snapshot — ${format}`,
      documentType: 'report',
      lifecycleState: 'archive',
      domain: 'security',
      version: 1,
      signatureStatus: 'none',
      frozenMetrics: { format, sectionsIncluded, metrics },
      createdById: user.id,
    }).returning();

    await db.insert(documentAuditTrailTable).values({
      documentId: snapshotId,
      fromState: null,
      toState: 'archive',
      performedById: user.id,
      performedByName: user.displayName,
      roleUsed: user.roles[0] ?? 'analyst',
      reason: 'Metrics frozen for PDF export',
      orgId,
    });

    logger.info(
      { snapshotId, format, sections: sectionsIncluded.length, userId: user.id },
      'Export snapshot frozen',
    );

    sendSuccess(res, {
      snapshotId: inserted.documentId,
      frozenAt: inserted.createdAt,
      frozenBy: { userId: user.id, displayName: user.displayName },
      format,
      sectionsIncluded,
      metrics,
      orgId,
    }, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to freeze export snapshot');
  }
});

router.get('/snapshots', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    const conditions = [
      eq(documentLifecycleTable.domain, 'security'),
      eq(documentLifecycleTable.documentType, 'report'),
      eq(documentLifecycleTable.lifecycleState, 'archive'),
    ];
    if (orgIds !== null) {
      conditions.push(inArray(documentLifecycleTable.orgId, [...orgIds]));
    }

    const snapshots = await db
      .select()
      .from(documentLifecycleTable)
      .where(and(...conditions))
      .orderBy(desc(documentLifecycleTable.createdAt))
      .limit(100);

    const formatted = snapshots.map((s) => {
      const fm = (s.frozenMetrics ?? {}) as Record<string, unknown>;
      return {
        snapshotId: s.documentId,
        frozenAt: s.createdAt,
        title: s.title,
        format: fm.format ?? 'unknown',
        sectionsIncluded: fm.sectionsIncluded ?? [],
        metrics: fm.metrics ?? {},
        orgId: s.orgId,
      };
    });

    sendSuccess(res, { snapshots: formatted, total: formatted.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list export snapshots');
  }
});

router.get('/snapshots/:id', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    const conditions = [eq(documentLifecycleTable.documentId, req.params.id)];
    if (orgIds !== null) {
      conditions.push(inArray(documentLifecycleTable.orgId, [...orgIds]));
    }

    const [snapshot] = await db
      .select()
      .from(documentLifecycleTable)
      .where(and(...conditions))
      .limit(1);

    if (!snapshot) {
      sendNotFound(res, 'Export snapshot');
      return;
    }

    const fm = (snapshot.frozenMetrics ?? {}) as Record<string, unknown>;
    sendSuccess(res, {
      snapshotId: snapshot.documentId,
      frozenAt: snapshot.createdAt,
      title: snapshot.title,
      format: fm.format ?? 'unknown',
      sectionsIncluded: fm.sectionsIncluded ?? [],
      metrics: fm.metrics ?? {},
      orgId: snapshot.orgId,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get export snapshot');
  }
});

router.post('/render-pdf', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { snapshotId } = req.body;

    if (!snapshotId || typeof snapshotId !== 'string') {
      sendBadRequest(res, 'snapshotId is required');
      return;
    }

    const orgIds = getUserOrgIds(user);
    const conditions = [eq(documentLifecycleTable.documentId, snapshotId)];
    if (orgIds !== null) {
      conditions.push(inArray(documentLifecycleTable.orgId, [...orgIds]));
    }

    const [snapshot] = await db
      .select()
      .from(documentLifecycleTable)
      .where(and(...conditions))
      .limit(1);

    if (!snapshot) {
      sendNotFound(res, 'Export snapshot');
      return;
    }

    const jobId = `PDF-${randomUUID().slice(0, 8).toUpperCase()}`;
    const job: RenderJob = {
      jobId,
      snapshotDocumentId: snapshotId,
      status: 'queued',
      queuedAt: new Date().toISOString(),
      completedAt: null,
      error: null,
      outputUrl: null,
      outputSizeBytes: null,
      requestedBy: user.id,
      orgId: snapshot.orgId,
    };

    renderJobs.set(jobId, job);

    await db.insert(documentAuditTrailTable).values({
      documentId: snapshotId,
      fromState: 'archive',
      toState: 'archive',
      performedById: user.id,
      performedByName: user.displayName,
      roleUsed: user.roles[0] ?? 'analyst',
      reason: `PDF render queued — job ${jobId}`,
      orgId: snapshot.orgId,
    });

    executeRenderJob(job).catch((err) => {
      logger.error({ jobId, err }, 'Unhandled PDF render error');
    });

    logger.info(
      { jobId, snapshotId, userId: user.id },
      'PDF render job queued',
    );

    sendSuccess(res, {
      jobId,
      snapshotId,
      status: 'queued',
    }, 202);
  } catch (err) {
    handleRouteError(res, err, 'Failed to queue PDF render');
  }
});

router.get('/render-status/:jobId', async (req: Request, res: Response) => {
  try {
    const job = renderJobs.get(req.params.jobId);
    if (!job) {
      sendNotFound(res, 'Render job');
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && !orgIds.has(job.orgId)) {
      sendNotFound(res, 'Render job');
      return;
    }

    sendSuccess(res, {
      jobId: job.jobId,
      snapshotId: job.snapshotDocumentId,
      status: job.status,
      queuedAt: job.queuedAt,
      completedAt: job.completedAt,
      error: job.error,
      outputUrl: job.outputUrl,
      outputSizeBytes: job.outputSizeBytes,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get render status');
  }
});

router.get('/download/:jobId', async (req: Request, res: Response) => {
  try {
    const job = renderJobs.get(req.params.jobId) as (RenderJob & { _pdfBuffer?: Buffer }) | undefined;
    if (!job) {
      sendNotFound(res, 'Render job');
      return;
    }

    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && !orgIds.has(job.orgId)) {
      sendNotFound(res, 'Render job');
      return;
    }

    if (job.status !== 'completed') {
      sendBadRequest(res, `Render job is ${job.status}, not yet completed`);
      return;
    }

    if (!job._pdfBuffer) {
      sendNotFound(res, 'PDF file (may have been served from object storage)');
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="aegis-export-${job.snapshotDocumentId}.pdf"`);
    res.setHeader('Content-Length', job._pdfBuffer.length);
    res.end(job._pdfBuffer);
  } catch (err) {
    handleRouteError(res, err, 'Failed to download PDF');
  }
});

export default router;
