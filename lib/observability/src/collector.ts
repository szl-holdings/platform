import type { MetricValue, MetricDefinition, MetricSnapshot, ObservabilityEvent, PillarScore, PillarId, AppObservabilityState, DomainConfig } from "./types.js";

const MAX_HISTORY = 60;
const MAX_EVENTS = 100;

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
    const pillars: PillarId[] = ["performance", "business", "userExperience", "predictiveHealth", "operational", "strategic"];
    const events: ObservabilityEvent[] = [];
    const eventTypes: ObservabilityEvent["type"][] = ["metric_threshold", "anomaly", "status_change", "deployment"];

    for (let i = 0; i < 8; i++) {
      const pillar = pillars[Math.floor(Math.random() * pillars.length)];
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      events.push({
        id: `evt_${now}_${i}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        message: this.getEventMessage(type, pillar),
        pillar,
        severity: Math.random() > 0.7 ? "warning" : "info",
        timestamp: now - Math.floor(Math.random() * 3600000),
      });
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  private getEventMessage(type: ObservabilityEvent["type"], pillar: PillarId): string {
    const messages: Record<string, string[]> = {
      metric_threshold: ["Metric approaching threshold", "KPI target exceeded", "Value within normal range"],
      anomaly: ["Unusual pattern detected", "Trend deviation identified", "Predictive model flagged potential issue"],
      status_change: ["Status improved to healthy", "Component recovered", "Dependency check passed"],
      deployment: ["Configuration updated", "New baseline established", "Calibration complete"],
    };
    const pool = messages[type] || messages.status_change;
    return pool[Math.floor(Math.random() * pool.length)];
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
    const pillarScores = this.computePillarScores(metricSnapshots);
    const overallScore = pillarScores.length > 0
      ? Math.round(pillarScores.reduce((s, p) => s + p.score, 0) / pillarScores.length)
      : 0;

    return {
      appSlug: this.config.appSlug,
      pillars: pillarScores,
      overallScore,
      overallStatus: overallScore >= 80 ? "healthy" : overallScore >= 50 ? "degraded" : "critical",
      metrics: metricSnapshots,
      events: [...this.events],
      lastUpdated: Date.now(),
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

    return { metricId: def.id, current, trend, status, changePercent };
  }

  private computePillarScores(snapshots: MetricSnapshot[]): PillarScore[] {
    const pillarIds: PillarId[] = ["performance", "business", "userExperience", "predictiveHealth", "operational", "strategic"];
    const now = Date.now();

    return pillarIds.map((pillarId) => {
      const pillarMetrics = this.config.metrics.filter((m) => m.pillar === pillarId);
      const pillarSnapshots = pillarMetrics.map((m) => snapshots.find((s) => s.metricId === m.id)).filter(Boolean) as MetricSnapshot[];

      if (pillarSnapshots.length === 0) {
        return { pillarId, score: 85 + Math.floor(Math.random() * 10), status: "healthy" as const, metricCount: 0, anomalyCount: 0, lastUpdated: now };
      }

      const critCount = pillarSnapshots.filter((s) => s.status === "critical").length;
      const warnCount = pillarSnapshots.filter((s) => s.status === "warning").length;
      const total = pillarSnapshots.length;

      const score = Math.max(0, Math.min(100, Math.round(100 - (critCount / total) * 50 - (warnCount / total) * 20 + Math.random() * 5)));
      const status = score >= 80 ? "healthy" : score >= 50 ? "degraded" : "critical";

      return { pillarId, score, status, metricCount: total, anomalyCount: critCount, lastUpdated: now };
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
