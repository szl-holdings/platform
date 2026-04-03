import { db } from "@workspace/db";
import { pcMatterTwinSnapshotsTable, pcPressureScoresTable, pcForecastDiffsTable, pcProofChainEntriesTable, pcDataProductScoresTable, pcWorldlineFeaturesTable } from "@workspace/db/schema";
import { pcMattersTable, pcPartiesTable, pcClaimsTable, pcDeadlinesTable, pcCommunicationsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

class MatterTwinService {
  async buildSnapshot(orgId: number, matterId: number, snapshotType: "daily" | "weekly" | "on_change" | "manual" = "on_change") {
    const [matter] = await db.select().from(pcMattersTable).where(eq(pcMattersTable.id, matterId));
    if (!matter) throw new Error(`Matter ${matterId} not found`);

    const [parties, claims, deadlines, comms] = await Promise.all([
      db.select().from(pcPartiesTable).where(eq(pcPartiesTable.matterId, matterId)),
      db.select().from(pcClaimsTable).where(eq(pcClaimsTable.matterId, matterId)),
      db.select().from(pcDeadlinesTable).where(eq(pcDeadlinesTable.matterId, matterId)),
      db.select().from(pcCommunicationsTable).where(eq(pcCommunicationsTable.matterId, matterId)).orderBy(desc(pcCommunicationsTable.createdAt)).limit(20),
    ]);

    const pressureScores = await db.select().from(pcPressureScoresTable)
      .where(and(eq(pcPressureScoresTable.orgId, orgId), eq(pcPressureScoresTable.matterId, matterId)))
      .orderBy(desc(pcPressureScoresTable.computedAt));

    const latestPressure: Record<string, any> = {};
    for (const s of pressureScores) {
      if (!latestPressure[s.dimension]) latestPressure[s.dimension] = s;
    }

    const forecasts = await db.select().from(pcForecastDiffsTable)
      .where(and(eq(pcForecastDiffsTable.orgId, orgId), eq(pcForecastDiffsTable.matterId, matterId)))
      .orderBy(desc(pcForecastDiffsTable.createdAt)).limit(20);

    const worldlineFeatures = await db.select().from(pcWorldlineFeaturesTable)
      .where(and(eq(pcWorldlineFeaturesTable.orgId, orgId), eq(pcWorldlineFeaturesTable.matterId, matterId)))
      .orderBy(desc(pcWorldlineFeaturesTable.createdAt)).limit(20);

    const proofChain = await db.select().from(pcProofChainEntriesTable)
      .where(and(eq(pcProofChainEntriesTable.orgId, orgId), eq(pcProofChainEntriesTable.matterId, matterId)))
      .orderBy(desc(pcProofChainEntriesTable.createdAt)).limit(20);

    const dataProducts = await db.select().from(pcDataProductScoresTable)
      .where(and(eq(pcDataProductScoresTable.orgId, orgId), eq(pcDataProductScoresTable.matterId, matterId)))
      .orderBy(desc(pcDataProductScoresTable.computedAt));

    const latestProducts: Record<string, any> = {};
    for (const p of dataProducts) {
      if (!latestProducts[p.product]) latestProducts[p.product] = p;
    }

    const priorSnapshot = await db.select().from(pcMatterTwinSnapshotsTable)
      .where(and(eq(pcMatterTwinSnapshotsTable.orgId, orgId), eq(pcMatterTwinSnapshotsTable.matterId, matterId)))
      .orderBy(desc(pcMatterTwinSnapshotsTable.createdAt)).limit(1);

    const changes = this.computeChanges(priorSnapshot[0] ?? null, latestPressure, forecasts);
    const missingArtifacts = this.identifyMissing(matter, parties, claims, deadlines, comms, proofChain);
    const riskFactors = this.identifyRisks(latestPressure, latestProducts, deadlines);
    const nextActions = this.recommendActions(riskFactors, missingArtifacts, latestPressure);

    const domains = {
      people: { parties: parties.length, roles: [...new Set(parties.map(p => p.role))] },
      claims: { total: claims.length, statuses: [...new Set(claims.map(c => c.status))] },
      deadlines: { total: deadlines.length, upcoming: deadlines.filter((d: any) => d.status === "pending").length },
      documents: { proofChainEntries: proofChain.length, reviewPending: proofChain.filter(p => p.reviewState === "pending_review").length },
      communications: { total: comms.length, recent: comms.slice(0, 5).map(c => ({ type: c.commType, date: c.createdAt })) },
      forecasts: { total: forecasts.length, types: [...new Set(forecasts.map(f => f.forecastType))] },
      worldline: { features: worldlineFeatures.length, sourceClasses: [...new Set(worldlineFeatures.map(f => f.sourceClass))] },
      dataProducts: latestProducts,
    };

    const [snapshot] = await db.insert(pcMatterTwinSnapshotsTable).values({
      orgId, matterId, snapshotType,
      domains, pressureScores: latestPressure,
      forecastSnapshot: forecasts.slice(0, 10),
      worldlineOverlays: worldlineFeatures.slice(0, 10),
      communicationsSummary: { total: comms.length, recentTypes: comms.slice(0, 5).map(c => c.commType) },
      documentsSummary: { proofChainEntries: proofChain.length, pendingReview: proofChain.filter(p => p.reviewState === "pending_review").length },
      approvalsSummary: { pending: proofChain.filter(p => p.approvalState === "pending").length },
      healthScore: matter.healthScore,
      changesSincePrior: changes,
      missingArtifacts,
      riskFactors,
      nextActions,
    }).returning();

    logger.info({ orgId, matterId, snapshotId: snapshot.id, snapshotType }, "Matter Twin snapshot created");
    return snapshot;
  }

  private computeChanges(priorSnapshot: any, currentPressure: Record<string, any>, forecasts: any[]) {
    if (!priorSnapshot) return { isFirst: true, changes: [] };

    const changes: string[] = [];
    const priorPressure = (priorSnapshot.pressureScores ?? {}) as Record<string, any>;

    for (const [dim, current] of Object.entries(currentPressure)) {
      const prior = priorPressure[dim];
      if (!prior) { changes.push(`New pressure dimension: ${dim}`); continue; }
      const diff = (current as any).score - (prior.score ?? 0);
      if (Math.abs(diff) > 0.05) {
        changes.push(`${dim} pressure ${diff > 0 ? "increased" : "decreased"} by ${Math.abs(Math.round(diff * 100))}%`);
      }
    }

    return { isFirst: false, changes, totalChanges: changes.length };
  }

  private identifyMissing(matter: any, parties: any[], claims: any[], deadlines: any[], comms: any[], proofChain: any[]) {
    const missing: string[] = [];
    if (parties.length === 0) missing.push("No parties assigned");
    if (claims.length === 0) missing.push("No claims linked");
    if (!parties.find(p => p.role === "plaintiff")) missing.push("No plaintiff identified");
    if (!parties.find(p => p.role === "carrier")) missing.push("No carrier identified");
    if (deadlines.length === 0) missing.push("No deadlines set");
    if (comms.length === 0) missing.push("No communications recorded");
    if (!matter.settlementLow && !matter.settlementHigh) missing.push("No settlement range estimated");
    if (proofChain.length === 0) missing.push("No proof chain entries");
    return missing;
  }

  private identifyRisks(pressure: Record<string, any>, products: Record<string, any>, deadlines: any[]) {
    const risks: Array<{ level: string; description: string; dimension: string }> = [];

    for (const [dim, p] of Object.entries(pressure)) {
      if ((p as any).score > 0.7) risks.push({ level: "high", description: `${dim} pressure elevated at ${Math.round((p as any).score * 100)}%`, dimension: dim });
      else if ((p as any).score > 0.5) risks.push({ level: "medium", description: `${dim} pressure moderate at ${Math.round((p as any).score * 100)}%`, dimension: dim });
    }

    const overdue = deadlines.filter((d: any) => d.status === "overdue");
    if (overdue.length > 0) risks.push({ level: "critical", description: `${overdue.length} overdue deadline(s)`, dimension: "deadline" });

    return risks.sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.level] ?? 4) - (order[b.level] ?? 4);
    });
  }

  private recommendActions(risks: any[], missing: string[], pressure: Record<string, any>) {
    const actions: string[] = [];

    for (const m of missing.slice(0, 3)) {
      actions.push(`Resolve: ${m}`);
    }

    for (const r of risks.filter((r: any) => r.level === "critical" || r.level === "high").slice(0, 3)) {
      actions.push(`Address ${r.dimension}: ${r.description}`);
    }

    if (actions.length === 0) actions.push("Matter Twin is healthy — continue monitoring");

    return actions;
  }

  async getLatestSnapshot(orgId: number, matterId: number) {
    const [snapshot] = await db.select().from(pcMatterTwinSnapshotsTable)
      .where(and(eq(pcMatterTwinSnapshotsTable.orgId, orgId), eq(pcMatterTwinSnapshotsTable.matterId, matterId)))
      .orderBy(desc(pcMatterTwinSnapshotsTable.createdAt)).limit(1);
    return snapshot ?? null;
  }

  async getSnapshotHistory(orgId: number, matterId: number, limit = 10) {
    return db.select().from(pcMatterTwinSnapshotsTable)
      .where(and(eq(pcMatterTwinSnapshotsTable.orgId, orgId), eq(pcMatterTwinSnapshotsTable.matterId, matterId)))
      .orderBy(desc(pcMatterTwinSnapshotsTable.createdAt)).limit(limit);
  }
}

export const matterTwin = new MatterTwinService();
