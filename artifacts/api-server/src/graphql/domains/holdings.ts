import { parseIntId } from "../utils.js";
import {
  getTrustCenterStatus,
  listHoldingsVentures,
  getHoldingsVenture,
  getHoldingsVentureBySlug,
  listHoldingsMetrics,
  listHoldingsMilestones,
  listHoldingsInquiries,
  createHoldingsInquiry,
  type HoldingsStoragePort,
} from "../../lib/domain-services/holdings/index.js";

export const holdingsTypeDefs = `#graphql
  type TrustFramework {
    name: String!
    status: String!
    scope: String!
    expiry: String!
  }

  type TrustCertification {
    name: String!
    date: String!
    issuer: String!
  }

  type TrustCenterStatus {
    lastAuditDate: String!
    nextReviewDate: String!
    overallScore: Int!
    frameworks: [TrustFramework!]!
    certifications: [TrustCertification!]!
  }

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
    trustCenter: TrustCenterStatus!
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

async function buildHoldingsStorage(): Promise<HoldingsStoragePort> {
  const { db } = await import("@szl-holdings/db");
  const { holdingsVenturesTable, holdingsMetricsTable, holdingsMilestonesTable, holdingsInquiriesTable } = await import("@szl-holdings/db/schema");
  const { desc, eq } = await import("drizzle-orm");

  return {
    async listVentures(args) {
      try {
        const q = db.select().from(holdingsVenturesTable).orderBy(desc(holdingsVenturesTable.createdAt)).limit(args.limit).offset(args.offset);
        if (args.status) return await q.where(eq(holdingsVenturesTable.status, args.status as any));
        return await q;
      } catch { return []; }
    },
    async getVenture(id) {
      try {
        const rows = await db.select().from(holdingsVenturesTable).where(eq(holdingsVenturesTable.id, id)).limit(1);
        return rows[0] ?? null;
      } catch { return null; }
    },
    async getVentureBySlug(slug) {
      try {
        const rows = await db.select().from(holdingsVenturesTable).where(eq(holdingsVenturesTable.slug, slug as any)).limit(1);
        return rows[0] ?? null;
      } catch { return null; }
    },
    async listMetrics(args) {
      try { return await db.select().from(holdingsMetricsTable).where(eq(holdingsMetricsTable.ventureId, args.ventureId)).orderBy(desc(holdingsMetricsTable.createdAt)).limit(args.limit); } catch { return []; }
    },
    async listMilestones(args) {
      try { return await db.select().from(holdingsMilestonesTable).where(eq(holdingsMilestonesTable.ventureId, args.ventureId)).orderBy(desc(holdingsMilestonesTable.createdAt)).limit(args.limit); } catch { return []; }
    },
    async listInquiries(args) {
      try {
        const q = db.select().from(holdingsInquiriesTable).orderBy(desc(holdingsInquiriesTable.createdAt)).limit(args.limit).offset(args.offset);
        if (args.status) return await q.where(eq(holdingsInquiriesTable.status, args.status as any));
        return await q;
      } catch { return []; }
    },
    async createInquiry(data) {
      const rows = await db.insert(holdingsInquiriesTable).values(data as any).returning();
      return rows[0];
    },
  };
}

export const holdingsResolvers = {
  Query: {
    trustCenter: () => getTrustCenterStatus(),
    holdingsVentures: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      return listHoldingsVentures(await buildHoldingsStorage(), args);
    },
    holdingsVenture: async (_: unknown, args: { id: string }) => {
      return getHoldingsVenture(await buildHoldingsStorage(), parseIntId(args.id));
    },
    holdingsVentureBySlug: async (_: unknown, args: { slug: string }) => {
      return getHoldingsVentureBySlug(await buildHoldingsStorage(), args.slug);
    },
    holdingsMetrics: async (_: unknown, args: { ventureId: string; limit?: number }) => {
      return listHoldingsMetrics(await buildHoldingsStorage(), { ventureId: parseIntId(args.ventureId, "ventureId"), limit: args.limit });
    },
    holdingsMilestones: async (_: unknown, args: { ventureId: string; limit?: number }) => {
      return listHoldingsMilestones(await buildHoldingsStorage(), { ventureId: parseIntId(args.ventureId, "ventureId"), limit: args.limit });
    },
    holdingsInquiries: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      return listHoldingsInquiries(await buildHoldingsStorage(), args);
    },
  },
  Mutation: {
    createHoldingsInquiry: async (_: unknown, args: { name: string; email: string; subject: string; message: string }) => {
      try {
        return await createHoldingsInquiry(await buildHoldingsStorage(), args);
      } catch (err) {
        throw new Error(`Failed to create inquiry: ${err}`);
      }
    },
  },
};
