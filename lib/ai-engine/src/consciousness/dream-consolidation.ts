export interface DreamReplay {
  replayId: string;
  orchestrationId: string;
  query: string;
  domains: string[];
  agentPerformance: Array<{ agentId: string; confidence: number; success: boolean }>;
  outcome: 'positive' | 'neutral' | 'negative';
  timestamp: string;
}

export interface DiscoveredPattern {
  patternId: string;
  description: string;
  frequency: number;
  domains: string[];
  significance: 'low' | 'medium' | 'high';
  actionableInsight: string;
  discoveredAt: string;
}

export interface ConsolidationReport {
  reportId: string;
  cycleNumber: number;
  replaysProcessed: number;
  patternsDiscovered: DiscoveredPattern[];
  memoriesPruned: number;
  insightsGenerated: string[];
  selfModelUpdates: string[];
  goalEngineUpdates: string[];
  duration: number;
  timestamp: string;
}

export interface DreamConsolidationState {
  totalCycles: number;
  lastCycleTimestamp: string | null;
  replayBuffer: DreamReplay[];
  discoveredPatterns: DiscoveredPattern[];
  recentReports: ConsolidationReport[];
  isRunning: boolean;
  nextScheduledCycle: string | null;
}

class DreamConsolidationEngine {
  private replayBuffer: DreamReplay[] = [];
  private patterns: DiscoveredPattern[] = [];
  private reports: ConsolidationReport[] = [];
  private cycleCount = 0;
  private isRunning = false;
  private lastCycleTime: string | null = null;
  private cycleIntervalMs = 30 * 60 * 1000;
  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly MAX_REPLAY_BUFFER = 200;
  private static readonly MAX_PATTERNS = 50;
  private static readonly MAX_REPORTS = 20;

