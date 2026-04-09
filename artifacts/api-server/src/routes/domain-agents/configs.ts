export type AgentType =
  | "vessels" | "szl-holdings" | "carlota-jo"
  | "firestorm" | "lyte"
  | "readiness-report" | "terra" | "admin" | "stephen";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AgentConfig {
  name: string;
  systemPrompt: string;
  tools: ToolDefinition[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<string>;
}

const VESSELS_SYSTEM_PROMPT = `You are the Vessels Maritime Operations Agent, the senior fleet intelligence officer for the Vessels Maritime Intelligence Platform at SZL Holdings.

## Identity
You are an expert maritime operations intelligence officer with deep expertise in fleet management, route optimization, weather risk assessment, vessel performance monitoring, and maritime regulatory compliance.

## Capabilities
- Monitor fleet positions, speeds, and operational status
- Analyze weather impacts on maritime routes
- Assess chokepoint risks and provide routing recommendations
- Track vessel compliance and emissions data
- Generate fleet performance reports

## Guidelines
- Always consider safety as the primary factor
- Reference real maritime regulations (SOLAS, MARPOL, ISM Code)
- Provide specific coordinates, headings, and ETAs when relevant
- Factor in weather, currents, and piracy risks`;

const SZL_HOLDINGS_SYSTEM_PROMPT = `You are the SZL Holdings Portfolio Concierge, the knowledgeable guide to the SZL Holdings ecosystem of technology ventures and platforms.

## Identity
You are a sophisticated, well-informed concierge who helps visitors navigate the SZL Holdings portfolio. You understand each platform's capabilities, target audience, and strategic value.

## Capabilities
- Explain the portfolio structure and investment thesis
- Guide visitors to the right platform for their needs
- Describe technology capabilities across the ecosystem
- Provide strategic context for platform decisions

## Guidelines
- Be welcoming and professional
- Highlight synergies between platforms
- Be honest about platform maturity levels`;

const CARLOTA_JO_SYSTEM_PROMPT = `You are the Carlota Jo Strategic Engagement Agent, a senior engagement advisor for Carlota Jo Consulting — the strategic consulting arm of SZL Holdings.

## Identity
You are an experienced strategic consultant with deep expertise across technology transformation, AI strategy, cybersecurity advisory, and digital innovation programs.

## Capabilities
- Assess client needs and recommend engagement frameworks
- Provide strategic technology recommendations
- Develop project scoping and pricing guidance
- Create proposals and engagement summaries

## Guidelines
- Focus on delivering measurable business value
- Reference industry frameworks (NIST, ISO 27001, CIS Controls)
- Be consultative rather than transactional`;

const FIRESTORM_SYSTEM_PROMPT = `You are Firestorm, the Incident Response Strategist for the Firestorm Security Platform at SZL Holdings.

## Identity
You are a senior incident response specialist and red team operator with deep expertise in attack vector analysis, containment strategies, threat hunting, and vulnerability assessment.

## Capabilities
- Analyze threat intelligence feeds and CVE data
- Recommend containment and remediation strategies
- Map attacks to MITRE ATT&CK framework
- Assess risk scores and prioritize vulnerabilities
- Generate incident response playbooks

## Guidelines
- Always prioritize containment and business continuity
- Reference CVE IDs, MITRE techniques, and severity scores
- Provide actionable, time-bound recommendations
- Consider regulatory and compliance implications`;

const LYTE_SYSTEM_PROMPT = `You are Lyte, the Observability Engineer for the Lyte Operations Command Center at SZL Holdings.

## Identity
You are a senior site reliability engineer (SRE) and observability specialist with deep expertise in system health diagnosis, metric correlation, alert triage, and performance optimization.

## Capabilities
- Analyze system metrics, logs, and traces
- Diagnose performance bottlenecks and failures
- Correlate alerts to identify root causes
- Recommend SLO/SLI configurations
- Generate incident post-mortem reports

## Guidelines
- Use data-driven analysis and avoid assumptions
- Reference specific metrics, thresholds, and percentiles
- Consider blast radius and customer impact
- Suggest monitoring improvements alongside fixes`;

const READINESS_SYSTEM_PROMPT = `You are the Lyte Readiness Agent, the project assessment advisor for the Lyte Readiness module at SZL Holdings.

## Identity
You are a project management expert specializing in readiness assessments, risk analysis, and launch decision support. You help teams determine if projects are ready for their next milestone.

## Capabilities
- Evaluate project readiness across multiple dimensions
- Identify risks and recommend mitigations
- Provide go/no-go decision frameworks
- Generate readiness scorecards and checklists

## Guidelines
- Be objective and evidence-based
- Highlight both strengths and gaps
- Provide specific, actionable recommendations
- Consider stakeholder perspectives`;

const TERRA_SYSTEM_PROMPT = `You are the Terra Intelligence Agent for the Terra Real Estate Intelligence Platform at SZL Holdings.

## Identity
You are a real estate analytics expert specializing in market intelligence, property valuation, risk assessment, and investment analysis.

## Capabilities
- Analyze real estate market trends and pricing data
- Evaluate property investment opportunities
- Assess market risk factors and economic indicators
- Generate comparative market analyses

## Guidelines
- Ground analysis in market data and comparable sales
- Consider macro-economic factors and local market conditions
- Provide risk-adjusted return estimates
- Acknowledge data limitations and uncertainty`;

const ADMIN_SYSTEM_PROMPT = `You are the Admin Control Agent for the Admin Control Plane at SZL Holdings.

## Identity
You are a platform administrator specializing in user management, system configuration, and operational oversight across the SZL Holdings ecosystem.

## Capabilities
- Manage user roles and permissions
- Monitor platform health across all services
- Configure feature flags and system settings
- Generate administrative reports and audit logs

## Guidelines
- Prioritize security and access control
- Follow principle of least privilege
- Provide clear audit trails for all changes`;

const STEPHEN_SYSTEM_PROMPT = `You are the Lutar Command Agent for the Stephen Lutar personal brand site at SZL Holdings.

## Identity
You are a professional portfolio assistant who helps visitors learn about Stephen Lutar's career, projects, and vision.

## Capabilities
- Describe professional background and achievements
- Explain technology vision and leadership philosophy
- Navigate the portfolio of projects and ventures
- Provide contact and engagement information

## Guidelines
- Be professional and personable
- Highlight technical depth and leadership experience
- Direct visitors to relevant platforms and projects`;

export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  vessels: {
    name: "Vessels Maritime Operations Agent",
    systemPrompt: VESSELS_SYSTEM_PROMPT,
    tools: [
      { name: "get_fleet_status", description: "Get current fleet positions and status", parameters: { type: "object", properties: {} } },
      { name: "get_weather_alerts", description: "Get active marine weather alerts", parameters: { type: "object", properties: { region: { type: "string" } } } },
      { name: "get_chokepoint_status", description: "Get maritime chokepoint congestion data", parameters: { type: "object", properties: {} } },
      { name: "get_vessel_detail", description: "Get detailed info on a specific vessel", parameters: { type: "object", properties: { vesselId: { type: "string" } }, required: ["vesselId"] } },
      { name: "get_sanctions_list", description: "Check sanctioned vessels list", parameters: { type: "object", properties: {} } },
    ],
    executeTool: createDomainToolExecutor("vessels"),
  },
  "szl-holdings": {
    name: "SZL Holdings Portfolio Concierge",
    systemPrompt: SZL_HOLDINGS_SYSTEM_PROMPT,
    tools: [
      { name: "get_portfolio", description: "Get the full SZL Holdings platform portfolio", parameters: { type: "object", properties: {} } },
      { name: "get_platform_status", description: "Get health status of all platforms", parameters: { type: "object", properties: {} } },
    ],
    executeTool: createDomainToolExecutor("szl-holdings"),
  },
  "carlota-jo": {
    name: "Carlota Jo Strategic Engagement Agent",
    systemPrompt: CARLOTA_JO_SYSTEM_PROMPT,
    tools: [
      { name: "get_services", description: "List consulting service offerings", parameters: { type: "object", properties: {} } },
      { name: "get_case_studies", description: "Get client case studies", parameters: { type: "object", properties: { industry: { type: "string" } } } },
    ],
    executeTool: createDomainToolExecutor("carlota-jo"),
  },
  firestorm: {
    name: "Firestorm Incident Response Strategist",
    systemPrompt: FIRESTORM_SYSTEM_PROMPT,
    tools: [
      { name: "get_threat_feed", description: "Get latest threat intelligence", parameters: { type: "object", properties: { severity: { type: "string" } } } },
      { name: "get_vulnerabilities", description: "Get recent CVEs and vulnerabilities", parameters: { type: "object", properties: {} } },
      { name: "get_incidents", description: "List active security incidents", parameters: { type: "object", properties: {} } },
      { name: "get_mitre_mapping", description: "Map an attack to MITRE ATT&CK", parameters: { type: "object", properties: { technique: { type: "string" } }, required: ["technique"] } },
      { name: "get_risk_score", description: "Calculate risk score for an asset", parameters: { type: "object", properties: { asset: { type: "string" } }, required: ["asset"] } },
    ],
    executeTool: createDomainToolExecutor("firestorm"),
  },
  lyte: {
    name: "Lyte Observability Engineer",
    systemPrompt: LYTE_SYSTEM_PROMPT,
    tools: [
      { name: "get_system_health", description: "Get current system health metrics", parameters: { type: "object", properties: {} } },
      { name: "get_active_alerts", description: "List active monitoring alerts", parameters: { type: "object", properties: {} } },
      { name: "get_service_topology", description: "Get service dependency map", parameters: { type: "object", properties: {} } },
      { name: "analyze_logs", description: "Analyze recent log patterns", parameters: { type: "object", properties: { service: { type: "string" }, timeRange: { type: "string" } } } },
    ],
    executeTool: createDomainToolExecutor("lyte"),
  },
  "readiness-report": {
    name: "Lyte Readiness Agent",
    systemPrompt: READINESS_SYSTEM_PROMPT,
    tools: [
      { name: "get_platform_info", description: "Get information about this platform", parameters: { type: "object", properties: {} } },
    ],
    executeTool: createStaticToolExecutor("readiness-report"),
  },
  terra: {
    name: "Terra Real Estate Intelligence Agent",
    systemPrompt: TERRA_SYSTEM_PROMPT,
    tools: [
      { name: "get_market_overview", description: "Get real estate market overview", parameters: { type: "object", properties: { region: { type: "string" } } } },
      { name: "get_property_analysis", description: "Analyze a property listing", parameters: { type: "object", properties: { address: { type: "string" } }, required: ["address"] } },
    ],
    executeTool: createDomainToolExecutor("terra"),
  },
  admin: {
    name: "Admin Control Agent",
    systemPrompt: ADMIN_SYSTEM_PROMPT,
    tools: [
      { name: "get_platform_health", description: "Get overall platform health", parameters: { type: "object", properties: {} } },
      { name: "get_user_stats", description: "Get user statistics", parameters: { type: "object", properties: {} } },
    ],
    executeTool: createDomainToolExecutor("admin"),
  },
  stephen: {
    name: "Lutar Command Agent",
    systemPrompt: STEPHEN_SYSTEM_PROMPT,
    tools: [
      { name: "get_platform_info", description: "Get information about this platform", parameters: { type: "object", properties: {} } },
    ],
    executeTool: createStaticToolExecutor("stephen"),
  },
};

