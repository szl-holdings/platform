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
  return {
    transferId: `txn-${Date.now()}`,
    fromAccountId: parsed.fromAccountId,
    toAccountId: parsed.toAccountId,
    amount: parsed.amount,
    currency: parsed.currency,
    status: 'pending-approval',
    message: 'Fund transfer queued for mandatory human approval (stub — wire treasury backend)',
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
  return {
    portfolioId: parsed.portfolioId,
    asOf: parsed.asOf ?? new Date().toISOString(),
    nav: null,
    allocation: [],
    performance: {},
    message: 'Portfolio snapshot retrieved (stub — wire fund-ops database)',
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
  return {
    orgId: parsed.orgId,
    period: parsed.period,
    horizonMonths: parsed.horizonMonths,
    forecast: [],
    message: 'Budget forecast generated (stub — wire financial planning engine)',
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

export const regulatoryFilingHandler: ToolHandler = async (input) => {
  const parsed = RegulatoryFilingInputSchema.parse(input);
  return {
    filingId: `filing-${Date.now()}`,
    filingType: parsed.filingType,
    period: parsed.period,
    entityId: parsed.entityId,
    draftMode: parsed.draftMode,
    status: parsed.draftMode ? 'draft' : 'pending-approval',
    message: `Regulatory filing ${parsed.draftMode ? 'drafted' : 'queued for submission'} (stub — wire compliance backend)`,
  };
};

export const FINANCE_TOOL_MANIFESTS: ToolManifest[] = [
  FUND_TRANSFER_TOOL_MANIFEST,
  PORTFOLIO_SNAPSHOT_TOOL_MANIFEST,
  BUDGET_FORECAST_TOOL_MANIFEST,
  REGULATORY_FILING_TOOL_MANIFEST,
];
