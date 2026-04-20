import { createLogger } from './logger.js';

const logger = createLogger('ai-control-plane:cost-controller');

export interface CostRecord {
  id: string;
  orgId?: string;
  agentId?: string;
  provider: string;
  model: string;
  routeClass: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: string;
}

export interface BudgetPolicy {
  orgId?: string;
  agentId?: string;
  periodType: 'hourly' | 'daily' | 'monthly';
  limitUsd: number;
  alertThresholdPct: number;
  hardStop: boolean;
}

export interface BudgetStatus {
  orgId?: string;
  agentId?: string;
  periodType: string;
  periodKey: string;
  usedUsd: number;
  limitUsd: number;
  pctUsed: number;
  remaining: number;
  alert: boolean;
  hardStopTriggered: boolean;
}

function getPeriodStart(periodType: BudgetPolicy['periodType']): Date {
  const now = new Date();
  switch (periodType) {
    case 'hourly': {
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      return start;
    }
    case 'daily': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'monthly': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return start;
    }
  }
}

function getPeriodKey(periodType: BudgetPolicy['periodType']): string {
  const now = new Date();
  switch (periodType) {
    case 'hourly':
      return `${now.toISOString().slice(0, 13)}`;
    case 'daily':
      return `${now.toISOString().slice(0, 10)}`;
    case 'monthly':
      return `${now.toISOString().slice(0, 7)}`;
  }
}

class CostController {
  private records: CostRecord[] = [];
  private policies: BudgetPolicy[] = [];
  private readonly MAX_RECORDS = 100_000;

  addPolicy(policy: BudgetPolicy): void {
    const existing = this.policies.findIndex(
      (p) =>
        p.orgId === policy.orgId &&
        p.agentId === policy.agentId &&
        p.periodType === policy.periodType,
    );
    if (existing >= 0) {
      this.policies[existing] = policy;
    } else {
      this.policies.push(policy);
    }
    logger.info(
      {
        orgId: policy.orgId,
        agentId: policy.agentId,
        periodType: policy.periodType,
        limitUsd: policy.limitUsd,
      },
      'Budget policy registered',
    );
  }

  removePolicy(orgId?: string, agentId?: string, periodType?: BudgetPolicy['periodType']): void {
    this.policies = this.policies.filter(
      (p) =>
        !(
          p.orgId === orgId &&
          p.agentId === agentId &&
          (!periodType || p.periodType === periodType)
        ),
    );
  }

  record(params: {
    orgId?: string;
    agentId?: string;
    provider: string;
    model: string;
    routeClass: string;
    inputTokens: number;
    outputTokens: number;
    inputCostPerToken?: number;
    outputCostPerToken?: number;
  }): CostRecord {
    const costUsd =
      params.inputTokens * (params.inputCostPerToken ?? 0) +
      params.outputTokens * (params.outputCostPerToken ?? 0);

    const record: CostRecord = {
      id: `cost-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      orgId: params.orgId,
      agentId: params.agentId,
      provider: params.provider,
      model: params.model,
      routeClass: params.routeClass,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      costUsd,
      timestamp: new Date().toISOString(),
    };

    this.records.unshift(record);
    if (this.records.length > this.MAX_RECORDS) this.records.length = this.MAX_RECORDS;

    logger.debug({ costUsd, provider: params.provider, model: params.model }, 'Cost recorded');
    return record;
  }

  checkBudget(orgId?: string, agentId?: string): BudgetStatus[] {
    const relevant = this.policies.filter(
      (p) =>
        (p.orgId === undefined || p.orgId === orgId) &&
        (p.agentId === undefined || p.agentId === agentId),
    );

    return relevant.map((policy) => {
      const periodStart = getPeriodStart(policy.periodType);
      const periodKey = getPeriodKey(policy.periodType);

      const usedUsd = this.records
        .filter((r) => {
          if (new Date(r.timestamp) < periodStart) return false;
          if (policy.orgId !== undefined && r.orgId !== policy.orgId) return false;
          if (policy.agentId !== undefined && r.agentId !== policy.agentId) return false;
          return true;
        })
        .reduce((sum, r) => sum + r.costUsd, 0);

      const pctUsed = policy.limitUsd > 0 ? (usedUsd / policy.limitUsd) * 100 : 0;

      return {
        orgId: policy.orgId,
        agentId: policy.agentId,
        periodType: policy.periodType,
        periodKey,
        usedUsd,
        limitUsd: policy.limitUsd,
        pctUsed: Math.round(pctUsed * 100) / 100,
        remaining: Math.max(0, policy.limitUsd - usedUsd),
        alert: pctUsed >= policy.alertThresholdPct,
        hardStopTriggered: policy.hardStop && usedUsd >= policy.limitUsd,
      };
    });
  }

  isAllowed(
    orgId?: string,
    agentId?: string,
    estimatedCostUsd = 0,
  ): { allowed: boolean; reason?: string } {
    const statuses = this.checkBudget(orgId, agentId);
    for (const status of statuses) {
      if (status.hardStopTriggered) {
        logger.warn(
          { orgId, agentId, period: status.periodType },
          'Hard stop triggered — request blocked',
        );
        return {
          allowed: false,
          reason: `Budget hard stop: ${status.periodType} limit of $${status.limitUsd} exceeded`,
        };
      }
      if (estimatedCostUsd > 0 && status.remaining < estimatedCostUsd) {
        return {
          allowed: false,
          reason: `Insufficient budget: $${status.remaining.toFixed(6)} remaining in ${status.periodType} window`,
        };
      }
    }
    return { allowed: true };
  }

  summary(
    orgId?: string,
    agentId?: string,
  ): {
    totalCostUsd: number;
    byProvider: Record<string, number>;
    byModel: Record<string, number>;
    byRouteClass: Record<string, number>;
    recordCount: number;
  } {
    const filtered = this.records.filter((r) => {
      if (orgId !== undefined && r.orgId !== orgId) return false;
      if (agentId !== undefined && r.agentId !== agentId) return false;
      return true;
    });

    const byProvider: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    const byRouteClass: Record<string, number> = {};
    let totalCostUsd = 0;

    for (const r of filtered) {
      totalCostUsd += r.costUsd;
      byProvider[r.provider] = (byProvider[r.provider] ?? 0) + r.costUsd;
      byModel[r.model] = (byModel[r.model] ?? 0) + r.costUsd;
      byRouteClass[r.routeClass] = (byRouteClass[r.routeClass] ?? 0) + r.costUsd;
    }

    return { totalCostUsd, byProvider, byModel, byRouteClass, recordCount: filtered.length };
  }

  getRecords(limit = 100): CostRecord[] {
    return this.records.slice(0, limit);
  }
}

export const costController = new CostController();

export function recordCost(params: Parameters<CostController['record']>[0]): CostRecord {
  return costController.record(params);
}

export function checkBudget(orgId?: string, agentId?: string): BudgetStatus[] {
  return costController.checkBudget(orgId, agentId);
}

export { CostController };
