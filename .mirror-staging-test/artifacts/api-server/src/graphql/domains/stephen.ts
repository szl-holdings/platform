export const stephenTypeDefs = `#graphql
  type StephenContentBlock {
    id: ID!
    type: String
    title: String
    content: String
    featured: Boolean
    createdAt: String
  }

  type StephenCaseStudy {
    id: ID!
    title: String!
    slug: String
    summary: String
    outcome: String
    featured: Boolean
    createdAt: String
  }

  type StephenBookingRequest {
    id: ID!
    name: String
    email: String
    type: String
    status: String
    createdAt: String
  }

  extend type Query {
    stephenContentBlocks(type: String, featured: Boolean, limit: Int, offset: Int): [StephenContentBlock!]!
    stephenCaseStudies(featured: Boolean, limit: Int, offset: Int): [StephenCaseStudy!]!
    stephenCaseStudy(slug: String!): StephenCaseStudy
    stephenBookingRequests(status: String, limit: Int, offset: Int): [StephenBookingRequest!]!
  }

  extend type Mutation {
    createStephenBookingRequest(name: String!, email: String!, type: String!): StephenBookingRequest!
  }
`;

export const stephenResolvers = {
  Query: {
    stephenContentBlocks: async (_: unknown, args: { type?: string; featured?: boolean; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { stephenContentBlocksTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions = [];
        if (args.type) conditions.push(eq(stephenContentBlocksTable.type, args.type as any));
        if (args.featured != null) conditions.push(eq(stephenContentBlocksTable.featured, args.featured as any));
        const query = db.select().from(stephenContentBlocksTable).orderBy(desc(stephenContentBlocksTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (conditions.length > 0) {
          return await query.where(and(...conditions));
        }
        return await query;
      } catch {
        return [];
      }
    },
    stephenCaseStudies: async (_: unknown, args: { featured?: boolean; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { stephenCaseStudiesTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(stephenCaseStudiesTable).orderBy(desc(stephenCaseStudiesTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.featured != null) {
          return await query.where(eq(stephenCaseStudiesTable.featured, args.featured as any));
        }
        return await query;
      } catch {
        return [];
      }
    },
    stephenCaseStudy: async (_: unknown, args: { slug: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { stephenCaseStudiesTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(stephenCaseStudiesTable).where(eq(stephenCaseStudiesTable.slug, args.slug as any)).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    stephenBookingRequests: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { stephenBookingRequestsTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(stephenBookingRequestsTable).orderBy(desc(stephenBookingRequestsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.status) {
          return await query.where(eq(stephenBookingRequestsTable.status, args.status as any));
        }
        return await query;
      } catch {
        return [];
      }
    },
  },
  Mutation: {
    createStephenBookingRequest: async (_: unknown, args: { name: string; email: string; type: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { stephenBookingRequestsTable } = await import("@workspace/db/schema");
        const rows = await db
          .insert(stephenBookingRequestsTable)
          .values({ name: args.name, email: args.email, type: args.type, status: "pending" } as any)
          .returning();
        return rows[0];
      } catch (err) {
        throw new Error(`Failed to create booking request: ${err}`);
      }
    },
  },
};