  addReplay(input: {
    orchestrationId: string;
    query: string;
    domains: string[];
    agentPerformance: Array<{ agentId: string; confidence: number; success: boolean }>;
    avgConfidence: number;
    validationPassed: boolean;
  }): void {
    const outcome: DreamReplay['outcome'] =
      input.avgConfidence > 70 && input.validationPassed
        ? 'positive'
        : input.avgConfidence < 40 || !input.validationPassed
          ? 'negative'
          : 'neutral';

    this.replayBuffer.push({
      replayId: `replay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      orchestrationId: input.orchestrationId,
      query: input.query.slice(0, 300),
      domains: input.domains,
      agentPerformance: input.agentPerformance,
      outcome,
      timestamp: new Date().toISOString(),
    });

    if (this.replayBuffer.length > DreamConsolidationEngine.MAX_REPLAY_BUFFER) {
      this.replayBuffer.splice(
        0,
        this.replayBuffer.length - DreamConsolidationEngine.MAX_REPLAY_BUFFER,
      );
    }
  }

  runConsolidationCycle(): ConsolidationReport {
    this.isRunning = true;
    const startTime = Date.now();
    this.cycleCount++;

    const replays = [...this.replayBuffer];
    const newPatterns = this.discoverPatterns(replays);
    const pruned = this.pruneRedundantMemories();
    const insights = this.generateInsights(replays, newPatterns);
    const selfModelUpdates = this.deriveSelfModelUpdates(replays);
    const goalUpdates = this.deriveGoalUpdates(replays, newPatterns);

    const report: ConsolidationReport = {
      reportId: `dream_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      cycleNumber: this.cycleCount,
      replaysProcessed: replays.length,
      patternsDiscovered: newPatterns,
      memoriesPruned: pruned,
      insightsGenerated: insights,
      selfModelUpdates,
      goalEngineUpdates: goalUpdates,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    this.reports.push(report);
    if (this.reports.length > DreamConsolidationEngine.MAX_REPORTS) {
      this.reports.splice(0, this.reports.length - DreamConsolidationEngine.MAX_REPORTS);
    }

    this.lastCycleTime = new Date().toISOString();
    this.isRunning = false;

    return report;
  }

  private discoverPatterns(replays: DreamReplay[]): DiscoveredPattern[] {
    const patterns: DiscoveredPattern[] = [];

    const domainCombos: Record<string, { count: number; outcomes: DreamReplay['outcome'][] }> = {};
    for (const r of replays) {
      const key = r.domains.sort().join('+');
      if (!domainCombos[key]) domainCombos[key] = { count: 0, outcomes: [] };
      domainCombos[key]!.count++;
      domainCombos[key]?.outcomes.push(r.outcome);
    }

    for (const [combo, data] of Object.entries(domainCombos)) {
      if (data.count >= 3) {
        const negativeRate = data.outcomes.filter((o) => o === 'negative').length / data.count;
        const positiveRate = data.outcomes.filter((o) => o === 'positive').length / data.count;

        if (negativeRate > 0.5) {
          patterns.push({
            patternId: `pat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            description: `Domain combination ${combo} has ${(negativeRate * 100).toFixed(0)}% failure rate across ${data.count} orchestrations`,
            frequency: data.count,
            domains: combo.split('+'),
            significance: negativeRate > 0.7 ? 'high' : 'medium',
            actionableInsight: `Investigate routing failures for ${combo} — may need specialized handling or agent tuning`,
            discoveredAt: new Date().toISOString(),
          });
        } else if (positiveRate > 0.8 && data.count >= 5) {
          patterns.push({
            patternId: `pat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            description: `Domain combination ${combo} is a strong performer: ${(positiveRate * 100).toFixed(0)}% success across ${data.count} orchestrations`,
            frequency: data.count,
            domains: combo.split('+'),
            significance: 'medium',
            actionableInsight: `Consider prioritizing ${combo} routing — proven high-success combination`,
            discoveredAt: new Date().toISOString(),
          });
        }
      }
    }

    const agentFailures: Record<string, number> = {};
    const agentTotal: Record<string, number> = {};
    for (const r of replays) {
      for (const ap of r.agentPerformance) {
        agentTotal[ap.agentId] = (agentTotal[ap.agentId] ?? 0) + 1;
        if (!ap.success) agentFailures[ap.agentId] = (agentFailures[ap.agentId] ?? 0) + 1;
      }
    }

    for (const [agent, total] of Object.entries(agentTotal)) {
      const failures = agentFailures[agent] ?? 0;
      const failRate = failures / total;
      if (failRate > 0.4 && total >= 5) {
        patterns.push({
          patternId: `pat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          description: `Agent ${agent} failing at ${(failRate * 100).toFixed(0)}% rate across ${total} invocations`,
          frequency: total,
          domains: [],
          significance: failRate > 0.6 ? 'high' : 'medium',
          actionableInsight: `Agent ${agent} needs investigation — possible prompt degradation, model drift, or domain coverage gap`,
          discoveredAt: new Date().toISOString(),
        });
      }
    }

    const timeSlots: Record<string, DreamReplay['outcome'][]> = {};
    for (const r of replays) {
      const hour = new Date(r.timestamp).getHours();
      const slot = hour < 8 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      if (!timeSlots[slot]) timeSlots[slot] = [];
      timeSlots[slot]?.push(r.outcome);
    }

    for (const [slot, outcomes] of Object.entries(timeSlots)) {
      if (outcomes.length >= 5) {
        const negRate = outcomes.filter((o) => o === 'negative').length / outcomes.length;
        if (negRate > 0.5) {
          patterns.push({
            patternId: `pat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            description: `Higher failure rate during ${slot} hours (${(negRate * 100).toFixed(0)}% negative across ${outcomes.length} orchestrations)`,
            frequency: outcomes.length,
            domains: [],
            significance: 'low',
            actionableInsight: `Performance degrades during ${slot} — possibly due to load patterns or data staleness`,
            discoveredAt: new Date().toISOString(),
          });
        }
      }
    }

    for (const p of patterns) {
      if (!this.patterns.some((ep) => ep.description === p.description)) {
        this.patterns.push(p);
      }
    }
    if (this.patterns.length > DreamConsolidationEngine.MAX_PATTERNS) {
      this.patterns = this.patterns
        .sort((a, b) => {
          const sigOrder = { high: 3, medium: 2, low: 1 };
          return sigOrder[b.significance] - sigOrder[a.significance] || b.frequency - a.frequency;
        })
        .slice(0, DreamConsolidationEngine.MAX_PATTERNS);
    }

    return patterns;
  }

  private pruneRedundantMemories(): number {
    const before = this.replayBuffer.length;

    if (this.replayBuffer.length > 100) {
      const queryHashes = new Map<string, number>();
      const toKeep: DreamReplay[] = [];

      for (const r of this.replayBuffer) {
        const hash = `${r.domains.sort().join('+')}:${r.outcome}:${r.query.slice(0, 50)}`;
        const count = queryHashes.get(hash) ?? 0;
        if (count < 3) {
          toKeep.push(r);
          queryHashes.set(hash, count + 1);
        }
      }

      this.replayBuffer = toKeep;
    }

    return before - this.replayBuffer.length;
  }

  private generateInsights(replays: DreamReplay[], patterns: DiscoveredPattern[]): string[] {
    const insights: string[] = [];

    const totalReplays = replays.length;
    if (totalReplays === 0) return insights;

    const positiveRate = replays.filter((r) => r.outcome === 'positive').length / totalReplays;
    const negativeRate = replays.filter((r) => r.outcome === 'negative').length / totalReplays;

    insights.push(
      `Overall performance: ${(positiveRate * 100).toFixed(0)}% positive, ${(negativeRate * 100).toFixed(0)}% negative across ${totalReplays} orchestrations`,
    );

    const highSigPatterns = patterns.filter((p) => p.significance === 'high');
    if (highSigPatterns.length > 0) {
      insights.push(
        `Critical patterns found: ${highSigPatterns.map((p) => p.description.slice(0, 80)).join('; ')}`,
      );
    }

    const allDomains = new Set(replays.flatMap((r) => r.domains));
    if (allDomains.size > 5) {
      insights.push(
        `Broad domain coverage: ${allDomains.size} domains active in recent orchestrations — system operating cross-domain`,
      );
    }

    return insights;
  }

  private deriveSelfModelUpdates(replays: DreamReplay[]): string[] {
    const updates: string[] = [];

    const agentStats: Record<string, { success: number; total: number }> = {};
    for (const r of replays) {
      for (const ap of r.agentPerformance) {
        if (!agentStats[ap.agentId]) agentStats[ap.agentId] = { success: 0, total: 0 };
        agentStats[ap.agentId]!.total++;
        if (ap.success) agentStats[ap.agentId]!.success++;
      }
    }

    for (const [agent, stats] of Object.entries(agentStats)) {
      const rate = stats.success / stats.total;
      if (rate < 0.5 && stats.total >= 3) {
        updates.push(
          `Flag ${agent} for weakness review (${(rate * 100).toFixed(0)}% success over ${stats.total} runs)`,
        );
      } else if (rate > 0.9 && stats.total >= 5) {
        updates.push(
          `Confirm ${agent} as strong performer (${(rate * 100).toFixed(0)}% success over ${stats.total} runs)`,
        );
      }
    }

    return updates;
  }

  private deriveGoalUpdates(replays: DreamReplay[], patterns: DiscoveredPattern[]): string[] {
    const updates: string[] = [];

    const failPatterns = patterns.filter(
      (p) => p.significance === 'high' && p.actionableInsight.includes('failure'),
    );
    for (const p of failPatterns.slice(0, 3)) {
      updates.push(`Create investigation goal: ${p.actionableInsight.slice(0, 100)}`);
    }

    const negativeReplays = replays.filter((r) => r.outcome === 'negative');
    if (negativeReplays.length > replays.length * 0.3) {
      updates.push(
        `System-wide performance concern: ${((negativeReplays.length / replays.length) * 100).toFixed(0)}% negative outcomes — create improvement goal`,
      );
    }

    return updates;
  }

  startScheduledCycles(intervalMs?: number): void {
    if (this.cycleTimer) return;
    if (intervalMs) this.cycleIntervalMs = intervalMs;

    this.cycleTimer = setInterval(() => {
      if (this.replayBuffer.length >= 5) {
        this.runConsolidationCycle();
      }
    }, this.cycleIntervalMs);
  }

  stopScheduledCycles(): void {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  getState(): DreamConsolidationState {
    return {
      totalCycles: this.cycleCount,
      lastCycleTimestamp: this.lastCycleTime,
      replayBuffer: this.replayBuffer.slice(-20),
      discoveredPatterns: [...this.patterns],
      recentReports: this.reports.slice(-5).reverse(),
      isRunning: this.isRunning,
      nextScheduledCycle: this.cycleTimer
        ? new Date(Date.now() + this.cycleIntervalMs).toISOString()
        : null,
    };
  }

  buildDreamContext(): string {
    if (this.cycleCount === 0) return '';

    const lines = [
      `## Dream Consolidation`,
      `Cycles: ${this.cycleCount} | Buffer: ${this.replayBuffer.length} replays`,
    ];

    if (this.lastCycleTime) {
      lines.push(`Last cycle: ${this.lastCycleTime}`);
    }

    if (this.patterns.length > 0) {
      const high = this.patterns.filter((p) => p.significance === 'high');
      if (high.length > 0) {
        lines.push(`Critical patterns: ${high.map((p) => p.description.slice(0, 80)).join('; ')}`);
      }
    }

    if (this.reports.length > 0) {
      const latest = this.reports[this.reports.length - 1]!;
      lines.push(
        `Latest cycle: ${latest.replaysProcessed} replays → ${latest.patternsDiscovered.length} patterns, ${latest.memoriesPruned} pruned`,
      );
    }

    return lines.join('\n');
  }
}

export const dreamConsolidation = new DreamConsolidationEngine();
