export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, McpSchemaProperty>;
    required?: string[];
  };
  domain?: string[];
  approvalClass?: "auto" | "review" | "admin_only";
}

export interface McpSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: McpSchemaProperty;
}

export interface McpToolResult {
  toolName: string;
  success: boolean;
  output: unknown;
  pendingApproval?: boolean;
  approvalId?: string;
  error?: string;
}

export interface McpConnectionState {
  status: "connected" | "disconnected" | "connecting" | "error";
  serverUrl: string;
  serverName?: string;
  lastPing?: Date;
  error?: string;
}

export interface McpServerConfig {
  id: string;
  name: string;
  url: string;
  transport: "http" | "stdio";
  description?: string;
  isNative?: boolean;
  isConnected?: boolean;
  credentials?: Record<string, string>;
}

export type McpDomain =
  | "aegis"
  | "lyte"
  | "vessels"
  | "terra"
  | "carlota-jo"
  | "szl-holdings"
  | "stephen"
  | "global";

export const DOMAIN_TOOLS: Record<McpDomain, string[]> = {
  aegis: [
    "firestorm_threat_scan",
    "firestorm_compliance_check",
    "alloy_research",
    "alloy_create_artifact",
    "lookup_case",
    "create_case",
    "containment_step",
  ],
  lyte: [
    "lyte_health_check",
    "lyte_executive_summary",
    "alloy_launch_workflow",
    "query_audit_log",
    "get_system_health",
    "get_active_alerts",
  ],
  vessels: [
    "vessels_fleet_status",
    "vessels_weather_risk",
    "alloy_create_artifact",
    "get_fleet_status",
    "get_weather_alerts",
  ],
  terra: [
    "terra_property_search",
    "terra_market_signals",
    "alloy_research",
    "get_market_overview",
    "get_property_analysis",
  ],
  "carlota-jo": [
    "alloy_create_artifact",
    "alloy_research",
    "lyte_executive_summary",
    "get_services",
    "get_case_studies",
  ],
  "szl-holdings": [
    "alloy_research",
    "alloy_create_artifact",
    "alloy_launch_workflow",
    "query_audit_log",
    "get_portfolio",
    "get_platform_status",
  ],
  stephen: ["alloy_research", "alloy_create_artifact", "get_platform_info"],
  global: [],
};

export const BUILT_IN_MCP_TOOLS: McpTool[] = [
  {
    name: "alloy_research",
    description: "Perform deep research using Alloy's intelligence engine",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Research query" },
        depth: { type: "string", enum: ["quick", "standard", "deep"], description: "Research depth" },
      },
      required: ["query"],
    },
    approvalClass: "auto",
  },
  {
    name: "alloy_create_artifact",
    description: "Create a structured artifact (report, brief, summary) via Alloy",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Artifact title" },
        type: { type: "string", enum: ["report", "brief", "summary", "analysis"], description: "Artifact type" },
        content: { type: "string", description: "Artifact content" },
      },
      required: ["title", "type"],
    },
    approvalClass: "review",
  },
  {
    name: "alloy_launch_workflow",
    description: "Launch an Alloy workflow with specified parameters",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: { type: "string", description: "Workflow ID to launch" },
        input: { type: "string", description: "JSON input parameters" },
      },
      required: ["workflowId"],
    },
    approvalClass: "review",
  },
  {
    name: "query_audit_log",
    description: "Query the Alloy audit log for recent actions",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action type to filter" },
        limit: { type: "string", description: "Max results (default 20)" },
      },
    },
    approvalClass: "auto",
  },
  {
    name: "firestorm_threat_scan",
    description: "Trigger a threat intelligence scan for a target asset or IP",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "string", description: "Asset, IP, or domain to scan" },
        severity: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Min severity filter" },
      },
      required: ["target"],
    },
    domain: ["aegis"],
    approvalClass: "review",
  },
  {
    name: "firestorm_compliance_check",
    description: "Run a compliance check against a framework (NIST, SOC2, ISO27001)",
    inputSchema: {
      type: "object",
      properties: {
        framework: { type: "string", enum: ["NIST", "SOC2", "ISO27001", "CIS", "PCI_DSS"], description: "Compliance framework" },
        scope: { type: "string", description: "Scope of the check" },
      },
      required: ["framework"],
    },
    domain: ["aegis"],
    approvalClass: "auto",
  },
  {
    name: "lyte_health_check",
    description: "Get current system health status and alerts from Lyte",
    inputSchema: {
      type: "object",
      properties: {
        service: { type: "string", description: "Specific service to check (optional)" },
      },
    },
    domain: ["lyte"],
    approvalClass: "auto",
  },
  {
    name: "lyte_executive_summary",
    description: "Generate an executive summary of current system health and incidents",
    inputSchema: {
      type: "object",
      properties: {
        timeRange: { type: "string", enum: ["1h", "6h", "24h", "7d"], description: "Time range for summary" },
      },
    },
    domain: ["lyte", "carlota-jo"],
    approvalClass: "auto",
  },
  {
    name: "vessels_fleet_status",
    description: "Get real-time fleet status including positions and alerts",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string", description: "Filter by region (optional)" },
      },
    },
    domain: ["vessels"],
    approvalClass: "auto",
  },
  {
    name: "vessels_weather_risk",
    description: "Assess weather risk for active maritime routes",
    inputSchema: {
      type: "object",
      properties: {
        route: { type: "string", description: "Route identifier or description" },
      },
      required: ["route"],
    },
    domain: ["vessels"],
    approvalClass: "auto",
  },
  {
    name: "terra_property_search",
    description: "Search property listings with AI-driven market intelligence",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Property search query" },
        maxResults: { type: "string", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
    domain: ["terra"],
    approvalClass: "auto",
  },
  {
    name: "terra_market_signals",
    description: "Get real estate market signals and trend analysis",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string", description: "Geographic region to analyze" },
      },
      required: ["region"],
    },
    domain: ["terra"],
    approvalClass: "auto",
  },
];
