export type GoalPriority = 'critical' | 'high' | 'medium' | 'low' | 'exploratory';
export type GoalStatus = 'active' | 'completed' | 'blocked' | 'deferred' | 'abandoned';

export interface CognitiveGoal {
  goalId: string;
  title: string;
  description: string;
  priority: GoalPriority;
  status: GoalStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  parentGoalId: string | null;
  subGoalIds: string[];
  tags: string[];
  blockedBy: string[];
  curiosityDriven: boolean;
  successCriteria: string;
}

export interface CuriositySignal {
  signalId: string;
  topic: string;
  intensity: number;
  source: 'knowledge_gap' | 'anomaly' | 'pattern' | 'user_interest' | 'cross_domain';
  suggestedExploration: string;
  timestamp: string;
}

export interface IntrinsicMotivation {
  informationGain: number;
  competenceGrowth: number;
  noveltySeeking: number;
  overallDrive: number;
  timestamp: string;
}

export interface GoalInterference {
  interferenceId: string;
  goalA: string;
  goalB: string;
  conflictType: 'resource' | 'temporal' | 'logical' | 'priority';
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolution: string | null;
  timestamp: string;
}

export interface MetaGoal {
  metaGoalId: string;
  title: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  trend: 'improving' | 'stable' | 'declining';
  timestamp: string;
}

export interface GoalEngineState {
  activeGoals: CognitiveGoal[];
  completedGoals: number;
  blockedGoals: CognitiveGoal[];
  curiosityQueue: CuriositySignal[];
  topPriority: CognitiveGoal | null;
  overallProgress: number;
  intrinsicMotivation: IntrinsicMotivation;
  goalInterferences: GoalInterference[];
  metaGoals: MetaGoal[];
}

const PRIORITY_WEIGHTS: Record<GoalPriority, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  exploratory: 1,
};

class GoalFormationEngine {
  private goals: Map<string, CognitiveGoal> = new Map();
  private curiosityQueue: CuriositySignal[] = [];
  private completedCount = 0;
  private interferences: GoalInterference[] = [];
  private metaGoals: MetaGoal[] = [];
  private motivation: IntrinsicMotivation = {
    informationGain: 0.5,
    competenceGrowth: 0.5,
    noveltySeeking: 0.5,
    overallDrive: 0.5,
    timestamp: new Date().toISOString(),
  };
  private noveltyHistory: string[] = [];
  private static readonly MAX_ACTIVE_GOALS = 20;
  private static readonly MAX_CURIOSITY = 30;
  private static readonly MAX_INTERFERENCES = 20;
  private static readonly MAX_META_GOALS = 10;
  private static readonly MOTIVATION_ALPHA = 0.1;

  createGoal(input: {
    title: string;
    description: string;
    priority: GoalPriority;
    parentGoalId?: string;
    tags?: string[];
    curiosityDriven?: boolean;
    successCriteria: string;
  }): CognitiveGoal {
    const now = new Date().toISOString();
    const goal: CognitiveGoal = {
      goalId: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: 'active',
      progress: 0,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      parentGoalId: input.parentGoalId ?? null,
      subGoalIds: [],
      tags: input.tags ?? [],
      blockedBy: [],
      curiosityDriven: input.curiosityDriven ?? false,
      successCriteria: input.successCriteria,
    };

    if (input.parentGoalId) {
      const parent = this.goals.get(input.parentGoalId);
      if (parent) parent.subGoalIds.push(goal.goalId);
    }

    this.goals.set(goal.goalId, goal);
    this.enforceCapacity();
    this.detectInterferences();
    return goal;
  }

  updateProgress(goalId: string, progress: number): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.progress = Math.max(0, Math.min(100, progress));
    goal.updatedAt = new Date().toISOString();

