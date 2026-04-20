/**
 * Reports API — Industrial Report Generation & Document Intelligence Pipeline
 * Endpoints for templates, generation, approval workflow, distribution, scheduling, and AI narratives.
 */

import { bodyShape } from '@szl-holdings/contracts/common';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { buildScheduledReportEmail, sendEmail } from '../lib/email';
import { logger } from '../lib/logger';
import { ObjectStorageService } from '../lib/objectStorage';
import type { BrandTheme, ReportBlock, ReportTemplate } from '../lib/report-engine';
import {
  BRAND_THEMES,
  DOMAIN_TEMPLATES,
  listAvailableTemplates,
  renderReportToPdf,
} from '../lib/report-engine';
import { generateReportNarrative } from '../lib/report-narrative';
import {
  createApprovalRequest,
  createDistribution,
  createReportGeneration,
  createReportSchedule,
  createReportTemplate,
  getApprovalForReport,
  getReportGeneration,
  getReportPdfBuffer,
  getReportScheduleById,
  getReportStats,
  getReportTemplate,
  getReportVersionHistory,
  getSchedulesDue,
  listDistributionsForReport,
  listReportGenerations,
  listReportSchedules,
  listReportTemplates,
  markDistributionFailed,
  markDistributionSent,
  markReportDistributed,
  markScheduleRun,
  reviewApproval,
  updateReportSchedule,
  updateReportStatus,
  updateReportTemplate,
} from '../lib/report-store';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

interface AuthUser {
  id: number;
  role: string;
  email?: string;
  displayName?: string;
}
type ExtendedRequest = Request & { user?: AuthUser };

function getUserId(req: Request): number | null {
  return (req as ExtendedRequest).user?.id ?? null;
}

