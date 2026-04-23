import { hashIp } from '@szl-holdings/audit';
import { bodyShape } from '@szl-holdings/contracts/common';
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
import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { type ExportColumn, fetchExportBufferFromStorage, generateCsv, generatePdf, generateXlsx, getExportBuffer, getExportByToken, getExportJobStatus, listExportHistory, runExport, storeExportBuffer } from '../lib/export-service';
import { isFlagEnabled } from '../lib/platform-flags';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

interface AuthUser {
  id: number;
  role: string;
  email?: string;
  displayName?: string;
}
type ExtendedRequest = Request & { user?: AuthUser };

const router: IRouter = Router();

const CONTENT_TYPES: Record<string, string> = {
  csv: 'text/csv',
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const FILE_EXTENSIONS: Record<string, string> = {
  csv: 'csv',
  pdf: 'pdf',
  xlsx: 'xlsx',
};

function getUserId(req: Request): number | null {
  return (req as ExtendedRequest).user?.id ?? null;
}

function getUserEmail(req: Request): string | null {
  return (req as ExtendedRequest).user?.email ?? null;
}

/** Filters the full column definition list to only those the user selected.
 *  If no selection is provided (or the list is empty), all columns are included. */
function filterColumns(allCols: ExportColumn[], selected?: string[]): ExportColumn[] {
  if (!selected?.length) return allCols;
  return allCols.filter((c) => selected.includes(c.key));
}

async function checkExportEnabled(res: Response): Promise<boolean> {
  const enabled = await isFlagEnabled('advanced_export_enabled');
  if (!enabled) {
    sendError(res, 'Advanced export is not enabled', 403, 'FEATURE_DISABLED', {
      feature: 'advanced_export_enabled',
    });
    return false;
  }
  return true;
}

// ─── Audit Log Export ────────────────────────────────────────────────────────

router.post(
  '/exports/audit-log',
  authMiddleware(),
  requireRole('admin', 'compliance'),
  validateBody(
    bodyShape({
      action: z.unknown().optional(),
      columns: z.unknown().optional(),
      dateFrom: z.unknown().optional(),
      dateTo: z.unknown().optional(),
      format: z.unknown().optional(),
      schedule: z.unknown().optional(),
      search: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    if (!(await checkExportEnabled(res))) return;
    try {
      const {
        format = 'csv',
        dateFrom,
        dateTo,
        search,
        action,
        schedule = 'once',
        columns: selectedColumns,
      } = req.body as {
        format?: 'csv' | 'pdf' | 'xlsx';
        dateFrom?: string;
        dateTo?: string;
        search?: string;
        action?: string;
        schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
        columns?: string[];
      };

      if (!['csv', 'pdf', 'xlsx'].includes(format))
        return sendBadRequest(res, 'Invalid format — must be csv, pdf, or xlsx');
      if (!['once', 'daily', 'weekly', 'monthly'].includes(schedule))
        return sendBadRequest(res, 'Invalid schedule');

      const conditions = [];
      if (dateFrom) conditions.push(gte(auditEventsTable.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(auditEventsTable.createdAt, new Date(dateTo)));
      if (action) conditions.push(ilike(auditEventsTable.action, `%${action}%`));
      else if (search) {
        conditions.push(
          or(
            ilike(auditEventsTable.action, `%${search}%`),
            ilike(auditEventsTable.entityType, `%${search}%`),
          )!,
        );
      }

      const rows = await db
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
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditEventsTable.createdAt))
        .limit(10_000);

      const allColumns: ExportColumn[] = [
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
      const columns = filterColumns(allColumns, selectedColumns);

      const filterParams = JSON.stringify({ dateFrom, dateTo, search, action });
      const name = `Audit Log Export — ${new Date().toISOString().slice(0, 10)}`;

      const result = await runExport({
        name,
        dataSource: 'audit_events',
        format,
        columns,
        rows: rows as Record<string, unknown>[],
        triggeredByUserId: getUserId(req),
        triggeredByEmail: getUserEmail(req),
        filterParams,
        scheduleFrequency: schedule,
      });

      res.setHeader('Content-Type', CONTENT_TYPES[format] ?? 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-log-${result.exportId}.${FILE_EXTENSIONS[format]}"`,
      );
      res.setHeader('X-Export-Id', result.exportId);
      res.setHeader('X-Download-Token', result.downloadToken);
      res.setHeader('X-Export-Expires', result.expiresAt.toISOString());
      res.setHeader('X-Row-Count', String(result.rowCount));
      res.send(result.buffer);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export audit log');
    }
  },
);

// ─── Aegis Incidents (Firestorm Findings) Export ─────────────────────────────

router.post(
  '/exports/aegis-incidents',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateBody(
    bodyShape({
      columns: z.unknown().optional(),
      dateFrom: z.unknown().optional(),
      dateTo: z.unknown().optional(),
      format: z.unknown().optional(),
      schedule: z.unknown().optional(),
      search: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    if (!(await checkExportEnabled(res))) return;
    try {
      const {
        format = 'csv',
        schedule = 'once',
        status,
        search,
        dateFrom,
        dateTo,
        columns: selectedColumns,
      } = req.body as {
        format?: 'csv' | 'pdf' | 'xlsx';
        schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
        status?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        columns?: string[];
      };
      if (!['csv', 'pdf', 'xlsx'].includes(format)) return sendBadRequest(res, 'Invalid format');
      if (!['once', 'daily', 'weekly', 'monthly'].includes(schedule))
        return sendBadRequest(res, 'Invalid schedule');

      const conditions = [];
      if (dateFrom) conditions.push(gte(firestormFindingsTable.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(firestormFindingsTable.createdAt, new Date(dateTo)));
      if (status && status !== 'all')
        conditions.push(eq(firestormFindingsTable.status, status as any));
      if (search)
        conditions.push(
          or(
            ilike(firestormFindingsTable.title, `%${search}%`),
            ilike(firestormFindingsTable.category, `%${search}%`),
          )!,
        );
      const rows = await db
        .select()
        .from(firestormFindingsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(firestormFindingsTable.createdAt))
        .limit(10_000);
      const allColumns: ExportColumn[] = [
        { key: 'id', label: 'ID' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'title', label: 'Title' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'category', label: 'Category' },
        { key: 'description', label: 'Description' },
        { key: 'recommendation', label: 'Recommendation' },
      ];
      const columns = filterColumns(allColumns, selectedColumns);

      const result = await runExport({
        name: `Aegis Incidents Export — ${new Date().toISOString().slice(0, 10)}`,
        dataSource: 'firestorm_findings',
        format,
        columns,
        rows: rows as Record<string, unknown>[],
        triggeredByUserId: getUserId(req),
        triggeredByEmail: getUserEmail(req),
        scheduleFrequency: schedule,
      });

      res.setHeader('Content-Type', CONTENT_TYPES[format]);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="aegis-incidents-${result.exportId}.${FILE_EXTENSIONS[format]}"`,
      );
      res.setHeader('X-Export-Id', result.exportId);
      res.setHeader('X-Download-Token', result.downloadToken);
      res.setHeader('X-Export-Expires', result.expiresAt.toISOString());
      res.setHeader('X-Row-Count', String(result.rowCount));
      res.send(result.buffer);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export Aegis incidents');
    }
  },
);

// ─── Vessels Fleet Export ─────────────────────────────────────────────────────

router.post(
  '/exports/vessels',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateBody(
    bodyShape({
      columns: z.unknown().optional(),
      dateFrom: z.unknown().optional(),
      dateTo: z.unknown().optional(),
      format: z.unknown().optional(),
      schedule: z.unknown().optional(),
      search: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    if (!(await checkExportEnabled(res))) return;
    try {
      const {
        format = 'csv',
        schedule = 'once',
        status,
        search,
        dateFrom,
        dateTo,
        columns: selectedColumns,
      } = req.body as {
        format?: 'csv' | 'pdf' | 'xlsx';
        schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
        status?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        columns?: string[];
      };
      if (!['csv', 'pdf', 'xlsx'].includes(format)) return sendBadRequest(res, 'Invalid format');
      if (!['once', 'daily', 'weekly', 'monthly'].includes(schedule))
        return sendBadRequest(res, 'Invalid schedule');

      const conditions = [];
      if (dateFrom) conditions.push(gte(vesselsTable.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(vesselsTable.createdAt, new Date(dateTo)));
      if (status && status !== 'all') conditions.push(eq(vesselsTable.status, status as any));
      if (search)
        conditions.push(
          or(
            ilike(vesselsTable.name, `%${search}%`),
            ilike(vesselsTable.mmsi, `%${search}%`),
            ilike(vesselsTable.flag, `%${search}%`),
          )!,
        );
      const rows = await db
        .select()
        .from(vesselsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(vesselsTable.createdAt))
        .limit(10_000);
      const allColumns: ExportColumn[] = [
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
      const columns = filterColumns(allColumns, selectedColumns);

      const result = await runExport({
        name: `Vessels Fleet Export — ${new Date().toISOString().slice(0, 10)}`,
        dataSource: 'vessels',
        format,
        columns,
        rows: rows as Record<string, unknown>[],
        triggeredByUserId: getUserId(req),
        triggeredByEmail: getUserEmail(req),
        scheduleFrequency: schedule,
      });

      res.setHeader('Content-Type', CONTENT_TYPES[format]);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="vessels-fleet-${result.exportId}.${FILE_EXTENSIONS[format]}"`,
      );
      res.setHeader('X-Export-Id', result.exportId);
      res.setHeader('X-Download-Token', result.downloadToken);
      res.setHeader('X-Export-Expires', result.expiresAt.toISOString());
      res.setHeader('X-Row-Count', String(result.rowCount));
      res.send(result.buffer);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export vessels fleet');
    }
  },
);

// ─── Terra Deals Export ───────────────────────────────────────────────────────

router.post(
  '/exports/terra-deals',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateBody(
    bodyShape({
      columns: z.unknown().optional(),
      dateFrom: z.unknown().optional(),
      dateTo: z.unknown().optional(),
      format: z.unknown().optional(),
      schedule: z.unknown().optional(),
      search: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    if (!(await checkExportEnabled(res))) return;
    try {
      const {
        format = 'csv',
        schedule = 'once',
        status,
        search,
        dateFrom,
        dateTo,
        columns: selectedColumns,
      } = req.body as {
        format?: 'csv' | 'pdf' | 'xlsx';
        schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
        status?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        columns?: string[];
      };
      if (!['csv', 'pdf', 'xlsx'].includes(format)) return sendBadRequest(res, 'Invalid format');
      if (!['once', 'daily', 'weekly', 'monthly'].includes(schedule))
        return sendBadRequest(res, 'Invalid schedule');

      const conditions = [];
      if (dateFrom) conditions.push(gte(terraDealsTable.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(terraDealsTable.createdAt, new Date(dateTo)));
      if (status && status !== 'all') conditions.push(eq(terraDealsTable.stage, status as any));
      if (search)
        conditions.push(
          or(
            ilike(terraDealsTable.address, `%${search}%`),
            ilike(terraDealsTable.ownerName, `%${search}%`),
          )!,
        );
      const rows = await db
        .select()
        .from(terraDealsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(terraDealsTable.createdAt))
        .limit(10_000);
      const allColumns: ExportColumn[] = [
        { key: 'id', label: 'ID' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'address', label: 'Address' },
        { key: 'borough', label: 'Borough' },
        { key: 'zipCode', label: 'Zip Code' },
        { key: 'stage', label: 'Stage' },
        { key: 'type', label: 'Deal Type' },
        { key: 'price', label: 'Price' },
        { key: 'askingPrice', label: 'Asking Price' },
        { key: 'riskLevel', label: 'Risk Level' },
        { key: 'ownerName', label: 'Owner' },
        { key: 'clientName', label: 'Client' },
        { key: 'estimatedCloseDate', label: 'Est. Close Date' },
      ];
      const columns = filterColumns(allColumns, selectedColumns);

      const result = await runExport({
        name: `Terra Deals Export — ${new Date().toISOString().slice(0, 10)}`,
        dataSource: 'terra_deals',
        format,
        columns,
        rows: rows as Record<string, unknown>[],
        triggeredByUserId: getUserId(req),
        triggeredByEmail: getUserEmail(req),
        scheduleFrequency: schedule,
      });

      res.setHeader('Content-Type', CONTENT_TYPES[format]);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="terra-deals-${result.exportId}.${FILE_EXTENSIONS[format]}"`,
      );
      res.setHeader('X-Export-Id', result.exportId);
      res.setHeader('X-Download-Token', result.downloadToken);
      res.setHeader('X-Export-Expires', result.expiresAt.toISOString());
      res.setHeader('X-Row-Count', String(result.rowCount));
      res.send(result.buffer);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export Terra deals');
    }
  },
);

// ─── Lyte Signals Export ──────────────────────────────────────────────────────

router.post(
  '/exports/lyte-signals',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateBody(
    bodyShape({
      columns: z.unknown().optional(),
      dateFrom: z.unknown().optional(),
      dateTo: z.unknown().optional(),
      format: z.unknown().optional(),
      schedule: z.unknown().optional(),
      search: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    if (!(await checkExportEnabled(res))) return;
    try {
      const {
        format = 'csv',
        schedule = 'once',
        status,
        search,
        dateFrom,
        dateTo,
        columns: selectedColumns,
      } = req.body as {
        format?: 'csv' | 'pdf' | 'xlsx';
        schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
        status?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        columns?: string[];
      };
      if (!['csv', 'pdf', 'xlsx'].includes(format)) return sendBadRequest(res, 'Invalid format');
      if (!['once', 'daily', 'weekly', 'monthly'].includes(schedule))
        return sendBadRequest(res, 'Invalid schedule');

      const conditions = [];
      if (dateFrom) conditions.push(gte(lyteSignalsTable.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(lyteSignalsTable.createdAt, new Date(dateTo)));
      if (status && status !== 'all') conditions.push(eq(lyteSignalsTable.status, status as any));
      if (search)
        conditions.push(
          or(
            ilike(lyteSignalsTable.title, `%${search}%`),
            ilike(lyteSignalsTable.source, `%${search}%`),
          )!,
        );
      const rows = await db
        .select()
        .from(lyteSignalsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(lyteSignalsTable.createdAt))
        .limit(10_000);
      const allColumns: ExportColumn[] = [
        { key: 'id', label: 'ID' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'title', label: 'Signal Title' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'source', label: 'Source' },
        { key: 'sourceType', label: 'Source Type' },
        { key: 'description', label: 'Description' },
      ];
      const columns = filterColumns(allColumns, selectedColumns);

      const result = await runExport({
        name: `Lyte Signals Export — ${new Date().toISOString().slice(0, 10)}`,
        dataSource: 'lyte_signals',
        format,
        columns,
        rows: rows as Record<string, unknown>[],
        triggeredByUserId: getUserId(req),
        triggeredByEmail: getUserEmail(req),
        scheduleFrequency: schedule,
      });

      res.setHeader('Content-Type', CONTENT_TYPES[format]);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="lyte-signals-${result.exportId}.${FILE_EXTENSIONS[format]}"`,
      );
      res.setHeader('X-Export-Id', result.exportId);
      res.setHeader('X-Download-Token', result.downloadToken);
      res.setHeader('X-Export-Expires', result.expiresAt.toISOString());
      res.setHeader('X-Row-Count', String(result.rowCount));
      res.send(result.buffer);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export Lyte signals');
    }
  },
);

// ─── MSP Tickets Export ───────────────────────────────────────────────────────

router.post(
  '/exports/msp-tickets',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateBody(
    bodyShape({
      columns: z.unknown().optional(),
      dateFrom: z.unknown().optional(),
      dateTo: z.unknown().optional(),
      format: z.unknown().optional(),
      schedule: z.unknown().optional(),
      search: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    if (!(await checkExportEnabled(res))) return;
    try {
      const {
        format = 'csv',
        schedule = 'once',
        status,
        search,
        dateFrom,
        dateTo,
        columns: selectedColumns,
      } = req.body as {
        format?: 'csv' | 'pdf' | 'xlsx';
        schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
        status?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        columns?: string[];
      };
      if (!['csv', 'pdf', 'xlsx'].includes(format)) return sendBadRequest(res, 'Invalid format');
      if (!['once', 'daily', 'weekly', 'monthly'].includes(schedule))
        return sendBadRequest(res, 'Invalid schedule');

      const conditions = [];
      if (dateFrom) conditions.push(gte(mspTicketsTable.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(mspTicketsTable.createdAt, new Date(dateTo)));
      if (status && status !== 'all') conditions.push(eq(mspTicketsTable.status, status as any));
      if (search)
        conditions.push(
          or(
            ilike(mspTicketsTable.subject, `%${search}%`),
            ilike(mspTicketsTable.category, `%${search}%`),
          )!,
        );
      const rows = await db
        .select()
        .from(mspTicketsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(mspTicketsTable.createdAt))
        .limit(10_000);
      const allColumns: ExportColumn[] = [
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
      const columns = filterColumns(allColumns, selectedColumns);

      const result = await runExport({
        name: `MSP Tickets Export — ${new Date().toISOString().slice(0, 10)}`,
        dataSource: 'msp_tickets',
        format,
        columns,
        rows: rows as Record<string, unknown>[],
        triggeredByUserId: getUserId(req),
        triggeredByEmail: getUserEmail(req),
        scheduleFrequency: schedule,
      });

      res.setHeader('Content-Type', CONTENT_TYPES[format]);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="msp-tickets-${result.exportId}.${FILE_EXTENSIONS[format]}"`,
      );
      res.setHeader('X-Export-Id', result.exportId);
      res.setHeader('X-Download-Token', result.downloadToken);
      res.setHeader('X-Export-Expires', result.expiresAt.toISOString());
      res.setHeader('X-Row-Count', String(result.rowCount));
      res.send(result.buffer);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export MSP tickets');
    }
  },
);

// ─── Usage Metering Export ───────────────────────────────────────────────────

router.post(
  '/exports/usage-metering',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateBody(
    bodyShape({
      columns: z.unknown().optional(),
      dateFrom: z.unknown().optional(),
      dateTo: z.unknown().optional(),
      format: z.unknown().optional(),
      orgId: z.unknown().optional(),
      schedule: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    if (!(await checkExportEnabled(res))) return;
    try {
      const {
        format = 'csv',
        schedule = 'once',
        dateFrom,
        dateTo,
        orgId,
        columns: selectedColumns,
      } = req.body as {
        format?: 'csv' | 'pdf' | 'xlsx';
        schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
        dateFrom?: string;
        dateTo?: string;
        orgId?: number;
        columns?: string[];
      };

      if (!['csv', 'pdf', 'xlsx'].includes(format))
        return sendBadRequest(res, 'Invalid format — must be csv, pdf, or xlsx');
      if (!['once', 'daily', 'weekly', 'monthly'].includes(schedule))
        return sendBadRequest(res, 'Invalid schedule');

      const conditions = [];
      if (dateFrom) conditions.push(gte(meteringEventsTable.occurredAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(meteringEventsTable.occurredAt, new Date(dateTo)));
      if (orgId) conditions.push(eq(meteringEventsTable.orgId, orgId));

      const rows = await db
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
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(meteringEventsTable.occurredAt))
        .limit(10_000);

      const allColumns: ExportColumn[] = [
        { key: 'id', label: 'ID' },
        { key: 'orgId', label: 'Org ID' },
        { key: 'featureKey', label: 'Feature' },
        { key: 'product', label: 'Product' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'unitLabel', label: 'Unit' },
        { key: 'occurredAt', label: 'Occurred At' },
      ];
      const columns = filterColumns(allColumns, selectedColumns);

      const result = await runExport({
        name: `Usage Metering Export — ${new Date().toISOString().slice(0, 10)}`,
        dataSource: 'metering_events',
        format,
        columns,
        rows: rows as Record<string, unknown>[],
        triggeredByUserId: getUserId(req),
        triggeredByEmail: getUserEmail(req),
        filterParams: JSON.stringify({ dateFrom, dateTo }),
        scheduleFrequency: schedule,
      });

      res.setHeader('Content-Type', CONTENT_TYPES[format]);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="usage-metering-${result.exportId}.${FILE_EXTENSIONS[format]}"`,
      );
      res.setHeader('X-Export-Id', result.exportId);
      res.setHeader('X-Download-Token', result.downloadToken);
      res.setHeader('X-Export-Expires', result.expiresAt.toISOString());
      res.setHeader('X-Row-Count', String(result.rowCount));
      res.send(result.buffer);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export usage metering');
    }
  },
);

// ─── Revenue Events (Invoices) Export ────────────────────────────────────────

router.post(
  '/exports/revenue-events',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateBody(
    bodyShape({
      columns: z.unknown().optional(),
      dateFrom: z.unknown().optional(),
      dateTo: z.unknown().optional(),
      format: z.unknown().optional(),
      orgId: z.unknown().optional(),
      schedule: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    if (!(await checkExportEnabled(res))) return;
    try {
      const {
        format = 'csv',
        schedule = 'once',
        dateFrom,
        dateTo,
        status,
        orgId,
        columns: selectedColumns,
      } = req.body as {
        format?: 'csv' | 'pdf' | 'xlsx';
        schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
        dateFrom?: string;
        dateTo?: string;
        status?: string;
        orgId?: number;
        columns?: string[];
      };

      if (!['csv', 'pdf', 'xlsx'].includes(format))
        return sendBadRequest(res, 'Invalid format — must be csv, pdf, or xlsx');
      if (!['once', 'daily', 'weekly', 'monthly'].includes(schedule))
        return sendBadRequest(res, 'Invalid schedule');

      const conditions = [];
      if (dateFrom) conditions.push(gte(invoicesTable.createdAt, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(invoicesTable.createdAt, new Date(dateTo)));
      if (status && status !== 'all')
        conditions.push(
          eq(invoicesTable.status, status as 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'),
        );
      if (orgId) conditions.push(eq(invoicesTable.orgId, orgId));

      const rows = await db
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
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(invoicesTable.createdAt))
        .limit(10_000);

      const allColumns: ExportColumn[] = [
        { key: 'id', label: 'ID' },
        { key: 'orgId', label: 'Org ID' },
        { key: 'stripeInvoiceId', label: 'Stripe Invoice' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'status', label: 'Status' },
        { key: 'paidAt', label: 'Paid At' },
        { key: 'createdAt', label: 'Created At' },
      ];
      const columns = filterColumns(allColumns, selectedColumns);

      const result = await runExport({
        name: `Revenue Events Export — ${new Date().toISOString().slice(0, 10)}`,
        dataSource: 'invoices',
        format,
        columns,
        rows: rows as Record<string, unknown>[],
        triggeredByUserId: getUserId(req),
        triggeredByEmail: getUserEmail(req),
        filterParams: JSON.stringify({ dateFrom, dateTo, status }),
        scheduleFrequency: schedule,
      });

      res.setHeader('Content-Type', CONTENT_TYPES[format]);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="revenue-events-${result.exportId}.${FILE_EXTENSIONS[format]}"`,
      );
      res.setHeader('X-Export-Id', result.exportId);
      res.setHeader('X-Download-Token', result.downloadToken);
      res.setHeader('X-Export-Expires', result.expiresAt.toISOString());
      res.setHeader('X-Row-Count', String(result.rowCount));
      res.send(result.buffer);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export revenue events');
    }
  },
);

// ─── Async Export Queue ───────────────────────────────────────────────────────
// Enqueues an export job and returns immediately with the exportId.
// The actual file generation runs in the background. Poll /exports/jobs/:exportId
// for status, then download via /exports/jobs/:exportId/download when completed.

router.post(
  '/exports/enqueue',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateBody(
    bodyShape({
      action: z.unknown().optional(),
      columns: z.unknown().optional(),
      dateFrom: z.unknown().optional(),
      dateTo: z.unknown().optional(),
      domain: z.unknown().optional(),
      format: z.unknown().optional(),
      orgId: z.unknown().optional(),
      schedule: z.unknown().optional(),
      search: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    if (!(await checkExportEnabled(res))) return;
    try {
      const {
        domain,
        format = 'csv',
        schedule = 'once',
        columns: selectedColumns,
        dateFrom,
        dateTo,
        search,
        status,
        orgId,
        action,
      } = req.body as {
        domain: string;
        format?: 'csv' | 'pdf' | 'xlsx';
        schedule?: 'once' | 'daily' | 'weekly' | 'monthly';
        columns?: string[];
        dateFrom?: string;
        dateTo?: string;
        search?: string;
        status?: string;
        orgId?: number;
        action?: string;
      };

      const VALID_DOMAINS = [
        'audit_events',
        'aegis_incidents',
        'vessels',
        'terra_deals',
        'lyte_signals',
        'msp_tickets',
        'usage_metering',
        'revenue_events',
      ];
      if (!domain || !VALID_DOMAINS.includes(domain))
        return sendBadRequest(res, `Invalid domain. Must be one of: ${VALID_DOMAINS.join(', ')}`);
      if (!['csv', 'pdf', 'xlsx'].includes(format))
        return sendBadRequest(res, 'Invalid format — must be csv, pdf, or xlsx');
      if (!['once', 'daily', 'weekly', 'monthly'].includes(schedule))
        return sendBadRequest(res, 'Invalid schedule');

      const exportId = randomUUID();
      const downloadToken = randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const DOMAIN_NAMES: Record<string, string> = {
        audit_events: 'Audit Log',
        aegis_incidents: 'Aegis Incidents',
        vessels: 'Vessels Fleet',
        terra_deals: 'Terra Deals',
        lyte_signals: 'Lyte Signals',
        msp_tickets: 'MSP Tickets',
        usage_metering: 'Usage Metering',
        revenue_events: 'Revenue Events',
      };
      const name = `${DOMAIN_NAMES[domain] ?? domain} Export — ${now.toISOString().slice(0, 10)}`;

      await db.insert(exportJobsTable).values({
        exportId,
        name,
        dataSource: domain,
        format,
        status: 'pending',
        triggeredByUserId: getUserId(req),
        triggeredByEmail: getUserEmail(req),
        filterParams: JSON.stringify({ dateFrom, dateTo, search, status, orgId, action }),
        scheduleFrequency: schedule,
        downloadToken,
        expiresAt,
      });

      await db
        .insert(auditEventsTable)
        .values({
          userId: getUserId(req),
          action: 'export.requested',
          entityType: 'export_job',
          entityId: exportId,
          newValues: {
            domain,
            format,
            schedule,
            columns: selectedColumns,
            dateFrom,
            dateTo,
            search,
            status,
            orgId,
          },
          ipAddress: hashIp((req as Request & { ip?: string }).ip ?? null),
          userAgent: (req.headers['user-agent'] as string) ?? null,
        })
        .catch(() => {});

      sendSuccess(res, { exportId, status: 'pending', name, format, expiresAt });

      setImmediate(async () => {
        try {
          await db
            .update(exportJobsTable)
            .set({ status: 'processing' })
            .where(eq(exportJobsTable.exportId, exportId));

          let rows: Record<string, unknown>[] = [];
          let allColumns: ExportColumn[] = [];
          const from = dateFrom ? new Date(dateFrom) : undefined;
          const to = dateTo ? new Date(dateTo) : undefined;

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
                conditions.push(eq(firestormFindingsTable.status, status as any));
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
                conditions.push(eq(vesselsTable.status, status as any));
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
                conditions.push(eq(terraDealsTable.stage, status as any));
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
                conditions.push(eq(lyteSignalsTable.status, status as any));
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
                conditions.push(eq(mspTicketsTable.status, status as any));
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
                conditions.push(eq(invoicesTable.status, status as any));
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
          }

          const columns = selectedColumns?.length
            ? allColumns.filter((c) => selectedColumns.includes(c.key))
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

          // Persist to GCS for durable re-downloads after server restarts.
          const ext = format === 'pdf' ? 'pdf' : format === 'xlsx' ? 'xlsx' : 'csv';
          const exportContentType =
            format === 'pdf'
              ? 'application/pdf'
              : format === 'xlsx'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'text/csv';
          let storageKey: string | null = null;
          try {
            const { ObjectStorageService: OSS } = await import('../lib/objectStorage');
            const oss = new OSS();
            storageKey = await oss.uploadBuffer(buffer, `exports/${exportId}.${ext}`, exportContentType);
          } catch {
            // GCS not configured — in-memory buffer will serve
          }

          // Build a durable download URL stored in the DB so clients can
          // retrieve it even after a server restart (via the job status endpoint).
          const downloadUrl = `/api/exports/jobs/${exportId}/download?token=${downloadToken}`;

          await db
            .update(exportJobsTable)
            .set({
              status: 'completed',
              rowCount,
              fileSizeBytes,
              completedAt: new Date(),
              downloadUrl,
              storageKey,
            })
            .where(eq(exportJobsTable.exportId, exportId));

          storeExportBuffer(exportId, buffer, expiresAt, format, name);

          await db
            .insert(auditEventsTable)
            .values({
              userId: getUserId(req),
              action: 'export.completed',
              entityType: 'export_job',
              entityId: exportId,
              newValues: { domain, format, rowCount, fileSizeBytes, name },
            })
            .catch(() => {});
        } catch (bgErr) {
          await db
            .update(exportJobsTable)
            .set({ status: 'failed', errorMessage: String(bgErr) })
            .where(eq(exportJobsTable.exportId, exportId))
            .catch(() => {});

          await db
            .insert(auditEventsTable)
            .values({
              userId: getUserId(req),
              action: 'export.failed',
              entityType: 'export_job',
              entityId: exportId,
              newValues: { domain, format, error: String(bgErr) },
            })
            .catch(() => {});
        }
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to enqueue export');
    }
  },
);

// ─── Export Job Status ────────────────────────────────────────────────────────

router.get(
  '/exports/jobs/:exportId',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  async (req: Request, res: Response) => {
    try {
      const { exportId } = req.params as { exportId: string };
      if (!exportId) return sendBadRequest(res, 'exportId is required');
      const job = await getExportJobStatus(exportId);
      if (!job) return sendNotFound(res, 'Export job');
      const hasBuffer = !!getExportBuffer(exportId);
      sendSuccess(res, {
        exportId: job.exportId,
        name: job.name,
        dataSource: job.dataSource,
        format: job.format,
        status: job.status,
        rowCount: job.rowCount,
        fileSizeBytes: job.fileSizeBytes,
        expiresAt: job.expiresAt,
        completedAt: job.completedAt,
        errorMessage: job.errorMessage,
        triggeredByEmail: job.triggeredByEmail,
        filterParams: job.filterParams,
        downloadAvailable: job.status === 'completed' && (hasBuffer || !!job.storageKey),
        downloadUrl: job.status === 'completed' ? (job.downloadUrl ?? null) : null,
        createdAt: job.createdAt,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch export job status');
    }
  },
);

// ─── Export Job Download ──────────────────────────────────────────────────────

router.get(
  '/exports/jobs/:exportId/download',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  async (req: Request, res: Response) => {
    try {
      const { exportId } = req.params as { exportId: string };
      const job = await getExportJobStatus(exportId);
      if (!job) return sendNotFound(res, 'Export job');
      if (job.status !== 'completed') {
        return sendError(
          res,
          `Export is not ready — status: ${job.status}`,
          409,
          'EXPORT_NOT_READY',
        );
      }
      if (job.expiresAt && job.expiresAt < new Date()) {
        return sendError(res, 'Export download link has expired', 410, 'EXPORT_EXPIRED');
      }
      // Try in-memory buffer first (fast path for recent exports), then GCS fallback.
      let fileBuffer: Buffer | null = null;
      let fileFormat = job.format ?? 'csv';
      let fileName = job.name ?? 'export';

      const stored = getExportBuffer(exportId);
      if (stored) {
        fileBuffer = stored.buffer;
        fileFormat = stored.format;
        fileName = stored.name;
      } else if (job.storageKey) {
        // In-memory buffer evicted — fetch from durable GCS storage.
        fileBuffer = await fetchExportBufferFromStorage(job.storageKey);
      }

      if (!fileBuffer) {
        return sendError(
          res,
          'Export file is no longer available. The download link may have expired or storage is unavailable. Please re-export.',
          410,
          'BUFFER_EXPIRED',
        );
      }

      const ext = fileFormat === 'pdf' ? 'pdf' : fileFormat === 'xlsx' ? 'xlsx' : 'csv';
      const contentType =
        fileFormat === 'pdf'
          ? 'application/pdf'
          : fileFormat === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv';
      const safeName = fileName.replace(/[^a-z0-9\-_.]/gi, '-').toLowerCase();
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeName}-${exportId.slice(0, 8)}.${ext}"`,
      );
      res.setHeader('X-Export-Id', exportId);
      res.setHeader('X-Row-Count', String(job.rowCount ?? 0));
      res.setHeader('X-Export-Expires', job.expiresAt?.toISOString() ?? '');
      res.send(fileBuffer);
    } catch (err) {
      handleRouteError(res, err, 'Failed to download export');
    }
  },
);

// ─── Generic Preview Endpoint ─────────────────────────────────────────────────
// Returns first N rows for any supported export domain as JSON (no file generated)

router.get(
  '/exports/preview',
  authMiddleware(),
  requireRole('admin', 'ops', 'compliance'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const {
        domain,
        limit: limitStr = '20',
        dateFrom,
        dateTo,
        status,
        search,
        orgId,
      } = req.query as Record<string, string>;
      const limit = Math.min(parseInt(limitStr, 10) || 20, 100);
      const from = dateFrom ? new Date(dateFrom) : undefined;
      const to = dateTo ? new Date(dateTo) : undefined;

      let rows: Record<string, unknown>[] = [];

      switch (domain) {
        case 'audit_events': {
          const w = and(
            from ? gte(auditEventsTable.createdAt, from) : undefined,
            to ? lte(auditEventsTable.createdAt, to) : undefined,
            search
              ? or(
                  ilike(auditEventsTable.action, `%${search}%`),
                  ilike(auditEventsTable.entityType, `%${search}%`),
                )!
              : undefined,
          );
          rows = (await db
            .select({
              id: auditEventsTable.id,
              action: auditEventsTable.action,
              entityType: auditEventsTable.entityType,
              entityId: auditEventsTable.entityId,
              ipAddress: auditEventsTable.ipAddress,
              createdAt: auditEventsTable.createdAt,
            })
            .from(auditEventsTable)
            .where(w)
            .orderBy(desc(auditEventsTable.createdAt))
            .limit(limit)) as Record<string, unknown>[];
          break;
        }
        case 'vessels': {
          const w = and(
            from ? gte(vesselsTable.createdAt, from) : undefined,
            to ? lte(vesselsTable.createdAt, to) : undefined,
            status ? eq(vesselsTable.status, status as any) : undefined,
            search
              ? or(
                  ilike(vesselsTable.name, `%${search}%`),
                  ilike(vesselsTable.mmsi, `%${search}%`),
                )!
              : undefined,
          );
          rows = (await db
            .select({
              id: vesselsTable.id,
              name: vesselsTable.name,
              mmsi: vesselsTable.mmsi,
              imo: vesselsTable.imo,
              type: vesselsTable.vesselType,
              flag: vesselsTable.flag,
              status: vesselsTable.status,
              createdAt: vesselsTable.createdAt,
            })
            .from(vesselsTable)
            .where(w)
            .orderBy(desc(vesselsTable.createdAt))
            .limit(limit)) as Record<string, unknown>[];
          break;
        }
        case 'terra_deals': {
          const w = and(
            from ? gte(terraDealsTable.createdAt, from) : undefined,
            to ? lte(terraDealsTable.createdAt, to) : undefined,
            status ? eq(terraDealsTable.stage, status as any) : undefined,
            search
              ? or(
                  ilike(terraDealsTable.address, `%${search}%`),
                  ilike(terraDealsTable.ownerName, `%${search}%`),
                )!
              : undefined,
          );
          rows = (await db
            .select({
              id: terraDealsTable.id,
              address: terraDealsTable.address,
              stage: terraDealsTable.stage,
              type: terraDealsTable.type,
              price: terraDealsTable.price,
              createdAt: terraDealsTable.createdAt,
            })
            .from(terraDealsTable)
            .where(w)
            .orderBy(desc(terraDealsTable.createdAt))
            .limit(limit)) as Record<string, unknown>[];
          break;
        }
        case 'lyte_signals': {
          const w = and(
            from ? gte(lyteSignalsTable.createdAt, from) : undefined,
            to ? lte(lyteSignalsTable.createdAt, to) : undefined,
            status ? eq(lyteSignalsTable.status, status as any) : undefined,
            search
              ? or(
                  ilike(lyteSignalsTable.title, `%${search}%`),
                  ilike(lyteSignalsTable.source, `%${search}%`),
                )!
              : undefined,
          );
          rows = (await db
            .select({
              id: lyteSignalsTable.id,
              title: lyteSignalsTable.title,
              severity: lyteSignalsTable.severity,
              status: lyteSignalsTable.status,
              source: lyteSignalsTable.source,
              createdAt: lyteSignalsTable.createdAt,
            })
            .from(lyteSignalsTable)
            .where(w)
            .orderBy(desc(lyteSignalsTable.createdAt))
            .limit(limit)) as Record<string, unknown>[];
          break;
        }
        case 'aegis_incidents': {
          const w = and(
            from ? gte(firestormFindingsTable.createdAt, from) : undefined,
            to ? lte(firestormFindingsTable.createdAt, to) : undefined,
            status ? eq(firestormFindingsTable.status, status as any) : undefined,
            search
              ? or(
                  ilike(firestormFindingsTable.title, `%${search}%`),
                  ilike(firestormFindingsTable.category, `%${search}%`),
                )!
              : undefined,
          );
          rows = (await db
            .select({
              id: firestormFindingsTable.id,
              title: firestormFindingsTable.title,
              severity: firestormFindingsTable.severity,
              status: firestormFindingsTable.status,
              category: firestormFindingsTable.category,
              createdAt: firestormFindingsTable.createdAt,
            })
            .from(firestormFindingsTable)
            .where(w)
            .orderBy(desc(firestormFindingsTable.createdAt))
            .limit(limit)) as Record<string, unknown>[];
          break;
        }
        case 'msp_tickets': {
          const w = and(
            from ? gte(mspTicketsTable.createdAt, from) : undefined,
            to ? lte(mspTicketsTable.createdAt, to) : undefined,
            status ? eq(mspTicketsTable.status, status as any) : undefined,
            search
              ? or(
                  ilike(mspTicketsTable.subject, `%${search}%`),
                  ilike(mspTicketsTable.category, `%${search}%`),
                )!
              : undefined,
          );
          rows = (await db
            .select({
              id: mspTicketsTable.id,
              subject: mspTicketsTable.subject,
              status: mspTicketsTable.status,
              priority: mspTicketsTable.priority,
              category: mspTicketsTable.category,
              createdAt: mspTicketsTable.createdAt,
            })
            .from(mspTicketsTable)
            .where(w)
            .orderBy(desc(mspTicketsTable.createdAt))
            .limit(limit)) as Record<string, unknown>[];
          break;
        }
        case 'usage_metering': {
          const numericOrgId = orgId && !Number.isNaN(parseInt(orgId, 10)) ? parseInt(orgId, 10) : undefined;
          const w = and(
            from ? gte(meteringEventsTable.occurredAt, from) : undefined,
            to ? lte(meteringEventsTable.occurredAt, to) : undefined,
            numericOrgId ? eq(meteringEventsTable.orgId, String(numericOrgId) as any) : undefined,
          );
          rows = (await db
            .select({
              id: meteringEventsTable.id,
              orgId: meteringEventsTable.orgId,
              featureKey: meteringEventsTable.featureKey,
              product: meteringEventsTable.product,
              quantity: meteringEventsTable.quantity,
              occurredAt: meteringEventsTable.occurredAt,
            })
            .from(meteringEventsTable)
            .where(w)
            .orderBy(desc(meteringEventsTable.occurredAt))
            .limit(limit)) as Record<string, unknown>[];
          break;
        }
        case 'revenue_events': {
          const numericOrgId = orgId && !Number.isNaN(parseInt(orgId, 10)) ? parseInt(orgId, 10) : undefined;
          const w = and(
            from ? gte(invoicesTable.createdAt, from) : undefined,
            to ? lte(invoicesTable.createdAt, to) : undefined,
            status
              ? eq(
                  invoicesTable.status,
                  status as 'draft' | 'open' | 'paid' | 'void' | 'uncollectible',
                )
              : undefined,
            numericOrgId ? eq(invoicesTable.orgId, numericOrgId) : undefined,
          );
          rows = (await db
            .select({
              id: invoicesTable.id,
              orgId: invoicesTable.orgId,
              amount: invoicesTable.amount,
              currency: invoicesTable.currency,
              status: invoicesTable.status,
              createdAt: invoicesTable.createdAt,
            })
            .from(invoicesTable)
            .where(w)
            .orderBy(desc(invoicesTable.createdAt))
            .limit(limit)) as Record<string, unknown>[];
          break;
        }
        default:
          return sendBadRequest(
            res,
            `Unknown domain: ${domain}. Supported: audit_events, aegis_incidents, vessels, terra_deals, lyte_signals, msp_tickets, usage_metering, revenue_events`,
          );
      }

      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to load export preview');
    }
  },
);

// ─── Export History ───────────────────────────────────────────────────────────
// Admin and compliance users see the full cross-user history.
// Ops users (and other export-capable roles) see only their own exports.

router.get(
  '/exports/history',
  authMiddleware(),
  requireRole('admin', 'compliance', 'ops'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
      const limit = Math.min(parseInt((req.query.limit as string) ?? '50', 10), 200);
      const offset = (page - 1) * limit;

      const userRoles = ((req as Request & { user?: { roles?: string[] } }).user?.roles ??
        []) as string[];
      const seesAllHistory = userRoles.some(
        (r) => r === 'super_admin' || r === 'admin' || r === 'compliance',
      );
      const userIdFilter = seesAllHistory ? null : getUserId(req);

      const result = await listExportHistory({ limit, offset, userId: userIdFilter });
      const now = new Date();
      const enriched = result.exports.map((job) => ({
        ...job,
        downloadAvailable:
          job.status === 'completed' &&
          (job.expiresAt == null || job.expiresAt > now) &&
          (!!getExportBuffer(job.exportId) || !!job.storageKey),
        expired: job.expiresAt != null && job.expiresAt <= now,
      }));
      sendSuccess(res, enriched, 200, { page, limit, total: result.total });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list export history');
    }
  },
);

// ─── Download by token (no auth required — token IS the credential) ───────────

router.get('/exports/download/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params as { token: string };
    if (!token) return sendBadRequest(res, 'Token is required');

    const job = await getExportByToken(token);
    if (!job) {
      sendNotFound(res, 'Export');
      return;
    }

    if (job.status !== 'completed') {
      sendError(res, `Export is not ready — status: ${job.status}`, 409, 'EXPORT_NOT_READY');
      return;
    }

    if (job.expiresAt && job.expiresAt < new Date()) {
      sendError(res, 'Export download link has expired', 410, 'EXPORT_EXPIRED');
      return;
    }

    res.json({
      exportId: job.exportId,
      name: job.name,
      dataSource: job.dataSource,
      format: job.format,
      status: job.status,
      rowCount: job.rowCount,
      fileSizeBytes: job.fileSizeBytes,
      expiresAt: job.expiresAt,
      completedAt: job.completedAt,
      triggeredByEmail: job.triggeredByEmail,
      message:
        'Re-trigger the export to download the file — files are generated on-demand and not stored server-side for security.',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch export');
  }
});

export default router;
