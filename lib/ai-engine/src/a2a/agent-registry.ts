import { getEnv } from '@szl-holdings/env';
import { AGENT_REGISTRY } from '../nuro-mesh.js';

export interface AgentCapability {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  costEstimate: 'low' | 'medium' | 'high';
  avgLatencyMs: number;
}

export interface AgentCard {
  agentId: string;
  agentName: string;
  domain: string;
  version: string;
  description: string;
  capabilities: AgentCapability[];
  preferredModel: string;
  preferredProvider: string;
  highStakesDomains: string[];
  availability: 'online' | 'offline' | 'degraded';
  trustLevel: 'verified' | 'provisional' | 'untrusted';
  endpoints: {
    chat: string;
    delegate: string;
    status: string;
  };
  metadata: {
    createdAt: string;
    lastHeartbeat: string;
    totalDelegations: number;
    successRate: number;
  };
}

const AGENT_CAPABILITY_MAP: Record<string, AgentCapability[]> = {
  helmsman: [
    {
      name: 'fleet_position_analysis',
      description: 'Analyze AIS vessel positions, routes, and maritime risk',
      inputSchema: {
        type: 'object',
        properties: { vessels: { type: 'array' }, timeRange: { type: 'string' } },
      },
      outputSchema: {
        type: 'object',
        properties: { riskScore: { type: 'number' }, alerts: { type: 'array' } },
      },
      costEstimate: 'medium',
      avgLatencyMs: 1800,
    },
    {
      name: 'route_risk_assessment',
      description:
        'Assess risk for planned maritime routes including sanctions, weather, piracy zones',
      inputSchema: {
        type: 'object',
        properties: { origin: { type: 'string' }, destination: { type: 'string' } },
      },
      outputSchema: {
        type: 'object',
        properties: { riskLevel: { type: 'string' }, blockers: { type: 'array' } },
      },
      costEstimate: 'medium',
      avgLatencyMs: 2200,
    },
  ],
  sentinel: [
    {
      name: 'threat_assessment',
      description: 'Assess cybersecurity threats, CVEs, and incident severity',
      inputSchema: {
        type: 'object',
        properties: { threat: { type: 'string' }, assets: { type: 'array' } },
      },
      outputSchema: {
        type: 'object',
        properties: { severity: { type: 'string' }, cvss: { type: 'number' } },
      },
      costEstimate: 'medium',
      avgLatencyMs: 2000,
    },
    {
      name: 'maker_checker_validation',
      description: 'Validate outputs from other agents for accuracy and risk',
      inputSchema: {
        type: 'object',
        properties: { primaryOutput: { type: 'string' }, context: { type: 'string' } },
      },
      outputSchema: {
        type: 'object',
        properties: { validated: { type: 'boolean' }, notes: { type: 'string' } },
      },
      costEstimate: 'low',
      avgLatencyMs: 1500,
    },
  ],
  inca: [
    {
      name: 'research_synthesis',
      description: 'Synthesize AI/ML research from papers and HuggingFace models',
      inputSchema: {
        type: 'object',
        properties: { topic: { type: 'string' }, depth: { type: 'string' } },
      },
      outputSchema: {
        type: 'object',
        properties: { summary: { type: 'string' }, models: { type: 'array' } },
      },
      costEstimate: 'high',
      avgLatencyMs: 3500,
    },
  ],
  muse: [
    {
      name: 'content_generation',
      description: 'Generate content strategies, campaigns, and creative briefs',
      inputSchema: {
        type: 'object',
        properties: { brief: { type: 'string' }, audience: { type: 'string' } },
      },
      outputSchema: {
        type: 'object',
        properties: { content: { type: 'string' }, strategy: { type: 'object' } },
      },
      costEstimate: 'medium',
      avgLatencyMs: 2500,
    },
  ],
  beacon: [
    {
      name: 'anomaly_detection',
      description: 'Detect operational anomalies and performance degradation',
      inputSchema: {
        type: 'object',
        properties: { metrics: { type: 'array' }, baseline: { type: 'object' } },
      },
      outputSchema: {
        type: 'object',
        properties: { anomalies: { type: 'array' }, severity: { type: 'string' } },
      },
      costEstimate: 'low',
      avgLatencyMs: 1200,
    },
  ],
  zeus: [
    {
      name: 'infrastructure_diagnosis',
      description: 'Diagnose cloud infrastructure issues and recommend optimizations',
      inputSchema: {
        type: 'object',
        properties: { system: { type: 'string' }, symptoms: { type: 'array' } },
      },
      outputSchema: {
        type: 'object',
        properties: { diagnosis: { type: 'string' }, actions: { type: 'array' } },
      },
      costEstimate: 'medium',
      avgLatencyMs: 2000,
    },
  ],
  compass: [
    {
      name: 'readiness_assessment',
      description: 'Evaluate organizational maturity and generate readiness scores',
      inputSchema: {
        type: 'object',
        properties: { framework: { type: 'string' }, scope: { type: 'string' } },
      },
      outputSchema: {
        type: 'object',
        properties: { score: { type: 'number' }, gaps: { type: 'array' } },
      },
      costEstimate: 'medium',
      avgLatencyMs: 2800,
    },
  ],
  alloy: [
    {
      name: 'orchestration',
      description: 'Orchestrate multi-agent tasks and synthesize domain expert responses',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' }, agents: { type: 'array' } },
      },
      outputSchema: {
        type: 'object',
        properties: { synthesis: { type: 'string' }, confidence: { type: 'number' } },
      },
      costEstimate: 'high',
      avgLatencyMs: 5000,
    },
  ],
};

