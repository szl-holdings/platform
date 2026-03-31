export type SignalSeverity = "critical" | "high" | "medium" | "low" | "info";
export type SignalSource = "api" | "webhook" | "agent" | "manual" | "scheduled" | "realtime" | "ingestion";
export type ConfidenceLevel = "verified" | "high" | "medium" | "low" | "unverified";
export type FreshnessWindow = "realtime" | "minutes" | "hourly" | "daily" | "stale" | "unknown";
export type WorkflowState = "pending" | "active" | "awaiting_approval" | "escalated" | "completed" | "failed" | "cancelled" | "retrying";
export type ActionType = "remediate" | "approve" | "escalate" | "assign" | "investigate" | "dismiss" | "defer" | "automate";
export type BusinessImpact = "revenue" | "compliance" | "operational" | "reputational" | "security" | "none";

export interface SZLSignal {
  id: string;
  title: string;
  source: SignalSource;
  severity: SignalSeverity;
  confidence: ConfidenceLevel;
  freshness: FreshnessWindow;
  timestamp: string;
  platform: "lyte" | "aegis" | "terra" | "vessels" | "alloy";
  owner?: string;
  businessImpact?: BusinessImpact;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

export interface SZLRisk {
  id: string;
  signalIds: string[];
  title: string;
  severity: SignalSeverity;
  businessImpact: BusinessImpact;
  owner?: string;
  estimatedExposure?: string;
  mitigationStatus: "unmitigated" | "partial" | "mitigated" | "accepted";
  lastAssessedAt: string;
}

export interface SZLAction {
  id: string;
  type: ActionType;
  title: string;
  description?: string;
  riskId?: string;
  signalId?: string;
  assignee?: string;
  state: WorkflowState;
  priority: SignalSeverity;
  createdAt: string;
  dueAt?: string;
  completedAt?: string;
}

export interface SZLOutcome {
  id: string;
  actionId: string;
  result: "resolved" | "partially_resolved" | "failed" | "deferred" | "accepted_risk";
  summary: string;
  resolvedAt: string;
  resolvedBy?: string;
  businessValueRecovered?: string;
  lessonLearned?: string;
}

export interface DataProvenanceInfo {
  source: string;
  lastUpdated: string;
  freshness: FreshnessWindow;
  confidence: ConfidenceLevel;
  dataState: "live" | "demo" | "simulated" | "cached";
  owner?: string;
  nextRefresh?: string;
}

export const SEVERITY_CONFIG: Record<SignalSeverity, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  high: { label: "High", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  medium: { label: "Medium", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  low: { label: "Low", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  info: { label: "Info", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
};

export const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; color: string }> = {
  verified: { label: "Verified", color: "#10b981" },
  high: { label: "High Confidence", color: "#22c55e" },
  medium: { label: "Medium Confidence", color: "#f59e0b" },
  low: { label: "Low Confidence", color: "#ef4444" },
  unverified: { label: "Unverified", color: "#6b7280" },
};

export const FRESHNESS_CONFIG: Record<FreshnessWindow, { label: string; color: string }> = {
  realtime: { label: "Real-time", color: "#10b981" },
  minutes: { label: "< 5 min", color: "#22c55e" },
  hourly: { label: "Hourly", color: "#3b82f6" },
  daily: { label: "Daily", color: "#f59e0b" },
  stale: { label: "Stale", color: "#ef4444" },
  unknown: { label: "Unknown", color: "#6b7280" },
};
