export type GoalPriority = "critical" | "high" | "medium" | "low" | "exploratory";
export type GoalStatus = "active" | "completed" | "blocked" | "deferred" | "abandoned";

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
  source: "knowledge_gap" | "anomaly" | "pattern" | "user_interest" | "cross_domain";
  suggestedExploration: string;
  timestamp: string;
}

export interface GoalEngineState {
  activeGoals: CognitiveGoal[];
  completedGoals: number;
  blockedGoals: CognitiveGoal[];
  curiosityQueue: CuriositySignal[];
  topPriority: CognitiveGoal | null;
  overallProgress: number;
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
  private static readonly MAX_ACTIVE_GOALS = 20;
  private static readonly MAX_CURIOSITY = 30;

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
      status: "active",
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
    return goal;
  }

  updateProgress(goalId: string, progress: number): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.progress = Math.max(0, Math.min(100, progress));
    goal.updatedAt = new Date().toISOString();

    if (goal.progress >= 100 && goal.status === "active") {
      goal.status = "completed";
      goal.completedAt = new Date().toISOString();
      this.completedCount++;
    }
  }

  blockGoal(goalId: string, blockedBy: string): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;
    goal.status = "blocked";
    if (!goal.blockedBy.includes(blockedBy)) goal.blockedBy.push(blockedBy);
    goal.updatedAt = new Date().toISOString();
  }

  unblockGoal(goalId: string, dependency: string): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;
    goal.blockedBy = goal.blockedBy.filter(b => b !== dependency);
    if (goal.blockedBy.length === 0 && goal.status === "blocked") {
      goal.status = "active";
    }
    goal.updatedAt = new Date().toISOString();
  }

  registerCuriosity(input: {
    topic: string;
    intensity: number;
    source: CuriositySignal["source"];
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

    return signal;
  }

  promoteCuriosityToGoal(signalId: string): CognitiveGoal | null {
    const idx = this.curiosityQueue.findIndex(s => s.signalId === signalId);
    if (idx < 0) return null;
    const signal = this.curiosityQueue.splice(idx, 1)[0]!;

    return this.createGoal({
      title: `Explore: ${signal.topic}`,
      description: signal.suggestedExploration,
      priority: signal.intensity > 0.7 ? "medium" : "exploratory",
      curiosityDriven: true,
      tags: [signal.source, signal.topic.split(" ")[0]?.toLowerCase() ?? "exploration"],
      successCriteria: `Knowledge gap resolved for: ${signal.topic}`,
    });
  }

  detectGoalsFromOrchestration(
    query: string,
    domains: string[],
    knowledgeGaps: string[],
    confusionSignals: string[],
  ): void {
    for (const gap of knowledgeGaps) {
      this.registerCuriosity({
        topic: gap,
        intensity: 0.6,
        source: "knowledge_gap",
        suggestedExploration: `Investigate: ${gap}`,
      });
    }

    if (domains.length > 2) {
      this.registerCuriosity({
        topic: `Cross-domain interaction: ${domains.join(" × ")}`,
        intensity: 0.5,
        source: "cross_domain",
        suggestedExploration: `Explore synergies and dependencies between ${domains.join(", ")}`,
      });
    }

    if (confusionSignals.length >= 2) {
      this.registerCuriosity({
        topic: `Recurring confusion pattern`,
        intensity: 0.7,
        source: "anomaly",
        suggestedExploration: `Diagnose root cause of confusion: ${confusionSignals[0]}`,
      });
    }
  }

  getTopPriority(): CognitiveGoal | null {
    const active = Array.from(this.goals.values())
      .filter(g => g.status === "active")
      .sort((a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]);
    return active[0] ?? null;
  }

  getState(): GoalEngineState {
    const allGoals = Array.from(this.goals.values());
    const active = allGoals.filter(g => g.status === "active");
    const blocked = allGoals.filter(g => g.status === "blocked");
    const totalProgress = active.length > 0
      ? active.reduce((s, g) => s + g.progress, 0) / active.length
      : 0;

    return {
      activeGoals: active.sort((a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]),
      completedGoals: this.completedCount,
      blockedGoals: blocked,
      curiosityQueue: [...this.curiosityQueue],
      topPriority: this.getTopPriority(),
      overallProgress: totalProgress,
    };
  }

  buildGoalContext(): string {
    const state = this.getState();
    if (state.activeGoals.length === 0 && state.curiosityQueue.length === 0) return "";

    const lines = [`## Goal Engine`];

    if (state.topPriority) {
      lines.push(`Top priority: [${state.topPriority.priority}] ${state.topPriority.title} (${state.topPriority.progress}%)`);
    }
    lines.push(`Active: ${state.activeGoals.length} | Blocked: ${state.blockedGoals.length} | Completed: ${state.completedGoals}`);

    if (state.curiosityQueue.length > 0) {
      const top = state.curiosityQueue.slice(0, 3);
      lines.push(`Curiosity queue: ${top.map(c => `${c.topic} (${(c.intensity * 100).toFixed(0)}%)`).join(", ")}`);
    }

    return lines.join("\n");
  }

  private enforceCapacity(): void {
    const active = Array.from(this.goals.values()).filter(g => g.status === "active");
    if (active.length <= GoalFormationEngine.MAX_ACTIVE_GOALS) return;

    active.sort((a, b) => PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority]);
    const toDefer = active.slice(0, active.length - GoalFormationEngine.MAX_ACTIVE_GOALS);
    for (const goal of toDefer) {
      goal.status = "deferred";
      goal.updatedAt = new Date().toISOString();
    }
  }
}

export const goalEngine = new GoalFormationEngine();
