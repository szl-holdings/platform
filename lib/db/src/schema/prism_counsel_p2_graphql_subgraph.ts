export const PRISM_COUNSEL_P2_SUBGRAPH_SDL = `
  extend type Query {
    portfolioSnapshot(firmId: ID!): PortfolioSnapshot
    partnerDigestRun(id: ID!): PartnerDigestRun
    partnerDigestRuns(firmId: ID!, digestType: String, limit: Int): [PartnerDigestRun!]!
    partnerActionRequest(id: ID!): PartnerActionRequest
    partnerActionRequests(matterId: ID, status: String): [PartnerActionRequest!]!
    partnerInterventionEvents(matterId: ID, actorId: ID): [PartnerInterventionEvent!]!
    exportReadinessSnapshot(matterId: ID!): ExportReadinessSnapshot
    signoffBacklogSnapshot(firmId: ID!): SignoffBacklogSnapshot
    reviewBacklogSnapshot(firmId: ID!): ReviewBacklogSnapshot
    movementOpportunitySnapshot(firmId: ID!): MovementOpportunitySnapshot
    portfolioForecasts(firmId: ID!): [PortfolioForecast!]!
  }

  extend type Mutation {
    triggerDigestRun(firmId: ID!, digestType: String!): PartnerDigestRun!
    submitPartnerAction(input: PartnerActionInput!): PartnerActionRequest!
    recordInterventionEvent(input: InterventionEventInput!): PartnerInterventionEvent!
    refreshPortfolioSnapshot(firmId: ID!): PortfolioSnapshot!
  }

  type PortfolioSnapshot {
    id: ID!
    firmId: ID!
    snapshotDate: String!
    totalMatters: Int!
    criticalPressureCount: Int!
    highPressureCount: Int!
    moderatePressureCount: Int!
    quietRiskCount: Int!
    reviewBacklogSize: Int!
    signoffBacklogSize: Int!
    approvalBottleneckCount: Int!
    avgReviewLagDays: Float!
    avgSignoffLagDays: Float!
    insurerDragCount: Int!
    recoveryDragCount: Int!
    movementOpportunityCount: Int!
    teamThroughputScores: [TeamThroughputScore!]!
    createdAt: String!
  }

  type TeamThroughputScore {
    teamId: ID!
    teamLabel: String!
    clearRate: Float!
    matterCount: Int!
    trend: String!
  }

  type PartnerDigestRun {
    id: ID!
    firmId: ID!
    digestType: String!
    status: String!
    triggeredBy: String!
    triggeredAt: String!
    completedAt: String
    matterCount: Int
    highlights: [String!]!
    nextActionItems: [String!]!
    sourceClasses: [String!]!
    proofChainRef: String
    requiresSignoff: Boolean!
    signoffBy: String
    signedOffAt: String
  }

  type PartnerActionRequest {
    id: ID!
    matterId: ID!
    actionType: String!
    requestedByUserId: ID!
    requestedAt: String!
    status: String!
    notes: String
    resolvedAt: String
    resolvedByUserId: ID
    resolutionNotes: String
  }

  type PartnerInterventionEvent {
    id: ID!
    matterId: ID!
    intervenedByUserId: ID!
    interventionType: String!
    leverageScoreBefore: Float
    pressureScoreBefore: Float
    pressureScoreAfter: Float
    outcome: String
    occurredAt: String!
    notes: String
  }

  type ExportReadinessSnapshot {
    id: ID!
    matterId: ID!
    readinessScore: Float!
    privilegeReviewComplete: Boolean!
    signoffComplete: Boolean!
    exportBlockers: [String!]!
    computedAt: String!
  }

  type SignoffBacklogSnapshot {
    id: ID!
    firmId: ID!
    backlogCount: Int!
    criticalCount: Int!
    avgAgeDays: Float!
    items: [BacklogItem!]!
    computedAt: String!
  }

  type ReviewBacklogSnapshot {
    id: ID!
    firmId: ID!
    backlogCount: Int!
    criticalCount: Int!
    avgAgeDays: Float!
    blocksExportCount: Int!
    items: [BacklogItem!]!
    computedAt: String!
  }

  type BacklogItem {
    itemId: ID!
    matterId: ID!
    itemType: String!
    priority: String!
    ageDays: Float!
    confidence: Float
    blocksExport: Boolean!
    assignedToUserId: ID
  }

  type MovementOpportunitySnapshot {
    id: ID!
    firmId: ID!
    opportunityCount: Int!
    opportunities: [MovementOpportunity!]!
    computedAt: String!
  }

  type MovementOpportunity {
    matterId: ID!
    opportunityScore: Float!
    opportunityType: String!
    drivers: [String!]!
    recommendedAction: String!
    estimatedDaysToAct: Int
    confidence: Float!
  }

  type PortfolioForecast {
    id: ID!
    firmId: ID!
    forecastType: String!
    currentScore: Float!
    priorScore: Float!
    trend: String!
    confidence: Float!
    drivers: [String!]!
    sourceClasses: [String!]!
    nextAction: String!
    whoShouldAct: String!
    approvalRequired: Boolean!
    affectedMatterIds: [ID!]!
    forecastDate: String!
  }

  input PartnerActionInput {
    matterId: ID!
    actionType: String!
    requestedByUserId: ID!
    notes: String
  }

  input InterventionEventInput {
    matterId: ID!
    intervenedByUserId: ID!
    interventionType: String!
    leverageScoreBefore: Float
    pressureScoreBefore: Float
    notes: String
  }
`;

