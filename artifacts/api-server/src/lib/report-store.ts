/**
 * Report Store
 * Versioning, history, data snapshots, and audit trail for generated reports.
 */
import { randomUUID } from "crypto";
import { db } from "@szl-holdings/db";
import {
  reportTemplatesTable,
  reportGenerationsTable,
  reportApprovalsTable,
  reportDistributionsTable,
  reportSchedulesTable,
} from "@szl-holdings/db";
import { eq, desc, and, sql, gte, lte, ilike, or, asc } from "drizzle-orm";
import { logger } from "./logger";
import type { ReportTemplate, ReportBlock, BrandTheme } from "./report-engine";

// ─── Template Operations ──────────────────────────────────────────────────────

export async function createReportTemplate(params: {
  name: string;
  description?: string;
  domain: string;
  reportType: string;
  brandTheme: BrandTheme;
  blocks: ReportBlock[];
  dataRequirements?: string[];
  isSchedulable?: boolean;
  createdByUserId?: number | null;
}): Promise<string> {
  const templateId = randomUUID();
  await db.insert(reportTemplatesTable).values({
    templateId,
    name: params.name,
    description: params.description,
    domain: params.domain as "szl_holdings" | "carlota_jo" | "aegis" | "terra" | "vessels" | "lyte" | "prism" | "general",
    reportType: params.reportType,
    brandTheme: params.brandTheme,
    blocks: params.blocks as unknown[],
    dataRequirements: params.dataRequirements || [],
    isSchedulable: params.isSchedulable ?? false,
    createdByUserId: params.createdByUserId ?? null,
  });
  logger.info({ templateId, name: params.name, domain: params.domain }, "Report template created");
  return templateId;
}

export async function getReportTemplate(templateId: string) {
  const [template] = await db
    .select()
    .from(reportTemplatesTable)
    .where(eq(reportTemplatesTable.templateId, templateId))
    .limit(1);
  return template ?? null;
}

