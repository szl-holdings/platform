export type PillarId =
  | "performance"
  | "business"
  | "userExperience"
  | "predictiveHealth"
  | "operational"
  | "strategic";

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  pillar: PillarId;
  type: "counter" | "gauge" | "histogram";
  thresholds?: {
    warning: number;
    critical: number;
    direction: "above" | "below";
  };
}

export interface MetricValue {
  metricId: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface PillarDefinition {
  id: PillarId;
  name: string;
  description: string;
  icon: string;
}

export const PILLARS: PillarDefinition[] = [
  { id: "performance", name: "Performance Intelligence", description: "Domain-specific latency, throughput, and resource metrics", icon: "Zap" },
  { id: "business", name: "Business Observability", description: "Revenue signals, conversion funnels, and business KPIs", icon: "TrendingUp" },
  { id: "userExperience", name: "User Experience Intelligence", description: "Session quality, interaction patterns, and journey analytics", icon: "Users" },
  { id: "predictiveHealth", name: "Predictive Health", description: "Anomaly detection, trend forecasting, and early warning signals", icon: "Brain" },
  { id: "operational", name: "Operational Awareness", description: "Dependency health, integration status, and self-diagnostics", icon: "Server" },
  { id: "strategic", name: "Strategic Insight", description: "Executive-level outcome correlation and cross-app intelligence", icon: "Target" },
];

export interface DomainConfig {
  appSlug: string;
  appName: string;
  domain: string;
  description: string;
  metrics: MetricDefinition[];
  kpis: KPIDefinition[];
  healthSignals: HealthSignal[];
  connectors?: string[];
}

export interface KPIDefinition {
  id: string;
  name: string;
  pillar: PillarId;
  format: "percent" | "number" | "duration" | "currency" | "score";
  target?: number;
}

export interface HealthSignal {
  id: string;
  name: string;
  pillar: PillarId;
  severity: "info" | "warning" | "critical";
  condition: string;
}

export interface PillarScore {
  pillarId: PillarId;
  score: number;
  status: "healthy" | "degraded" | "critical" | "unknown";
  metricCount: number;
  anomalyCount: number;
  lastUpdated: number;
}

export interface AppObservabilityState {
  appSlug: string;
  pillars: PillarScore[];
  overallScore: number;
  overallStatus: "healthy" | "degraded" | "critical" | "unknown";
  metrics: MetricSnapshot[];
  events: ObservabilityEvent[];
  lastUpdated: number;
}

export interface MetricSnapshot {
  metricId: string;
  current: number;
  trend: number[];
  status: "normal" | "warning" | "critical";
  changePercent: number;
}

export interface ObservabilityEvent {
  id: string;
  type: "metric_threshold" | "anomaly" | "status_change" | "deployment" | "error";
  message: string;
  pillar: PillarId;
  severity: "info" | "warning" | "critical";
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PortfolioRollup {
  timestamp: number;
  apps: AppObservabilityState[];
  portfolioScore: number;
  portfolioStatus: "healthy" | "degraded" | "critical";
  crossAppAnomalies: ObservabilityEvent[];
  pillarAggregates: PillarScore[];
}
