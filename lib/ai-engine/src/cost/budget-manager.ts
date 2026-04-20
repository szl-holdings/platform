/**
 * Cost Budget Management
 *
 * Capability 6: Pre-flight cost estimation, mid-execution budget caps,
 * automatic model-downgrade fallback, and per-workflow spend analytics.
 *
 * Model downgrade chain:
 *   gpt-5.2 → gpt-4o → gpt-4o-mini
 *   claude-sonnet-4-6 → claude-haiku-3
 *   gemini-3.1-pro-preview → gemini-3-flash-preview
 */

export interface ModelPricing {
  model: string;
  provider: string;
  inputCostPer1KTokens: number;
  outputCostPer1KTokens: number;
  tier: 'premium' | 'standard' | 'economy';
}

export interface BudgetConfig {
  workflowId: string;
  orgId: number | null;
  budgetUsd: number;
  warningThreshold: number;
  hardCapThreshold: number;
  allowModelDowngrade: boolean;
}

export interface BudgetUsage {
  workflowId: string;
  orgId: number | null;
  estimatedCostUsd: number;
  actualCostUsd: number;
  tokensUsed: number;
  modelDowngradeTriggered: boolean;
  currentModel: string;
  originalModel: string;
  warningIssued: boolean;
  startedAt: string;
  updatedAt: string;
}

export interface CostEstimate {
  estimatedTokens: number;
  estimatedCostUsd: number;
  breakdown: Array<{
    agentId: string;
    model: string;
    estimatedTokens: number;
    estimatedCostUsd: number;
  }>;
  budgetSufficient: boolean;
  budgetRemaining: number;
  recommendation: string;
}

export interface SpendRecord {
  workflowId: string;
  orgId: number | null;
  model: string;
  provider: string;
  tokensUsed: number;
  costUsd: number;
  agentId: string;
  recordedAt: string;
}

export const MODEL_PRICING: ModelPricing[] = [
  {
    model: 'gpt-5.2',
    provider: 'openai',
    inputCostPer1KTokens: 0.015,
    outputCostPer1KTokens: 0.06,
    tier: 'premium',
  },
  {
    model: 'gpt-4o',
    provider: 'openai',
    inputCostPer1KTokens: 0.005,
    outputCostPer1KTokens: 0.015,
    tier: 'standard',
  },
  {
    model: 'gpt-4o-mini',
    provider: 'openai',
    inputCostPer1KTokens: 0.00015,
    outputCostPer1KTokens: 0.0006,
    tier: 'economy',
  },
  {
    model: 'claude-sonnet-4-6',
    provider: 'anthropic',
    inputCostPer1KTokens: 0.003,
    outputCostPer1KTokens: 0.015,
    tier: 'premium',
  },
  {
    model: 'claude-haiku-3',
    provider: 'anthropic',
    inputCostPer1KTokens: 0.00025,
    outputCostPer1KTokens: 0.00125,
    tier: 'economy',
  },
  {
    model: 'gemini-3.1-pro-preview',
    provider: 'gemini',
    inputCostPer1KTokens: 0.00125,
    outputCostPer1KTokens: 0.005,
    tier: 'premium',
  },
  {
    model: 'gemini-3-flash-preview',
    provider: 'gemini',
    inputCostPer1KTokens: 0.000075,
    outputCostPer1KTokens: 0.0003,
    tier: 'economy',
  },
];

const MODEL_DOWNGRADE_CHAIN: Record<string, string> = {
  'gpt-5.2': 'gpt-4o',
  'gpt-4o': 'gpt-4o-mini',
  'claude-sonnet-4-6': 'claude-haiku-3',
  'gemini-3.1-pro-preview': 'gemini-3-flash-preview',
};

function getPricing(model: string): ModelPricing | undefined {
  return MODEL_PRICING.find((p) => p.model === model);
}

function estimateCost(model: string, tokens: number): number {
  const pricing = getPricing(model);
  if (!pricing) return 0;
  const inputTokens = Math.round(tokens * 0.3);
  const outputTokens = Math.round(tokens * 0.7);
  return (
    (inputTokens / 1000) * pricing.inputCostPer1KTokens +
    (outputTokens / 1000) * pricing.outputCostPer1KTokens
  );
}

