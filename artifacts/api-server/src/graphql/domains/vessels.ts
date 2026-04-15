import { withFilter } from "graphql-subscriptions";
import { pubsub, VESSELS_EVENTS } from "../../lib/pubsub-bridge.js";
import {
  listVessels,
  listVesselPositions,
  listVesselRoutes,
  listVesselEvents,
  getVessel,
  type VesselsStoragePort,
} from "../../lib/domain-services/vessels/index.js";

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

async function buildVesselsStorage(): Promise<VesselsStoragePort> {
  const { db } = await import("@szl-holdings/db");
  const { vesselsTable, vesselsPositionsTable, vesselsRoutesTable, vesselsEventsTable } = await import("@szl-holdings/db/schema");
  const { desc, eq, and } = await import("drizzle-orm");

  return {
    async listVessels(args) {
      try {
        const q = db.select().from(vesselsTable).orderBy(desc(vesselsTable.createdAt)).limit(args.limit).offset(args.offset);
        if (args.status) return await q.where(eq(vesselsTable.status, args.status as any));
        return await q;
      } catch { return []; }
    },
    async getVessel(id) {
      try {
        const rows = await db.select().from(vesselsTable).where(eq(vesselsTable.id, id)).limit(1);
        return rows[0] ?? null;
      } catch { return null; }
    },
    async listPositions(args) {
      try {
        const q = db.select().from(vesselsPositionsTable).orderBy(desc(vesselsPositionsTable.recordedAt)).limit(args.limit);
        if (args.vesselId) return await q.where(eq(vesselsPositionsTable.vesselId, args.vesselId));
        return await q;
      } catch { return []; }
    },
    async listRoutes(args) {
      try {
        const conditions = [];
        if (args.vesselId) conditions.push(eq(vesselsRoutesTable.vesselId, args.vesselId));
        if (args.status) conditions.push(eq(vesselsRoutesTable.status, args.status as any));
        const q = db.select().from(vesselsRoutesTable).orderBy(desc(vesselsRoutesTable.departureAt)).limit(args.limit).offset(args.offset);
        if (conditions.length > 0) return await q.where(and(...conditions));
        return await q;
      } catch { return []; }
    },
    async listEvents(args) {
      try {
        const conditions = [];
        if (args.vesselId) conditions.push(eq(vesselsEventsTable.vesselId, args.vesselId));
        if (args.severity) conditions.push(eq(vesselsEventsTable.severity, args.severity as any));
        const q = db.select().from(vesselsEventsTable).orderBy(desc(vesselsEventsTable.occurredAt)).limit(args.limit).offset(args.offset);
        if (conditions.length > 0) return await q.where(and(...conditions));
        return await q;
      } catch { return []; }
    },
  };
}

export const vesselsResolvers = {
  Query: {
    vessels: async (_: unknown, args: { status?: string; limit?: number; offset?: number }) => {
      return listVessels(await buildVesselsStorage(), args);
    },
    vessel: async (_: unknown, args: { id: string }) => {
      return getVessel(await buildVesselsStorage(), parseInt(args.id, 10));
    },
    vesselPositions: async (_: unknown, args: { vesselId?: string; limit?: number }) => {
      return listVesselPositions(await buildVesselsStorage(), {
        vesselId: args.vesselId ? parseInt(args.vesselId, 10) : undefined,
        limit: args.limit,
      });
    },
    vesselRoutes: async (_: unknown, args: { vesselId?: string; status?: string; limit?: number; offset?: number }) => {
      return listVesselRoutes(await buildVesselsStorage(), {
        vesselId: args.vesselId ? parseInt(args.vesselId, 10) : undefined,
        status: args.status,
        limit: args.limit,
        offset: args.offset,
      });
    },
    vesselEvents: async (_: unknown, args: { vesselId?: string; severity?: string; limit?: number; offset?: number }) => {
      return listVesselEvents(await buildVesselsStorage(), {
        vesselId: args.vesselId ? parseInt(args.vesselId, 10) : undefined,
        severity: args.severity,
        limit: args.limit,
        offset: args.offset,
      });
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
