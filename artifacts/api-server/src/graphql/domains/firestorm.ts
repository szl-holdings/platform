import { publish, WS_CHANNELS } from "../../lib/websocket.js";
import { pubsub, FIRESTORM_EVENTS } from "../../lib/pubsub-bridge.js";
import {
  listFirestormAssessments,
  getFirestormAssessment,
  listFirestormFindings,
  listFirestormIncidents,
  getFirestormIncident,
  updateFirestormIncident,
  listFirestormAssets,
  type FirestormStoragePort,
} from "../../lib/domain-services/firestorm/index.js";
import type { GraphQLContext } from "../index.js";

export const firestormTypeDefs = `#graphql
  type FirestormAssessment {
    id: ID!
    name: String!
    assessmentType: String
    status: String
    overallRiskScore: Float
    createdAt: String
    findings: [FirestormFinding!]!
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

async function buildFirestormStorage(): Promise<FirestormStoragePort> {
  const { db } = await import("@szl-holdings/db");
  const { firestormAssessmentsTable, firestormFindingsTable, firestormIncidentsTable, firestormAssetsTable } = await import("@szl-holdings/db/schema");
  const { desc, eq, and } = await import("drizzle-orm");

  return {
    async listAssessments(args) {
      try { return await db.select().from(firestormAssessmentsTable).orderBy(desc(firestormAssessmentsTable.createdAt)).limit(args.limit).offset(args.offset); } catch { return []; }
    },
    async getAssessment(id) {
      try {
        const rows = await db.select().from(firestormAssessmentsTable).where(eq(firestormAssessmentsTable.id, id)).limit(1);
        return rows[0] ?? null;
      } catch { return null; }
    },
    async listFindings(args) {
      try {
        const conditions = [];
        if (args.assessmentId) conditions.push(eq(firestormFindingsTable.assessmentId, args.assessmentId));
        if (args.severity) conditions.push(eq(firestormFindingsTable.severity, args.severity as any));
        const q = db.select().from(firestormFindingsTable).orderBy(desc(firestormFindingsTable.createdAt)).limit(args.limit).offset(args.offset);
        if (conditions.length > 0) return await q.where(and(...conditions));
        return await q;
      } catch { return []; }
    },
    async listIncidents(args) {
      try {
        const conditions = [];
        if (args.status) conditions.push(eq(firestormIncidentsTable.status, args.status as any));
        if (args.severity) conditions.push(eq(firestormIncidentsTable.severity, args.severity as any));
        const q = db.select().from(firestormIncidentsTable).orderBy(desc(firestormIncidentsTable.detectedAt)).limit(args.limit).offset(args.offset);
        if (conditions.length > 0) return await q.where(and(...conditions));
        return await q;
      } catch { return []; }
    },
    async getIncident(id) {
      try {
        const rows = await db.select().from(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, id)).limit(1);
        return rows[0] ?? null;
      } catch { return null; }
    },
    async updateIncident(id, data) {
      const rows = await db.update(firestormIncidentsTable).set(data).where(eq(firestormIncidentsTable.id, id)).returning();
      const incident = rows[0];
      pubsub.publish(FIRESTORM_EVENTS.INCIDENT_UPDATED, { firestormIncidentUpdated: incident });
      publish(WS_CHANNELS.AEGIS_INCIDENTS, "incident-updated", { id: incident.id, status: incident.status, severity: (incident as any).severity });
      return incident;
    },
    async listAssets(args) {
      try { return await db.select().from(firestormAssetsTable).orderBy(desc(firestormAssetsTable.createdAt)).limit(args.limit).offset(args.offset); } catch { return []; }
    },
  };
}

export const firestormResolvers = {
  Query: {
    firestormAssessments: async (_: unknown, args: { limit?: number; offset?: number }) => {
      return listFirestormAssessments(await buildFirestormStorage(), args);
    },
    firestormAssessment: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
      const numId = parseInt(args.id, 10);
      if (context?.loaders?.firestormAssessmentById) {
        return context.loaders.firestormAssessmentById.load(numId);
      }
      return getFirestormAssessment(await buildFirestormStorage(), numId);
    },
    firestormFindings: async (_: unknown, args: { assessmentId?: string; severity?: string; limit?: number; offset?: number }) => {
      return listFirestormFindings(await buildFirestormStorage(), {
        assessmentId: args.assessmentId ? parseInt(args.assessmentId, 10) : undefined,
        severity: args.severity,
        limit: args.limit,
        offset: args.offset,
      });
    },
    firestormIncidents: async (_: unknown, args: { status?: string; severity?: string; limit?: number; offset?: number }) => {
      return listFirestormIncidents(await buildFirestormStorage(), args);
    },
    firestormIncident: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
      const numId = parseInt(args.id, 10);
      if (context?.loaders?.firestormIncidentById) {
        return context.loaders.firestormIncidentById.load(numId);
      }
      return getFirestormIncident(await buildFirestormStorage(), numId);
    },
    firestormAssets: async (_: unknown, args: { limit?: number; offset?: number }) => {
      return listFirestormAssets(await buildFirestormStorage(), args);
    },
  },
  FirestormAssessment: {
    findings: async (assessment: { id: number }, _: unknown, context: GraphQLContext) => {
      if (context?.loaders?.findingsByAssessmentId) {
        return context.loaders.findingsByAssessmentId.load(assessment.id);
      }
      return listFirestormFindings(await buildFirestormStorage(), { assessmentId: assessment.id });
    },
  },
  Mutation: {
    updateFirestormIncident: async (_: unknown, args: { id: string; status: string }) => {
      try {
        return await updateFirestormIncident(await buildFirestormStorage(), parseInt(args.id, 10), args.status);
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
