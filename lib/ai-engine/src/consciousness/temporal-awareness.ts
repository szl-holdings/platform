export interface TemporalMarker {
  markerId: string;
  label: string;
  timestamp: string;
  eventType: 'orchestration' | 'decision' | 'milestone' | 'deadline' | 'anomaly';
  metadata: Record<string, unknown>;
}

export interface TemporalPattern {
  patternId: string;
  description: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'irregular';
  lastOccurrence: string;
  occurrenceCount: number;
  predictedNext: string | null;
}

export interface ProspectiveMemoryItem {
  intentionId: string;
  description: string;
  triggerCondition: string;
  triggerType: 'temporal' | 'contextual' | 'event';
  scheduledFor: string | null;
  contextCue: string | null;
  status: 'pending' | 'triggered' | 'expired' | 'completed';
  action: string;
  createdAt: string;
  expiresAt: string;
}

export interface TemporalDiscount {
  discountId: string;
  decision: string;
  immediateValue: number;
  delayedValue: number;
  delayDays: number;
  discountedValue: number;
  recommendation: 'take_immediate' | 'wait_for_delayed' | 'indifferent';
  timestamp: string;
}

export interface EpisodicFutureSimulation {
  simulationId: string;
  scenario: string;
  timeHorizon: 'hours' | 'days' | 'weeks';
  predictedOutcomes: Array<{
    outcome: string;
    probability: number;
    impact: 'positive' | 'neutral' | 'negative';
  }>;
  strategicImplication: string;
  timestamp: string;
}

