/**
 * Audit Repository — typed access to audit log and activity tables.
 */
import { db, auditLogsTable } from "@szl-holdings/db";
import { desc, eq, and, gte } from "drizzle-orm";

export interface AuditEntry {
  actorUserId?: number;
  actionType: string;
  entityType: string;
  entityId?: string;
  organizationId?: number;
  payloadJson?: Record<string, unknown>;
}

export class AuditRepository {
  async log(entry: AuditEntry) {
    await db.insert(auditLogsTable).values({
      ...(entry.actorUserId !== undefined ? { actorUserId: entry.actorUserId } : {}),
      actionType: entry.actionType,
      entityType: entry.entityType,
      ...(entry.entityId !== undefined ? { entityId: entry.entityId } : {}),
      ...(entry.organizationId !== undefined ? { organizationId: entry.organizationId } : {}),
      ...(entry.payloadJson !== undefined ? { payloadJson: entry.payloadJson } : {}),
    });
  }

  async list(organizationId?: number, since?: Date, limit = 50) {
    const conditions = [];
    if (organizationId != null) conditions.push(eq(auditLogsTable.organizationId, organizationId));
    if (since != null) conditions.push(gte(auditLogsTable.createdAt, since));

    return db
      .select()
      .from(auditLogsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit);
  }
}

export const auditRepository = new AuditRepository();
