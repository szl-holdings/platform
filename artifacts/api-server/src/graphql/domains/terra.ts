import { parseIntId } from "../utils";
import { publish, WS_CHANNELS } from "../../lib/websocket";
import { pubsub, TERRA_EVENTS } from "../../lib/pubsub-bridge";

export const terraTypeDefs = `#graphql
  type TerraProperty {
    id: ID!
    address: String
    propertyType: String
    sqft: Int
    ownerName: String
    createdAt: String
  }

  type TerraListing {
    id: ID!
    propertyId: ID
    agentId: ID
    listPrice: String
    status: String
    daysOnMarket: Int
    createdAt: String
  }

  type TerraDistressProperty {
    id: ID!
    address: String
    borough: String
    distressType: String
    opportunityScore: Float
    auctionDate: String
    createdAt: String
  }

  type TerraDeal {
    id: ID!
    address: String
    stage: String
    price: String
    probability: Int
    distressPropertyId: ID
    createdAt: String
  }

  type TerraLead {
    id: ID!
    firstName: String!
    lastName: String!
    type: String
    score: Int
    stage: String
    createdAt: String
  }

  type TerraActionItem {
    id: ID!
    externalId: String
    propertyId: String!
    issue: String!
    severity: String!
    ownerName: String!
    ownerRole: String!
    dueDate: String
    status: String!
    recommendedAction: String
    resolvedAt: String
    createdAt: String
    updatedAt: String
  }

  extend type Query {
    terraProperties(limit: Int, offset: Int): [TerraProperty!]!
    terraListings(status: String, limit: Int, offset: Int): [TerraListing!]!
    terraDistressProperties(borough: String, distressType: String, limit: Int, offset: Int): [TerraDistressProperty!]!
    terraDeals(stage: String, limit: Int, offset: Int): [TerraDeal!]!
    terraDeal(id: ID!): TerraDeal
    terraLeads(stage: String, limit: Int, offset: Int): [TerraLead!]!
    terraActionItems(propertyId: String, status: String, limit: Int, offset: Int): [TerraActionItem!]!
  }

  extend type Mutation {
    updateTerraDeal(id: ID!, stage: String, probability: Int): TerraDeal!
    createTerraLead(firstName: String!, lastName: String!, type: String): TerraLead!
    updateTerraActionItem(id: ID!, status: String, recommendedAction: String): TerraActionItem!
    seedTerraActionItems(propertyId: String!): [TerraActionItem!]!
  }

  extend type Subscription {
    terraDealUpdated: TerraDeal!
    terraActionItemUpdated: TerraActionItem!
  }
`;