    if (goal.progress >= 100 && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAt = new Date().toISOString();
      this.completedCount++;
      this.updateMotivation('competenceGrowth', 0.1);
    }
  }

  blockGoal(goalId: string, blockedBy: string): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;
    goal.status = 'blocked';
    if (!goal.blockedBy.includes(blockedBy)) goal.blockedBy.push(blockedBy);
    goal.updatedAt = new Date().toISOString();
  }

  unblockGoal(goalId: string, dependency: string): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;
    goal.blockedBy = goal.blockedBy.filter((b) => b !== dependency);
    if (goal.blockedBy.length === 0 && goal.status === 'blocked') {
      goal.status = 'active';
    }
    goal.updatedAt = new Date().toISOString();
  }

  registerCuriosity(input: {
    topic: string;
    intensity: number;
    source: CuriositySignal['source'];
    suggestedExploration: string;
  }): CuriositySignal {
    const signal: CuriositySignal = {
      signalId: `curiosity_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      topic: input.topic,
      intensity: Math.max(0, Math.min(1, input.intensity)),
      source: input.source,
      suggestedExploration: input.suggestedExploration,
      timestamp: new Date().toISOString(),
    };

    this.curiosityQueue.push(signal);
    this.curiosityQueue.sort((a, b) => b.intensity - a.intensity);
    if (this.curiosityQueue.length > GoalFormationEngine.MAX_CURIOSITY) {
      this.curiosityQueue = this.curiosityQueue.slice(0, GoalFormationEngine.MAX_CURIOSITY);
    }

    this.updateMotivation('noveltySeeking', input.intensity * 0.05);

    return signal;
  }

  promoteCuriosityToGoal(signalId: string): CognitiveGoal | null {
    const idx = this.curiosityQueue.findIndex((s) => s.signalId === signalId);
    if (idx < 0) return null;
    const signal = this.curiosityQueue.splice(idx, 1)[0]!;

    return this.createGoal({
      title: `Explore: ${signal.topic}`,
      description: signal.suggestedExploration,
      priority: signal.intensity > 0.7 ? 'medium' : 'exploratory',
      curiosityDriven: true,
      tags: [signal.source, signal.topic.split(' ')[0]?.toLowerCase() ?? 'exploration'],
      successCriteria: `Knowledge gap resolved for: ${signal.topic}`,
    });
  }

  updateMotivation(
    dimension: 'informationGain' | 'competenceGrowth' | 'noveltySeeking',
    delta: number,
  ): void {
    const alpha = GoalFormationEngine.MOTIVATION_ALPHA;
    this.motivation[dimension] = Math.max(
      0,
      Math.min(
        1,
        this.motivation[dimension] * (1 - alpha) + (this.motivation[dimension] + delta) * alpha,
      ),
    );
    this.motivation.overallDrive =
      this.motivation.informationGain * 0.35 +
      this.motivation.competenceGrowth * 0.35 +
      this.motivation.noveltySeeking * 0.3;
    this.motivation.timestamp = new Date().toISOString();
  }

  recordInformationGain(queryDomains: string[], knowledgeGapsClosed: number): void {
    const gain = Math.min(0.2, knowledgeGapsClosed * 0.05);
    this.updateMotivation('informationGain', gain);

    const novelKey = queryDomains.sort().join('+');
    if (!this.noveltyHistory.includes(novelKey)) {
      this.noveltyHistory.push(novelKey);
      if (this.noveltyHistory.length > 100) this.noveltyHistory.shift();
      this.updateMotivation('noveltySeeking', 0.05);
    } else {
      this.updateMotivation('noveltySeeking', -0.02);
    }
  }

  private detectInterferences(): void {
    const active = Array.from(this.goals.values()).filter((g) => g.status === 'active');
    const newInterferences: GoalInterference[] = [];

    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i]!;
        const b = active[j]!;

        if (a.priority === 'critical' && b.priority === 'critical') {
          newInterferences.push({
            interferenceId: `intrf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            goalA: a.goalId,
            goalB: b.goalId,
            conflictType: 'resource',
            description: `Both "${a.title.slice(0, 40)}" and "${b.title.slice(0, 40)}" are critical — resource contention likely.`,
            severity: 'high',
            resolution: null,
            timestamp: new Date().toISOString(),
          });
        }

        const tagOverlap = a.tags.filter((t) => b.tags.includes(t));
        if (
          tagOverlap.length > 0 &&
          PRIORITY_WEIGHTS[a.priority] !== PRIORITY_WEIGHTS[b.priority]
        ) {
          const diff = Math.abs(PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority]);
          if (diff >= 2) {
            newInterferences.push({
              interferenceId: `intrf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              goalA: a.goalId,
              goalB: b.goalId,
              conflictType: 'priority',
              description: `Goals share domain tags (${tagOverlap.join(', ')}) but have competing priorities (${a.priority} vs ${b.priority}).`,
              severity: diff >= 3 ? 'high' : 'medium',
              resolution: null,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    this.interferences = newInterferences.slice(0, GoalFormationEngine.MAX_INTERFERENCES);
  }

  updateMetaGoals(): void {
    const active = Array.from(this.goals.values()).filter((g) => g.status === 'active');
    const completed = this.completedCount;
    const totalCreated = this.goals.size;
    const completionRate = totalCreated > 0 ? completed / totalCreated : 0;
    const _avgProgress =
      active.length > 0 ? active.reduce((s, g) => s + g.progress, 0) / active.length : 0;

    this.metaGoals = [
      {
        metaGoalId: 'meta_completion_rate',
        title: 'Goal Completion Rate',
        metric: 'completion_rate',
        currentValue: completionRate,
        targetValue: 0.7,
        trend: completionRate > 0.5 ? 'improving' : completionRate < 0.3 ? 'declining' : 'stable',
        timestamp: new Date().toISOString(),
      },
      {
        metaGoalId: 'meta_curiosity_conversion',
        title: 'Curiosity → Goal Conversion',
        metric: 'curiosity_to_goal_ratio',
        currentValue:
          this.curiosityQueue.length > 0
            ? active.filter((g) => g.curiosityDriven).length / this.curiosityQueue.length
            : 0,
        targetValue: 0.3,
        trend: 'stable',
        timestamp: new Date().toISOString(),
      },
      {
        metaGoalId: 'meta_interference_rate',
        title: 'Goal Interference Rate',
        metric: 'interference_count',
        currentValue: this.interferences.length,
        targetValue: 0,
        trend: this.interferences.length > 3 ? 'declining' : 'stable',
        timestamp: new Date().toISOString(),
      },
    ];

    if (this.metaGoals.length > GoalFormationEngine.MAX_META_GOALS) {
      this.metaGoals = this.metaGoals.slice(0, GoalFormationEngine.MAX_META_GOALS);
    }
  }

  detectGoalsFromOrchestration(
    _query: string,
    domains: string[],
    knowledgeGaps: string[],
    confusionSignals: string[],
  ): void {
    for (const gap of knowledgeGaps) {
      this.registerCuriosity({
        topic: gap,
        intensity: 0.6,
        source: 'knowledge_gap',
        suggestedExploration: `Investigate: ${gap}`,
      });
    }

    if (domains.length > 2) {
      this.registerCuriosity({
        topic: `Cross-domain interaction: ${domains.join(' × ')}`,
        intensity: 0.5,
        source: 'cross_domain',
        suggestedExploration: `Explore synergies and dependencies between ${domains.join(', ')}`,
      });
    }

    if (confusionSignals.length >= 2) {
      this.registerCuriosity({
        topic: `Recurring confusion pattern`,
        intensity: 0.7,
        source: 'anomaly',
        suggestedExploration: `Diagnose root cause of confusion: ${confusionSignals[0]}`,
      });
    }

    this.recordInformationGain(domains, knowledgeGaps.length > 0 ? 0 : 1);
    this.updateMetaGoals();
  }

  integratePatternDetectorAlerts(
    patterns: Array<{
      dimension: string;
      value: string;
      count: number;
      significance: 'high' | 'medium' | 'low';
      summary: string;
    }>,
  ): void {
    for (const pattern of patterns) {
      if (
        pattern.significance === 'high' ||
        (pattern.significance === 'medium' && pattern.count >= 3)
      ) {
        this.registerCuriosity({
          topic: `Pattern: ${pattern.dimension}=${pattern.value} (${pattern.count} occurrences)`,
          intensity: pattern.significance === 'high' ? 0.9 : 0.6,
          source: 'pattern',
          suggestedExploration: pattern.summary,
        });
      }

      if (pattern.significance === 'high' && pattern.count >= 5) {
        this.createGoal({
          title: `Address recurring pattern: ${pattern.dimension}`,
          description: `${pattern.summary}. This pattern has been detected ${pattern.count} times with high significance — requires systematic investigation.`,
          priority: 'high',
          tags: [pattern.dimension, pattern.value, 'pattern_detector'],
          successCriteria: `Pattern occurrence rate reduced or root cause identified for ${pattern.dimension}=${pattern.value}`,
        });
      }
    }
  }

  integrateTrajectoryInsights(
    trajectories: Array<{
      query: string;
      averageConfidence: number;
      agentRouting: Array<{ agentId: string; domain: string }>;
      validationPassed: boolean;
      qualityScore: number | null;
    }>,
  ): void {
    if (trajectories.length < 3) return;

    const domainPerformance: Record<string, { total: number; lowConf: number }> = {};
    for (const t of trajectories) {
      for (const r of t.agentRouting) {
        if (!domainPerformance[r.domain]) domainPerformance[r.domain] = { total: 0, lowConf: 0 };
        domainPerformance[r.domain]!.total++;
        if (t.averageConfidence < 50) domainPerformance[r.domain]!.lowConf++;
      }
    }

    for (const [domain, stats] of Object.entries(domainPerformance)) {
      const failRate = stats.lowConf / stats.total;
      if (failRate > 0.3 && stats.total >= 3) {
        this.registerCuriosity({
          topic: `${domain} domain underperformance (${(failRate * 100).toFixed(0)}% low confidence)`,
          intensity: Math.min(1, failRate + 0.2),
          source: 'pattern',
          suggestedExploration: `Investigate recurring low-confidence responses in ${domain} domain. Review prompt effectiveness and knowledge coverage.`,
        });
      }
    }

    const failedValidations = trajectories.filter((t) => !t.validationPassed);
    if (failedValidations.length >= 2) {
      this.registerCuriosity({
        topic: `Validation failure pattern (${failedValidations.length}/${trajectories.length})`,
        intensity: 0.8,
        source: 'anomaly',
        suggestedExploration: `Multiple orchestrations failed validation. Analyze common patterns in: ${failedValidations.map((f) => f.query.slice(0, 40)).join('; ')}`,
      });
    }
  }

  getTopPriority(): CognitiveGoal | null {
    const active = Array.from(this.goals.values())
      .filter((g) => g.status === 'active')
      .sort((a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]);
    return active[0] ?? null;
  }

  getState(): GoalEngineState {
    const allGoals = Array.from(this.goals.values());
    const active = allGoals.filter((g) => g.status === 'active');
    const blocked = allGoals.filter((g) => g.status === 'blocked');
    const totalProgress =
      active.length > 0 ? active.reduce((s, g) => s + g.progress, 0) / active.length : 0;

    return {
      activeGoals: active.sort(
        (a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority],
      ),
      completedGoals: this.completedCount,
      blockedGoals: blocked,
      curiosityQueue: [...this.curiosityQueue],
      topPriority: this.getTopPriority(),
      overallProgress: totalProgress,
      intrinsicMotivation: { ...this.motivation },
      goalInterferences: [...this.interferences],
      metaGoals: [...this.metaGoals],
    };
  }

  buildGoalContext(): string {
    const state = this.getState();
    if (state.activeGoals.length === 0 && state.curiosityQueue.length === 0) return '';

    const lines = [`## Goal Engine`];

    if (state.topPriority) {
      lines.push(
        `Top priority: [${state.topPriority.priority}] ${state.topPriority.title} (${state.topPriority.progress}%)`,
      );
    }
    lines.push(
      `Active: ${state.activeGoals.length} | Blocked: ${state.blockedGoals.length} | Completed: ${state.completedGoals}`,
    );

    if (state.curiosityQueue.length > 0) {
      const top = state.curiosityQueue.slice(0, 3);
      lines.push(
        `Curiosity queue: ${top.map((c) => `${c.topic} (${(c.intensity * 100).toFixed(0)}%)`).join(', ')}`,
      );
    }

    lines.push(
      `Motivation: info=${(state.intrinsicMotivation.informationGain * 100).toFixed(0)}% comp=${(state.intrinsicMotivation.competenceGrowth * 100).toFixed(0)}% novel=${(state.intrinsicMotivation.noveltySeeking * 100).toFixed(0)}%`,
    );

    if (state.goalInterferences.length > 0) {
      lines.push(`⚠ ${state.goalInterferences.length} goal interference(s) detected`);
    }

    return lines.join('\n');
  }

  private enforceCapacity(): void {
    const active = Array.from(this.goals.values()).filter((g) => g.status === 'active');
    if (active.length <= GoalFormationEngine.MAX_ACTIVE_GOALS) return;

    active.sort((a, b) => PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority]);
    const toDefer = active.slice(0, active.length - GoalFormationEngine.MAX_ACTIVE_GOALS);
    for (const goal of toDefer) {
      goal.status = 'deferred';
      goal.updatedAt = new Date().toISOString();
    }
  }
}

export const goalEngine = new GoalFormationEngine();
