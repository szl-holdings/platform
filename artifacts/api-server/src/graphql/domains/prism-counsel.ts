import {
  db,
  pcAiRecommendationsTable,
  pcApprovalRequestsTable,
  pcCommunicationsTable,
  pcConnectorAccountsTable,
  pcDeadlinesTable,
  pcForecastsTable,
  pcMattersTable,
  pcReadinessScoresTable,
} from '@szl-holdings/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  acceptPcRecommendation,
  approvePcRequest,
  dismissPcRecommendation,
  getPcApprovalRequests,
  getPcCommunications,
  getPcConnectorAccounts,
  getPcDashboardSummary,
  getPcDataProductScores,
  getPcDeadlines,
  getPcForecastDiffs,
  getPcForecasts,
  getPcMatter,
  getPcMatterApprovals,
  getPcMatters,
  getPcPressureDimensions,
  getPcProofChainEntries,
  getPcServiceMetrics,
  getPcUpcomingDeadlines,
  type PrismCounselStoragePort,
  rejectPcRequest,
} from '../../lib/domain-services/prism-counsel/index.js';
import type { GraphQLContext } from '../index.js';

export const prismCounselTypeDefs = `#graphql

  type PcMatter {
    id: Int!
    orgId: Int!
    title: String!
    caseNumber: String
    matterType: String!
    status: String!
    stage: String
    jurisdiction: String
    courtName: String
    healthScore: Int
    settlementLow: String
    settlementHigh: String
    settlementMid: String
    totalDamages: String
    totalLiens: String
    privilegeFlag: Boolean
    exportSafe: Boolean
    createdAt: String!
    updatedAt: String!
    deadlines: [PcDeadline!]
    forecasts: [PcForecast!]
    communications: [PcCommunication!]
    readinessScores: [PcReadinessScore!]
    approvalRequests: [PcApprovalRequest!]
    recommendations: [PcAiRecommendation!]
  }

  type PcDeadline {
    id: Int!
    matterId: Int!
    title: String!
    deadlineType: String!
    dueDate: String!
    priority: String!
    status: String!
    assignedTo: Int
    notes: String
    createdAt: String!
  }

  type PcForecast {
    id: Int!
    matterId: Int!
    forecastType: String!
    confidence: String
    valueLow: String
    valueHigh: String
    valueMid: String
    signals: JSON
    drivers: JSON
    previousSnapshot: JSON
    explanation: String
    requiresAttorneyReview: Boolean
    modelRoute: String
    createdAt: String!
  }

  type PcCommunication {
    id: Int!
    matterId: Int!
    direction: String!
    channel: String!
    fromParty: String
    toParty: String
    subject: String
    summary: String
    extractedAsks: JSON
    extractedCommitments: JSON
    isPrivileged: Boolean
    sentAt: String!
  }

  type PcReadinessScore {
    id: Int!
    matterId: Int!
    pillar: String!
    score: Int!
    maxScore: Int!
    details: JSON
    computedAt: String!
  }

  type PcApprovalRequest {
    id: Int!
    matterId: Int!
    requestType: String!
    title: String!
    description: String
    sourceBasis: JSON
    requestedBy: Int
    approvedBy: Int
    status: String!
    requestedAt: String!
    resolvedAt: String
  }

  type PcAiRecommendation {
    id: Int!
    matterId: Int!
    recommendationType: String!
    title: String!
    description: String!
    priority: String!
    confidence: String
    citations: JSON
    status: String!
    defensibilityScore: Int
    modelRoute: String
    reviewedBy: Int
    reviewedAt: String
    createdAt: String!
  }

  type PcDashboardSummary {
    totalMatters: Int!
    activeMatters: Int!
    pendingApprovals: Int!
    upcomingDeadlines14d: Int!
    criticalDeadlines: Int!
    totalExposure: String
    connectorHealthSummary: JSON
    pressureAlerts: Int!
  }

  type PcPressureDimension {
    id: Int!
    matterId: Int!
    dimension: String!
    currentScore: Float!
    priorScore: Float
    movementDirection: String!
    topDrivers: JSON
    sourceMix: JSON
    confidence: Float
    affectedMilestones: JSON
    likelyConsequence: String
    recommendedNextActions: JSON
    computedAt: String!
  }

  type PcProofChainEntry {
    id: Int!
    orgId: Int!
    matterId: Int
    outputType: String!
    outputRef: String!
    sourceReferences: JSON
    sourceClass: String
    extractionConfidence: Float
    modelLane: String
    modelProvider: String
    modelVersion: String
    actorId: Int
    reviewState: String!
    privilegeFlag: Boolean
    exportSafe: Boolean
    generatedAt: String!
  }

  type PcForecastDiff {
    id: Int!
    matterId: Int!
    forecastType: String!
    currentScore: Float!
    priorScore: Float
    trend: String!
    confidence: Float
    topDrivers: JSON
    whatChanged: String
    highestLeverageAction: String
    approvalRequired: Boolean
    lastRefreshAt: String!
  }

  type PcConnectorAccount {
    id: Int!
    orgId: Int!
    connectorType: String!
    displayName: String!
    status: String!
    lastSyncAt: String
    createdAt: String!
  }

  type PcDataProductScore {
    id: Int!
    orgId: Int!
    matterId: Int
    product: String!
    score: Float!
    priorScore: Float
    movement: String!
    components: JSON
    topDrivers: JSON
    confidence: Float
    computedAt: String!
  }

  type PcServiceMetric {
    id: Int!
    service: String!
    latencyP50Ms: Float
    latencyP95Ms: Float
    latencyP99Ms: Float
    requestCount: Int
    errorCount: Int
    queueDepth: Int
    dlqDepth: Int
    syncLagMs: Int
    healthStatus: String!
    measuredAt: String!
  }

  scalar JSON

  extend type Query {
    pcMatters(orgId: Int!): [PcMatter!]!
    pcMatter(id: Int!): PcMatter
    pcDashboardSummary(orgId: Int!): PcDashboardSummary!
    pcDeadlines(matterId: Int!): [PcDeadline!]!
    pcUpcomingDeadlines(orgId: Int!, days: Int): [PcDeadline!]!
    pcForecasts(matterId: Int!): [PcForecast!]!
    pcForecastDiffs(matterId: Int!): [PcForecastDiff!]!
    pcPressureDimensions(matterId: Int!): [PcPressureDimension!]!
    pcProofChainEntries(matterId: Int!): [PcProofChainEntry!]!
    pcApprovalRequests(orgId: Int!, status: String): [PcApprovalRequest!]!
    pcMatterApprovals(matterId: Int!): [PcApprovalRequest!]!
    pcCommunications(matterId: Int!): [PcCommunication!]!
    pcConnectorAccounts(orgId: Int!): [PcConnectorAccount!]!
    pcDataProductScores(orgId: Int!, matterId: Int): [PcDataProductScore!]!
    pcServiceMetrics(orgId: Int!, service: String): [PcServiceMetric!]!
  }

  extend type Mutation {
    pcApproveRequest(requestId: Int!, actorId: Int!): PcApprovalRequest!
    pcRejectRequest(requestId: Int!, actorId: Int!, reason: String): PcApprovalRequest!
    pcAcceptRecommendation(recommendationId: Int!, actorId: Int!): PcAiRecommendation!
    pcDismissRecommendation(recommendationId: Int!, actorId: Int!): PcAiRecommendation!
  }
`;

