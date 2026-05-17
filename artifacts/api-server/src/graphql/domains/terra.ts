import {
  createTerraLead,
  getTerraDeal,
  listTerraActionItems,
  listTerraDeals,
  listTerraDistressProperties,
  listTerraLeads,
  listTerraListings,
  listTerraProperties,
  seedTerraActionItems,
  type TerraStoragePort,
  updateTerraActionItem,
  updateTerraDeal,
} from '../../lib/domain-services/terra/index.js';
import { withFilter } from 'graphql-subscriptions';
import { pubsub, TERRA_EVENTS } from '../../lib/pubsub-bridge.js';
import { publish, WS_CHANNELS } from '../../lib/websocket.js';
import { parseIntId } from '../utils.js';

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

export const terraTypeDefs = `#graphql
  type TerraProperty {
    id: ID!
    address: String
    propertyType: String
    sqft: Int
    ownerName: String
    createdAt: String
  }

  type TerraListing {
    id: ID!
    propertyId: ID
    agentId: ID
    listPrice: String
    status: String
    daysOnMarket: Int
    createdAt: String
  }

  type TerraDistressProperty {
    id: ID!
    address: String
    borough: String
    distressType: String
    opportunityScore: Float
    auctionDate: String
    createdAt: String
  }

  type TerraDeal {
    id: ID!
    address: String
    stage: String
    price: String
    probability: Int
    distressPropertyId: ID
    createdAt: String
  }

  type TerraLead {
    id: ID!
    firstName: String!
    lastName: String!
    type: String
    score: Int
    stage: String
    createdAt: String
  }

  type TerraActionItem {
    id: ID!
    externalId: String
    propertyId: String!
    issue: String!
    severity: String!
    ownerName: String!
    ownerRole: String!
    dueDate: String
    status: String!
    recommendedAction: String
    resolvedAt: String
    createdAt: String
    updatedAt: String
  }

  extend type Query {
    terraProperties(limit: Int, offset: Int): [TerraProperty!]!
    terraListings(status: String, limit: Int, offset: Int): [TerraListing!]!
    terraDistressProperties(borough: String, distressType: String, limit: Int, offset: Int): [TerraDistressProperty!]!
    terraDeals(stage: String, limit: Int, offset: Int): [TerraDeal!]!
    terraDeal(id: ID!): TerraDeal
    terraLeads(stage: String, limit: Int, offset: Int): [TerraLead!]!
    terraActionItems(propertyId: String, status: String, limit: Int, offset: Int): [TerraActionItem!]!
  }

  extend type Mutation {
    updateTerraDeal(id: ID!, stage: String, probability: Int): TerraDeal!
    createTerraLead(firstName: String!, lastName: String!, type: String): TerraLead!
    updateTerraActionItem(id: ID!, status: String, recommendedAction: String): TerraActionItem!
    seedTerraActionItems(propertyId: String!): [TerraActionItem!]!
  }

  extend type Subscription {
    terraDealUpdated: TerraDeal!
    terraActionItemUpdated: TerraActionItem!
  }
`;

