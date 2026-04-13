/**
 * Universal Agent Identity (UAI) Registry
 *
 * Fuses A2A Agent Cards + ANP DID documents + MCP tool manifests into a single
 * JSON-LD identity document per domain agent. This is the single source of truth
 * for agent discovery across all three protocol layers.
 */

const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : `http://localhost:${process.env["PORT"] || 8080}`;

const API_BASE = `${BASE_URL}/api`;

export interface UAIDocument {
  "@context": string[];
  "@type": string[];
  id: string;
  name: string;
  description: string;
  domain: string;
  version: string;
  createdAt: string;
  updatedAt: string;

  a2aCard: A2ACardFields;
  anpDid: ANPDidFields;
  mcpManifest: MCPManifestFields;

  protocolSupport: ProtocolSupport[];
  capabilities: string[];
  governancePolicy: GovernancePolicy;
}

export interface A2ACardFields {
  agentId: string;
  url: string;
  skills: Array<{
    id: string;
    name: string;
    description: string;
    inputModes: string[];
    outputModes: string[];
  }>;
  authentication: { schemes: string[] };
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
  };
}

export interface ANPDidFields {
  did: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk: Record<string, string>;
  }>;
  service: Array<{
    id: string;
    type: string;
    serviceEndpoint: string;
    description: string;
  }>;
  metaProtocol: {
    negotiationEndpoint: string;
    supportedProtocols: string[];
  };
}

export interface MCPManifestFields {
  serverId: string;
  serverName: string;
  protocolVersion: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
  resources: Array<{
    uri: string;
    name: string;
    description: string;
    mimeType: string;
  }>;
  prompts: Array<{
    name: string;
    description: string;
  }>;
}

export interface ProtocolSupport {
  protocol: "mcp" | "a2a" | "anp" | "acp";
  version: string;
  endpoint: string;
  contentTypes: string[];
}

export interface GovernancePolicy {
  crossProtocolApprovalRequired: boolean;
  trustedProtocols: string[];
  hitlRequiredForExternalAgents: boolean;
  auditAllCrossings: boolean;
}

const DOMAIN_TOOLS: Record<string, Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>> = {
  "vessels": [
    { name: "vessels_fleet_status", description: "Query fleet positions, vessel details, and voyage status", inputSchema: { type: "object", properties: { region: { type: "string" } } } },
    { name: "vessels_weather_risk", description: "Maritime weather risk assessment for routes", inputSchema: { type: "object", properties: { region: { type: "string" } } } },
    { name: "vessels_route_optimize", description: "Optimize vessel routes for fuel, time, and safety", inputSchema: { type: "object", properties: { origin: { type: "string" }, destination: { type: "string" } } } },
  ],
  "aegis": [
    { name: "aegis_threat_scan", description: "Query active cybersecurity threats and CVEs", inputSchema: { type: "object", properties: { severity: { type: "string", enum: ["critical", "high", "medium", "low"] } } } },
    { name: "aegis_compliance_check", description: "Check security compliance readiness", inputSchema: { type: "object", properties: { framework: { type: "string" } } } },
    { name: "aegis_incident_response", description: "Execute incident response playbook", inputSchema: { type: "object", properties: { incidentId: { type: "string" } } } },
  ],
  "terra": [
    { name: "terra_property_search", description: "Search real estate market data and opportunities", inputSchema: { type: "object", properties: { region: { type: "string" } } } },
    { name: "terra_market_signals", description: "Query real estate market activity and distress signals", inputSchema: { type: "object", properties: { domain: { type: "string" } } } },
    { name: "terra_deal_scoring", description: "Score and rank real estate deals by ROI potential", inputSchema: { type: "object", properties: { propertyId: { type: "string" } } } },
  ],
  "prism": [
    { name: "prism_contract_review", description: "Analyze contracts for risks and compliance", inputSchema: { type: "object", properties: { contractId: { type: "string" } } } },
    { name: "prism_compliance_analysis", description: "Check regulatory compliance across jurisdictions", inputSchema: { type: "object", properties: { jurisdiction: { type: "string" } } } },
    { name: "prism_matter_status", description: "Query active legal matters and deadlines", inputSchema: { type: "object", properties: { matterId: { type: "string" } } } },
  ],
  "lyte": [
    { name: "lyte_health_check", description: "Get platform health metrics and monitoring alerts", inputSchema: { type: "object", properties: {} } },
    { name: "lyte_executive_summary", description: "Generate executive ecosystem state summary", inputSchema: { type: "object", properties: { timeRange: { type: "string" } } } },
    { name: "lyte_model_monitor", description: "Monitor AI model performance and drift", inputSchema: { type: "object", properties: { modelId: { type: "string" } } } },
  ],
  "carlota-jo": [
    { name: "carlota_client_intel", description: "Analyze client portfolios and relationship health", inputSchema: { type: "object", properties: { clientId: { type: "string" } } } },
    { name: "carlota_portfolio_strategy", description: "Generate UHNW portfolio strategies", inputSchema: { type: "object", properties: { clientId: { type: "string" } } } },
    { name: "carlota_schedule", description: "Predictive scheduling with conflict detection", inputSchema: { type: "object", properties: { participants: { type: "array", items: { type: "string" } } } } },
  ],
  "inca": [
    { name: "inca_model_deploy", description: "Deploy AI model to inference infrastructure", inputSchema: { type: "object", properties: { modelId: { type: "string" }, environment: { type: "string" } } } },
    { name: "inca_pipeline_status", description: "Query ML pipeline runs and training status", inputSchema: { type: "object", properties: { pipelineId: { type: "string" } } } },
    { name: "inca_cost_optimize", description: "Optimize AI inference costs across providers", inputSchema: { type: "object", properties: { budget: { type: "number" } } } },
  ],
};

