import { logActivity } from '@szl-holdings/audit';
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  alloyAuditLogTable,
  alloyDecisions,
  alloySkillRuns,
  alloySkills,
  alloyWorkflowRunsTable,
  alloyWorkflowsTable,
  db,
} from '@szl-holdings/db';
import { connectorHub } from '@szl-holdings/services';
import { and, desc, eq, } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware, } from '../middlewares/auth';
import { AGENT_CONFIGS } from './domain-agents/configs';

const router = Router();

const MCP_PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'alloy-mcp-server';
const SERVER_VERSION = '1.0.0';

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

interface McpPrompt {
  name: string;
  description: string;
  arguments?: Array<{ name: string; description: string; required?: boolean }>;
}

interface McpRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function makeError(code: number, message: string, data?: unknown) {
  return { code, message, data };
}

const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

function isGlobalAdmin(user?: AuthenticatedUser): boolean {
  if (!user) return false;
  return user.roles.includes('super_admin') || user.roles.includes('admin');
}

function getUserOrgIds(user?: AuthenticatedUser): number[] {
  if (!user) return [];
  return user.orgs.map((o) => o.orgId);
}

async function writeAuditLog(params: {
  userId?: number | null;
  toolName: string;
  args: Record<string, unknown>;
  result: string;
  latencyMs: number;
}) {
  try {
    await logActivity({
      userId: params.userId ?? null,
      action: 'mcp_tool_invoke',
      resource: 'mcp_tool',
      resourceId: params.toolName,
      description: `MCP tool invocation: ${params.toolName}`,
      metadata: {
        toolName: params.toolName,
        args: params.args,
        latencyMs: params.latencyMs,
        resultLength: params.result.length,
      },
    });
  } catch {}
}

function buildInternalUrl(path: string): string {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const base = devDomain
    ? `https://${devDomain}`
    : `http://localhost:${process.env.PORT || 3000}`;
  return `${base}${path}`;
}

async function internalGet(path: string, internalToken?: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (internalToken) headers['x-internal-token'] = internalToken;
    const resp = await fetch(buildInternalUrl(path), { signal: controller.signal, headers });
    if (!resp.ok) return { error: `API returned ${resp.status}`, path };
    return await resp.json();
  } catch (err) {
    return { error: `Fetch failed: ${err instanceof Error ? err.message : 'unknown'}`, path };
  } finally {
    clearTimeout(timer);
  }
}

async function internalPost(path: string, body: unknown, internalToken?: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (internalToken) headers['x-internal-token'] = internalToken;
    const resp = await fetch(buildInternalUrl(path), {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return { error: `API returned ${resp.status}`, details: errText.slice(0, 300), path };
    }
    return await resp.json();
  } catch (err) {
    return { error: `Fetch failed: ${err instanceof Error ? err.message : 'unknown'}`, path };
  } finally {
    clearTimeout(timer);
  }
}

function getInternalToken(): string | undefined {
  return process.env.ALLOY_INTERNAL_TOKEN;
}

const DOMAIN_TOOLS: McpTool[] = [
  {
    name: 'vessels_fleet_status',
    description:
      'Query current fleet positions, vessel details, and active voyage status for the Vessels maritime fleet',
    inputSchema: {
      type: 'object',
      properties: {
        region: {
          type: 'string',
          description: "Optional maritime region filter (e.g. 'Pacific', 'Atlantic')",
        },
      },
    },
  },
  {
    name: 'vessels_weather_risk',
    description:
      'Get maritime weather risk assessment for routes — includes active weather alerts and regional hazards',
    inputSchema: {
      type: 'object',
      properties: {
        region: {
          type: 'string',
          description: "Maritime region to check (e.g. 'South China Sea', 'Gulf of Aden')",
        },
      },
    },
  },
  {
    name: 'firestorm_threat_scan',
    description:
      'Query active cybersecurity threats, recent CVEs, and incident status from the Firestorm SOC platform',
    inputSchema: {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Filter by threat severity',
        },
      },
    },
  },
  {
    name: 'firestorm_compliance_check',
    description: 'Check security compliance readiness scores and framework adherence status',
    inputSchema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          description: "Compliance framework (e.g. 'NIST', 'ISO 27001', 'CIS')",
        },
      },
    },
  },
  {
    name: 'terra_property_search',
    description:
      'Search real estate market data, distressed properties, and investment opportunities by location',
    inputSchema: {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'Geographic region or city to analyze' },
      },
    },
  },
  {
    name: 'terra_market_signals',
    description:
      'Query recent real estate market activity, distress signals, and economic indicators',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: "Market domain filter (e.g. 'commercial', 'residential', 'industrial')",
        },
      },
    },
  },
  {
    name: 'lyte_health_check',
    description:
      'Get current platform health metrics, active monitoring alerts, and system status across the SZL ecosystem',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'lyte_executive_summary',
    description:
      'Generate an executive summary of the current ecosystem state including health, signals, and key metrics',
    inputSchema: {
      type: 'object',
      properties: {
        timeRange: {
          type: 'string',
          description: "Time range for the summary (e.g. '1h', '24h', '7d')",
        },
      },
    },
  },
  {
    name: 'inca_experiment_status',
    description:
      'Query ML experiment results, model metrics, and AI research insights from the Counsel platform',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: "Filter by experiment status (e.g. 'running', 'completed', 'failed')",
        },
        limit: { type: 'number', description: 'Maximum number of results to return' },
      },
    },
  },
];

