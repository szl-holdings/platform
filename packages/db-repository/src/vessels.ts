/**
 * Vessels Repository — typed access to vessel fleet tables.
 */
import {
  db,
  vesselsTable,
  vesselsPositionsTable,
  voyagesTable,
} from "@szl-holdings/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export class VesselsRepository {
  async findVesselById(id: number) {
    const rows = await db.select().from(vesselsTable).where(eq(vesselsTable.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findVesselByImo(imo: string) {
    const rows = await db
      .select()
      .from(vesselsTable)
      .where(eq(vesselsTable.imo, imo))
      .limit(1);
    return rows[0] ?? null;
  }

  async listVessels(limit = 100) {
    return db.select().from(vesselsTable).orderBy(desc(vesselsTable.updatedAt)).limit(limit);
  }

  async getLatestPosition(vesselId: number) {
    const rows = await db
      .select()
      .from(vesselsPositionsTable)
      .where(eq(vesselsPositionsTable.vesselId, vesselId))
      .orderBy(desc(vesselsPositionsTable.recordedAt))
      .limit(1);
    return rows[0] ?? null;
  }
}

export const vesselsRepository = new VesselsRepository();