const DOMAIN_SKILLS: Record<string, Array<{ id: string; name: string; description: string; inputModes: string[]; outputModes: string[] }>> = {
  "vessels": [
    { id: "fleet-tracking", name: "Fleet Tracking", description: "Real-time AIS vessel tracking and route analysis", inputModes: ["text"], outputModes: ["text", "data"] },
    { id: "port-risk", name: "Port Risk Assessment", description: "Port security, compliance, and operational risk", inputModes: ["text"], outputModes: ["text", "data"] },
    { id: "route-optimization", name: "Route Optimization", description: "Optimize routes for fuel, time, and safety", inputModes: ["text", "data"], outputModes: ["text", "data"] },
  ],
  "aegis": [
    { id: "threat-detection", name: "Threat Detection", description: "Real-time threat detection and alert triage", inputModes: ["text", "data"], outputModes: ["text", "data"] },
    { id: "incident-response", name: "Incident Response", description: "Automated incident response playbook execution", inputModes: ["text"], outputModes: ["text", "data"] },
    { id: "vulnerability-scan", name: "Vulnerability Assessment", description: "System vulnerability assessment and remediation", inputModes: ["text", "data"], outputModes: ["text", "data"] },
  ],
  "terra": [
    { id: "market-analysis", name: "Market Analysis", description: "Real estate market trends, pricing, and opportunities", inputModes: ["text"], outputModes: ["text", "data"] },
    { id: "deal-scoring", name: "Deal Scoring", description: "Score deals by ROI potential and risk", inputModes: ["text", "data"], outputModes: ["text", "data"] },
    { id: "property-valuation", name: "Property Valuation", description: "Estimate property values from market data", inputModes: ["text", "data"], outputModes: ["text", "data"] },
  ],
  "prism": [
    { id: "contract-review", name: "Contract Review", description: "Analyze contracts for risks and obligations", inputModes: ["text", "data"], outputModes: ["text", "data"] },
    { id: "compliance-check", name: "Compliance Analysis", description: "Regulatory compliance across jurisdictions", inputModes: ["text"], outputModes: ["text", "data"] },
    { id: "matter-management", name: "Matter Management", description: "Track legal matters, deadlines, and billing", inputModes: ["text"], outputModes: ["text", "data"] },
  ],
  "lyte": [
    { id: "model-monitoring", name: "Model Monitoring", description: "AI model performance, drift, and health", inputModes: ["text"], outputModes: ["text", "data"] },
    { id: "cost-optimization", name: "Cost Optimization", description: "AI inference cost optimization across providers", inputModes: ["text", "data"], outputModes: ["text", "data"] },
    { id: "pipeline-orchestration", name: "Pipeline Orchestration", description: "ML training and deployment pipelines", inputModes: ["text"], outputModes: ["text", "data"] },
  ],
  "carlota-jo": [
    { id: "client-intelligence", name: "Client Intelligence", description: "Client portfolios, preferences, and relationship health", inputModes: ["text"], outputModes: ["text", "data"] },
    { id: "portfolio-strategy", name: "Portfolio Strategy", description: "Personalized UHNW portfolio strategies", inputModes: ["text", "data"], outputModes: ["text", "data"] },
    { id: "scheduling-engine", name: "Scheduling Intelligence", description: "Predictive scheduling with conflict detection", inputModes: ["text"], outputModes: ["data"] },
  ],
  "inca": [
    { id: "model-deployment", name: "Model Deployment", description: "Deploy AI models to inference infrastructure", inputModes: ["text", "data"], outputModes: ["text", "data"] },
    { id: "pipeline-management", name: "Pipeline Management", description: "ML training pipelines and orchestration", inputModes: ["text"], outputModes: ["text", "data"] },
    { id: "inference-optimization", name: "Inference Optimization", description: "Optimize inference costs and latency", inputModes: ["text", "data"], outputModes: ["text", "data"] },
  ],
};

