/**
 * Export Job Processor
 *
 * Provides `processExportJobById` — the single function responsible for turning a
 * pending/processing export_jobs row into a completed, downloadable file.
 *
 * Called from two entry points:
 *  1. `POST /exports/enqueue` — fires via setImmediate immediately after responding
 *     with the job ID so the HTTP call returns fast.
 *  2. `EXPORT_JOB_PROCESSOR` scheduled job — runs hourly to catch jobs that got
 *     stuck in pending/processing state (e.g. after a server restart mid-generation).
 */

import {
  auditEventsTable,
  db,
  exportJobsTable,
  firestormFindingsTable,
  invoicesTable,
  lyteSignalsTable,
  meteringEventsTable,
  mspTicketsTable,
  terraDealsTable,
  usersTable,
  vesselsTable,
} from '@szl-holdings/db';
import { objectStorageClient } from '../lib/objectStorage';
import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { type ExportColumn, generateCsv, generatePdf, generateXlsx, storeExportBuffer } from '../lib/export-service';
import { logger } from '../lib/logger';

interface FilterParams {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: string;
  orgId?: number;
  action?: string;
  selectedColumns?: string[];
}

async function fetchDomainData(
  domain: string,
  filters: FilterParams,
): Promise<{ rows: Record<string, unknown>[]; allColumns: ExportColumn[] }> {
  const { dateFrom, dateTo, search, status, orgId, action } = filters;
  const from = dateFrom ? new Date(dateFrom) : undefined;
  const to = dateTo ? new Date(dateTo) : undefined;

  let rows: Record<string, unknown>[] = [];
  let allColumns: ExportColumn[] = [];

  switch (domain) {
    case 'audit_events': {
      const conditions = [];
      if (from) conditions.push(gte(auditEventsTable.createdAt, from));
      if (to) conditions.push(lte(auditEventsTable.createdAt, to));
      if (action) conditions.push(ilike(auditEventsTable.action, `%${action}%`));
      else if (search)
        conditions.push(
          or(
            ilike(auditEventsTable.action, `%${search}%`),
            ilike(auditEventsTable.entityType, `%${search}%`),
          )!,
        );
      rows = (await db
        .select({
          id: auditEventsTable.id,
          action: auditEventsTable.action,
          entityType: auditEventsTable.entityType,
          entityId: auditEventsTable.entityId,
          userId: auditEventsTable.userId,
          userEmail: usersTable.email,
          userName: usersTable.displayName,
          ipAddress: auditEventsTable.ipAddress,
          userAgent: auditEventsTable.userAgent,
          createdAt: auditEventsTable.createdAt,
        })
        .from(auditEventsTable)
        .leftJoin(usersTable, sql`${auditEventsTable.userId} = ${usersTable.id}`)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(auditEventsTable.createdAt))
        .limit(10_000)) as Record<string, unknown>[];
      allColumns = [
        { key: 'id', label: 'ID' },
        { key: 'createdAt', label: 'Timestamp' },
        { key: 'action', label: 'Action' },
        { key: 'entityType', label: 'Entity Type' },
        { key: 'entityId', label: 'Entity ID' },
        { key: 'userEmail', label: 'Actor Email' },
        { key: 'userName', label: 'Actor Name' },
        { key: 'ipAddress', label: 'IP Address' },
        { key: 'userAgent', label: 'User Agent' },
      ];
      break;
    }
    case 'aegis_incidents': {
      const conditions = [];
      if (from) conditions.push(gte(firestormFindingsTable.createdAt, from));
      if (to) conditions.push(lte(firestormFindingsTable.createdAt, to));
      if (status && status !== 'all')
        conditions.push(sql`${firestormFindingsTable.status} = ${status}`);
      if (search)
        conditions.push(
          or(
            ilike(firestormFindingsTable.title, `%${search}%`),
            ilike(firestormFindingsTable.category, `%${search}%`),
          )!,
        );
      rows = (await db
        .select()
        .from(firestormFindingsTable)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(firestormFindingsTable.createdAt))
        .limit(10_000)) as Record<string, unknown>[];
      allColumns = [
        { key: 'id', label: 'ID' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'title', label: 'Title' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'category', label: 'Category' },
        { key: 'description', label: 'Description' },
        { key: 'recommendation', label: 'Recommendation' },
      ];
      break;
    }
    case 'vessels': {
      const conditions = [];
      if (from) conditions.push(gte(vesselsTable.createdAt, from));
      if (to) conditions.push(lte(vesselsTable.createdAt, to));
      if (status && status !== 'all')
        conditions.push(sql`${vesselsTable.status} = ${status}`);
      if (search)
        conditions.push(
          or(
            ilike(vesselsTable.name, `%${search}%`),
            ilike(vesselsTable.mmsi, `%${search}%`),
          )!,
        );
      rows = (await db
        .select()
        .from(vesselsTable)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(vesselsTable.createdAt))
        .limit(10_000)) as Record<string, unknown>[];
      allColumns = [
        { key: 'id', label: 'ID' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'name', label: 'Vessel Name' },
        { key: 'mmsi', label: 'MMSI' },
        { key: 'imo', label: 'IMO' },
        { key: 'type', label: 'Type' },
        { key: 'flag', label: 'Flag' },
        { key: 'status', label: 'Status' },
        { key: 'currentPort', label: 'Current Port' },
        { key: 'nextPort', label: 'Next Port' },
        { key: 'grossTonnage', label: 'Gross Tonnage' },
      ];
      break;
    }
    case 'terra_deals': {
      const conditions = [];
      if (from) conditions.push(gte(terraDealsTable.createdAt, from));
      if (to) conditions.push(lte(terraDealsTable.createdAt, to));
      if (status && status !== 'all')
        conditions.push(sql`${terraDealsTable.stage} = ${status}`);
      if (search)
        conditions.push(
          or(
            ilike(terraDealsTable.address, `%${search}%`),
            ilike(terraDealsTable.ownerName, `%${search}%`),
          )!,
        );
      rows = (await db
        .select()
        .from(terraDealsTable)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(terraDealsTable.createdAt))
        .limit(10_000)) as Record<string, unknown>[];
      allColumns = [
        { key: 'id', label: 'ID' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'address', label: 'Address' },
        { key: 'borough', label: 'Borough' },
        { key: 'stage', label: 'Stage' },
        { key: 'type', label: 'Deal Type' },
        { key: 'price', label: 'Price' },
        { key: 'askingPrice', label: 'Asking Price' },
        { key: 'riskLevel', label: 'Risk Level' },
        { key: 'ownerName', label: 'Owner' },
        { key: 'clientName', label: 'Client' },
        { key: 'estimatedCloseDate', label: 'Est. Close Date' },
      ];
      break;
    }
    case 'lyte_signals': {
      const conditions = [];
      if (from) conditions.push(gte(lyteSignalsTable.createdAt, from));
      if (to) conditions.push(lte(lyteSignalsTable.createdAt, to));
      if (status && status !== 'all')
        conditions.push(sql`${lyteSignalsTable.status} = ${status}`);
      if (search)
        conditions.push(
          or(
            ilike(lyteSignalsTable.title, `%${search}%`),
            ilike(lyteSignalsTable.source, `%${search}%`),
          )!,
        );
      rows = (await db
        .select()
        .from(lyteSignalsTable)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(lyteSignalsTable.createdAt))
        .limit(10_000)) as Record<string, unknown>[];
      allColumns = [
        { key: 'id', label: 'ID' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'title', label: 'Signal Title' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'source', label: 'Source' },
        { key: 'sourceType', label: 'Source Type' },
        { key: 'description', label: 'Description' },
      ];
      break;
    }
    case 'msp_tickets': {
      const conditions = [];
      if (from) conditions.push(gte(mspTicketsTable.createdAt, from));
      if (to) conditions.push(lte(mspTicketsTable.createdAt, to));
      if (status && status !== 'all')
        conditions.push(sql`${mspTicketsTable.status} = ${status}`);
      if (search)
        conditions.push(
          or(
            ilike(mspTicketsTable.subject, `%${search}%`),
            ilike(mspTicketsTable.category, `%${search}%`),
          )!,
        );
      rows = (await db
        .select()
        .from(mspTicketsTable)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(mspTicketsTable.createdAt))
        .limit(10_000)) as Record<string, unknown>[];
      allColumns = [
        { key: 'id', label: 'ID' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'ticketNumber', label: 'Ticket Number' },
        { key: 'subject', label: 'Subject' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'category', label: 'Category' },
        { key: 'clientName', label: 'Client' },
        { key: 'assigneeName', label: 'Assignee' },
        { key: 'slaStatus', label: 'SLA Status' },
        { key: 'resolvedAt', label: 'Resolved At' },
      ];
      break;
    }
    case 'usage_metering': {
      const conditions = [];
      if (from) conditions.push(gte(meteringEventsTable.occurredAt, from));
      if (to) conditions.push(lte(meteringEventsTable.occurredAt, to));
      if (orgId) conditions.push(eq(meteringEventsTable.orgId, orgId));
      rows = (await db
        .select({
          id: meteringEventsTable.id,
          orgId: meteringEventsTable.orgId,
          featureKey: meteringEventsTable.featureKey,
          product: meteringEventsTable.product,
          quantity: meteringEventsTable.quantity,
          unitLabel: meteringEventsTable.unitLabel,
          occurredAt: meteringEventsTable.occurredAt,
        })
        .from(meteringEventsTable)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(meteringEventsTable.occurredAt))
        .limit(10_000)) as Record<string, unknown>[];
      allColumns = [
        { key: 'id', label: 'ID' },
        { key: 'orgId', label: 'Org ID' },
        { key: 'featureKey', label: 'Feature' },
        { key: 'product', label: 'Product' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'unitLabel', label: 'Unit' },
        { key: 'occurredAt', label: 'Occurred At' },
      ];
      break;
    }
    case 'revenue_events': {
      const conditions = [];
      if (from) conditions.push(gte(invoicesTable.createdAt, from));
      if (to) conditions.push(lte(invoicesTable.createdAt, to));
      if (status && status !== 'all')
        conditions.push(sql`${invoicesTable.status} = ${status}`);
      if (orgId) conditions.push(eq(invoicesTable.orgId, orgId));
      rows = (await db
        .select({
          id: invoicesTable.id,
          orgId: invoicesTable.orgId,
          stripeInvoiceId: invoicesTable.stripeInvoiceId,
          amount: invoicesTable.amount,
          currency: invoicesTable.currency,
          status: invoicesTable.status,
          paidAt: invoicesTable.paidAt,
          createdAt: invoicesTable.createdAt,
        })
        .from(invoicesTable)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(invoicesTable.createdAt))
        .limit(10_000)) as Record<string, unknown>[];
      allColumns = [
        { key: 'id', label: 'ID' },
        { key: 'orgId', label: 'Org ID' },
        { key: 'stripeInvoiceId', label: 'Stripe Invoice' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'status', label: 'Status' },
        { key: 'paidAt', label: 'Paid At' },
        { key: 'createdAt', label: 'Created At' },
      ];
      break;
    }
    default:
      logger.warn({ domain }, 'export_job_processor: unknown domain — returning empty rows');
      break;
  }

  return { rows, allColumns };
}