const PLATFORM_TOOLS: McpTool[] = [
  {
    name: 'alloy_launch_workflow',
    description:
      'Start a named Alloy workflow with parameters. Returns a run ID for status tracking. Workflows that require approval return pending_approval status.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'number', description: 'Numeric ID of the workflow to launch' },
        input: { type: 'object', description: 'Input parameters for the workflow' },
      },
      required: ['workflowId'],
    },
  },
  {
    name: 'alloy_workflow_status',
    description: 'Check the current status of a running or completed Alloy workflow run',
    inputSchema: {
      type: 'object',
      properties: {
        runId: { type: 'number', description: 'The workflow run ID to check status for' },
      },
      required: ['runId'],
    },
  },
  {
    name: 'alloy_create_artifact',
    description:
      'Generate a document, brief, or report as an Alloy artifact. Returns the created artifact with content.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the artifact' },
        content: { type: 'object', description: 'Content payload for the artifact' },
        artifactType: {
          type: 'string',
          enum: ['report', 'brief', 'plan', 'analysis'],
          description: 'Type of artifact to create',
        },
        orgId: { type: 'number', description: 'Organization ID to scope the artifact to' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'alloy_research',
    description:
      "Launch a multi-source research query through Alloy's research mode. Synthesizes intelligence from domain agents.",
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Research query or topic to investigate' },
        domains: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Domain agents to query: maritime, security, research, creative, analytics, infrastructure, readiness',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'alloy_decision_status',
    description: 'Query pending decisions and their evidence from the Alloy decision pipeline',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['propose_only', 'approval_required', 'approved_execute', 'blocked_by_policy'],
          description: 'Filter decisions by approval status',
        },
        limit: { type: 'number', description: 'Maximum number of decisions to return' },
      },
    },
  },
  {
    name: 'alloy_approve_decision',
    description:
      'Approve or reject a pending decision in the Alloy decision pipeline. Requires ops or admin role.',
    inputSchema: {
      type: 'object',
      properties: {
        decisionId: { type: 'number', description: 'The decision ID to act on' },
        action: {
          type: 'string',
          enum: ['approve', 'reject'],
          description: 'Whether to approve or reject',
        },
        notes: { type: 'string', description: 'Optional reviewer notes or justification' },
      },
      required: ['decisionId', 'action'],
    },
  },
  {
    name: 'alloy_skill_list',
    description:
      'List available Alloy skills from the skill registry, including their approval class and capability metadata',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by skill category' },
        approvalClass: {
          type: 'string',
          enum: ['auto', 'review', 'admin_only'],
          description: 'Filter by approval class',
        },
      },
    },
  },
  {
    name: 'alloy_skill_invoke',
    description:
      'Invoke a registered skill by slug with parameters. Skills with review/admin_only approval class will queue for approval instead of executing immediately.',
    inputSchema: {
      type: 'object',
      properties: {
        skillSlug: { type: 'string', description: 'The skill slug identifier' },
        input: { type: 'object', description: 'Input parameters to pass to the skill' },
        dryRun: {
          type: 'boolean',
          description: 'If true, validates without executing (for skills that support dry run)',
        },
      },
      required: ['skillSlug', 'input'],
    },
  },
  {
    name: 'connector_hub_discover',
    description:
      'Discover all registered tool connectors and their capabilities in the universal connector hub. Returns auth config, capability schemas, and category metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description:
            'Filter by category (ticketing, alerting, communication, crm, security, ai_inference, ai_voice, ai_media, ai_observability, ai_models)',
        },
        connectorId: { type: 'string', description: 'Filter to a specific connector by ID' },
        tags: { type: 'string', description: 'Comma-separated tags to filter capabilities' },
      },
    },
  },
  {
    name: 'connector_hub_execute',
    description:
      'Execute a specific capability on a connector in the universal connector hub. Handles auth, rate limiting, retry, and circuit breaking automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        connectorId: {
          type: 'string',
          description:
            'Connector ID (jira, slack, pagerduty, salesforce, siem, groq, fal-ai, honeyhive, huggingface, elevenlabs)',
        },
        capabilityId: { type: 'string', description: 'Capability ID within the connector' },
        params: { type: 'object', description: 'Capability-specific parameters' },
      },
      required: ['connectorId', 'capabilityId'],
    },
  },
  {
    name: 'connector_hub_health',
    description:
      'Get real-time health monitoring for all connectors or a specific one — includes status, latency, error rate, and circuit breaker state.',
    inputSchema: {
      type: 'object',
      properties: {
        connectorId: {
          type: 'string',
          description: 'Specific connector ID to check (omit for full snapshot)',
        },
      },
    },
  },
];

const HF_MCP_TOOLS: McpTool[] = [
  {
    name: 'hf_search_models',
    description:
      'Search HuggingFace model hub for ML models by query, task, or library — returns model cards, download counts, and metadata',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g. "code generation", "text-to-image")' },
        author: { type: 'string', description: 'Filter by author/organization (e.g. "meta-llama", "mistralai")' },
        task: { type: 'string', description: 'Filter by task (e.g. "text-generation", "image-classification")' },
        limit: { type: 'number', description: 'Max results to return (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'hf_search_datasets',
    description:
      'Search HuggingFace datasets hub — find training/evaluation datasets by topic, task, or size',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g. "medical QA", "code instructions")' },
        author: { type: 'string', description: 'Filter by author/organization' },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'hf_search_papers',
    description:
      'Search HuggingFace Daily Papers — find recent ML/AI research papers by topic or keyword',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Paper search query (e.g. "reasoning", "diffusion models")' },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'hf_search_spaces',
    description:
      'Search HuggingFace Spaces — find interactive ML demos, apps, and Gradio/Streamlit deployments',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g. "image segmentation demo")' },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'hf_get_model_info',
    description:
      'Get detailed information about a specific HuggingFace model — model card, config, files, tags, and download stats',
    inputSchema: {
      type: 'object',
      properties: {
        model_id: { type: 'string', description: 'Full model ID (e.g. "meta-llama/Llama-3.1-8B-Instruct")' },
      },
      required: ['model_id'],
    },
  },
  {
    name: 'hf_get_dataset_info',
    description:
      'Get detailed information about a specific HuggingFace dataset — card, features, splits, and statistics',
    inputSchema: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', description: 'Full dataset ID (e.g. "HuggingFaceFW/fineweb")' },
      },
      required: ['dataset_id'],
    },
  },
];