function buildReportDownloadUrl(reportId: string): string {
  const base =
    process.env.APP_BASE_URL ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/api` : null) ||
    'https://szlholdings.com/api';
  return `${base}/reports/${reportId}/pdf`;
}

/**
 * Upload the rendered PDF for a scheduled report into private object
 * storage and return a time-limited presigned download URL the recipient
 * can open without authenticating to the platform.
 *
 * Returns null when object storage is not configured (PRIVATE_OBJECT_DIR
 * unset) — callers should fall back to the auth-protected download URL.
 */
async function uploadReportAndGetPresignedUrl(
  reportId: string,
  pdfBuffer: Buffer,
): Promise<string | null> {
  if (!process.env.PRIVATE_OBJECT_DIR) return null;
  try {
    const storage = new ObjectStorageService();
    const subPath = `reports/scheduled/${reportId}.pdf`;
    await storage.uploadBuffer(pdfBuffer, subPath, 'application/pdf');
    return await storage.getPresignedDownloadUrl(subPath, 7 * 24 * 3600);
  } catch (err) {
    logger.warn({ reportId, err }, 'Failed to upload report for presigned download URL');
    return null;
  }
}

async function sendReportEmails(params: {
  reportId: string;
  reportTitle: string;
  scheduleName: string;
  domain: string;
  frequency: string;
  generatedAt: Date;
  recipientEmails: string[];
  distributedByUserId?: number | null;
  /** When provided, the PDF is attached to each email. */
  pdfBuffer?: Buffer | null;
  /**
   * Override the download URL embedded in the email body. Used by the
   * "download" delivery method to surface a presigned object-storage URL
   * instead of the auth-protected /reports/:id/pdf endpoint.
   */
  downloadUrlOverride?: string;
  /** Distribution channel recorded in the report distribution table. */
  channel?: 'email' | 'download';
  /** Selects the body copy used by buildScheduledReportEmail. */
  linkMode?: 'auth' | 'presigned' | 'attachment';
}): Promise<{ sent: number; failed: number }> {
  const downloadUrl = params.downloadUrlOverride ?? buildReportDownloadUrl(params.reportId);
  const channel = params.channel ?? 'email';
  const linkMode: 'auth' | 'presigned' | 'attachment' =
    params.linkMode ?? (params.pdfBuffer ? 'attachment' : 'auth');
  const generatedAtStr = params.generatedAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const attachments = params.pdfBuffer
    ? [
        {
          filename: `${params.reportTitle.replace(/[^a-z0-9-_ ]/gi, '_').slice(0, 80)}.pdf`,
          content: params.pdfBuffer,
          contentType: 'application/pdf',
        },
      ]
    : undefined;

  let sent = 0;
  let failed = 0;

  for (const email of params.recipientEmails) {
    const distributionId = await createDistribution({
      reportId: params.reportId,
      recipientEmail: email,
      channel,
      distributedByUserId: params.distributedByUserId ?? null,
    });

    const { subject, html, text } = buildScheduledReportEmail({
      reportId: params.reportId,
      reportTitle: params.reportTitle,
      scheduleName: params.scheduleName,
      domain: params.domain,
      frequency: params.frequency,
      generatedAt: generatedAtStr,
      downloadUrl,
      linkMode,
    });

    const result = await sendEmail({ to: email, subject, html, text, attachments });

    if (result.success) {
      await markDistributionSent(distributionId);
      sent++;
      logger.info(
        {
          reportId: params.reportId,
          email,
          channel,
          attached: !!attachments,
          messageId: result.messageId,
          provider: result.provider,
        },
        'Report email sent',
      );
    } else {
      await markDistributionFailed(distributionId, result.error ?? 'Email delivery failed');
      failed++;
      logger.warn(
        { reportId: params.reportId, email, channel, error: result.error },
        'Report email delivery failed',
      );
    }
  }

  return { sent, failed };
}

const router: IRouter = Router();

// ─── Template Routes ──────────────────────────────────────────────────────────

router.get('/reports/templates/built-in', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const templates = listAvailableTemplates();
    sendSuccess(res, templates);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list built-in templates');
  }
});

router.get(
  '/reports/templates/built-in/:key',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params as { key: string };
      const template = DOMAIN_TEMPLATES[key];
      if (!template) {
        return sendError(res, 'Built-in template not found', 404);
      }
      sendSuccess(res, template);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get built-in template');
    }
  },
);

router.get(
  '/reports/templates',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const domain = req.query['domain'] as string | undefined;
      const isActive =
        req.query['isActive'] !== undefined ? req.query['isActive'] !== 'false' : undefined;
      const limit = Math.min(parseInt((req.query['limit'] as string) ?? '50', 10), 200);
      const offset = parseInt((req.query['offset'] as string) ?? '0', 10);

      const result = await listReportTemplates({ domain, isActive, limit, offset });
      sendSuccess(res, result.templates, 200, { total: result.total, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list report templates');
    }
  },
);

router.post(
  '/reports/templates',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(
    bodyShape({
      blocks: z.unknown().optional(),
      brandTheme: z.unknown().optional(),
      dataRequirements: z.unknown().optional(),
      description: z.unknown().optional(),
      domain: z.unknown().optional(),
      isSchedulable: z.unknown().optional(),
      name: z.unknown().optional(),
      reportType: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        domain,
        reportType,
        brandTheme,
        blocks,
        dataRequirements,
        isSchedulable,
      } = req.body as {
        name: string;
        description?: string;
        domain: string;
        reportType: string;
        brandTheme: BrandTheme;
        blocks: ReportBlock[];
        dataRequirements?: string[];
        isSchedulable?: boolean;
      };

      if (!name || !domain || !reportType || !blocks) {
        return sendBadRequest(res, 'name, domain, reportType, and blocks are required');
      }

      const templateId = await createReportTemplate({
        name,
        description,
        domain,
        reportType,
        brandTheme: brandTheme || 'szl',
        blocks,
        dataRequirements,
        isSchedulable,
        createdByUserId: getUserId(req),
      });

      sendSuccess(res, { templateId }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create report template');
    }
  },
);

router.get(
  '/reports/templates/:templateId',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params as { templateId: string };
      const template = await getReportTemplate(templateId);
      if (!template) return sendError(res, 'Template not found', 404);
      sendSuccess(res, template);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get template');
    }
  },
);

router.patch(
  '/reports/templates/:templateId',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(
    bodyShape({
      blocks: z.unknown().optional(),
      description: z.unknown().optional(),
      isActive: z.unknown().optional(),
      isSchedulable: z.unknown().optional(),
      name: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params as { templateId: string };
      const { name, description, blocks, isActive, isSchedulable } = req.body as {
        name?: string;
        description?: string;
        blocks?: ReportBlock[];
        isActive?: boolean;
        isSchedulable?: boolean;
      };

      const existing = await getReportTemplate(templateId);
      if (!existing) return sendError(res, 'Template not found', 404);

      await updateReportTemplate(templateId, {
        name,
        description,
        blocks,
        isActive,
        isSchedulable,
      });
      sendSuccess(res, { templateId, updated: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update template');
    }
  },
);

// ─── Report Generation ────────────────────────────────────────────────────────

router.post(
  '/reports/generate',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const {
        templateKey,
        templateId,
        title,
        domain,
        reportType,
        brandTheme,
        data = {},
        generateNarrative = true,
        narrativeSections,
        narrativeTone,
        returnPdf = false,
      } = req.body as {
        templateKey?: string;
        templateId?: string;
        title: string;
        domain: string;
        reportType: string;
        brandTheme?: BrandTheme;
        data?: Record<string, unknown>;
        generateNarrative?: boolean;
        narrativeSections?: Array<
          'executive_summary' | 'trend_analysis' | 'recommendations' | 'risk_factors' | 'outlook'
        >;
        narrativeTone?: 'executive' | 'technical' | 'investor' | 'advisory';
        returnPdf?: boolean;
      };

      if (!title || !domain || !reportType) {
        return sendBadRequest(res, 'title, domain, and reportType are required');
      }

      const startTime = Date.now();

      let template: ReportTemplate | null = null;

      if (templateKey && DOMAIN_TEMPLATES[templateKey]) {
        template = DOMAIN_TEMPLATES[templateKey];
      } else if (templateId) {
        const dbTemplate = await getReportTemplate(templateId);
        if (!dbTemplate) return sendError(res, 'Template not found', 404);
        template = {
          id: dbTemplate.templateId,
          name: dbTemplate.name,
          domain: dbTemplate.domain,
          reportType: dbTemplate.reportType,
          brandTheme: (dbTemplate.brandTheme as BrandTheme) || 'szl',
          blocks: (dbTemplate.blocks as ReportBlock[]) || [],
          dataRequirements: (dbTemplate.dataRequirements as string[]) || [],
        };
      }

      if (!template) {
        const builtInKey = `${domain}_${reportType}`;
        template = DOMAIN_TEMPLATES[builtInKey] || {
          name: title,
          domain,
          reportType,
          brandTheme: (brandTheme as BrandTheme) || 'szl',
          blocks: [
            { id: 'cover', type: 'cover', data: { title, subtitle: `${domain} — ${reportType}` } },
            { id: 'exec', type: 'executive_summary', data: { text: '{{_executiveSummary}}' } },
            { id: 'body', type: 'body_text', data: { text: '{{_trendAnalysis}}' } },
          ],
        };
      }

      if (brandTheme && brandTheme !== template.brandTheme) {
        template = { ...template, brandTheme };
      }

      let aiNarrative: Awaited<ReturnType<typeof generateReportNarrative>> | null = null;
      if (generateNarrative) {
        try {
          aiNarrative = await generateReportNarrative({
            domain: domain as
              | 'szl_holdings'
              | 'carlota_jo'
              | 'aegis'
              | 'terra'
              | 'vessels'
              | 'lyte'
              | 'prism'
              | 'general',
            reportType,
            data,
            tone: narrativeTone || 'executive',
            sections: narrativeSections || [
              'executive_summary',
              'trend_analysis',
              'recommendations',
              'outlook',
            ],
          });
        } catch (narrativeErr) {
          logger.warn({ err: narrativeErr }, 'Narrative generation failed, continuing without');
        }
      }

      const pdfBuffer = await renderReportToPdf({
        template,
        data,
        narrativeSections: aiNarrative || undefined,
        entityName: template.name,
      });

      const durationMs = Date.now() - startTime;

      const reportId = await createReportGeneration({
        templateId: template.id || templateId,
        title,
        domain,
        reportType,
        brandTheme: template.brandTheme,
        dataSnapshot: data,
        narrativeSections: aiNarrative,
        pdfBuffer,
        generationDurationMs: durationMs,
        generatedByUserId: getUserId(req),
      });

      if (returnPdf) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${reportId}.pdf"`);
        res.setHeader('X-Report-Id', reportId);
        res.setHeader('X-Generation-Ms', String(durationMs));
        res.send(pdfBuffer);
        return;
      }

      sendSuccess(
        res,
        {
          reportId,
          title,
          domain,
          reportType,
          status: 'draft',
          pdfSizeBytes: pdfBuffer.length,
          generationDurationMs: durationMs,
          hasNarrative: !!aiNarrative,
          narrativeModel: aiNarrative?.model,
        },
        201,
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate report');
    }
  },
);

