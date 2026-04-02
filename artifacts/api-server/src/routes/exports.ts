import { Router, type IRouter, type Request, type Response } from "express";
import {
  db, auditEventsTable, usersTable,
  firestormFindingsTable,
  lyteSignalsTable, lyteIncidentsTable,
  vesselsFleetsTable, vesselsTable,
  terraDealsTable,
  mspTicketsTable,
} from "@workspace/db";
import { desc, gte, lte, and, ilike, or, sql } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { isFlagEnabled } from "../lib/platform-flags";
import { runExport, getExportByToken, listExportHistory } from "../lib/export-service";
import type { ExportColumn } from "../lib/export-service";
import { handleRouteError, sendSuccess, sendError, sendBadRequest } from "../lib/api-response";

interface AuthUser { id: number; role: string; email?: string; displayName?: string }
type ExtendedRequest = Request & { user?: AuthUser }

const router: IRouter = Router();

const CONTENT_TYPES: Record<string, string> = {
  csv: "text/csv",
  pdf: "application/pdf",
};

const FILE_EXTENSIONS: Record<string, string> = {
  csv: "csv",
  pdf: "pdf",
};

function getUserId(req: Request): number | null {
  return (req as ExtendedRequest).user?.id ?? null;
}

function getUserEmail(req: Request): string | null {
  return (req as ExtendedRequest).user?.email ?? null;
}

async function checkExportEnabled(res: Response): Promise<boolean> {
  const enabled = await isFlagEnabled("advanced_export_enabled");
  if (!enabled) {
    res.status(403).json({ error: "Advanced export is not enabled", feature: "advanced_export_enabled" });
    return false;
  }
  return true;
}

// ─── Audit Log Export ────────────────────────────────────────────────────────