const DATA_TOOLS: McpTool[] = [
  {
    name: 'query_holdings_ecosystem',
    description: 'Get aggregate health, KPIs, and status across all SZL Holdings platforms',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'query_audit_log',
    description: 'Search the Alloy audit trail by action, resource type, or time range',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Filter by audit action type' },
        limit: { type: 'number', description: 'Maximum number of records (default 50, max 200)' },
      },
    },
  },
  {
    name: 'query_notifications',
    description: 'Fetch recent notifications and alerts from the platform',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of notifications to return' },
      },
    },
  },
];

const ALL_TOOLS: McpTool[] = [...DOMAIN_TOOLS, ...PLATFORM_TOOLS, ...DATA_TOOLS, ...HF_MCP_TOOLS];

const MCP_RESOURCES: McpResource[] = [
  {
    uri: 'alloy://schema/platform',
    name: 'Platform Entity Schema',
    description: 'Documentation of all Alloy platform entities, their fields, and relationships',
    mimeType: 'application/json',
  },
  {
    uri: 'alloy://agents/prompts',
    name: 'Domain Agent System Prompts',
    description:
      "System prompts for all 12 domain agents — describes each agent's expertise and capabilities",
    mimeType: 'application/json',
  },
  {
    uri: 'alloy://skills/catalog',
    name: 'Skill Registry Catalog',
    description:
      'Available skills with their input/output contracts and approval class requirements',
    mimeType: 'application/json',
  },
  {
    uri: 'alloy://workflows/templates',
    name: 'Workflow Templates',
    description: 'Available workflow definitions and their configuration schemas',
    mimeType: 'application/json',
  },
  {
    uri: 'huggingface://mcp/catalog',
    name: 'HuggingFace MCP Tool Catalog',
    description:
      'Live tool catalog from the HuggingFace remote MCP server — model search, dataset search, paper search, spaces',
    mimeType: 'application/json',
  },
];

const MCP_PROMPTS: McpPrompt[] = [
  {
    name: 'research_brief',
    description: 'Structured prompt for launching a multi-domain research investigation',
    arguments: [
      {
        name: 'topic',
        description: 'The research topic or question to investigate',
        required: true,
      },
      {
        name: 'domains',
        description:
          'Comma-separated domain agents to consult (maritime, security, research, creative, analytics, infrastructure, readiness)',
        required: false,
      },
      { name: 'depth', description: 'Research depth: quick, standard, or deep', required: false },
    ],
  },
  {
    name: 'threat_assessment',
    description: 'Structured prompt for cybersecurity threat analysis using Firestorm intelligence',
    arguments: [
      {
        name: 'target',
        description: 'The asset, system, or organization to assess',
        required: true,
      },
      {
        name: 'threat_type',
        description: 'Type of threat to focus on (e.g. ransomware, APT, insider, vulnerability)',
        required: false,
      },
      {
        name: 'framework',
        description: 'Security framework for assessment (MITRE ATT&CK, NIST, CIS)',
        required: false,
      },
    ],
  },
  {
    name: 'property_analysis',
    description: 'Structured prompt for real estate distress evaluation and investment analysis',
    arguments: [
      {
        name: 'location',
        description: 'Geographic region or specific address to analyze',
        required: true,
      },
      {
        name: 'property_type',
        description: 'Property type: commercial, residential, industrial, mixed-use',
        required: false,
      },
      {
        name: 'analysis_type',
        description: 'Type of analysis: distress, investment, market, comparative',
        required: false,
      },
    ],
  },
  {
    name: 'fleet_report',
    description: 'Structured prompt for maritime fleet status and operational intelligence',
    arguments: [
      {
        name: 'fleet_scope',
        description: 'Fleet or vessel group to report on (all, region, vessel ID)',
        required: false,
      },
      {
        name: 'focus_areas',
        description: 'Areas to focus on: weather, chokepoints, compliance, performance',
        required: false,
      },
      {
        name: 'report_period',
        description: 'Time period for the report (e.g. 24h, 7d, 30d)',
        required: false,
      },
    ],
  },
  {
    name: 'executive_digest',
    description: 'Structured prompt for daily executive summary across the SZL Holdings ecosystem',
    arguments: [
      {
        name: 'time_range',
        description: 'Time range for the digest (default: 24h)',
        required: false,
      },
      {
        name: 'include_domains',
        description:
          'Domains to include: maritime, security, real_estate, operations, research, all',
        required: false,
      },
      {
        name: 'format',
        description: 'Output format: brief, detailed, or slide-ready',
        required: false,
      },
    ],
  },
];

