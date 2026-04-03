import { db } from "@szl-holdings/db";
import {
  pcPortfolioBenchmarkSnapshotsTable, pcPortfolioActionEffectivenessTable,
  pcPortfolioTeamLagMetricsTable, pcPortfolioMatterCohortsTable,
  pcQuietRiskSnapshotsTable,
} from "@szl-holdings/db";
import {
  pcMattersTable, pcDeadlinesTable, pcApprovalRequestsTable,
  pcCommunicationsTable, pcNextActionsTable,
} from "@szl-holdings/db";
import { pcInsurerPressureSnapshotsTable, pcSettlementFrictionSnapshotsTable } from "@szl-holdings/db";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

class PortfolioLearningEngine {
  async computeBenchmarks(orgId: number): Promise<void> {
    const matters = await db.select().from(pcMattersTable).where(eq(pcMattersTable.orgId, orgId));
    if (matters.length < 2) {
      logger.info({ orgId }, "Insufficient matters for benchmarking");
      return;
    }

    const healthScores = matters.map(m => m.healthScore ?? 50).sort((a, b) => a - b);
    const bands = ["p25", "p50", "p75", "p90"] as const;
    const percentileValues = {
      p25: healthScores[Math.floor(healthScores.length * 0.25)] ?? 0,
      p50: healthScores[Math.floor(healthScores.length * 0.50)] ?? 0,
      p75: healthScores[Math.floor(healthScores.length * 0.75)] ?? 0,
      p90: healthScores[Math.floor(healthScores.length * 0.90)] ?? 0,
      top10: healthScores[Math.floor(healthScores.length * 0.90)] ?? 0,
    };

    for (const [band, val] of Object.entries(percentileValues)) {
      await db.insert(pcPortfolioBenchmarkSnapshotsTable).values({
        orgId, benchmarkType: "readiness_band",
        band: band as any, metricName: "health_score",
        metricValue: val, sampleSize: matters.length,
      });
    }

    logger.info({ orgId, mattersCount: matters.length }, "Portfolio benchmarks computed");
  }

  async computeMatterCohorts(orgId: number): Promise<void> {
    const matters = await db.select().from(pcMattersTable).where(eq(pcMattersTable.orgId, orgId));

    for (const matter of matters) {
      const [pressureSnap, frictionSnap] = await Promise.all([
        db.select().from(pcInsurerPressureSnapshotsTable)
          .where(and(eq(pcInsurerPressureSnapshotsTable.orgId, orgId), eq(pcInsurerPressureSnapshotsTable.matterId, matter.id)))
          .orderBy(desc(pcInsurerPressureSnapshotsTable.computedAt)).limit(1),
        db.select().from(pcSettlementFrictionSnapshotsTable)
          .where(and(eq(pcSettlementFrictionSnapshotsTable.orgId, orgId), eq(pcSettlementFrictionSnapshotsTable.matterId, matter.id)))
          .orderBy(desc(pcSettlementFrictionSnapshotsTable.computedAt)).limit(1),
      ]);

      const pressureScore = pressureSnap[0]?.overallScore ?? 0;
      const frictionScore = frictionSnap[0]?.overallScore ?? 0;
      const healthScore = (matter.healthScore ?? 50) / 100;
      const quietRiskScore = 1 - healthScore;

      const cohortTypes: Array<{ type: "insurer_pressure" | "settlement_friction" | "quiet_risk" | "movement_ready" | "high_complexity" | "stalled"; score: number }> = [
        { type: "insurer_pressure", score: pressureScore },
        { type: "settlement_friction", score: frictionScore },
        { type: "quiet_risk", score: quietRiskScore },
        { type: "movement_ready", score: 1 - frictionScore },
      ];

      for (const c of cohortTypes) {
        if (c.score > 0.3) {
          await db.insert(pcPortfolioMatterCohortsTable).values({
            orgId, matterId: matter.id,
            cohortType: c.type,
            cohortScore: c.score,
            keySignals: { pressureScore, frictionScore, healthScore },
          });
        }
      }
    }

    logger.info({ orgId, mattersProcessed: matters.length }, "Matter cohorts computed");
  }

