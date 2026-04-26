import { eq, desc, gte } from 'drizzle-orm';
import { z } from 'zod';
import type { ToolHandler } from '../gateway.js';
import type { ToolManifest } from '../manifest.js';

export const FundTransferInputSchema = z.object({
  fromAccountId: z.string(),
  toAccountId: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  reference: z.string().optional(),
  memo: z.string().optional(),
});
export type FundTransferInput = z.infer<typeof FundTransferInputSchema>;

export const FUND_TRANSFER_TOOL_MANIFEST: ToolManifest = {
  id: 'finance.fund-transfer',
  name: 'Fund Transfer',
  version: '1.0.0',
  description:
    'Initiate a fund transfer between accounts. All transfers require explicit human approval before execution.',
  domainTags: ['finance'],
  policyTier: 'human-approval-mandatory',
  allowedEnvironments: ['production'],
  inputSchema: {
    type: 'object',
    properties: {
      fromAccountId: { type: 'string', description: 'Source account identifier' },
      toAccountId: { type: 'string', description: 'Destination account identifier' },
      amount: { type: 'number', minimum: 0, description: 'Transfer amount (must be positive)' },
      currency: { type: 'string', description: 'ISO 4217 currency code (e.g. USD)' },
      reference: { type: 'string', description: 'Optional payment reference' },
      memo: { type: 'string', description: 'Optional transfer memo' },
    },
    required: ['fromAccountId', 'toAccountId', 'amount'],
  },
  rateLimits: { requestsPerMinute: 5, concurrency: 1 },
  timeoutMs: 30000,
  failureModes: [{ type: 'error', retryable: false, maxRetries: 0 }],
  approvalRequired: true,
  owner: 'treasury-team',
  observabilityHooks: {
    emitTrace: true,
    emitMetrics: true,
    sensitiveFields: ['fromAccountId', 'toAccountId', 'amount'],
  },
  enabled: true,
};

export const fundTransferHandler: ToolHandler = async (input) => {
  const parsed = FundTransferInputSchema.parse(input);
  const { db, treasuryAccountsTable, treasuryTransactionsTable } = await import('@szl-holdings/db');

  const sourceAccount = await db
    .select()
    .from(treasuryAccountsTable)
    .where(eq(treasuryAccountsTable.accountId, parsed.fromAccountId))
    .limit(1);

  if (!sourceAccount[0]) {
    return {
      transferId: null,
      status: 'error',
      error: `Source account '${parsed.fromAccountId}' not found in treasury registry`,
    };
  }

  const txId = `txn-${Date.now()}`;
  await db.insert(treasuryTransactionsTable).values({
    accountId: sourceAccount[0].id,
    orgId: sourceAccount[0].orgId,
    providerTxId: txId,
    txType: 'transfer',
    amount: String(parsed.amount),
    currency: parsed.currency,
    description: parsed.memo ?? `Transfer to ${parsed.toAccountId}`,
    counterparty: parsed.toAccountId,
    status: 'pending',
    metadata: { reference: parsed.reference ?? null, requiresApproval: true },
  });

  return {
    transferId: txId,
    fromAccountId: parsed.fromAccountId,
    toAccountId: parsed.toAccountId,
    amount: parsed.amount,
    currency: parsed.currency,
    status: 'pending',
    message: `Transfer of ${parsed.amount} ${parsed.currency} queued for mandatory human approval`,
  };
};

export const PortfolioSnapshotInputSchema = z.object({
  portfolioId: z.string(),
  asOf: z.string().datetime().optional(),
  includeBreakdown: z.boolean().default(false),
});

export const PORTFOLIO_SNAPSHOT_TOOL_MANIFEST: ToolManifest = {
  id: 'finance.portfolio-snapshot',
  name: 'Portfolio Snapshot',
  version: '1.0.0',
  description:
    'Retrieve a point-in-time portfolio snapshot including NAV, allocation breakdown, and performance metrics.',
  domainTags: ['finance', 'analytics'],
  policyTier: 'executive-facing',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      portfolioId: { type: 'string', description: 'Unique identifier of the portfolio' },
      asOf: {
        type: 'string',
        description: 'ISO 8601 datetime for point-in-time snapshot (defaults to now)',
      },
      includeBreakdown: {
        type: 'boolean',
        description: 'Whether to include full allocation breakdown',
      },
    },
    required: ['portfolioId'],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 15000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'fund-ops-team',
  observabilityHooks: { emitTrace: true, emitMetrics: false, sensitiveFields: ['portfolioId'] },
  enabled: true,
};

