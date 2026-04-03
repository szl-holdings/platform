import type { InsertAlloySignal } from "@szl-holdings/db";

export type RawSignalInput = {
  source: string;
  sourceType: InsertAlloySignal["sourceType"];
  domain: string;
  title: string;
  summary?: string;
  rawPayload?: Record<string, unknown>;
  tags?: string[];
  environment?: "development" | "staging" | "production";
};

const DOMAIN_CATEGORIES: Record<string, string> = {
  vessels: "maritime",
  firestorm: "security",
  aegis: "security",
  lyte: "observability",
  inca: "research",
  terra: "real-estate",
  msp: "managed-services",
  "aegis-ops": "managed-services",
  alloy: "orchestration",
  global: "cross-domain",
};

const SEVERITY_KEYWORDS: Array<{ keywords: string[]; severity: InsertAlloySignal["severity"] }> = [
  { keywords: ["critical", "emergency", "fatal", "breach", "compromise", "ransom"], severity: "critical" },
  { keywords: ["high", "severe", "urgent", "alert", "failure", "down", "outage", "incident"], severity: "high" },
  { keywords: ["medium", "warning", "warn", "degraded", "slow", "anomaly", "unusual"], severity: "medium" },
  { keywords: ["low", "info", "notice", "minor", "advisory"], severity: "low" },
];

function classifySeverity(title: string, summary?: string): InsertAlloySignal["severity"] {
  const text = `${title} ${summary ?? ""}`.toLowerCase();
  for (const { keywords, severity } of SEVERITY_KEYWORDS) {
    if (keywords.some(k => text.includes(k))) return severity;
  }
  return "medium";
}

function classifyCategory(domain: string, title: string): string {
  const domainCategory = DOMAIN_CATEGORIES[domain] ?? "general";
  const titleLower = title.toLowerCase();

  if (titleLower.includes("threat") || titleLower.includes("attack") || titleLower.includes("vuln")) return "threat";
  if (titleLower.includes("health") || titleLower.includes("slo") || titleLower.includes("latency")) return "health";
  if (titleLower.includes("anomaly") || titleLower.includes("deviation")) return "anomaly";
  if (titleLower.includes("compliance") || titleLower.includes("sanction")) return "compliance";
  if (titleLower.includes("performance") || titleLower.includes("metric")) return "performance";

  return domainCategory;
}

function scoreSignal(severity: InsertAlloySignal["severity"], confidence: number): number {
  const severityWeights: Record<string, number> = {
    critical: 1.0, high: 0.8, medium: 0.5, low: 0.25, info: 0.1,
  };
  const severityWeight = severityWeights[severity ?? "medium"] ?? 0.5;
  return Math.min(1.0, severityWeight * confidence);
}

function assignTags(domain: string, category: string, severity: InsertAlloySignal["severity"], existingTags: string[]): string[] {
  const tags = new Set(existingTags.map(t => t.toLowerCase().trim()).filter(Boolean));
  tags.add(domain);
  tags.add(category);
  if (severity === "critical" || severity === "high") tags.add("needs-attention");
  tags.add("normalized");
  return Array.from(tags);
}

export type NormalizedSignalData = {
  source: string;
  sourceType: InsertAlloySignal["sourceType"];
  domain: string;
  title: string;
  summary?: string;
  rawPayload?: Record<string, unknown>;
  category: string;
  severity: InsertAlloySignal["severity"];
  score: number;
  confidence: number;
  tags: string[];
  status: InsertAlloySignal["status"];
  normalizedAt: Date;
  environment: InsertAlloySignal["environment"];
};

export function normalizeSignal(input: RawSignalInput): NormalizedSignalData {
  const severity = classifySeverity(input.title, input.summary);
  const category = classifyCategory(input.domain, input.title);
  const confidence = 0.75;
  const score = scoreSignal(severity, confidence);
  const tags = assignTags(input.domain, category, severity, input.tags ?? []);

  return {
    source: input.source,
    sourceType: input.sourceType,
    domain: input.domain,
    title: input.title,
    summary: input.summary,
    rawPayload: input.rawPayload as Record<string, unknown> | undefined,
    category,
    severity,
    score,
    confidence,
    tags,
    status: "normalized",
    normalizedAt: new Date(),
    environment: input.environment ?? "production",
  };
}

export function scoreSignalRules(signal: Partial<InsertAlloySignal>): {
  score: number;
  confidence: number;
  valueAtRisk: number;
  anomalyFlag: boolean;
  escalationRequired: boolean;
  workflowType: "investigation" | "remediation" | "escalation" | "review" | "notification" | "report" | "custom";
  priority: "low" | "medium" | "high" | "critical";
} {
  const sev = signal.severity ?? "medium";
  const conf = signal.confidence ?? 0.5;

  const severityScores: Record<string, number> = {
    critical: 1.0, high: 0.8, medium: 0.5, low: 0.25, info: 0.1,
  };
  const score = Math.min(1.0, (severityScores[sev] ?? 0.5) * conf);

  const valueAtRiskMap: Record<string, number> = {
    critical: 100000, high: 50000, medium: 10000, low: 1000, info: 0,
  };
  const valueAtRisk = valueAtRiskMap[sev] ?? 0;

  const anomalyFlag = (signal.tags as string[] ?? []).includes("anomaly") || sev === "critical";
  const escalationRequired = sev === "critical" || (sev === "high" && conf > 0.8);

  const workflowType: "investigation" | "remediation" | "escalation" | "review" | "notification" | "report" | "custom" =
    escalationRequired ? "escalation" :
    sev === "high" ? "remediation" :
    sev === "medium" ? "investigation" :
    "notification";

  const priorityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
    critical: "critical", high: "high", medium: "medium", low: "low", info: "low",
  };
  const priority = priorityMap[sev] ?? "medium";

  return { score, confidence: conf, valueAtRisk, anomalyFlag, escalationRequired, workflowType, priority };
}