function buildPrismStorage(): PrismCounselStoragePort {
  return {
    async listMatters(orgId) {
      try {
        return await db
          .select()
          .from(pcMattersTable)
          .where(eq(pcMattersTable.orgId, orgId))
          .orderBy(desc(pcMattersTable.updatedAt))
          .limit(100);
      } catch {
        return [];
      }
    },
    async getMatter(id) {
      try {
        const [m] = await db.select().from(pcMattersTable).where(eq(pcMattersTable.id, id));
        return m ?? null;
      } catch {
        return null;
      }
    },
    async getDashboardSummary(orgId) {
      try {
        const [mattersCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(pcMattersTable)
          .where(eq(pcMattersTable.orgId, orgId));
        const [activeCnt] = await db
          .select({ count: sql<number>`count(*)` })
          .from(pcMattersTable)
          .where(and(eq(pcMattersTable.orgId, orgId), sql`status NOT IN ('closed','archived')`));
        const [pendingApprCnt] = await db
          .select({ count: sql<number>`count(*)` })
          .from(pcApprovalRequestsTable)
          .where(and(sql`org_id = ${orgId}`, eq(pcApprovalRequestsTable.status, 'pending')));
        const upcoming14d = await db
          .select({ count: sql<number>`count(*)` })
          .from(pcDeadlinesTable)
          .where(
            sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId}) AND due_date BETWEEN NOW() AND NOW() + INTERVAL '14 days' AND status = 'pending'`,
          );
        const critical = await db
          .select({ count: sql<number>`count(*)` })
          .from(pcDeadlinesTable)
          .where(
            sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId}) AND priority = 'critical' AND status = 'pending'`,
          );
        return {
          totalMatters: Number(mattersCount?.count ?? 0),
          activeMatters: Number(activeCnt?.count ?? 0),
          pendingApprovals: Number(pendingApprCnt?.count ?? 0),
          upcomingDeadlines14d: Number(upcoming14d[0]?.count ?? 0),
          criticalDeadlines: Number(critical[0]?.count ?? 0),
          totalExposure: null,
          connectorHealthSummary: null,
          pressureAlerts: 0,
        };
      } catch {
        return {
          totalMatters: 0,
          activeMatters: 0,
          pendingApprovals: 0,
          upcomingDeadlines14d: 0,
          criticalDeadlines: 0,
          totalExposure: null,
          connectorHealthSummary: null,
          pressureAlerts: 0,
        };
      }
    },
    async listDeadlines(matterId) {
      try {
        return await db
          .select()
          .from(pcDeadlinesTable)
          .where(eq(pcDeadlinesTable.matterId, matterId))
          .orderBy(pcDeadlinesTable.dueDate);
      } catch {
        return [];
      }
    },
    async listUpcomingDeadlines(orgId, days) {
      try {
        return await db
          .select()
          .from(pcDeadlinesTable)
          .where(
            sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId}) AND due_date BETWEEN NOW() AND NOW() + INTERVAL '${sql.raw(String(days))} days' AND status = 'pending'`,
          )
          .orderBy(pcDeadlinesTable.dueDate)
          .limit(50);
      } catch {
        return [];
      }
    },
    async listForecasts(matterId) {
      try {
        return await db
          .select()
          .from(pcForecastsTable)
          .where(eq(pcForecastsTable.matterId, matterId))
          .orderBy(desc(pcForecastsTable.createdAt));
      } catch {
        return [];
      }
    },
    async listForecastDiffs(matterId) {
      try {
        const { pcForecastDiffsTable } = await import('@szl-holdings/db');
        return await db
          .select()
          .from(pcForecastDiffsTable)
          .where(eq(pcForecastDiffsTable.matterId, matterId))
          .orderBy(desc(pcForecastDiffsTable.createdAt))
          .limit(20);
      } catch {
        return [];
      }
    },
    async listPressureDimensions(matterId) {
      try {
        const { pcPressureGraphDimensionsTable } = await import('@szl-holdings/db');
        return await db
          .select()
          .from(pcPressureGraphDimensionsTable)
          .where(eq(pcPressureGraphDimensionsTable.matterId, matterId))
          .orderBy(desc(pcPressureGraphDimensionsTable.computedAt))
          .limit(12);
      } catch {
        return [];
      }
    },
    async listProofChainEntries(matterId) {
      try {
        const { pcProofChainEntriesTable } = await import('@szl-holdings/db');
        return await db
          .select()
          .from(pcProofChainEntriesTable)
          .where(eq(pcProofChainEntriesTable.matterId, matterId))
          .orderBy(desc(pcProofChainEntriesTable.createdAt))
          .limit(50);
      } catch {
        return [];
      }
    },
    async listApprovalRequests(orgId, status) {
      try {
        const cond = status
          ? and(
              sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId})`,
              eq(pcApprovalRequestsTable.status, status as any),
            )
          : sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId})`;
        return await db
          .select()
          .from(pcApprovalRequestsTable)
          .where(cond)
          .orderBy(desc(pcApprovalRequestsTable.requestedAt))
          .limit(100);
      } catch {
        return [];
      }
    },
    async listMatterApprovals(matterId) {
      try {
        return await db
          .select()
          .from(pcApprovalRequestsTable)
          .where(eq(pcApprovalRequestsTable.matterId, matterId))
          .orderBy(desc(pcApprovalRequestsTable.requestedAt));
      } catch {
        return [];
      }
    },
    async listCommunications(matterId) {
      try {
        return await db
          .select()
          .from(pcCommunicationsTable)
          .where(eq(pcCommunicationsTable.matterId, matterId))
          .orderBy(desc(pcCommunicationsTable.sentAt))
          .limit(50);
      } catch {
        return [];
      }
    },
    async listConnectorAccounts(orgId) {
      try {
        return await db
          .select()
          .from(pcConnectorAccountsTable)
          .where(eq(pcConnectorAccountsTable.orgId, orgId))
          .orderBy(pcConnectorAccountsTable.connectorType);
      } catch {
        return [];
      }
    },
    async listDataProductScores(orgId, matterId) {
      try {
        const { pcDataProductScoresTable } = await import('@szl-holdings/db');
        const cond = matterId
          ? and(
              eq(pcDataProductScoresTable.orgId, orgId),
              eq(pcDataProductScoresTable.matterId, matterId),
            )
          : eq(pcDataProductScoresTable.orgId, orgId);
        return await db
          .select()
          .from(pcDataProductScoresTable)
          .where(cond)
          .orderBy(desc(pcDataProductScoresTable.computedAt))
          .limit(100);
      } catch {
        return [];
      }
    },
    async listServiceMetrics(orgId, service) {
      try {
        const { pcServiceMetricsTable } = await import('@szl-holdings/db');
        const cond = service
          ? and(
              eq(pcServiceMetricsTable.orgId, orgId),
              eq(pcServiceMetricsTable.service, service as any),
            )
          : eq(pcServiceMetricsTable.orgId, orgId);
        return await db
          .select()
          .from(pcServiceMetricsTable)
          .where(cond)
          .orderBy(desc(pcServiceMetricsTable.measuredAt))
          .limit(50);
      } catch {
        return [];
      }
    },
    async getMatterDeadlines(matterId) {
      try {
        return await db
          .select()
          .from(pcDeadlinesTable)
          .where(eq(pcDeadlinesTable.matterId, matterId))
          .orderBy(pcDeadlinesTable.dueDate);
      } catch {
        return [];
      }
    },
    async getMatterForecasts(matterId) {
      try {
        return await db
          .select()
          .from(pcForecastsTable)
          .where(eq(pcForecastsTable.matterId, matterId))
          .orderBy(desc(pcForecastsTable.createdAt))
          .limit(10);
      } catch {
        return [];
      }
    },
    async getMatterCommunications(matterId) {
      try {
        return await db
          .select()
          .from(pcCommunicationsTable)
          .where(eq(pcCommunicationsTable.matterId, matterId))
          .orderBy(desc(pcCommunicationsTable.sentAt))
          .limit(20);
      } catch {
        return [];
      }
    },
    async getMatterReadinessScores(matterId) {
      try {
        return await db
          .select()
          .from(pcReadinessScoresTable)
          .where(eq(pcReadinessScoresTable.matterId, matterId))
          .orderBy(desc(pcReadinessScoresTable.computedAt));
      } catch {
        return [];
      }
    },
    async getMatterApprovalRequests(matterId) {
      try {
        return await db
          .select()
          .from(pcApprovalRequestsTable)
          .where(eq(pcApprovalRequestsTable.matterId, matterId))
          .orderBy(desc(pcApprovalRequestsTable.requestedAt));
      } catch {
        return [];
      }
    },
    async getMatterRecommendations(matterId) {
      try {
        return await db
          .select()
          .from(pcAiRecommendationsTable)
          .where(eq(pcAiRecommendationsTable.matterId, matterId))
          .orderBy(desc(pcAiRecommendationsTable.createdAt))
          .limit(10);
      } catch {
        return [];
      }
    },
    async approveRequest(requestId, actorId) {
      const [updated] = await db
        .update(pcApprovalRequestsTable)
        .set({ status: 'approved', approvedBy: actorId, resolvedAt: new Date() })
        .where(eq(pcApprovalRequestsTable.id, requestId))
        .returning();
      if (!updated) throw new Error('Approval request not found');
      return updated;
    },
    async rejectRequest(requestId, actorId) {
      const [updated] = await db
        .update(pcApprovalRequestsTable)
        .set({ status: 'rejected', approvedBy: actorId, resolvedAt: new Date() })
        .where(eq(pcApprovalRequestsTable.id, requestId))
        .returning();
      if (!updated) throw new Error('Approval request not found');
      return updated;
    },
    async acceptRecommendation(recommendationId, actorId) {
      const [updated] = await db
        .update(pcAiRecommendationsTable)
        .set({ status: 'accepted', reviewedBy: actorId, reviewedAt: new Date() })
        .where(eq(pcAiRecommendationsTable.id, recommendationId))
        .returning();
      if (!updated) throw new Error('Recommendation not found');
      return updated;
    },
    async dismissRecommendation(recommendationId, actorId) {
      const [updated] = await db
        .update(pcAiRecommendationsTable)
        .set({ status: 'dismissed', reviewedBy: actorId, reviewedAt: new Date() })
        .where(eq(pcAiRecommendationsTable.id, recommendationId))
        .returning();
      if (!updated) throw new Error('Recommendation not found');
      return updated;
    },
  };
}

const pcStorage = buildPrismStorage();

export const prismCounselResolvers = {
  Query: {
    pcMatters: async (_: unknown, { orgId }: { orgId: number }, _ctx: GraphQLContext) =>
      getPcMatters(pcStorage, orgId),
    pcMatter: async (_: unknown, { id }: { id: number }, _ctx: GraphQLContext) =>
      getPcMatter(pcStorage, id),
    pcDashboardSummary: async (_: unknown, { orgId }: { orgId: number }, _ctx: GraphQLContext) =>
      getPcDashboardSummary(pcStorage, orgId),
    pcDeadlines: async (_: unknown, { matterId }: { matterId: number }) =>
      getPcDeadlines(pcStorage, matterId),
    pcUpcomingDeadlines: async (
      _: unknown,
      { orgId, days = 30 }: { orgId: number; days?: number },
    ) => getPcUpcomingDeadlines(pcStorage, orgId, days),
    pcForecasts: async (_: unknown, { matterId }: { matterId: number }) =>
      getPcForecasts(pcStorage, matterId),
    pcForecastDiffs: async (_: unknown, { matterId }: { matterId: number }) =>
      getPcForecastDiffs(pcStorage, matterId),
    pcPressureDimensions: async (_: unknown, { matterId }: { matterId: number }) =>
      getPcPressureDimensions(pcStorage, matterId),
    pcProofChainEntries: async (_: unknown, { matterId }: { matterId: number }) =>
      getPcProofChainEntries(pcStorage, matterId),
    pcApprovalRequests: async (_: unknown, { orgId, status }: { orgId: number; status?: string }) =>
      getPcApprovalRequests(pcStorage, orgId, status),
    pcMatterApprovals: async (_: unknown, { matterId }: { matterId: number }) =>
      getPcMatterApprovals(pcStorage, matterId),
    pcCommunications: async (_: unknown, { matterId }: { matterId: number }) =>
      getPcCommunications(pcStorage, matterId),
    pcConnectorAccounts: async (_: unknown, { orgId }: { orgId: number }) =>
      getPcConnectorAccounts(pcStorage, orgId),
    pcDataProductScores: async (
      _: unknown,
      { orgId, matterId }: { orgId: number; matterId?: number },
    ) => getPcDataProductScores(pcStorage, orgId, matterId),
    pcServiceMetrics: async (_: unknown, { orgId, service }: { orgId: number; service?: string }) =>
      getPcServiceMetrics(pcStorage, orgId, service),
  },

  Mutation: {
    pcApproveRequest: async (
      _: unknown,
      { requestId, actorId }: { requestId: number; actorId: number },
      _ctx: GraphQLContext,
    ) => approvePcRequest(pcStorage, requestId, actorId),
    pcRejectRequest: async (
      _: unknown,
      { requestId, actorId }: { requestId: number; actorId: number },
      _ctx: GraphQLContext,
    ) => rejectPcRequest(pcStorage, requestId, actorId),
    pcAcceptRecommendation: async (
      _: unknown,
      { recommendationId, actorId }: { recommendationId: number; actorId: number },
      _ctx: GraphQLContext,
    ) => acceptPcRecommendation(pcStorage, recommendationId, actorId),
    pcDismissRecommendation: async (
      _: unknown,
      { recommendationId, actorId }: { recommendationId: number; actorId: number },
      _ctx: GraphQLContext,
    ) => dismissPcRecommendation(pcStorage, recommendationId, actorId),
  },

  PcMatter: {
    deadlines: async (matter: { id: number }) => pcStorage.getMatterDeadlines(matter.id),
    forecasts: async (matter: { id: number }) => pcStorage.getMatterForecasts(matter.id),
    communications: async (matter: { id: number }) => pcStorage.getMatterCommunications(matter.id),
    readinessScores: async (matter: { id: number }) =>
      pcStorage.getMatterReadinessScores(matter.id),
    approvalRequests: async (matter: { id: number }) =>
      pcStorage.getMatterApprovalRequests(matter.id),
    recommendations: async (matter: { id: number }) =>
      pcStorage.getMatterRecommendations(matter.id),
  },
};
