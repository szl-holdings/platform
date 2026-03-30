export type LensId =
  | "signal"
  | "impact"
  | "anticipation"
  | "topology"
  | "posture"
  | "velocity";

export type PillarId = LensId;

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  pillar: LensId;
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

export interface LensDefinition {
  id: LensId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  philosophy: string;
  inspiredBy: string;
  color: string;
}

export type PillarDefinition = LensDefinition;

export const LENSES: LensDefinition[] = [
  {
    id: "signal",
    name: "Signal Lens",
    tagline: "See everything that matters, nothing that doesn't.",
    description: "AI-ranked signals surfacing the 3–5 things that actually matter right now — with context, not just data.",
    icon: "Radio",
    philosophy: "Every domain drowns in noise. The Signal Lens cuts through — using AI-ranked priority to surface only what demands attention right now. Inspired by New Relic's noise reduction and CrowdStrike's 1-10-60 rule, we don't show dashboards of metrics. We surface curated signals with the context needed to act.",
    inspiredBy: "New Relic Response Intelligence + CrowdStrike 1-10-60",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "impact",
    name: "Impact Lens",
    tagline: "Every technical event has a dollar sign.",
    description: "Connects every operational event to a business outcome — revenue at risk, cost of delay, opportunity cost.",
    icon: "DollarSign",
    philosophy: "Technology exists to serve business outcomes. The Impact Lens translates every technical event into financial consequence — a vessel delay becomes fuel cost, a security incident becomes a compliance fine exposure, a campaign delay becomes a missed launch window. Inspired by New Relic Pathpoint Plus and Datadog cost monitoring.",
    inspiredBy: "New Relic Pathpoint Plus + Datadog Cost Monitoring",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "anticipation",
    name: "Anticipation Lens",
    tagline: "Know before it happens.",
    description: "Projects the current state forward — predicting failures, forecasting outcomes, and surfacing risks before they materialize.",
    icon: "Brain",
    philosophy: "The best incident is the one that never happens. The Anticipation Lens doesn't just show current state — it projects forward using behavioral AI and predictive models. Vessel arrival predictions, threat trajectory modeling, market trend forecasting, compliance drift detection. Inspired by Dynatrace Davis AI and Windward's behavioral risk scoring.",
    inspiredBy: "Dynatrace Davis AI + Windward Behavioral AI",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "topology",
    name: "Topology Lens",
    tagline: "Everything is connected.",
    description: "Reveals the relationship map — how entities relate, depend on, and affect each other across the entire domain.",
    icon: "Network",
    philosophy: "No entity operates in isolation. The Topology Lens shows the relationship graph — fleet vessel networks, attack surface dependencies, property-market connections, creative asset hierarchies. When one node changes, the ripple is visible. Inspired by Dynatrace Smartscape and New Relic's Service Architecture.",
    inspiredBy: "Dynatrace Smartscape + New Relic Service Architecture",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "posture",
    name: "Posture Lens",
    tagline: "One number tells the story.",
    description: "A single, real-time posture score — front and center, always visible — that captures overall health in one authoritative signal.",
    icon: "Shield",
    philosophy: "Complexity collapses into one number. The Posture Lens synthesizes every signal, metric, and risk factor into a single real-time score that tells you how healthy, ready, and secure things are right now. Not buried in a dashboard — front and center. Inspired by Vanta's continuous compliance monitoring and CrowdStrike's risk scores.",
    inspiredBy: "Vanta Continuous Monitoring + CrowdStrike Risk Scores",
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "velocity",
    name: "Velocity Lens",
    tagline: "How fast are we getting better?",
    description: "Measures the rate of improvement — deployment frequency, resolution speed, learning rate, deal throughput, and improvement trends.",
    icon: "Rocket",
    philosophy: "Speed without stability is chaos. Stability without speed is stagnation. The Velocity Lens tracks the rate of improvement across every domain — DORA metrics for engineering, throughput for research, deal pipeline velocity for real estate, content production rate for creative. Inspired by DORA metrics and W&B experiment tracking.",
    inspiredBy: "DORA Metrics + Weights & Biases Experiment Tracking",
    color: "from-indigo-500 to-blue-600",
  },
];

export const PILLARS: LensDefinition[] = LENSES;