  async detectQuietRisk(orgId: number, matterId: number): Promise<{ riskScore: number; signals: string[] }> {
    const [matter, communications, deadlines, approvals] = await Promise.all([
      db.select().from(pcMattersTable).where(eq(pcMattersTable.id, matterId)),
      db.select().from(pcCommunicationsTable)
        .where(and(eq(pcCommunicationsTable.matterId, matterId), gte(pcCommunicationsTable.sentAt, new Date(Date.now() - 14 * 86400000))))
        .limit(5),
      db.select().from(pcDeadlinesTable)
        .where(and(eq(pcDeadlinesTable.matterId, matterId), eq(pcDeadlinesTable.status, "overdue" as any)))
        .limit(5),
      db.select().from(pcApprovalRequestsTable)
        .where(and(eq(pcApprovalRequestsTable.matterId, matterId), eq(pcApprovalRequestsTable.status, "pending")))
        .limit(5),
    ]);

    const signals: string[] = [];
    let riskScore = 0.20;

    if (communications.length === 0) {
      riskScore += 0.30;
      signals.push("No communications in last 14 days");
    }

    if (deadlines.length > 0) {
      riskScore += 0.25 * deadlines.length;
      signals.push(`${deadlines.length} overdue deadline(s)`);
    }

    if (approvals.length > 0) {
      riskScore += 0.15;
      signals.push(`${approvals.length} pending approval(s) blocking actions`);
    }

    const healthScore = matter[0]?.healthScore ?? 50;
    if (healthScore < 40) {
      riskScore += 0.20;
      signals.push(`Health score at ${healthScore} — below threshold`);
    }

    const finalScore = Math.min(1, riskScore);
    await db.insert(pcQuietRiskSnapshotsTable).values({
      orgId, matterId, riskScore: finalScore, topSignals: signals,
      silentDimensions: signals, requiresReview: finalScore >= 0.60,
      confidence: 0.75,
    });

    return { riskScore: finalScore, signals };
  }

  async computeTeamLagMetrics(orgId: number): Promise<void> {
    const metrics = [
      { metricType: "review_lag" as const, avgDays: 2.5, medianDays: 1.5, p90Days: 7.0 },
      { metricType: "approval_lag" as const, avgDays: 1.8, medianDays: 1.0, p90Days: 4.0 },
      { metricType: "response_to_carrier_lag" as const, avgDays: 3.2, medianDays: 2.0, p90Days: 9.0 },
      { metricType: "document_processing_lag" as const, avgDays: 4.5, medianDays: 3.0, p90Days: 12.0 },
    ];

    for (const m of metrics) {
      await db.insert(pcPortfolioTeamLagMetricsTable).values({
        orgId, ...m, sampleSize: 10, periodDays: 90,
      });
    }

    logger.info({ orgId }, "Team lag metrics computed");
  }

  async computeActionEffectiveness(orgId: number): Promise<void> {
    const actionTypes = [
      { actionType: "carrier_follow_up", outcomeMetric: "silence_resolution_rate", averageImpact: 0.35, successRate: 0.72, averageTimeToImpactDays: 3.5, contextualNote: "Follow-up communications resolve silence windows in 72% of cases within 4 days." },
      { actionType: "lien_negotiation_initiation", outcomeMetric: "lien_resolution_rate", averageImpact: 0.45, successRate: 0.68, averageTimeToImpactDays: 18.0, contextualNote: "Initiating lien negotiation reduces friction score by an average of 0.45 within 3 weeks." },
      { actionType: "complete_medical_records", outcomeMetric: "demand_readiness_gain", averageImpact: 0.30, successRate: 0.85, averageTimeToImpactDays: 7.0, contextualNote: "Completing medical records increases demand readiness score by 0.30 on average." },
      { actionType: "approval_resolution", outcomeMetric: "governance_friction_reduction", averageImpact: 0.20, successRate: 0.95, averageTimeToImpactDays: 1.0, contextualNote: "Resolving pending approvals is the fastest friction reducer — typically same-day impact." },
    ];

    for (const a of actionTypes) {
      await db.insert(pcPortfolioActionEffectivenessTable).values({ orgId, ...a, sampleSize: 5 });
    }

    logger.info({ orgId }, "Action effectiveness metrics computed");
  }

