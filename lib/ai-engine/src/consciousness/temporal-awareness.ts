export interface TemporalMarker {
  markerId: string;
  label: string;
  timestamp: string;
  eventType: "orchestration" | "decision" | "milestone" | "deadline" | "anomaly";
  metadata: Record<string, unknown>;
}

export interface TemporalPattern {
  patternId: string;
  description: string;
  frequency: "hourly" | "daily" | "weekly" | "irregular";
  lastOccurrence: string;
  occurrenceCount: number;
  predictedNext: string | null;
}

export interface TemporalAwarenessState {
  currentTime: string;
  sessionDuration: number;
  orchestrationCount: number;
  averageOrchestrationInterval: number;
  recentMarkers: TemporalMarker[];
  detectedPatterns: TemporalPattern[];
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  dayOfWeek: string;
  isBusinessHours: boolean;
  uptimeMs: number;
}

function classifyTimeOfDay(hour: number): TemporalAwarenessState["timeOfDay"] {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function isBusinessHours(date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface AgentTemporalEvolution {
  agentId: string;
  domain: string;
  samples: Array<{ timestamp: number; successRate: number; confidence: number; latencyMs: number }>;
  trend: "improving" | "declining" | "stable" | "volatile";
  selfReflection: string;
}

class TemporalAwarenessEngine {
  private markers: TemporalMarker[] = [];
  private patterns: Map<string, TemporalPattern> = new Map();
  private orchestrationTimestamps: number[] = [];
  private agentEvolution: Map<string, AgentTemporalEvolution> = new Map();
  private sessionStart = Date.now();
  private static readonly MAX_MARKERS = 500;
  private static readonly MAX_TIMESTAMPS = 1000;
  private static readonly MAX_EVOLUTION_SAMPLES = 100;

  recordMarker(label: string, eventType: TemporalMarker["eventType"], metadata: Record<string, unknown> = {}): TemporalMarker {
    const marker: TemporalMarker = {
      markerId: `tm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      timestamp: new Date().toISOString(),
      eventType,
      metadata,
    };

    this.markers.push(marker);
    if (this.markers.length > TemporalAwarenessEngine.MAX_MARKERS) {
      this.markers.splice(0, this.markers.length - TemporalAwarenessEngine.MAX_MARKERS);
    }

    if (eventType === "orchestration") {
      this.orchestrationTimestamps.push(Date.now());
      if (this.orchestrationTimestamps.length > TemporalAwarenessEngine.MAX_TIMESTAMPS) {
        this.orchestrationTimestamps.splice(0, this.orchestrationTimestamps.length - TemporalAwarenessEngine.MAX_TIMESTAMPS);
      }
    }

    this.detectPatterns();
    return marker;
  }

  getAverageInterval(): number {
    if (this.orchestrationTimestamps.length < 2) return 0;
    const intervals: number[] = [];
    for (let i = 1; i < this.orchestrationTimestamps.length; i++) {
      intervals.push(this.orchestrationTimestamps[i]! - this.orchestrationTimestamps[i - 1]!);
    }
    return intervals.reduce((s, i) => s + i, 0) / intervals.length;
  }

  getTimeSinceLastOrchestration(): number {
    if (this.orchestrationTimestamps.length === 0) return 0;
    return Date.now() - this.orchestrationTimestamps[this.orchestrationTimestamps.length - 1]!;
  }

  private detectPatterns(): void {
    if (this.orchestrationTimestamps.length < 5) return;

    const intervals = [];
    for (let i = 1; i < this.orchestrationTimestamps.length; i++) {
      intervals.push(this.orchestrationTimestamps[i]! - this.orchestrationTimestamps[i - 1]!);
    }

    const avgInterval = intervals.reduce((s, i) => s + i, 0) / intervals.length;
    const stdDev = Math.sqrt(intervals.reduce((s, i) => s + (i - avgInterval) ** 2, 0) / intervals.length);
    const cv = stdDev / Math.max(1, avgInterval);

    if (cv < 0.5) {
      let frequency: TemporalPattern["frequency"] = "irregular";
      if (avgInterval < 2 * 3600 * 1000) frequency = "hourly";
      else if (avgInterval < 48 * 3600 * 1000) frequency = "daily";
      else if (avgInterval < 10 * 24 * 3600 * 1000) frequency = "weekly";

      const predictedNext = new Date(Date.now() + avgInterval).toISOString();

      this.patterns.set("orchestration_cadence", {
        patternId: "orchestration_cadence",
        description: `Orchestrations occur at ~${frequency} intervals (avg ${(avgInterval / 60000).toFixed(0)} min apart)`,
        frequency,
        lastOccurrence: new Date(this.orchestrationTimestamps[this.orchestrationTimestamps.length - 1]!).toISOString(),
        occurrenceCount: this.orchestrationTimestamps.length,
        predictedNext,
      });
    }

    const hours = this.orchestrationTimestamps.map(t => new Date(t).getHours());
    const hourCounts: Record<number, number> = {};
    for (const h of hours) {
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    }
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (peakHour && peakHour[1] > this.orchestrationTimestamps.length * 0.2) {
      this.patterns.set("peak_usage", {
        patternId: "peak_usage",
        description: `Peak usage at hour ${peakHour[0]} (${peakHour[1]} orchestrations, ${(peakHour[1] / this.orchestrationTimestamps.length * 100).toFixed(0)}% of total)`,
        frequency: "daily",
        lastOccurrence: new Date().toISOString(),
        occurrenceCount: Number(peakHour[1]),
        predictedNext: null,
      });
    }
  }

  recordAgentPerformance(agentId: string, domain: string, successRate: number, confidence: number, latencyMs: number): void {
    let evo = this.agentEvolution.get(agentId);
    if (!evo) {
      evo = { agentId, domain, samples: [], trend: "stable", selfReflection: "" };
      this.agentEvolution.set(agentId, evo);
    }
    evo.samples.push({ timestamp: Date.now(), successRate, confidence, latencyMs });
    if (evo.samples.length > TemporalAwarenessEngine.MAX_EVOLUTION_SAMPLES) {
      evo.samples.splice(0, evo.samples.length - TemporalAwarenessEngine.MAX_EVOLUTION_SAMPLES);
    }
    evo.trend = this.computeTrend(evo.samples);
    evo.selfReflection = this.generateSelfReflection(evo);
  }

  private computeTrend(samples: AgentTemporalEvolution["samples"]): AgentTemporalEvolution["trend"] {
    if (samples.length < 3) return "stable";
    const recentHalf = samples.slice(-Math.floor(samples.length / 2));
    const olderHalf = samples.slice(0, Math.floor(samples.length / 2));
    const recentAvg = recentHalf.reduce((s, x) => s + x.successRate, 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((s, x) => s + x.successRate, 0) / olderHalf.length;
    const diff = recentAvg - olderAvg;
    const stdDev = Math.sqrt(recentHalf.reduce((s, x) => s + (x.successRate - recentAvg) ** 2, 0) / recentHalf.length);
    if (stdDev > 0.25) return "volatile";
    if (diff > 0.05) return "improving";
    if (diff < -0.05) return "declining";
    return "stable";
  }

  private generateSelfReflection(evo: AgentTemporalEvolution): string {
    const n = evo.samples.length;
    if (n === 0) return "No data yet.";
    const latest = evo.samples[n - 1]!;
    const avgRate = evo.samples.reduce((s, x) => s + x.successRate, 0) / n;
    const avgConf = evo.samples.reduce((s, x) => s + x.confidence, 0) / n;
    const avgLat = evo.samples.reduce((s, x) => s + x.latencyMs, 0) / n;
    const parts = [
      `Agent ${evo.agentId} (${evo.domain}): ${n} observations over session.`,
      `Current success rate: ${(latest.successRate * 100).toFixed(0)}% (avg: ${(avgRate * 100).toFixed(0)}%).`,
      `Confidence: ${latest.confidence.toFixed(0)} (avg: ${avgConf.toFixed(0)}).`,
      `Latency: ${latest.latencyMs.toFixed(0)}ms (avg: ${avgLat.toFixed(0)}ms).`,
      `Performance trend: ${evo.trend}.`,
    ];
    if (evo.trend === "declining") {
      parts.push("Self-reflection: Performance degradation detected. May need prompt tuning, model upgrade, or domain knowledge refresh.");
    } else if (evo.trend === "improving") {
      parts.push("Self-reflection: Positive trajectory — learning from interactions is bearing fruit.");
    } else if (evo.trend === "volatile") {
      parts.push("Self-reflection: High variance in outcomes. Consider query complexity analysis and specialization boundaries.");
    }
    return parts.join(" ");
  }

  getAgentEvolution(agentId?: string): AgentTemporalEvolution[] {
    if (agentId) {
      const evo = this.agentEvolution.get(agentId);
      return evo ? [evo] : [];
    }
    return Array.from(this.agentEvolution.values());
  }

  getState(): TemporalAwarenessState {
    const now = new Date();
    return {
      currentTime: now.toISOString(),
      sessionDuration: Date.now() - this.sessionStart,
      orchestrationCount: this.orchestrationTimestamps.length,
      averageOrchestrationInterval: this.getAverageInterval(),
      recentMarkers: this.markers.slice(-10).reverse(),
      detectedPatterns: Array.from(this.patterns.values()),
      timeOfDay: classifyTimeOfDay(now.getHours()),
      dayOfWeek: DAY_NAMES[now.getDay()]!,
      isBusinessHours: isBusinessHours(now),
      uptimeMs: Date.now() - this.sessionStart,
    };
  }

  buildTemporalContext(): string {
    const state = this.getState();
    const lines = [
      `## Temporal Awareness`,
      `Time: ${state.dayOfWeek} ${state.timeOfDay} (${state.isBusinessHours ? "business hours" : "off-hours"})`,
      `Session: ${(state.sessionDuration / 60000).toFixed(0)} min | Orchestrations: ${state.orchestrationCount}`,
    ];

    if (state.averageOrchestrationInterval > 0) {
      lines.push(`Avg interval: ${(state.averageOrchestrationInterval / 60000).toFixed(1)} min`);
    }

    const timeSinceLast = this.getTimeSinceLastOrchestration();
    if (timeSinceLast > 0 && state.averageOrchestrationInterval > 0) {
      const ratio = timeSinceLast / state.averageOrchestrationInterval;
      if (ratio > 3) {
        lines.push(`⚠ Unusually long gap since last orchestration (${(timeSinceLast / 60000).toFixed(0)} min — ${ratio.toFixed(1)}× average)`);
      }
    }

    if (state.detectedPatterns.length > 0) {
      lines.push(`Patterns: ${state.detectedPatterns.map(p => p.description).join("; ")}`);
    }

    return lines.join("\n");
  }
}

export const temporalAwareness = new TemporalAwarenessEngine();
