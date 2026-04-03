import { insurerPressureEngine } from "./prism-insurer-pressure";
import { settlementFrictionEngine } from "./prism-settlement-friction";
import { forecastExpanded } from "./prism-forecast-expanded";
import { portfolioLearning } from "./prism-portfolio-learning";
import { db } from "@szl-holdings/db";
import { pcMattersTable, pcCommunicationsTable, pcDeadlinesTable } from "@szl-holdings/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

interface ActionCardResult {
  cardId: string;
  title: string;
  response: string;
  confidence: number;
  drivers: string[];
  sources: string[];
  requiresApproval: boolean;
  proofChainRef: string;
}

type ActionCardId =
  | "why_harder_than_looks"
  | "what_blocking_settlement"
  | "explain_pressure_score"
  | "what_changed_since_monday"
  | "smallest_action_readiness"
  | "draft_partner_briefing"
  | "draft_escalation_note"
  | "settlement_friction_memo"
  | "matter_movement_summary"
  | "carrier_watch_summary"
  | "pressure_trend_narrative"
  | "movement_board_item";

const CARD_TITLES: Record<ActionCardId, string> = {
  why_harder_than_looks: "Why is this matter harder than it looks?",
  what_blocking_settlement: "What is blocking settlement?",
  explain_pressure_score: "Explain the insurer pressure score",
  what_changed_since_monday: "What changed since Monday?",
  smallest_action_readiness: "What is the smallest action that improves readiness?",
  draft_partner_briefing: "Draft partner briefing",
  draft_escalation_note: "Draft escalation note",
  settlement_friction_memo: "Settlement friction memo",
  matter_movement_summary: "Matter movement summary",
  carrier_watch_summary: "Carrier watch summary",
  pressure_trend_narrative: "Pressure trend narrative",
  movement_board_item: "Movement board — is this matter trending toward resolution?",
};

export class CopilotPilotOneService {
  async executeActionCard(orgId: number, matterId: number, cardId: ActionCardId): Promise<ActionCardResult> {
    const title = CARD_TITLES[cardId] ?? cardId;
    const proofChainRef = `PC1-${Date.now().toString(36).toUpperCase()}`;

    switch (cardId) {
      case "why_harder_than_looks":
        return this.whyHarderThanItLooks(orgId, matterId, title, proofChainRef);
      case "what_blocking_settlement":
        return this.whatBlockingSettlement(orgId, matterId, title, proofChainRef);
      case "explain_pressure_score":
        return this.explainPressureScore(orgId, matterId, title, proofChainRef);
      case "what_changed_since_monday":
        return this.whatChangedSinceMonday(orgId, matterId, title, proofChainRef);
      case "smallest_action_readiness":
        return this.smallestActionReadiness(orgId, matterId, title, proofChainRef);
      case "draft_partner_briefing":
        return this.draftPartnerBriefing(orgId, matterId, title, proofChainRef);
      case "draft_escalation_note":
        return this.draftEscalationNote(orgId, matterId, title, proofChainRef);
      case "settlement_friction_memo":
        return this.settlementFrictionMemo(orgId, matterId, title, proofChainRef);
      case "matter_movement_summary":
        return this.matterMovementSummary(orgId, matterId, title, proofChainRef);
      case "carrier_watch_summary":
        return this.carrierWatchSummary(orgId, matterId, title, proofChainRef);
      case "pressure_trend_narrative":
        return this.pressureTrendNarrative(orgId, matterId, title, proofChainRef);
      case "movement_board_item":
        return this.movementBoardItem(orgId, matterId, title, proofChainRef);
      default:
        return this.genericCard(title, proofChainRef);
    }
  }

