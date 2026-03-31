import { parseIntId } from "../utils.js";

export const holdingsTypeDefs = `#graphql
  type HoldingsVenture {
    id: ID!
    slug: String!
    name: String!
    status: String
    sector: String
    createdAt: String
  }

  type HoldingsMetric {
    id: ID!
    ventureId: ID!
    label: String
    value: String
    change: String
    period: String
    createdAt: String
  }

  type HoldingsMilestone {
    id: ID!
    ventureId: ID!
    title: String
    date: String
    category: String
    createdAt: String
  }

  type HoldingsInquiry {
    id: ID!
    name: String!
    email: String!
    subject: String!
    status: String
    createdAt: String
  }

  extend type Query {
    holdingsVentures(status: String, limit: Int, offset: Int): [HoldingsVenture!]!
    holdingsVenture(id: ID!): HoldingsVenture
    holdingsVentureBySlug(slug: String!): HoldingsVenture
    holdingsMetrics(ventureId: ID!, limit: Int): [HoldingsMetric!]!
    holdingsMilestones(ventureId: ID!, limit: Int): [HoldingsMilestone!]!
    holdingsInquiries(status: String, limit: Int, offset: Int): [HoldingsInquiry!]!
  }

  extend type Mutation {
    createHoldingsInquiry(name: String!, email: String!, subject: String!, message: String!): HoldingsInquiry!
  }
`;

export const holdingsResolvers = {
  Query: {
    holdingsVentures: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { holdingsVenturesTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(holdingsVenturesTable).orderBy(desc(holdingsVenturesTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.status) {
          return await query.where(eq(holdingsVenturesTable.status, args.status));
        }
        return await query;
      } catch {
        return [];
      }
    },
    holdingsVenture: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { holdingsVenturesTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(holdingsVenturesTable).where(eq(holdingsVenturesTable.id, parseIntId(args.id))).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    holdingsVentureBySlug: async (_: unknown, args: { slug: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { holdingsVenturesTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(holdingsVenturesTable).where(eq(holdingsVenturesTable.slug, args.slug)).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    holdingsMetrics: async (_: unknown, args: { ventureId: string; limit?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { holdingsMetricsTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        return await db.select().from(holdingsMetricsTable).where(eq(holdingsMetricsTable.ventureId, parseIntId(args.ventureId, "ventureId"))).orderBy(desc(holdingsMetricsTable.createdAt)).limit(args.limit ?? 20);
      } catch {
        return [];
      }
    },
    holdingsMilestones: async (_: unknown, args: { ventureId: string; limit?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { holdingsMilestonesTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        return await db.select().from(holdingsMilestonesTable).where(eq(holdingsMilestonesTable.ventureId, parseIntId(args.ventureId, "ventureId"))).orderBy(desc(holdingsMilestonesTable.createdAt)).limit(args.limit ?? 20);
      } catch {
        return [];
      }
    },
    holdingsInquiries: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { holdingsInquiriesTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(holdingsInquiriesTable).orderBy(desc(holdingsInquiriesTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.status) {
          return await query.where(eq(holdingsInquiriesTable.status, args.status));
        }
        return await query;
      } catch {
        return [];
      }
    },
  },
  Mutation: {
    createHoldingsInquiry: async (_: unknown, args: { name: string; email: string; subject: string; message: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { holdingsInquiriesTable } = await import("@workspace/db/schema");
        const rows = await db
          .insert(holdingsInquiriesTable)
          .values({ name: args.name, email: args.email, subject: args.subject, message: args.message, status: "new" })
          .returning();
        return rows[0];
      } catch (err) {
        throw new Error(`Failed to create inquiry: ${err}`);
      }
    },
  },
};
