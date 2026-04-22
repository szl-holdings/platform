import {
  db,
  pcInsurerPressureDriversTable,
  pcInsurerPressureSnapshotsTable,
  pcMovementRecommendationsTable,
  pcPortfolioTeamLagMetricsTable,
  pcQuietRiskSnapshotsTable,
  pcSettlementFrictionDriversTable,
  pcSettlementFrictionSnapshotsTable,
  pcWorldlineRecoveryMarkersTable,
  pcWorldlineRegulatoryEventsTable,
  pcWorldlineSignalOverlaysTable,
  pcWorldlineWeatherEventsTable,
} from '@szl-holdings/db';
import { and, desc, eq, } from 'drizzle-orm';
import { copilotPilotOne } from '../../services/prism-copilot-pilot-one';
import { forecastExpanded } from '../../services/prism-forecast-expanded';
import { insurerPressureEngine } from '../../services/prism-insurer-pressure';
import { portfolioLearning } from '../../services/prism-portfolio-learning';
import { settlementFrictionEngine } from '../../services/prism-settlement-friction';

export const prismCounselPilotOneTypeDefs = `#graphql

  # ── Insurer Pressure Subgraph ──────────────────────────────────────────────

  type PcInsurerPressureSnapshot {
    id: Int!
    orgId: Int!
    matterId: Int!
    overallScore: Float!
    priorScore: Float
    direction: String!
    confidence: Float
    operationalMeaning: String
    recommendedNextAction: String
    carrierName: String
    recentSignals: JSON
    requiresReview: Boolean
    computedAt: String!
    drivers: [PcInsurerPressureDriver!]
  }

  type PcInsurerPressureDriver {
    id: Int!
    orgId: Int!
    matterId: Int!
    driverName: String!
    driverCategory: String!
    weight: Float!
    impact: String!
    explanation: String
    confidence: Float
    sourceRef: String
    sourceClass: String
    createdAt: String!
  }

  type PcCarrierSilenceWindow {
    id: Int!
    orgId: Int!
    matterId: Int!
    carrierName: String!
    daysSilent: Int!
    isCurrent: Boolean
    silenceRisk: String!
    outstandingItems: JSON
    escalationSuggested: Boolean
    silenceStartAt: String!
    createdAt: String!
  }

  type PcCarrierBehaviorPattern {
    id: Int!
    orgId: Int!
    carrierName: String!
    patternType: String!
    description: String
    evidenceCount: Int!
    confidence: Float
    operationalImplication: String
    lastSeen: String!
    createdAt: String!
  }

  type PcPortfolioPressureItem {
    matterId: Int!
    matterTitle: String!
    caseNumber: String
    pressureScore: Float!
    direction: String!
    operationalMeaning: String
    recommendedNextAction: String
    requiresReview: Boolean
  }

  # ── Settlement Friction Subgraph ────────────────────────────────────────────

  type PcSettlementFrictionSnapshot {
    id: Int!
    orgId: Int!
    matterId: Int!
    overallScore: Float!
    priorScore: Float
    direction: String!
    confidence: Float
    readinessDragDays: Int
    frictionClass: String!
    smallestAction: String
    requiresReview: Boolean
    computedAt: String!
    drivers: [PcSettlementFrictionDriver!]
  }

  type PcSettlementFrictionDriver {
    id: Int!
    orgId: Int!
    matterId: Int!
    driverName: String!
    blockerCategory: String!
    weight: Float!
    impact: String!
    explanation: String
    dragEstimateDays: Int
    confidence: Float
    sourceRef: String
    createdAt: String!
  }

  type PcMovementRecommendation {
    id: Int!
    orgId: Int!
    matterId: Int!
    recommendationType: String!
    title: String!
    explanation: String!
    estimatedImpact: String
    confidence: Float
    priority: String!
    estimatedMinutes: Int
    status: String!
    requiresApproval: Boolean
    createdAt: String!
  }

  type PcPortfolioFrictionItem {
    matterId: Int!
    matterTitle: String!
    caseNumber: String
    frictionScore: Float!
    direction: String!
    frictionClass: String!
    readinessDragDays: Int
    smallestAction: String
  }

  # ── Portfolio Learning Subgraph ─────────────────────────────────────────────

  type PcPortfolioBenchmark {
    id: Int!
    orgId: Int!
    benchmarkType: String!
    band: String!
    metricName: String!
    metricValue: Float!
    sampleSize: Int
    computedAt: String!
  }

  type PcPortfolioActionEffectiveness {
    id: Int!
    orgId: Int!
    actionType: String!
    outcomeMetric: String!
    averageImpact: Float
    successRate: Float
    averageTimeToImpactDays: Float
    sampleSize: Int
    contextualNote: String
    computedAt: String!
  }

  type PcPortfolioTeamLag {
    id: Int!
    orgId: Int!
    metricType: String!
    teamRole: String
    avgDays: Float
    medianDays: Float
    p90Days: Float
    sampleSize: Int
    periodDays: Int
    computedAt: String!
  }

  type PcMatterCohort {
    id: Int!
    orgId: Int!
    matterId: Int!
    cohortType: String!
    cohortScore: Float
    cohortRank: Int
    keySignals: JSON
    computedAt: String!
  }

  type PcQuietRiskSnapshot {
    id: Int!
    orgId: Int!
    matterId: Int!
    riskScore: Float!
    topSignals: JSON
    silentDimensions: JSON
    daysWithoutActivity: Int
    recommendedAction: String
    confidence: Float
    requiresReview: Boolean
    computedAt: String!
  }

  type PcBestNextAction {
    type: String!
    matterId: Int!
    title: String!
    description: String!
    estimatedMinutes: Int!
    impactScore: Float!
    priority: String!
    source: String!
  }

  # ── Worldline Subgraph ──────────────────────────────────────────────────────

  type PcWorldlineSignalOverlay {
    id: Int!
    orgId: Int!
    matterId: Int
    sourceClass: String!
    overlayType: String!
    plainLanguageSummary: String!
    confidence: Float
    legalUsefulnessScore: Float
    jurisdiction: String
    county: String
    publishedToPressureGraph: Boolean
    triggeredForecastRecompute: Boolean
    createdAt: String!
  }

  type PcWorldlineWeatherEvent {
    id: Int!
    orgId: Int!
    eventType: String!
    title: String!
    severity: String
    affectedArea: String
    county: String
    state: String
    onsetAt: String
    expiresAt: String
    legalUsefulnessScore: Float
    fetchedAt: String!
  }

  type PcWorldlineRegulatoryEvent {
    id: Int!
    orgId: Int!
    source: String!
    eventType: String!
    title: String!
    description: String
    jurisdiction: String
    effectiveDate: String
    citation: String
    legalUsefulnessScore: Float
    fetchedAt: String!
  }

  type PcWorldlineRecoveryMarker {
    id: Int!
    orgId: Int!
    matterId: Int
    markerType: String!
    description: String
    estimatedAmount: String
    requiresAction: Boolean
    actionDescription: String
    legalUsefulnessScore: Float
    fetchedAt: String!
  }

  # ── Pilot One Forecast Subgraph ─────────────────────────────────────────────

  type PcPilotOneForecastItem {
    type: String!
    label: String!
    currentScore: Float
    priorScore: Float
    trend: String
    confidence: Float
    topDrivers: JSON
    whatChanged: String
    highestLeverageAction: String
    hasData: Boolean!
  }

  type PcPilotOneForecastView {
    matterId: Int!
    asOf: String!
    forecasts: [PcPilotOneForecastItem!]!
    summaryHighRisk: Int!
    summaryImproving: Int!
    summaryDeclining: Int!
  }

  # ── Copilot Action Cards Subgraph ───────────────────────────────────────────

  type PcCopilotActionCard {
    id: String!
    title: String!
    mode: String!
    requiresApproval: Boolean!
  }

  type PcCopilotActionCardResult {
    cardId: String!
    title: String!
    response: String!
    confidence: Float!
    drivers: [String!]!
    sources: [String!]!
    requiresApproval: Boolean!
    proofChainRef: String!
  }

  extend type Query {
    # Insurer Pressure
    pcInsurerPressure(matterId: Int!): PcInsurerPressureSnapshot
    pcInsurerPressureHistory(matterId: Int!, limit: Int): [PcInsurerPressureSnapshot!]!
    pcPortfolioPressureView(orgId: Int!): [PcPortfolioPressureItem!]!
    pcCarrierSilenceWindows(orgId: Int!, matterId: Int): [PcCarrierSilenceWindow!]!
    pcCarrierBehaviorPatterns(orgId: Int!, carrier: String): [PcCarrierBehaviorPattern!]!

    # Settlement Friction
    pcSettlementFriction(matterId: Int!): PcSettlementFrictionSnapshot
    pcSettlementFrictionHistory(matterId: Int!, limit: Int): [PcSettlementFrictionSnapshot!]!
    pcPortfolioFrictionView(orgId: Int!): [PcPortfolioFrictionItem!]!
    pcMovementRecommendations(orgId: Int!, matterId: Int): [PcMovementRecommendation!]!

    # Portfolio Learning
    pcPortfolioBenchmarks(orgId: Int!, type: String): [PcPortfolioBenchmark!]!
    pcActionEffectiveness(orgId: Int!): [PcPortfolioActionEffectiveness!]!
    pcTeamLagMetrics(orgId: Int!): [PcPortfolioTeamLag!]!
    pcMatterCohorts(orgId: Int!, cohortType: String): [PcMatterCohort!]!
    pcQuietRiskSnapshots(orgId: Int!, matterId: Int): [PcQuietRiskSnapshot!]!
    pcBestNextActions(orgId: Int!, userId: Int): [PcBestNextAction!]!
    pcManagerWatchlist(orgId: Int!): JSON

    # Worldline
    pcWorldlineOverlays(orgId: Int!, matterId: Int): [PcWorldlineSignalOverlay!]!
    pcWorldlineWeatherEvents(orgId: Int!): [PcWorldlineWeatherEvent!]!
    pcWorldlineRegulatoryEvents(orgId: Int!): [PcWorldlineRegulatoryEvent!]!
    pcWorldlineRecoveryMarkers(orgId: Int!, matterId: Int): [PcWorldlineRecoveryMarker!]!

    # Pilot One Forecasts
    pcPilotOneForecastView(matterId: Int!): PcPilotOneForecastView!

    # Copilot Action Cards
    pcCopilotPilotOneCards: [PcCopilotActionCard!]!
  }

  extend type Mutation {
    # Pressure Engine
    pcComputeInsurerPressure(orgId: Int!, matterId: Int!): PcInsurerPressureSnapshot!
    pcRecordCarrierEvent(matterId: Int!, carrierName: String!, eventType: String!, description: String, daysSinceLastContact: Int): Boolean!

    # Friction Engine
    pcComputeSettlementFriction(orgId: Int!, matterId: Int!): PcSettlementFrictionSnapshot!
    pcAcceptMovementRecommendation(recommendationId: Int!, actorId: Int!): PcMovementRecommendation!

    # Portfolio Learning
    pcRunPortfolioLearning(orgId: Int!): Boolean!
    pcDetectQuietRisk(orgId: Int!, matterId: Int!): PcQuietRiskSnapshot!

    # Forecast Engine
    pcComputePilotOneForecasts(orgId: Int!, matterId: Int!): PcPilotOneForecastView!

    # Copilot
    pcExecuteCopilotCard(orgId: Int!, matterId: Int!, cardId: String!): PcCopilotActionCardResult!
  }
`;