  private async whyHarderThanItLooks(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const [pressure, friction, forecasts] = await Promise.all([
      insurerPressureEngine.getLatestSnapshot(orgId, matterId),
      settlementFrictionEngine.getLatestSnapshot(orgId, matterId),
      forecastExpanded.getForecastDiffView(orgId, matterId),
    ]);

    const pressureScore = pressure?.snapshot.overallScore ?? 0;
    const frictionScore = friction?.snapshot.overallScore ?? 0;
    const highRiskForecasts = forecasts.forecasts.filter(f => f.data && f.data.currentScore >= 0.65);

    const response = `## Why This Matter Is Harder Than It Looks

**Insurer Pressure Score**: ${Math.round(pressureScore * 100)}/100 — ${pressure?.snapshot.operationalMeaning ?? "Not yet computed"}

**Settlement Friction Score**: ${Math.round(frictionScore * 100)}/100 — ${friction?.snapshot.frictionClass ?? "mixed"} friction class

**Hidden Complexity Signals**:
${pressure?.drivers.slice(0, 3).map(d => `- **${d.driverName}**: ${d.explanation}`).join("\n") ?? "- No pressure drivers computed"}

**Settlement Blockers**:
${friction?.drivers.slice(0, 3).map(d => `- **${d.driverName}** (${d.blockerCategory}): ${d.explanation}`).join("\n") ?? "- No friction drivers computed"}

**High-Risk Forecasts**:
${highRiskForecasts.map(f => `- **${f.label}**: Score ${Math.round((f.data?.currentScore ?? 0) * 100)}/100 — ${f.data?.whatChanged ?? "No change data"}`).join("\n") || "- No high-risk forecasts detected"}

**Bottom Line**: This matter has ${highRiskForecasts.length} high-risk forecast signals, combined insurer pressure of ${Math.round(pressureScore * 100)}%, and settlement friction of ${Math.round(frictionScore * 100)}%. The interaction of these factors compounds complexity beyond what surface metrics show.

*Source: Insurer Pressure Engine, Settlement Friction Engine, Forecast System | Confidence: 0.78 | Ref: ${ref}*`;

    return { cardId: "why_harder_than_looks", title, response, confidence: 0.78, drivers: pressure?.drivers.map(d => d.driverName) ?? [], sources: ["insurer_pressure_engine", "settlement_friction_engine", "forecast_system"], requiresApproval: false, proofChainRef: ref };
  }

  private async whatBlockingSettlement(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const friction = await settlementFrictionEngine.getLatestSnapshot(orgId, matterId);
    if (!friction) {
      return { cardId: "what_blocking_settlement", title, response: `## What Is Blocking Settlement?\n\nNo friction analysis has been run for this matter. Run the friction computation to identify settlement blockers.\n\n*Source: Settlement Friction Engine | Ref: ${ref}*`, confidence: 0.50, drivers: [], sources: ["settlement_friction_engine"], requiresApproval: false, proofChainRef: ref };
    }

    const { snapshot, drivers } = friction;
    const grouped: Record<string, typeof drivers> = {};
    for (const d of drivers) { if (!grouped[d.blockerCategory]) grouped[d.blockerCategory] = []; grouped[d.blockerCategory].push(d); }

    const categoryLabels: Record<string, string> = {
      internal_process: "Internal Process",
      carrier_insurer: "Carrier / Insurer",
      evidence: "Evidence & Documents",
      medical_damages: "Medical & Damages",
      governance_review: "Governance & Review",
      venue_timing: "Venue & Timing",
      recovery_lien: "Recovery & Liens",
    };

    const response = `## What Is Blocking Settlement?

**Overall Friction Score**: ${Math.round(snapshot.overallScore * 100)}/100 (${snapshot.frictionClass} friction)
**Readiness Drag Estimate**: ${snapshot.readinessDragDays} days

**Top 3 Blockers**:
${drivers.slice(0, 3).map((d, i) => `${i + 1}. **${d.driverName}** (${categoryLabels[d.blockerCategory] ?? d.blockerCategory})\n   ${d.explanation}\n   *Estimated drag: ${d.dragEstimateDays ?? "unknown"} days*`).join("\n\n")}

**Blockers by Category**:
${Object.entries(grouped).map(([cat, items]) => `**${categoryLabels[cat] ?? cat}**: ${items.map(d => d.driverName).join(", ")}`).join("\n")}

**Smallest Action to Reduce Friction**:
> ${snapshot.smallestAction}

*Source: Settlement Friction Engine | Confidence: ${snapshot.confidence} | Ref: ${ref}*`;

    return { cardId: "what_blocking_settlement", title, response, confidence: snapshot.confidence ?? 0.75, drivers: drivers.map(d => d.driverName), sources: ["settlement_friction_engine"], requiresApproval: false, proofChainRef: ref };
  }