export interface TemporalAwarenessState {
  currentTime: string;
  sessionDuration: number;
  orchestrationCount: number;
  averageOrchestrationInterval: number;
  recentMarkers: TemporalMarker[];
  detectedPatterns: TemporalPattern[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  isBusinessHours: boolean;
  uptimeMs: number;
  prospectiveMemory: ProspectiveMemoryItem[];
  recentDiscounts: TemporalDiscount[];
  futureSimulations: EpisodicFutureSimulation[];
}

function classifyTimeOfDay(hour: number): TemporalAwarenessState['timeOfDay'] {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function isBusinessHours(date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface AgentTemporalEvolution {
  agentId: string;
  domain: string;
  samples: Array<{ timestamp: number; successRate: number; confidence: number; latencyMs: number }>;
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  selfReflection: string;
}

class TemporalAwarenessEngine {
  private markers: TemporalMarker[] = [];
  private patterns: Map<string, TemporalPattern> = new Map();
  private orchestrationTimestamps: number[] = [];
  private agentEvolution: Map<string, AgentTemporalEvolution> = new Map();
  private prospective: ProspectiveMemoryItem[] = [];
  private discounts: TemporalDiscount[] = [];
  private simulations: EpisodicFutureSimulation[] = [];
  private sessionStart = Date.now();
  private static readonly MAX_MARKERS = 500;
  private static readonly MAX_TIMESTAMPS = 1000;
  private static readonly MAX_EVOLUTION_SAMPLES = 100;
  private static readonly MAX_PROSPECTIVE = 30;
  private static readonly MAX_DISCOUNTS = 20;
  private static readonly MAX_SIMULATIONS = 15;

  recordMarker(
    label: string,
    eventType: TemporalMarker['eventType'],
    metadata: Record<string, unknown> = {},
  ): TemporalMarker {
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

    if (eventType === 'orchestration') {
      this.orchestrationTimestamps.push(Date.now());
      if (this.orchestrationTimestamps.length > TemporalAwarenessEngine.MAX_TIMESTAMPS) {
        this.orchestrationTimestamps.splice(
          0,
          this.orchestrationTimestamps.length - TemporalAwarenessEngine.MAX_TIMESTAMPS,
        );
      }
    }

    this.detectPatterns();
    this.checkProspectiveMemory();
    return marker;
  }

  scheduleIntention(input: {
    description: string;
    triggerType: ProspectiveMemoryItem['triggerType'];
    scheduledFor?: string;
    contextCue?: string;
    action: string;
    ttlHours?: number;
  }): ProspectiveMemoryItem {
    const ttl = (input.ttlHours ?? 24) * 3600 * 1000;
    const item: ProspectiveMemoryItem = {
      intentionId: `intent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      description: input.description,
      triggerCondition:
        input.triggerType === 'temporal'
          ? `At ${input.scheduledFor ?? 'unspecified time'}`
          : `When context matches: ${input.contextCue ?? 'unspecified cue'}`,
      triggerType: input.triggerType,
      scheduledFor: input.scheduledFor ?? null,
      contextCue: input.contextCue ?? null,
      status: 'pending',
      action: input.action,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttl).toISOString(),
    };

    this.prospective.push(item);
    if (this.prospective.length > TemporalAwarenessEngine.MAX_PROSPECTIVE) {
      this.prospective = this.prospective
        .filter((p) => p.status === 'pending')
        .slice(-TemporalAwarenessEngine.MAX_PROSPECTIVE);
    }

    return item;
  }

  checkProspectiveMemory(contextQuery?: string): ProspectiveMemoryItem[] {
    const now = new Date();
    const triggered: ProspectiveMemoryItem[] = [];

    for (const item of this.prospective) {
      if (item.status !== 'pending') continue;

      if (new Date(item.expiresAt) < now) {
        item.status = 'expired';
        continue;
      }

      if (item.triggerType === 'temporal' && item.scheduledFor) {
        if (new Date(item.scheduledFor) <= now) {
          item.status = 'triggered';
          triggered.push(item);
        }
      }

      if (item.triggerType === 'contextual' && item.contextCue && contextQuery) {
        const cueWords = item.contextCue
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3);
        const queryLower = contextQuery.toLowerCase();
        const matchCount = cueWords.filter((w) => queryLower.includes(w)).length;
        if (matchCount >= Math.ceil(cueWords.length * 0.4) && cueWords.length > 0) {
          item.status = 'triggered';
          triggered.push(item);
        }
      }
    }

    return triggered;
  }

  computeTemporalDiscount(input: {
    decision: string;
    immediateValue: number;
    delayedValue: number;
    delayDays: number;
    discountRate?: number;
  }): TemporalDiscount {
    const k = input.discountRate ?? 0.05;
    const discountedValue = input.delayedValue / (1 + k * input.delayDays);

    let recommendation: TemporalDiscount['recommendation'];
    if (discountedValue > input.immediateValue * 1.1) {
      recommendation = 'wait_for_delayed';
    } else if (input.immediateValue > discountedValue * 1.1) {
      recommendation = 'take_immediate';
    } else {
      recommendation = 'indifferent';
    }

    const discount: TemporalDiscount = {
      discountId: `disc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      decision: input.decision.slice(0, 200),
      immediateValue: input.immediateValue,
      delayedValue: input.delayedValue,
      delayDays: input.delayDays,
      discountedValue: Math.round(discountedValue * 100) / 100,
      recommendation,
      timestamp: new Date().toISOString(),
    };

    this.discounts.push(discount);
    if (this.discounts.length > TemporalAwarenessEngine.MAX_DISCOUNTS) {
      this.discounts.splice(0, this.discounts.length - TemporalAwarenessEngine.MAX_DISCOUNTS);
    }

    return discount;
  }

  simulateFuture(input: {
    scenario: string;
    timeHorizon: EpisodicFutureSimulation['timeHorizon'];
    currentState: { confidence: number; conflictCount: number; agentHealth: string };
  }): EpisodicFutureSimulation {
    const outcomes: EpisodicFutureSimulation['predictedOutcomes'] = [];

    if (input.currentState.confidence > 70) {
      outcomes.push({
        outcome: 'Continued high performance with stable routing',
        probability: 0.6,
        impact: 'positive',
      });
      outcomes.push({
        outcome: 'Gradual confidence drift without recalibration',
        probability: 0.25,
        impact: 'negative',
      });
    } else {
      outcomes.push({
        outcome: 'Performance recovery through learning adaptation',
        probability: 0.4,
        impact: 'positive',
      });
      outcomes.push({
        outcome: 'Continued degradation requiring human intervention',
        probability: 0.35,
        impact: 'negative',
      });
    }

    if (input.currentState.conflictCount > 2) {
      outcomes.push({
        outcome: 'Agent conflicts escalate to systematic disagreement',
        probability: 0.3,
        impact: 'negative',
      });
    }

    outcomes.push({
      outcome: 'Novel cross-domain insight emerges from current patterns',
      probability: 0.15,
      impact: 'positive',
    });

    const bestOutcome = outcomes.find((o) => o.impact === 'positive' && o.probability > 0.3);
    const worstOutcome = outcomes.find((o) => o.impact === 'negative' && o.probability > 0.3);

    const strategicImplication = bestOutcome
      ? `Best path: ${bestOutcome.outcome} (${(bestOutcome.probability * 100).toFixed(0)}%). ${worstOutcome ? `Watch for: ${worstOutcome.outcome}.` : ''}`
      : 'No high-probability positive outcome — consider strategy adjustment.';

    const sim: EpisodicFutureSimulation = {
      simulationId: `future_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      scenario: input.scenario.slice(0, 200),
      timeHorizon: input.timeHorizon,
      predictedOutcomes: outcomes,
      strategicImplication,
      timestamp: new Date().toISOString(),
    };

    this.simulations.push(sim);
    if (this.simulations.length > TemporalAwarenessEngine.MAX_SIMULATIONS) {
      this.simulations.splice(0, this.simulations.length - TemporalAwarenessEngine.MAX_SIMULATIONS);
    }

    return sim;
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
    const stdDev = Math.sqrt(
      intervals.reduce((s, i) => s + (i - avgInterval) ** 2, 0) / intervals.length,
    );
    const cv = stdDev / Math.max(1, avgInterval);

    if (cv < 0.5) {
      let frequency: TemporalPattern['frequency'] = 'irregular';
      if (avgInterval < 2 * 3600 * 1000) frequency = 'hourly';
      else if (avgInterval < 48 * 3600 * 1000) frequency = 'daily';
      else if (avgInterval < 10 * 24 * 3600 * 1000) frequency = 'weekly';

      const predictedNext = new Date(Date.now() + avgInterval).toISOString();

      this.patterns.set('orchestration_cadence', {
        patternId: 'orchestration_cadence',
        description: `Orchestrations occur at ~${frequency} intervals (avg ${(avgInterval / 60000).toFixed(0)} min apart)`,
        frequency,
        lastOccurrence: new Date(
          this.orchestrationTimestamps[this.orchestrationTimestamps.length - 1]!,
        ).toISOString(),
        occurrenceCount: this.orchestrationTimestamps.length,
        predictedNext,
      });
    }

    const hours = this.orchestrationTimestamps.map((t) => new Date(t).getHours());
    const hourCounts: Record<number, number> = {};
    for (const h of hours) {
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    }
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    if (peakHour && peakHour[1] > this.orchestrationTimestamps.length * 0.2) {
      this.patterns.set('peak_usage', {
        patternId: 'peak_usage',
        description: `Peak usage at hour ${peakHour[0]} (${peakHour[1]} orchestrations, ${((peakHour[1] / this.orchestrationTimestamps.length) * 100).toFixed(0)}% of total)`,
        frequency: 'daily',
        lastOccurrence: new Date().toISOString(),
        occurrenceCount: Number(peakHour[1]),
        predictedNext: null,
      });
    }
  }

  recordAgentPerformance(
    agentId: string,
    domain: string,
    successRate: number,
    confidence: number,
    latencyMs: number,
  ): void {
    let evo = this.agentEvolution.get(agentId);
    if (!evo) {
      evo = { agentId, domain, samples: [], trend: 'stable', selfReflection: '' };
      this.agentEvolution.set(agentId, evo);
    }
    evo.samples.push({ timestamp: Date.now(), successRate, confidence, latencyMs });
    if (evo.samples.length > TemporalAwarenessEngine.MAX_EVOLUTION_SAMPLES) {
      evo.samples.splice(0, evo.samples.length - TemporalAwarenessEngine.MAX_EVOLUTION_SAMPLES);
    }
    evo.trend = this.computeTrend(evo.samples);
    evo.selfReflection = this.generateSelfReflection(evo);
  }

  private computeTrend(
    samples: AgentTemporalEvolution['samples'],
  ): AgentTemporalEvolution['trend'] {
    if (samples.length < 3) return 'stable';
    const recentHalf = samples.slice(-Math.floor(samples.length / 2));
    const olderHalf = samples.slice(0, Math.floor(samples.length / 2));
    const recentAvg = recentHalf.reduce((s, x) => s + x.successRate, 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((s, x) => s + x.successRate, 0) / olderHalf.length;
    const diff = recentAvg - olderAvg;
    const stdDev = Math.sqrt(
      recentHalf.reduce((s, x) => s + (x.successRate - recentAvg) ** 2, 0) / recentHalf.length,
    );
    if (stdDev > 0.25) return 'volatile';
    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
  }

  private generateSelfReflection(evo: AgentTemporalEvolution): string {
    const n = evo.samples.length;
    if (n === 0) return 'No data yet.';
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
    if (evo.trend === 'declining') {
      parts.push(
        'Self-reflection: Performance degradation detected. May need prompt tuning, model upgrade, or domain knowledge refresh.',
      );
    } else if (evo.trend === 'improving') {
      parts.push(
        'Self-reflection: Positive trajectory — learning from interactions is bearing fruit.',
      );
    } else if (evo.trend === 'volatile') {
      parts.push(
        'Self-reflection: High variance in outcomes. Consider query complexity analysis and specialization boundaries.',
      );
    }
    return parts.join(' ');
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
      prospectiveMemory: this.prospective.filter((p) => p.status === 'pending').slice(-10),
      recentDiscounts: this.discounts.slice(-5).reverse(),
      futureSimulations: this.simulations.slice(-3).reverse(),
    };
  }

  buildTemporalContext(): string {
    const state = this.getState();
    const lines = [
      `## Temporal Awareness`,
      `Time: ${state.dayOfWeek} ${state.timeOfDay} (${state.isBusinessHours ? 'business hours' : 'off-hours'})`,
      `Session: ${(state.sessionDuration / 60000).toFixed(0)} min | Orchestrations: ${state.orchestrationCount}`,
    ];

    if (state.averageOrchestrationInterval > 0) {
      lines.push(`Avg interval: ${(state.averageOrchestrationInterval / 60000).toFixed(1)} min`);
    }

    const timeSinceLast = this.getTimeSinceLastOrchestration();
    if (timeSinceLast > 0 && state.averageOrchestrationInterval > 0) {
      const ratio = timeSinceLast / state.averageOrchestrationInterval;
      if (ratio > 3) {
        lines.push(
          `⚠ Unusually long gap since last orchestration (${(timeSinceLast / 60000).toFixed(0)} min — ${ratio.toFixed(1)}× average)`,
        );
      }
    }

    if (state.detectedPatterns.length > 0) {
      lines.push(`Patterns: ${state.detectedPatterns.map((p) => p.description).join('; ')}`);
    }

    const pendingIntentions = state.prospectiveMemory;
    if (pendingIntentions.length > 0) {
      lines.push(`Prospective memory: ${pendingIntentions.length} pending intention(s)`);
    }

    return lines.join('\n');
  }
}

export const temporalAwareness = new TemporalAwarenessEngine();