const agentHeartbeats = new Map<string, number>();
const delegationCounters = new Map<string, number>();
const delegationSuccessCounters = new Map<string, number>();

export function recordHeartbeat(agentId: string): void {
  agentHeartbeats.set(agentId, Date.now());
}

export function recordDelegationResult(agentId: string, success: boolean): void {
  delegationCounters.set(agentId, (delegationCounters.get(agentId) ?? 0) + 1);
  if (success) {
    delegationSuccessCounters.set(agentId, (delegationSuccessCounters.get(agentId) ?? 0) + 1);
  }
}

function getAvailability(agentId: string): AgentCard['availability'] {
  const lastBeat = agentHeartbeats.get(agentId);
  if (!lastBeat) return 'online';
  const age = Date.now() - lastBeat;
  if (age < 60000) return 'online';
  if (age < 300000) return 'degraded';
  return 'offline';
}

const BASE_URL = (() => {
  const dom = getEnv().REPLIT_DEV_DOMAIN;
  if (dom) return `https://${dom}/api-server`;
  return 'http://localhost:8080';
})();

export function buildAgentCard(agentDef: (typeof AGENT_REGISTRY)[0]): AgentCard {
  const total = delegationCounters.get(agentDef.id) ?? 0;
  const successes = delegationSuccessCounters.get(agentDef.id) ?? 0;
  const successRate = total > 0 ? successes / total : 1.0;

  return {
    agentId: agentDef.id,
    agentName: agentDef.name,
    domain: agentDef.domain,
    version: '2.0.0',
    description: `${agentDef.systemPrompt.slice(0, 200)}...`,
    capabilities: AGENT_CAPABILITY_MAP[agentDef.id] ?? [],
    preferredModel: agentDef.preferredModel,
    preferredProvider: agentDef.preferredProvider,
    highStakesDomains: agentDef.highStakesDomains,
    availability: getAvailability(agentDef.id),
    trustLevel: 'verified',
    endpoints: {
      chat: `${BASE_URL}/domain-agents/${agentDef.id}/chat`,
      delegate: `${BASE_URL}/a2a/delegate`,
      status: `${BASE_URL}/a2a/agents/${agentDef.id}/status`,
    },
    metadata: {
      createdAt: new Date().toISOString(),
      lastHeartbeat: new Date(agentHeartbeats.get(agentDef.id) ?? Date.now()).toISOString(),
      totalDelegations: total,
      successRate,
    },
  };
}

export function getAllAgentCards(): AgentCard[] {
  return AGENT_REGISTRY.map(buildAgentCard);
}

export function getAgentCard(agentId: string): AgentCard | null {
  const def = AGENT_REGISTRY.find((a) => a.id === agentId);
  if (!def) return null;
  return buildAgentCard(def);
}

export function discoverAgentsByCapability(capabilityName: string): AgentCard[] {
  return getAllAgentCards().filter((card) =>
    card.capabilities.some(
      (c) =>
        c.name.includes(capabilityName) ||
        c.description.toLowerCase().includes(capabilityName.toLowerCase()),
    ),
  );
}

export function discoverAgentsByDomain(domain: string): AgentCard[] {
  return getAllAgentCards().filter(
    (card) => card.domain === domain && card.availability !== 'offline',
  );
}

export function rankAgentsForTask(query: string): AgentCard[] {
  const lower = query.toLowerCase();
  const scored = getAllAgentCards()
    .filter((c) => c.availability !== 'offline' && c.agentId !== 'alloy')
    .map((card) => {
      let score = 0;
      if (lower.includes(card.domain)) score += 10;
      for (const cap of card.capabilities) {
        const capWords = `${cap.name} ${cap.description}`.toLowerCase();
        const queryWords = lower.split(/\s+/);
        for (const w of queryWords) {
          if (w.length > 3 && capWords.includes(w)) score += 2;
        }
      }
      score += card.metadata.successRate * 5;
      return { card, score };
    });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.card);
}
