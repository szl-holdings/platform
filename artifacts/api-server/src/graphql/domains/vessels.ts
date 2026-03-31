import { withFilter } from "graphql-subscriptions";
import { pubsub, VESSELS_EVENTS } from "../../lib/pubsub-bridge.js";

export const vesselsTypeDefs = `#graphql
  type Vessel {
    id: ID!
    name: String!
    imo: String
    vesselType: String
    status: String
    fleetId: ID
    createdAt: String
  }

  type VesselPosition {
    vesselId: ID!
    latitude: Float
    longitude: Float
    speed: Float
    recordedAt: String
  }

  type VesselRoute {
    id: ID!
    vesselId: ID!
    originPort: String
    destinationPort: String
    departureAt: String
    status: String
  }

  type VesselEvent {
    id: ID!
    vesselId: ID!
    eventType: String
    severity: String
    status: String
    occurredAt: String
  }

  extend type Query {
    vessels(status: String, limit: Int, offset: Int): [Vessel!]!
    vessel(id: ID!): Vessel
    vesselPositions(vesselId: ID, limit: Int): [VesselPosition!]!
    vesselRoutes(vesselId: ID, status: String, limit: Int, offset: Int): [VesselRoute!]!
    vesselEvents(vesselId: ID, severity: String, limit: Int, offset: Int): [VesselEvent!]!
  }

  extend type Subscription {
    vesselPositionUpdated(vesselId: ID): VesselPosition!
  }
`;

export const vesselsResolvers = {
  Query: {
    vessels: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { vesselsTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(vesselsTable).orderBy(desc(vesselsTable.createdAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (args.status) {
          return await query.where(eq(vesselsTable.status, args.status));
        }
        return await query;
      } catch {
        return [];
      }
    },
    vessel: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { vesselsTable } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(vesselsTable).where(eq(vesselsTable.id, args.id)).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    vesselPositions: async (_: unknown, args: { vesselId?: string; limit?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { vesselsPositionsTable } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db.select().from(vesselsPositionsTable).orderBy(desc(vesselsPositionsTable.recordedAt)).limit(args.limit ?? 100);
        if (args.vesselId) {
          return await query.where(eq(vesselsPositionsTable.vesselId, args.vesselId));
        }
        return await query;
      } catch {
        return [];
      }
    },
    vesselRoutes: async (_: unknown, args: { vesselId?: string; status?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { vesselsRoutesTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions = [];
        if (args.vesselId) conditions.push(eq(vesselsRoutesTable.vesselId, args.vesselId));
        if (args.status) conditions.push(eq(vesselsRoutesTable.status, args.status));
        const query = db.select().from(vesselsRoutesTable).orderBy(desc(vesselsRoutesTable.departureAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (conditions.length > 0) {
          return await query.where(and(...conditions));
        }
        return await query;
      } catch {
        return [];
      }
    },
    vesselEvents: async (_: unknown, args: { vesselId?: string; severity?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { vesselsEventsTable } = await import("@workspace/db/schema");
        const { desc, eq, and } = await import("drizzle-orm");
        const conditions = [];
        if (args.vesselId) conditions.push(eq(vesselsEventsTable.vesselId, args.vesselId));
        if (args.severity) conditions.push(eq(vesselsEventsTable.severity, args.severity));
        const query = db.select().from(vesselsEventsTable).orderBy(desc(vesselsEventsTable.occurredAt)).limit(args.limit ?? 50).offset(args.offset ?? 0);
        if (conditions.length > 0) {
          return await query.where(and(...conditions));
        }
        return await query;
      } catch {
        return [];
      }
    },
  },
  Subscription: {
    vesselPositionUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(VESSELS_EVENTS.POSITION_UPDATED),
        (payload: { vesselPositionUpdated: { vesselId: string } }, variables: { vesselId?: string }) => {
          if (!variables.vesselId) return true;
          return payload.vesselPositionUpdated.vesselId === variables.vesselId;
        },
      ),
    },
  },
};
