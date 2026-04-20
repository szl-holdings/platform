/**
 * Firestorm Repository — typed access to security simulation tables.
 */
import {
  db,
  firestormFindingsTable,
  firestormRunsTable,
  firestormScenariosTable,
} from '@szl-holdings/db';
import { desc, eq } from 'drizzle-orm';

export class FirestormRepository {
  async findScenarioById(id: number) {
    const rows = await db
      .select()
      .from(firestormScenariosTable)
      .where(eq(firestormScenariosTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async listScenarios(limit = 50) {
    return db
      .select()
      .from(firestormScenariosTable)
      .orderBy(desc(firestormScenariosTable.createdAt))
      .limit(limit);
  }

  async listRunsForScenario(scenarioId: number, limit = 20) {
    return db
      .select()
      .from(firestormRunsTable)
      .where(eq(firestormRunsTable.scenarioId, scenarioId))
      .orderBy(desc(firestormRunsTable.startedAt))
      .limit(limit);
  }

  async listFindingsForRun(runId: number) {
    return db
      .select()
      .from(firestormFindingsTable)
      .where(eq(firestormFindingsTable.runId, runId))
      .orderBy(desc(firestormFindingsTable.severity));
  }
}

export const firestormRepository = new FirestormRepository();
