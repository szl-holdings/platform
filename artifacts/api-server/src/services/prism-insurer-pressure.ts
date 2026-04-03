import { db } from "@workspace/db";
import {
  pcInsurerPressureSnapshotsTable, pcInsurerPressureDriversTable,
  pcCarrierBehaviorPatternsTable, pcCarrierResponseEventsTable,
  pcCarrierSilenceWindowsTable, pcCarrierOfferBehaviorTable,
  pcCarrierReserveBehaviorTable,
} from "@workspace/db";
import { pcMattersTable, pcCommunicationsTable, pcClaimsTable } from "@workspace/db";
import { eq, and, desc, gte, lt } from "drizzle-orm";
import { logger } from "../lib/logger";

const PRESSURE_DIMENSIONS = [
  "response_latency", "silence_window", "partial_response", "verification_churn",
  "denial_frequency", "offer_movement", "reserve_movement", "escalation_responsiveness",
  "adjuster_handoff", "matter_stage_sensitivity", "historic_firm_experience", "posture_hardening",
] as const;

type PressureDriver = typeof PRESSURE_DIMENSIONS[number];

interface PressureAnalysis {
  overallScore: number;
  confidence: number;
  direction: "rising" | "falling" | "stable" | "new";
  operationalMeaning: string;
  recommendedNextAction: string;
  topDrivers: Array<{ name: string; category: PressureDriver; weight: number; impact: "positive" | "negative" | "neutral"; explanation: string }>;
  recentSignals: string[];
}

class InsurerPressureEngine {
  async computePressure(orgId: number, matterId: number): Promise<PressureAnalysis> {
    const [matter] = await db.select().from(pcMattersTable).where(eq(pcMattersTable.id, matterId));
    if (!matter) throw new Error(`Matter ${matterId} not found`);

    const [claims, communications, priorSnapshot] = await Promise.all([
      db.select().from(pcClaimsTable).where(eq(pcClaimsTable.matterId, matterId)),
      db.select().from(pcCommunicationsTable)
        .where(and(eq(pcCommunicationsTable.matterId, matterId)))
        .orderBy(desc(pcCommunicationsTable.sentAt)).limit(50),
      db.select().from(pcInsurerPressureSnapshotsTable)
        .where(and(eq(pcInsurerPressureSnapshotsTable.orgId, orgId), eq(pcInsurerPressureSnapshotsTable.matterId, matterId)))
        .orderBy(desc(pcInsurerPressureSnapshotsTable.computedAt)).limit(1),
    ]);

    const carrierComms = communications.filter(c => c.fromParty?.toLowerCase().includes("carrier") || c.fromParty?.toLowerCase().includes("insurer") || c.fromParty?.toLowerCase().includes("adjuster"));
    const lastCarrierComm = carrierComms[0];
    const daysSilent = lastCarrierComm
      ? Math.floor((Date.now() - new Date(lastCarrierComm.sentAt!).getTime()) / 86400000)
      : 30;

    const drivers: PressureAnalysis["topDrivers"] = [];
    const signals: string[] = [];
    let rawScore = 0;

    if (daysSilent >= 14) {
      const w = Math.min(1, daysSilent / 30) * 0.85;
      drivers.push({ name: "Carrier Silence Window", category: "silence_window", weight: w, impact: "negative", explanation: `Carrier has been silent for ${daysSilent} days — silence windows exceeding 14 days typically indicate posture hardening or internal review.` });
      signals.push(`${daysSilent}-day silence window detected`);
      rawScore += w * 0.25;
    } else if (daysSilent >= 7) {
      drivers.push({ name: "Response Lag", category: "response_latency", weight: 0.5, impact: "negative", explanation: `${daysSilent}-day response lag — monitor for extension into a silence window.` });
      signals.push(`Response lag at ${daysSilent} days`);
      rawScore += 0.12;
    }

    const denialComms = communications.filter(c => c.summary?.toLowerCase().includes("deni"));
    if (denialComms.length > 0) {
      const w = Math.min(1, denialComms.length / 3) * 0.9;
      drivers.push({ name: "Denial Activity", category: "denial_frequency", weight: w, impact: "negative", explanation: `${denialComms.length} denial communication(s) detected. Repeated denials indicate carrier resistance pattern.` });
      signals.push(`${denialComms.length} denial(s) detected`);
      rawScore += w * 0.20;
    }

    const claimsOpen = claims.filter(c => c.status === "open" || c.status === "pending");
    if (claimsOpen.length > 0) {
      rawScore += 0.05 * claimsOpen.length;
      signals.push(`${claimsOpen.length} open claim(s) requiring carrier action`);
    }

    if (claims.length === 0) {
      drivers.push({ name: "No Claims Linked", category: "matter_stage_sensitivity", weight: 0.6, impact: "negative", explanation: "No carrier claims have been linked. Pressure cannot be accurately scored without claim context." });
      rawScore += 0.10;
    }

    const partialComms = communications.filter(c => c.summary?.toLowerCase().includes("partial") || c.summary?.toLowerCase().includes("incomplete"));
    if (partialComms.length > 0) {
      drivers.push({ name: "Partial Responses", category: "partial_response", weight: 0.65, impact: "negative", explanation: `${partialComms.length} partial or incomplete carrier response(s) detected. Partial responses indicate delay tactics.` });
      rawScore += 0.10;
      signals.push("Partial response pattern detected");
    }

    const overallScore = Math.min(1, Math.max(0, rawScore + 0.30));
    const priorScore = priorSnapshot[0]?.overallScore ?? null;
    let direction: PressureAnalysis["direction"] = "new";
    if (priorScore !== null) {
      direction = overallScore > priorScore + 0.05 ? "rising" : overallScore < priorScore - 0.05 ? "falling" : "stable";
    }

    const operationalMeaning = this.generateOperationalMeaning(overallScore, daysSilent, denialComms.length, direction);
    const recommendedNextAction = this.generateRecommendedAction(overallScore, daysSilent, denialComms.length);

    if (drivers.length === 0) {
      drivers.push({ name: "Standard Response Cadence", category: "response_latency", weight: 0.3, impact: "neutral", explanation: "Carrier communications are within expected response windows. No elevated pressure signals detected." });
    }

    return { overallScore, confidence: 0.75, direction, operationalMeaning, recommendedNextAction, topDrivers: drivers.slice(0, 5), recentSignals: signals };
  }

