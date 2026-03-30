export type PillarId =
  | "performance"
  | "business"
  | "userExperience"
  | "predictiveHealth"
  | "operational"
  | "strategic"
  | "securityPosture"
  | "innovationVelocity";

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
  philosophy: string;
  inspiredBy: string;
}

export const PILLARS: PillarDefinition[] = [
  {
    id: "performance",
    name: "Performance Intelligence",
    description: "Domain-specific latency, throughput, and resource optimization",
    icon: "Zap",
    philosophy: "Every millisecond tells a story. We don't just measure speed — we decode the relationship between system performance and business outcomes. Inspired by Dynatrace's entity topology model, we map how each service's performance ripples through the entire value chain.",
    inspiredBy: "Dynatrace PurePath + Datadog APM"
  },
  {
    id: "business",
    name: "Business Observability",
    description: "Revenue signals, conversion funnels, business KPI correlation, and value-stream mapping",
    icon: "TrendingUp",
    philosophy: "Technology exists to serve business outcomes. We connect every technical metric to a revenue signal, every deployment to customer impact, every incident to dollar cost. This is not monitoring — this is business intelligence in real-time.",
    inspiredBy: "New Relic Business Observability + Dynatrace Business Analytics"
  },
  {
    id: "userExperience",
    name: "User Experience Intelligence",
    description: "Session quality, interaction patterns, journey analytics, and digital experience scoring",
    icon: "Users",
    philosophy: "Users don't experience metrics — they experience moments. We track the emotional journey through digital touchpoints, correlating Web Vitals with satisfaction scores, session depth with conversion probability, and interaction patterns with feature adoption.",
    inspiredBy: "New Relic Browser + Dynatrace RUM + Datadog Real User Monitoring"
  },
  {
    id: "predictiveHealth",
    name: "Predictive Health",
    description: "Anomaly detection, trend forecasting, causal AI, and early warning signals",
    icon: "Brain",
    philosophy: "The best incident is the one that never happens. Using causal AI and pattern recognition, we don't just detect anomalies — we understand WHY they occur and predict WHEN they'll recur. Answers, not alerts.",
    inspiredBy: "Dynatrace Davis AI + Datadog Watchdog"
  },
  {
    id: "operational",
    name: "Operational Awareness",
    description: "Dependency health, integration status, topology mapping, and self-diagnostics",
    icon: "Server",
    philosophy: "A system is only as strong as its weakest dependency. We maintain a living topology of every service, integration, and data flow — automatically detecting drift, diagnosing failures, and orchestrating recovery before users notice.",
    inspiredBy: "Dynatrace Smartscape + Datadog Service Map"
  },
  {
    id: "strategic",
    name: "Strategic Insight",
    description: "Executive-level outcome correlation, portfolio intelligence, and cross-domain synthesis",
    icon: "Target",
    philosophy: "Strategy without observability is guesswork. We synthesize signals across the entire portfolio into executive-grade intelligence — correlating market movements with system behavior, competitor actions with feature velocity, and organizational health with technical debt.",
    inspiredBy: "New Relic Observability Maturity Model"
  },
  {
    id: "securityPosture",
    name: "Security Posture",
    description: "Threat surface monitoring, compliance drift detection, vulnerability trending, and zero-trust verification",
    icon: "Shield",
    philosophy: "Security is not a feature — it's a continuous state of awareness. We monitor the attack surface in real-time, track compliance drift across frameworks, trend vulnerability lifecycles, and verify zero-trust boundaries are holding. Every deployment changes the threat landscape.",
    inspiredBy: "Datadog Cloud Security + Dynatrace Application Security"
  },
  {
    id: "innovationVelocity",
    name: "Innovation Velocity",
    description: "DORA metrics, deployment frequency, change failure rate, lead time, and mean time to recovery",
    icon: "Rocket",
    philosophy: "Speed without stability is chaos. Stability without speed is stagnation. We track the four golden signals of engineering excellence — deployment frequency, lead time for changes, change failure rate, and time to restore — ensuring every team ships with confidence.",
    inspiredBy: "DORA Metrics + New Relic Change Tracking"
  },
];

export const INTELLIGENCE_PHILOSOPHY = {
  name: "DreamStack Intelligence",
  tagline: "Not just observability. Intelligence that anticipates.",
  manifesto: "We believe the next generation of software platforms won't just be monitored — they'll be understood. DreamStack Intelligence synthesizes the best thinking from New Relic's Business Observability, Dynatrace's Software Intelligence, and Datadog's unified platform philosophy into something uniquely our own. We don't collect data points — we cultivate understanding. Every metric has a business meaning. Every alert has a human context. Every dashboard tells a story that connects engineering excellence to organizational outcomes.",
  principles: [
    { title: "Answers, Not Data", description: "Raw metrics are noise. Correlated insights are signal. We surface the 'so what' behind every number." },
    { title: "Business-First Telemetry", description: "Every technical metric maps to a business outcome. If it doesn't affect revenue, customers, or velocity, it doesn't belong on the dashboard." },
    { title: "Predictive Over Reactive", description: "The best incident is the one that never fires. We forecast degradation before it becomes an outage." },
    { title: "Context-Rich Alerting", description: "An alert without context is just noise. Every notification includes the what, the why, the who-is-affected, and the recommended action." },
    { title: "Portfolio-Wide Intelligence", description: "No app is an island. Cross-domain correlation reveals patterns invisible within a single service." },
    { title: "Continuous Verification", description: "Trust but verify — continuously. Security posture, compliance state, and integration health are validated every tick." },
  ],
  maturityModel: [
    { level: 1, name: "Reactive", description: "Alert-driven. You know something broke when users complain." },
    { level: 2, name: "Proactive", description: "Threshold-based monitoring. You catch issues before users do." },
    { level: 3, name: "Predictive", description: "AI-driven forecasting. You prevent issues before they occur." },
    { level: 4, name: "Intelligent", description: "Business-correlated. You understand the dollar impact of every technical decision." },
    { level: 5, name: "Autonomous", description: "Self-healing. The system observes, decides, and acts — reporting back with full context." },
  ],
};

export interface DomainConfig {
  appSlug: string;
  appName: string;
  domain: string;
  description: string;
  metrics: MetricDefinition[];
  kpis: KPIDefinition[];
  healthSignals: HealthSignal[];
  connectors?: string[];
  maturityLevel?: number;
  businessContext?: string;
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
  maturityLevel?: number;
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
  type: "metric_threshold" | "anomaly" | "status_change" | "deployment" | "error" | "security" | "compliance";
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
  maturityDistribution?: Record<number, number>;
}
