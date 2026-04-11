import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import type { A2AAgentCard, A2ATask } from "./types";

const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}/api`
  : "http://localhost:8080/api";

export async function registerAgentCard(card: A2AAgentCard): Promise<void> {
  await pool.query(
    `INSERT INTO a2a_agent_cards
     (agent_id, name, description, url, version, capabilities, skills, authentication, metadata, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     ON CONFLICT (agent_id) DO UPDATE SET
       name = EXCLUDED.name, description = EXCLUDED.description, url = EXCLUDED.url,
       version = EXCLUDED.version, capabilities = EXCLUDED.capabilities,
       skills = EXCLUDED.skills, authentication = EXCLUDED.authentication,
       metadata = EXCLUDED.metadata, updated_at = NOW()`,
    [
      card.agentId, card.name, card.description, card.url, card.version,
      JSON.stringify(card.capabilities), JSON.stringify(card.skills),
      JSON.stringify(card.authentication), JSON.stringify({}),
    ]
  );
  logger.info({ agentId: card.agentId }, "A2A agent card registered");
}

export async function getAgentCard(agentId: string): Promise<A2AAgentCard | null> {
  const result = await pool.query("SELECT * FROM a2a_agent_cards WHERE agent_id = $1", [agentId]);
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    agentId: r.agent_id, name: r.name, description: r.description,
    url: r.url, version: r.version, capabilities: r.capabilities,
    skills: r.skills, authentication: r.authentication,
  };
}

export async function listAgentCards(): Promise<A2AAgentCard[]> {
  const result = await pool.query("SELECT * FROM a2a_agent_cards ORDER BY name");
  return result.rows.map((r: any) => ({
    agentId: r.agent_id, name: r.name, description: r.description,
    url: r.url, version: r.version, capabilities: r.capabilities,
    skills: r.skills, authentication: r.authentication,
  }));
}

export async function createTask(
  clientAgentId: string,
  remoteAgentId: string,
  input: any,
  contextId?: string
): Promise<A2ATask> {
  const taskId = `a2a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ctxId = contextId ?? `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  await pool.query(
    `INSERT INTO a2a_tasks (task_id, context_id, client_agent_id, remote_agent_id, status, input, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'submitted', $5, NOW(), NOW())`,
    [taskId, ctxId, clientAgentId, remoteAgentId, JSON.stringify(input)]
  );

  return {
    taskId, contextId: ctxId, clientAgentId, remoteAgentId,
    status: "submitted", input,
  };
}

export async function updateTaskStatus(
  taskId: string,
  status: A2ATask["status"],
  output?: any,
  error?: string
): Promise<void> {
  await pool.query(
    `UPDATE a2a_tasks SET status = $2, output = $3, error = $4, updated_at = NOW()
     WHERE task_id = $1`,
    [taskId, status, output ? JSON.stringify(output) : null, error]
  );
}

export async function getTask(taskId: string): Promise<A2ATask | null> {
  const result = await pool.query("SELECT * FROM a2a_tasks WHERE task_id = $1", [taskId]);
  if (result.rows.length === 0) return null;
  const r = result.rows[0];
  return {
    taskId: r.task_id, contextId: r.context_id, clientAgentId: r.client_agent_id,
    remoteAgentId: r.remote_agent_id, status: r.status, input: r.input,
    output: r.output, artifacts: r.artifacts, error: r.error,
  };
}

export async function listTasks(
  filters?: { agentId?: string; status?: string; contextId?: string; limit?: number }
): Promise<A2ATask[]> {
  const conditions = ["1=1"];
  const params: any[] = [];
  let idx = 1;

  if (filters?.agentId) {
    conditions.push(`(client_agent_id = $${idx} OR remote_agent_id = $${idx})`);
    params.push(filters.agentId);
    idx++;
  }
  if (filters?.status) { conditions.push(`status = $${idx}`); params.push(filters.status); idx++; }
  if (filters?.contextId) { conditions.push(`context_id = $${idx}`); params.push(filters.contextId); idx++; }
  params.push(filters?.limit ?? 50);

  const result = await pool.query(
    `SELECT * FROM a2a_tasks WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT $${idx}`,
    params
  );
  return result.rows.map((r: any) => ({
    taskId: r.task_id, contextId: r.context_id, clientAgentId: r.client_agent_id,
    remoteAgentId: r.remote_agent_id, status: r.status, input: r.input,
    output: r.output, artifacts: r.artifacts, error: r.error,
  }));
}

export function buildDefaultAgentCards(): A2AAgentCard[] {
  return [
    {
      agentId: "vessels-intelligence",
      name: "Vessels Maritime Intelligence",
      description: "Maritime fleet intelligence, AIS tracking, route optimization, port risk analysis, and compliance monitoring",
      url: `${BASE_URL}/a2a/agents/vessels-intelligence`,
      version: "0.3.0",
      capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: true },
      skills: [
        { id: "fleet-tracking", name: "Fleet Tracking", description: "Real-time AIS vessel tracking and route analysis", inputModes: ["text"], outputModes: ["text", "data"] },
        { id: "port-risk", name: "Port Risk Assessment", description: "Assess port security, compliance, and operational risk", inputModes: ["text"], outputModes: ["text", "data"] },
        { id: "route-optimization", name: "Route Optimization", description: "Optimize vessel routes for fuel, time, and safety", inputModes: ["text", "data"], outputModes: ["text", "data"] },
      ],
      authentication: { schemes: ["bearer"] },
    },
    {
      agentId: "aegis-defense",
      name: "Aegis Unified Defense",
      description: "SOC analysis, threat detection, incident response, vulnerability assessment, and cyber defense intelligence",
      url: `${BASE_URL}/a2a/agents/aegis-defense`,
      version: "0.3.0",
      capabilities: { streaming: true, pushNotifications: true, stateTransitionHistory: true },
      skills: [
        { id: "threat-detection", name: "Threat Detection", description: "Real-time threat detection and alert triage", inputModes: ["text", "data"], outputModes: ["text", "data"] },
        { id: "incident-response", name: "Incident Response", description: "Automated incident response playbook execution", inputModes: ["text"], outputModes: ["text", "data"] },
        { id: "vulnerability-scan", name: "Vulnerability Assessment", description: "Assess system vulnerabilities and recommend remediations", inputModes: ["text", "data"], outputModes: ["text", "data"] },
      ],
      authentication: { schemes: ["bearer"] },
    },
    {
      agentId: "lyte-aiops",
      name: "Lyte AIOps Command",
      description: "AI model lifecycle management, inference monitoring, cost optimization, and ML pipeline orchestration",
      url: `${BASE_URL}/a2a/agents/lyte-aiops`,
      version: "0.3.0",
      capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: true },
      skills: [
        { id: "model-monitoring", name: "Model Monitoring", description: "Monitor AI model performance, drift, and health", inputModes: ["text"], outputModes: ["text", "data"] },
        { id: "cost-optimization", name: "Cost Optimization", description: "Optimize AI inference costs across providers", inputModes: ["text", "data"], outputModes: ["text", "data"] },
        { id: "pipeline-orchestration", name: "Pipeline Orchestration", description: "Orchestrate ML training and deployment pipelines", inputModes: ["text"], outputModes: ["text", "data"] },
      ],
      authentication: { schemes: ["bearer"] },
    },
    {
      agentId: "terra-realestate",
      name: "Terra Real Estate Intelligence",
      description: "Real estate portfolio analysis, market intelligence, deal flow scoring, and property valuation",
      url: `${BASE_URL}/a2a/agents/terra-realestate`,
      version: "0.3.0",
      capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: true },
      skills: [
        { id: "market-analysis", name: "Market Analysis", description: "Analyze real estate market trends, pricing, and opportunities", inputModes: ["text"], outputModes: ["text", "data"] },
        { id: "deal-scoring", name: "Deal Scoring", description: "Score and rank real estate deals by ROI potential and risk", inputModes: ["text", "data"], outputModes: ["text", "data"] },
        { id: "property-valuation", name: "Property Valuation", description: "Estimate property values using comparable sales and market data", inputModes: ["text", "data"], outputModes: ["text", "data"] },
      ],
      authentication: { schemes: ["bearer"] },
    },
    {
      agentId: "prism-legal",
      name: "PRISM Legal Counsel",
      description: "Legal matter management, compliance analysis, contract review, and regulatory intelligence",
      url: `${BASE_URL}/a2a/agents/prism-legal`,
      version: "0.3.0",
      capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: true },
      skills: [
        { id: "contract-review", name: "Contract Review", description: "Analyze contracts for risks, obligations, and compliance", inputModes: ["text", "data"], outputModes: ["text", "data"] },
        { id: "compliance-check", name: "Compliance Analysis", description: "Check regulatory compliance across jurisdictions", inputModes: ["text"], outputModes: ["text", "data"] },
        { id: "matter-management", name: "Matter Management", description: "Track and manage legal matters, deadlines, and billing", inputModes: ["text"], outputModes: ["text", "data"] },
      ],
      authentication: { schemes: ["bearer"] },
    },
    {
      agentId: "carlota-advisory",
      name: "Carlota Jo Advisory",
      description: "Ultra-high-net-worth client advisory, portfolio strategy, and relationship intelligence",
      url: `${BASE_URL}/a2a/agents/carlota-advisory`,
      version: "0.3.0",
      capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: true },
      skills: [
        { id: "client-intelligence", name: "Client Intelligence", description: "Analyze client portfolios, preferences, and relationship health", inputModes: ["text"], outputModes: ["text", "data"] },
        { id: "portfolio-strategy", name: "Portfolio Strategy", description: "Generate personalized portfolio strategies for UHNW clients", inputModes: ["text", "data"], outputModes: ["text", "data"] },
      ],
      authentication: { schemes: ["bearer"] },
    },
    {
      agentId: "szl-orchestrator",
      name: "SZL Orchestrator",
      description: "Cross-platform master orchestrator that coordinates all domain agents, generates executive briefings, and manages multi-agent workflows",
      url: `${BASE_URL}/a2a/agents/szl-orchestrator`,
      version: "0.3.0",
      capabilities: { streaming: true, pushNotifications: true, stateTransitionHistory: true },
      skills: [
        { id: "cross-domain-orchestration", name: "Cross-Domain Orchestration", description: "Coordinate tasks across all 7 domain agents", inputModes: ["text"], outputModes: ["text", "data"] },
        { id: "executive-briefing", name: "Executive Briefing", description: "Generate cross-platform executive intelligence briefings", inputModes: ["text"], outputModes: ["text", "data"] },
        { id: "portfolio-analytics", name: "Portfolio Analytics", description: "Aggregate analytics across all business verticals", inputModes: ["text"], outputModes: ["text", "data"] },
      ],
      authentication: { schemes: ["bearer"] },
    },
  ];
}

export async function initializeA2ACards(): Promise<void> {
  const cards = buildDefaultAgentCards();
  for (const card of cards) {
    await registerAgentCard(card);
  }
  logger.info({ count: cards.length }, "A2A agent cards initialized");
}
