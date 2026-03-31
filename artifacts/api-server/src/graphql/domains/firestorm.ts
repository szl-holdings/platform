import { publish, WS_CHANNELS } from "../../lib/websocket.js";
import { pubsub, FIRESTORM_EVENTS } from "../../lib/pubsub-bridge.js";

export const firestormTypeDefs = `#graphql
  type FirestormAssessment {
    id: ID!
    name: String!
    assessmentType: String
    status: String
    overallRiskScore: Float
    createdAt: String
  }

  type FirestormFinding {
    id: ID!
    assessmentId: ID
    severity: String
    status: String
    affectedAsset: String
    recommendation: String
    createdAt: String
  }

  type FirestormIncident {
    id: ID!
    title: String!
    severity: String
    status: String
    detectedAt: String
    createdAt: String
  }

  type FirestormAsset {
    id: ID!
    name: String!
    assetType: String
    riskScore: Float
    exposureLevel: String
    createdAt: String
  }

  extend type Query {
    firestormAssessments(limit: Int, offset: Int): [FirestormAssessment!]!
    firestormAssessment(id: ID!): FirestormAssessment
    firestormFindings(assessmentId: ID, severity: String, limit: Int, offset: Int): [FirestormFinding!]!
    firestormIncidents(status: String, severity: String, limit: Int, offset: Int): [FirestormIncident!]!
    firestormIncident(id: ID!): FirestormIncident
    firestormAssets(limit: Int, offset: Int): [FirestormAsset!]!
  }

  extend type Mutation {
    updateFirestormIncident(id: ID!, status: String!): FirestormIncident!
  }

  extend type Subscription {
    firestormIncidentUpdated: FirestormIncident!
  }
`;

export const firestormResolvers = {
  Query: {
    firestormAssessments: async (_: unknown, args: { limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { firestormAssessmentsTable } = await import("@workspace/db/schema");
        const { desc } = await import("drizzle-orm");
        return await db
          .select()
          .from(firestormAssessmentsTable)
          .orderBy(desc(firestormAssessmentsTable.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
      } catch {
        return [];
      }
    },
    firestormAssessment: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { firestormAssessmentsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(firestormAssessmentsTable).where(eq(firestormAssessmentsTable.id, args.id)).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    firestormFindings: async (_: unknown, args: { assessmentId?: string; severity?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { firestormFindingsTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions = [];
        if (args.assessmentId) conditions.push(eq(firestormFindingsTable.assessmentId, args.assessmentId));
        if (args.severity) conditions.push(eq(firestormFindingsTable.severity, args.severity));
        const query = db.select().from(firestormFindingsTable).orderBy(desc(firestormFindingsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (conditions.length > 0) {
          return await query.where(and(...conditions));
        }
        return await query;
      } catch {
        return [];
      }
    },
    firestormIncidents: async (_: unknown, args: { status?: string; severity?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { firestormIncidentsTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions = [];
        if (args.status) conditions.push(eq(firestormIncidentsTable.status, args.status));
        if (args.severity) conditions.push(eq(firestormIncidentsTable.severity, args.severity));
        const query = db.select().from(firestormIncidentsTable).orderBy(desc(firestormIncidentsTable.detectedAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (conditions.length > 0) {
          return await query.where(and(...conditions));
        }
        return await query;
      } catch {
        return [];
      }
    },
    firestormIncident: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { firestormIncidentsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, args.id)).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    firestormAssets: async (_: unknown, args: { limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { firestormAssetsTable } = await import("@workspace/db/schema");
        const { desc } = await import("drizzle-orm");
        return await db
          .select()
          .from(firestormAssetsTable)
          .orderBy(desc(firestormAssetsTable.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
      } catch {
        return [];
      }
    },
  },
  Mutation: {
    updateFirestormIncident: async (_: unknown, args: { id: string; status: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { firestormIncidentsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db
          .update(firestormIncidentsTable)
          .set({ status: args.status })
          .where(eq(firestormIncidentsTable.id, args.id))
          .returning();
        const incident = rows[0];
        pubsub.publish(FIRESTORM_EVENTS.INCIDENT_UPDATED, { firestormIncidentUpdated: incident });
        publish(WS_CHANNELS.AEGIS_INCIDENTS, "incident-updated", {
          id: incident.id,
          status: incident.status,
          severity: (incident as Record<string, unknown>).severity,
        });
        return incident;
      } catch (err) {
        throw new Error(`Failed to update incident: ${err}`);
      }
    },
  },
  Subscription: {
    firestormIncidentUpdated: {
      subscribe: () => pubsub.asyncIterableIterator(FIRESTORM_EVENTS.INCIDENT_UPDATED),
    },
  },
};
