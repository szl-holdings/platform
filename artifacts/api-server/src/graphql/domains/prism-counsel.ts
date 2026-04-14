import { db } from "@szl-holdings/db";
import {
  pcMattersTable, pcDeadlinesTable, pcForecastsTable, pcApprovalRequestsTable,
  pcAuditEventsTable, pcCommunicationsTable, pcReadinessScoresTable,
  pcConnectorAccountsTable, pcAiRecommendationsTable,
} from "@szl-holdings/db";
import { eq, desc, and, sql } from "drizzle-orm";
import type { GraphQLContext } from "../index.js";

export const prismCounselTypeDefs = `#graphql

  # ── Core Matter Types ──────────────────────────────────────────────────────

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

  # ── Dashboard Summary ───────────────────────────────────────────────────────

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

  # ── Pressure Graph ──────────────────────────────────────────────────────────

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

  # ── Proof Chain ─────────────────────────────────────────────────────────────

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

  # ── Forecast Diff ────────────────────────────────────────────────────────────

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

  # ── Connector Health ─────────────────────────────────────────────────────────

  type PcConnectorAccount {
    id: Int!
    orgId: Int!
    connectorType: String!
    displayName: String!
    status: String!
    lastSyncAt: String
    createdAt: String!
  }

  # ── Data Products ────────────────────────────────────────────────────────────

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

  # ── Service Metrics ──────────────────────────────────────────────────────────

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
    # Matters
    pcMatters(orgId: Int!): [PcMatter!]!
    pcMatter(id: Int!): PcMatter
    pcDashboardSummary(orgId: Int!): PcDashboardSummary!

    # Deadlines
    pcDeadlines(matterId: Int!): [PcDeadline!]!
    pcUpcomingDeadlines(orgId: Int!, days: Int): [PcDeadline!]!

    # Forecasts
    pcForecasts(matterId: Int!): [PcForecast!]!
    pcForecastDiffs(matterId: Int!): [PcForecastDiff!]!

    # Pressure Graph
    pcPressureDimensions(matterId: Int!): [PcPressureDimension!]!

    # Proof Chain
    pcProofChainEntries(matterId: Int!): [PcProofChainEntry!]!

    # Approvals
    pcApprovalRequests(orgId: Int!, status: String): [PcApprovalRequest!]!
    pcMatterApprovals(matterId: Int!): [PcApprovalRequest!]!

    # Communications
    pcCommunications(matterId: Int!): [PcCommunication!]!

    # Connectors
    pcConnectorAccounts(orgId: Int!): [PcConnectorAccount!]!

    # Data Products
    pcDataProductScores(orgId: Int!, matterId: Int): [PcDataProductScore!]!

    # Service Metrics
    pcServiceMetrics(orgId: Int!, service: String): [PcServiceMetric!]!
  }

  extend type Mutation {
    # Approval actions
    pcApproveRequest(requestId: Int!, actorId: Int!): PcApprovalRequest!
    pcRejectRequest(requestId: Int!, actorId: Int!, reason: String): PcApprovalRequest!

    # AI recommendations
    pcAcceptRecommendation(recommendationId: Int!, actorId: Int!): PcAiRecommendation!
    pcDismissRecommendation(recommendationId: Int!, actorId: Int!): PcAiRecommendation!
  }
`;

