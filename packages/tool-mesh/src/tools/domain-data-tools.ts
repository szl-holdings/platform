import { z } from 'zod';
import type { ToolHandler } from '../gateway.js';
import type { ToolManifest } from '../manifest.js';

const STANDARD_OBSERVABILITY = {
  emitTrace: true as boolean,
  emitMetrics: true as boolean,
  sensitiveFields: [] as string[],
};

export const MaritimeVesselsInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10).optional(),
});

export const MARITIME_VESSELS_MANIFEST: ToolManifest = {
  id: 'data.maritime-vessels',
  name: 'Maritime Vessel Registry',
  version: '1.0.0',
  description:
    'Retrieve maritime vessel fleet data including vessel names, types, IMO numbers, flags, and operational status from the vessel intelligence platform.',
  domainTags: ['data', 'analytics'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', minimum: 1, maximum: 100, description: 'Maximum vessels to return (default 10)' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 120 },
  timeoutMs: 10000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'sextant-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const maritimeVesselsHandler: ToolHandler = async (input) => {
  const parsed = MaritimeVesselsInputSchema.parse(input);
  const limit = parsed.limit ?? 10;
  try {
    const { db, maritimeVesselsTable } = await import('@szl-holdings/db');
    const { desc } = await import('drizzle-orm');
    const vessels = await db
      .select()
      .from(maritimeVesselsTable)
      .orderBy(desc(maritimeVesselsTable.createdAt))
      .limit(limit);
    return {
      count: vessels.length,
      vessels: vessels.map((v) => ({
        id: v.id,
        name: v.name,
        imo: v.imo,
        flag: v.flag,
        vesselType: v.vesselType,
        status: v.status,
      })),
    };
  } catch {
    return { count: 0, vessels: [], message: 'Maritime vessel data temporarily unavailable.' };
  }
};

export const AisPositionsInputSchema = z.object({
  limit: z.number().int().min(1).max(200).default(20).optional(),
  vesselId: z.number().int().optional(),
});

export const AIS_POSITIONS_MANIFEST: ToolManifest = {
  id: 'data.ais-positions',
  name: 'AIS Position Reports',
  version: '1.0.0',
  description:
    'Get the most recent AIS position reports for tracked vessels including lat/lon, speed, heading, and timestamp.',
  domainTags: ['data', 'analytics'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', minimum: 1, maximum: 200, description: 'Maximum position records to return (default 20)' },
      vesselId: { type: 'number', description: 'Optional: filter positions for a specific vessel ID' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 120 },
  timeoutMs: 10000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'sextant-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const aisPositionsHandler: ToolHandler = async (input) => {
  const parsed = AisPositionsInputSchema.parse(input);
  const limit = parsed.limit ?? 20;
  try {
    const { db, vesselsPositionsTable } = await import('@szl-holdings/db');
    const { desc, eq } = await import('drizzle-orm');
    const positions = parsed.vesselId
      ? await db
          .select()
          .from(vesselsPositionsTable)
          .where(eq(vesselsPositionsTable.vesselId, parsed.vesselId))
          .orderBy(desc(vesselsPositionsTable.recordedAt))
          .limit(limit)
      : await db
          .select()
          .from(vesselsPositionsTable)
          .orderBy(desc(vesselsPositionsTable.recordedAt))
          .limit(limit);
    return {
      count: positions.length,
      positions: positions.map((p) => ({
        vesselId: p.vesselId,
        latitude: p.latitude,
        longitude: p.longitude,
        speed: p.speed,
        heading: p.heading,
        recordedAt: p.recordedAt,
      })),
    };
  } catch {
    return { count: 0, positions: [], message: 'AIS position data temporarily unavailable.' };
  }
};

export const ThreatFeedsInputSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical', 'all']).default('all').optional(),
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

export const THREAT_FEEDS_MANIFEST: ToolManifest = {
  id: 'data.threat-feeds',
  name: 'Threat Intelligence Feed',
  version: '1.0.0',
  description:
    'Retrieve recent security advisory findings and threat intelligence including threat types, severity levels, and recommended mitigations.',
  domainTags: ['security', 'analytics'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical', 'all'], description: 'Severity filter' },
      limit: { type: 'number', minimum: 1, maximum: 50, description: 'Maximum threats to return (default 10)' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 10000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'security-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const threatFeedsHandler: ToolHandler = async (input) => {
  const parsed = ThreatFeedsInputSchema.parse(input);
  const limit = parsed.limit ?? 10;
  const severity = parsed.severity ?? 'all';
  try {
    const { db, advisoryFindings } = await import('@szl-holdings/db');
    const { desc, eq } = await import('drizzle-orm');
    const findings =
      severity !== 'all'
        ? await db
            .select()
            .from(advisoryFindings)
            .where(eq(advisoryFindings.severity, severity))
            .orderBy(desc(advisoryFindings.generatedAt))
            .limit(limit)
        : await db
            .select()
            .from(advisoryFindings)
            .orderBy(desc(advisoryFindings.generatedAt))
            .limit(limit);
    return {
      count: findings.length,
      threats: findings.map((f) => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        agentName: f.agentName,
        summary: f.content.slice(0, 200),
        score: f.score,
        tags: f.tags,
      })),
    };
  } catch {
    return { count: 0, threats: [], message: 'Threat feed data temporarily unavailable.' };
  }
};

export const PortfolioDataInputSchema = z.object({
  companySlug: z.string().optional(),
  limit: z.number().int().min(1).max(20).default(5).optional(),
});

export const PORTFOLIO_DATA_MANIFEST: ToolManifest = {
  id: 'data.portfolio-financials',
  name: 'Portfolio Financial Data',
  version: '1.0.0',
  description:
    'Retrieve investment portfolio company financials including revenue, EBITDA, net income, and period-over-period reporting status.',
  domainTags: ['finance', 'analytics'],
  policyTier: 'executive-facing',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      companySlug: { type: 'string', description: 'Optional: specific portfolio company slug to filter' },
      limit: { type: 'number', minimum: 1, maximum: 20, description: 'Maximum companies to return (default 5)' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 15000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'fund-ops-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const portfolioDataHandler: ToolHandler = async (input) => {
  const parsed = PortfolioDataInputSchema.parse(input);
  const limit = parsed.limit ?? 5;
  try {
    const { db, fundPortfolioFinancialsTable } = await import('@szl-holdings/db');
    const { desc } = await import('drizzle-orm');
    const records = await db
      .select()
      .from(fundPortfolioFinancialsTable)
      .orderBy(desc(fundPortfolioFinancialsTable.createdAt))
      .limit(limit);
    return {
      count: records.length,
      portfolios: records.map((r) => ({
        id: r.id,
        companySlug: r.companySlug,
        companyName: r.companyName,
        periodLabel: r.periodLabel,
        periodEnd: r.periodEnd,
        reportingStatus: r.reportingStatus,
        revenue: r.revenue,
        ebitda: r.ebitda,
        netIncome: r.netIncome,
        totalAssets: r.totalAssets,
        cashAndEquivalents: r.cashAndEquivalents,
        freeCashFlow: r.freeCashFlow,
      })),
    };
  } catch {
    return { count: 0, portfolios: [], message: 'Portfolio financial data temporarily unavailable.' };
  }
};

export const LpReportsInputSchema = z.object({
  reportType: z.enum(['quarterly', 'annual', 'capital_call_notice', 'distribution_notice', 'special']).optional(),
  limit: z.number().int().min(1).max(20).default(5).optional(),
});

export const LP_REPORTS_MANIFEST: ToolManifest = {
  id: 'data.lp-reports',
  name: 'LP Fund Reports',
  version: '1.0.0',
  description:
    'Retrieve LP reports with fund performance metrics including IRR, TVPI, DPI, RVPI, fund NAV, and reporting period details.',
  domainTags: ['finance', 'analytics'],
  policyTier: 'executive-facing',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      reportType: {
        type: 'string',
        enum: ['quarterly', 'annual', 'capital_call_notice', 'distribution_notice', 'special'],
        description: 'Filter by report type',
      },
      limit: { type: 'number', minimum: 1, maximum: 20, description: 'Maximum reports to return (default 5)' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 15000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'fund-ops-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const lpReportsHandler: ToolHandler = async (input) => {
  const parsed = LpReportsInputSchema.parse(input);
  const limit = parsed.limit ?? 5;
  try {
    const { db, fundLpReportsTable } = await import('@szl-holdings/db');
    const { desc } = await import('drizzle-orm');
    const reports = await db
      .select()
      .from(fundLpReportsTable)
      .orderBy(desc(fundLpReportsTable.createdAt))
      .limit(limit);
    return {
      count: reports.length,
      reports: reports.map((r) => ({
        id: r.id,
        reportType: r.reportType,
        reportingPeriod: r.reportingPeriod,
        periodEnd: r.periodEnd,
        status: r.status,
        grossIrr: r.grossIrr,
        netIrr: r.netIrr,
        tvpi: r.tvpi,
        dpi: r.dpi,
        rvpi: r.rvpi,
        fundNav: r.fundNav,
      })),
    };
  } catch {
    return { count: 0, reports: [], message: 'LP report data temporarily unavailable.' };
  }
};

export const PropertyDataInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

export const PROPERTY_DATA_MANIFEST: ToolManifest = {
  id: 'data.properties',
  name: 'Property Registry',
  version: '1.0.0',
  description:
    'Retrieve commercial property records including property location, type, size, assessed value, and status.',
  domainTags: ['data', 'finance'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', minimum: 1, maximum: 50, description: 'Maximum properties to return (default 10)' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 15000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'terra-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const propertyDataHandler: ToolHandler = async (input) => {
  const parsed = PropertyDataInputSchema.parse(input);
  const limit = parsed.limit ?? 10;
  try {
    const { db, terraPropertiesTable } = await import('@szl-holdings/db');
    const { desc } = await import('drizzle-orm');
    const properties = await db
      .select()
      .from(terraPropertiesTable)
      .orderBy(desc(terraPropertiesTable.createdAt))
      .limit(limit);
    return {
      count: properties.length,
      properties: properties.map((p) => ({
        id: p.id,
        address: p.address,
        city: p.city,
        state: p.state,
        zipCode: p.zipCode,
        propertyType: p.propertyType,
        sqft: p.sqft,
        assessedValue: p.assessedValue,
      })),
    };
  } catch {
    return { count: 0, properties: [], message: 'Property data temporarily unavailable.' };
  }
};

export const DealPipelineInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

export const DEAL_PIPELINE_MANIFEST: ToolManifest = {
  id: 'data.deal-pipeline',
  name: 'Real Estate Deal Pipeline',
  version: '1.0.0',
  description:
    'View the real estate deal pipeline including active deals, address, borough, stage, and creation date.',
  domainTags: ['data', 'finance'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', minimum: 1, maximum: 50, description: 'Maximum deals to return (default 10)' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 15000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'terra-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const dealPipelineHandler: ToolHandler = async (input) => {
  const parsed = DealPipelineInputSchema.parse(input);
  const limit = parsed.limit ?? 10;
  try {
    const { db, terraDealsTable } = await import('@szl-holdings/db');
    const { desc } = await import('drizzle-orm');
    const deals = await db
      .select()
      .from(terraDealsTable)
      .orderBy(desc(terraDealsTable.createdAt))
      .limit(limit);
    return {
      count: deals.length,
      deals: deals.map((d) => ({
        id: d.id,
        address: d.address,
        borough: d.borough,
        stage: d.stage,
        zipCode: d.zipCode,
        createdAt: d.createdAt,
      })),
    };
  } catch {
    return { count: 0, deals: [], message: 'Deal pipeline data temporarily unavailable.' };
  }
};

export const ComplianceCalendarInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

export const COMPLIANCE_CALENDAR_MANIFEST: ToolManifest = {
  id: 'data.compliance-calendar',
  name: 'Compliance Calendar',
  version: '1.0.0',
  description:
    'Retrieve compliance calendar items including upcoming regulatory deadlines, audit events, and compliance obligations with their status and assignee.',
  domainTags: ['legal', 'analytics'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', minimum: 1, maximum: 50, description: 'Maximum compliance items to return (default 10)' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 10000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'compliance-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const complianceCalendarHandler: ToolHandler = async (input) => {
  const parsed = ComplianceCalendarInputSchema.parse(input);
  const limit = parsed.limit ?? 10;
  try {
    const { db, complianceCalendarTable } = await import('@szl-holdings/db');
    const { desc } = await import('drizzle-orm');
    const items = await db
      .select()
      .from(complianceCalendarTable)
      .orderBy(desc(complianceCalendarTable.dueAt))
      .limit(limit);
    return {
      count: items.length,
      complianceItems: items.map((i) => ({
        id: i.id,
        eventType: i.eventType,
        title: i.title,
        description: i.description,
        dueAt: i.dueAt,
        status: i.status,
        assignedToName: i.assignedToName,
      })),
    };
  } catch {
    return { count: 0, complianceItems: [], message: 'Compliance calendar data temporarily unavailable.' };
  }
};

export const CrmAccountsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

export const CRM_ACCOUNTS_MANIFEST: ToolManifest = {
  id: 'data.crm-accounts',
  name: 'CRM Client Accounts',
  version: '1.0.0',
  description:
    'Retrieve CRM client account data including account display name, status, and relationship metadata.',
  domainTags: ['data', 'analytics'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', minimum: 1, maximum: 50, description: 'Maximum client accounts to return (default 10)' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 10000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'carlota-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const crmAccountsHandler: ToolHandler = async (input) => {
  const parsed = CrmAccountsInputSchema.parse(input);
  const limit = parsed.limit ?? 10;
  try {
    const { db, clientAccountsTable } = await import('@szl-holdings/db');
    const { desc } = await import('drizzle-orm');
    const clients = await db
      .select()
      .from(clientAccountsTable)
      .orderBy(desc(clientAccountsTable.createdAt))
      .limit(limit);
    return {
      count: clients.length,
      clients: clients.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        status: c.status,
        createdAt: c.createdAt,
      })),
    };
  } catch {
    return { count: 0, clients: [], message: 'CRM account data temporarily unavailable.' };
  }
};

export const SystemHealthInputSchema = z.object({
  agentId: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50).optional(),
});

export const SYSTEM_HEALTH_MANIFEST: ToolManifest = {
  id: 'data.system-health',
  name: 'Platform System Health',
  version: '1.0.0',
  description:
    'Retrieve current platform system health metrics including agent success rates, average latency, token consumption, and per-agent utilization.',
  domainTags: ['infrastructure', 'analytics'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'Optional: filter metrics for a specific agent ID' },
      limit: { type: 'number', minimum: 1, maximum: 200, description: 'Sample size for computing metrics (default 50)' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 120 },
  timeoutMs: 10000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'platform-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const systemHealthHandler: ToolHandler = async (input) => {
  const parsed = SystemHealthInputSchema.parse(input);
  const limit = parsed.limit ?? 50;
  try {
    const { db, agentUsageStats } = await import('@szl-holdings/db');
    const { desc, eq } = await import('drizzle-orm');
    const stats = parsed.agentId
      ? await db
          .select()
          .from(agentUsageStats)
          .where(eq(agentUsageStats.agentId, parsed.agentId))
          .orderBy(desc(agentUsageStats.recordedAt))
          .limit(limit)
      : await db
          .select()
          .from(agentUsageStats)
          .orderBy(desc(agentUsageStats.recordedAt))
          .limit(limit);
    if (stats.length === 0) return { health: 'unknown', message: 'No usage stats available yet.' };
    const successRate = stats.filter((s) => s.success).length / stats.length;
    const avgLatency = stats.reduce((sum, s) => sum + s.latencyMs, 0) / stats.length;
    const totalTokens = stats.reduce((sum, s) => sum + s.tokensUsed, 0);
    const byAgent: Record<string, number> = {};
    for (const s of stats) byAgent[s.agentId] = (byAgent[s.agentId] ?? 0) + 1;
    return {
      health: successRate > 0.9 ? 'healthy' : successRate > 0.7 ? 'degraded' : 'critical',
      successRatePct: Math.round(successRate * 100),
      avgLatencyMs: Math.round(avgLatency),
      totalTokensConsumed: totalTokens,
      agentCallCounts: byAgent,
      sampleSize: stats.length,
    };
  } catch {
    return { health: 'unknown', message: 'System health data temporarily unavailable.' };
  }
};

export const ReadinessInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10).optional(),
});

export const READINESS_MANIFEST: ToolManifest = {
  id: 'data.readiness-assessments',
  name: 'Readiness & Certification Assessments',
  version: '1.0.0',
  description:
    'Retrieve organizational readiness and certification status assessments including readiness scores, certification bodies, and expiry dates.',
  domainTags: ['legal', 'infrastructure'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', minimum: 1, maximum: 50, description: 'Maximum assessments to return (default 10)' },
    },
    required: [],
  },
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 10000,
  failureModes: [{ type: 'timeout', retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  owner: 'platform-team',
  observabilityHooks: STANDARD_OBSERVABILITY,
  enabled: true,
};

export const readinessHandler: ToolHandler = async (input) => {
  const parsed = ReadinessInputSchema.parse(input);
  const limit = parsed.limit ?? 10;
  try {
    const { db, certificationStatusTable } = await import('@szl-holdings/db');
    const { desc } = await import('drizzle-orm');
    const records = await db
      .select()
      .from(certificationStatusTable)
      .orderBy(desc(certificationStatusTable.createdAt))
      .limit(limit);
    return {
      count: records.length,
      assessments: records.map((r) => ({
        id: r.id,
        programId: r.programId,
        overallStatus: r.overallStatus,
        readinessScore: r.readinessScore,
        certificationBody: r.certificationBody,
        certificationNumber: r.certificationNumber,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    };
  } catch {
    return { count: 0, assessments: [], message: 'Readiness assessment data temporarily unavailable.' };
  }
};

export const DOMAIN_DATA_TOOL_MANIFESTS: ToolManifest[] = [
  MARITIME_VESSELS_MANIFEST,
  AIS_POSITIONS_MANIFEST,
  THREAT_FEEDS_MANIFEST,
  PORTFOLIO_DATA_MANIFEST,
  LP_REPORTS_MANIFEST,
  PROPERTY_DATA_MANIFEST,
  DEAL_PIPELINE_MANIFEST,
  COMPLIANCE_CALENDAR_MANIFEST,
  CRM_ACCOUNTS_MANIFEST,
  SYSTEM_HEALTH_MANIFEST,
  READINESS_MANIFEST,
];

export const DOMAIN_DATA_TOOL_HANDLERS: Record<string, ToolHandler> = {
  'data.maritime-vessels': maritimeVesselsHandler,
  'data.ais-positions': aisPositionsHandler,
  'data.threat-feeds': threatFeedsHandler,
  'data.portfolio-financials': portfolioDataHandler,
  'data.lp-reports': lpReportsHandler,
  'data.properties': propertyDataHandler,
  'data.deal-pipeline': dealPipelineHandler,
  'data.compliance-calendar': complianceCalendarHandler,
  'data.crm-accounts': crmAccountsHandler,
  'data.system-health': systemHealthHandler,
  'data.readiness-assessments': readinessHandler,
};

export function initDomainDataTools(
  gateway: { registerHandler(id: string, h: ToolHandler): void },
  registry: { register(m: ToolManifest): void; get(id: string): ToolManifest | undefined },
): void {
  for (const manifest of DOMAIN_DATA_TOOL_MANIFESTS) {
    if (!registry.get(manifest.id)) {
      registry.register(manifest);
    }
    const handler = DOMAIN_DATA_TOOL_HANDLERS[manifest.id];
    if (handler) {
      gateway.registerHandler(manifest.id, handler);
    }
  }
}