router.post("/exports/audit-log", authMiddleware(), requireRole("admin", "compliance"), async (req: Request, res: Response) => {
  if (!await checkExportEnabled(res)) return;
  try {
    const {
      format = "csv",
      dateFrom,
      dateTo,
      search,
      action,
      schedule = "once",
    } = req.body as {
      format?: "csv" | "pdf";
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      action?: string;
      schedule?: "once" | "daily" | "weekly";
    };

    if (!["csv", "pdf"].includes(format)) return sendBadRequest(res, "Invalid format — must be csv or pdf");
    if (!["once", "daily", "weekly"].includes(schedule)) return sendBadRequest(res, "Invalid schedule");

    const conditions = [];
    if (dateFrom) conditions.push(gte(auditEventsTable.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(auditEventsTable.createdAt, new Date(dateTo)));
    if (action) conditions.push(ilike(auditEventsTable.action, `%${action}%`));
    else if (search) {
      conditions.push(
        or(
          ilike(auditEventsTable.action, `%${search}%`),
          ilike(auditEventsTable.entityType, `%${search}%`),
        )!
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

    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "createdAt", label: "Timestamp" },
      { key: "action", label: "Action" },
      { key: "entityType", label: "Entity Type" },
      { key: "entityId", label: "Entity ID" },
      { key: "userEmail", label: "Actor Email" },
      { key: "userName", label: "Actor Name" },
      { key: "ipAddress", label: "IP Address" },
      { key: "userAgent", label: "User Agent" },
    ];

    const filterParams = JSON.stringify({ dateFrom, dateTo, search, action });
    const name = `Audit Log Export — ${new Date().toISOString().slice(0, 10)}`;

    const result = await runExport({
      name,
      dataSource: "audit_events",
      format,
      columns,
      rows: rows as Record<string, unknown>[],
      triggeredByUserId: getUserId(req),
      triggeredByEmail: getUserEmail(req),
      filterParams,
      scheduleFrequency: schedule,
    });

    res.setHeader("Content-Type", CONTENT_TYPES[format] ?? "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="audit-log-${result.exportId}.${FILE_EXTENSIONS[format]}"`);
    res.setHeader("X-Export-Id", result.exportId);
    res.setHeader("X-Download-Token", result.downloadToken);
    res.setHeader("X-Export-Expires", result.expiresAt.toISOString());
    res.setHeader("X-Row-Count", String(result.rowCount));
    res.send(result.buffer);
  } catch (err) {
    handleRouteError(res, err, "Failed to export audit log");
  }
});

// ─── Aegis Incidents (Firestorm Findings) Export ─────────────────────────────

router.post("/exports/aegis-incidents", authMiddleware(), requireRole("admin", "ops", "compliance"), async (req: Request, res: Response) => {
  if (!await checkExportEnabled(res)) return;
  try {
    const { format = "csv", schedule = "once" } = req.body as { format?: "csv" | "pdf"; schedule?: "once" | "daily" | "weekly" };
    if (!["csv", "pdf"].includes(format)) return sendBadRequest(res, "Invalid format");

    const rows = await db.select().from(firestormFindingsTable).orderBy(desc(firestormFindingsTable.createdAt)).limit(10_000);
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "createdAt", label: "Created At" },
      { key: "title", label: "Title" },
      { key: "severity", label: "Severity" },
      { key: "status", label: "Status" },
      { key: "category", label: "Category" },
      { key: "description", label: "Description" },
      { key: "recommendation", label: "Recommendation" },
    ];

    const result = await runExport({
      name: `Aegis Incidents Export — ${new Date().toISOString().slice(0, 10)}`,
      dataSource: "firestorm_findings",
      format,
      columns,
      rows: rows as Record<string, unknown>[],
      triggeredByUserId: getUserId(req),
      triggeredByEmail: getUserEmail(req),
      scheduleFrequency: schedule,
    });

    res.setHeader("Content-Type", CONTENT_TYPES[format]);
    res.setHeader("Content-Disposition", `attachment; filename="aegis-incidents-${result.exportId}.${FILE_EXTENSIONS[format]}"`);
    res.setHeader("X-Export-Id", result.exportId);
    res.setHeader("X-Download-Token", result.downloadToken);
    res.setHeader("X-Export-Expires", result.expiresAt.toISOString());
    res.setHeader("X-Row-Count", String(result.rowCount));
    res.send(result.buffer);
  } catch (err) {
    handleRouteError(res, err, "Failed to export Aegis incidents");
  }
});

// ─── Vessels Fleet Export ─────────────────────────────────────────────────────

router.post("/exports/vessels", authMiddleware(), requireRole("admin", "ops", "compliance"), async (req: Request, res: Response) => {
  if (!await checkExportEnabled(res)) return;
  try {
    const { format = "csv", schedule = "once" } = req.body as { format?: "csv" | "pdf"; schedule?: "once" | "daily" | "weekly" };
    if (!["csv", "pdf"].includes(format)) return sendBadRequest(res, "Invalid format");

    const rows = await db.select().from(vesselsTable).orderBy(desc(vesselsTable.createdAt)).limit(10_000);
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "createdAt", label: "Created At" },
      { key: "name", label: "Vessel Name" },
      { key: "mmsi", label: "MMSI" },
      { key: "imo", label: "IMO" },
      { key: "type", label: "Type" },
      { key: "flag", label: "Flag" },
      { key: "status", label: "Status" },
      { key: "currentPort", label: "Current Port" },
      { key: "nextPort", label: "Next Port" },
      { key: "grossTonnage", label: "Gross Tonnage" },
    ];

    const result = await runExport({
      name: `Vessels Fleet Export — ${new Date().toISOString().slice(0, 10)}`,
      dataSource: "vessels",
      format,
      columns,
      rows: rows as Record<string, unknown>[],
      triggeredByUserId: getUserId(req),
      triggeredByEmail: getUserEmail(req),
      scheduleFrequency: schedule,
    });

    res.setHeader("Content-Type", CONTENT_TYPES[format]);
    res.setHeader("Content-Disposition", `attachment; filename="vessels-fleet-${result.exportId}.${FILE_EXTENSIONS[format]}"`);
    res.setHeader("X-Export-Id", result.exportId);
    res.setHeader("X-Download-Token", result.downloadToken);
    res.setHeader("X-Export-Expires", result.expiresAt.toISOString());
    res.setHeader("X-Row-Count", String(result.rowCount));
    res.send(result.buffer);
  } catch (err) {
    handleRouteError(res, err, "Failed to export vessels fleet");
  }
});