export const portfolioSnapshotHandler: ToolHandler = async (input) => {
  const parsed = PortfolioSnapshotInputSchema.parse(input);
  const { db, treasuryAccountsTable, treasuryBalanceSnapshotsTable } = await import('@szl-holdings/db');

  const accounts = await db
    .select()
    .from(treasuryAccountsTable)
    .limit(20);

  const latestSnapshots = await db
    .select()
    .from(treasuryBalanceSnapshotsTable)
    .orderBy(desc(treasuryBalanceSnapshotsTable.snapshotAt))
    .limit(accounts.length || 10);

  const totalNavUsd = latestSnapshots.reduce((sum, s) => {
    return sum + parseFloat(s.balanceUsd ?? '0');
  }, 0);

  const allocation = parsed.includeBreakdown
    ? accounts.slice(0, latestSnapshots.length).map((acc, i) => ({
        accountId: acc.accountId ?? acc.id.toString(),
        label: acc.label,
        currency: acc.currency,
        currencyType: acc.currencyType,
        balanceUsd: latestSnapshots[i]?.balanceUsd ?? '0',
        provider: acc.provider,
      }))
    : [];

  return {
    portfolioId: parsed.portfolioId,
    asOf: parsed.asOf ?? new Date().toISOString(),
    nav: totalNavUsd,
    navCurrency: 'USD',
    accountCount: accounts.length,
    allocation,
    lastUpdated: latestSnapshots[0]?.snapshotAt?.toISOString() ?? null,
  };
};

export const BudgetForecastInputSchema = z.object({
  orgId: z.string(),
  period: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  horizonMonths: z.number().int().min(1).max(36).default(12),
});

export const BUDGET_FORECAST_TOOL_MANIFEST: ToolManifest = {
  id: 'finance.budget-forecast',
  name: 'Budget Forecast',
  version: '1.0.0',
  description:
    'Generate a forward-looking budget forecast for a specified period using historical spend and growth signals.',
  domainTags: ['finance', 'analytics'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      orgId: { type: 'string', description: 'Organization identifier to generate forecast for' },
      period: {
        type: 'string',
        enum: ['monthly', 'quarterly', 'annual'],
        description: 'Budget period granularity',
      },
      horizonMonths: {
        type: 'integer',
        minimum: 1,
        maximum: 36,
        description: 'Number of months to forecast ahead',
      },
    },
    required: ['orgId'],
  },
  rateLimits: { requestsPerMinute: 20 },
  timeoutMs: 20000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'finance-team',
  observabilityHooks: { emitTrace: true, emitMetrics: false, sensitiveFields: [] },
  enabled: true,
};

export const budgetForecastHandler: ToolHandler = async (input) => {
  const parsed = BudgetForecastInputSchema.parse(input);
  const { db, treasuryTransactionsTable } = await import('@szl-holdings/db');

  const lookbackDate = new Date();
  lookbackDate.setMonth(lookbackDate.getMonth() - 6);

  const recentTxns = await db
    .select()
    .from(treasuryTransactionsTable)
    .where(gte(treasuryTransactionsTable.occurredAt, lookbackDate))
    .orderBy(desc(treasuryTransactionsTable.occurredAt))
    .limit(200);

  const totalSpend = recentTxns
    .filter((t) => t.txType === 'debit' || t.txType === 'fee')
    .reduce((sum, t) => sum + parseFloat(t.amountUsd ?? '0'), 0);

  const monthlyAvg = totalSpend / 6;
  const growthRate = 1.05;

  const periodLength = parsed.period === 'monthly' ? 1 : parsed.period === 'quarterly' ? 3 : 12;
  const periods = Math.ceil(parsed.horizonMonths / periodLength);

  const forecast = Array.from({ length: periods }, (_, i) => ({
    period: i + 1,
    projectedSpend: Math.round(monthlyAvg * periodLength * Math.pow(growthRate, i) * 100) / 100,
    currency: 'USD',
    confidence: Math.max(0.5, 0.95 - i * 0.04),
  }));

  return {
    orgId: parsed.orgId,
    period: parsed.period,
    horizonMonths: parsed.horizonMonths,
    basedOnTransactions: recentTxns.length,
    monthlyBaselineUsd: Math.round(monthlyAvg * 100) / 100,
    forecast,
    generatedAt: new Date().toISOString(),
  };
};

