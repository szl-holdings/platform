import type { MetricValue, MetricDefinition, MetricSnapshot, ObservabilityEvent, LensScore, LensId, AppObservabilityState, DomainConfig } from "./types.js";

const MAX_HISTORY = 60;
const MAX_EVENTS = 100;

const LENS_IDS: LensId[] = ["signal", "impact", "anticipation", "topology", "posture", "velocity", "userExperience"];

export class MetricCollector {
  private metrics: Map<string, MetricValue[]> = new Map();
  private events: ObservabilityEvent[] = [];
  private config: DomainConfig;
  private listeners: Set<() => void> = new Set();

  constructor(config: DomainConfig) {
    this.config = config;
    this.seedSimulatedData();
  }

  private seedSimulatedData() {
    const now = Date.now();
    for (const metric of this.config.metrics) {
      const history: MetricValue[] = [];
      let base = this.getBaseValueForMetric(metric);
      for (let i = MAX_HISTORY - 1; i >= 0; i--) {
        const jitter = (Math.random() - 0.5) * base * 0.15;
        history.push({
          metricId: metric.id,
          value: Math.max(0, base + jitter),
          timestamp: now - i * 5000,
        });
      }
      this.metrics.set(metric.id, history);
    }

    this.events = this.generateInitialEvents(now);
  }

  private getBaseValueForMetric(metric: MetricDefinition): number {
    if (metric.unit === "percent" || metric.unit === "%") return 75 + Math.random() * 20;
    if (metric.unit === "ms") return 50 + Math.random() * 200;
    if (metric.unit === "seconds" || metric.unit === "sec") return 1 + Math.random() * 10;
    if (metric.unit === "score") return 60 + Math.random() * 35;
    if (metric.unit === "per_hour" || metric.unit === "/hr") return 10 + Math.random() * 100;
    if (metric.unit === "count") return Math.floor(5 + Math.random() * 50);
    return 50 + Math.random() * 50;
  }