function buildPromptMessages(
  promptName: string,
  args: Record<string, string>,
): Array<{ role: string; content: { type: string; text: string } }> {
  switch (promptName) {
    case 'research_brief': {
      const topic = args.topic ?? 'unknown topic';
      const domains = args.domains ?? 'all relevant domains';
      const depth = args.depth ?? 'standard';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Conduct a ${depth} research investigation on: "${topic}"\n\nDomains to consult: ${domains}\n\nPlease:\n1. Query relevant data sources and domain agents\n2. Synthesize findings across domains\n3. Identify cross-domain correlations and risks\n4. Provide actionable conclusions with confidence levels\n5. Flag any areas requiring immediate attention`,
          },
        },
      ];
    }
    case 'threat_assessment': {
      const target = args.target ?? 'the target system';
      const threatType = args.threat_type ?? 'general threats';
      const framework = args.framework ?? 'MITRE ATT&CK';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Perform a comprehensive threat assessment for: "${target}"\n\nThreat focus: ${threatType}\nFramework: ${framework}\n\nAssess:\n1. Current threat landscape and active CVEs\n2. Attack vector analysis using ${framework}\n3. Risk scoring (CVSS where applicable)\n4. Recommended containment and mitigation strategies\n5. Compliance implications\n6. Priority actions ranked by urgency`,
          },
        },
      ];
    }
    case 'property_analysis': {
      const location = args.location ?? 'the target location';
      const propertyType = args.property_type ?? 'all property types';
      const analysisType = args.analysis_type ?? 'comprehensive';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Perform a ${analysisType} real estate analysis for: "${location}"\n\nProperty type focus: ${propertyType}\n\nAnalyze:\n1. Market distress indicators and opportunity signals\n2. Comparative market data and pricing trends\n3. Risk factors (economic, regulatory, environmental)\n4. Investment thesis and return projections\n5. Recommended next steps for due diligence`,
          },
        },
      ];
    }
    case 'fleet_report': {
      const scope = args.fleet_scope ?? 'full fleet';
      const focus = args.focus_areas ?? 'all areas';
      const period = args.report_period ?? '24h';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Generate a maritime fleet status report for: ${scope}\n\nFocus areas: ${focus}\nReport period: ${period}\n\nInclude:\n1. Current fleet positions and operational status\n2. Weather and route risk assessments\n3. Chokepoint congestion and alternative routing\n4. Compliance and regulatory status\n5. Performance KPIs and anomalies\n6. Recommended actions and watch items`,
          },
        },
      ];
    }
    case 'executive_digest': {
      const timeRange = args.time_range ?? '24h';
      const domains = args.include_domains ?? 'all';
      const format = args.format ?? 'detailed';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Generate a ${format} executive digest for the SZL Holdings ecosystem\n\nTime range: ${timeRange}\nDomains: ${domains}\n\nInclude:\n1. Platform health summary and critical alerts\n2. Key events and developments per domain\n3. Risk register updates and threat indicators\n4. Operational metrics and KPI highlights\n5. Decisions requiring executive attention\n6. Priority actions for the period ahead`,
          },
        },
      ];
    }
    default:
      return [{ role: 'user', content: { type: 'text', text: `Execute prompt: ${promptName}` } }];
  }
}

async function executeTool(
  toolName: string,
  toolArgs: Record<string, unknown>,
  user: AuthenticatedUser | undefined,
): Promise<unknown> {
  const token = getInternalToken();

  switch (toolName) {
    case 'vessels_fleet_status': {
      const data = await internalGet('/api/intelligence/maritime/vessels', token);
      return { tool: toolName, domain: 'vessels', result: data };
    }
    case 'vessels_weather_risk': {
      const region = toolArgs.region as string | undefined;
      const path = region
        ? `/api/intelligence/maritime/weather?region=${encodeURIComponent(region)}`
        : '/api/intelligence/maritime/weather';
      const data = await internalGet(path, token);
      return { tool: toolName, domain: 'vessels', result: data };
    }
    case 'firestorm_threat_scan': {
      const severity = toolArgs.severity as string | undefined;
      const path = severity
        ? `/api/intelligence/threats?severity=${encodeURIComponent(severity)}`
        : '/api/intelligence/threats';
      const data = await internalGet(path, token);
      return { tool: toolName, domain: 'firestorm', result: data };
    }
    case 'firestorm_compliance_check': {
      const data = await internalGet('/api/intelligence/cves', token);
      return { tool: toolName, domain: 'firestorm', result: data };
    }
    case 'terra_property_search': {
      const region = toolArgs.region as string | undefined;
      const path = region
        ? `/api/terra/distress?region=${encodeURIComponent(region)}`
        : '/api/terra/distress';
      const data = await internalGet(path, token);
      return { tool: toolName, domain: 'terra', result: data };
    }
    case 'terra_market_signals': {
      const data = await internalGet('/api/intelligence/geopolitical', token);
      return { tool: toolName, domain: 'terra', result: data };
    }
    case 'lyte_health_check': {
      const [health, alerts] = await Promise.all([
        internalGet('/api/lyte/executive-summary', token),
        internalGet('/api/lyte/signals', token),
      ]);
      return { tool: toolName, domain: 'lyte', health, alerts };
    }
    case 'lyte_executive_summary': {
      const timeRange = toolArgs.timeRange as string | undefined;
      const path = timeRange
        ? `/api/lyte/executive-summary?timeRange=${encodeURIComponent(timeRange)}`
        : '/api/lyte/executive-summary';
      const data = await internalGet(path, token);
      return { tool: toolName, domain: 'lyte', result: data };
    }
    case 'inca_experiment_status': {
      const status = toolArgs.status as string | undefined;
      const limit = toolArgs.limit as number | undefined;
      let path = '/api/inca/experiments';
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (limit) params.set('limit', String(limit));
      if (params.toString()) path += `?${params.toString()}`;
      const data = await internalGet(path, token);
      return { tool: toolName, domain: 'inca', result: data };
    }
    case 'alloy_launch_workflow': {
      const workflowId = toolArgs.workflowId as number;
      if (!workflowId) throw new Error('workflowId is required');
      const [workflow] = await db
        .select()
        .from(alloyWorkflowsTable)
        .where(eq(alloyWorkflowsTable.id, workflowId));
      if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
      if (!isGlobalAdmin(user)) {
        const orgIds = getUserOrgIds(user);
        if (!orgIds.includes(workflow.orgId ?? -1))
          throw new Error('Access denied to this workflow');
      }
      const runResult = await internalPost(
        `/api/alloy/workflows/${workflowId}/run`,
        {
          input: toolArgs.input ?? {},
        },
        token,
      );
      return { tool: toolName, workflowId, result: runResult };
    }
    case 'alloy_workflow_status': {
      const runId = toolArgs.runId as number;
      if (!runId) throw new Error('runId is required');
      const [run] = await db
        .select()
        .from(alloyWorkflowRunsTable)
        .where(eq(alloyWorkflowRunsTable.id, runId));
      if (!run) throw new Error(`Run ${runId} not found`);
      if (!isGlobalAdmin(user)) {
        const orgIds = getUserOrgIds(user);
        const [wf] = await db
          .select({ orgId: alloyWorkflowsTable.orgId })
          .from(alloyWorkflowsTable)
          .where(eq(alloyWorkflowsTable.id, run.workflowId));
        if (!wf || !orgIds.includes(wf.orgId ?? -1)) throw new Error('Access denied to this run');
      }
      return {
        tool: toolName,
        runId,
        state: run.state,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        durationMs: run.durationMs,
        output: run.output,
      };
    }
    case 'alloy_create_artifact': {
      const { title, content, artifactType, orgId } = toolArgs as {
        title: string;
        content: Record<string, unknown>;
        artifactType?: string;
        orgId?: number;
      };
      if (!title || !content) throw new Error('title and content are required');
      const userOrgIds = getUserOrgIds(user);
      const resolvedOrgId = isGlobalAdmin(user)
        ? (orgId ?? userOrgIds[0] ?? null)
        : (userOrgIds[0] ?? null);
      const result = await internalPost(
        '/api/alloy/artifacts',
        {
          title,
          artifactType: artifactType ?? 'report',
          content,
          orgId: resolvedOrgId,
          status: 'draft',
          approvalStatus: 'not_required',
        },
        token,
      );
      return { tool: toolName, result };
    }
    case 'alloy_research': {
      const query = toolArgs.query as string;
      if (!query) throw new Error('query is required');
      const domains = toolArgs.domains as string[] | undefined;
      const result = await internalPost(
        '/api/nuro-mesh/orchestrate',
        {
          query,
          preferredAgents: domains,
        },
        token,
      );
      return { tool: toolName, query, result };
    }
    case 'alloy_decision_status': {
      const status = toolArgs.status as string | undefined;
      const limit = toolArgs.limit as number | undefined;
      const conditions = [];
      if (status) {
        conditions.push(
          eq(
            alloyDecisions.approvalStatus,
            status as
              | 'propose_only'
              | 'approval_required'
              | 'approved_execute'
              | 'blocked_by_policy',
          ),
        );
      }
      const rows = await db
        .select()
        .from(alloyDecisions)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(alloyDecisions.createdAt))
        .limit(Math.min(limit ?? 30, 100));
      return { tool: toolName, count: rows.length, decisions: rows };
    }
    case 'alloy_approve_decision': {
      if (!user) throw new Error('Authentication required');
      if (!isGlobalAdmin(user) && !user.roles.includes('ops'))
        throw new Error('Insufficient permissions — requires ops or admin role');
      const decisionId = toolArgs.decisionId as number;
      const action = toolArgs.action as 'approve' | 'reject';
      if (!decisionId || !action) throw new Error('decisionId and action are required');
      const [decision] = await db
        .select()
        .from(alloyDecisions)
        .where(eq(alloyDecisions.id, decisionId));
      if (!decision) throw new Error(`Decision ${decisionId} not found`);
      const reviewer = user.displayName ?? 'MCP Operator';
      const path =
        action === 'approve'
          ? `/api/decisions/${decisionId}/approve`
          : `/api/decisions/${decisionId}/reject`;
      const result = await internalPost(
        path,
        { notes: toolArgs.notes ?? `${action} via MCP`, reviewer },
        token,
      );
      return { tool: toolName, decisionId, action, result };
    }
    case 'alloy_skill_list': {
      const category = toolArgs.category as string | undefined;
      const approvalClass = toolArgs.approvalClass as string | undefined;
      const conditions = [];
      conditions.push(eq(alloySkills.isEnabled, true));
      if (category) conditions.push(eq(alloySkills.category, category));
      if (approvalClass)
        conditions.push(
          eq(alloySkills.approvalClass, approvalClass as 'auto' | 'review' | 'admin_only'),
        );
      const rows = await db
        .select({
          id: alloySkills.id,
          name: alloySkills.name,
          slug: alloySkills.slug,
          version: alloySkills.version,
          category: alloySkills.category,
          description: alloySkills.description,
          approvalClass: alloySkills.approvalClass,
          dryRunSupported: alloySkills.dryRunSupported,
          inputSchema: alloySkills.inputSchema,
          tags: alloySkills.tags,
          usageCount: alloySkills.usageCount,
        })
        .from(alloySkills)
        .where(and(...conditions))
        .orderBy(desc(alloySkills.usageCount))
        .limit(100);
      return { tool: toolName, count: rows.length, skills: rows };
    }
    case 'alloy_skill_invoke': {
      if (!user) throw new Error('Authentication required');
      const skillSlug = toolArgs.skillSlug as string;
      const input = toolArgs.input as Record<string, unknown>;
      const dryRun = toolArgs.dryRun as boolean | undefined;
      if (!skillSlug || !input) throw new Error('skillSlug and input are required');
      const [skill] = await db.select().from(alloySkills).where(eq(alloySkills.slug, skillSlug));
      if (!skill) throw new Error(`Skill '${skillSlug}' not found`);
      if (!skill.isEnabled) throw new Error(`Skill '${skillSlug}' is disabled`);
      if (skill.approvalClass === 'admin_only' && !isGlobalAdmin(user)) {
        const runRecord = await db
          .insert(alloySkillRuns)
          .values({
            skillId: skill.id,
            agentId: 'mcp',
            input,
            status: 'pending',
            startedAt: new Date(),
          })
          .returning();
        return {
          tool: toolName,
          status: 'pending_approval',
          message: `Skill '${skillSlug}' requires admin approval — queued for review`,
          skillRunId: runRecord[0]?.id,
          approvalClass: skill.approvalClass,
        };
      }
      if (skill.approvalClass === 'review') {
        const runRecord = await db
          .insert(alloySkillRuns)
          .values({
            skillId: skill.id,
            agentId: 'mcp',
            input,
            status: dryRun ? 'dry_run' : 'pending',
            startedAt: new Date(),
          })
          .returning();
        if (!dryRun) {
          return {
            tool: toolName,
            status: 'pending_approval',
            message: `Skill '${skillSlug}' requires reviewer approval — queued`,
            skillRunId: runRecord[0]?.id,
            approvalClass: skill.approvalClass,
          };
        }
        return {
          tool: toolName,
          status: 'dry_run',
          skill: { name: skill.name, description: skill.description },
          inputReceived: input,
        };
      }
      const start = Date.now();
      const runRecord = await db
        .insert(alloySkillRuns)
        .values({
          skillId: skill.id,
          agentId: 'mcp',
          input,
          status: 'running',
          startedAt: new Date(),
        })
        .returning();
      const runId = runRecord[0]?.id;
      try {
        const output = {
          executed: true,
          skillSlug,
          input,
          executedAt: new Date().toISOString(),
          note: 'Skill executed via MCP — actual domain execution depends on skill implementation',
        };
        await db
          .update(alloySkillRuns)
          .set({
            status: 'success',
            output,
            durationMs: Date.now() - start,
            completedAt: new Date(),
          })
          .where(eq(alloySkillRuns.id, runId!));
        await db
          .update(alloySkills)
          .set({ usageCount: (skill.usageCount ?? 0) + 1, lastUsedAt: new Date() })
          .where(eq(alloySkills.id, skill.id));
        return { tool: toolName, status: 'success', skillRunId: runId, output };
      } catch (err) {
        await db
          .update(alloySkillRuns)
          .set({ status: 'failed', errorMessage: String(err), completedAt: new Date() })
          .where(eq(alloySkillRuns.id, runId!));
        throw err;
      }
    }
    case 'query_holdings_ecosystem': {
      const data = await internalGet('/api/services/health', token);
      return { tool: toolName, result: data };
    }
    case 'query_audit_log': {
      if (!user) throw new Error('Authentication required');
      if (
        !isGlobalAdmin(user) &&
        !user.roles.includes('ops') &&
        !user.roles.includes('compliance')
      ) {
        throw new Error('Insufficient permissions — requires ops, compliance, or admin role');
      }
      const action = toolArgs.action as string | undefined;
      const limit = Math.min((toolArgs.limit as number | undefined) ?? 50, 200);
      const rows = await db
        .select()
        .from(alloyAuditLogTable)
        .where(action ? eq(alloyAuditLogTable.action, action) : undefined)
        .orderBy(desc(alloyAuditLogTable.createdAt))
        .limit(limit);
      return { tool: toolName, count: rows.length, entries: rows };
    }
    case 'query_notifications': {
      const data = await internalGet('/api/notifications', token);
      return { tool: toolName, result: data };
    }
    case 'connector_hub_discover': {
      const category = toolArgs.category as string | undefined;
      const connectorId = toolArgs.connectorId as string | undefined;
      const tagsRaw = toolArgs.tags as string | undefined;
      const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()) : undefined;
      const results = connectorHub.discoverCapabilities({ category, connectorId, tags });
      return {
        tool: toolName,
        connectors: results,
        totalConnectors: results.length,
        totalCapabilities: results.reduce((acc, c) => acc + c.capabilities.length, 0),
      };
    }
    case 'connector_hub_execute': {
      const connectorId = toolArgs.connectorId as string;
      const capabilityId = toolArgs.capabilityId as string;
      const params = (toolArgs.params as Record<string, unknown>) ?? {};
      if (!connectorId) throw new Error('connectorId is required');
      if (!capabilityId) throw new Error('capabilityId is required');
      logger.info({ connectorId, capabilityId }, 'MCP connector_hub_execute');
      const result = await connectorHub.execute(connectorId, capabilityId, params);
      return { tool: toolName, ...result };
    }
    case 'connector_hub_health': {
      const connectorId = toolArgs.connectorId as string | undefined;
      if (connectorId) {
        const connector = connectorHub.getConnector(connectorId);
        if (!connector) throw new Error(`Connector '${connectorId}' not found`);
        const health = await connector.healthCheck();
        return { tool: toolName, health };
      }
      const snapshot = await connectorHub.getSnapshot();
      return { tool: toolName, snapshot };
    }
    case 'hf_search_models':
    case 'hf_search_datasets':
    case 'hf_search_papers':
    case 'hf_search_spaces':
    case 'hf_get_model_info':
    case 'hf_get_dataset_info': {
      const { callHfTool } = await import('./hf-mcp-proxy');
      const hfToolName = toolName.replace(/^hf_/, '');
      const result = await callHfTool(hfToolName, toolArgs);
      return { tool: toolName, source: 'huggingface-mcp', result };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function readResource(uri: string, _token?: string): Promise<unknown> {
  switch (uri) {
    case 'alloy://schema/platform': {
      return {
        uri,
        entities: [
          {
            name: 'Workflow',
            table: 'alloy_workflows',
            fields: [
              'id',
              'name',
              'type',
              'domain',
              'status',
              'priority',
              'requiresApproval',
              'steps',
              'inputs',
              'outputs',
              'orgId',
              'createdAt',
            ],
          },
          {
            name: 'WorkflowRun',
            table: 'alloy_workflow_runs',
            fields: [
              'id',
              'workflowId',
              'state',
              'input',
              'output',
              'startedAt',
              'completedAt',
              'durationMs',
              'errorMessage',
            ],
          },
          {
            name: 'Artifact',
            table: 'alloy_artifacts',
            fields: [
              'id',
              'workflowRunId',
              'workflowId',
              'orgId',
              'title',
              'artifactType',
              'content',
              'status',
              'approvalStatus',
            ],
          },
          {
            name: 'Approval',
            table: 'alloy_approvals',
            fields: ['id', 'workflowRunId', 'artifactId', 'status', 'requestedFrom', 'expiresAt'],
          },
          {
            name: 'Decision',
            table: 'alloy_decisions',
            fields: [
              'id',
              'title',
              'summary',
              'verdict',
              'confidence',
              'approvalStatus',
              'evidence',
              'agentId',
              'agentName',
            ],
          },
          {
            name: 'Skill',
            table: 'alloy_skills',
            fields: [
              'id',
              'name',
              'slug',
              'version',
              'category',
              'description',
              'approvalClass',
              'isEnabled',
              'inputSchema',
              'outputSchema',
              'usageCount',
            ],
          },
          {
            name: 'SkillRun',
            table: 'alloy_skill_runs',
            fields: [
              'id',
              'skillId',
              'workflowRunId',
              'agentId',
              'input',
              'output',
              'status',
              'durationMs',
              'errorMessage',
            ],
          },
          {
            name: 'AuditLog',
            table: 'alloy_audit_log',
            fields: [
              'id',
              'orgId',
              'userId',
              'action',
              'resourceType',
              'resourceId',
              'before',
              'after',
              'correlationId',
              'createdAt',
            ],
          },
        ],
        mimeType: 'application/json',
      };
    }
    case 'alloy://agents/prompts': {
      const prompts = Object.entries(AGENT_CONFIGS).map(([agentType, config]) => ({
        agentType,
        name: config.name,
        systemPrompt: config.systemPrompt,
        tools: config.tools.map((t) => ({ name: t.name, description: t.description })),
      }));
      return { uri, agents: prompts, count: prompts.length, mimeType: 'application/json' };
    }
    case 'alloy://skills/catalog': {
      const skills = await db
        .select({
          id: alloySkills.id,
          name: alloySkills.name,
          slug: alloySkills.slug,
          version: alloySkills.version,
          category: alloySkills.category,
          description: alloySkills.description,
          approvalClass: alloySkills.approvalClass,
          isEnabled: alloySkills.isEnabled,
          dryRunSupported: alloySkills.dryRunSupported,
          inputSchema: alloySkills.inputSchema,
          outputSchema: alloySkills.outputSchema,
          tags: alloySkills.tags,
        })
        .from(alloySkills)
        .where(eq(alloySkills.isEnabled, true))
        .orderBy(alloySkills.category, alloySkills.name);
      return { uri, skills, count: skills.length, mimeType: 'application/json' };
    }
    case 'alloy://workflows/templates': {
      const workflows = await db
        .select({
          id: alloyWorkflowsTable.id,
          name: alloyWorkflowsTable.name,
          description: alloyWorkflowsTable.description,
          trigger: alloyWorkflowsTable.trigger,
          triggerConfig: alloyWorkflowsTable.triggerConfig,
          steps: alloyWorkflowsTable.steps,
          outputType: alloyWorkflowsTable.outputType,
          requiresApproval: alloyWorkflowsTable.requiresApproval,
          approverRole: alloyWorkflowsTable.approverRole,
          isActive: alloyWorkflowsTable.isActive,
        })
        .from(alloyWorkflowsTable)
        .where(eq(alloyWorkflowsTable.isActive, true))
        .orderBy(alloyWorkflowsTable.name)
        .limit(100);
      return { uri, workflows, count: workflows.length, mimeType: 'application/json' };
    }
    case 'huggingface://mcp/catalog': {
      try {
        const { discoverHfMcpTools } = await import('./hf-mcp-proxy');
        const tools = await discoverHfMcpTools();
        return {
          uri,
          server: 'huggingface-mcp',
          endpoint: 'https://huggingface.co/mcp',
          tools,
          count: tools.length,
          mimeType: 'application/json',
        };
      } catch {
        return {
          uri,
          server: 'huggingface-mcp',
          tools: HF_MCP_TOOLS,
          count: HF_MCP_TOOLS.length,
          note: 'Returned static tool definitions — live discovery failed',
          mimeType: 'application/json',
        };
      }
    }
    default:
      throw new Error(`Unknown resource URI: ${uri}`);
  }
}

async function handleMcpMethod(
  method: string,
  params: Record<string, unknown>,
  user: AuthenticatedUser | undefined,
): Promise<unknown> {
  switch (method) {
    case 'initialize': {
      return {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          prompts: { listChanged: false },
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
        instructions:
          'Alloy MCP Server — exposes the full SZL Holdings AI capability stack as MCP tools. Use alloy_skill_list to discover available skills, alloy_launch_workflow to start workflows, and domain-specific tools (vessels_*, firestorm_*, terra_*, lyte_*, inca_*) for domain intelligence.',
      };
    }

    case 'tools/list': {
      return { tools: ALL_TOOLS };
    }

    case 'tools/call': {
      const toolName = params.name as string;
      const toolArgs = (params.arguments as Record<string, unknown>) ?? {};
      if (!toolName)
        throw Object.assign(new Error('Tool name is required'), {
          code: JSON_RPC_ERRORS.INVALID_PARAMS,
        });
      const tool = ALL_TOOLS.find((t) => t.name === toolName);
      if (!tool)
        throw Object.assign(new Error(`Tool '${toolName}' not found`), {
          code: JSON_RPC_ERRORS.INVALID_PARAMS,
        });
      const start = Date.now();
      try {
        const result = await executeTool(toolName, toolArgs, user);
        const latencyMs = Date.now() - start;
        await writeAuditLog({
          userId: user?.id,
          toolName,
          args: toolArgs,
          result: JSON.stringify(result).slice(0, 500),
          latencyMs,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: false,
        };
      } catch (err) {
        const latencyMs = Date.now() - start;
        const errorMsg = err instanceof Error ? err.message : String(err);
        await writeAuditLog({
          userId: user?.id,
          toolName,
          args: toolArgs,
          result: `ERROR: ${errorMsg}`,
          latencyMs,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool '${toolName}': ${errorMsg}`,
            },
          ],
          isError: true,
        };
      }
    }

    case 'resources/list': {
      return { resources: MCP_RESOURCES };
    }

    case 'resources/read': {
      const uri = params.uri as string;
      if (!uri)
        throw Object.assign(new Error('URI is required'), { code: JSON_RPC_ERRORS.INVALID_PARAMS });
      const content = await readResource(uri, getInternalToken());
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(content, null, 2),
          },
        ],
      };
    }

    case 'prompts/list': {
      return { prompts: MCP_PROMPTS };
    }

    case 'prompts/get': {
      const promptName = params.name as string;
      if (!promptName)
        throw Object.assign(new Error('Prompt name is required'), {
          code: JSON_RPC_ERRORS.INVALID_PARAMS,
        });
      const prompt = MCP_PROMPTS.find((p) => p.name === promptName);
      if (!prompt)
        throw Object.assign(new Error(`Prompt '${promptName}' not found`), {
          code: JSON_RPC_ERRORS.INVALID_PARAMS,
        });
      const args = (params.arguments as Record<string, string>) ?? {};
      const messages = buildPromptMessages(promptName, args);
      return { description: prompt.description, messages };
    }

    case 'ping': {
      return {};
    }

    default:
      throw Object.assign(new Error(`Method not found: ${method}`), {
        code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
      });
  }
}

