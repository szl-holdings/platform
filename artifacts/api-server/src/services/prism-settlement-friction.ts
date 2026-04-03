import { db } from "@szl-holdings/db";
import {
  pcSettlementFrictionSnapshotsTable, pcSettlementFrictionDriversTable,
  pcMovementRecommendationsTable,
} from "@szl-holdings/db";
import {
  pcMattersTable, pcCommunicationsTable, pcClaimsTable, pcLiensTable,
  pcDamagesTable, pcMedicalEventsTable, pcDeadlinesTable, pcApprovalRequestsTable,
} from "@szl-holdings/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

type BlockerCategory = "internal_process" | "carrier_insurer" | "evidence" | "medical_damages" | "governance_review" | "venue_timing" | "recovery_lien";

interface FrictionDriver {
  name: string;
  category: BlockerCategory;
  weight: number;
  impact: "positive" | "negative" | "neutral";
  explanation: string;
  dragEstimateDays?: number;
  sourceRef?: string;
}

interface FrictionAnalysis {
  overallScore: number;
  priorScore: number | null;
  direction: "rising" | "falling" | "stable" | "new";
  confidence: number;
  readinessDragDays: number;
  frictionClass: "internal" | "external" | "mixed";
  smallestAction: string;
  topBlockers: FrictionDriver[];
  byCategory: Record<BlockerCategory, FrictionDriver[]>;
}

