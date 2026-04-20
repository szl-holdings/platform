/**
 * Alloy Repository — typed access to workflow, run, and signal tables.
 */
import {
  alloySignalsTable,
  alloyWorkflowRunsTable,
  alloyWorkflowsTable,
  db,
} from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';

export class AlloyRepository {
  async findWorkflowById(id: number) {
    const rows = await db
      .select()
      .from(alloyWorkflowsTable)
      .where(eq(alloyWorkflowsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async listWorkflows(orgId?: number, limit = 50) {
    const query = db
      .select()
      .from(alloyWorkflowsTable)
      .orderBy(desc(alloyWorkflowsTable.createdAt))
      .limit(limit);
    return query;
  }

  async listRunsForWorkflow(workflowId: number, limit = 20) {
    return db
      .select()
      .from(alloyWorkflowRunsTable)
      .where(eq(alloyWorkflowRunsTable.workflowId, workflowId))
      .orderBy(desc(alloyWorkflowRunsTable.createdAt))
      .limit(limit);
  }

  async findLatestSignal(workflowId: number) {
    const rows = await db
      .select()
      .from(alloySignalsTable)
      .where(eq(alloySignalsTable.workflowId, workflowId))
      .orderBy(desc(alloySignalsTable.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }
}

export const alloyRepository = new AlloyRepository();
