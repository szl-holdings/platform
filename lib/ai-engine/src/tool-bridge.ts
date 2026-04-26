import {
  defaultGateway,
  defaultToolRegistry,
  initAllToolMeshHandlers,
} from '@workspace/tool-mesh';
import type { ToolDefinition } from './types.js';

let _initialized = false;

function ensureInitialized(): void {
  if (_initialized) return;
  _initialized = true;
  initAllToolMeshHandlers(defaultGateway, defaultToolRegistry);
}

const AGENT_TOOL_TO_GATEWAY_ID: Record<string, string> = {
  maritime_data: 'data.maritime-vessels',
  ais_positions: 'data.ais-positions',
  threat_feeds: 'data.threat-feeds',
  portfolio_data: 'data.portfolio-financials',
  financial_reports: 'data.lp-reports',
  property_data: 'data.properties',
  deal_pipeline: 'data.deal-pipeline',
  compliance_check: 'data.compliance-calendar',
  crm_data: 'data.crm-accounts',
  system_health: 'data.system-health',
  platform_stats: 'data.system-health',
  ecosystem_health: 'data.system-health',
  admin_overview: 'data.system-health',
  readiness_data: 'data.readiness-assessments',
};

const STUB_TOOL_DESCRIPTIONS: Record<string, string> = {
  weather_marine:
    'Marine weather API — live connector not configured. For live data, consult NOAA or maritime weather services.',
  cve_database:
    'CVE database — live connector not configured. For live CVE lookups, query nvd.nist.gov or MITRE directly.',
  nvd_api:
    'NVD API — live connector not configured. NIST vulnerability data requires an external integration.',
  huggingface_search:
    'HuggingFace Hub — live connector not configured. Model search is not available at this time.',
  arxiv_search:
    'arXiv API — live connector not configured. Paper search is not available at this time.',
  model_registry:
    'Internal model registry — live connector not configured. No deployed model metadata available.',
  content_strategy:
    'Content strategy is synthesized through AI reasoning. No separate data connector is required.',
  market_feeds:
    'Market data feed — live connector not configured. No live market prices available from this agent.',
  risk_models:
    'Quantitative risk model engine — live connector not configured. Risk calculations require the risk modeling service.',
  deal_analytics:
    'Deal analytics service — live connector not configured. Full deal analytics requires the fund analytics service.',
  market_comps:
    'Property comps API — live connector not configured. Comparable sales data requires an MLS integration.',
  geo_analysis:
    'Geospatial analysis — live connector not configured. Geographic analysis requires a mapping API.',
  valuation_models:
    'Property valuation model engine — live connector not configured. Valuations require a quantitative service.',
  case_search:
    'Legal matter search is available through the Counsel platform directly.',
  regulation_lookup:
    'Regulatory database — live connector not configured. Use the Counsel platform or external legal databases.',
  contract_analysis:
    'Contract analysis is performed through direct AI reasoning in the Counsel platform.',
  engagement_tracking:
    'Client engagement tracking — live connector not configured. Requires CRM integration.',
  proposal_generator:
    'Proposal generation is provided through direct AI synthesis rather than a data connector.',
  client_history:
    'Advisory client history is available through the Carlota Jo Consulting platform.',
  benchmarks:
    'Industry benchmark data — live connector not configured. Requires a market intelligence service.',
};