// ─── Terra Deals Export ───────────────────────────────────────────────────────

router.post("/exports/terra-deals", authMiddleware(), requireRole("admin", "ops", "compliance"), async (req: Request, res: Response) => {
  if (!await checkExportEnabled(res)) return;
  try {
    const { format = "csv", schedule = "once" } = req.body as { format?: "csv" | "pdf"; schedule?: "once" | "daily" | "weekly" };
    if (!["csv", "pdf"].includes(format)) return sendBadRequest(res, "Invalid format");

    const rows = await db.select().from(terraDealsTable).orderBy(desc(terraDealsTable.createdAt)).limit(10_000);
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "createdAt", label: "Created At" },
      { key: "address", label: "Address" },
      { key: "borough", label: "Borough" },
      { key: "zipCode", label: "Zip Code" },
      { key: "stage", label: "Stage" },
      { key: "type", label: "Deal Type" },
      { key: "price", label: "Price" },
      { key: "askingPrice", label: "Asking Price" },
      { key: "riskLevel", label: "Risk Level" },
      { key: "ownerName", label: "Owner" },
      { key: "clientName", label: "Client" },
      { key: "estimatedCloseDate", label: "Est. Close Date" },
    ];

    const result = await runExport({
      name: `Terra Deals Export — ${new Date().toISOString().slice(0, 10)}`,
      dataSource: "terra_deals",
      format,
      columns,
      rows: rows as Record<string, unknown>[],
      triggeredByUserId: getUserId(req),
      triggeredByEmail: getUserEmail(req),
      scheduleFrequency: schedule,
    });

    res.setHeader("Content-Type", CONTENT_TYPES[format]);
    res.setHeader("Content-Disposition", `attachment; filename="terra-deals-${result.exportId}.${FILE_EXTENSIONS[format]}"`);
    res.setHeader("X-Export-Id", result.exportId);
    res.setHeader("X-Download-Token", result.downloadToken);
    res.setHeader("X-Export-Expires", result.expiresAt.toISOString());
    res.setHeader("X-Row-Count", String(result.rowCount));
    res.send(result.buffer);
  } catch (err) {
    handleRouteError(res, err, "Failed to export Terra deals");
  }
});

// ─── Lyte Signals Export ──────────────────────────────────────────────────────

router.post("/exports/lyte-signals", authMiddleware(), requireRole("admin", "ops", "compliance"), async (req: Request, res: Response) => {
  if (!await checkExportEnabled(res)) return;
  try {
    const { format = "csv", schedule = "once" } = req.body as { format?: "csv" | "pdf"; schedule?: "once" | "daily" | "weekly" };
    if (!["csv", "pdf"].includes(format)) return sendBadRequest(res, "Invalid format");

    const rows = await db.select().from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.createdAt)).limit(10_000);
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "createdAt", label: "Created At" },
      { key: "title", label: "Signal Title" },
      { key: "severity", label: "Severity" },
      { key: "status", label: "Status" },
      { key: "source", label: "Source" },
      { key: "sourceType", label: "Source Type" },
      { key: "description", label: "Description" },
    ];

    const result = await runExport({
      name: `Lyte Signals Export — ${new Date().toISOString().slice(0, 10)}`,
      dataSource: "lyte_signals",
      format,
      columns,
      rows: rows as Record<string, unknown>[],
      triggeredByUserId: getUserId(req),
      triggeredByEmail: getUserEmail(req),
      scheduleFrequency: schedule,
    });

    res.setHeader("Content-Type", CONTENT_TYPES[format]);
    res.setHeader("Content-Disposition", `attachment; filename="lyte-signals-${result.exportId}.${FILE_EXTENSIONS[format]}"`);
    res.setHeader("X-Export-Id", result.exportId);
    res.setHeader("X-Download-Token", result.downloadToken);
    res.setHeader("X-Export-Expires", result.expiresAt.toISOString());
    res.setHeader("X-Row-Count", String(result.rowCount));
    res.send(result.buffer);
  } catch (err) {
    handleRouteError(res, err, "Failed to export Lyte signals");
  }
});

