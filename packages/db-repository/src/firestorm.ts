/**
 * Firestorm Repository — typed access to security simulation tables.
 */
import {
  db,
  firestormScenariosTable,
  firestormSimulationRunsTable,
  firestormFindingsTable,
} from "@szl-holdings/db";
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
      .from(firestormSimulationRunsTable)
      .where(eq(firestormSimulationRunsTable.scenarioId, scenarioId))
      .orderBy(desc(firestormSimulationRunsTable.startedAt))
      .limit(limit);
  }

  async listFindingsForRun(simulationRunId: number) {
    return db
      .select()
      .from(firestormFindingsTable)
      .where(eq(firestormFindingsTable.simulationRunId, simulationRunId))
      .orderBy(desc(firestormFindingsTable.severity));
  }
}

export const firestormRepository = new FirestormRepository();