export const terraResolvers = {
  Query: {
    terraProperties: async (_: unknown, args: { limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraPropertiesTable } = await import("@szl-holdings/db/schema");
        const { desc } = await import("drizzle-orm");
        return await db.select().from(terraPropertiesTable).orderBy(desc(terraPropertiesTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
      } catch {
        return [];
      }
    },
    terraListings: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraListingsTable } = await import("@szl-holdings/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(terraListingsTable).orderBy(desc(terraListingsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.status) {
          return await query.where(eq(terraListingsTable.status, args.status as any));
        }
        return await query;
      } catch {
        return [];
      }
    },
    terraDistressProperties: async (_: unknown, args: { borough?: string; distressType?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraDistressPropertiesTable } = await import("@szl-holdings/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions = [];
        if (args.borough) conditions.push(eq(terraDistressPropertiesTable.borough, args.borough as any));
        if (args.distressType) conditions.push(eq(terraDistressPropertiesTable.distressType, args.distressType as any));
        const query = db.select().from(terraDistressPropertiesTable).orderBy(desc(terraDistressPropertiesTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (conditions.length > 0) {
          return await query.where(and(...conditions));
        }
        return await query;
      } catch {
        return [];
      }
    },
    terraDeals: async (_: unknown, args: { stage?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraDealsTable } = await import("@szl-holdings/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(terraDealsTable).orderBy(desc(terraDealsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.stage) {
          return await query.where(eq(terraDealsTable.stage, args.stage as any));
        }
        return await query;
      } catch {
        return [];
      }
    },
    terraDeal: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraDealsTable } = await import("@szl-holdings/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(terraDealsTable).where(eq(terraDealsTable.id, parseIntId(args.id))).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    terraLeads: async (_: unknown, args: { stage?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraLeadsTable } = await import("@szl-holdings/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(terraLeadsTable).orderBy(desc(terraLeadsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.stage) {
          return await query.where(eq(terraLeadsTable.stage, args.stage as any));
        }
        return await query;
      } catch {
        return [];
      }
    },
    terraActionItems: async (_: unknown, args: { propertyId?: string; status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraActionItemsTable } = await import("@szl-holdings/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.propertyId) conditions.push(eq(terraActionItemsTable.propertyId, args.propertyId));
        if (args.status) conditions.push(eq(terraActionItemsTable.status, args.status as "open" | "in_progress" | "resolved"));
        const baseQuery = db.select().from(terraActionItemsTable)
          .orderBy(desc(terraActionItemsTable.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
        if (conditions.length > 0) return await baseQuery.where(and(...conditions));
        return await baseQuery;
      } catch {
        return [];
      }
    },
  },
  Mutation: {
    updateTerraDeal: async (_: unknown, args: { id: string; stage?: string; probability?: number }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraDealsTable } = await import("@szl-holdings/db/schema");
        const { eq } = await import("drizzle-orm");
        const updateData: Record<string, unknown> = {};
        if (args.stage) updateData.stage = args.stage;
        if (args.probability != null) updateData.probability = args.probability;
        const rows = await db
          .update(terraDealsTable)
          .set(updateData)
          .where(eq(terraDealsTable.id, parseIntId(args.id)))
          .returning();
        const deal = rows[0];
        publish(WS_CHANNELS.TERRA_SIGNALS, "deal-updated", {
          id: deal.id,
          stage: (deal as Record<string, unknown>).stage,
          probability: (deal as Record<string, unknown>).probability,
        });
        pubsub.publish(TERRA_EVENTS.DEAL_UPDATED, { terraDealUpdated: deal });
        return deal;
      } catch (err) {
        throw new Error(`Failed to update deal: ${err}`);
      }
    },
    createTerraLead: async (_: unknown, args: { firstName: string; lastName: string; type?: string }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraLeadsTable } = await import("@szl-holdings/db/schema");
        const rows = await db
          .insert(terraLeadsTable)
          .values({ firstName: args.firstName, lastName: args.lastName, type: args.type ?? "buyer", stage: "new" } as any)
          .returning();
        return rows[0];
      } catch (err) {
        throw new Error(`Failed to create lead: ${err}`);
      }
    },
    updateTerraActionItem: async (_: unknown, args: { id: string; status?: string; recommendedAction?: string }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraActionItemsTable } = await import("@szl-holdings/db/schema");
        const { eq } = await import("drizzle-orm");
        const numericId = parseIntId(args.id);
        const existing = await db.select({ status: terraActionItemsTable.status })
          .from(terraActionItemsTable)
          .where(eq(terraActionItemsTable.id, numericId))
          .limit(1);
        if (existing.length === 0) throw new Error(`Action item not found: ${args.id}`);
        const previousStatus = existing[0].status;
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (args.status) {
          updateData.status = args.status;
          if (args.status === "resolved") updateData.resolvedAt = new Date();
        }
        if (args.recommendedAction !== undefined) updateData.recommendedAction = args.recommendedAction;
        const rows = await db
          .update(terraActionItemsTable)
          .set(updateData)
          .where(eq(terraActionItemsTable.id, numericId))
          .returning();
        const item = rows[0];
        if (!item) throw new Error(`Action item update returned no rows for id: ${args.id}`);
        try {
          const { alloyAuditLog } = await import("@szl-holdings/db/schema");
          await db.insert(alloyAuditLog).values({
            entityType: "action",
            entityId: item.id,
            action: args.status ? `status_changed_to_${args.status}` : "updated",
            actorType: "system",
            previousState: { status: previousStatus },
            newState: { status: item.status, propertyId: item.propertyId },
            notes: `Terra action item updated — property ${item.propertyId}`,
          });
        } catch {
          // Non-blocking — audit failure should not break the mutation
        }
        publish(WS_CHANNELS.TERRA_SIGNALS, "action-item-updated", {
          id: item.id,
          propertyId: item.propertyId,
          status: item.status,
        });
        pubsub.publish(TERRA_EVENTS.ACTION_ITEM_UPDATED, { terraActionItemUpdated: item });
        return item;
      } catch (err) {
        throw new Error(`Failed to update action item: ${err}`);
      }
    },
    seedTerraActionItems: async (_: unknown, args: { propertyId: string }) => {
      try {
        const { db } = await import("@szl-holdings/db");
        const { terraActionItemsTable } = await import("@szl-holdings/db/schema");
        const { eq } = await import("drizzle-orm");
        const SEED_DATA: Record<string, Array<{
          externalId: string;
          issue: string;
          severity: "critical" | "high" | "medium" | "low";
          ownerName: string;
          ownerRole: string;
          dueDate: string;
          status: "open" | "in_progress" | "resolved";
          recommendedAction: string;
        }>> = {
          "prop-007": [
            { externalId: "act-001", issue: "Occupancy at 68.4% — 30 units vacant", severity: "critical", ownerName: "D. Kim", ownerRole: "Asset Mgmt", dueDate: "2026-04-15", status: "in_progress", recommendedAction: "Activate leasing incentive program; engage Compass multifamily team" },
            { externalId: "act-002", issue: "Sterling Design Studio — 45 days past due, $6,400", severity: "critical", ownerName: "T. Allen", ownerRole: "Risk & Collections", dueDate: "2026-04-07", status: "open", recommendedAction: "Demand letter sent; escalate to eviction counsel if unpaid by Apr 7" },
            { externalId: "act-003", issue: "Loan maturity Sept 2026 — DSCR at 0.94x", severity: "critical", ownerName: "R. Torres", ownerRole: "Capital Markets", dueDate: "2026-05-01", status: "open", recommendedAction: "Engage lender for maturity extension; simultaneously market for refi" },
            { externalId: "act-004", issue: "Deferred maintenance estimate $2.1M", severity: "high", ownerName: "B. Park", ownerRole: "Engineering", dueDate: "2026-04-30", status: "open", recommendedAction: "Complete scope + bid by Apr 30; include in lender remediation plan" },
          ],
          "prop-005": [
            { externalId: "act-005", issue: "Retail occupancy 78.1% — 7 units vacant", severity: "high", ownerName: "D. Kim", ownerRole: "Asset Mgmt", dueDate: "2026-04-20", status: "open", recommendedAction: "Tenant incentive program — 3 months free rent for 5+ year leases" },
            { externalId: "act-006", issue: "Luna Boutique lease expiring Jun 2026", severity: "medium", ownerName: "M. Osei", ownerRole: "Legal", dueDate: "2026-05-01", status: "open", recommendedAction: "Send renewal proposal with updated market terms" },
          ],
          "prop-001": [
            { externalId: "act-007", issue: "HVAC Building B overdue maintenance", severity: "medium", ownerName: "R. Torres", ownerRole: "Facilities", dueDate: "2026-04-05", status: "in_progress", recommendedAction: "Vendor contracted; work order #WO-2026-0847 active" },
            { externalId: "act-008", issue: "Horizon Tech Labs lease expires May 2026", severity: "medium", ownerName: "M. Osei", ownerRole: "Legal", dueDate: "2026-04-15", status: "open", recommendedAction: "Schedule renewal conversation; assess market rate delta" },
          ],
        };
        const items = SEED_DATA[args.propertyId] ?? [];
        if (items.length === 0) return [];
        const existing = await db.select({ id: terraActionItemsTable.id, externalId: terraActionItemsTable.externalId })
          .from(terraActionItemsTable)
          .where(eq(terraActionItemsTable.propertyId, args.propertyId));
        const existingIds = new Set(existing.map(r => r.externalId));
        const toInsert = items.filter(item => !existingIds.has(item.externalId));
        if (toInsert.length > 0) {
          await db.insert(terraActionItemsTable).values(
            toInsert.map(item => ({ ...item, propertyId: args.propertyId, isDemo: true }))
          );
        }
        return await db.select().from(terraActionItemsTable).where(eq(terraActionItemsTable.propertyId, args.propertyId));
      } catch (err) {
        throw new Error(`Failed to seed action items: ${err}`);
      }
    },
  },
  Subscription: {
    terraDealUpdated: {
      subscribe: () => pubsub.asyncIterableIterator(TERRA_EVENTS.DEAL_UPDATED),
    },
    terraActionItemUpdated: {
      subscribe: () => pubsub.asyncIterableIterator(TERRA_EVENTS.ACTION_ITEM_UPDATED),
    },
  },
};
