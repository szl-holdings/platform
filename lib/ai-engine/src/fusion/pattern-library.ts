/**
 * Cross-Domain Pattern Library
 *
 * Stores, scores, and refines discovered correlation patterns.
 * Supports a self-learning feedback loop where human validation
 * tunes the pattern engine's sensitivity and confidence weights.
 */

export type PatternStatus = "active" | "degraded" | "suppressed" | "learning";
export type PatternCategory =
  | "litigation_financial"
  | "maritime_security"
  | "property_legal_financial"
  | "ownership_chain"
  | "geopolitical_cascade"
  | "supply_chain_stress"
  | "regulatory_exposure"
  | "cyber_maritime"
  | "custom";

export interface PatternFeedback {
  id: string;
  patternId: string;
  alertId: string;
  relevance: "confirmed" | "false_positive" | "partially_relevant";
  rating: number;
  notes?: string;
  reviewedBy?: string;
  reviewedAt: string;
}

export interface PatternEvidence {
  domain: string;
  signalType: string;
  weight: number;
  description: string;
}

export interface CorrelationPattern {
  id: string;
  name: string;
  description: string;
  category: PatternCategory;
  requiredDomains: string[];
  evidenceTypes: PatternEvidence[];
  status: PatternStatus;
  confidenceScore: number;
  baseConfidence: number;
  feedbackAdjustment: number;
  hitCount: number;
  falsePositiveCount: number;
  lastTriggeredAt: string | null;
  learnedAt: string;
  updatedAt: string;
  feedbackHistory: PatternFeedback[];
  exampleAlerts: string[];
  tags: string[];
}