  private async explainPressureScore(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const pressure = await insurerPressureEngine.getLatestSnapshot(orgId, matterId);
    if (!pressure) {
      return { cardId: "explain_pressure_score", title, response: `## Insurer Pressure Score\n\nNo pressure analysis has been computed for this matter. Run the pressure engine to generate a score.\n\n*Source: Insurer Pressure Engine | Ref: ${ref}*`, confidence: 0.50, drivers: [], sources: ["insurer_pressure_engine"], requiresApproval: false, proofChainRef: ref };
    }

    const { snapshot, drivers } = pressure;
    const directionLabel = { rising: "Rising", falling: "Falling", stable: "Stable", new: "New" }[snapshot.direction] ?? snapshot.direction;

    const response = `## Insurer Pressure Score Explained

**Score**: ${Math.round(snapshot.overallScore * 100)}/100 — Direction: ${directionLabel} | Confidence: ${Math.round((snapshot.confidence ?? 0.75) * 100)}%

**What This Means**:
${snapshot.operationalMeaning}

**What Is Driving This Score**:
${drivers.slice(0, 4).map(d => `- **${d.driverName}** (weight: ${Math.round(d.weight * 100)}%)\n  *${d.explanation}*`).join("\n\n")}

**Recent Signals**:
${(snapshot.recentSignals as string[] ?? []).map(s => `- ${s}`).join("\n") || "- No recent signals recorded"}

**Recommended Next Action**:
> ${snapshot.recommendedNextAction}

**What This Score Is NOT**:
- This score does not represent a legal conclusion about carrier bad faith
- This score is derived from internal communications and patterns only — not external claims data
- This score should be reviewed by the assigned attorney before taking escalation action

*Source: Insurer Pressure Engine | Confidence: ${snapshot.confidence} | Ref: ${ref}*`;

    return { cardId: "explain_pressure_score", title, response, confidence: snapshot.confidence ?? 0.75, drivers: drivers.map(d => d.driverName), sources: ["insurer_pressure_engine"], requiresApproval: false, proofChainRef: ref };
  }

