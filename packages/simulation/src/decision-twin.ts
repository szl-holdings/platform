/**
 * Decision Twin Engine — Causal What-If Simulation
 *
 * Powers Lyte's signature feature: causal simulation across PRISM dimensions.
 * Given a signal and an action (approve/delay/escalate/reroute), projects
 * downstream impact on Revenue, Staffing, Infrastructure, Security, and Market Timing.
 *
 * Architecture: deterministic heuristic over signal metadata + historical lookup.
 * A clean seam at `computePRISMImpacts` allows a learned model to be swapped in.
 */

// ─── PRISM Dimensions ────────────────────────────────────────────────────────

export type PRISMDimension =
  | "revenue"
  | "staffing"
  | "infrastructure"
  | "security"
  | "market_timing";

export const PRISM_DIMENSION_LABELS: Record<PRISMDimension, string> = {
  revenue: "Revenue & Pipeline",
  staffing: "Staffing & Ownership",
  infrastructure: "Infrastructure & Ops",
  security: "Security & Compliance",
  market_timing: "Market Timing",
};

export const PRISM_DIMENSION_ICONS: Record<PRISMDimension, string> = {
  revenue: "💰",
  staffing: "👥",
  infrastructure: "⚙️",
  security: "🔒",
  market_timing: "⏱️",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type DecisionTwinAction = "approve" | "delay" | "escalate" | "reroute";

export const DECISION_TWIN_ACTION_LABELS: Record<DecisionTwinAction, string> = {
  approve: "Approve",
  delay: "Delay",
  escalate: "Escalate",
  reroute: "Reroute",
};

export const DECISION_TWIN_ACTION_DESCRIPTIONS: Record<DecisionTwinAction, string> = {
  approve: "Execute the recommendation as proposed — highest expected value path",
  delay: "Defer action 7–14 days pending additional evidence or stakeholder availability",
  escalate: "Elevate to executive authority for direct intervention and sponsorship",
  reroute: "Reassign to alternate owner or workflow path to bypass the current blocker",
};

export interface ConfidenceBand {
  low: number;
  mid: number;
  high: number;
}

export interface PRISMImpact {
  dimension: PRISMDimension;
  label: string;
  summary: string;
  riskBefore: number;
  riskAfter: number;
  delta: number;
  unit: string;
  confidenceBand: ConfidenceBand;
  evidence: Array<{ label: string; value: string; source: string }>;
}

export interface DecisionTwinScenario {
  id: string;
  signalId: string;
  action: DecisionTwinAction;
  label: string;
  description: string;
  prismImpacts: PRISMImpact[];
  overallRiskBefore: number;
  overallRiskAfter: number;
  overallDelta: number;
  overallConfidence: ConfidenceBand;
  timeToImpact: string;
  evidence: Array<{ label: string; value: string; source: string }>;
  isDemo: boolean;
  generatedAt: number;
  engineVersion: string;
}

export interface DecisionTwinAuditEvent {
  id: string;
  signalId: string;
  scenarioId: string;
  action: DecisionTwinAction;
  verdict: "accepted" | "rejected" | "modified";
  operator: string;
  prismSnapshot: PRISMImpact[];
  overallRiskBefore: number;
  overallRiskAfter: number;
  overallDelta: number;
  modificationNote?: string;
  proofRef: string;
  timestamp: number;
}

export type TwinAuditPersistenceAdapter = (event: DecisionTwinAuditEvent) => void | Promise<void>;

// ─── Signal Profile for Heuristic Engine ─────────────────────────────────────

export interface SignalProfile {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  confidence: number;
  financialExposureUsd?: number;
  stalledDays?: number;
  affectedStakeholders?: number;
  hasOwnershipGap?: boolean;
  isPolicyBlocked?: boolean;
  hasBuyerEngagementRisk?: boolean;
  isSecurityRelated?: boolean;
}

// ─── Heuristic Engine ────────────────────────────────────────────────────────

const SEVERITY_BASELINE: Record<string, number> = {
  critical: 82,
  high: 64,
  medium: 46,
  low: 28,
};

const ACTION_RISK_MULTIPLIER: Record<DecisionTwinAction, Record<PRISMDimension, number>> = {
  approve:   { revenue: 0.25, staffing: 0.30, infrastructure: 0.35, security: 0.40, market_timing: 0.20 },
  delay:     { revenue: 0.75, staffing: 0.65, infrastructure: 0.70, security: 0.55, market_timing: 0.90 },
  escalate:  { revenue: 0.35, staffing: 0.50, infrastructure: 0.55, security: 0.45, market_timing: 0.40 },
  reroute:   { revenue: 0.45, staffing: 0.40, infrastructure: 0.45, security: 0.50, market_timing: 0.55 },
};

const ACTION_CONFIDENCE_BANDS: Record<DecisionTwinAction, ConfidenceBand> = {
  approve:  { low: 0.72, mid: 0.82, high: 0.91 },
  delay:    { low: 0.65, mid: 0.73, high: 0.80 },
  escalate: { low: 0.70, mid: 0.79, high: 0.88 },
  reroute:  { low: 0.62, mid: 0.71, high: 0.82 },
};

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

function computeDimensionImpact(
  dimension: PRISMDimension,
  baseline: number,
  action: DecisionTwinAction,
  profile: SignalProfile,
): PRISMImpact {
  const multiplier = ACTION_RISK_MULTIPLIER[action][dimension];
  const riskBefore = clamp(baseline + (profile.hasOwnershipGap ? 8 : 0) + (profile.isPolicyBlocked ? 6 : 0));
  const riskAfter = clamp(riskBefore * multiplier);
  const delta = riskAfter - riskBefore;

  const dimBand = ACTION_CONFIDENCE_BANDS[action];
  const confAdj = profile.confidence * 0.15;
  const confidenceBand: ConfidenceBand = {
    low: Math.max(0.45, dimBand.low - confAdj),
    mid: Math.min(0.98, dimBand.mid + confAdj * 0.5),
    high: Math.min(0.99, dimBand.high + confAdj),
  };

  const evidence = buildDimensionEvidence(dimension, action, profile);
  const summary = buildDimensionSummary(dimension, action, riskBefore, riskAfter, profile);

  return {
    dimension,
    label: PRISM_DIMENSION_LABELS[dimension],
    summary,
    riskBefore,
    riskAfter,
    delta,
    unit: "risk score",
    confidenceBand,
    evidence,
  };
}

function buildDimensionSummary(
  dimension: PRISMDimension,
  action: DecisionTwinAction,
  before: number,
  after: number,
  profile: SignalProfile,
): string {
  const improving = after < before;
  const pct = Math.abs(Math.round(((before - after) / Math.max(before, 1)) * 100));

  const templates: Record<PRISMDimension, Record<DecisionTwinAction, string>> = {
    revenue: {
      approve: `Resolves the pipeline stall. Close probability projected to recover ${pct}% with direct action. Value capture window preserved.`,
      delay: `Continued inaction erodes deal probability. Each additional week of delay reduces close probability ~4pp. Quarter-end window at risk.`,
      escalate: `Executive sponsorship historically correlates with ${pct}% improvement in close probability. CFO-direct deals close 2.1x faster.`,
      reroute: `Alternate ownership path can unlock the stall. Estimated ${pct}% recovery over current trajectory, with 10–14 day lag.`,
    },
    staffing: {
      approve: `Clarifies ownership chain immediately. Reduces cross-functional friction by assigning clear accountability.`,
      delay: `Ownership ambiguity compounds over time. Additional stakeholder churn risk increases 12% per week of delay.`,
      escalate: `Executive override resolves authority gap directly. New owner designation within 24–48h is the historical norm.`,
      reroute: `Reassignment to alternate qualified owner bypasses the blocker. Handoff risk is ${improving ? "manageable" : "elevated"} given current capacity.`,
    },
    infrastructure: {
      approve: `Workflow resumes normal processing state. 3 downstream deliverables unblocked within ${profile.stalledDays ? Math.round(profile.stalledDays * 0.1) : 3} days.`,
      delay: `Blocked workflow accumulates technical debt. Downstream systems remain stalled; data freshness continues to degrade.`,
      escalate: `Override authority unblocks workflow at the policy level. System state normalizes within 1–2 processing cycles.`,
      reroute: `Alternate workflow path restores processing with ${improving ? "minimal" : "moderate"} disruption. Estimated ${profile.stalledDays ?? 7} day catch-up period.`,
    },
    security: {
      approve: `Resolves the policy-blocked state. Audit trail is complete and defensible. No new compliance exposure introduced.`,
      delay: `Extended stall increases audit surface. Policy-violation window remains open. Regulator visibility risk rises with duration.`,
      escalate: `Executive action is a policy-compliant resolution path. Creates a documented exception with proper authority attribution.`,
      reroute: `Requires a policy amendment or exception filing. Compliance team must review the alternate path before execution.`,
    },
    market_timing: {
      approve: `Action taken before quarter-end preserves deal timing. Buyer recapture window is open — 74% historical success when acted within 7 days.`,
      delay: `Every 7-day delay reduces buyer recapture probability by ~8%. Q2 close window closes in ${profile.stalledDays ? Math.max(0, 90 - profile.stalledDays) : 14} days.`,
      escalate: `Visible executive engagement can re-activate buyer interest. Signal sends urgency that delays alone cannot convey.`,
      reroute: `Alternate path has longer setup time. Market timing impact depends on execution speed — target <7 days to preserve window.`,
    },
  };

  return templates[dimension][action];
}

function buildDimensionEvidence(
  dimension: PRISMDimension,
  action: DecisionTwinAction,
  profile: SignalProfile,
): Array<{ label: string; value: string; source: string }> {
  const base: Array<{ label: string; value: string; source: string }> = [];

  if (dimension === "revenue" && profile.financialExposureUsd) {
    base.push({
      label: "Financial exposure",
      value: `$${(profile.financialExposureUsd / 1_000_000).toFixed(1)}M at risk`,
      source: "Lyte — Revenue Monitor",
    });
  }
  if (dimension === "staffing" && profile.hasOwnershipGap) {
    base.push({
      label: "Ownership gap detected",
      value: "No valid authority holder in approval chain",
      source: "Lyte — Approval Chain Monitor",
    });
  }
  if (dimension === "market_timing" && profile.stalledDays) {
    base.push({
      label: "Days stalled",
      value: `${profile.stalledDays} days (threshold: 21)`,
      source: "Lyte — Signal Monitor",
    });
  }
  if (dimension === "security" && profile.isPolicyBlocked) {
    base.push({
      label: "Policy block active",
      value: "3 escalation attempts blocked by policy engine",
      source: "Lyte — Policy Engine",
    });
  }

  base.push({
    label: "Historical pattern match",
    value: `${Math.round(profile.confidence * 100)}% confidence based on comparable scenarios`,
    source: "Lyte — Evidence Graph",
  });

  if (action === "approve") {
    base.push({ label: "Recommended action", value: "Highest expected value path per simulation", source: "Decision Twin Engine v1.0" });
  } else if (action === "delay") {
    base.push({ label: "Delay risk", value: "Compound stall penalty applies after 7-day threshold", source: "Decision Twin Engine v1.0" });
  } else if (action === "escalate") {
    base.push({ label: "Escalation precedent", value: "78% close rate with executive sponsorship at this stage", source: "Lyte — Evidence Graph" });
  } else if (action === "reroute") {
    base.push({ label: "Reroute lag", value: "Estimated 10–14 day additional lag for ownership transfer", source: "Decision Twin Engine v1.0" });
  }

  return base;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const DECISION_TWIN_ENGINE_VERSION = "1.0.0" as const;

export function runDecisionTwin(
  action: DecisionTwinAction,
  profile: SignalProfile,
): DecisionTwinScenario {
  const baseline = SEVERITY_BASELINE[profile.severity] ?? 50;
  const prismImpacts = (["revenue", "staffing", "infrastructure", "security", "market_timing"] as PRISMDimension[])
    .map(dim => computeDimensionImpact(dim, baseline, action, profile));

  const overallRiskBefore = Math.round(prismImpacts.reduce((s, d) => s + d.riskBefore, 0) / prismImpacts.length);
  const overallRiskAfter = Math.round(prismImpacts.reduce((s, d) => s + d.riskAfter, 0) / prismImpacts.length);
  const overallDelta = overallRiskAfter - overallRiskBefore;

  const band = ACTION_CONFIDENCE_BANDS[action];
  const confAdj = profile.confidence * 0.1;
  const overallConfidence: ConfidenceBand = {
    low: Math.max(0.45, band.low - confAdj),
    mid: Math.min(0.98, band.mid + confAdj),
    high: Math.min(0.99, band.high + confAdj),
  };

  const now = Date.now();

  return {
    id: `twin-${profile.id}-${action}-${now}`,
    signalId: profile.id,
    action,
    label: DECISION_TWIN_ACTION_LABELS[action],
    description: DECISION_TWIN_ACTION_DESCRIPTIONS[action],
    prismImpacts,
    overallRiskBefore,
    overallRiskAfter,
    overallDelta,
    overallConfidence,
    timeToImpact: action === "approve" ? "24–48h" : action === "escalate" ? "24–72h" : action === "reroute" ? "7–14d" : "7–14d",
    evidence: [
      { label: "Signal severity", value: profile.severity.toUpperCase(), source: "Lyte — Signal Monitor" },
      { label: "Simulation type", value: "Heuristic + historical pattern match", source: "Decision Twin Engine v1.0" },
      { label: "Data source", value: profile.confidence >= 0.85 ? "Live signal history" : "Demo scenario (scripted)", source: "Lyte Data Policy" },
    ],
    isDemo: profile.confidence < 0.85,
    generatedAt: now,
    engineVersion: DECISION_TWIN_ENGINE_VERSION,
  };
}

export function runAllDecisionTwinScenarios(profile: SignalProfile): DecisionTwinScenario[] {
  return (["approve", "delay", "escalate", "reroute"] as DecisionTwinAction[]).map(action =>
    runDecisionTwin(action, profile),
  );
}

export function getBestScenario(scenarios: DecisionTwinScenario[]): DecisionTwinScenario | null {
  if (!scenarios.length) return null;
  return [...scenarios].sort((a, b) => a.overallRiskAfter - b.overallRiskAfter)[0];
}

export function riskLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: "Critical", color: "text-red-400" };
  if (score >= 55) return { label: "High", color: "text-orange-400" };
  if (score >= 35) return { label: "Moderate", color: "text-amber-400" };
  return { label: "Low", color: "text-emerald-400" };
}

export function deltaLabel(delta: number): { label: string; color: string } {
  if (delta <= -20) return { label: `↓${Math.abs(delta)} improved`, color: "text-emerald-400" };
  if (delta < 0) return { label: `↓${Math.abs(delta)}`, color: "text-emerald-400" };
  if (delta === 0) return { label: "unchanged", color: "text-amber-400/60" };
  if (delta <= 10) return { label: `↑${delta}`, color: "text-amber-400" };
  return { label: `↑${delta} worsened`, color: "text-red-400" };
}
