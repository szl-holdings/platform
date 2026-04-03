import { db } from "@workspace/db";
import { pcForecastDiffsTable } from "@workspace/db";
import { pcMattersTable, pcCommunicationsTable, pcLiensTable, pcDeadlinesTable, pcApprovalRequestsTable } from "@workspace/db";
import { pcInsurerPressureSnapshotsTable, pcSettlementFrictionSnapshotsTable, pcQuietRiskSnapshotsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

type PilotOneForecastType =
  | "insurer_response_latency"
  | "offer_movement_likelihood"
  | "settlement_friction"
  | "review_bottleneck"
  | "approval_lag_risk"
  | "recovery_lien_drag_risk"
  | "quiet_risk_deterioration";

interface ForecastResult {
  forecastType: PilotOneForecastType;
  currentScore: number;
  priorScore: number | null;
  trend: "improving" | "declining" | "stable" | "volatile";
  confidence: number;
  topDrivers: string[];
  sourceClassesUsed: string[];
  whatChanged: string;
  internalDrivers: string[];
  worldlineDrivers: string[];
  recommendedActions: string[];
  requiresReview: boolean;
  modelVersion: string;
}

class ForecastExpandedEngine {
  async computeAllPilotOneForecasts(orgId: number, matterId: number): Promise<ForecastResult[]> {
    const [matter] = await db.select().from(pcMattersTable).where(eq(pcMattersTable.id, matterId));
    if (!matter) throw new Error(`Matter ${matterId} not found`);

    const [communications, liens, deadlines, approvals, pressureSnap, frictionSnap, quietRisk] = await Promise.all([
      db.select().from(pcCommunicationsTable).where(eq(pcCommunicationsTable.matterId, matterId)).orderBy(desc(pcCommunicationsTable.sentAt)).limit(30),
      db.select().from(pcLiensTable).where(eq(pcLiensTable.matterId, matterId)),
      db.select().from(pcDeadlinesTable).where(eq(pcDeadlinesTable.matterId, matterId)),
      db.select().from(pcApprovalRequestsTable).where(and(eq(pcApprovalRequestsTable.matterId, matterId), eq(pcApprovalRequestsTable.status, "pending"))),
      db.select().from(pcInsurerPressureSnapshotsTable).where(and(eq(pcInsurerPressureSnapshotsTable.orgId, orgId), eq(pcInsurerPressureSnapshotsTable.matterId, matterId))).orderBy(desc(pcInsurerPressureSnapshotsTable.computedAt)).limit(1),
      db.select().from(pcSettlementFrictionSnapshotsTable).where(and(eq(pcSettlementFrictionSnapshotsTable.orgId, orgId), eq(pcSettlementFrictionSnapshotsTable.matterId, matterId))).orderBy(desc(pcSettlementFrictionSnapshotsTable.computedAt)).limit(1),
      db.select().from(pcQuietRiskSnapshotsTable).where(and(eq(pcQuietRiskSnapshotsTable.orgId, orgId), eq(pcQuietRiskSnapshotsTable.matterId, matterId))).orderBy(desc(pcQuietRiskSnapshotsTable.computedAt)).limit(1),
    ]);

    const lastInboundCarrierComm = communications.find(c => c.direction === "inbound" && (c.fromParty?.toLowerCase().includes("carrier") || c.fromParty?.toLowerCase().includes("adjuster")));
    const daysSinceCarrierResponse = lastInboundCarrierComm ? Math.floor((Date.now() - new Date(lastInboundCarrierComm.sentAt!).getTime()) / 86400000) : 30;
    const activeLiens = liens.filter(l => l.status === "asserted" || l.status === "negotiating");
    const overdueDeadlines = deadlines.filter(d => d.status === "overdue");
    const pressureScore = pressureSnap[0]?.overallScore ?? 0.4;
    const frictionScore = frictionSnap[0]?.overallScore ?? 0.4;
    const quietRiskScore = quietRisk[0]?.riskScore ?? 0.3;

    const results: ForecastResult[] = [];

    results.push(this.buildForecast("insurer_response_latency", {
      currentScore: Math.min(1, daysSinceCarrierResponse / 30),
      drivers: [`${daysSinceCarrierResponse} days since last carrier response`, pressureScore > 0.6 ? "Elevated insurer pressure index" : "Normal pressure range"],
      internalDrivers: ["Communication log analysis"],
      worldlineDrivers: pressureScore > 0.5 ? ["Insurer pressure pattern matching"] : [],
      recommendedActions: daysSinceCarrierResponse > 14 ? ["Send formal follow-up with response deadline", "Document silence window for potential bad faith record"] : ["Continue monitoring communication cadence"],
      whatChanged: daysSinceCarrierResponse > 7 ? "Response lag has exceeded normal threshold" : "Within normal response window",
      confidence: 0.80,
    }));

    results.push(this.buildForecast("offer_movement_likelihood", {
      currentScore: Math.max(0, 0.7 - frictionScore * 0.5),
      drivers: [`Settlement friction at ${Math.round(frictionScore * 100)}%`, pressureScore > 0.5 ? "Carrier pressure may accelerate offer" : "Moderate carrier engagement"],
      internalDrivers: ["Friction engine analysis", "Offer history"],
      worldlineDrivers: [],
      recommendedActions: frictionScore > 0.6 ? ["Reduce top friction blockers before expecting offer movement", "Prepare counter-offer strategy"] : ["Position for offer movement by strengthening readiness posture"],
      whatChanged: frictionScore > 0.5 ? "High friction is suppressing offer movement probability" : "Reasonable conditions for offer movement",
      confidence: 0.72,
    }));

    results.push(this.buildForecast("settlement_friction", {
      currentScore: frictionScore,
      drivers: frictionSnap[0] ? [frictionSnap[0].smallestAction ?? "Review friction blockers", `Friction class: ${frictionSnap[0].frictionClass}`] : ["No friction data computed yet"],
      internalDrivers: ["Settlement friction engine", "Blocker analysis"],
      worldlineDrivers: [],
      recommendedActions: [frictionSnap[0]?.smallestAction ?? "Run friction computation to identify smallest blocking action"],
      whatChanged: frictionSnap[0]?.direction === "rising" ? "Friction has increased since last snapshot" : frictionSnap[0]?.direction === "falling" ? "Friction is decreasing — positive trajectory" : "Friction stable",
      confidence: 0.75,
    }));

    results.push(this.buildForecast("review_bottleneck", {
      currentScore: Math.min(1, approvals.length * 0.25),
      drivers: [`${approvals.length} pending approval(s)`, approvals.length > 2 ? "Multiple approvals creating review backlog" : "Manageable review load"],
      internalDrivers: ["Approval queue analysis", "Governance pipeline"],
      worldlineDrivers: [],
      recommendedActions: approvals.length > 0 ? ["Prioritize oldest pending approval", "Assign dedicated review time in next work session"] : ["Review queue is clear — no bottleneck detected"],
      whatChanged: approvals.length > 2 ? "Review backlog is building — immediate attention needed" : "Review load within acceptable range",
      confidence: 0.85,
    }));

    results.push(this.buildForecast("approval_lag_risk", {
      currentScore: Math.min(1, (approvals.length * 0.20) + (overdueDeadlines.length * 0.15)),
      drivers: [`${approvals.length} pending approval(s)`, `${overdueDeadlines.length} overdue deadline(s)`, "Approval lag increases with each pending item"],
      internalDrivers: ["Approval queue", "Deadline compliance tracking"],
      worldlineDrivers: [],
      recommendedActions: approvals.length > 0 ? ["Review all pending approvals — each unresolved approval adds estimated 1-3 days lag"] : ["No approval lag detected"],
      whatChanged: approvals.length > 1 ? "Multiple pending approvals are compounding lag risk" : "Approval lag is low",
      confidence: 0.80,
    }));

    results.push(this.buildForecast("recovery_lien_drag_risk", {
      currentScore: Math.min(1, activeLiens.length * 0.25),
      drivers: [`${activeLiens.length} active lien(s)`, activeLiens.length > 2 ? "Multiple active liens — significant recovery timeline risk" : "Manageable lien exposure"],
      internalDrivers: ["Lien table analysis", "Recovery timeline modeling"],
      worldlineDrivers: activeLiens.length > 0 ? ["CMS MSP recovery patterns (reference)"] : [],
      recommendedActions: activeLiens.length > 0 ? ["Initiate lien negotiation conversations immediately", "Assess Medicare/Medicaid conditional payment amounts", "Consider requesting lien waiver where applicable"] : ["No active lien drag detected"],
      whatChanged: activeLiens.length > 0 ? `${activeLiens.length} active lien(s) creating settlement drag` : "No active lien drag",
      confidence: 0.78,
    }));

    results.push(this.buildForecast("quiet_risk_deterioration", {
      currentScore: quietRiskScore,
      drivers: (quietRisk[0]?.topSignals as string[] ?? []).slice(0, 3),
      internalDrivers: ["Quiet risk detection engine", "Activity pattern analysis"],
      worldlineDrivers: [],
      recommendedActions: quietRiskScore > 0.5 ? ["Schedule immediate matter review", "Identify and address root cause of activity drought"] : ["Matter is within normal activity range"],
      whatChanged: quietRisk[0] ? "Quiet risk signals detected" : "No quiet risk baseline computed",
      confidence: 0.75,
    }));

    return results;
  }

  private buildForecast(type: PilotOneForecastType, data: {
    currentScore: number; drivers: string[]; internalDrivers: string[];
    worldlineDrivers: string[]; recommendedActions: string[];
    whatChanged: string; confidence: number;
  }): ForecastResult {
    return {
      forecastType: type,
      currentScore: Math.round(data.currentScore * 100) / 100,
      priorScore: null,
      trend: data.currentScore > 0.65 ? "declining" : data.currentScore < 0.35 ? "improving" : "stable",
      confidence: data.confidence,
      topDrivers: data.drivers,
      sourceClassesUsed: ["internal_firm", ...(data.worldlineDrivers.length > 0 ? ["worldline"] : [])],
      whatChanged: data.whatChanged,
      internalDrivers: data.internalDrivers,
      worldlineDrivers: data.worldlineDrivers,
      recommendedActions: data.recommendedActions,
      requiresReview: data.currentScore >= 0.70,
      modelVersion: "pilot_one_v1",
    };
  }

  async saveForecastDiffs(orgId: number, matterId: number, forecasts: ForecastResult[]): Promise<void> {
    for (const f of forecasts) {
      const prior = await db.select().from(pcForecastDiffsTable)
        .where(and(eq(pcForecastDiffsTable.orgId, orgId), eq(pcForecastDiffsTable.matterId, matterId), eq(pcForecastDiffsTable.forecastType, f.forecastType)))
        .orderBy(desc(pcForecastDiffsTable.createdAt)).limit(1);

      const priorScore = prior[0]?.currentScore ?? null;
      const trend: "improving" | "declining" | "stable" | "volatile" =
        priorScore === null ? "stable"
        : f.currentScore < priorScore - 0.05 ? "improving"
        : f.currentScore > priorScore + 0.05 ? "declining"
        : "stable";

      await db.insert(pcForecastDiffsTable).values({
        orgId, matterId,
        forecastType: f.forecastType,
        currentScore: f.currentScore,
        priorScore,
        trend,
        confidence: f.confidence,
        topDrivers: f.topDrivers,
        sourceClassesUsed: f.sourceClassesUsed,
        whatChanged: f.whatChanged,
        internalDrivers: f.internalDrivers,
        worldlineDrivers: f.worldlineDrivers,
        highestLeverageAction: f.recommendedActions[0] ?? null,
        approvalRequired: false,
        modelVersion: f.modelVersion,
      });
    }
    logger.info({ orgId, matterId, forecastCount: forecasts.length }, "Pilot One forecast diffs saved");
  }

  async runForecastCycle(orgId: number, matterId: number): Promise<ForecastResult[]> {
    const forecasts = await this.computeAllPilotOneForecasts(orgId, matterId);
    await this.saveForecastDiffs(orgId, matterId, forecasts);
    return forecasts;
  }

  async getForecastDiffView(orgId: number, matterId: number) {
    const diffs = await db.select().from(pcForecastDiffsTable)
      .where(and(eq(pcForecastDiffsTable.orgId, orgId), eq(pcForecastDiffsTable.matterId, matterId)))
      .orderBy(desc(pcForecastDiffsTable.createdAt)).limit(20);

    const latestByType: Record<string, typeof diffs[0]> = {};
    for (const d of diffs) {
      if (!latestByType[d.forecastType]) latestByType[d.forecastType] = d;
    }

    const pilotOneTypes: PilotOneForecastType[] = ["insurer_response_latency", "offer_movement_likelihood", "settlement_friction", "review_bottleneck", "approval_lag_risk", "recovery_lien_drag_risk", "quiet_risk_deterioration"];

    return {
      matterId, asOf: new Date().toISOString(),
      forecasts: pilotOneTypes.map(t => ({
        type: t,
        data: latestByType[t] ?? null,
        label: this.getForecastLabel(t),
      })),
      summary: {
        highRisk: Object.values(latestByType).filter(d => d.currentScore >= 0.70).length,
        improving: Object.values(latestByType).filter(d => d.trend === "improving").length,
        declining: Object.values(latestByType).filter(d => d.trend === "declining").length,
      },
    };
  }

  private getForecastLabel(type: PilotOneForecastType): string {
    const labels: Record<PilotOneForecastType, string> = {
      insurer_response_latency: "Insurer Response Latency",
      offer_movement_likelihood: "Offer Movement Likelihood",
      settlement_friction: "Settlement Friction Score",
      review_bottleneck: "Review Bottleneck Risk",
      approval_lag_risk: "Approval Lag Risk",
      recovery_lien_drag_risk: "Recovery / Lien Drag Risk",
      quiet_risk_deterioration: "Quiet Risk Deterioration",
    };
    return labels[type] ?? type;
  }
}

export const forecastExpanded = new ForecastExpandedEngine();