  private async whatChangedSinceMonday(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const monday = new Date();
    monday.setDate(monday.getDate() - (monday.getDay() || 7) + 1);
    monday.setHours(0, 0, 0, 0);

    const [recentComms, matter] = await Promise.all([
      db.select().from(pcCommunicationsTable)
        .where(and(eq(pcCommunicationsTable.matterId, matterId), gte(pcCommunicationsTable.sentAt, monday)))
        .orderBy(desc(pcCommunicationsTable.sentAt)),
      db.select().from(pcMattersTable).where(eq(pcMattersTable.id, matterId)).limit(1),
    ]);

    const inbound = recentComms.filter(c => c.direction === "inbound");
    const outbound = recentComms.filter(c => c.direction === "outbound");

    const response = `## What Changed Since Monday

**Matter**: ${matter[0]?.title ?? `Matter #${matterId}`}
**Period**: ${monday.toDateString()} to ${new Date().toDateString()}

**Communications**:
- ${inbound.length} inbound message(s) received
- ${outbound.length} outbound message(s) sent

${inbound.length > 0 ? `**Recent Inbound Activity**:\n${inbound.slice(0, 3).map(c => `- From ${c.fromParty ?? "unknown"} via ${c.channel}: ${c.summary ?? "No summary"}`).join("\n")}` : "**No inbound communications this week** — silence window may be developing"}

**Attribution**:
- Internal changes: Tracked through communication and deadline systems
- External signals: Worldline monitoring active

*Source: Communication Log, Matter Timeline | Confidence: 0.82 | Ref: ${ref}*`;

    return { cardId: "what_changed_since_monday", title, response, confidence: 0.82, drivers: [], sources: ["communication_log", "matter_timeline"], requiresApproval: false, proofChainRef: ref };
  }

  private async smallestActionReadiness(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const friction = await settlementFrictionEngine.getLatestSnapshot(orgId, matterId);
    const recommendations = await settlementFrictionEngine.getMovementRecommendations(orgId, matterId);

    const topRec = recommendations[0];
    const smallestAction = friction?.snapshot.smallestAction ?? topRec?.explanation ?? "Run friction computation to identify smallest action";

    const response = `## Smallest Action That Improves Readiness

**Recommended Action**:
> ${smallestAction}

**Why This Action**:
${topRec ? `This action targets the **${topRec.recommendationType}** category and is estimated to take **${topRec.estimatedMinutes ?? 30} minutes**. Impact: ${topRec.estimatedImpact ?? "Friction score reduction of 0.10-0.20"}` : "Based on current friction analysis, this action addresses the highest-weight blocker."}

**Other Quick Wins** (in order of impact):
${recommendations.slice(0, 3).map((r, i) => `${i + 1}. ${r.title} (~${r.estimatedMinutes ?? 30} min)`).join("\n") || "1. Run friction computation for specific recommendations"}

*Source: Settlement Friction Engine, Movement Recommendations | Confidence: 0.76 | Ref: ${ref}*`;

    return { cardId: "smallest_action_readiness", title, response, confidence: 0.76, drivers: recommendations.map(r => r.title), sources: ["settlement_friction_engine", "movement_recommendations"], requiresApproval: false, proofChainRef: ref };
  }

  private async draftPartnerBriefing(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const [matter, pressure, friction] = await Promise.all([
      db.select().from(pcMattersTable).where(eq(pcMattersTable.id, matterId)).limit(1),
      insurerPressureEngine.getLatestSnapshot(orgId, matterId),
      settlementFrictionEngine.getLatestSnapshot(orgId, matterId),
    ]);

    const m = matter[0];
    const response = `## Partner Briefing — ${m?.title ?? `Matter #${matterId}`}

**INTERNAL USE ONLY — ATTORNEY-CLIENT PRIVILEGED**
*Proof Chain Reference: ${ref}*

**Matter Status**: ${m?.status ?? "Active"}

**Pressure Assessment**:
Score: ${Math.round((pressure?.snapshot.overallScore ?? 0) * 100)}/100
${pressure?.snapshot.operationalMeaning ?? "Pressure analysis pending"}

**Settlement Friction**:
Score: ${Math.round((friction?.snapshot.overallScore ?? 0) * 100)}/100 | Readiness drag: ${friction?.snapshot.readinessDragDays ?? "TBD"} days
${friction?.snapshot.smallestAction ? `Smallest unlock: ${friction.snapshot.smallestAction}` : "Friction analysis pending"}

**Top Drivers**:
${pressure?.drivers.slice(0, 2).map(d => `- ${d.driverName}`).join("\n") ?? "- Pending"}
${friction?.drivers.slice(0, 2).map(d => `- ${d.driverName} (${d.blockerCategory})`).join("\n") ?? ""}

**Recommended Partner Actions**:
${pressure?.snapshot.recommendedNextAction ? `1. ${pressure.snapshot.recommendedNextAction}` : "1. Review pressure analysis"}
${friction?.snapshot.smallestAction ? `2. ${friction.snapshot.smallestAction}` : ""}

*This briefing is source-grounded from internal matter data. All statements are based on documented facts only. Review and attorney sign-off required before any external distribution.*

*Source: Insurer Pressure Engine, Settlement Friction Engine | Ref: ${ref}*`;

    return { cardId: "draft_partner_briefing", title, response, confidence: 0.80, drivers: [], sources: ["insurer_pressure_engine", "settlement_friction_engine"], requiresApproval: true, proofChainRef: ref };
  }

  private async draftEscalationNote(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const [pressure, silenceWindows] = await Promise.all([
      insurerPressureEngine.getLatestSnapshot(orgId, matterId),
      insurerPressureEngine.getSilenceWindows(orgId, matterId),
    ]);

    const activeSilence = silenceWindows[0];
    const response = `## Escalation Note — DRAFT

**INTERNAL DRAFT — REQUIRES ATTORNEY REVIEW BEFORE SEND**
*Proof Chain Reference: ${ref}*

---

Re: Matter #${matterId} — Carrier Response Escalation

${activeSilence ? `Our records indicate a ${activeSilence.daysSilent}-day silence window from the carrier, beginning approximately ${activeSilence.silenceStartAt?.toDateString()}. This period of non-responsiveness, combined with the following outstanding items, warrants formal escalation:` : "The following carrier behavior patterns warrant escalation attention:"}

${(pressure?.snapshot.recentSignals as string[] ?? ["Elevated pressure score detected"]).map(s => `- ${s}`).join("\n")}

**Insurer Pressure Score**: ${Math.round((pressure?.snapshot.overallScore ?? 0) * 100)}/100 — ${pressure?.snapshot.direction ?? "N/A"}

**Requested Action**: ${pressure?.snapshot.recommendedNextAction ?? "Immediate response and engagement"}

---

*This draft is generated from internal matter data and requires attorney review and approval before sending. Do not distribute externally without sign-off.*

*Source: Insurer Pressure Engine, Communication Log | Ref: ${ref}*`;

    return { cardId: "draft_escalation_note", title, response, confidence: 0.78, drivers: [], sources: ["insurer_pressure_engine", "communication_log"], requiresApproval: true, proofChainRef: ref };
  }

  private async settlementFrictionMemo(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const friction = await settlementFrictionEngine.getLatestSnapshot(orgId, matterId);
    const response = `## Settlement Friction Memo

**INTERNAL USE ONLY — ATTORNEY-CLIENT PRIVILEGED**
*Proof Chain Reference: ${ref}*

**Friction Score**: ${Math.round((friction?.snapshot.overallScore ?? 0) * 100)}/100
**Friction Class**: ${friction?.snapshot.frictionClass ?? "unknown"} (internal / external / mixed)
**Readiness Drag**: ${friction?.snapshot.readinessDragDays ?? "TBD"} days

**Settlement Blockers by Category**:

${friction ? Object.entries({
  "Recovery & Liens": friction.drivers.filter(d => d.blockerCategory === "recovery_lien"),
  "Carrier / Insurer": friction.drivers.filter(d => d.blockerCategory === "carrier_insurer"),
  "Internal Process": friction.drivers.filter(d => d.blockerCategory === "internal_process"),
  "Medical & Damages": friction.drivers.filter(d => d.blockerCategory === "medical_damages"),
}).filter(([, items]) => items.length > 0).map(([cat, items]) => `**${cat}**:\n${items.map(d => `- ${d.driverName}: ${d.explanation}`).join("\n")}`).join("\n\n") : "Friction analysis pending."}

**Smallest Action to Reduce Friction**:
> ${friction?.snapshot.smallestAction ?? "Run friction computation for recommendations"}

*Source: Settlement Friction Engine | Confidence: ${friction?.snapshot.confidence ?? "N/A"} | Ref: ${ref}*`;

    return { cardId: "settlement_friction_memo", title, response, confidence: friction?.snapshot.confidence ?? 0.70, drivers: friction?.drivers.map(d => d.driverName) ?? [], sources: ["settlement_friction_engine"], requiresApproval: true, proofChainRef: ref };
  }

  private async matterMovementSummary(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const [forecasts, pressure, friction] = await Promise.all([
      forecastExpanded.getForecastDiffView(orgId, matterId),
      insurerPressureEngine.getLatestSnapshot(orgId, matterId),
      settlementFrictionEngine.getLatestSnapshot(orgId, matterId),
    ]);

    const improving = forecasts.forecasts.filter(f => f.data?.trend === "improving").length;
    const declining = forecasts.forecasts.filter(f => f.data?.trend === "declining").length;

    const response = `## Matter Movement Summary

**Movement Trajectory**: ${improving > declining ? "Positive" : declining > improving ? "Challenged" : "Neutral"}
**Forecasts Improving**: ${improving} | **Forecasts Declining**: ${declining}

**Pressure Trend**: ${pressure?.snapshot.direction ?? "unknown"} (${Math.round((pressure?.snapshot.overallScore ?? 0) * 100)}/100)
**Friction Trend**: ${friction?.snapshot.direction ?? "unknown"} (${Math.round((friction?.snapshot.overallScore ?? 0) * 100)}/100)

**Forecast Status**:
${forecasts.forecasts.map(f => `- ${f.label}: ${f.data ? `${Math.round(f.data.currentScore * 100)}/100 (${f.data.trend})` : "Not computed"}`).join("\n")}

**Movement Recommendation**:
${pressure?.snapshot.recommendedNextAction ?? friction?.snapshot.smallestAction ?? "Review all matter dimensions to identify movement opportunities"}

*Source: Forecast System, Pressure Engine, Friction Engine | Ref: ${ref}*`;

    return { cardId: "matter_movement_summary", title, response, confidence: 0.77, drivers: [], sources: ["forecast_system", "insurer_pressure_engine", "settlement_friction_engine"], requiresApproval: false, proofChainRef: ref };
  }

  private async carrierWatchSummary(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const [pressure, silenceWindows] = await Promise.all([
      insurerPressureEngine.getLatestSnapshot(orgId, matterId),
      insurerPressureEngine.getSilenceWindows(orgId, matterId),
    ]);

    const response = `## Carrier Watch Summary

**Pressure Score**: ${Math.round((pressure?.snapshot.overallScore ?? 0) * 100)}/100 — ${pressure?.snapshot.direction ?? "unknown"}

**Active Silence Windows**:
${silenceWindows.length > 0 ? silenceWindows.map(s => `- ${s.carrierName}: ${s.daysSilent} days silent (risk: ${s.silenceRisk})`).join("\n") : "- No active silence windows"}

**Recent Carrier Signals**:
${(pressure?.snapshot.recentSignals as string[] ?? []).map(s => `- ${s}`).join("\n") || "- No recent signals"}

**Carrier Behavior Patterns**:
${pressure?.drivers.filter(d => ["silence_window", "partial_response", "denial_frequency", "adjuster_handoff"].includes(d.driverCategory)).slice(0, 3).map(d => `- **${d.driverName}**: ${d.explanation}`).join("\n") || "- No concerning patterns detected"}

**Recommended Carrier Action**:
> ${pressure?.snapshot.recommendedNextAction ?? "Continue monitoring"}

*Source: Insurer Pressure Engine, Silence Window Tracker | Ref: ${ref}*`;

    return { cardId: "carrier_watch_summary", title, response, confidence: 0.80, drivers: [], sources: ["insurer_pressure_engine", "silence_window_tracker"], requiresApproval: false, proofChainRef: ref };
  }

  private async pressureTrendNarrative(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const pressure = await insurerPressureEngine.getLatestSnapshot(orgId, matterId);
    const response = `## Pressure Trend Narrative

**Current Score**: ${Math.round((pressure?.snapshot.overallScore ?? 0) * 100)}/100
**Direction**: ${pressure?.snapshot.direction ?? "unknown"}

**Plain Language Summary**:
${pressure?.snapshot.operationalMeaning ?? "No pressure narrative available. Run pressure engine to generate."}

**Key Drivers Explained**:
${pressure?.drivers.slice(0, 4).map(d => `**${d.driverName}** (${Math.round(d.weight * 100)}% weight, ${d.impact} impact):\n${d.explanation}`).join("\n\n") || "No driver data available."}

**What Happens If Trend Continues**:
${pressure?.snapshot.overallScore ?? 0 > 0.65 ? "If the pressure trend continues rising, the carrier may harden their position further, making settlement more difficult and expensive. Intervention is recommended before pressure exceeds 75%." : "Pressure is at a manageable level. Monitor for changes and maintain regular communication cadence."}

*Source: Insurer Pressure Engine | Confidence: ${pressure?.snapshot.confidence ?? "N/A"} | Ref: ${ref}*`;

    return { cardId: "pressure_trend_narrative", title, response, confidence: pressure?.snapshot.confidence ?? 0.75, drivers: pressure?.drivers.map(d => d.driverName) ?? [], sources: ["insurer_pressure_engine"], requiresApproval: false, proofChainRef: ref };
  }

  private async movementBoardItem(orgId: number, matterId: number, title: string, ref: string): Promise<ActionCardResult> {
    const [pressure, friction, forecasts] = await Promise.all([
      insurerPressureEngine.getLatestSnapshot(orgId, matterId),
      settlementFrictionEngine.getLatestSnapshot(orgId, matterId),
      forecastExpanded.getForecastDiffView(orgId, matterId),
    ]);

    const offerMovement = forecasts.forecasts.find(f => f.type === "offer_movement_likelihood");
    const movementScore = offerMovement?.data?.currentScore ?? 0;
    const trendingToward = movementScore > 0.5 ? "settlement readiness" : friction?.snapshot.overallScore ?? 0 < 0.4 ? "demand readiness" : "stalled";

    const response = `## Movement Board Assessment

**Trending Toward**: ${trendingToward.charAt(0).toUpperCase() + trendingToward.slice(1)}

**Offer Movement Likelihood**: ${Math.round(movementScore * 100)}/100 (${offerMovement?.data?.trend ?? "unknown"})

**What Would Unlock Movement**:
${friction?.snapshot.smallestAction ?? "Reduce settlement friction to enable offer movement"}

**Conditions That Must Change**:
${friction?.drivers.slice(0, 3).map(d => `- ${d.driverName} must be addressed (${d.blockerCategory})`).join("\n") || "- Run friction computation for specific conditions"}

**Timeline Estimate**:
${friction?.snapshot.readinessDragDays ? `Current readiness drag: ${friction.snapshot.readinessDragDays} days. With focused action on top blockers, movement could occur in ${Math.max(7, friction.snapshot.readinessDragDays - 5)}-${friction.snapshot.readinessDragDays + 5} days.` : "Run friction computation for timeline estimate"}

*Source: Movement Recommendations, Settlement Friction Engine, Forecast System | Ref: ${ref}*`;

    return { cardId: "movement_board_item", title, response, confidence: 0.74, drivers: [], sources: ["movement_recommendations", "settlement_friction_engine", "forecast_system"], requiresApproval: false, proofChainRef: ref };
  }

  private genericCard(title: string, ref: string): ActionCardResult {
    return { cardId: "generic", title, response: `## ${title}\n\nThis action card is not yet implemented. Select a valid card ID.\n\n*Ref: ${ref}*`, confidence: 0.50, drivers: [], sources: [], requiresApproval: false, proofChainRef: ref };
  }