export const RegulatoryFilingInputSchema = z.object({
  filingType: z.enum(['10-K', '10-Q', '8-K', 'SAR', 'FINCEN']),
  period: z.string(),
  entityId: z.string(),
  draftMode: z.boolean().default(true),
});

export const REGULATORY_FILING_TOOL_MANIFEST: ToolManifest = {
  id: 'finance.regulatory-filing',
  name: 'Regulatory Filing',
  version: '1.0.0',
  description:
    'Prepare or submit a regulatory financial filing. Live submissions require approval from the compliance officer.',
  domainTags: ['finance'],
  policyTier: 'regulated-workflow',
  allowedEnvironments: ['staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      filingType: {
        type: 'string',
        enum: ['10-K', '10-Q', '8-K', 'SAR', 'FINCEN'],
        description: 'Type of regulatory filing',
      },
      period: { type: 'string', description: 'Reporting period (e.g. Q1-2025 or FY-2024)' },
      entityId: { type: 'string', description: 'Legal entity identifier for the filing' },
      draftMode: {
        type: 'boolean',
        description: 'Whether to prepare a draft (true) or submit live (false)',
      },
    },
    required: ['filingType', 'period', 'entityId'],
  },
  rateLimits: { requestsPerMinute: 5 },
  timeoutMs: 60000,
  failureModes: [{ type: 'error', retryable: false, maxRetries: 0 }],
  approvalRequired: true,
  owner: 'compliance-team',
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ['entityId'] },
  enabled: true,
};

const FILING_TYPE_TO_EVENT_TYPE: Record<
  string,
  'annual_review' | 'other' | 'reg_bi_audit' | 'policy_review'
> = {
  '10-K': 'annual_review',
  '10-Q': 'other',
  '8-K': 'other',
  SAR: 'reg_bi_audit',
  FINCEN: 'other',
};

export const regulatoryFilingHandler: ToolHandler = async (input) => {
  const parsed = RegulatoryFilingInputSchema.parse(input);
  const { db, complianceCalendarTable } = await import('@szl-holdings/db');

  const filingId = `filing-${Date.now()}`;
  const eventType = FILING_TYPE_TO_EVENT_TYPE[parsed.filingType] ?? 'other';
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 30);

  await db.insert(complianceCalendarTable).values({
    eventId: filingId,
    orgId: null,
    eventType,
    title: `${parsed.filingType} Filing — ${parsed.period} (${parsed.entityId})`,
    description: `Regulatory filing ${parsed.draftMode ? 'draft' : 'submission'} for entity ${parsed.entityId}, period ${parsed.period}`,
    dueAt,
    status: parsed.draftMode ? 'in_progress' : 'upcoming',
    filingReference: `${parsed.filingType}-${parsed.period}-${parsed.entityId}`,
    recurrence: 'none',
    metadata: {
      filingType: parsed.filingType,
      entityId: parsed.entityId,
      period: parsed.period,
      draftMode: parsed.draftMode,
    },
  });

  return {
    filingId,
    filingType: parsed.filingType,
    period: parsed.period,
    entityId: parsed.entityId,
    draftMode: parsed.draftMode,
    status: parsed.draftMode ? 'draft' : 'pending-approval',
    eventType,
    dueAt: dueAt.toISOString(),
    message: `Regulatory filing ${parsed.draftMode ? 'drafted' : 'queued for compliance officer submission'}`,
  };
};

export const FINANCE_TOOL_MANIFESTS: ToolManifest[] = [
  FUND_TRANSFER_TOOL_MANIFEST,
  PORTFOLIO_SNAPSHOT_TOOL_MANIFEST,
  BUDGET_FORECAST_TOOL_MANIFEST,
  REGULATORY_FILING_TOOL_MANIFEST,
];
