import type { PrismDomain, PrismToolDescriptor } from './index.js';

export const PRISM_DOMAIN_TOOLS: Record<PrismDomain, string[]> = {
  aegis: [
    'firestorm_threat_scan',
    'firestorm_compliance_check',
    'alloy_research',
    'alloy_create_artifact',
    'lookup_case',
    'create_case',
    'containment_step',
  ],
  lyte: [
    'lyte_health_check',
    'lyte_executive_summary',
    'alloy_launch_workflow',
    'query_audit_log',
    'get_system_health',
    'get_active_alerts',
  ],
  vessels: [
    'vessels_fleet_status',
    'vessels_weather_risk',
    'alloy_create_artifact',
    'get_fleet_status',
    'get_weather_alerts',
  ],
  terra: [
    'terra_property_search',
    'terra_market_signals',
    'alloy_research',
    'get_market_overview',
    'get_property_analysis',
  ],
  'carlota-jo': [
    'alloy_create_artifact',
    'alloy_research',
    'lyte_executive_summary',
    'get_services',
    'get_case_studies',
  ],
  'szl-holdings': [
    'alloy_research',
    'alloy_create_artifact',
    'alloy_launch_workflow',
    'query_audit_log',
    'get_portfolio',
    'get_platform_status',
  ],
  stephen: ['alloy_research', 'alloy_create_artifact', 'get_platform_info'],
  cortex: [
    'alloy_research',
    'alloy_create_artifact',
    'alloy_launch_workflow',
    'query_audit_log',
    'get_portfolio',
    'get_platform_status',
  ],
  'prism-counsel': [
    'alloy_research',
    'alloy_create_artifact',
    'query_audit_log',
    'get_matter_list',
    'get_obligations',
    'get_proof_chain',
  ],
  global: [],
};

export const PRISM_BUILT_IN_TOOLS: PrismToolDescriptor[] = [
  {
    name: 'alloy_research',
    description: "Perform deep research using Alloy's PRISM intelligence engine",
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Research query' },
        depth: {
          type: 'string',
          description: 'Research depth: quick | standard | deep',
          enum: ['quick', 'standard', 'deep'],
        },
      },
      required: ['query'],
    },
    domains: ['global', 'szl-holdings', 'aegis', 'vessels', 'terra', 'carlota-jo', 'stephen'],
    approvalClass: 'observe_only',
    tags: ['research', 'intelligence'],
  },
  {
    name: 'alloy_create_artifact',
    description: 'Create a structured artifact via the PRISM artifact pipeline',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Artifact title' },
        type: {
          type: 'string',
          description: 'Artifact type',
          enum: ['report', 'brief', 'summary', 'analysis'],
        },
        content: { type: 'string', description: 'Artifact content' },
      },
      required: ['title', 'type'],
    },
    domains: ['global', 'aegis', 'vessels', 'terra', 'carlota-jo', 'szl-holdings', 'stephen'],
    approvalClass: 'propose_only',
    tags: ['artifact', 'documents'],
  },
  {
    name: 'alloy_launch_workflow',
    description: 'Launch a FORGE RUNTIME workflow with specified parameters',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID to launch' },
        input: { type: 'string', description: 'JSON input parameters' },
      },
      required: ['workflowId'],
    },
    domains: ['szl-holdings', 'lyte'],
    approvalClass: 'approval_required',
    tags: ['workflow', 'automation'],
  },
  {
    name: 'query_audit_log',
    description: 'Query the PRISM audit log for recent platform actions',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Action type to filter' },
        limit: { type: 'string', description: 'Max results (default 20)' },
      },
    },
    domains: ['szl-holdings', 'lyte'],
    approvalClass: 'observe_only',
    tags: ['audit', 'compliance'],
  },
  {
    name: 'firestorm_threat_scan',
    description: 'Trigger a threat intelligence scan via PRISM security connector',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Asset, IP, or domain to scan' },
        severity: {
          type: 'string',
          description: 'Min severity filter',
          enum: ['low', 'medium', 'high', 'critical'],
        },
      },
      required: ['target'],
    },
    domains: ['aegis'],
    approvalClass: 'propose_only',
    tags: ['security', 'threat-intel'],
  },
  {
    name: 'firestorm_compliance_check',
    description: 'Run a compliance check against a framework via PRISM',
    inputSchema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          description: 'Compliance framework',
          enum: ['NIST', 'SOC2', 'ISO27001', 'CIS', 'PCI_DSS'],
        },
        scope: { type: 'string', description: 'Scope of the check' },
      },
      required: ['framework'],
    },
    domains: ['aegis'],
    approvalClass: 'observe_only',
    tags: ['compliance', 'audit'],
  },
  {
    name: 'lyte_health_check',
    description: 'Get current system health status via PRISM monitoring connector',
    inputSchema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Specific service to check (optional)' },
      },
    },
    domains: ['lyte'],
    approvalClass: 'observe_only',
    tags: ['monitoring', 'health'],
  },
  {
    name: 'lyte_executive_summary',
    description: 'Generate executive health summary via PRISM intelligence layer',
    inputSchema: {
      type: 'object',
      properties: {
        timeRange: {
          type: 'string',
          description: 'Time range for summary',
          enum: ['1h', '6h', '24h', '7d'],
        },
      },
    },
    domains: ['lyte', 'carlota-jo'],
    approvalClass: 'observe_only',
    tags: ['summary', 'executive'],
  },
  {
    name: 'vessels_fleet_status',
    description: 'Get real-time fleet status via PRISM maritime connector',
    inputSchema: {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'Filter by region (optional)' },
      },
    },
    domains: ['vessels'],
    approvalClass: 'observe_only',
    tags: ['fleet', 'maritime'],
  },
  {
    name: 'vessels_weather_risk',
    description: 'Assess weather risk for maritime routes via PRISM',
    inputSchema: {
      type: 'object',
      properties: {
        route: { type: 'string', description: 'Route identifier or description' },
      },
      required: ['route'],
    },
    domains: ['vessels'],
    approvalClass: 'observe_only',
    tags: ['weather', 'risk'],
  },
  {
    name: 'terra_property_search',
    description: 'Search properties with PRISM real estate intelligence',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Property search query' },
        maxResults: { type: 'string', description: 'Max results (default 10)' },
      },
      required: ['query'],
    },
    domains: ['terra'],
    approvalClass: 'observe_only',
    tags: ['real-estate', 'search'],
  },
  {
    name: 'terra_market_signals',
    description: 'Get real estate market signals via PRISM intelligence',
    inputSchema: {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'Geographic region to analyze' },
      },
      required: ['region'],
    },
    domains: ['terra'],
    approvalClass: 'observe_only',
    tags: ['real-estate', 'market'],
  },
];

export function buildPrismToolFromMcp(mcpTool: {
  name: string;
  description: string;
  inputSchema: PrismToolDescriptor['inputSchema'];
  domain?: string[];
  approvalClass?: 'auto' | 'review' | 'admin_only';
}): PrismToolDescriptor {
  const approvalClassMap: Record<string, PrismToolDescriptor['approvalClass']> = {
    auto: 'observe_only',
    review: 'propose_only',
    admin_only: 'approval_required',
  };

  return {
    name: mcpTool.name,
    description: mcpTool.description,
    inputSchema: mcpTool.inputSchema,
    domains: (mcpTool.domain ?? ['global']) as PrismDomain[],
    approvalClass: approvalClassMap[mcpTool.approvalClass ?? 'auto'] ?? 'observe_only',
  };
}