async function buildTerraStorage(): Promise<TerraStoragePort> {
  const { db } = await import('@szl-holdings/db');
  const {
    terraPropertiesTable,
    terraListingsTable,
    terraDistressPropertiesTable,
    terraDealsTable,
    terraLeadsTable,
    terraActionItemsTable,
    alloyAuditLog,
  } = await import('@szl-holdings/db/schema');
  const { desc, eq, and } = await import('drizzle-orm');

  return {
    async listProperties(args) {
      try {
        return await db
          .select()
          .from(terraPropertiesTable)
          .orderBy(desc(terraPropertiesTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
      } catch {
        return [];
      }
    },
    async listListings(args) {
      try {
        const q = db
          .select()
          .from(terraListingsTable)
          .orderBy(desc(terraListingsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        if (args.status) return await q.where(eq(terraListingsTable.status, args.status as any));
        return await q;
      } catch {
        return [];
      }
    },
    async listDistressProperties(args) {
      try {
        const conditions = [];
        if (args.borough)
          conditions.push(eq(terraDistressPropertiesTable.borough, args.borough as any));
        if (args.distressType)
          conditions.push(eq(terraDistressPropertiesTable.distressType, args.distressType as any));
        const q = db
          .select()
          .from(terraDistressPropertiesTable)
          .orderBy(desc(terraDistressPropertiesTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        if (conditions.length > 0) return await q.where(and(...conditions));
        return await q;
      } catch {
        return [];
      }
    },
    async listDeals(args) {
      try {
        const q = db
          .select()
          .from(terraDealsTable)
          .orderBy(desc(terraDealsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        if (args.stage) return await q.where(eq(terraDealsTable.stage, args.stage as any));
        return await q;
      } catch {
        return [];
      }
    },
    async getDeal(id) {
      try {
        const rows = await db
          .select()
          .from(terraDealsTable)
          .where(eq(terraDealsTable.id, id))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    async updateDeal(id, data) {
      const updateData: Record<string, unknown> = {};
      if (data.stage) updateData.stage = data.stage;
      if (data.probability != null) updateData.probability = data.probability;
      const rows = await db
        .update(terraDealsTable)
        .set(updateData)
        .where(eq(terraDealsTable.id, id))
        .returning();
      const deal = rows[0];
      publish(WS_CHANNELS.TERRA_SIGNALS, 'deal-updated', {
        id: deal.id,
        stage: (deal as any).stage,
        probability: (deal as any).probability,
      });
      return deal;
    },
    async listLeads(args) {
      try {
        const q = db
          .select()
          .from(terraLeadsTable)
          .orderBy(desc(terraLeadsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        if (args.stage) return await q.where(eq(terraLeadsTable.stage, args.stage as any));
        return await q;
      } catch {
        return [];
      }
    },
    async createLead(data) {
      const rows = await db
        .insert(terraLeadsTable)
        .values(data as any)
        .returning();
      return rows[0];
    },
    async listActionItems(args) {
      try {
        const conditions: ReturnType<typeof eq>[] = [];
        if (args.propertyId) conditions.push(eq(terraActionItemsTable.propertyId, args.propertyId));
        if (args.status) conditions.push(eq(terraActionItemsTable.status, args.status as any));
        const q = db
          .select()
          .from(terraActionItemsTable)
          .orderBy(desc(terraActionItemsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        if (conditions.length > 0) return await q.where(and(...conditions));
        return await q;
      } catch {
        return [];
      }
    },
    async getActionItem(id) {
      try {
        const rows = await db
          .select({ status: terraActionItemsTable.status })
          .from(terraActionItemsTable)
          .where(eq(terraActionItemsTable.id, id))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    async updateActionItem(id, data) {
      const rows = await db
        .update(terraActionItemsTable)
        .set(data)
        .where(eq(terraActionItemsTable.id, id))
        .returning();
      const item = rows[0];
      if (!item) throw new Error(`Action item update returned no rows for id: ${id}`);
      publish(WS_CHANNELS.TERRA_SIGNALS, 'action-item-updated', {
        id: item.id,
        propertyId: item.propertyId,
        status: item.status,
      });
      return item;
    },
    async writeAuditLog(entry) {
      try {
        await db.insert(alloyAuditLog).values({
          entityType: 'action',
          entityId: entry.entityId,
          action: entry.action,
          actorType: 'system',
          previousState: entry.previousState,
          newState: entry.newState,
          notes: entry.notes,
        });
      } catch {
        /* Non-blocking */
      }
    },
    async getExistingActionItemExternalIds(propertyId) {
      try {
        const existing = await db
          .select({ externalId: terraActionItemsTable.externalId })
          .from(terraActionItemsTable)
          .where(eq(terraActionItemsTable.propertyId, propertyId));
        return new Set(existing.map((r) => r.externalId).filter(Boolean) as string[]);
      } catch {
        return new Set();
      }
    },
    async seedActionItems(propertyId, items) {
      if (items.length > 0) {
        await db
          .insert(terraActionItemsTable)
          .values(items.map((item) => ({ ...item, propertyId, isDemo: true })));
      }
      return await db
        .select()
        .from(terraActionItemsTable)
        .where(eq(terraActionItemsTable.propertyId, propertyId));
    },
  };
}

export const terraResolvers = {
  Query: {
    terraProperties: async (_: unknown, args: { limit?: number; offset?: number }) => {
      return listTerraProperties(await buildTerraStorage(), args);
    },
    terraListings: async (
      _: unknown,
      args: { status?: string; limit?: number; offset?: number },
    ) => {
      return listTerraListings(await buildTerraStorage(), args);
    },
    terraDistressProperties: async (
      _: unknown,
      args: { borough?: string; distressType?: string; limit?: number; offset?: number },
    ) => {
      return listTerraDistressProperties(await buildTerraStorage(), args);
    },
    terraDeals: async (_: unknown, args: { stage?: string; limit?: number; offset?: number }) => {
      return listTerraDeals(await buildTerraStorage(), args);
    },
    terraDeal: async (_: unknown, args: { id: string }) => {
      return getTerraDeal(await buildTerraStorage(), parseIntId(args.id));
    },
    terraLeads: async (_: unknown, args: { stage?: string; limit?: number; offset?: number }) => {
      return listTerraLeads(await buildTerraStorage(), args);
    },
    terraActionItems: async (
      _: unknown,
      args: { propertyId?: string; status?: string; limit?: number; offset?: number },
    ) => {
      return listTerraActionItems(await buildTerraStorage(), args);
    },
  },
  Mutation: {
    updateTerraDeal: async (
      _: unknown,
      args: { id: string; stage?: string; probability?: number },
      context: PublisherCtx,
    ) => {
      try {
        const deal = await updateTerraDeal(await buildTerraStorage(), parseIntId(args.id), {
          stage: args.stage,
          probability: args.probability,
        });
        const orgIds = await resolveResourceOrgIds(ownerOf(deal), context.req?.user?.id);
        pubsub.publish(TERRA_EVENTS.DEAL_UPDATED, { terraDealUpdated: deal, _orgIds: orgIds });
        return deal;
      } catch (err) {
        throw new Error(`Failed to update deal: ${err}`);
      }
    },
    createTerraLead: async (
      _: unknown,
      args: { firstName: string; lastName: string; type?: string },
    ) => {
      try {
        return await createTerraLead(await buildTerraStorage(), args);
      } catch (err) {
        throw new Error(`Failed to create lead: ${err}`);
      }
    },
    updateTerraActionItem: async (
      _: unknown,
      args: { id: string; status?: string; recommendedAction?: string },
      context: PublisherCtx,
    ) => {
      try {
        const item = await updateTerraActionItem(await buildTerraStorage(), parseIntId(args.id), {
          status: args.status,
          recommendedAction: args.recommendedAction,
        });
        const orgIds = await resolveResourceOrgIds(ownerOf(item), context.req?.user?.id);
        pubsub.publish(TERRA_EVENTS.ACTION_ITEM_UPDATED, { terraActionItemUpdated: item, _orgIds: orgIds });
        return item;
      } catch (err) {
        throw new Error(`Failed to update action item: ${err}`);
      }
    },
    seedTerraActionItems: async (_: unknown, args: { propertyId: string }) => {
      try {
        return await seedTerraActionItems(await buildTerraStorage(), args.propertyId);
      } catch (err) {
        throw new Error(`Failed to seed action items: ${err}`);
      }
    },
  },
  Subscription: {
    terraDealUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(TERRA_EVENTS.DEAL_UPDATED),
        (payload: { _orgIds?: number[] }, _variables, context: SubscriberCtx) => {
          return checkOrgAccess(payload._orgIds, context);
        },
      ),
    },
    terraActionItemUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(TERRA_EVENTS.ACTION_ITEM_UPDATED),
        (payload: { _orgIds?: number[] }, _variables, context: SubscriberCtx) => {
          return checkOrgAccess(payload._orgIds, context);
        },
      ),
    },
  },
};