const STUB_TOOL_PARAMETERS: Record<string, unknown> = {
  weather_marine: {
    type: 'object',
    properties: { region: { type: 'string', description: 'Geographic region or port name' } },
    required: [],
  },
  cve_database: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query (CVE ID, software name, or vulnerability type)' },
    },
    required: ['query'],
  },
  nvd_api: {
    type: 'object',
    properties: {
      cveId: { type: 'string', description: 'CVE identifier (e.g. CVE-2024-12345)' },
      keyword: { type: 'string', description: 'Keyword search across vulnerability descriptions' },
    },
    required: [],
  },
  huggingface_search: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query (model name, task type, architecture)' },
      task: { type: 'string', description: 'ML task filter' },
    },
    required: ['query'],
  },
  arxiv_search: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query for paper titles and abstracts' },
      maxResults: { type: 'number', description: 'Maximum papers to return (default 5)' },
    },
    required: ['query'],
  },
  model_registry: {
    type: 'object',
    properties: {
      domain: { type: 'string', description: 'Domain filter (nlp, vision, multimodal)' },
      status: { type: 'string', description: 'Status filter (production, staging, deprecated)' },
    },
    required: [],
  },
  content_strategy: {
    type: 'object',
    properties: {
      objective: { type: 'string', description: 'Campaign or content objective' },
      audience: { type: 'string', description: 'Target audience description' },
    },
    required: ['objective'],
  },
  market_feeds: {
    type: 'object',
    properties: {
      symbols: { type: 'array', items: { type: 'string' }, description: 'List of ticker symbols' },
      period: { type: 'string', description: 'Data period (1d, 1w, 1m)' },
    },
    required: [],
  },
  risk_models: {
    type: 'object',
    properties: {
      portfolioId: { type: 'string', description: 'Portfolio to analyze' },
      modelType: {
        type: 'string',
        enum: ['var', 'cvar', 'stress', 'scenario'],
        description: 'Risk model type',
      },
    },
    required: [],
  },
  deal_analytics: {
    type: 'object',
    properties: {
      stage: { type: 'string', description: 'Deal stage filter' },
      sector: { type: 'string', description: 'Sector or industry filter' },
    },
    required: [],
  },
  market_comps: {
    type: 'object',
    properties: {
      address: { type: 'string', description: 'Property address for comp search' },
      radius: { type: 'number', description: 'Search radius in miles (default 1)' },
    },
    required: [],
  },
  geo_analysis: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'Address, neighborhood, or city to analyze' },
      analysisType: { type: 'string', description: 'Analysis type (flood, crime, school, demographics)' },
    },
    required: ['location'],
  },
  valuation_models: {
    type: 'object',
    properties: {
      propertyId: { type: 'string', description: 'Property to value' },
      modelType: { type: 'string', enum: ['dcf', 'cap_rate', 'avm', 'comp_based'], description: 'Valuation model type' },
    },
    required: [],
  },
  case_search: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search terms' },
      status: { type: 'string', description: 'Status filter (open, closed, pending)' },
    },
    required: [],
  },
  regulation_lookup: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Regulatory topic or area of law' },
      jurisdiction: { type: 'string', description: 'Jurisdiction (US Federal, NY State, EU)' },
    },
    required: ['topic'],
  },
  contract_analysis: {
    type: 'object',
    properties: {
      contractType: { type: 'string', description: 'Contract type (NDA, MSA, lease, SPA, employment)' },
      focusArea: { type: 'string', description: 'Focus area (liability, IP, termination, payment)' },
    },
    required: [],
  },
  engagement_tracking: {
    type: 'object',
    properties: {
      clientId: { type: 'string', description: 'Client identifier for engagement tracking' },
      period: { type: 'string', description: 'Time period (30d, 90d, 1y)' },
    },
    required: [],
  },
  proposal_generator: {
    type: 'object',
    properties: {
      clientId: { type: 'string', description: 'Client identifier for proposal context' },
      objective: { type: 'string', description: 'Proposal objective or client goal' },
    },
    required: ['objective'],
  },
  client_history: {
    type: 'object',
    properties: {
      clientId: { type: 'string', description: 'Client identifier' },
      limit: { type: 'number', description: 'Maximum historical records (default 20)' },
    },
    required: [],
  },
  benchmarks: {
    type: 'object',
    properties: {
      metric: { type: 'string', description: 'Benchmark metric name' },
      industry: { type: 'string', description: 'Industry or sector for benchmarking' },
    },
    required: [],
  },
};

function buildToolDefinitionsFromGateway(toolNames: string[]): ToolDefinition[] {
  ensureInitialized();
  const resolved: ToolDefinition[] = [];
  for (const agentToolName of toolNames) {
    const gatewayId = AGENT_TOOL_TO_GATEWAY_ID[agentToolName];
    if (gatewayId) {
      const manifest = defaultToolRegistry.get(gatewayId);
      if (manifest) {
        resolved.push({
          name: agentToolName,
          description: manifest.description,
          parameters: manifest.inputSchema as Record<string, unknown>,
        });
        continue;
      }
    }
    if (STUB_TOOL_DESCRIPTIONS[agentToolName]) {
      // Tools with no real platform backend are excluded from the LLM schema.
      // They cannot be called and the LLM reasons about them through its training.
      continue;
    }
    resolved.push({
      name: agentToolName,
      description: `${agentToolName} — domain data tool`,
      parameters: { type: 'object', properties: {}, required: [] } as Record<string, unknown>,
    });
  }
  return resolved;
}

export function getToolDefinitionsForAgent(toolNames: string[]): ToolDefinition[] {
  return buildToolDefinitionsFromGateway(toolNames);
}

