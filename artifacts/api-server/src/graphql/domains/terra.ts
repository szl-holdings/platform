import { parseIntId } from "../utils.js";
import { publish, WS_CHANNELS } from "../../lib/websocket.js";
import { pubsub, TERRA_EVENTS } from "../../lib/pubsub-bridge.js";

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

  extend type Query {
    terraProperties(limit: Int, offset: Int): [TerraProperty!]!
    terraListings(status: String, limit: Int, offset: Int): [TerraListing!]!
    terraDistressProperties(borough: String, distressType: String, limit: Int, offset: Int): [TerraDistressProperty!]!
    terraDeals(stage: String, limit: Int, offset: Int): [TerraDeal!]!
    terraDeal(id: ID!): TerraDeal
    terraLeads(stage: String, limit: Int, offset: Int): [TerraLead!]!
  }

  extend type Mutation {
    updateTerraDeal(id: ID!, stage: String, probability: Int): TerraDeal!
    createTerraLead(firstName: String!, lastName: String!, type: String): TerraLead!
  }

  extend type Subscription {
    terraDealUpdated: TerraDeal!
  }
`;

export const terraResolvers = {
  Query: {
    terraProperties: async (_: unknown, args: { limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { terraPropertiesTable } = await import("@workspace/db/schema");
        const { desc } = await import("drizzle-orm");
        return await db.select().from(terraPropertiesTable).orderBy(desc(terraPropertiesTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
      } catch {
        return [];
      }
    },
    terraListings: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { terraListingsTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(terraListingsTable).orderBy(desc(terraListingsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.status) {
          return await query.where(eq(terraListingsTable.status, args.status));
        }
        return await query;
      } catch {
        return [];
      }
    },
    terraDistressProperties: async (_: unknown, args: { borough?: string; distressType?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { terraDistressPropertiesTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions = [];
        if (args.borough) conditions.push(eq(terraDistressPropertiesTable.borough, args.borough));
        if (args.distressType) conditions.push(eq(terraDistressPropertiesTable.distressType, args.distressType));
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
        const { db } = await import("@workspace/db");
        const { terraDealsTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(terraDealsTable).orderBy(desc(terraDealsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.stage) {
          return await query.where(eq(terraDealsTable.stage, args.stage));
        }
        return await query;
      } catch {
        return [];
      }
    },
    terraDeal: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { terraDealsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(terraDealsTable).where(eq(terraDealsTable.id, parseIntId(args.id))).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    terraLeads: async (_: unknown, args: { stage?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { terraLeadsTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(terraLeadsTable).orderBy(desc(terraLeadsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.stage) {
          return await query.where(eq(terraLeadsTable.stage, args.stage));
        }
        return await query;
      } catch {
        return [];
      }
    },
  },
  Mutation: {
    updateTerraDeal: async (_: unknown, args: { id: string; stage?: string; probability?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { terraDealsTable } = await import("@workspace/db/schema");
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
        const { db } = await import("@workspace/db");
        const { terraLeadsTable } = await import("@workspace/db/schema");
        const rows = await db
          .insert(terraLeadsTable)
          .values({ firstName: args.firstName, lastName: args.lastName, type: args.type ?? "buyer", stage: "new" })
          .returning();
        return rows[0];
      } catch (err) {
        throw new Error(`Failed to create lead: ${err}`);
      }
    },
  },
  Subscription: {
    terraDealUpdated: {
      subscribe: () => pubsub.asyncIterableIterator(TERRA_EVENTS.DEAL_UPDATED),
    },
  },
};