function estimateTokensForQuery(query: string, agentCount: number): number {
  const baseTokens = Math.ceil(query.length / 4);
  const agentOverhead = 2000;
  const synthesisTokens = 1500;
  return (baseTokens + agentOverhead) * agentCount + synthesisTokens;
}

class BudgetManager {
  private budgets: Map<string, BudgetConfig> = new Map();
  private usages: Map<string, BudgetUsage> = new Map();
  private spendHistory: SpendRecord[] = [];
  private static readonly MAX_HISTORY = 10000;

  configureBudget(config: BudgetConfig): void {
    this.budgets.set(config.workflowId, config);
  }

  getDefaultBudget(workflowId: string, orgId: number | null): BudgetConfig {
    return {
      workflowId,
      orgId,
      budgetUsd: 5.0,
      warningThreshold: 0.8,
      hardCapThreshold: 1.0,
      allowModelDowngrade: true,
    };
  }

  estimateRunCost(
    query: string,
    agents: Array<{ agentId: string; model: string }>,
    workflowId: string,
    orgId?: number | null,
  ): CostEstimate {
    const budget = this.budgets.get(workflowId) ?? this.getDefaultBudget(workflowId, orgId ?? null);
    const usage = this.usages.get(workflowId);
    const spentSoFar = usage?.actualCostUsd ?? 0;
    const budgetRemaining = budget.budgetUsd - spentSoFar;

    const estimatedTokensPerAgent = estimateTokensForQuery(query, 1);
    let totalEstimated = 0;
    const breakdown = agents.map((agent) => {
      const cost = estimateCost(agent.model, estimatedTokensPerAgent);
      totalEstimated += cost;
      return {
        agentId: agent.agentId,
        model: agent.model,
        estimatedTokens: estimatedTokensPerAgent,
        estimatedCostUsd: cost,
      };
    });

    const budgetSufficient =
      spentSoFar + totalEstimated <= budget.budgetUsd * budget.hardCapThreshold;
    let recommendation = 'Budget sufficient — proceed with configured models';
    if (!budgetSufficient) {
      recommendation = `Budget insufficient — consider model downgrade (estimated: $${totalEstimated.toFixed(4)}, remaining: $${budgetRemaining.toFixed(4)})`;
    } else if (spentSoFar + totalEstimated >= budget.budgetUsd * budget.warningThreshold) {
      recommendation = `Approaching budget limit (${Math.round(((spentSoFar + totalEstimated) / budget.budgetUsd) * 100)}% consumed) — monitor usage`;
    }

    return {
      estimatedTokens: estimatedTokensPerAgent * agents.length,
      estimatedCostUsd: totalEstimated,
      breakdown,
      budgetSufficient,
      budgetRemaining,
      recommendation,
    };
  }

  getBudgetStatus(
    workflowId: string,
    orgId?: number | null,
  ): {
    budgetUsd: number;
    usedUsd: number;
    remainingUsd: number;
    percentUsed: number;
    status: 'ok' | 'warning' | 'critical' | 'exceeded';
  } {
    const budget = this.budgets.get(workflowId) ?? this.getDefaultBudget(workflowId, orgId ?? null);
    const usage = this.usages.get(workflowId);
    const usedUsd = usage?.actualCostUsd ?? 0;
    const percent = usedUsd / budget.budgetUsd;

    let status: 'ok' | 'warning' | 'critical' | 'exceeded' = 'ok';
    if (percent >= 1) status = 'exceeded';
    else if (percent >= budget.hardCapThreshold * 0.95) status = 'critical';
    else if (percent >= budget.warningThreshold) status = 'warning';

    return {
      budgetUsd: budget.budgetUsd,
      usedUsd,
      remainingUsd: Math.max(0, budget.budgetUsd - usedUsd),
      percentUsed: percent * 100,
      status,
    };
  }

