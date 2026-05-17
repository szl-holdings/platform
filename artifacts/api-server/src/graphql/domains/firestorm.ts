import {
  type FirestormStoragePort,
  getFirestormAssessment,
  getFirestormIncident,
  listFirestormAssessments,
  listFirestormAssets,
  listFirestormFindings,
  listFirestormIncidents,
  updateFirestormIncident,
} from '../../lib/domain-services/firestorm/index.js';
import { withFilter } from 'graphql-subscriptions';
import { FIRESTORM_EVENTS, pubsub } from '../../lib/pubsub-bridge.js';
import { publish, WS_CHANNELS } from '../../lib/websocket.js';
import type { GraphQLContext } from '../index.js';

export const aegisTypeDefs = `#graphql
  type AegisAssessment {
    id: ID!
    name: String!
    assessmentType: String
    status: String
    overallRiskScore: Float
    createdAt: String
    findings: [AegisFinding!]!
  }

  type AegisFinding {
    id: ID!
    assessmentId: ID
    severity: String
    status: String
    affectedAsset: String
    recommendation: String
    createdAt: String
  }

  type AegisIncident {
    id: ID!
    title: String!
    severity: String
    status: String
    detectedAt: String
    createdAt: String
  }

  type AegisAsset {
    id: ID!
    name: String!
    assetType: String
    riskScore: Float
    exposureLevel: String
    createdAt: String
  }

  extend type Query {
    aegisAssessments(limit: Int, offset: Int): [AegisAssessment!]!
    aegisAssessment(id: ID!): AegisAssessment
    aegisFindings(assessmentId: ID, severity: String, limit: Int, offset: Int): [AegisFinding!]!
    aegisIncidents(status: String, severity: String, limit: Int, offset: Int): [AegisIncident!]!
    aegisIncident(id: ID!): AegisIncident
    aegisAssets(limit: Int, offset: Int): [AegisAsset!]!
  }

  extend type Mutation {
    updateAegisIncident(id: ID!, status: String!): AegisIncident!
  }

  extend type Subscription {
    aegisIncidentUpdated: AegisIncident!
  }
`;

/** @deprecated Use aegisTypeDefs */
export const firestormTypeDefs = aegisTypeDefs;

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

