import { logger } from './logger';

export interface BudgetStatus {
  orgId: string;
  domain: string;
  spentUsd: number;
  limitUsd: number;
  windowMs: number;
  over: boolean;
  utilizationPct: number;
}

const DEFAULT_DOMAIN_BUDGETS_USD: Record<string, number> = {
  legal: 50,
  medical: 50,
  financial: 100,
  compliance: 25,
  security: 25,
  hr: 20,
  general: 10,
};
const DEFAULT_BUDGET_USD = 10;
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

interface LedgerEntry {
  spentUsd: number;
  windowStart: number;
}

class BudgetLedger {
  private entries = new Map<string, LedgerEntry>();

  private key(orgId: string, domain: string): string {
    return `${orgId}::${domain}`;
  }

  private getOrCreate(orgId: string, domain: string, windowMs: number): LedgerEntry {
    const k = this.key(orgId, domain);
    let entry = this.entries.get(k);
    if (!entry || Date.now() - entry.windowStart >= windowMs) {
      entry = { spentUsd: 0, windowStart: Date.now() };
      this.entries.set(k, entry);
    }
    return entry;
  }

  getLimitUsd(domain: string): number {
    return DEFAULT_DOMAIN_BUDGETS_USD[domain] ?? DEFAULT_BUDGET_USD;
  }

  check(orgId: string, domain: string, windowMs = DEFAULT_WINDOW_MS): BudgetStatus {
    const entry = this.getOrCreate(orgId, domain, windowMs);
    const limitUsd = this.getLimitUsd(domain);
    const over = entry.spentUsd >= limitUsd;
    return {
      orgId,
      domain,
      spentUsd: entry.spentUsd,
      limitUsd,
      windowMs,
      over,
      utilizationPct: limitUsd > 0 ? Math.round((entry.spentUsd / limitUsd) * 100) : 0,
    };
  }

  record(orgId: string, domain: string, costUsd: number, windowMs = DEFAULT_WINDOW_MS): BudgetStatus {
    const entry = this.getOrCreate(orgId, domain, windowMs);
    entry.spentUsd = parseFloat((entry.spentUsd + costUsd).toFixed(6));
    const limitUsd = this.getLimitUsd(domain);
    const over = entry.spentUsd >= limitUsd;

    if (over) {
      logger.warn({ orgId, domain, spentUsd: entry.spentUsd, limitUsd }, '[budget-ledger] Org has exceeded domain budget');
    }

    return {
      orgId,
      domain,
      spentUsd: entry.spentUsd,
      limitUsd,
      windowMs,
      over,
      utilizationPct: limitUsd > 0 ? Math.round((entry.spentUsd / limitUsd) * 100) : 0,
    };
  }

  clear(): void {
    this.entries.clear();
  }
}

export const budgetLedger = new BudgetLedger();
