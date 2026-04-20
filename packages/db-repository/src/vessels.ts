/**
 * Vessels Repository — typed access to vessel fleet and voyage tables.
 */
import { db, vesselPositionsTable, vesselsTable, voyagesTable } from '@szl-holdings/db';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

export class VesselsRepository {
  async findVesselById(id: number) {
    const rows = await db.select().from(vesselsTable).where(eq(vesselsTable.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findVesselByImo(imo: string) {
    const rows = await db
      .select()
      .from(vesselsTable)
      .where(eq(vesselsTable.imoNumber, imo))
      .limit(1);
    return rows[0] ?? null;
  }

  async listVessels(limit = 100) {
    return db.select().from(vesselsTable).orderBy(desc(vesselsTable.updatedAt)).limit(limit);
  }

  async listVoyagesForVessel(vesselId: number, limit = 20) {
    return db
      .select()
      .from(voyagesTable)
      .where(eq(voyagesTable.vesselId, vesselId))
      .orderBy(desc(voyagesTable.departureDatetime))
      .limit(limit);
  }

  async getLatestPosition(vesselId: number) {
    const rows = await db
      .select()
      .from(vesselPositionsTable)
      .where(eq(vesselPositionsTable.vesselId, vesselId))
      .orderBy(desc(vesselPositionsTable.timestamp))
      .limit(1);
    return rows[0] ?? null;
  }
}

export const vesselsRepository = new VesselsRepository();