export async function listReportTemplates(opts: {
  domain?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const conditions = [];
  if (opts.domain) conditions.push(eq(reportTemplatesTable.domain, opts.domain as "szl_holdings" | "carlota_jo" | "aegis" | "terra" | "vessels" | "lyte" | "prism" | "general"));
  if (opts.isActive !== undefined) conditions.push(eq(reportTemplatesTable.isActive, opts.isActive));

  const rows = await db
    .select()
    .from(reportTemplatesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reportTemplatesTable.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reportTemplatesTable);

  return { templates: rows, total: count };
}

export async function updateReportTemplate(templateId: string, updates: {
  name?: string;
  description?: string;
  blocks?: ReportBlock[];
  isActive?: boolean;
  isSchedulable?: boolean;
}) {
  await db
    .update(reportTemplatesTable)
    .set({
      ...updates,
      blocks: updates.blocks as unknown[] | undefined,
      updatedAt: new Date(),
    })
    .where(eq(reportTemplatesTable.templateId, templateId));
}

// ─── Report Generation Operations ────────────────────────────────────────────

export interface CreateReportParams {
  templateId?: string;
  templateVersion?: number;
  title: string;
  domain: string;
  reportType: string;
  brandTheme: BrandTheme;
  dataSnapshot?: Record<string, unknown>;
  renderedBlocks?: unknown[];
  narrativeSections?: unknown;
  pdfBuffer?: Buffer | null;
  generationDurationMs?: number;
  scheduledRunId?: string;
  parentReportId?: string;
  versionNumber?: number;
  generatedByUserId?: number | null;
}

export async function createReportGeneration(params: CreateReportParams): Promise<string> {
  const reportId = randomUUID();

  await db.insert(reportGenerationsTable).values({
    reportId,
    templateId: params.templateId,
    templateVersion: params.templateVersion ?? 1,
    title: params.title,
    domain: params.domain,
    reportType: params.reportType,
    status: "draft",
    brandTheme: params.brandTheme,
    dataSnapshot: params.dataSnapshot as unknown,
    snapshotAt: params.dataSnapshot ? new Date() : undefined,
    renderedBlocks: params.renderedBlocks as unknown,
    narrativeSections: params.narrativeSections as unknown,
    pdfBuffer: params.pdfBuffer ? params.pdfBuffer.toString("base64") : null,
    pdfSizeBytes: params.pdfBuffer ? params.pdfBuffer.length : null,
    generationDurationMs: params.generationDurationMs,
    scheduledRunId: params.scheduledRunId,
    parentReportId: params.parentReportId,
    versionNumber: params.versionNumber ?? 1,
    generatedAt: new Date(),
    generatedByUserId: params.generatedByUserId ?? null,
  });

  logger.info({ reportId, title: params.title, domain: params.domain }, "Report generation created");
  return reportId;
}

export async function getReportGeneration(reportId: string) {
  const [report] = await db
    .select()
    .from(reportGenerationsTable)
    .where(eq(reportGenerationsTable.reportId, reportId))
    .limit(1);
  return report ?? null;
}

export async function getReportPdfBuffer(reportId: string): Promise<Buffer | null> {
  const report = await getReportGeneration(reportId);
  if (!report?.pdfBuffer) return null;
  return Buffer.from(report.pdfBuffer, "base64");
}

export async function listReportGenerations(opts: {
  domain?: string;
  status?: string;
  templateId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const conditions = [];
  if (opts.domain) conditions.push(eq(reportGenerationsTable.domain, opts.domain));
  if (opts.status) conditions.push(eq(reportGenerationsTable.status, opts.status as "draft" | "review" | "approved" | "distributed" | "archived"));
  if (opts.templateId) conditions.push(eq(reportGenerationsTable.templateId, opts.templateId));
  if (opts.dateFrom) conditions.push(gte(reportGenerationsTable.generatedAt, opts.dateFrom));
  if (opts.dateTo) conditions.push(lte(reportGenerationsTable.generatedAt, opts.dateTo));
  if (opts.search) conditions.push(ilike(reportGenerationsTable.title, `%${opts.search}%`));

  const rows = await db
    .select({
      id: reportGenerationsTable.id,
      reportId: reportGenerationsTable.reportId,
      templateId: reportGenerationsTable.templateId,
      title: reportGenerationsTable.title,
      domain: reportGenerationsTable.domain,
      reportType: reportGenerationsTable.reportType,
      status: reportGenerationsTable.status,
      brandTheme: reportGenerationsTable.brandTheme,
      snapshotAt: reportGenerationsTable.snapshotAt,
      pdfSizeBytes: reportGenerationsTable.pdfSizeBytes,
      generationDurationMs: reportGenerationsTable.generationDurationMs,
      versionNumber: reportGenerationsTable.versionNumber,
      scheduledRunId: reportGenerationsTable.scheduledRunId,
      notes: reportGenerationsTable.notes,
      generatedByUserId: reportGenerationsTable.generatedByUserId,
      generatedAt: reportGenerationsTable.generatedAt,
      createdAt: reportGenerationsTable.createdAt,
    })
    .from(reportGenerationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reportGenerationsTable.generatedAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reportGenerationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return { reports: rows, total: count };
}

export async function updateReportStatus(reportId: string, status: "draft" | "review" | "approved" | "distributed" | "archived", notes?: string) {
  await db
    .update(reportGenerationsTable)
    .set({ status, notes: notes ?? undefined, updatedAt: new Date() })
    .where(eq(reportGenerationsTable.reportId, reportId));
  logger.info({ reportId, status }, "Report status updated");
}

export async function getReportVersionHistory(parentReportId: string) {
  return db
    .select({
      reportId: reportGenerationsTable.reportId,
      title: reportGenerationsTable.title,
      status: reportGenerationsTable.status,
      versionNumber: reportGenerationsTable.versionNumber,
      generatedAt: reportGenerationsTable.generatedAt,
      pdfSizeBytes: reportGenerationsTable.pdfSizeBytes,
    })
    .from(reportGenerationsTable)
    .where(
      or(
        eq(reportGenerationsTable.reportId, parentReportId),
        eq(reportGenerationsTable.parentReportId, parentReportId)
      )!
    )
    .orderBy(asc(reportGenerationsTable.versionNumber));
}

// ─── Approval Operations ──────────────────────────────────────────────────────

export async function createApprovalRequest(params: {
  reportId: string;
  requestedByUserId?: number | null;
  reviewerUserId?: number | null;
}) {
  const approvalId = randomUUID();
  await db.insert(reportApprovalsTable).values({
    approvalId,
    reportId: params.reportId,
    requestedByUserId: params.requestedByUserId ?? null,
    reviewerUserId: params.reviewerUserId ?? null,
    status: "pending",
  });
  await updateReportStatus(params.reportId, "review");
  logger.info({ approvalId, reportId: params.reportId }, "Approval request created");
  return approvalId;
}

export async function reviewApproval(approvalId: string, params: {
  status: "approved" | "rejected" | "revision_requested";
  comment?: string;
  annotations?: unknown[];
}) {
  await db
    .update(reportApprovalsTable)
    .set({
      status: params.status,
      comment: params.comment,
      annotations: params.annotations as unknown[],
      reviewedAt: new Date(),
    })
    .where(eq(reportApprovalsTable.approvalId, approvalId));

  const [approval] = await db
    .select()
    .from(reportApprovalsTable)
    .where(eq(reportApprovalsTable.approvalId, approvalId))
    .limit(1);

  if (approval) {
    const newStatus = params.status === "approved" ? "approved" : "draft";
    await updateReportStatus(approval.reportId, newStatus as "draft" | "approved");
  }

  logger.info({ approvalId, status: params.status }, "Approval reviewed");
}

export async function getApprovalForReport(reportId: string) {
  const [approval] = await db
    .select()
    .from(reportApprovalsTable)
    .where(eq(reportApprovalsTable.reportId, reportId))
    .orderBy(desc(reportApprovalsTable.requestedAt))
    .limit(1);
  return approval ?? null;
}

// ─── Distribution Operations ──────────────────────────────────────────────────

export async function createDistribution(params: {
  reportId: string;
  recipientEmail: string;
  recipientName?: string;
  channel?: "email" | "webhook" | "dashboard" | "download";
  distributedByUserId?: number | null;
}) {
  const distributionId = randomUUID();
  await db.insert(reportDistributionsTable).values({
    distributionId,
    reportId: params.reportId,
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    channel: params.channel ?? "email",
    status: "pending",
    distributedByUserId: params.distributedByUserId ?? null,
  });
  return distributionId;
}

export async function markDistributionSent(distributionId: string) {
  await db
    .update(reportDistributionsTable)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(reportDistributionsTable.distributionId, distributionId));
}

export async function markDistributionOpened(distributionId: string) {
  await db
    .update(reportDistributionsTable)
    .set({ status: "opened", openedAt: new Date() })
    .where(eq(reportDistributionsTable.distributionId, distributionId));
}

export async function listDistributionsForReport(reportId: string) {
  return db
    .select()
    .from(reportDistributionsTable)
    .where(eq(reportDistributionsTable.reportId, reportId))
    .orderBy(desc(reportDistributionsTable.createdAt));
}

export async function markReportDistributed(reportId: string) {
  await updateReportStatus(reportId, "distributed");
}

// ─── Schedule Operations ──────────────────────────────────────────────────────

export async function createReportSchedule(params: {
  name: string;
  templateId: string;
  domain: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "on_demand";
  dataConfig?: Record<string, unknown>;
  recipientEmails?: string[];
  autoApprove?: boolean;
  createdByUserId?: number | null;
}) {
  const scheduleId = randomUUID();
  const nextRunAt = computeNextRunAt(params.frequency);

  await db.insert(reportSchedulesTable).values({
    scheduleId,
    name: params.name,
    templateId: params.templateId,
    domain: params.domain,
    frequency: params.frequency,
    isActive: true,
    dataConfig: params.dataConfig ?? {},
    recipientEmails: params.recipientEmails ?? [],
    autoApprove: params.autoApprove ?? false,
    nextRunAt,
    createdByUserId: params.createdByUserId ?? null,
  });

  logger.info({ scheduleId, name: params.name, frequency: params.frequency }, "Report schedule created");
  return scheduleId;
}

export async function updateReportSchedule(scheduleId: string, updates: { isActive?: boolean }) {
  await db
    .update(reportSchedulesTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(reportSchedulesTable.scheduleId, scheduleId));
}

export async function getReportScheduleById(scheduleId: string) {
  const [schedule] = await db
    .select()
    .from(reportSchedulesTable)
    .where(eq(reportSchedulesTable.scheduleId, scheduleId))
    .limit(1);
  return schedule ?? null;
}

export async function listReportSchedules(opts: { domain?: string; isActive?: boolean } = {}) {
  const conditions = [];
  if (opts.domain) conditions.push(eq(reportSchedulesTable.domain, opts.domain));
  if (opts.isActive !== undefined) conditions.push(eq(reportSchedulesTable.isActive, opts.isActive));

  return db
    .select()
    .from(reportSchedulesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reportSchedulesTable.createdAt));
}

export async function getSchedulesDue(): Promise<typeof reportSchedulesTable.$inferSelect[]> {
  const now = new Date();
  return db
    .select()
    .from(reportSchedulesTable)
    .where(
      and(
        eq(reportSchedulesTable.isActive, true),
        lte(reportSchedulesTable.nextRunAt, now)
      )
    );
}

export async function markScheduleRun(scheduleId: string, status: "completed" | "failed") {
  const [schedule] = await db
    .select()
    .from(reportSchedulesTable)
    .where(eq(reportSchedulesTable.scheduleId, scheduleId))
    .limit(1);

  if (!schedule) return;

  const nextRunAt = computeNextRunAt(schedule.frequency as "daily" | "weekly" | "monthly" | "quarterly" | "on_demand");

  await db
    .update(reportSchedulesTable)
    .set({
      lastRunAt: new Date(),
      lastStatus: status,
      nextRunAt,
      runCount: (schedule.runCount || 0) + 1,
      failCount: status === "failed" ? (schedule.failCount || 0) + 1 : schedule.failCount,
      updatedAt: new Date(),
    })
    .where(eq(reportSchedulesTable.scheduleId, scheduleId));
}

function computeNextRunAt(frequency: "daily" | "weekly" | "monthly" | "quarterly" | "on_demand"): Date {
  const now = new Date();
  switch (frequency) {
    case "daily": return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "weekly": return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "monthly": {
      const next = new Date(now);
      next.setMonth(next.getMonth() + 1);
      return next;
    }
    case "quarterly": {
      const next = new Date(now);
      next.setMonth(next.getMonth() + 3);
      return next;
    }
    case "on_demand":
    default:
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  }
}

// ─── Audit & Analytics ────────────────────────────────────────────────────────

export async function getReportStats() {
  const [stats] = await db.select({
    total: sql<number>`count(*)::int`,
    drafts: sql<number>`count(*) filter (where status = 'draft')::int`,
    reviews: sql<number>`count(*) filter (where status = 'review')::int`,
    approved: sql<number>`count(*) filter (where status = 'approved')::int`,
    distributed: sql<number>`count(*) filter (where status = 'distributed')::int`,
    archived: sql<number>`count(*) filter (where status = 'archived')::int`,
  }).from(reportGenerationsTable);

  const domainStats = await db.select({
    domain: reportGenerationsTable.domain,
    count: sql<number>`count(*)::int`,
  })
    .from(reportGenerationsTable)
    .groupBy(reportGenerationsTable.domain)
    .orderBy(desc(sql`count(*)`));

  return { ...stats, byDomain: domainStats };
}

export const reportStore = {
  createReportGeneration,
  getReportGeneration,
  listReportGenerations,
  updateReportStatus,
  createReportTemplate,
  getReportTemplate,
  listReportTemplates,
  updateReportTemplate,
  getReportPdfBuffer,
  getReportVersionHistory,
  createApprovalRequest,
  reviewApproval,
  getApprovalForReport,
  createDistribution,
};