export const prismCounselPilotOneResolvers = {
  Query: {
    pcInsurerPressure: async (_: unknown, { matterId }: { matterId: number }) => {
      try {
        const snap = await insurerPressureEngine.getLatestSnapshot(1, matterId);
        if (!snap) return null;
        return { ...snap.snapshot, drivers: snap.drivers };
      } catch {
        return null;
      }
    },

    pcInsurerPressureHistory: async (
      _: unknown,
      { matterId, limit = 10 }: { matterId: number; limit?: number },
    ) => {
      try {
        return await db
          .select()
          .from(pcInsurerPressureSnapshotsTable)
          .where(eq(pcInsurerPressureSnapshotsTable.matterId, matterId))
          .orderBy(desc(pcInsurerPressureSnapshotsTable.computedAt))
          .limit(limit);
      } catch {
        return [];
      }
    },

    pcPortfolioPressureView: async (_: unknown, { orgId }: { orgId: number }) => {
      try {
        const view = await insurerPressureEngine.getPortfolioPressureView(orgId);
        return view.map((item) => ({
          matterId: item.matter.id,
          matterTitle: item.matter.title,
          caseNumber: item.matter.caseNumber,
          pressureScore: item.pressure.overallScore,
          direction: item.pressure.direction,
          operationalMeaning: item.pressure.operationalMeaning,
          recommendedNextAction: item.pressure.recommendedNextAction,
          requiresReview: item.pressure.requiresReview,
        }));
      } catch {
        return [];
      }
    },

    pcCarrierSilenceWindows: async (
      _: unknown,
      { orgId, matterId }: { orgId: number; matterId?: number },
    ) => {
      try {
        return await insurerPressureEngine.getSilenceWindows(orgId, matterId);
      } catch {
        return [];
      }
    },

    pcCarrierBehaviorPatterns: async (
      _: unknown,
      { orgId, carrier }: { orgId: number; carrier?: string },
    ) => {
      try {
        return await insurerPressureEngine.getCarrierPatterns(orgId, carrier);
      } catch {
        return [];
      }
    },

    pcSettlementFriction: async (_: unknown, { matterId }: { matterId: number }) => {
      try {
        const snap = await settlementFrictionEngine.getLatestSnapshot(1, matterId);
        if (!snap) return null;
        return { ...snap.snapshot, drivers: snap.drivers };
      } catch {
        return null;
      }
    },

    pcSettlementFrictionHistory: async (
      _: unknown,
      { matterId, limit = 10 }: { matterId: number; limit?: number },
    ) => {
      try {
        return await db
          .select()
          .from(pcSettlementFrictionSnapshotsTable)
          .where(eq(pcSettlementFrictionSnapshotsTable.matterId, matterId))
          .orderBy(desc(pcSettlementFrictionSnapshotsTable.computedAt))
          .limit(limit);
      } catch {
        return [];
      }
    },

    pcPortfolioFrictionView: async (_: unknown, { orgId }: { orgId: number }) => {
      try {
        const view = await settlementFrictionEngine.getPortfolioFrictionView(orgId);
        return view.map((item) => ({
          matterId: item.matter.id,
          matterTitle: item.matter.title,
          caseNumber: item.matter.caseNumber,
          frictionScore: item.friction.overallScore,
          direction: item.friction.direction,
          frictionClass: item.friction.frictionClass,
          readinessDragDays: item.friction.readinessDragDays,
          smallestAction: item.friction.smallestAction,
        }));
      } catch {
        return [];
      }
    },

    pcMovementRecommendations: async (
      _: unknown,
      { orgId, matterId }: { orgId: number; matterId?: number },
    ) => {
      try {
        return await settlementFrictionEngine.getMovementRecommendations(orgId, matterId);
      } catch {
        return [];
      }
    },

    pcPortfolioBenchmarks: async (
      _: unknown,
      { orgId, type }: { orgId: number; type?: string },
    ) => {
      try {
        return await portfolioLearning.getBenchmarks(orgId, type);
      } catch {
        return [];
      }
    },

    pcActionEffectiveness: async (_: unknown, { orgId }: { orgId: number }) => {
      try {
        return await portfolioLearning.getActionEffectiveness(orgId);
      } catch {
        return [];
      }
    },

    pcTeamLagMetrics: async (_: unknown, { orgId }: { orgId: number }) => {
      try {
        return await db
          .select()
          .from(pcPortfolioTeamLagMetricsTable)
          .where(eq(pcPortfolioTeamLagMetricsTable.orgId, orgId))
          .limit(20);
      } catch {
        return [];
      }
    },

    pcMatterCohorts: async (
      _: unknown,
      { orgId, cohortType }: { orgId: number; cohortType?: string },
    ) => {
      try {
        return await portfolioLearning.getMatterCohorts(orgId, cohortType);
      } catch {
        return [];
      }
    },

    pcQuietRiskSnapshots: async (
      _: unknown,
      { orgId, matterId }: { orgId: number; matterId?: number },
    ) => {
      try {
        const cond = matterId
          ? and(
              eq(pcQuietRiskSnapshotsTable.orgId, orgId),
              eq(pcQuietRiskSnapshotsTable.matterId, matterId),
            )
          : eq(pcQuietRiskSnapshotsTable.orgId, orgId);
        return await db
          .select()
          .from(pcQuietRiskSnapshotsTable)
          .where(cond)
          .orderBy(desc(pcQuietRiskSnapshotsTable.riskScore))
          .limit(20);
      } catch {
        return [];
      }
    },

    pcBestNextActions: async (
      _: unknown,
      { orgId, userId = 1 }: { orgId: number; userId?: number },
    ) => {
      try {
        return await portfolioLearning.getBestNext30Minutes(orgId, userId);
      } catch {
        return [];
      }
    },

    pcManagerWatchlist: async (_: unknown, { orgId }: { orgId: number }) => {
      try {
        return await portfolioLearning.getManagerWatchlist(orgId);
      } catch {
        return [];
      }
    },

    pcWorldlineOverlays: async (
      _: unknown,
      { orgId, matterId }: { orgId: number; matterId?: number },
    ) => {
      try {
        const cond = matterId
          ? and(
              eq(pcWorldlineSignalOverlaysTable.orgId, orgId),
              eq(pcWorldlineSignalOverlaysTable.matterId, matterId),
            )
          : eq(pcWorldlineSignalOverlaysTable.orgId, orgId);
        return await db
          .select()
          .from(pcWorldlineSignalOverlaysTable)
          .where(cond)
          .orderBy(desc(pcWorldlineSignalOverlaysTable.createdAt))
          .limit(30);
      } catch {
        return [];
      }
    },

    pcWorldlineWeatherEvents: async (_: unknown, { orgId }: { orgId: number }) => {
      try {
        return await db
          .select()
          .from(pcWorldlineWeatherEventsTable)
          .where(eq(pcWorldlineWeatherEventsTable.orgId, orgId))
          .orderBy(desc(pcWorldlineWeatherEventsTable.fetchedAt))
          .limit(20);
      } catch {
        return [];
      }
    },

    pcWorldlineRegulatoryEvents: async (_: unknown, { orgId }: { orgId: number }) => {
      try {
        return await db
          .select()
          .from(pcWorldlineRegulatoryEventsTable)
          .where(eq(pcWorldlineRegulatoryEventsTable.orgId, orgId))
          .orderBy(desc(pcWorldlineRegulatoryEventsTable.fetchedAt))
          .limit(20);
      } catch {
        return [];
      }
    },

    pcWorldlineRecoveryMarkers: async (
      _: unknown,
      { orgId, matterId }: { orgId: number; matterId?: number },
    ) => {
      try {
        const cond = matterId
          ? and(
              eq(pcWorldlineRecoveryMarkersTable.orgId, orgId),
              eq(pcWorldlineRecoveryMarkersTable.matterId, matterId),
            )
          : eq(pcWorldlineRecoveryMarkersTable.orgId, orgId);
        return await db
          .select()
          .from(pcWorldlineRecoveryMarkersTable)
          .where(cond)
          .orderBy(desc(pcWorldlineRecoveryMarkersTable.fetchedAt))
          .limit(20);
      } catch {
        return [];
      }
    },

    pcPilotOneForecastView: async (_: unknown, { matterId }: { matterId: number }) => {
      try {
        const view = await forecastExpanded.getForecastDiffView(1, matterId);
        return {
          matterId: view.matterId,
          asOf: view.asOf,
          forecasts: view.forecasts.map((f) => ({
            type: f.type,
            label: f.label,
            currentScore: f.data?.currentScore ?? null,
            priorScore: f.data?.priorScore ?? null,
            trend: f.data?.trend ?? null,
            confidence: f.data?.confidence ?? null,
            topDrivers: f.data?.topDrivers ?? [],
            whatChanged: f.data?.whatChanged ?? null,
            highestLeverageAction: f.data?.highestLeverageAction ?? null,
            hasData: f.data !== null,
          })),
          summaryHighRisk: view.summary.highRisk,
          summaryImproving: view.summary.improving,
          summaryDeclining: view.summary.declining,
        };
      } catch {
        return {
          matterId,
          asOf: new Date().toISOString(),
          forecasts: [],
          summaryHighRisk: 0,
          summaryImproving: 0,
          summaryDeclining: 0,
        };
      }
    },

    pcCopilotPilotOneCards: () => {
      return copilotPilotOne.getAvailableCards();
    },
  },

  Mutation: {
    pcComputeInsurerPressure: async (
      _: unknown,
      { orgId, matterId }: { orgId: number; matterId: number },
    ) => {
      try {
        const { snapshotId, analysis } = await insurerPressureEngine.compute(orgId, matterId);
        const snap = await insurerPressureEngine.getLatestSnapshot(orgId, matterId);
        if (!snap) throw new Error('Snapshot save failed');
        return { ...snap.snapshot, drivers: snap.drivers };
      } catch (err: any) {
        throw new Error(err.message ?? 'Failed to compute pressure');
      }
    },

    pcRecordCarrierEvent: async (
      _: unknown,
      args: {
        matterId: number;
        carrierName: string;
        eventType: string;
        description?: string;
        daysSinceLastContact?: number;
      },
    ) => {
      try {
        await insurerPressureEngine.recordCarrierEvent(1, args.matterId, {
          carrierName: args.carrierName,
          eventType: args.eventType,
          description: args.description,
          daysSinceLastContact: args.daysSinceLastContact,
        });
        return true;
      } catch {
        return false;
      }
    },

    pcComputeSettlementFriction: async (
      _: unknown,
      { orgId, matterId }: { orgId: number; matterId: number },
    ) => {
      try {
        const { snapshotId, analysis } = await settlementFrictionEngine.compute(orgId, matterId);
        const snap = await settlementFrictionEngine.getLatestSnapshot(orgId, matterId);
        if (!snap) throw new Error('Snapshot save failed');
        return { ...snap.snapshot, drivers: snap.drivers };
      } catch (err: any) {
        throw new Error(err.message ?? 'Failed to compute friction');
      }
    },

    pcAcceptMovementRecommendation: async (
      _: unknown,
      { recommendationId, actorId }: { recommendationId: number; actorId: number },
    ) => {
      try {
        const [updated] = await db
          .update(pcMovementRecommendationsTable)
          .set({ status: 'accepted', acceptedBy: actorId, acceptedAt: new Date() })
          .where(eq(pcMovementRecommendationsTable.id, recommendationId))
          .returning();
        if (!updated) throw new Error('Recommendation not found');
        return updated;
      } catch (err: any) {
        throw new Error(err.message ?? 'Failed to accept recommendation');
      }
    },

    pcRunPortfolioLearning: async (_: unknown, { orgId }: { orgId: number }) => {
      try {
        await portfolioLearning.runFullPortfolioLearning(orgId);
        return true;
      } catch {
        return false;
      }
    },

    pcDetectQuietRisk: async (
      _: unknown,
      { orgId, matterId }: { orgId: number; matterId: number },
    ) => {
      try {
        await portfolioLearning.detectQuietRisk(orgId, matterId);
        const [snap] = await db
          .select()
          .from(pcQuietRiskSnapshotsTable)
          .where(
            and(
              eq(pcQuietRiskSnapshotsTable.orgId, orgId),
              eq(pcQuietRiskSnapshotsTable.matterId, matterId),
            ),
          )
          .orderBy(desc(pcQuietRiskSnapshotsTable.computedAt))
          .limit(1);
        return snap;
      } catch (err: any) {
        throw new Error(err.message ?? 'Failed to detect quiet risk');
      }
    },

    pcComputePilotOneForecasts: async (
      _: unknown,
      { orgId, matterId }: { orgId: number; matterId: number },
    ) => {
      try {
        await forecastExpanded.runForecastCycle(orgId, matterId);
        const view = await forecastExpanded.getForecastDiffView(orgId, matterId);
        return {
          matterId: view.matterId,
          asOf: view.asOf,
          forecasts: view.forecasts.map((f) => ({
            type: f.type,
            label: f.label,
            currentScore: f.data?.currentScore ?? null,
            priorScore: f.data?.priorScore ?? null,
            trend: f.data?.trend ?? null,
            confidence: f.data?.confidence ?? null,
            topDrivers: f.data?.topDrivers ?? [],
            whatChanged: f.data?.whatChanged ?? null,
            highestLeverageAction: f.data?.highestLeverageAction ?? null,
            hasData: f.data !== null,
          })),
          summaryHighRisk: view.summary.highRisk,
          summaryImproving: view.summary.improving,
          summaryDeclining: view.summary.declining,
        };
      } catch (err: any) {
        throw new Error(err.message ?? 'Failed to compute forecasts');
      }
    },

    pcExecuteCopilotCard: async (
      _: unknown,
      { orgId, matterId, cardId }: { orgId: number; matterId: number; cardId: string },
    ) => {
      try {
        return await copilotPilotOne.executeActionCard(orgId, matterId, cardId as any);
      } catch (err: any) {
        throw new Error(err.message ?? 'Failed to execute action card');
      }
    },
  },

  PcInsurerPressureSnapshot: {
    drivers: async (snap: { id: number }) => {
      try {
        return await db
          .select()
          .from(pcInsurerPressureDriversTable)
          .where(eq(pcInsurerPressureDriversTable.snapshotId, snap.id));
      } catch {
        return [];
      }
    },
  },

  PcSettlementFrictionSnapshot: {
    drivers: async (snap: { id: number }) => {
      try {
        return await db
          .select()
          .from(pcSettlementFrictionDriversTable)
          .where(eq(pcSettlementFrictionDriversTable.snapshotId, snap.id));
      } catch {
        return [];
      }
    },
  },
};
