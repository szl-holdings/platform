import { parseIntId } from "../utils.js";
import { pubsub, LYTE_EVENTS } from "../../lib/pubsub-bridge.js";

export const lyteTypeDefs = `#graphql
  type LyteWorkspace {
    id: ID!
    name: String!
    ownerId: ID
    createdAt: String
  }

  type LyteSignal {
    id: ID!
    source: String
    severity: String
    title: String
    status: String
    createdAt: String
  }

  type LyteAction {
    id: ID!
    state: String
    priority: String
    valueAtRisk: String
    createdAt: String
  }

  type LyteIncident {
    id: ID!
    severity: String
    status: String
    impactArea: String
    rootCause: String
    createdAt: String
  }

  extend type Query {
    lyteWorkspaces(limit: Int, offset: Int): [LyteWorkspace!]!
    lyteSignals(severity: String, status: String, limit: Int, offset: Int): [LyteSignal!]!
    lyteActions(state: String, limit: Int, offset: Int): [LyteAction!]!
    lyteIncidents(status: String, severity: String, limit: Int, offset: Int): [LyteIncident!]!
    lyteIncident(id: ID!): LyteIncident
  }

  extend type Mutation {
    updateLyteIncident(id: ID!, status: String!): LyteIncident!
  }

  extend type Subscription {
    lyteIncidentUpdated: LyteIncident!
  }
`;

export const lyteResolvers = {
  Query: {
    lyteWorkspaces: async (_: unknown, args: { limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteWorkspacesTable } = await import("@workspace/db/schema");
        const { desc } = await import("drizzle-orm");
        return await db.select().from(lyteWorkspacesTable).orderBy(desc(lyteWorkspacesTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
      } catch {
        return [];
      }
    },
    lyteSignals: async (_: unknown, args: { severity?: string; status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteSignalsTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions = [];
        if (args.severity) conditions.push(eq(lyteSignalsTable.severity, args.severity));
        if (args.status) conditions.push(eq(lyteSignalsTable.status, args.status));
        const query = db.select().from(lyteSignalsTable).orderBy(desc(lyteSignalsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (conditions.length > 0) {
          return await query.where(and(...conditions));
        }
        return await query;
      } catch {
        return [];
      }
    },
    lyteActions: async (_: unknown, args: { state?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteActionsTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(lyteActionsTable).orderBy(desc(lyteActionsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.state) {
          return await query.where(eq(lyteActionsTable.state, args.state));
        }
        return await query;
      } catch {
        return [];
      }
    },
    lyteIncidents: async (_: unknown, args: { status?: string; severity?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteIncidentsTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions = [];
        if (args.status) conditions.push(eq(lyteIncidentsTable.status, args.status));
        if (args.severity) conditions.push(eq(lyteIncidentsTable.severity, args.severity));
        const query = db.select().from(lyteIncidentsTable).orderBy(desc(lyteIncidentsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (conditions.length > 0) {
          return await query.where(and(...conditions));
        }
        return await query;
      } catch {
        return [];
      }
    },
    lyteIncident: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteIncidentsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(lyteIncidentsTable).where(eq(lyteIncidentsTable.id, parseIntId(args.id))).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
  },
  Mutation: {
    updateLyteIncident: async (_: unknown, args: { id: string; status: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { lyteIncidentsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db
          .update(lyteIncidentsTable)
          .set({ status: args.status })
          .where(eq(lyteIncidentsTable.id, parseIntId(args.id)))
          .returning();
        const incident = rows[0];
        pubsub.publish(LYTE_EVENTS.INCIDENT_UPDATED, { lyteIncidentUpdated: incident });
        return incident;
      } catch (err) {
        throw new Error(`Failed to update incident: ${err}`);
      }
    },
  },
  Subscription: {
    lyteIncidentUpdated: {
      subscribe: () => pubsub.asyncIterableIterator(LYTE_EVENTS.INCIDENT_UPDATED),
    },
  },
};