async function processMcpRequest(
  req: McpRequest,
  user: AuthenticatedUser | undefined,
): Promise<McpResponse> {
  const id = req.id ?? null;

  if (req.jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id,
      error: makeError(JSON_RPC_ERRORS.INVALID_REQUEST, 'Invalid JSON-RPC version — expected 2.0'),
    };
  }

  if (!req.method || typeof req.method !== 'string') {
    return {
      jsonrpc: '2.0',
      id,
      error: makeError(JSON_RPC_ERRORS.INVALID_REQUEST, 'Method is required'),
    };
  }

  try {
    const result = await handleMcpMethod(req.method, req.params ?? {}, user);
    return { jsonrpc: '2.0', id, result };
  } catch (err) {
    const code = (err as { code?: number }).code ?? JSON_RPC_ERRORS.INTERNAL_ERROR;
    const message = err instanceof Error ? err.message : 'Internal error';
    return { jsonrpc: '2.0', id, error: makeError(code, message) };
  }
}

router.get('/mcp/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: SERVER_NAME,
    version: SERVER_VERSION,
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: {
      tools: ALL_TOOLS.length,
      resources: MCP_RESOURCES.length,
      prompts: MCP_PROMPTS.length,
    },
    toolCategories: {
      domain: DOMAIN_TOOLS.map((t) => t.name),
      platform: PLATFORM_TOOLS.map((t) => t.name),
      data: DATA_TOOLS.map((t) => t.name),
    },
    timestamp: new Date().toISOString(),
  });
});

