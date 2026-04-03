/**
 * Enriched Audit Logging
 *
 * Extends the base audit system with:
 * - Correlation IDs across request chains
 * - Service attribution (which service triggered the event)
 * - Export/download logging
 * - Admin action classification
 * - Actor attribution and resource context
 */

import { db, alloyAuditLogTable } from "@workspace/db";
import type { Request } from "express";

export type AdminActionClass =
  | "user_management"
  | "org_management"
  | "feature_flag"
  | "config_change"
  | "data_export"
  | "data_delete"
  | "approval_action"
  | "policy_change"
  | "system_action"
  | "security_action";

export interface EnrichedAuditParams {
  orgId?: number | null;
  userId?: number | null;
  action: string;
  resourceType: string;
  resourceId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  correlationId?: string | null;
  serviceAttribution?: string | null;
  adminActionClass?: AdminActionClass | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ExportAuditParams {
  orgId?: number | null;
  userId?: number | null;
  exportId: string;
  dataSource: string;
  format: string;
  rowCount: number;
  correlationId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  filterParams?: string;
}

export async function writeEnrichedAudit(params: EnrichedAuditParams): Promise<void> {
  try {
    await db.insert(alloyAuditLogTable).values({
      orgId: params.orgId ?? null,
      userId: params.userId ?? null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      before: params.before ?? null,
      after: params.after ?? null,
      correlationId: params.correlationId ?? null,
      serviceAttribution: params.serviceAttribution ?? null,
      adminActionClass: params.adminActionClass ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      metadata: {
        ...((params.metadata ?? {}) as Record<string, unknown>),
        enrichedAt: new Date().toISOString(),
      },
    });
  } catch {
  }
}

export async function writeExportAudit(params: ExportAuditParams): Promise<void> {
  try {
    await db.insert(alloyAuditLogTable).values({
      orgId: params.orgId ?? null,
      userId: params.userId ?? null,
      action: "export",
      resourceType: "data_export",
      resourceId: params.exportId,
      correlationId: params.correlationId ?? null,
      serviceAttribution: "export-service",
      adminActionClass: "data_export",
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      after: {
        exportId: params.exportId,
        dataSource: params.dataSource,
        format: params.format,
        rowCount: params.rowCount,
        filterParams: params.filterParams ?? null,
      },
      metadata: {
        enrichedAt: new Date().toISOString(),
      },
    });
  } catch {
  }
}

export function enrichAuditFromRequest(
  req: Request,
  base: Omit<EnrichedAuditParams, "correlationId" | "ipAddress" | "userAgent" | "userId">,
): EnrichedAuditParams {
  const user = (req as unknown as { user?: { id?: number } }).user;
  const reqWithCorrelation = req as unknown as { correlationId?: string };
  return {
    ...base,
    userId: user?.id ?? null,
    correlationId: reqWithCorrelation.correlationId ?? null,
    ipAddress: req.ip ?? null,
    userAgent: (req.headers["user-agent"] as string) ?? null,
  };
}