const AGENT_METADATA: Record<string, { agentId: string; name: string; description: string; a2aId: string }> = {
  "vessels": {
    agentId: "vessels-intelligence",
    name: "Vessels Maritime Intelligence",
    description: "Maritime fleet intelligence, AIS tracking, route optimization, port risk analysis, and compliance monitoring.",
    a2aId: "vessels-intelligence",
  },
  "aegis": {
    agentId: "aegis-defense",
    name: "Aegis Unified Defense",
    description: "SOC analysis, threat detection, incident response, vulnerability assessment, and cyber defense intelligence.",
    a2aId: "aegis-defense",
  },
  "terra": {
    agentId: "terra-realestate",
    name: "Terra Real Estate Intelligence",
    description: "Real estate portfolio analysis, market intelligence, deal flow scoring, and property valuation.",
    a2aId: "terra-realestate",
  },
  "prism": {
    agentId: "prism-legal",
    name: "PRISM Legal Counsel",
    description: "Legal matter management, compliance analysis, contract review, and regulatory intelligence.",
    a2aId: "prism-legal",
  },
  "lyte": {
    agentId: "lyte-aiops",
    name: "Lyte AIOps Command",
    description: "AI model lifecycle management, inference monitoring, cost optimization, and ML pipeline orchestration.",
    a2aId: "lyte-aiops",
  },
  "carlota-jo": {
    agentId: "carlota-advisory",
    name: "Carlota Jo Advisory",
    description: "Ultra-high-net-worth client advisory, portfolio strategy, and relationship intelligence.",
    a2aId: "carlota-advisory",
  },
  "inca": {
    agentId: "inca-lab",
    name: "INCA Lab AI Command",
    description: "AI model command, deployment orchestration, inference optimization, and ML pipeline management.",
    a2aId: "inca-lab",
  },
};

const DOMAIN_RESOURCES: Record<string, Array<{ uri: string; name: string; description: string; mimeType: string }>> = {
  "vessels": [
    { uri: "vessels://fleet/live", name: "Live Fleet Feed", description: "Real-time vessel positions and status", mimeType: "application/json" },
    { uri: "vessels://ports/registry", name: "Port Registry", description: "Global port database with risk ratings", mimeType: "application/json" },
  ],
  "aegis": [
    { uri: "aegis://threats/active", name: "Active Threat Feed", description: "Live cybersecurity threat intelligence", mimeType: "application/json" },
    { uri: "aegis://compliance/frameworks", name: "Compliance Frameworks", description: "Security compliance framework definitions", mimeType: "application/json" },
  ],
  "terra": [
    { uri: "terra://market/signals", name: "Market Signal Feed", description: "Real estate market distress signals", mimeType: "application/json" },
    { uri: "terra://deals/pipeline", name: "Deal Pipeline", description: "Active deal pipeline and scoring", mimeType: "application/json" },
  ],
  "prism": [
    { uri: "prism://matters/active", name: "Active Matters", description: "Active legal matters and deadlines", mimeType: "application/json" },
    { uri: "prism://regulations/index", name: "Regulatory Index", description: "Regulatory framework database", mimeType: "application/json" },
  ],
  "lyte": [
    { uri: "lyte://health/status", name: "Platform Health", description: "Real-time platform health metrics", mimeType: "application/json" },
    { uri: "lyte://models/registry", name: "Model Registry", description: "Deployed AI model registry and metrics", mimeType: "application/json" },
  ],
  "carlota-jo": [
    { uri: "carlota://clients/portfolio", name: "Client Portfolio", description: "UHNW client portfolio data", mimeType: "application/json" },
    { uri: "carlota://calendar/rhythm", name: "Rhythm Calendar", description: "Predictive scheduling data", mimeType: "application/json" },
  ],
  "inca": [
    { uri: "inca://models/deployed", name: "Deployed Models", description: "AI models in production", mimeType: "application/json" },
    { uri: "inca://pipelines/active", name: "Active Pipelines", description: "Running ML pipelines", mimeType: "application/json" },
  ],
};

