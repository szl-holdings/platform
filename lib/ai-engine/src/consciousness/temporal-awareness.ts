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

class TemporalAwarenessEngine {
  private markers: TemporalMarker[] = [];
  private patterns: Map<string, TemporalPattern> = new Map();
  private orchestrationTimestamps: number[] = [];
  private sessionStart = Date.now();
  private static readonly MAX_MARKERS = 500;
  private static readonly MAX_TIMESTAMPS = 1000;

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