class SettlementFrictionEngine {
  async computeFriction(orgId: number, matterId: number): Promise<FrictionAnalysis> {
    const [matter] = await db.select().from(pcMattersTable).where(eq(pcMattersTable.id, matterId));
    if (!matter) throw new Error(`Matter ${matterId} not found`);

    const [claims, liens, damages, medical, deadlines, approvals, communications, priorSnapshot] = await Promise.all([
      db.select().from(pcClaimsTable).where(eq(pcClaimsTable.matterId, matterId)),
      db.select().from(pcLiensTable).where(eq(pcLiensTable.matterId, matterId)),
      db.select().from(pcDamagesTable).where(eq(pcDamagesTable.matterId, matterId)),
      db.select().from(pcMedicalEventsTable).where(eq(pcMedicalEventsTable.matterId, matterId)).orderBy(desc(pcMedicalEventsTable.eventDate)),
      db.select().from(pcDeadlinesTable).where(eq(pcDeadlinesTable.matterId, matterId)),
      db.select().from(pcApprovalRequestsTable).where(and(eq(pcApprovalRequestsTable.matterId, matterId), eq(pcApprovalRequestsTable.status, "pending"))),
      db.select().from(pcCommunicationsTable).where(eq(pcCommunicationsTable.matterId, matterId)).orderBy(desc(pcCommunicationsTable.sentAt)).limit(30),
      db.select().from(pcSettlementFrictionSnapshotsTable)
        .where(and(eq(pcSettlementFrictionSnapshotsTable.orgId, orgId), eq(pcSettlementFrictionSnapshotsTable.matterId, matterId)))
        .orderBy(desc(pcSettlementFrictionSnapshotsTable.computedAt)).limit(1),
    ]);

    const drivers: FrictionDriver[] = [];
    let rawScore = 0;
    let totalDragDays = 0;
    let internalCount = 0;
    let externalCount = 0;

    const activeLiens = liens.filter(l => l.status === "asserted" || l.status === "negotiating");
    if (activeLiens.length > 0) {
      const drag = activeLiens.length * 7;
      drivers.push({ name: "Active Liens Unresolved", category: "recovery_lien", weight: 0.75, impact: "negative", explanation: `${activeLiens.length} active lien(s) with combined asserted amount require resolution before settlement can proceed. Each unresolved lien adds approximately 7-14 days to readiness timeline.`, dragEstimateDays: drag });
      rawScore += 0.15;
      totalDragDays += drag;
      internalCount++;
    }

    const unverifiedDamages = damages.filter(d => d.verificationStatus === "pending" || d.verificationStatus === "estimated");
    if (unverifiedDamages.length > 0) {
      const drag = unverifiedDamages.length * 5;
      drivers.push({ name: "Unverified Damages Components", category: "medical_damages", weight: 0.70, impact: "negative", explanation: `${unverifiedDamages.length} damages element(s) are unverified or estimated. Carriers will not engage seriously on settlement without verified damages documentation.`, dragEstimateDays: drag });
      rawScore += 0.12;
      totalDragDays += drag;
      internalCount++;
    }

    if (medical.length === 0) {
      drivers.push({ name: "No Medical Events Recorded", category: "evidence", weight: 0.80, impact: "negative", explanation: "No medical events have been recorded. Treatment history is a foundational element of any personal injury settlement. Without it, demand strength is severely limited.", dragEstimateDays: 14 });
      rawScore += 0.18;
      totalDragDays += 14;
      internalCount++;
    }

    if (approvals.length > 0) {
      const drag = approvals.length * 3;
      drivers.push({ name: "Pending Governance Approvals", category: "governance_review", weight: 0.65, impact: "negative", explanation: `${approvals.length} approval request(s) are pending. These must be resolved before settlement-related actions can proceed.`, dragEstimateDays: drag });
      rawScore += 0.10;
      totalDragDays += drag;
      internalCount++;
    }

    const carrierDenials = communications.filter(c => c.summary?.toLowerCase().includes("deni") && c.direction === "inbound");
    if (carrierDenials.length > 0) {
      drivers.push({ name: "Active Carrier Denials", category: "carrier_insurer", weight: 0.75, impact: "negative", explanation: `${carrierDenials.length} carrier denial communication(s) detected. Active denials create friction and require formal dispute responses before settlement movement is possible.`, dragEstimateDays: 10 });
      rawScore += 0.15;
      totalDragDays += 10;
      externalCount++;
    }

    const silenceComms = communications.filter(c => c.direction === "outbound" && (c.channel === "email" || c.channel === "letter"));
    const lastInbound = communications.find(c => c.direction === "inbound");
    if (silenceComms.length > 0 && !lastInbound) {
      drivers.push({ name: "No Carrier Inbound Response", category: "carrier_insurer", weight: 0.65, impact: "negative", explanation: "Outbound communications have been sent but no carrier response has been recorded. This silence blocks settlement movement.", dragEstimateDays: 7 });
      rawScore += 0.12;
      totalDragDays += 7;
      externalCount++;
    }

    const overdueDeadlines = deadlines.filter(d => d.status === "overdue");
    if (overdueDeadlines.length > 0) {
      drivers.push({ name: "Overdue Deadlines", category: "venue_timing", weight: 0.80, impact: "negative", explanation: `${overdueDeadlines.length} deadline(s) are overdue. Missed deadlines reduce settlement leverage and may require extensions or court filings.`, dragEstimateDays: 5 });
      rawScore += 0.13;
      totalDragDays += 5;
      externalCount++;
    }

    if (claims.length === 0) {
      drivers.push({ name: "No Claims Linked", category: "internal_process", weight: 0.60, impact: "negative", explanation: "No insurance claims have been linked to this matter. Claim data is required to evaluate settlement parameters and carrier obligations.", dragEstimateDays: 3 });
      rawScore += 0.08;
      totalDragDays += 3;
      internalCount++;
    }

    if (!matter.settlementLow && !matter.settlementHigh) {
      drivers.push({ name: "No Settlement Range Established", category: "internal_process", weight: 0.55, impact: "negative", explanation: "No settlement range has been defined. Without a target range, negotiation strategy cannot be operationalized.", dragEstimateDays: 5 });
      rawScore += 0.08;
      totalDragDays += 5;
      internalCount++;
    }

    const overallScore = Math.min(1, Math.max(0, rawScore + 0.20));
    const priorScore = priorSnapshot[0]?.overallScore ?? null;
    let direction: FrictionAnalysis["direction"] = "new";
    if (priorScore !== null) {
      direction = overallScore > priorScore + 0.05 ? "rising" : overallScore < priorScore - 0.05 ? "falling" : "stable";
    }

    const frictionClass: FrictionAnalysis["frictionClass"] = internalCount > externalCount ? "internal" : externalCount > internalCount ? "external" : "mixed";
    const smallestAction = this.identifySmallestAction(drivers);

    const byCategory: Record<BlockerCategory, FrictionDriver[]> = {
      internal_process: [],
      carrier_insurer: [],
      evidence: [],
      medical_damages: [],
      governance_review: [],
      venue_timing: [],
      recovery_lien: [],
    };
    for (const d of drivers) {
      byCategory[d.category].push(d);
    }

    return {
      overallScore, priorScore, direction,
      confidence: 0.75, readinessDragDays: totalDragDays, frictionClass,
      smallestAction, topBlockers: drivers.slice(0, 5), byCategory,
    };
  }

  private identifySmallestAction(drivers: FrictionDriver[]): string {
    const sorted = [...drivers].sort((a, b) => (a.dragEstimateDays ?? 99) - (b.dragEstimateDays ?? 99));
    const quickest = sorted[0];
    if (!quickest) return "Review all matter elements for completeness before proceeding.";

    const actionMap: Record<BlockerCategory, string> = {
      internal_process: "Complete the missing internal process item to unblock downstream activities",
      carrier_insurer: "Send a structured follow-up communication to the carrier with a specific response deadline",
      evidence: "Process the outstanding evidence items through the document pipeline",
      medical_damages: "Verify the outstanding damages component — this unlocks the highest value friction reduction",
      governance_review: "Resolve the pending governance approval to unlock the blocked action queue",
      venue_timing: "Address the deadline compliance issue to prevent further leverage loss",
      recovery_lien: "Contact the lien holder to initiate a negotiation or waiver conversation",
    };
    return actionMap[quickest.category] ?? "Complete the highest-weight blocker to reduce settlement friction";
  }

