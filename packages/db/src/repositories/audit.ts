/**
 * Audit repository — append-only event log query helpers.
 * Uses @szl-holdings/db as the single relational entry point.
 */
import { auditLogsTable, db } from '@szl-holdings/db';
import { and, desc, eq, gte } from 'drizzle-orm';

export type AuditLogRow = typeof auditLogsTable.$inferSelect;
export type NewAuditLog = typeof auditLogsTable.$inferInsert;

export const auditRepo = {
  async append(entry: NewAuditLog): Promise<AuditLogRow> {
    const [row] = await db.insert(auditLogsTable).values(entry).returning();
    if (!row) throw new Error('Failed to write audit log entry');
    return row;
  },

  async listForOrg(
    orgId: number,
    options: { limit?: number; since?: Date; entityType?: string } = {},
  ): Promise<AuditLogRow[]> {
    const { limit = 50, since, entityType } = options;
    const conditions = [eq(auditLogsTable.organizationId, orgId)];
    if (since) conditions.push(gte(auditLogsTable.createdAt, since));
    if (entityType) conditions.push(eq(auditLogsTable.entityType, entityType));
    return db
      .select()
      .from(auditLogsTable)
      .where(and(...conditions))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit);
  },

  async listForEntity(entityType: string, entityId: string, limit = 50): Promise<AuditLogRow[]> {
    return db
      .select()
      .from(auditLogsTable)
      .where(and(eq(auditLogsTable.entityType, entityType), eq(auditLogsTable.entityId, entityId)))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit);
  },
};
