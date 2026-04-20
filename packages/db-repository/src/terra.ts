/**
 * Terra Repository — typed access to real estate property and deal tables.
 */
import {
  db,
  propertiesTable,
  dealPipelinesTable,
  propertyValuationsTable,
} from "@szl-holdings/db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export class TerraRepository {
  async findPropertyById(id: number) {
    const rows = await db
      .select()
      .from(propertiesTable)
      .where(eq(propertiesTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async listProperties(limit = 100) {
    return db
      .select()
      .from(propertiesTable)
      .orderBy(desc(propertiesTable.updatedAt))
      .limit(limit);
  }

  async listDeals(propertyId?: number, limit = 50) {
    const where = propertyId != null ? eq(dealPipelinesTable.propertyId, propertyId) : undefined;
    return db
      .select()
      .from(dealPipelinesTable)
      .where(where)
      .orderBy(desc(dealPipelinesTable.createdAt))
      .limit(limit);
  }

  async getLatestValuation(propertyId: number) {
    const rows = await db
      .select()
      .from(propertyValuationsTable)
      .where(eq(propertyValuationsTable.propertyId, propertyId))
      .orderBy(desc(propertyValuationsTable.valuationDate))
      .limit(1);
    return rows[0] ?? null;
  }
}

export const terraRepository = new TerraRepository();