async function buildFirestormStorage(): Promise<FirestormStoragePort> {
  const { db } = await import('@szl-holdings/db');
  const {
    firestormAssessmentsTable,
    firestormFindingsTable,
    firestormIncidentsTable,
    firestormAssetsTable,
  } = await import('@szl-holdings/db/schema');
  const { desc, eq, and } = await import('drizzle-orm');

  return {
    async listAssessments(args) {
      try {
        return await db
          .select()
          .from(firestormAssessmentsTable)
          .orderBy(desc(firestormAssessmentsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
      } catch {
        return [];
      }
    },
    async getAssessment(id) {
      try {
        const rows = await db
          .select()
          .from(firestormAssessmentsTable)
          .where(eq(firestormAssessmentsTable.id, id))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    async listFindings(args) {
      try {
        const conditions = [];
        if (args.assessmentId)
          conditions.push(eq(firestormFindingsTable.assessmentId, args.assessmentId));
        if (args.severity)
          conditions.push(eq(firestormFindingsTable.severity, args.severity as any));
        const q = db
          .select()
          .from(firestormFindingsTable)
          .orderBy(desc(firestormFindingsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
        if (conditions.length > 0) return await q.where(and(...conditions));
        return await q;
      } catch {
        return [];
      }
    },
    async listIncidents(args) {
      try {
        const conditions = [];
        if (args.status) conditions.push(eq(firestormIncidentsTable.status, args.status as any));
        if (args.severity)
          conditions.push(eq(firestormIncidentsTable.severity, args.severity as any));
        const q = db
          .select()
          .from(firestormIncidentsTable)
          .orderBy(desc(firestormIncidentsTable.detectedAt))
          .limit(args.limit)
          .offset(args.offset);
        if (conditions.length > 0) return await q.where(and(...conditions));
        return await q;
      } catch {
        return [];
      }
    },
    async getIncident(id) {
      try {
        const rows = await db
          .select()
          .from(firestormIncidentsTable)
          .where(eq(firestormIncidentsTable.id, id))
          .limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    async updateIncident(id, data) {
      const rows = await db
        .update(firestormIncidentsTable)
        .set(data as any)
        .where(eq(firestormIncidentsTable.id, id))
        .returning();
      const incident = rows[0];
      publish(WS_CHANNELS.AEGIS_INCIDENTS, 'incident-updated', {
        id: incident.id,
        status: incident.status,
        severity: (incident as any).severity,
      });
      return incident;
    },
    async listAssets(args) {
      try {
        return await db
          .select()
          .from(firestormAssetsTable)
          .orderBy(desc(firestormAssetsTable.createdAt))
          .limit(args.limit)
          .offset(args.offset);
      } catch {
        return [];
      }
    },
  };
}

export const aegisResolvers = {
  Query: {
    aegisAssessments: async (_: unknown, args: { limit?: number; offset?: number }) => {
      return listFirestormAssessments(await buildFirestormStorage(), args);
    },
    aegisAssessment: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
      const numId = parseInt(args.id, 10);
      if (context?.loaders?.aegisAssessmentById) {
        return context.loaders.aegisAssessmentById.load(numId);
      }
      return getFirestormAssessment(await buildFirestormStorage(), numId);
    },
    aegisFindings: async (
      _: unknown,
      args: { assessmentId?: string; severity?: string; limit?: number; offset?: number },
    ) => {
      return listFirestormFindings(await buildFirestormStorage(), {
        assessmentId: args.assessmentId ? parseInt(args.assessmentId, 10) : undefined,
        severity: args.severity,
        limit: args.limit,
        offset: args.offset,
      });
    },
    aegisIncidents: async (
      _: unknown,
      args: { status?: string; severity?: string; limit?: number; offset?: number },
    ) => {
      return listFirestormIncidents(await buildFirestormStorage(), args);
    },
    aegisIncident: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
      const numId = parseInt(args.id, 10);
      if (context?.loaders?.aegisIncidentById) {
        return context.loaders.aegisIncidentById.load(numId);
      }
      return getFirestormIncident(await buildFirestormStorage(), numId);
    },
    aegisAssets: async (_: unknown, args: { limit?: number; offset?: number }) => {
      return listFirestormAssets(await buildFirestormStorage(), args);
    },
  },
  AegisAssessment: {
    findings: async (assessment: { id: number }, _: unknown, context: GraphQLContext) => {
      if (context?.loaders?.findingsByAssessmentId) {
        return context.loaders.findingsByAssessmentId.load(assessment.id);
      }
      return listFirestormFindings(await buildFirestormStorage(), { assessmentId: assessment.id });
    },
  },
  Mutation: {
    updateAegisIncident: async (_: unknown, args: { id: string; status: string }, context: PublisherCtx) => {
      try {
        const incident = await updateFirestormIncident(
          await buildFirestormStorage(),
          parseInt(args.id, 10),
          args.status,
        );
        const orgIds = await resolveResourceOrgIds(null, context.req?.user?.id);
        pubsub.publish(FIRESTORM_EVENTS.INCIDENT_UPDATED, { aegisIncidentUpdated: incident, _orgIds: orgIds });
        return incident;
      } catch (err) {
        throw new Error(`Failed to update incident: ${err}`);
      }
    },
  },
  Subscription: {
    aegisIncidentUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(FIRESTORM_EVENTS.INCIDENT_UPDATED),
        (payload: { _orgIds?: number[] }, _variables, context: SubscriberCtx) => {
          return checkOrgAccess(payload._orgIds, context);
        },
      ),
    },
  },
};

/** @deprecated Use aegisResolvers */
export const firestormResolvers = aegisResolvers;