function buildUAI(domain: string): UAIDocument {
  const meta = AGENT_METADATA[domain];
  if (!meta) throw new Error(`Unknown domain: ${domain}`);

  // Canonical DID format: did:web:<domain>.szlholdings.com
  // Must match TRUSTED_DIDS in anp.ts so discovered agents can authenticate.
  // E.g. domain="vessels" → did:web:vessels.szlholdings.com
  const did = `did:web:${domain}.szlholdings.com`;
  const now = new Date().toISOString();

  const uai: UAIDocument = {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://json-ld.org/contexts/person.jsonld",
      "https://w3id.org/a2a/v1",
      "https://w3id.org/mcp/v1",
    ],
    "@type": ["Agent", "A2AAgent", "MCPServer", "ANPAgent"],
    id: `${BASE_URL}/.well-known/agent/${domain}.json`,
    name: meta.name,
    description: meta.description,
    domain,
    version: "1.0.0",
    createdAt: now,
    updatedAt: now,

    a2aCard: {
      agentId: meta.a2aId,
      url: `${API_BASE}/a2a/agents/${meta.a2aId}`,
      skills: DOMAIN_SKILLS[domain] ?? [],
      authentication: { schemes: ["bearer"] },
      capabilities: {
        streaming: true,
        pushNotifications: domain === "aegis",
        stateTransitionHistory: true,
      },
    },

    anpDid: {
      did,
      verificationMethod: [
        {
          id: `${did}#key-1`,
          type: "JsonWebKey2020",
          controller: did,
          publicKeyJwk: {
            kty: "EC",
            crv: "P-256",
            x: Buffer.from(`${domain}-x-key-placeholder`).toString("base64url").slice(0, 43),
            y: Buffer.from(`${domain}-y-key-placeholder`).toString("base64url").slice(0, 43),
          },
        },
      ],
      service: [
        {
          id: `${did}#a2a`,
          type: "A2AService",
          serviceEndpoint: `${API_BASE}/a2a/agents/${meta.a2aId}`,
          description: "A2A task delegation endpoint",
        },
        {
          id: `${did}#mcp`,
          type: "MCPService",
          serviceEndpoint: `${API_BASE}/mcp`,
          description: "MCP tool execution endpoint",
        },
        {
          id: `${did}#acp`,
          type: "ACPService",
          serviceEndpoint: `${API_BASE}/alloy/gateway`,
          description: "ACP REST fallback endpoint",
        },
      ],
      metaProtocol: {
        negotiationEndpoint: `${API_BASE}/alloy/gateway/negotiate`,
        supportedProtocols: ["mcp", "a2a", "anp", "acp"],
      },
    },

    mcpManifest: {
      serverId: `alloy-${domain}-mcp`,
      serverName: `Alloy ${meta.name} MCP Server`,
      protocolVersion: "2024-11-05",
      tools: DOMAIN_TOOLS[domain] ?? [],
      resources: DOMAIN_RESOURCES[domain] ?? [],
      prompts: [
        {
          name: `${domain}_analysis`,
          description: `Request a comprehensive ${domain} domain analysis`,
        },
        {
          name: `${domain}_briefing`,
          description: `Generate an executive briefing for the ${domain} domain`,
        },
      ],
    },

    protocolSupport: [
      {
        protocol: "mcp",
        version: "2024-11-05",
        endpoint: `${API_BASE}/mcp`,
        contentTypes: ["application/json"],
      },
      {
        protocol: "a2a",
        version: "0.3.0",
        endpoint: `${API_BASE}/a2a/agents/${meta.a2aId}`,
        contentTypes: ["application/json", "text/event-stream"],
      },
      {
        protocol: "anp",
        version: "1.0.0",
        endpoint: `${API_BASE}/alloy/gateway`,
        contentTypes: ["application/ld+json", "application/json"],
      },
      {
        protocol: "acp",
        version: "1.0.0",
        endpoint: `${API_BASE}/alloy/gateway`,
        contentTypes: ["application/json"],
      },
    ],

    capabilities: DOMAIN_SKILLS[domain]?.map(s => s.id) ?? [],

    governancePolicy: {
      crossProtocolApprovalRequired: true,
      trustedProtocols: ["mcp", "a2a"],
      hitlRequiredForExternalAgents: true,
      auditAllCrossings: true,
    },
  };

  return uai;
}

