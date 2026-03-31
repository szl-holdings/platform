export const carlotaJoTypeDefs = `#graphql
  type CarlotaService {
    id: ID!
    slug: String!
    name: String!
    category: String
    isActive: Boolean
    createdAt: String
  }

  type CarlotaReservation {
    id: ID!
    confirmationId: String!
    service: String!
    date: String
    status: String
    amount: String
    paymentStatus: String
    createdAt: String
  }

  type CarlotaInquiry {
    id: ID!
    name: String!
    service: String
    message: String
    status: String
    createdAt: String
  }

  type CarlotaClientProfile {
    id: ID!
    name: String!
    company: String
    industry: String
    createdAt: String
  }

  extend type Query {
    carlotaServices(category: String, isActive: Boolean, limit: Int): [CarlotaService!]!
    carlotaReservations(status: String, limit: Int, offset: Int): [CarlotaReservation!]!
    carlotaReservation(confirmationId: String!): CarlotaReservation
    carlotaInquiries(status: String, limit: Int, offset: Int): [CarlotaInquiry!]!
    carlotaClientProfiles(limit: Int, offset: Int): [CarlotaClientProfile!]!
  }

  extend type Mutation {
    createCarlotaInquiry(name: String!, email: String!, service: String!, message: String!): CarlotaInquiry!
  }
`;

export const carlotaJoResolvers = {
  Query: {
    carlotaServices: async (_: unknown, args: { category?: string; isActive?: boolean; limit?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { carlotaServicesTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions = [];
        if (args.category) conditions.push(eq(carlotaServicesTable.category, args.category));
        if (args.isActive != null) conditions.push(eq(carlotaServicesTable.isActive, args.isActive));
        const query = db.select().from(carlotaServicesTable).orderBy(desc(carlotaServicesTable.createdAt)).limit(args.limit ?? 50);
        if (conditions.length > 0) {
          return await query.where(and(...conditions));
        }
        return await query;
      } catch {
        return [];
      }
    },
    carlotaReservations: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { carlotaReservationsTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(carlotaReservationsTable).orderBy(desc(carlotaReservationsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.status) {
          return await query.where(eq(carlotaReservationsTable.status, args.status));
        }
        return await query;
      } catch {
        return [];
      }
    },
    carlotaReservation: async (_: unknown, args: { confirmationId: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { carlotaReservationsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(carlotaReservationsTable).where(eq(carlotaReservationsTable.confirmationId, args.confirmationId)).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    carlotaInquiries: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { carlotaInquiriesTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(carlotaInquiriesTable).orderBy(desc(carlotaInquiriesTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.status) {
          return await query.where(eq(carlotaInquiriesTable.status, args.status));
        }
        return await query;
      } catch {
        return [];
      }
    },
    carlotaClientProfiles: async (_: unknown, args: { limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { carlotaClientProfilesTable } = await import("@workspace/db/schema");
        const { desc } = await import("drizzle-orm");
        return await db.select().from(carlotaClientProfilesTable).orderBy(desc(carlotaClientProfilesTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
      } catch {
        return [];
      }
    },
  },
  Mutation: {
    createCarlotaInquiry: async (_: unknown, args: { name: string; email: string; service: string; message: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { carlotaInquiriesTable } = await import("@workspace/db/schema");
        const rows = await db
          .insert(carlotaInquiriesTable)
          .values({ name: args.name, email: args.email, service: args.service, message: args.message, status: "new" })
          .returning();
        return rows[0];
      } catch (err) {
        throw new Error(`Failed to create inquiry: ${err}`);
      }
    },
  },
};