  async saveSnapshot(orgId: number, matterId: number, analysis: FrictionAnalysis): Promise<number> {
    const [snapshot] = await db.insert(pcSettlementFrictionSnapshotsTable).values({
      orgId, matterId,
      overallScore: analysis.overallScore,
      priorScore: analysis.priorScore,
      direction: analysis.direction,
      confidence: analysis.confidence,
      readinessDragDays: analysis.readinessDragDays,
      frictionClass: analysis.frictionClass,
      smallestAction: analysis.smallestAction,
      requiresReview: analysis.overallScore >= 0.70,
    }).returning();

    for (const d of analysis.topBlockers) {
      await db.insert(pcSettlementFrictionDriversTable).values({
        orgId, matterId, snapshotId: snapshot.id,
        driverName: d.name, blockerCategory: d.category,
        weight: d.weight, impact: d.impact, explanation: d.explanation,
        dragEstimateDays: d.dragEstimateDays,
        confidence: analysis.confidence,
        sourceRef: d.sourceRef,
      });
    }

    await this.generateMovementRecommendations(orgId, matterId, analysis);

    logger.info({ orgId, matterId, snapshotId: snapshot.id, score: analysis.overallScore }, "Settlement friction snapshot saved");
    return snapshot.id;
  }

  private async generateMovementRecommendations(orgId: number, matterId: number, analysis: FrictionAnalysis): Promise<void> {
    const recommendations: Array<{ recommendationType: "reduce_friction" | "lien_resolution" | "carrier_engagement"; title: string; explanation: string; priority: "high" | "medium"; estimatedMinutes: number }> = [
      { recommendationType: "reduce_friction", title: "Smallest Action to Reduce Friction", explanation: analysis.smallestAction, priority: "high", estimatedMinutes: 30 },
    ];

    if (analysis.byCategory.recovery_lien.length > 0) {
      recommendations.push({ recommendationType: "lien_resolution", title: "Initiate Lien Resolution Process", explanation: "Contact all active lien holders to initiate negotiation or waiver discussions. Lien resolution is frequently the rate-limiting step in settlement.", priority: "high", estimatedMinutes: 60 });
    }

    if (analysis.byCategory.carrier_insurer.length > 0) {
      recommendations.push({ recommendationType: "carrier_engagement", title: "Structured Carrier Engagement", explanation: "Prepare a structured carrier communication with specific asks, a response deadline, and consequences of non-response. This converts passive follow-up into active pressure.", priority: "medium", estimatedMinutes: 45 });
    }

    for (const rec of recommendations) {
      await db.insert(pcMovementRecommendationsTable).values({
        orgId, matterId, ...rec,
        confidence: analysis.confidence,
        estimatedImpact: `Estimated to reduce friction score by 0.10-0.20 and readiness drag by ${Math.floor(analysis.readinessDragDays * 0.3)} days`,
      });
    }
  }

  async compute(orgId: number, matterId: number): Promise<{ snapshotId: number; analysis: FrictionAnalysis }> {
    const analysis = await this.computeFriction(orgId, matterId);
    const snapshotId = await this.saveSnapshot(orgId, matterId, analysis);
    return { snapshotId, analysis };
  }

  async getLatestSnapshot(orgId: number, matterId: number) {
    const [snapshot] = await db.select().from(pcSettlementFrictionSnapshotsTable)
      .where(and(eq(pcSettlementFrictionSnapshotsTable.orgId, orgId), eq(pcSettlementFrictionSnapshotsTable.matterId, matterId)))
      .orderBy(desc(pcSettlementFrictionSnapshotsTable.computedAt)).limit(1);
    if (!snapshot) return null;
    const drivers = await db.select().from(pcSettlementFrictionDriversTable)
      .where(eq(pcSettlementFrictionDriversTable.snapshotId, snapshot.id));
    return { snapshot, drivers };
  }

  async getPortfolioFrictionView(orgId: number) {
    const matters = await db.select().from(pcMattersTable).where(eq(pcMattersTable.orgId, orgId)).limit(50);
    const results = [];
    for (const m of matters) {
      const latest = await db.select().from(pcSettlementFrictionSnapshotsTable)
        .where(and(eq(pcSettlementFrictionSnapshotsTable.orgId, orgId), eq(pcSettlementFrictionSnapshotsTable.matterId, m.id)))
        .orderBy(desc(pcSettlementFrictionSnapshotsTable.computedAt)).limit(1);
      if (latest.length > 0) {
        results.push({ matter: { id: m.id, title: m.title, caseNumber: m.caseNumber }, friction: latest[0] });
      }
    }
    return results.sort((a, b) => b.friction.overallScore - a.friction.overallScore);
  }

  async getMovementRecommendations(orgId: number, matterId?: number) {
    const conditions = matterId
      ? and(eq(pcMovementRecommendationsTable.orgId, orgId), eq(pcMovementRecommendationsTable.matterId, matterId), eq(pcMovementRecommendationsTable.status, "suggested"))
      : and(eq(pcMovementRecommendationsTable.orgId, orgId), eq(pcMovementRecommendationsTable.status, "suggested"));
    return db.select().from(pcMovementRecommendationsTable).where(conditions).orderBy(desc(pcMovementRecommendationsTable.createdAt)).limit(20);
  }
}

export const settlementFrictionEngine = new SettlementFrictionEngine();