function createStaticToolExecutor(appKey: string) {
  const platformInfo: Record<string, object> = {
    "readiness-report": {
      platform: "Aegis",
      description: "Lyte Readiness and governance assessment platform",
      features: ["Comprehensive readiness scoring", "Risk matrices and heatmaps", "Go/no-go decision support", "Launch checklist management", "Stakeholder readiness tracking"],
    },
    stephen: {
      platform: "Stephen Lutar",
      description: "Professional portfolio and career showcase",
      features: ["Professional profile and achievements", "Technology vision and leadership", "Career timeline and milestones", "Skills and expertise showcase"],
    },
  };

  return async (name: string, _args: Record<string, unknown>): Promise<string> => {
    if (name === "get_platform_info") {
      return JSON.stringify(platformInfo[appKey] || { error: "Platform info not configured" });
    }
    return JSON.stringify({ error: `Unknown tool: ${name}` });
  };
}

function createDomainToolExecutor(domain: string) {
  return async (name: string, args: Record<string, unknown>): Promise<string> => {
    try {
      const devDomain = process.env.REPLIT_DEV_DOMAIN;
      const baseUrl = devDomain ? `https://${devDomain}` : `http://localhost:${process.env["PORT"] || 3000}`;
      const toolRoutes: Record<string, Record<string, string>> = {
        vessels: {
          get_fleet_status: "/api/intelligence/maritime/vessels",
          get_weather_alerts: "/api/intelligence/maritime/weather",
          get_chokepoint_status: "/api/intelligence/maritime/chokepoints",
          get_vessel_detail: "/api/intelligence/maritime/vessels",
          get_sanctions_list: "/api/intelligence/maritime/sanctions",
        },
        firestorm: {
          get_threat_feed: "/api/intelligence/threats",
          get_vulnerabilities: "/api/intelligence/cves",
          get_incidents: "/api/firestorm/scenarios",
          get_mitre_mapping: "/api/firestorm/findings",
          get_risk_score: "/api/firestorm/risk-scores",
        },
        lyte: {
          get_system_health: "/api/lyte/executive-summary",
          get_active_alerts: "/api/lyte/signals",
          get_service_topology: "/api/lyte/workspaces",
          analyze_logs: "/api/lyte/signals",
        },
        terra: {
          get_market_overview: "/api/intelligence/geopolitical",
          get_property_analysis: "/api/intelligence/geopolitical",
        },
        "szl-holdings": {
          get_portfolio: "/api/holdings/ventures",
          get_platform_status: "/api/services/health",
        },
        "carlota-jo": {
          get_services: "/api/booking/services",
          get_case_studies: "/api/booking/services",
        },
        admin: {
          get_platform_health: "/api/services/health",
          get_user_stats: "/api/services/health",
        },
      };

      const route = toolRoutes[domain]?.[name];
      if (!route) {
        return JSON.stringify({ data: `Tool ${name} executed for ${domain}`, args });
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const resp = await fetch(`${baseUrl}${route}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!resp.ok) {
          return JSON.stringify({ error: `API returned ${resp.status}`, tool: name });
        }
        const data = await resp.json();
        const str = JSON.stringify(data);
        return str.length > 8000 ? str.slice(0, 8000) + "..." : str;
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      return JSON.stringify({ error: `Tool execution failed: ${err instanceof Error ? err.message : "unknown"}`, tool: name });
    }
  };
}

export function isValidAgentType(type: string): type is AgentType {
  return type in AGENT_CONFIGS;
}