/**
 * Process a single export job identified by its exportId.
 * Fetches domain data, generates the file, persists to object storage,
 * and updates the export_jobs row to `completed` with a downloadable URL.
 *
 * Idempotent for jobs already in `completed` or `failed` state (no-op).
 */
export async function processExportJobById(exportId: string): Promise<void> {
  const [job] = await db
    .select()
    .from(exportJobsTable)
    .where(eq(exportJobsTable.exportId, exportId))
    .limit(1);

  if (!job) {
    logger.warn({ exportId }, 'processExportJobById: job not found');
    return;
  }
  if (job.status === 'completed' || job.status === 'failed') {
    return;
  }

  await db
    .update(exportJobsTable)
    .set({ status: 'processing' })
    .where(eq(exportJobsTable.exportId, exportId));

  const now = new Date();
  const format = (job.format ?? 'csv') as 'csv' | 'pdf' | 'xlsx';
  const domain = job.dataSource ?? '';
  const name = job.name ?? `${domain} Export — ${now.toISOString().slice(0, 10)}`;
  const downloadToken = job.downloadToken ?? '';
  const expiresAt = job.expiresAt ?? new Date(now.getTime() + 24 * 60 * 60 * 1000);

  let filters: FilterParams = {};
  if (job.filterParams) {
    try {
      filters = JSON.parse(job.filterParams) as FilterParams;
    } catch {
      filters = {};
    }
  }

  try {
    const { rows, allColumns } = await fetchDomainData(domain, filters);

    const columns = filters.selectedColumns?.length
      ? allColumns.filter((c) => filters.selectedColumns!.includes(c.key))
      : allColumns;

    let buffer: Buffer;
    if (format === 'csv') {
      buffer = generateCsv(columns, rows);
    } else if (format === 'xlsx') {
      buffer = generateXlsx(name, columns, rows);
    } else {
      buffer = await generatePdf(name, columns, rows, now);
    }

    const fileSizeBytes = buffer.length;
    const rowCount = rows.length;

    const ext = format === 'pdf' ? 'pdf' : format === 'xlsx' ? 'xlsx' : 'csv';
    const contentType =
      format === 'pdf'
        ? 'application/pdf'
        : format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv';

    let storageKey: string | null = null;
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId) {
      try {
        const objectName = `exports/${exportId}.${ext}`;
        await objectStorageClient.bucket(bucketId).file(objectName).save(buffer, {
          contentType,
          resumable: false,
        });
        storageKey = objectName;
      } catch {
        // Storage unavailable — in-memory buffer will serve the file
      }
    }

    const downloadUrl = `/api/exports/jobs/${exportId}/download?token=${downloadToken}`;

    await db
      .update(exportJobsTable)
      .set({
        status: 'completed',
        rowCount,
        fileSizeBytes,
        completedAt: now,
        downloadUrl,
        storageKey,
      })
      .where(eq(exportJobsTable.exportId, exportId));

    storeExportBuffer(exportId, buffer, expiresAt, format, name, storageKey);

    logger.info(
      { exportId, domain, format, rowCount, fileSizeBytes, storageKey },
      'processExportJobById: completed',
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err, exportId, domain }, 'processExportJobById: failed');
    await db
      .update(exportJobsTable)
      .set({ status: 'failed', errorMessage: errorMessage.slice(0, 1000) })
      .where(eq(exportJobsTable.exportId, exportId));
    throw err;
  }
}