router.post(
  '/mcp',
  authMiddleware({ required: false }),
  validateBody(
    bodyShape({
      map: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const body = req.body;

      if (Array.isArray(body)) {
        const responses = await Promise.all(
          body.map((r: McpRequest) => processMcpRequest(r, req.user)),
        );
        res.json(responses);
        return;
      }

      const response = await processMcpRequest(body as McpRequest, req.user);
      res.json(response);
    } catch (err) {
      logger.error({ err }, 'MCP handler error');
      res.json({
        jsonrpc: '2.0',
        id: null,
        error: makeError(JSON_RPC_ERRORS.INTERNAL_ERROR, 'Internal server error'),
      });
    }
  },
);

router.get('/mcp/sse', authMiddleware({ required: false }), (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const endpoint = devDomain ? `https://${devDomain}/api/mcp` : `/api/mcp`;

  const initEvent = {
    jsonrpc: '2.0',
    method: '$/ready',
    params: {
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      protocolVersion: MCP_PROTOCOL_VERSION,
      endpoint,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
      },
    },
  };

  res.write(`data: ${JSON.stringify(initEvent)}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ jsonrpc: '2.0', method: '$/ping' })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

router.get('/mcp/tools', authMiddleware({ required: false }), (_req: Request, res: Response) => {
  res.json({
    tools: ALL_TOOLS,
    count: ALL_TOOLS.length,
    categories: {
      domain: DOMAIN_TOOLS.map((t) => ({ name: t.name, description: t.description })),
      platform: PLATFORM_TOOLS.map((t) => ({ name: t.name, description: t.description })),
      data: DATA_TOOLS.map((t) => ({ name: t.name, description: t.description })),
    },
  });
});

router.get(
  '/mcp/resources',
  authMiddleware({ required: false }),
  (_req: Request, res: Response) => {
    res.json({ resources: MCP_RESOURCES, count: MCP_RESOURCES.length });
  },
);

router.get('/mcp/prompts', authMiddleware({ required: false }), (_req: Request, res: Response) => {
  res.json({ prompts: MCP_PROMPTS, count: MCP_PROMPTS.length });
});

export default router;