const INITIAL_PATTERNS: Array<Omit<CorrelationPattern, "learnedAt" | "updatedAt" | "feedbackHistory" | "exampleAlerts">> = [
  {
    id: "pat-001",
    name: "Litigation-Financial Stress Cascade",
    description: "Active litigation in legal domain correlates with measurable financial stress indicators in portfolio holdings. When an entity appears in both PRISM Counsel and SZL/Terra, compounding risk emerges.",
    category: "litigation_financial",
    requiredDomains: ["prism-counsel", "szl-holdings"],
    evidenceTypes: [
      { domain: "prism-counsel", signalType: "active_matter", weight: 0.9, description: "Active litigation filing" },
      { domain: "szl-holdings", signalType: "financial_exposure", weight: 0.8, description: "Portfolio financial exposure" },
      { domain: "terra", signalType: "valuation_decline", weight: 0.7, description: "Property valuation decline" },
    ],
    status: "active",
    confidenceScore: 0.85,
    baseConfidence: 0.85,
    feedbackAdjustment: 0,
    hitCount: 0,
    falsePositiveCount: 0,
    lastTriggeredAt: null,
    tags: ["litigation", "financial", "legal", "cross-domain"],
  },
  {
    id: "pat-002",
    name: "Maritime-Security Threat Convergence",
    description: "Fleet vessels operating in corridors with active threat intelligence from Aegis SOC. AIS data and cyber threat IOCs converge on the same geographic or operational zone.",
    category: "maritime_security",
    requiredDomains: ["vessels", "firestorm"],
    evidenceTypes: [
      { domain: "vessels", signalType: "route_risk", weight: 0.95, description: "Vessel in high-risk corridor" },
      { domain: "firestorm", signalType: "threat_actor_ioc", weight: 0.88, description: "Active threat actor IOC in zone" },
    ],
    status: "active",
    confidenceScore: 0.92,
    baseConfidence: 0.92,
    feedbackAdjustment: 0,
    hitCount: 0,
    falsePositiveCount: 0,
    lastTriggeredAt: null,
    tags: ["maritime", "security", "apt", "vessel"],
  },
  {
    id: "pat-003",
    name: "Tri-Domain Property Risk Signal",
    description: "Real estate asset with simultaneous legal encumbrance (PRISM), financial stress (SZL Holdings), and market deterioration (Terra). Triple-domain convergence indicates systemic risk.",
    category: "property_legal_financial",
    requiredDomains: ["terra", "prism-counsel", "szl-holdings"],
    evidenceTypes: [
      { domain: "terra", signalType: "legal_encumbrance", weight: 0.85, description: "Title/zoning legal flag" },
      { domain: "prism-counsel", signalType: "active_matter", weight: 0.90, description: "Active legal matter" },
      { domain: "szl-holdings", signalType: "investment_risk", weight: 0.80, description: "Investment risk elevation" },
    ],
    status: "active",
    confidenceScore: 0.88,
    baseConfidence: 0.88,
    feedbackAdjustment: 0,
    hitCount: 0,
    falsePositiveCount: 0,
    lastTriggeredAt: null,
    tags: ["property", "legal", "financial", "tri-domain"],
  },
  {
    id: "pat-004",
    name: "Multi-Hop Beneficial Ownership Chain",
    description: "GraphRAG traversal discovers N-hop ownership chains that connect SZL operational entities to potentially obscured beneficial owners or sanctioned entities through shell company structures.",
    category: "ownership_chain",
    requiredDomains: ["szl-holdings", "vessels"],
    evidenceTypes: [
      { domain: "szl-holdings", signalType: "ownership_connection", weight: 0.75, description: "Ownership chain node" },
      { domain: "prism-counsel", signalType: "sanctions_flag", weight: 0.95, description: "Sanctions flag on terminal entity" },
    ],
    status: "active",
    confidenceScore: 0.78,
    baseConfidence: 0.78,
    feedbackAdjustment: 0,
    hitCount: 0,
    falsePositiveCount: 0,
    lastTriggeredAt: null,
    tags: ["ownership", "beneficial-owner", "sanctions", "kyc", "shell-company"],
  },
  {
    id: "pat-005",
    name: "Geopolitical Fuel-Rate-Default Cascade",
    description: "Rising fuel costs detected in vessels domain correlate with interest rate movements from financial intelligence, converging on elevated tenant default probability in Terra properties. 45-day cascade window.",
    category: "geopolitical_cascade",
    requiredDomains: ["vessels", "szl-holdings", "terra"],
    evidenceTypes: [
      { domain: "vessels", signalType: "fuel_cost_spike", weight: 0.80, description: "Bunker fuel cost increase >15%" },
      { domain: "szl-holdings", signalType: "rate_environment", weight: 0.75, description: "Rate hike pressure on portfolio" },
      { domain: "terra", signalType: "tenant_stress", weight: 0.70, description: "Tenant financial stress indicators" },
    ],
    status: "active",
    confidenceScore: 0.74,
    baseConfidence: 0.74,
    feedbackAdjustment: 0,
    hitCount: 0,
    falsePositiveCount: 0,
    lastTriggeredAt: null,
    tags: ["geopolitical", "cascade", "fuel", "rate", "tenant", "predictive"],
  },
  {
    id: "pat-006",
    name: "Cyber-Maritime Infrastructure Targeting",
    description: "Threat intelligence indicates APT targeting of maritime infrastructure. Fleet vessels may be targets of SCADA/OT attacks or GPS spoofing campaigns coordinated with physical route interdiction.",
    category: "cyber_maritime",
    requiredDomains: ["firestorm", "vessels"],
    evidenceTypes: [
      { domain: "firestorm", signalType: "ot_scada_threat", weight: 0.90, description: "OT/SCADA threat actor activity" },
      { domain: "vessels", signalType: "gps_anomaly", weight: 0.85, description: "GPS/AIS anomaly detected" },
    ],
    status: "active",
    confidenceScore: 0.87,
    baseConfidence: 0.87,
    feedbackAdjustment: 0,
    hitCount: 0,
    falsePositiveCount: 0,
    lastTriggeredAt: null,
    tags: ["cyber", "maritime", "ot", "scada", "gps-spoofing"],
  },
];

export class PatternLibrary {
  private patterns: Map<string, CorrelationPattern> = new Map();
  private feedbackStore: PatternFeedback[] = [];
  private readonly LEARNING_RATE = 0.08;
  private readonly MAX_FEEDBACK_HISTORY = 100;

  constructor() {
    const now = new Date().toISOString();
    for (const p of INITIAL_PATTERNS) {
      this.patterns.set(p.id, {
        ...p,
        learnedAt: now,
        updatedAt: now,
        feedbackHistory: [],
        exampleAlerts: [],
      });
    }
  }

  getAll(): CorrelationPattern[] {
    return [...this.patterns.values()];
  }

  getById(id: string): CorrelationPattern | null {
    return this.patterns.get(id) ?? null;
  }

  getActive(): CorrelationPattern[] {
    return [...this.patterns.values()].filter(p => p.status === "active" || p.status === "learning");
  }

  getByCategory(category: PatternCategory): CorrelationPattern[] {
    return [...this.patterns.values()].filter(p => p.category === category);
  }