export const prismCounselResolvers = {
  Query: {
    pcMatters: async (_: unknown, { orgId }: { orgId: number }, _ctx: GraphQLContext) => {
      try {
        return await db.select().from(pcMattersTable).where(eq(pcMattersTable.orgId, orgId)).orderBy(desc(pcMattersTable.updatedAt)).limit(100);
      } catch { return []; }
    },

    pcMatter: async (_: unknown, { id }: { id: number }, _ctx: GraphQLContext) => {
      try {
        const [matter] = await db.select().from(pcMattersTable).where(eq(pcMattersTable.id, id));
        return matter ?? null;
      } catch { return null; }
    },

    pcDashboardSummary: async (_: unknown, { orgId }: { orgId: number }, _ctx: GraphQLContext) => {
      try {
        const [mattersCount] = await db.select({ count: sql<number>`count(*)` }).from(pcMattersTable).where(eq(pcMattersTable.orgId, orgId));
        const [activeCnt] = await db.select({ count: sql<number>`count(*)` }).from(pcMattersTable).where(and(eq(pcMattersTable.orgId, orgId), sql`status NOT IN ('closed','archived')`));
        const [pendingApprCnt] = await db.select({ count: sql<number>`count(*)` }).from(pcApprovalRequestsTable).where(and(sql`org_id = ${orgId}`, eq(pcApprovalRequestsTable.status, "pending")));
        const upcoming14d = await db.select({ count: sql<number>`count(*)` }).from(pcDeadlinesTable).where(sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId}) AND due_date BETWEEN NOW() AND NOW() + INTERVAL '14 days' AND status = 'pending'`);
        const critical = await db.select({ count: sql<number>`count(*)` }).from(pcDeadlinesTable).where(sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId}) AND priority = 'critical' AND status = 'pending'`);

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
        return { totalMatters: 0, activeMatters: 0, pendingApprovals: 0, upcomingDeadlines14d: 0, criticalDeadlines: 0, totalExposure: null, connectorHealthSummary: null, pressureAlerts: 0 };
      }
    },

    pcDeadlines: async (_: unknown, { matterId }: { matterId: number }) => {
      try {
        return await db.select().from(pcDeadlinesTable).where(eq(pcDeadlinesTable.matterId, matterId)).orderBy(pcDeadlinesTable.dueDate);
      } catch { return []; }
    },

    pcUpcomingDeadlines: async (_: unknown, { orgId, days = 30 }: { orgId: number; days?: number }) => {
      try {
        return await db.select().from(pcDeadlinesTable)
          .where(sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId}) AND due_date BETWEEN NOW() AND NOW() + INTERVAL '${sql.raw(String(days))} days' AND status = 'pending'`)
          .orderBy(pcDeadlinesTable.dueDate).limit(50);
      } catch { return []; }
    },

    pcForecasts: async (_: unknown, { matterId }: { matterId: number }) => {
      try {
        return await db.select().from(pcForecastsTable).where(eq(pcForecastsTable.matterId, matterId)).orderBy(desc(pcForecastsTable.createdAt));
      } catch { return []; }
    },

    pcForecastDiffs: async (_: unknown, { matterId }: { matterId: number }) => {
      try {
        const { pcForecastDiffsTable } = await import("@szl-holdings/db");
        return await db.select().from(pcForecastDiffsTable).where(eq(pcForecastDiffsTable.matterId, matterId)).orderBy(desc(pcForecastDiffsTable.createdAt)).limit(20);
      } catch { return []; }
    },

    pcPressureDimensions: async (_: unknown, { matterId }: { matterId: number }) => {
      try {
        const { pcPressureGraphDimensionsTable } = await import("@szl-holdings/db");
        return await db.select().from(pcPressureGraphDimensionsTable).where(eq(pcPressureGraphDimensionsTable.matterId, matterId)).orderBy(desc(pcPressureGraphDimensionsTable.computedAt)).limit(12);
      } catch { return []; }
    },

    pcProofChainEntries: async (_: unknown, { matterId }: { matterId: number }) => {
      try {
        const { pcProofChainEntriesTable } = await import("@szl-holdings/db");
        return await db.select().from(pcProofChainEntriesTable).where(eq(pcProofChainEntriesTable.matterId, matterId)).orderBy(desc(pcProofChainEntriesTable.createdAt)).limit(50);
      } catch { return []; }
    },

    pcApprovalRequests: async (_: unknown, { orgId, status }: { orgId: number; status?: string }) => {
      try {
        const cond = status
          ? and(sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId})`, eq(pcApprovalRequestsTable.status, status as any))
          : sql`matter_id IN (SELECT id FROM pc_matters WHERE org_id = ${orgId})`;
        return await db.select().from(pcApprovalRequestsTable).where(cond).orderBy(desc(pcApprovalRequestsTable.requestedAt)).limit(100);
      } catch { return []; }
    },

    pcMatterApprovals: async (_: unknown, { matterId }: { matterId: number }) => {
      try {
        return await db.select().from(pcApprovalRequestsTable).where(eq(pcApprovalRequestsTable.matterId, matterId)).orderBy(desc(pcApprovalRequestsTable.requestedAt));
      } catch { return []; }
    },

    pcCommunications: async (_: unknown, { matterId }: { matterId: number }) => {
      try {
        return await db.select().from(pcCommunicationsTable).where(eq(pcCommunicationsTable.matterId, matterId)).orderBy(desc(pcCommunicationsTable.sentAt)).limit(50);
      } catch { return []; }
    },

    pcConnectorAccounts: async (_: unknown, { orgId }: { orgId: number }) => {
      try {
        return await db.select().from(pcConnectorAccountsTable).where(eq(pcConnectorAccountsTable.orgId, orgId)).orderBy(pcConnectorAccountsTable.connectorType);
      } catch { return []; }
    },

    pcDataProductScores: async (_: unknown, { orgId, matterId }: { orgId: number; matterId?: number }) => {
      try {
        const { pcDataProductScoresTable } = await import("@szl-holdings/db");
        const cond = matterId
          ? and(eq(pcDataProductScoresTable.orgId, orgId), eq(pcDataProductScoresTable.matterId, matterId))
          : eq(pcDataProductScoresTable.orgId, orgId);
        return await db.select().from(pcDataProductScoresTable).where(cond).orderBy(desc(pcDataProductScoresTable.computedAt)).limit(100);
      } catch { return []; }
    },

    pcServiceMetrics: async (_: unknown, { orgId, service }: { orgId: number; service?: string }) => {
      try {
        const { pcServiceMetricsTable } = await import("@szl-holdings/db");
        const cond = service
          ? and(eq(pcServiceMetricsTable.orgId, orgId), eq(pcServiceMetricsTable.service, service as any))
          : eq(pcServiceMetricsTable.orgId, orgId);
        return await db.select().from(pcServiceMetricsTable).where(cond).orderBy(desc(pcServiceMetricsTable.measuredAt)).limit(50);
      } catch { return []; }
    },
  },

  Mutation: {
    pcApproveRequest: async (_: unknown, { requestId, actorId }: { requestId: number; actorId: number }, _ctx: GraphQLContext) => {
      const [updated] = await db.update(pcApprovalRequestsTable)
        .set({ status: "approved", approvedBy: actorId, resolvedAt: new Date() })
        .where(eq(pcApprovalRequestsTable.id, requestId))
        .returning();
      if (!updated) throw new Error("Approval request not found");
      return updated;
    },

    pcRejectRequest: async (_: unknown, { requestId, actorId, reason }: { requestId: number; actorId: number; reason?: string }, _ctx: GraphQLContext) => {
      const [updated] = await db.update(pcApprovalRequestsTable)
        .set({ status: "rejected", approvedBy: actorId, resolvedAt: new Date() })
        .where(eq(pcApprovalRequestsTable.id, requestId))
        .returning();
      if (!updated) throw new Error("Approval request not found");
      return updated;
    },

    pcAcceptRecommendation: async (_: unknown, { recommendationId, actorId }: { recommendationId: number; actorId: number }, _ctx: GraphQLContext) => {
      const [updated] = await db.update(pcAiRecommendationsTable)
        .set({ status: "accepted", reviewedBy: actorId, reviewedAt: new Date() })
        .where(eq(pcAiRecommendationsTable.id, recommendationId))
        .returning();
      if (!updated) throw new Error("Recommendation not found");
      return updated;
    },

    pcDismissRecommendation: async (_: unknown, { recommendationId, actorId }: { recommendationId: number; actorId: number }, _ctx: GraphQLContext) => {
      const [updated] = await db.update(pcAiRecommendationsTable)
        .set({ status: "dismissed", reviewedBy: actorId, reviewedAt: new Date() })
        .where(eq(pcAiRecommendationsTable.id, recommendationId))
        .returning();
      if (!updated) throw new Error("Recommendation not found");
      return updated;
    },
  },

  PcMatter: {
    deadlines: async (matter: { id: number }) => {
      try { return await db.select().from(pcDeadlinesTable).where(eq(pcDeadlinesTable.matterId, matter.id)).orderBy(pcDeadlinesTable.dueDate); } catch { return []; }
    },
    forecasts: async (matter: { id: number }) => {
      try { return await db.select().from(pcForecastsTable).where(eq(pcForecastsTable.matterId, matter.id)).orderBy(desc(pcForecastsTable.createdAt)).limit(10); } catch { return []; }
    },
    communications: async (matter: { id: number }) => {
      try { return await db.select().from(pcCommunicationsTable).where(eq(pcCommunicationsTable.matterId, matter.id)).orderBy(desc(pcCommunicationsTable.sentAt)).limit(20); } catch { return []; }
    },
    readinessScores: async (matter: { id: number }) => {
      try { return await db.select().from(pcReadinessScoresTable).where(eq(pcReadinessScoresTable.matterId, matter.id)).orderBy(desc(pcReadinessScoresTable.computedAt)); } catch { return []; }
    },
    approvalRequests: async (matter: { id: number }) => {
      try { return await db.select().from(pcApprovalRequestsTable).where(eq(pcApprovalRequestsTable.matterId, matter.id)).orderBy(desc(pcApprovalRequestsTable.requestedAt)); } catch { return []; }
    },
    recommendations: async (matter: { id: number }) => {
      try { return await db.select().from(pcAiRecommendationsTable).where(eq(pcAiRecommendationsTable.matterId, matter.id)).orderBy(desc(pcAiRecommendationsTable.createdAt)).limit(10); } catch { return []; }
    },
  },
};