  private generateInitialEvents(now: number): ObservabilityEvent[] {
    const events: ObservabilityEvent[] = [];
    const eventTypes: ObservabilityEvent["type"][] = ["metric_threshold", "anomaly", "status_change", "deployment", "security", "compliance"];

    const domainLabels = this.config.domainLensLabels;

    const lensMessages: Record<LensId, string[]> = {
      signal: [
        domainLabels ? `Top signal: ${domainLabels.topSignalLabel} — ranked critical` : "Priority signal detected — AI-ranked critical",
        "Signal correlation identified across 3 entities",
        "Noise filter active — 12 low-priority alerts suppressed",
      ],
      impact: [
        domainLabels ? `${domainLabels.impact} — exposure quantified` : "Business impact quantified — revenue correlation active",
        "Cost-of-delay model updated with new data",
        "Opportunity cost projection recalculated",
      ],
      anticipation: [
        domainLabels ? `${domainLabels.anticipation} — forecast horizon updated` : "Predictive model updated — 48h forecast horizon",
        "Anomaly trajectory converging — intervention recommended",
        "Behavioral model flagged emerging risk pattern",
      ],
      topology: [
        domainLabels ? `${domainLabels.topology} — dependency map refreshed` : "Dependency topology refreshed — 3 new relationships mapped",
        "Graph traversal identified downstream impact path",
        "Relationship health: all critical dependencies nominal",
      ],
      posture: [
        domainLabels ? `${domainLabels.postureScoreName} recalculated — status: healthy` : "Posture score recalculated — all dimensions nominal",
        "Continuous monitoring checkpoint passed",
        "Posture drift within acceptable bounds",
      ],
      velocity: [
        domainLabels ? `${domainLabels.velocity} — trend: improving` : "Improvement velocity trending positive — 7-day MA up 4%",
        "Resolution throughput increased — new baseline established",
        "Learning rate metric: week-over-week improvement confirmed",
      ],
      userExperience: [
        "User interaction tracked — session data updated",
        "Client error detected — error count incremented",
        "Page load performance recorded",
      ],
    };

    for (let i = 0; i < 8; i++) {
      const lens = LENS_IDS[Math.floor(Math.random() * LENS_IDS.length)];
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const messages = lensMessages[lens];
      events.push({
        id: `evt_${now}_${i}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        message: messages[Math.floor(Math.random() * messages.length)],
        pillar: lens,
        lens,
        severity: Math.random() > 0.7 ? "warning" : "info",
        timestamp: now - Math.floor(Math.random() * 3600000),
      });
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  record(metricId: string, value: number, labels?: Record<string, string>) {
    const entry: MetricValue = { metricId, value, timestamp: Date.now(), labels };
    const history = this.metrics.get(metricId) || [];
    history.push(entry);
    if (history.length > MAX_HISTORY) history.shift();
    this.metrics.set(metricId, history);

    const def = this.config.metrics.find((m) => m.id === metricId);
    if (def?.thresholds) {
      const exceeded = def.thresholds.direction === "above"
        ? value > def.thresholds.critical
        : value < def.thresholds.critical;
      if (exceeded) {
        this.addEvent({
          type: "metric_threshold",
          message: `${def.name} reached critical level: ${value.toFixed(1)}${def.unit}`,
          pillar: def.pillar,
          lens: def.pillar,
          severity: "critical",
        });
      }
    }

    this.notify();
  }

  addEvent(partial: Omit<ObservabilityEvent, "id" | "timestamp">) {
    const event: ObservabilityEvent = {
      ...partial,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    this.events.unshift(event);
    if (this.events.length > MAX_EVENTS) this.events.pop();
    this.notify();
  }

  getSnapshot(): AppObservabilityState {
    const metricSnapshots = this.config.metrics.map((def) => this.getMetricSnapshot(def));
    const lensScores = this.computeLensScores(metricSnapshots);
    const overallScore = lensScores.length > 0
      ? Math.round(lensScores.reduce((s, p) => s + p.score, 0) / lensScores.length)
      : 0;

    const postureScore = lensScores.find(l => l.lensId === "posture")?.score ?? overallScore;
    const velocityLens = lensScores.find(l => l.lensId === "velocity");
    const velocityTrend = velocityLens ? [
      velocityLens.score - 5,
      velocityLens.score - 3,
      velocityLens.score - 1,
      velocityLens.score,
    ] : [];

    const domainLabels = this.config.domainLensLabels;
    const topSignal = domainLabels?.topSignalLabel || "Primary signal active";

    return {
      appSlug: this.config.appSlug,
      lenses: lensScores,
      pillars: lensScores,
      overallScore,
      overallStatus: overallScore >= 80 ? "healthy" : overallScore >= 50 ? "degraded" : "critical",
      metrics: metricSnapshots,
      events: [...this.events],
      lastUpdated: Date.now(),
      postureScore,
      topSignal,
      velocityTrend,
    };
  }

  private getMetricSnapshot(def: MetricDefinition): MetricSnapshot {
    const history = this.metrics.get(def.id) || [];
    const current = history.length > 0 ? history[history.length - 1].value : 0;
    const trend = history.slice(-20).map((h) => h.value);
    const prev = history.length > 1 ? history[history.length - 2].value : current;
    const changePercent = prev !== 0 ? ((current - prev) / prev) * 100 : 0;

    let status: MetricSnapshot["status"] = "normal";
    if (def.thresholds) {
      const { warning, critical, direction } = def.thresholds;
      if (direction === "above") {
        if (current > critical) status = "critical";
        else if (current > warning) status = "warning";
      } else {
        if (current < critical) status = "critical";
        else if (current < warning) status = "warning";
      }
    }

    return { metricId: def.id, current, trend, status, changePercent, lensContribution: def.pillar };
  }

  private computeLensScores(snapshots: MetricSnapshot[]): LensScore[] {
    const now = Date.now();

    return LENS_IDS.map((lensId) => {
      const lensMetrics = this.config.metrics.filter((m) => m.pillar === lensId);
      const lensSnapshots = lensMetrics.map((m) => snapshots.find((s) => s.metricId === m.id)).filter(Boolean) as MetricSnapshot[];

      if (lensSnapshots.length === 0) {
        return {
          lensId,
          pillarId: lensId,
          score: 85 + Math.floor(Math.random() * 10),
          status: "healthy" as const,
          metricCount: 0,
          anomalyCount: 0,
          lastUpdated: now,
        };
      }

      const critCount = lensSnapshots.filter((s) => s.status === "critical").length;
      const warnCount = lensSnapshots.filter((s) => s.status === "warning").length;
      const total = lensSnapshots.length;

      const score = Math.max(0, Math.min(100, Math.round(100 - (critCount / total) * 50 - (warnCount / total) * 20 + Math.random() * 5)));
      const status = score >= 80 ? "healthy" : score >= 50 ? "degraded" : "critical";

      return {
        lensId,
        pillarId: lensId,
        score,
        status,
        metricCount: total,
        anomalyCount: critCount,
        lastUpdated: now,
      };
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  simulateTick() {
    for (const metric of this.config.metrics) {
      const history = this.metrics.get(metric.id) || [];
      if (history.length === 0) continue;
      const lastVal = history[history.length - 1].value;
      const jitter = (Math.random() - 0.5) * lastVal * 0.08;
      this.record(metric.id, Math.max(0, lastVal + jitter));
    }
  }
}