  recordHit(patternId: string, alertId: string): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;
    pattern.hitCount++;
    pattern.lastTriggeredAt = new Date().toISOString();
    if (!pattern.exampleAlerts.includes(alertId)) {
      pattern.exampleAlerts.unshift(alertId);
      if (pattern.exampleAlerts.length > 10) pattern.exampleAlerts.pop();
    }
    pattern.updatedAt = new Date().toISOString();
  }

  submitFeedback(input: {
    patternId: string;
    alertId: string;
    relevance: PatternFeedback["relevance"];
    rating: number;
    notes?: string;
    reviewedBy?: string;
  }): PatternFeedback | null {
    const pattern = this.patterns.get(input.patternId);
    if (!pattern) return null;

    const feedback: PatternFeedback = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      patternId: input.patternId,
      alertId: input.alertId,
      relevance: input.relevance,
      rating: Math.max(1, Math.min(5, input.rating)),
      notes: input.notes,
      reviewedBy: input.reviewedBy,
      reviewedAt: new Date().toISOString(),
    };

    pattern.feedbackHistory.unshift(feedback);
    if (pattern.feedbackHistory.length > this.MAX_FEEDBACK_HISTORY) {
      pattern.feedbackHistory.pop();
    }

    this.feedbackStore.unshift(feedback);
    if (this.feedbackStore.length > 1000) this.feedbackStore.pop();

    this.applyFeedbackLearning(pattern, feedback);
    return feedback;
  }

  private applyFeedbackLearning(pattern: CorrelationPattern, feedback: PatternFeedback): void {
    const normalizedRating = (feedback.rating - 1) / 4;

    let signal = 0;
    if (feedback.relevance === "confirmed") {
      signal = normalizedRating;
      if (signal > 0.5) {
        pattern.falsePositiveCount = Math.max(0, pattern.falsePositiveCount - 0.5);
      }
    } else if (feedback.relevance === "false_positive") {
      signal = -0.5;
      pattern.falsePositiveCount++;
    } else {
      signal = (normalizedRating - 0.5) * 0.5;
    }

    pattern.feedbackAdjustment = pattern.feedbackAdjustment * (1 - this.LEARNING_RATE) + signal * this.LEARNING_RATE;
    pattern.confidenceScore = Math.max(0.1, Math.min(0.99, pattern.baseConfidence + pattern.feedbackAdjustment));

    const fpRate = pattern.falsePositiveCount / Math.max(1, pattern.hitCount);
    if (fpRate > 0.5 && pattern.hitCount >= 5) {
      pattern.status = "degraded";
    } else if (pattern.confidenceScore > 0.6) {
      pattern.status = "active";
    }

    pattern.updatedAt = new Date().toISOString();
  }

  addCustomPattern(input: {
    name: string;
    description: string;
    category: PatternCategory;
    requiredDomains: string[];
    evidenceTypes: PatternEvidence[];
    tags?: string[];
  }): CorrelationPattern {
    const now = new Date().toISOString();
    const pattern: CorrelationPattern = {
      id: `pat-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: input.name,
      description: input.description,
      category: input.category,
      requiredDomains: input.requiredDomains,
      evidenceTypes: input.evidenceTypes,
      status: "learning",
      confidenceScore: 0.60,
      baseConfidence: 0.60,
      feedbackAdjustment: 0,
      hitCount: 0,
      falsePositiveCount: 0,
      lastTriggeredAt: null,
      learnedAt: now,
      updatedAt: now,
      feedbackHistory: [],
      exampleAlerts: [],
      tags: input.tags ?? [],
    };
    this.patterns.set(pattern.id, pattern);
    return pattern;
  }

  getLibraryStats(): {
    totalPatterns: number;
    activePatterns: number;
    degradedPatterns: number;
    totalHits: number;
    totalFeedbackItems: number;
    avgConfidence: number;
    topPatterns: Array<{ id: string; name: string; hitCount: number; confidence: number }>;
  } {
    const all = [...this.patterns.values()];
    const avgConfidence = all.length > 0
      ? all.reduce((s, p) => s + p.confidenceScore, 0) / all.length
      : 0;

    return {
      totalPatterns: all.length,
      activePatterns: all.filter(p => p.status === "active").length,
      degradedPatterns: all.filter(p => p.status === "degraded").length,
      totalHits: all.reduce((s, p) => s + p.hitCount, 0),
      totalFeedbackItems: this.feedbackStore.length,
      avgConfidence,
      topPatterns: all
        .sort((a, b) => b.hitCount - a.hitCount)
        .slice(0, 5)
        .map(p => ({ id: p.id, name: p.name, hitCount: p.hitCount, confidence: p.confidenceScore })),
    };
  }
}

export const patternLibrary = new PatternLibrary();