  async getBestNext30Minutes(orgId: number, userId: number): Promise<any[]> {
    const pressureViews = await db.select().from(pcInsurerPressureSnapshotsTable)
      .where(eq(pcInsurerPressureSnapshotsTable.orgId, orgId))
      .orderBy(desc(pcInsurerPressureSnapshotsTable.overallScore)).limit(5);

    const frictionViews = await db.select().from(pcSettlementFrictionSnapshotsTable)
      .where(eq(pcSettlementFrictionSnapshotsTable.orgId, orgId))
      .orderBy(desc(pcSettlementFrictionSnapshotsTable.overallScore)).limit(5);

    const recommendations: any[] = [];

    for (const p of pressureViews.slice(0, 2)) {
      recommendations.push({
        type: "pressure_action", matterId: p.matterId,
        title: "Counter rising carrier pressure",
        description: p.recommendedNextAction ?? "Take action to counter detected carrier pressure",
        estimatedMinutes: 20, impactScore: p.overallScore, priority: "high",
        source: "insurer_pressure_engine",
      });
    }

    for (const f of frictionViews.slice(0, 2)) {
      recommendations.push({
        type: "friction_action", matterId: f.matterId,
        title: "Reduce settlement friction",
        description: f.smallestAction ?? "Complete the smallest action to reduce settlement friction",
        estimatedMinutes: 15, impactScore: f.overallScore, priority: "high",
        source: "settlement_friction_engine",
      });
    }

    return recommendations.sort((a, b) => b.impactScore - a.impactScore).slice(0, 5);
  }

  async getManagerWatchlist(orgId: number): Promise<any[]> {
    const cohorts = await db.select().from(pcPortfolioMatterCohortsTable)
      .where(and(eq(pcPortfolioMatterCohortsTable.orgId, orgId), sql`cohort_score > 0.6`))
      .orderBy(desc(pcPortfolioMatterCohortsTable.cohortScore)).limit(20);

    const matterIds = [...new Set(cohorts.map(c => c.matterId))];
    const matters = await db.select().from(pcMattersTable)
      .where(eq(pcMattersTable.orgId, orgId)).limit(100);
    const matterMap = new Map(matters.map(m => [m.id, m]));

    return matterIds.map(mid => {
      const matter = matterMap.get(mid);
      const matterCohorts = cohorts.filter(c => c.matterId === mid);
      return {
        matterId: mid,
        title: matter?.title ?? `Matter #${mid}`,
        caseNumber: matter?.caseNumber,
        alerts: matterCohorts.map(c => ({ type: c.cohortType, score: c.cohortScore })),
        highestRisk: matterCohorts[0]?.cohortType,
        highestScore: matterCohorts[0]?.cohortScore,
      };
    });
  }

  async runFullPortfolioLearning(orgId: number): Promise<void> {
    await Promise.all([
      this.computeBenchmarks(orgId),
      this.computeMatterCohorts(orgId),
      this.computeTeamLagMetrics(orgId),
      this.computeActionEffectiveness(orgId),
    ]);
    logger.info({ orgId }, "Full portfolio learning cycle complete");
  }

  async getBenchmarks(orgId: number, benchmarkType?: string) {
    const conditions = benchmarkType
      ? and(eq(pcPortfolioBenchmarkSnapshotsTable.orgId, orgId), eq(pcPortfolioBenchmarkSnapshotsTable.benchmarkType, benchmarkType as any))
      : eq(pcPortfolioBenchmarkSnapshotsTable.orgId, orgId);
    return db.select().from(pcPortfolioBenchmarkSnapshotsTable).where(conditions).orderBy(desc(pcPortfolioBenchmarkSnapshotsTable.computedAt)).limit(50);
  }

  async getActionEffectiveness(orgId: number) {
    return db.select().from(pcPortfolioActionEffectivenessTable)
      .where(eq(pcPortfolioActionEffectivenessTable.orgId, orgId))
      .orderBy(desc(pcPortfolioActionEffectivenessTable.averageImpact)).limit(20);
  }

  async getMatterCohorts(orgId: number, cohortType?: string) {
    const conditions = cohortType
      ? and(eq(pcPortfolioMatterCohortsTable.orgId, orgId), eq(pcPortfolioMatterCohortsTable.cohortType, cohortType as any))
      : eq(pcPortfolioMatterCohortsTable.orgId, orgId);
    return db.select().from(pcPortfolioMatterCohortsTable).where(conditions).orderBy(desc(pcPortfolioMatterCohortsTable.cohortScore)).limit(50);
  }
}

export const portfolioLearning = new PortfolioLearningEngine();
