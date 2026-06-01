import { randomUUID } from 'node:crypto';

export type TrustLevel = 'untrusted' | 'supervised' | 'trusted' | 'autonomous';

export interface TrustScore {
  agentId: string;
  currentLevel: TrustLevel;
  overallScore: number;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  actionScores: Record<string, ActionTypeScore>;
  lastUpdated: string;
  levelHistory: TrustLevelChange[];
  consecutiveSuccesses: number;
  consecutiveFailures: number;
}

export interface ActionTypeScore {
  actionType: string;
  totalAttempts: number;
  successes: number;
  failures: number;
  rollingAccuracy: number;
  riskTier: 'low' | 'medium' | 'high';
  autoApproveEligible: boolean;
}

export interface TrustLevelChange {
  changeId: string;
  fromLevel: TrustLevel;
  toLevel: TrustLevel;
  reason: string;
  timestamp: string;
  triggeringScore: number;
}

export interface TrustPolicy {
  promotionThreshold: number;
  demotionThreshold: number;
  minActionsForPromotion: number;
  consecutiveSuccessesForPromotion: number;
  consecutiveFailuresForDemotion: number;
  highRiskAlwaysRequiresApproval: boolean;
  novelActionRequiresApproval: boolean;
  rollingWindowSize: number;
}

const DEFAULT_TRUST_POLICY: TrustPolicy = {
  promotionThreshold: 0.85,
  demotionThreshold: 0.5,
  minActionsForPromotion: 10,
  consecutiveSuccessesForPromotion: 5,
  consecutiveFailuresForDemotion: 3,
  highRiskAlwaysRequiresApproval: true,
  novelActionRequiresApproval: true,
  rollingWindowSize: 50,
};

const TRUST_LEVEL_ORDER: TrustLevel[] = ['untrusted', 'supervised', 'trusted', 'autonomous'];

function nextLevel(current: TrustLevel): TrustLevel | null {
  const idx = TRUST_LEVEL_ORDER.indexOf(current);
  return idx < TRUST_LEVEL_ORDER.length - 1 ? TRUST_LEVEL_ORDER[idx + 1]! : null;
}

function prevLevel(current: TrustLevel): TrustLevel | null {
  const idx = TRUST_LEVEL_ORDER.indexOf(current);
  return idx > 0 ? TRUST_LEVEL_ORDER[idx - 1]! : null;
}

export interface ApprovalDecision {
  requiresApproval: boolean;
  reason: string;
  trustLevel: TrustLevel;
  agentScore: number;
  actionTypeAccuracy: number | null;
  isNovelAction: boolean;
}

export class TrustScoreEngine {
  private readonly scores = new Map<string, TrustScore>();
  private readonly policy: TrustPolicy;
  private readonly outcomeHistory = new Map<string, boolean[]>();

  constructor(policy: Partial<TrustPolicy> = {}) {
    this.policy = { ...DEFAULT_TRUST_POLICY, ...policy };
  }

  getScore(agentId: string): TrustScore {
    const existing = this.scores.get(agentId);
    if (existing) return existing;

    const fresh: TrustScore = {
      agentId,
      currentLevel: 'supervised',
      overallScore: 0.5,
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      actionScores: {},
      lastUpdated: new Date().toISOString(),
      levelHistory: [],
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
    };
    this.scores.set(agentId, fresh);
    return fresh;
  }

  recordOutcome(
    agentId: string,
    actionType: string,
    success: boolean,
    riskTier: 'low' | 'medium' | 'high' = 'low',
  ): TrustScore {
    const score = this.getScore(agentId);

    score.totalActions++;
    if (success) {
      score.successfulActions++;
      score.consecutiveSuccesses++;
      score.consecutiveFailures = 0;
    } else {
      score.failedActions++;
      score.consecutiveFailures++;
      score.consecutiveSuccesses = 0;
    }

    const historyKey = `${agentId}:${actionType}`;
    const history = this.outcomeHistory.get(historyKey) ?? [];
    history.push(success);
    if (history.length > this.policy.rollingWindowSize) {
      history.shift();
    }
    this.outcomeHistory.set(historyKey, history);

    if (!score.actionScores[actionType]) {
      score.actionScores[actionType] = {
        actionType,
        totalAttempts: 0,
        successes: 0,
        failures: 0,
        rollingAccuracy: 0.5,
        riskTier,
        autoApproveEligible: false,
      };
    }

    const actionScore = score.actionScores[actionType]!;
    actionScore.totalAttempts++;
    if (success) actionScore.successes++;
    else actionScore.failures++;
    actionScore.riskTier = riskTier;

    const recentSuccesses = history.filter(Boolean).length;
    actionScore.rollingAccuracy = history.length > 0 ? recentSuccesses / history.length : 0.5;

    actionScore.autoApproveEligible =
      actionScore.rollingAccuracy >= this.policy.promotionThreshold &&
      actionScore.totalAttempts >= this.policy.minActionsForPromotion &&
      riskTier !== 'high';

    const globalHistory = this.getGlobalHistory(agentId);
    const globalSuccesses = globalHistory.filter(Boolean).length;
    score.overallScore = globalHistory.length > 0 ? globalSuccesses / globalHistory.length : 0.5;

    this.evaluateLevelChange(score);

    score.lastUpdated = new Date().toISOString();
    return score;
  }