export const SIX_LENSES_PHILOSOPHY = {
  name: "The 6 Lenses of Business Observability",
  tagline: "SZL's proprietary way of seeing any business domain.",
  manifesto: "Every business domain viewed through six proprietary lenses. Not generic observability repackaged — a fundamentally different way of seeing. The Signal Lens cuts through noise to surface what matters. The Impact Lens connects every event to a dollar sign. The Anticipation Lens knows before it happens. The Topology Lens reveals how everything connects. The Posture Lens distills complexity into one authoritative score. The Velocity Lens measures how fast we're getting better. Together, these six lenses don't just observe a business — they illuminate it.",
  principles: [
    { title: "Signal over Noise", description: "AI-ranked priority surfaces the 3–5 signals that actually matter right now. Not dashboards of metrics — curated signals with context." },
    { title: "Impact-Priced Intelligence", description: "Every technical event has a dollar sign. Vessel delay = fuel cost. Security incident = fine exposure. Creative delay = missed launch window." },
    { title: "Anticipatory, Not Reactive", description: "We project forward. Predict before it happens. The Anticipation Lens is always running, always looking ahead." },
    { title: "Connected by Design", description: "Everything is connected. The Topology Lens reveals the relationship graph — how entities relate, depend on, and affect each other." },
    { title: "One Number, One Truth", description: "The Posture Lens distills everything into one authoritative score — front and center, always visible, always current." },
    { title: "Velocity as a Metric", description: "Getting better faster is the goal. The Velocity Lens measures improvement rate across every dimension." },
  ],
  maturityModel: [
    { level: 1, name: "Reactive", description: "Alert-driven. You know something broke when users complain." },
    { level: 2, name: "Proactive", description: "Threshold-based monitoring. You catch issues before users do." },
    { level: 3, name: "Predictive", description: "AI-driven forecasting. You prevent issues before they occur." },
    { level: 4, name: "Impact-Aware", description: "Business-correlated. You understand the dollar impact of every technical decision." },
    { level: 5, name: "Lens-Native", description: "All 6 Lenses active. The business observes, decides, and acts through unified intelligence." },
  ],
};

export const INTELLIGENCE_PHILOSOPHY = SIX_LENSES_PHILOSOPHY;

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
  domainLensLabels?: DomainLensLabels;
}

export interface DomainLensLabels {
  signal: string;
  impact: string;
  anticipation: string;
  topology: string;
  posture: string;
  velocity: string;
  postureScoreName: string;
  topSignalLabel: string;
  velocityTrendLabel: string;
}

export interface KPIDefinition {
  id: string;
  name: string;
  pillar: LensId;
  format: "percent" | "number" | "duration" | "currency" | "score";
  target?: number;
}

export interface HealthSignal {
  id: string;
  name: string;
  pillar: LensId;
  severity: "info" | "warning" | "critical";
  condition: string;
}

export interface LensScore {
  lensId: LensId;
  pillarId: LensId;
  score: number;
  status: "healthy" | "degraded" | "critical" | "unknown";
  metricCount: number;
  anomalyCount: number;
  lastUpdated: number;
  impactValue?: number;
  impactCurrency?: string;
  topSignal?: string;
}

export type PillarScore = LensScore;

export interface AppObservabilityState {
  appSlug: string;
  lenses: LensScore[];
  pillars: LensScore[];
  overallScore: number;
  overallStatus: "healthy" | "degraded" | "critical" | "unknown";
  metrics: MetricSnapshot[];
  events: ObservabilityEvent[];
  lastUpdated: number;
  maturityLevel?: number;
  postureScore?: number;
  topSignal?: string;
  velocityTrend?: number[];
  impactSummary?: ImpactSummary;
}

export interface ImpactSummary {
  revenueAtRisk: number;
  costOfDelay: number;
  opportunityCost: number;
  currency: string;
  label: string;
}

export interface MetricSnapshot {
  metricId: string;
  current: number;
  trend: number[];
  status: "normal" | "warning" | "critical";
  changePercent: number;
  lensContribution?: LensId;
}

export interface ObservabilityEvent {
  id: string;
  type: "metric_threshold" | "anomaly" | "status_change" | "deployment" | "error" | "security" | "compliance";
  message: string;
  pillar: LensId;
  lens?: LensId;
  severity: "info" | "warning" | "critical";
  timestamp: number;
  impactEstimate?: number;
  metadata?: Record<string, unknown>;
}

export interface PortfolioRollup {
  timestamp: number;
  apps: AppObservabilityState[];
  portfolioScore: number;
  portfolioStatus: "healthy" | "degraded" | "critical";
  crossAppAnomalies: ObservabilityEvent[];
  lensAggregates: LensScore[];
  pillarAggregates: LensScore[];
  maturityDistribution?: Record<number, number>;
}

export interface LensBarData {
  appSlug: string;
  appName: string;
  postureScore: number;
  postureScoreName: string;
  topSignal: string;
  velocityTrend: number[];
  overallStatus: "healthy" | "degraded" | "critical" | "unknown";
  lenses: LensScore[];
}
