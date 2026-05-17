import {
  type CarlotaJoStoragePort,
  createCarlotaInquiry,
  getCarlotaReservation,
  listCarlotaClientProfiles,
  listCarlotaInquiries,
  listCarlotaReservations,
  listCarlotaServices,
} from '../../lib/domain-services/carlota-jo/index.js';
import { withFilter } from 'graphql-subscriptions';
import { CARLOTA_EVENTS, pubsub } from '../../lib/pubsub-bridge.js';
import { publish, WS_CHANNELS } from '../../lib/websocket.js';
import { requireOperatorWsUser, type SubscriptionWsContext } from '../utils.js';

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

  extend type Subscription {
    carlotaInquiryCreated: CarlotaInquiry!
  }
`;

type PublisherCtx = { req?: { user?: { id?: number; orgs?: Array<{ orgId: number }> } } };
type SubscriberCtx = { wsUser?: { id: number; orgs: Array<{ orgId: number }> } };

async function resolveResourceOrgIds(
  ownerUserId: number | null | undefined,
  actorId: number | null | undefined,
): Promise<number[]> {
  const userId = ownerUserId ?? actorId;
  if (!userId) return [];
  const { db } = await import('@szl-holdings/db');
  const { orgMembersTable } = await import('@szl-holdings/db/schema');
  const { eq } = await import('drizzle-orm');
  const rows = await db
    .select({ orgId: orgMembersTable.orgId })
    .from(orgMembersTable)
    .where(eq(orgMembersTable.userId, userId));
  return rows.map((r) => r.orgId);
}

function ownerOf(resource: unknown): number | null {
  if (resource == null || typeof resource !== 'object') return null;
  const r = resource as Record<string, unknown>;
  const v = r['ownerUserId'] ?? r['requestedByUserId'] ?? r['createdByUserId'];
  return typeof v === 'number' ? v : null;
}

function checkOrgAccess(eventOrgIds: number[] | undefined, ctx: SubscriberCtx): boolean {
  if (!ctx?.wsUser) return false;
  if (!eventOrgIds?.length) return false;
  const userOrgIds = new Set(ctx.wsUser.orgs.map(o => o.orgId));
  return eventOrgIds.some(id => userOrgIds.has(id));
}

async function buildCarlotaStorage(): Promise<CarlotaJoStoragePort> {
  const { db } = await import('@szl-holdings/db');
  const {
    carlotaServicesTable,
    carlotaReservationsTable,
    carlotaInquiriesTable,
    carlotaClientProfilesTable,
  } = await import('@szl-holdings/db/schema');
  const { desc, eq, and } = await import('drizzle-orm');

  return {
    async listServices(args) {
      try {
        const conditions = [];
        if (args.category) conditions.push(eq(carlotaServicesTable.category, args.category as any));
        if (args.isActive != null)
          conditions.push(eq(carlotaServicesTable.isActive, args.isActive as any));
        const q = db
          .select()
          .from(carlotaServicesTable)
          .orderBy(desc(carlotaServicesTable.createdAt))
          .limit(args.limit);
        if (conditions.length > 0) return await q.where(and(...conditions));
        return await q;
      } catch {
        return [];
      }
    },
    async listReservations(args) {
      try {
        const q = db
          .select()
          .from(carlotaReservationsTable)
          .orderBy(desc(carlotaReservationsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        if (args.status)
          return await q.where(eq(carlotaReservationsTable.status, args.status as any));
        return await q;
      } catch {
        return [];
      }
    },
    async getReservationByConfirmationId(confirmationId) {
      try {
        const rows = await db
          .select()
          .from(carlotaReservationsTable)
          .where(eq(carlotaReservationsTable.confirmationId, confirmationId))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    async listInquiries(args) {
      try {
        const q = db
          .select()
          .from(carlotaInquiriesTable)
          .orderBy(desc(carlotaInquiriesTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        if (args.status) return await q.where(eq(carlotaInquiriesTable.status, args.status as any));
        return await q;
      } catch {
        return [];
      }
    },
    async listClientProfiles(args) {
      try {
        return await db
          .select()
          .from(carlotaClientProfilesTable)
          .orderBy(desc(carlotaClientProfilesTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
      } catch {
        return [];
      }
    },
    async createInquiry(data) {
      const rows = await db
        .insert(carlotaInquiriesTable)
        .values(data as any)
        .returning();
      const inquiry = rows[0];
      publish(WS_CHANNELS.BOOKINGS, 'inquiry-created', {
        id: inquiry.id,
        name: inquiry.name,
        service: inquiry.service,
        status: inquiry.status,
      });
      return inquiry;
    },
  };
}

export const carlotaJoResolvers = {
  Query: {
    carlotaServices: async (
      _: unknown,
      args: { category?: string; isActive?: boolean; limit?: number },
    ) => {
      return listCarlotaServices(await buildCarlotaStorage(), args);
    },
    carlotaReservations: async (
      _: unknown,
      args: { status?: string; limit?: number; offset?: number },
    ) => {
      return listCarlotaReservations(await buildCarlotaStorage(), args);
    },
    carlotaReservation: async (_: unknown, args: { confirmationId: string }) => {
      return getCarlotaReservation(await buildCarlotaStorage(), args.confirmationId);
    },
    carlotaInquiries: async (
      _: unknown,
      args: { status?: string; limit?: number; offset?: number },
    ) => {
      return listCarlotaInquiries(await buildCarlotaStorage(), args);
    },
    carlotaClientProfiles: async (_: unknown, args: { limit?: number; offset?: number }) => {
      return listCarlotaClientProfiles(await buildCarlotaStorage(), args);
    },
  },
  Mutation: {
    createCarlotaInquiry: async (
      _: unknown,
      args: { name: string; email: string; service: string; message: string },
      context: PublisherCtx,
    ) => {
      try {
        const inquiry = await createCarlotaInquiry(await buildCarlotaStorage(), args);
        const orgIds = await resolveResourceOrgIds(ownerOf(inquiry), context.req?.user?.id);
        pubsub.publish(CARLOTA_EVENTS.INQUIRY_CREATED, { carlotaInquiryCreated: inquiry, _orgIds: orgIds });
        return inquiry;
      } catch (err) {
        throw new Error(`Failed to create inquiry: ${err}`);
      }
    },
  },
  Subscription: {
    carlotaInquiryCreated: {
      subscribe: (_: unknown, __: unknown, context: SubscriptionWsContext) => {
        requireOperatorWsUser(context);
        return pubsub.asyncIterableIterator(CARLOTA_EVENTS.INQUIRY_CREATED);
      },
    },
  },
};