  evaluateApproval(agentId: string, actionType: string, riskTier: 'low' | 'medium' | 'high'): ApprovalDecision {
    const score = this.getScore(agentId);
    const actionScore = score.actionScores[actionType];
    const isNovel = !actionScore || actionScore.totalAttempts === 0;

    if (this.policy.highRiskAlwaysRequiresApproval && riskTier === 'high') {
      return {
        requiresApproval: true,
        reason: 'High-risk actions always require human approval',
        trustLevel: score.currentLevel,
        agentScore: score.overallScore,
        actionTypeAccuracy: actionScore?.rollingAccuracy ?? null,
        isNovelAction: isNovel,
      };
    }

    if (this.policy.novelActionRequiresApproval && isNovel) {
      const levelIdx = TRUST_LEVEL_ORDER.indexOf(score.currentLevel);
      const supervisedIdx = TRUST_LEVEL_ORDER.indexOf('supervised');
      if (riskTier === 'low' && levelIdx >= supervisedIdx) {
        return {
          requiresApproval: false,
          reason: `Novel low-risk action auto-approved for ${score.currentLevel}-level agent to bootstrap trust`,
          trustLevel: score.currentLevel,
          agentScore: score.overallScore,
          actionTypeAccuracy: null,
          isNovelAction: true,
        };
      }
      return {
        requiresApproval: true,
        reason: `Novel ${riskTier}-risk action type requires initial human oversight`,
        trustLevel: score.currentLevel,
        agentScore: score.overallScore,
        actionTypeAccuracy: null,
        isNovelAction: true,
      };
    }

    if (score.currentLevel === 'autonomous' && actionScore?.autoApproveEligible) {
      return {
        requiresApproval: false,
        reason: `Agent has autonomous trust level with ${(actionScore.rollingAccuracy * 100).toFixed(1)}% accuracy on this action type`,
        trustLevel: score.currentLevel,
        agentScore: score.overallScore,
        actionTypeAccuracy: actionScore.rollingAccuracy,
        isNovelAction: false,
      };
    }

    if (score.currentLevel === 'trusted' && riskTier === 'low' && actionScore?.autoApproveEligible) {
      return {
        requiresApproval: false,
        reason: `Trusted agent with high accuracy on low-risk action`,
        trustLevel: score.currentLevel,
        agentScore: score.overallScore,
        actionTypeAccuracy: actionScore.rollingAccuracy,
        isNovelAction: false,
      };
    }

    return {
      requiresApproval: true,
      reason: `Trust level '${score.currentLevel}' requires approval for ${riskTier}-risk actions`,
      trustLevel: score.currentLevel,
      agentScore: score.overallScore,
      actionTypeAccuracy: actionScore?.rollingAccuracy ?? null,
      isNovelAction: isNovel,
    };
  }

  getAllScores(): TrustScore[] {
    return Array.from(this.scores.values());
  }

  resetAgent(agentId: string): void {
    this.scores.delete(agentId);
    for (const key of Array.from(this.outcomeHistory.keys())) {
      if (key.startsWith(`${agentId}:`)) {
        this.outcomeHistory.delete(key);
      }
    }
  }

  setLevel(agentId: string, level: TrustLevel, reason: string): void {
    const score = this.getScore(agentId);
    const fromLevel = score.currentLevel;
    if (fromLevel === level) return;

    score.currentLevel = level;
    score.levelHistory.push({
      changeId: randomUUID(),
      fromLevel,
      toLevel: level,
      reason,
      timestamp: new Date().toISOString(),
      triggeringScore: score.overallScore,
    });
    score.lastUpdated = new Date().toISOString();
  }

  getPolicy(): TrustPolicy {
    return { ...this.policy };
  }

  private evaluateLevelChange(score: TrustScore): void {
    if (
      score.overallScore >= this.policy.promotionThreshold &&
      score.totalActions >= this.policy.minActionsForPromotion &&
      score.consecutiveSuccesses >= this.policy.consecutiveSuccessesForPromotion
    ) {
      const next = nextLevel(score.currentLevel);
      if (next) {
        const fromLevel = score.currentLevel;
        score.currentLevel = next;
        score.levelHistory.push({
          changeId: randomUUID(),
          fromLevel,
          toLevel: next,
          reason: `Promoted: ${(score.overallScore * 100).toFixed(1)}% accuracy over ${score.totalActions} actions with ${score.consecutiveSuccesses} consecutive successes`,
          timestamp: new Date().toISOString(),
          triggeringScore: score.overallScore,
        });
      }
    }

    if (
      score.overallScore < this.policy.demotionThreshold ||
      score.consecutiveFailures >= this.policy.consecutiveFailuresForDemotion
    ) {
      const prev = prevLevel(score.currentLevel);
      if (prev) {
        const fromLevel = score.currentLevel;
        score.currentLevel = prev;
        score.consecutiveSuccesses = 0;
        score.levelHistory.push({
          changeId: randomUUID(),
          fromLevel,
          toLevel: prev,
          reason: `Demoted: ${(score.overallScore * 100).toFixed(1)}% accuracy with ${score.consecutiveFailures} consecutive failures`,
          timestamp: new Date().toISOString(),
          triggeringScore: score.overallScore,
        });
      }
    }
  }

  private getGlobalHistory(agentId: string): boolean[] {
    const all: boolean[] = [];
    for (const [key, history] of Array.from(this.outcomeHistory.entries())) {
      if (key.startsWith(`${agentId}:`)) {
        all.push(...history);
      }
    }
    return all.slice(-this.policy.rollingWindowSize);
  }
}

export const defaultTrustEngine = new TrustScoreEngine();
