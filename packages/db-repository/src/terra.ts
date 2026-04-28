/**
 * DOMAINE Repository — typed access to real estate property and deal tables.
 */
import {
  db,
  terraPropertiesTable,
  terraDealsTable,
} from "@szl-holdings/db";
import { desc, eq, } from "drizzle-orm";

export class TerraRepository {
  async findPropertyById(id: number) {
    const rows = await db
      .select()
      .from(terraPropertiesTable)
      .where(eq(terraPropertiesTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async listProperties(limit = 100) {
    return db
      .select()
      .from(terraPropertiesTable)
      .orderBy(desc(terraPropertiesTable.updatedAt))
      .limit(limit);
  }

  async listDeals(limit = 50) {
    return db
      .select()
      .from(terraDealsTable)
      .orderBy(desc(terraDealsTable.createdAt))
      .limit(limit);
  }
}

export const terraRepository = new TerraRepository();