router.get(
  '/reports',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const domain = req.query['domain'] as string | undefined;
      const status = req.query['status'] as string | undefined;
      const templateId = req.query['templateId'] as string | undefined;
      const search = req.query['search'] as string | undefined;
      const dateFrom = req.query['dateFrom']
        ? new Date(req.query['dateFrom'] as string)
        : undefined;
      const dateTo = req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined;
      const limit = Math.min(parseInt((req.query['limit'] as string) ?? '50', 10), 200);
      const offset = parseInt((req.query['offset'] as string) ?? '0', 10);

      const result = await listReportGenerations({
        domain,
        status,
        templateId,
        search,
        dateFrom,
        dateTo,
        limit,
        offset,
      });
      sendSuccess(res, result.reports, 200, { total: result.total, limit, offset });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list reports');
    }
  },
);

router.get('/reports/stats', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const stats = await getReportStats();
    sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get report stats');
  }
});

router.get('/reports/:reportId', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params as { reportId: string };
    const report = await getReportGeneration(reportId);
    if (!report) return sendError(res, 'Report not found', 404);
    const { pdfBuffer: _, ...reportWithoutPdf } = report;
    sendSuccess(res, reportWithoutPdf);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get report');
  }
});

router.get('/reports/:reportId/pdf', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params as { reportId: string };
    const report = await getReportGeneration(reportId);
    if (!report) return sendError(res, 'Report not found', 404);

    const pdfBuffer = await getReportPdfBuffer(reportId);
    if (!pdfBuffer) {
      return sendError(res, 'PDF not available for this report', 404);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportId}.pdf"`);
    res.setHeader('Content-Length', String(pdfBuffer.length));
    res.setHeader('X-Report-Id', reportId);
    res.send(pdfBuffer);
  } catch (err) {
    handleRouteError(res, err, 'Failed to download report PDF');
  }
});