  getModelForBudget(
    originalModel: string,
    workflowId: string,
    orgId?: number | null,
  ): { model: string; downgraded: boolean; reason: string } {
    const budget = this.budgets.get(workflowId) ?? this.getDefaultBudget(workflowId, orgId ?? null);
    const status = this.getBudgetStatus(workflowId, orgId);

    if (!budget.allowModelDowngrade) {
      return {
        model: originalModel,
        downgraded: false,
        reason: 'Model downgrade disabled by policy',
      };
    }

    if (status.status === 'exceeded') {
      const downgraded = MODEL_DOWNGRADE_CHAIN[originalModel] ?? originalModel;
      return {
        model: downgraded,
        downgraded: downgraded !== originalModel,
        reason: 'Budget exceeded — hard downgrade applied',
      };
    }

    if (status.percentUsed >= budget.warningThreshold * 100) {
      const downgraded = MODEL_DOWNGRADE_CHAIN[originalModel] ?? originalModel;
      return {
        model: downgraded,
        downgraded: downgraded !== originalModel,
        reason: `Budget at ${status.percentUsed.toFixed(0)}% — proactive downgrade to preserve capacity`,
      };
    }

    return {
      model: originalModel,
      downgraded: false,
      reason: 'Within budget — premium model authorized',
    };
  }

  recordSpend(
    workflowId: string,
    agentId: string,
    model: string,
    tokensUsed: number,
    orgId?: number | null,
  ): void {
    const pricing = getPricing(model);
    const costUsd = pricing ? estimateCost(model, tokensUsed) : 0;
    const provider = pricing?.provider ?? 'unknown';

    const record: SpendRecord = {
      workflowId,
      orgId: orgId ?? null,
      model,
      provider,
      tokensUsed,
      costUsd,
      agentId,
      recordedAt: new Date().toISOString(),
    };
    this.spendHistory.push(record);
    if (this.spendHistory.length > BudgetManager.MAX_HISTORY) {
      this.spendHistory.splice(0, this.spendHistory.length - BudgetManager.MAX_HISTORY);
    }

    if (!this.usages.has(workflowId)) {
      const budget =
        this.budgets.get(workflowId) ?? this.getDefaultBudget(workflowId, orgId ?? null);
      this.usages.set(workflowId, {
        workflowId,
        orgId: orgId ?? null,
        estimatedCostUsd: 0,
        actualCostUsd: 0,
        tokensUsed: 0,
        modelDowngradeTriggered: false,
        currentModel: model,
        originalModel: model,
        warningIssued: false,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const usage = this.usages.get(workflowId)!;
    usage.actualCostUsd += costUsd;
    usage.tokensUsed += tokensUsed;
    usage.currentModel = model;
    usage.updatedAt = new Date().toISOString();
  }

  getSpendAnalytics(
    orgId?: number | null,
    limit = 100,
  ): {
    totalSpend: number;
    byModel: Record<string, { spend: number; tokens: number; calls: number }>;
    byAgent: Record<string, { spend: number; tokens: number }>;
    byWorkflow: Record<string, { spend: number; tokens: number }>;
    recentRecords: SpendRecord[];
  } {
    const records =
      orgId !== undefined ? this.spendHistory.filter((r) => r.orgId === orgId) : this.spendHistory;

    const byModel: Record<string, { spend: number; tokens: number; calls: number }> = {};
    const byAgent: Record<string, { spend: number; tokens: number }> = {};
    const byWorkflow: Record<string, { spend: number; tokens: number }> = {};
    let totalSpend = 0;

    for (const r of records) {
      totalSpend += r.costUsd;
      if (!byModel[r.model]) byModel[r.model] = { spend: 0, tokens: 0, calls: 0 };
      byModel[r.model]!.spend += r.costUsd;
      byModel[r.model]!.tokens += r.tokensUsed;
      byModel[r.model]!.calls++;
      if (!byAgent[r.agentId]) byAgent[r.agentId] = { spend: 0, tokens: 0 };
      byAgent[r.agentId]!.spend += r.costUsd;
      byAgent[r.agentId]!.tokens += r.tokensUsed;
      if (!byWorkflow[r.workflowId]) byWorkflow[r.workflowId] = { spend: 0, tokens: 0 };
      byWorkflow[r.workflowId]!.spend += r.costUsd;
      byWorkflow[r.workflowId]!.tokens += r.tokensUsed;
    }

    return {
      totalSpend,
      byModel,
      byAgent,
      byWorkflow,
      recentRecords: records.slice(-limit).reverse(),
    };
  }

  getAllBudgetStatuses(): Array<{ workflowId: string } & ReturnType<typeof this.getBudgetStatus>> {
    return [...this.budgets.keys()].map((wid) => ({
      workflowId: wid,
      ...this.getBudgetStatus(wid),
    }));
  }
}

export const budgetManager = new BudgetManager();