export function toOpenAIToolSchema(
  toolDefs: ToolDefinition[],
): Array<{
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}> {
  return toolDefs.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

export function createToolExecutor(
  agentId: string,
): (toolName: string, args: Record<string, unknown>) => Promise<string> {
  ensureInitialized();
  return async (toolName: string, args: Record<string, unknown>): Promise<string> => {
    const gatewayId = AGENT_TOOL_TO_GATEWAY_ID[toolName];
    if (gatewayId) {
      const result = await defaultGateway.invoke(gatewayId, args, {
        requestId: `${agentId}-${toolName}-${Date.now()}`,
        agentId,
      });
      if (result.success) {
        return JSON.stringify(result.output ?? {});
      }
      if (result.decisionOutcome === 'require-approval' || result.decisionOutcome === 'require-dual-approval') {
        return JSON.stringify({
          status: 'pending-approval',
          message: `Tool '${toolName}' requires human approval before execution.`,
          decisionOutcome: result.decisionOutcome,
        });
      }
      return JSON.stringify({
        error: result.error ?? 'Tool execution failed',
        toolName,
        decisionOutcome: result.decisionOutcome,
      });
    }

    const stubMessage = STUB_TOOL_DESCRIPTIONS[toolName];
    if (stubMessage) {
      return JSON.stringify({ toolName, message: stubMessage, timestamp: new Date().toISOString() });
    }

    return JSON.stringify({ error: `Unknown tool: ${toolName}`, agentId });
  };
}

export interface GatewayToolResult {
  output: string;
  success: boolean;
  decisionOutcome?: string;
  traceId?: string;
  latencyMs: number;
}

export async function invokeToolWithGovernance(
  agentId: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<GatewayToolResult> {
  ensureInitialized();
  const t0 = Date.now();
  const gatewayId = AGENT_TOOL_TO_GATEWAY_ID[toolName];
  if (gatewayId) {
    const result = await defaultGateway.invoke(gatewayId, args, {
      requestId: `${agentId}-${toolName}-${Date.now()}`,
      agentId,
    });
    const latencyMs = Date.now() - t0;
    if (result.success) {
      return {
        output: JSON.stringify(result.output ?? {}),
        success: true,
        decisionOutcome: result.decisionOutcome,
        traceId: result.traceId,
        latencyMs,
      };
    }
    if (
      result.decisionOutcome === 'require-approval' ||
      result.decisionOutcome === 'require-dual-approval'
    ) {
      return {
        output: JSON.stringify({
          status: 'pending-approval',
          message: `Tool '${toolName}' requires human approval before execution.`,
          decisionOutcome: result.decisionOutcome,
        }),
        success: false,
        decisionOutcome: result.decisionOutcome,
        traceId: result.traceId,
        latencyMs,
      };
    }
    return {
      output: JSON.stringify({ error: result.error ?? 'Tool execution failed', toolName }),
      success: false,
      decisionOutcome: result.decisionOutcome,
      traceId: result.traceId,
      latencyMs,
    };
  }
  const stubMessage = STUB_TOOL_DESCRIPTIONS[toolName];
  const latencyMs = Date.now() - t0;
  if (stubMessage) {
    return {
      output: JSON.stringify({ toolName, message: stubMessage, timestamp: new Date().toISOString() }),
      success: true,
      decisionOutcome: 'allow',
      latencyMs,
    };
  }
  return {
    output: JSON.stringify({ error: `Unknown tool: ${toolName}`, agentId }),
    success: false,
    decisionOutcome: 'deny',
    latencyMs,
  };
}

export async function recordToolCall(
  agentId: string,
  toolName: string,
  input: Record<string, unknown>,
  output: string,
  success: boolean,
  latencyMs: number,
  governance?: { decisionOutcome?: string; traceId?: string },
): Promise<void> {
  try {
    const { db, agentToolCalls } = await import('@szl-holdings/db');
    await db
      .insert(agentToolCalls)
      .values({
        agentId,
        toolName,
        input: JSON.stringify(input),
        output: output.slice(0, 4000),
        success,
        latencyMs,
        governanceVerdict: governance?.decisionOutcome ?? 'allow',
        traceId: governance?.traceId ?? null,
      })
      .onConflictDoNothing();
  } catch (err) {
    const pino = (await import('pino')).default;
    const log = pino({ level: 'error' });
    log.error({ agentId, toolName, err: String(err) }, '[tool-bridge] AUDIT WRITE FAILURE — tool call not recorded in agent_tool_calls');
  }
}