  private generateOperationalMeaning(score: number, daysSilent: number, denials: number, direction: string): string {
    if (score >= 0.75) return `High insurer pressure — ${daysSilent > 14 ? "prolonged silence window" : "multiple resistance signals"} detected. ${direction === "rising" ? "Pressure is escalating and requires immediate action." : "Sustained high pressure requires strategic response."}`;
    if (score >= 0.55) return `Moderate-to-high insurer pressure. ${denials > 0 ? "Denial pattern is active." : "Communication cadence is lagging."} ${direction === "rising" ? "Pressure is increasing — act before it escalates." : "Monitor closely for changes."}`;
    if (score >= 0.35) return `Moderate insurer pressure. Carrier is engaged but showing ${daysSilent > 7 ? "response delays" : "some resistance signals"}. Maintain monitoring cadence.`;
    return "Low insurer pressure. Carrier communications are timely and resistance signals are minimal. Continue normal engagement.";
  }

  private generateRecommendedAction(score: number, daysSilent: number, denials: number): string {
    if (score >= 0.75 && daysSilent > 21) return "Send formal escalation letter to carrier supervisor, document the silence window, and consider filing a bad faith preservation notice.";
    if (score >= 0.75) return "Issue written follow-up demand with response deadline. Prepare bad faith documentation if silence continues.";
    if (score >= 0.55 && denials > 0) return "Request written basis for all denials. Prepare counter-argument packet and consider formal dispute letter.";
    if (score >= 0.55) return "Send structured follow-up communication with specific asks and a reasonable response deadline. Track all carrier responses.";
    if (score >= 0.35) return "Maintain regular communication cadence. Log all carrier responses and flag any silence windows immediately.";
    return "Monitor communications weekly. No immediate escalation required.";
  }

  async saveSnapshot(orgId: number, matterId: number, analysis: PressureAnalysis): Promise<number> {
    const [snapshot] = await db.insert(pcInsurerPressureSnapshotsTable).values({
      orgId, matterId,
      overallScore: analysis.overallScore,
      priorScore: null,
      direction: analysis.direction,
      confidence: analysis.confidence,
      operationalMeaning: analysis.operationalMeaning,
      recommendedNextAction: analysis.recommendedNextAction,
      recentSignals: analysis.recentSignals,
      requiresReview: analysis.overallScore >= 0.75,
    }).returning();

    for (const d of analysis.topDrivers) {
      await db.insert(pcInsurerPressureDriversTable).values({
        orgId, matterId, snapshotId: snapshot.id,
        driverName: d.name, driverCategory: d.category,
        weight: d.weight, impact: d.impact, explanation: d.explanation,
        confidence: analysis.confidence,
      });
    }

    logger.info({ orgId, matterId, snapshotId: snapshot.id, score: analysis.overallScore }, "Insurer pressure snapshot saved");
    return snapshot.id;
  }

  async compute(orgId: number, matterId: number): Promise<{ snapshotId: number; analysis: PressureAnalysis }> {
    const analysis = await this.computePressure(orgId, matterId);
    const snapshotId = await this.saveSnapshot(orgId, matterId, analysis);
    return { snapshotId, analysis };
  }