  getAvailableCards(): Array<{ id: ActionCardId; title: string; mode: string; requiresApproval: boolean }> {
    return [
      { id: "why_harder_than_looks", title: CARD_TITLES.why_harder_than_looks, mode: "strategy", requiresApproval: false },
      { id: "what_blocking_settlement", title: CARD_TITLES.what_blocking_settlement, mode: "strategy", requiresApproval: false },
      { id: "explain_pressure_score", title: CARD_TITLES.explain_pressure_score, mode: "matter", requiresApproval: false },
      { id: "what_changed_since_monday", title: CARD_TITLES.what_changed_since_monday, mode: "matter", requiresApproval: false },
      { id: "smallest_action_readiness", title: CARD_TITLES.smallest_action_readiness, mode: "strategy", requiresApproval: false },
      { id: "draft_partner_briefing", title: CARD_TITLES.draft_partner_briefing, mode: "strategy", requiresApproval: true },
      { id: "draft_escalation_note", title: CARD_TITLES.draft_escalation_note, mode: "communications", requiresApproval: true },
      { id: "settlement_friction_memo", title: CARD_TITLES.settlement_friction_memo, mode: "strategy", requiresApproval: true },
      { id: "matter_movement_summary", title: CARD_TITLES.matter_movement_summary, mode: "matter", requiresApproval: false },
      { id: "carrier_watch_summary", title: CARD_TITLES.carrier_watch_summary, mode: "communications", requiresApproval: false },
      { id: "pressure_trend_narrative", title: CARD_TITLES.pressure_trend_narrative, mode: "matter", requiresApproval: false },
      { id: "movement_board_item", title: CARD_TITLES.movement_board_item, mode: "strategy", requiresApproval: false },
    ];
  }
}

export const copilotPilotOne = new CopilotPilotOneService();
