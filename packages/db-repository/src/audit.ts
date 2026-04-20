/**
 * Audit Repository — typed access to audit log and activity tables.
 */
import { db, auditLogTable } from "@szl-holdings/db";
import { desc, eq, and, gte } from "drizzle-orm";

export interface AuditEntry {
  actor: string;
  action: string;
  resource?: string;
  resourceId?: string | number;
  orgId?: number;
  metadata?: Record<string, unknown>;
}

export class AuditRepository {
  async log(entry: AuditEntry) {
    await db.insert(auditLogTable).values({
      actor: entry.actor,
      action: entry.action,
      resource: entry.resource ?? null,
      resourceId: entry.resourceId != null ? String(entry.resourceId) : null,
      orgId: entry.orgId ?? null,
      metadata: entry.metadata ?? null,
    });
  }

  async list(orgId?: number, since?: Date, limit = 50) {
    const conditions = [];
    if (orgId != null) conditions.push(eq(auditLogTable.orgId, orgId));
    if (since != null) conditions.push(gte(auditLogTable.createdAt, since));

    return db
      .select()
      .from(auditLogTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogTable.createdAt))
      .limit(limit);
  }
}

export const auditRepository = new AuditRepository();