  async generateSilenceWindow(orgId: number, matterId: number, carrierName: string, daysSilent: number): Promise<void> {
    if (daysSilent < 7) return;
    const existing = await db.select().from(pcCarrierSilenceWindowsTable)
      .where(and(eq(pcCarrierSilenceWindowsTable.orgId, orgId), eq(pcCarrierSilenceWindowsTable.matterId, matterId), eq(pcCarrierSilenceWindowsTable.isCurrent, true)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(pcCarrierSilenceWindowsTable).values({
        orgId, matterId, carrierName,
        silenceStartAt: new Date(Date.now() - daysSilent * 86400000),
        daysSilent,
        isCurrent: true,
        silenceRisk: daysSilent >= 21 ? "critical" : daysSilent >= 14 ? "high" : "medium",
        escalationSuggested: daysSilent >= 21,
        escalationTemplateKey: daysSilent >= 21 ? "carrier_silence_formal_escalation" : "carrier_silence_follow_up",
        outstandingItems: ["Response to last demand letter", "Claim status update"],
      });
    } else {
      await db.update(pcCarrierSilenceWindowsTable)
        .set({ daysSilent, updatedAt: new Date(), silenceRisk: daysSilent >= 21 ? "critical" : daysSilent >= 14 ? "high" : "medium" })
        .where(eq(pcCarrierSilenceWindowsTable.id, existing[0].id));
    }
  }

  async recordCarrierEvent(orgId: number, matterId: number, data: {
    carrierName: string; eventType: string; description?: string;
    daysSinceLastContact?: number; signalStrength?: number; sourceRef?: string;
  }): Promise<void> {
    await db.insert(pcCarrierResponseEventsTable).values({
      orgId, matterId,
      carrierName: data.carrierName,
      eventType: data.eventType as any,
      description: data.description,
      daysSinceLastContact: data.daysSinceLastContact,
      signalStrength: data.signalStrength ?? 0.7,
      pressureImpact: data.eventType === "response_received" ? "decreases" : "increases",
      sourceRef: data.sourceRef,
    });
  }

  async getLatestSnapshot(orgId: number, matterId: number) {
    const [snapshot] = await db.select().from(pcInsurerPressureSnapshotsTable)
      .where(and(eq(pcInsurerPressureSnapshotsTable.orgId, orgId), eq(pcInsurerPressureSnapshotsTable.matterId, matterId)))
      .orderBy(desc(pcInsurerPressureSnapshotsTable.computedAt)).limit(1);
    if (!snapshot) return null;
    const drivers = await db.select().from(pcInsurerPressureDriversTable)
      .where(eq(pcInsurerPressureDriversTable.snapshotId, snapshot.id));
    return { snapshot, drivers };
  }

  async getPortfolioPressureView(orgId: number) {
    const matters = await db.select().from(pcMattersTable).where(eq(pcMattersTable.orgId, orgId)).limit(50);
    const results = [];
    for (const m of matters) {
      const latest = await db.select().from(pcInsurerPressureSnapshotsTable)
        .where(and(eq(pcInsurerPressureSnapshotsTable.orgId, orgId), eq(pcInsurerPressureSnapshotsTable.matterId, m.id)))
        .orderBy(desc(pcInsurerPressureSnapshotsTable.computedAt)).limit(1);
      if (latest.length > 0) {
        results.push({
          matter: { id: m.id, title: m.title, caseNumber: m.caseNumber },
          pressure: latest[0],
        });
      }
    }
    return results.sort((a, b) => b.pressure.overallScore - a.pressure.overallScore);
  }

  async getCarrierPatterns(orgId: number, carrierName?: string) {
    const conditions = carrierName
      ? and(eq(pcCarrierBehaviorPatternsTable.orgId, orgId), eq(pcCarrierBehaviorPatternsTable.carrierName, carrierName))
      : eq(pcCarrierBehaviorPatternsTable.orgId, orgId);
    return db.select().from(pcCarrierBehaviorPatternsTable)
      .where(conditions)
      .orderBy(desc(pcCarrierBehaviorPatternsTable.updatedAt)).limit(50);
  }

  async getSilenceWindows(orgId: number, matterId?: number) {
    const conditions = matterId
      ? and(eq(pcCarrierSilenceWindowsTable.orgId, orgId), eq(pcCarrierSilenceWindowsTable.matterId, matterId), eq(pcCarrierSilenceWindowsTable.isCurrent, true))
      : and(eq(pcCarrierSilenceWindowsTable.orgId, orgId), eq(pcCarrierSilenceWindowsTable.isCurrent, true));
    return db.select().from(pcCarrierSilenceWindowsTable).where(conditions).orderBy(desc(pcCarrierSilenceWindowsTable.daysSilent)).limit(50);
  }
}

export const insurerPressureEngine = new InsurerPressureEngine();