export const PRISM_COUNSEL_P2_RESOLVERS_STUB = {
  Query: {
    portfolioSnapshot: async (_: any, { firmId }: any, ctx: any) => {
      return ctx.db.query.pcPartnerPortfolioSnapshots.findFirst({
        where: (t: any, { eq }: any) => eq(t.firmId, firmId),
        orderBy: (t: any, { desc }: any) => [desc(t.snapshotDate)],
      });
    },
    partnerDigestRuns: async (_: any, { firmId, digestType, limit }: any, ctx: any) => {
      return ctx.db.query.pcPartnerDigestRuns.findMany({
        where: (t: any, { eq, and }: any) =>
          digestType ? and(eq(t.firmId, firmId), eq(t.digestType, digestType)) : eq(t.firmId, firmId),
        orderBy: (t: any, { desc }: any) => [desc(t.triggeredAt)],
        limit: limit ?? 20,
      });
    },
    portfolioForecasts: async (_: any, { firmId }: any, ctx: any) => {
      return ctx.db.query.pcPortfolioForecasts.findMany({
        where: (t: any, { eq }: any) => eq(t.firmId, firmId),
        orderBy: (t: any, { desc }: any) => [desc(t.forecastDate)],
      });
    },
  },
  Mutation: {
    triggerDigestRun: async (_: any, { firmId, digestType }: any, ctx: any) => {
      const [run] = await ctx.db.insert(ctx.schema.pcPartnerDigestRuns).values({
        firmId,
        digestType,
        status: "pending",
        triggeredBy: ctx.userId ?? "system",
        triggeredAt: new Date(),
        highlights: [],
        nextActionItems: [],
        sourceClasses: [],
        requiresSignoff: false,
      }).returning();
      return run;
    },
    submitPartnerAction: async (_: any, { input }: any, ctx: any) => {
      const [action] = await ctx.db.insert(ctx.schema.pcPartnerActionRequests).values({
        ...input,
        requestedAt: new Date(),
        status: "pending",
      }).returning();
      return action;
    },
    recordInterventionEvent: async (_: any, { input }: any, ctx: any) => {
      const [event] = await ctx.db.insert(ctx.schema.pcPartnerInterventionEvents).values({
        ...input,
        occurredAt: new Date(),
      }).returning();
      return event;
    },
    refreshPortfolioSnapshot: async (_: any, { firmId }: any, ctx: any) => {
      return ctx.db.query.pcPartnerPortfolioSnapshots.findFirst({
        where: (t: any, { eq }: any) => eq(t.firmId, firmId),
        orderBy: (t: any, { desc }: any) => [desc(t.snapshotDate)],
      });
    },
  },
};