const UAI_REGISTRY = new Map<string, UAIDocument>();
const SUPPORTED_DOMAINS = ["vessels", "aegis", "terra", "prism", "lyte", "carlota-jo", "inca"];

export function initializeUAIRegistry(): void {
  for (const domain of SUPPORTED_DOMAINS) {
    try {
      const uai = buildUAI(domain);
      UAI_REGISTRY.set(domain, uai);
    } catch {
    }
  }
}

export function getUAI(domain: string): UAIDocument | null {
  return UAI_REGISTRY.get(domain) ?? null;
}

export function listUAIs(): UAIDocument[] {
  return Array.from(UAI_REGISTRY.values());
}

export function getUAIAsA2ACard(domain: string): Record<string, unknown> | null {
  const uai = getUAI(domain);
  if (!uai) return null;
  return {
    agentId: uai.a2aCard.agentId,
    name: uai.name,
    description: uai.description,
    url: uai.a2aCard.url,
    version: uai.version,
    capabilities: uai.a2aCard.capabilities,
    skills: uai.a2aCard.skills,
    authentication: uai.a2aCard.authentication,
    protocolVersion: "0.3.0",
  };
}

export function getUAIAsANPDid(domain: string): Record<string, unknown> | null {
  const uai = getUAI(domain);
  if (!uai) return null;
  return {
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: uai.anpDid.did,
    verificationMethod: uai.anpDid.verificationMethod,
    service: uai.anpDid.service,
    metaProtocol: uai.anpDid.metaProtocol,
  };
}

export function getUAIAsMCPManifest(domain: string): Record<string, unknown> | null {
  const uai = getUAI(domain);
  if (!uai) return null;
  return {
    protocolVersion: uai.mcpManifest.protocolVersion,
    serverInfo: {
      name: uai.mcpManifest.serverName,
      version: uai.version,
    },
    tools: uai.mcpManifest.tools,
    resources: uai.mcpManifest.resources,
    prompts: uai.mcpManifest.prompts,
  };
}

export function getGlobalAgentCard(): Record<string, unknown> {
  const uais = listUAIs();
  return {
    "@context": ["https://w3id.org/a2a/v1"],
    "@type": "AgentCard",
    name: "SZL Holdings Alloy Protocol Fabric",
    description: "Unified MCP + A2A + ACP + ANP gateway serving all SZL domain agents. Auto-negotiates protocols and provides unified agent discovery.",
    version: "1.0.0",
    url: `${API_BASE}/alloy/gateway`,
    protocolFabricVersion: "1.0.0",
    agents: uais.map(u => ({
      id: u.id,
      name: u.name,
      domain: u.domain,
      a2aUrl: u.a2aCard.url,
      didDocument: u.anpDid.did,
      mcpServerId: u.mcpManifest.serverId,
      protocols: u.protocolSupport.map(p => p.protocol),
    })),
    discovery: {
      a2aCard: `${BASE_URL}/.well-known/agent-card.json`,
      mcpManifest: `${API_BASE}/mcp/manifest`,
      anpDids: SUPPORTED_DOMAINS.map(d => `${BASE_URL}/.well-known/agent/${d}.json`),
    },
    governance: {
      crossProtocolApprovalRequired: true,
      auditTrailEndpoint: `${API_BASE}/alloy/gateway/audit`,
    },
  };
}