router.get('/reports/:reportId/versions', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params as { reportId: string };
    const versions = await getReportVersionHistory(reportId);
    sendSuccess(res, versions);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get report version history');
  }
});

router.patch(
  '/reports/:reportId/status',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateBody(
    bodyShape({
      notes: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params as { reportId: string };
      const { status, notes } = req.body as {
        status: 'draft' | 'review' | 'approved' | 'distributed' | 'archived';
        notes?: string;
      };

      const valid = ['draft', 'review', 'approved', 'distributed', 'archived'];
      if (!valid.includes(status))
        return sendBadRequest(res, `Invalid status — must be one of: ${valid.join(', ')}`);

      const report = await getReportGeneration(reportId);
      if (!report) return sendError(res, 'Report not found', 404);

      await updateReportStatus(reportId, status, notes);
      sendSuccess(res, { reportId, status, updated: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update report status');
    }
  },
);

// ─── Approval Workflow ────────────────────────────────────────────────────────

router.post(
  '/reports/:reportId/request-approval',
  authMiddleware(),
  validateBody(
    bodyShape({
      reviewerUserId: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params as { reportId: string };
      const { reviewerUserId } = req.body as { reviewerUserId?: number };

      const report = await getReportGeneration(reportId);
      if (!report) return sendError(res, 'Report not found', 404);
      if (report.status !== 'draft')
        return sendBadRequest(res, 'Only draft reports can be submitted for approval');

      const approvalId = await createApprovalRequest({
        reportId,
        requestedByUserId: getUserId(req),
        reviewerUserId,
      });

      sendSuccess(res, { approvalId, reportId, status: 'review' }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to request approval');
    }
  },
);

router.post(
  '/reports/:reportId/review',
  authMiddleware(),
  requireRole('admin', 'compliance'),
  validateBody(
    bodyShape({
      annotations: z.unknown().optional(),
      comment: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params as { reportId: string };
      const { status, comment, annotations } = req.body as {
        status: 'approved' | 'rejected' | 'revision_requested';
        comment?: string;
        annotations?: unknown[];
      };

      const validStatuses = ['approved', 'rejected', 'revision_requested'];
      if (!validStatuses.includes(status))
        return sendBadRequest(res, `Invalid review status — must be: ${validStatuses.join(', ')}`);

      const approval = await getApprovalForReport(reportId);
      if (!approval) return sendError(res, 'No pending approval found for this report', 404);
      if (approval.status !== 'pending')
        return sendBadRequest(res, 'Approval is not in pending state');

      await reviewApproval(approval.approvalId, { status, comment, annotations });
      sendSuccess(res, { approvalId: approval.approvalId, reportId, reviewStatus: status });
    } catch (err) {
      handleRouteError(res, err, 'Failed to review report');
    }
  },
);

router.get('/reports/:reportId/approval', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params as { reportId: string };
    const approval = await getApprovalForReport(reportId);
    if (!approval) return sendError(res, 'No approval found', 404);
    sendSuccess(res, approval);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get approval');
  }
});

// ─── Distribution ─────────────────────────────────────────────────────────────

router.post(
  '/reports/:reportId/distribute',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateBody(
    bodyShape({
      channel: z.unknown().optional(),
      recipients: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params as { reportId: string };
      const { recipients, channel = 'email' } = req.body as {
        recipients: Array<{ email: string; name?: string }>;
        channel?: 'email' | 'webhook' | 'dashboard' | 'download';
      };

      const report = await getReportGeneration(reportId);
      if (!report) return sendError(res, 'Report not found', 404);
      if (report.status !== 'approved')
        return sendBadRequest(res, 'Only approved reports can be distributed');
      if (!recipients || recipients.length === 0)
        return sendBadRequest(res, 'At least one recipient is required');

      const distributionIds: string[] = [];

      for (const recipient of recipients) {
        const distributionId = await createDistribution({
          reportId,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          channel: channel as 'email' | 'webhook' | 'dashboard' | 'download',
          distributedByUserId: getUserId(req),
        });
        await markDistributionSent(distributionId);
        distributionIds.push(distributionId);
      }

      await markReportDistributed(reportId);

      sendSuccess(res, {
        reportId,
        distributionIds,
        recipientCount: recipients.length,
        status: 'distributed',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to distribute report');
    }
  },
);

router.get(
  '/reports/:reportId/distributions',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params as { reportId: string };
      const distributions = await listDistributionsForReport(reportId);
      sendSuccess(res, distributions);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list distributions');
    }
  },
);

// ─── AI Narrative ─────────────────────────────────────────────────────────────

router.post(
  '/reports/narrative',
  authMiddleware(),
  validateBody(
    bodyShape({
      data: z.unknown().optional(),
      domain: z.unknown().optional(),
      reportType: z.unknown().optional(),
      sections: z.unknown().optional(),
      tone: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { domain, reportType, data, tone, sections } = req.body as {
        domain: string;
        reportType: string;
        data: Record<string, unknown>;
        tone?: 'executive' | 'technical' | 'investor' | 'advisory';
        sections?: Array<
          'executive_summary' | 'trend_analysis' | 'recommendations' | 'risk_factors' | 'outlook'
        >;
      };

      if (!domain || !reportType || !data) {
        return sendBadRequest(res, 'domain, reportType, and data are required');
      }

      const narrative = await generateReportNarrative({
        domain: domain as
          | 'szl_holdings'
          | 'carlota_jo'
          | 'aegis'
          | 'terra'
          | 'vessels'
          | 'lyte'
          | 'prism'
          | 'general',
        reportType,
        data,
        tone: tone || 'executive',
        sections,
      });

      sendSuccess(res, narrative);
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate narrative');
    }
  },
);

// ─── Schedules ────────────────────────────────────────────────────────────────

router.get(
  '/reports/schedules',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const domain = req.query['domain'] as string | undefined;
      // "all" or omitted → no filter; "true"/"false" → filter by isActive flag
      const isActiveParam = req.query['isActive'] as string | undefined;
      const isActive =
        isActiveParam === undefined || isActiveParam === 'all'
          ? undefined
          : isActiveParam !== 'false';
      const schedules = await listReportSchedules({ domain, isActive });
      sendSuccess(res, schedules);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list schedules');
    }
  },
);

router.post(
  '/reports/schedules',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(
    bodyShape({
      autoApprove: z.unknown().optional(),
      dataConfig: z.unknown().optional(),
      domain: z.unknown().optional(),
      frequency: z.unknown().optional(),
      name: z.unknown().optional(),
      recipientEmails: z.unknown().optional(),
      templateId: z.unknown().optional(),
      templateKey: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        templateId,
        templateKey,
        domain,
        frequency,
        dataConfig,
        recipientEmails,
        autoApprove,
      } = req.body as {
        name: string;
        templateId?: string;
        templateKey?: string;
        domain: string;
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
        dataConfig?: Record<string, unknown>;
        recipientEmails?: string[];
        autoApprove?: boolean;
      };

      if (!name || !domain || !frequency) {
        return sendBadRequest(res, 'name, domain, and frequency are required');
      }

      const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'on_demand'];
      if (!validFrequencies.includes(frequency)) {
        return sendBadRequest(
          res,
          `Invalid frequency — must be one of: ${validFrequencies.join(', ')}`,
        );
      }

      let resolvedTemplateId = templateId;
      if (!resolvedTemplateId && templateKey && DOMAIN_TEMPLATES[templateKey]) {
        resolvedTemplateId = templateKey;
      }
      if (!resolvedTemplateId) {
        return sendBadRequest(res, 'templateId or templateKey is required');
      }

      const scheduleId = await createReportSchedule({
        name,
        templateId: resolvedTemplateId,
        domain,
        frequency,
        dataConfig,
        recipientEmails,
        autoApprove,
        createdByUserId: getUserId(req),
      });

      sendSuccess(res, { scheduleId, name, domain, frequency }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create schedule');
    }
  },
);

// ─── Scheduled Report Runner (internal — admin only) ─────────────────────────

router.post(
  '/reports/schedules/run-due',
  authMiddleware(),
  requireRole('admin'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const schedules = await getSchedulesDue();
      const results: Array<{
        scheduleId: string;
        status: string;
        reportId?: string;
        error?: string;
        emailSent?: number;
        emailFailed?: number;
      }> = [];

      for (const schedule of schedules) {
        try {
          const templateKey = schedule.templateId;
          // Try built-in domain template first; fall back to DB-saved template
          let template: ReportTemplate | null = DOMAIN_TEMPLATES[templateKey] || null;
          if (!template) {
            const dbTemplate = await getReportTemplate(templateKey);
            if (dbTemplate) {
              template = {
                id: dbTemplate.templateId,
                name: dbTemplate.name,
                domain: dbTemplate.domain,
                reportType: dbTemplate.reportType,
                brandTheme:
                  (dbTemplate.brandTheme as import('../lib/report-engine').BrandTheme) || 'szl',
                blocks: (dbTemplate.blocks as import('../lib/report-engine').ReportBlock[]) || [],
                dataRequirements: (dbTemplate.dataRequirements as string[]) || [],
              };
            }
          }
          if (!template) {
            results.push({
              scheduleId: schedule.scheduleId,
              status: 'skipped',
              error: 'Template not found',
            });
            continue;
          }

          const dataConfig = (schedule.dataConfig as Record<string, unknown>) || {};

          const narrative = await generateReportNarrative({
            domain: schedule.domain as
              | 'szl_holdings'
              | 'carlota_jo'
              | 'aegis'
              | 'terra'
              | 'vessels'
              | 'lyte'
              | 'prism'
              | 'general',
            reportType: template.reportType,
            data: dataConfig,
            tone: 'executive',
            sections: ['executive_summary', 'trend_analysis', 'recommendations', 'outlook'],
          });

          const pdfBuffer = await renderReportToPdf({
            template,
            data: dataConfig,
            narrativeSections: narrative,
            entityName: template.name,
          });

          const reportId = await createReportGeneration({
            templateId: schedule.templateId,
            title: `${template.name} — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`,
            domain: schedule.domain,
            reportType: template.reportType,
            brandTheme: template.brandTheme,
            dataSnapshot: dataConfig,
            narrativeSections: narrative,
            pdfBuffer,
            scheduledRunId: schedule.scheduleId,
          });

          if (schedule.autoApprove) {
            await updateReportStatus(reportId, 'approved');
          }

          await markScheduleRun(schedule.scheduleId, 'completed');

          const runDueDataConfig = (schedule.dataConfig as Record<string, unknown> | null) ?? {};
          const runDueDeliveryMethod =
            (runDueDataConfig['deliveryMethod'] as string | undefined) ?? 'email';
          const runDueEmails = (schedule.recipientEmails as string[] | null) ?? [];
          let emailSent = 0;
          let emailFailed = 0;
          if (runDueEmails.length > 0) {
            const runDueTitle = `${template.name} — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
            if (runDueDeliveryMethod === 'download') {
              const presignedUrl = await uploadReportAndGetPresignedUrl(reportId, pdfBuffer);
              if (!presignedUrl) {
                // Hard failure: download mode promises a no-auth presigned link.
                // Record a failed distribution per recipient rather than silently
                // emailing an auth-protected URL they can't open.
                for (const email of runDueEmails) {
                  const distId = await createDistribution({
                    reportId,
                    recipientEmail: email,
                    channel: 'download',
                  });
                  await markDistributionFailed(
                    distId,
                    'Object storage unavailable — could not generate presigned download URL',
                  );
                }
                emailFailed = runDueEmails.length;
                logger.warn(
                  {
                    reportId,
                    scheduleId: schedule.scheduleId,
                    recipientCount: runDueEmails.length,
                  },
                  'Download-mode delivery failed: no presigned URL',
                );
              } else {
                const emailResults = await sendReportEmails({
                  reportId,
                  reportTitle: runDueTitle,
                  scheduleName: schedule.name,
                  domain: schedule.domain,
                  frequency: schedule.frequency,
                  generatedAt: new Date(),
                  recipientEmails: runDueEmails,
                  channel: 'download',
                  downloadUrlOverride: presignedUrl,
                  linkMode: 'presigned',
                });
                emailSent = emailResults.sent;
                emailFailed = emailResults.failed;
              }
            } else {
              const emailResults = await sendReportEmails({
                reportId,
                reportTitle: runDueTitle,
                scheduleName: schedule.name,
                domain: schedule.domain,
                frequency: schedule.frequency,
                generatedAt: new Date(),
                recipientEmails: runDueEmails,
                pdfBuffer,
              });
              emailSent = emailResults.sent;
              emailFailed = emailResults.failed;
            }
          }

          results.push({
            scheduleId: schedule.scheduleId,
            status: 'completed',
            reportId,
            emailSent,
            emailFailed,
          });
          logger.info(
            { scheduleId: schedule.scheduleId, reportId, emailSent, emailFailed },
            'Scheduled report generated and delivered',
          );
        } catch (scheduleErr) {
          await markScheduleRun(schedule.scheduleId, 'failed');
          results.push({
            scheduleId: schedule.scheduleId,
            status: 'failed',
            error: String(scheduleErr),
          });
          logger.error(
            { scheduleId: schedule.scheduleId, err: scheduleErr },
            'Scheduled report failed',
          );
        }
      }

      sendSuccess(res, { processed: schedules.length, results });
    } catch (err) {
      handleRouteError(res, err, 'Failed to run scheduled reports');
    }
  },
);

// ─── Per-Schedule: Toggle active state ───────────────────────────────────────

router.patch(
  '/reports/schedules/:scheduleId',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(
    bodyShape({
      isActive: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const scheduleId = req.params['scheduleId'] as string;
      const { isActive } = req.body as { isActive?: boolean };

      if (isActive === undefined || typeof isActive !== 'boolean') {
        return sendBadRequest(res, 'isActive (boolean) is required');
      }

      const schedule = await getReportScheduleById(scheduleId);
      if (!schedule) return sendNotFound(res, 'Schedule');

      await updateReportSchedule(scheduleId, { isActive });
      sendSuccess(res, { scheduleId, isActive });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update schedule');
    }
  },
);

// ─── Per-Schedule: Run immediately ───────────────────────────────────────────

router.post(
  '/reports/schedules/:scheduleId/run',
  authMiddleware(),
  requireRole('admin', 'ops'),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const scheduleId = req.params['scheduleId'] as string;
      const schedule = await getReportScheduleById(scheduleId);
      if (!schedule) return sendNotFound(res, 'Schedule');

      const templateKey = schedule.templateId;
      // Try built-in domain template first; fall back to DB-saved template
      let template: ReportTemplate | null = DOMAIN_TEMPLATES[templateKey] || null;
      if (!template) {
        const dbTemplate = await getReportTemplate(templateKey);
        if (dbTemplate) {
          template = {
            id: dbTemplate.templateId,
            name: dbTemplate.name,
            domain: dbTemplate.domain,
            reportType: dbTemplate.reportType,
            brandTheme:
              (dbTemplate.brandTheme as import('../lib/report-engine').BrandTheme) || 'szl',
            blocks: (dbTemplate.blocks as import('../lib/report-engine').ReportBlock[]) || [],
            dataRequirements: (dbTemplate.dataRequirements as string[]) || [],
          };
        }
      }

      if (!template) {
        await markScheduleRun(scheduleId, 'failed');
        return sendBadRequest(res, `No template found for key: ${templateKey}`);
      }

      const dataConfig = (schedule.dataConfig as Record<string, unknown>) || {};

      const narrative = await generateReportNarrative({
        domain: schedule.domain as
          | 'szl_holdings'
          | 'carlota_jo'
          | 'aegis'
          | 'terra'
          | 'vessels'
          | 'lyte'
          | 'prism'
          | 'general',
        reportType: template.reportType,
        data: dataConfig,
        tone: 'executive',
        sections: ['executive_summary', 'trend_analysis', 'recommendations', 'outlook'],
      });

      const pdfBuffer = await renderReportToPdf({
        template,
        data: dataConfig,
        narrativeSections: narrative,
        entityName: template.name,
      });

      const reportId = await createReportGeneration({
        templateId: schedule.templateId,
        title: `${template.name} — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`,
        domain: schedule.domain,
        reportType: template.reportType,
        brandTheme: template.brandTheme,
        dataSnapshot: dataConfig,
        narrativeSections: narrative,
        pdfBuffer,
        scheduledRunId: schedule.scheduleId,
        generatedByUserId: getUserId(req),
      });

      if (schedule.autoApprove) {
        await updateReportStatus(reportId, 'approved');
      }
      await markScheduleRun(scheduleId, 'completed');

      const perRunDataConfig = (schedule.dataConfig as Record<string, unknown> | null) ?? {};
      const perRunDeliveryMethod =
        (perRunDataConfig['deliveryMethod'] as string | undefined) ?? 'email';
      const perRunEmails = (schedule.recipientEmails as string[] | null) ?? [];
      let emailSent = 0;
      let emailFailed = 0;
      if (perRunEmails.length > 0) {
        const perRunTitle = `${template.name} — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
        if (perRunDeliveryMethod === 'download') {
          const presignedUrl = await uploadReportAndGetPresignedUrl(reportId, pdfBuffer);
          if (!presignedUrl) {
            for (const email of perRunEmails) {
              const distId = await createDistribution({
                reportId,
                recipientEmail: email,
                channel: 'download',
                distributedByUserId: getUserId(req),
              });
              await markDistributionFailed(
                distId,
                'Object storage unavailable — could not generate presigned download URL',
              );
            }
            emailFailed = perRunEmails.length;
            logger.warn(
              { reportId, scheduleId, recipientCount: perRunEmails.length },
              'Download-mode delivery failed: no presigned URL',
            );
          } else {
            const emailResults = await sendReportEmails({
              reportId,
              reportTitle: perRunTitle,
              scheduleName: schedule.name,
              domain: schedule.domain,
              frequency: schedule.frequency,
              generatedAt: new Date(),
              recipientEmails: perRunEmails,
              distributedByUserId: getUserId(req),
              channel: 'download',
              downloadUrlOverride: presignedUrl,
              linkMode: 'presigned',
            });
            emailSent = emailResults.sent;
            emailFailed = emailResults.failed;
          }
        } else {
          const emailResults = await sendReportEmails({
            reportId,
            reportTitle: perRunTitle,
            scheduleName: schedule.name,
            domain: schedule.domain,
            frequency: schedule.frequency,
            generatedAt: new Date(),
            recipientEmails: perRunEmails,
            distributedByUserId: getUserId(req),
            pdfBuffer,
          });
          emailSent = emailResults.sent;
          emailFailed = emailResults.failed;
        }
      }

      sendSuccess(res, {
        scheduleId,
        reportId,
        status: 'completed',
        distributionCount: perRunEmails.length,
        deliveryMethod: perRunDeliveryMethod,
        emailSent,
        emailFailed,
      });
      logger.info({ scheduleId, reportId, emailSent, emailFailed }, 'Per-schedule run completed');
    } catch (err) {
      handleRouteError(res, err, 'Failed to run schedule');
    }
  },
);

// ─── Brand Themes ─────────────────────────────────────────────────────────────

router.get('/reports/brand-themes', authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const themes = Object.entries(BRAND_THEMES).map(([key, colors]) => ({
      key,
      headerTag: colors.headerTag,
      primary: colors.primary,
      bg: colors.bg,
      text: colors.text,
    }));
    sendSuccess(res, themes);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list brand themes');
  }
});

export default router;