// ─── MSP Tickets Export ───────────────────────────────────────────────────────

router.post("/exports/msp-tickets", authMiddleware(), requireRole("admin", "ops", "compliance"), async (req: Request, res: Response) => {
  if (!await checkExportEnabled(res)) return;
  try {
    const { format = "csv", schedule = "once" } = req.body as { format?: "csv" | "pdf"; schedule?: "once" | "daily" | "weekly" };
    if (!["csv", "pdf"].includes(format)) return sendBadRequest(res, "Invalid format");

    const rows = await db.select().from(mspTicketsTable).orderBy(desc(mspTicketsTable.createdAt)).limit(10_000);
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "createdAt", label: "Created At" },
      { key: "ticketNumber", label: "Ticket Number" },
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "category", label: "Category" },
      { key: "clientName", label: "Client" },
      { key: "assigneeName", label: "Assignee" },
      { key: "slaStatus", label: "SLA Status" },
      { key: "resolvedAt", label: "Resolved At" },
    ];

    const result = await runExport({
      name: `MSP Tickets Export — ${new Date().toISOString().slice(0, 10)}`,
      dataSource: "msp_tickets",
      format,
      columns,
      rows: rows as Record<string, unknown>[],
      triggeredByUserId: getUserId(req),
      triggeredByEmail: getUserEmail(req),
      scheduleFrequency: schedule,
    });

    res.setHeader("Content-Type", CONTENT_TYPES[format]);
    res.setHeader("Content-Disposition", `attachment; filename="msp-tickets-${result.exportId}.${FILE_EXTENSIONS[format]}"`);
    res.setHeader("X-Export-Id", result.exportId);
    res.setHeader("X-Download-Token", result.downloadToken);
    res.setHeader("X-Export-Expires", result.expiresAt.toISOString());
    res.setHeader("X-Row-Count", String(result.rowCount));
    res.send(result.buffer);
  } catch (err) {
    handleRouteError(res, err, "Failed to export MSP tickets");
  }
});

// ─── Export History (admin only) ──────────────────────────────────────────────

router.get("/exports/history", authMiddleware(), requireRole("admin", "compliance"), async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query["page"] as string ?? "1", 10));
    const limit = Math.min(parseInt(req.query["limit"] as string ?? "50", 10), 200);
    const offset = (page - 1) * limit;

    const result = await listExportHistory({ limit, offset });
    sendSuccess(res, result.exports, 200, { page, limit, total: result.total });
  } catch (err) {
    handleRouteError(res, err, "Failed to list export history");
  }
});

// ─── Download by token (no auth required — token IS the credential) ───────────

router.get("/exports/download/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params as { token: string };
    if (!token) return sendBadRequest(res, "Token is required");

    const job = await getExportByToken(token);
    if (!job) {
      res.status(404).json({ error: "Export not found or token invalid" });
      return;
    }

    if (job.status !== "completed") {
      res.status(409).json({ error: `Export is not ready — status: ${job.status}` });
      return;
    }

    if (job.expiresAt && job.expiresAt < new Date()) {
      res.status(410).json({ error: "Export download link has expired" });
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
      message: "Re-trigger the export to download the file — files are generated on-demand and not stored server-side for security.",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch export");
  }
});

export default router;
