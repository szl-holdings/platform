/**
 * A2A v0.3 Agent Cards & Interoperability
 *
 * Capability 7: Every Nuro Mesh agent publishes a discoverable Agent Card
 * at /.well-known/agent-card.json following the Google A2A v0.3 spec.
 *
 * External agents (LangGraph, CrewAI, ADK) can:
 *   - Discover capabilities via Agent Cards
 *   - Authenticate and delegate tasks over HTTP/SSE/JSON-RPC
 *   - Receive streaming results
 *
 * A2A client capability: Nuro Mesh agents can discover and delegate to
 * external A2A-compatible agents.
 */

import { getEnv } from '@szl-holdings/env';

export interface A2ACapability {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface A2AAuthentication {
  schemes: Array<'bearer' | 'api_key' | 'mtls' | 'oauth2'>;
  required: boolean;
  bearerFormat?: string;
}

export interface A2ASkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples: string[];
  inputModes: Array<'text' | 'json' | 'file'>;
  outputModes: Array<'text' | 'json' | 'stream' | 'ui_component'>;
}

export interface A2AAgentCard {
  schemaVersion: '0.3';
  agentId: string;
  name: string;
  description: string;
  version: string;
  publisher: string;
  homepage: string;
  contact: string;
  capabilities: A2ACapability[];
  skills: A2ASkill[];
  authentication: A2AAuthentication;
  endpoints: {
    base: string;
    tasks: string;
    stream: string;
    jsonrpc: string;
    health: string;
  };
  supportedProtocols: Array<'http' | 'sse' | 'json-rpc-2.0'>;
  maxConcurrentTasks: number;
  defaultTimeoutMs: number;
  tags: string[];
  metadata: Record<string, unknown>;
  publishedAt: string;
}

export interface A2ATask {
  taskId: string;
  agentId: string;
  input: {
    query: string;
    context?: Record<string, unknown>;
    preferredOutputMode?: 'text' | 'json' | 'stream';
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  callerAgentId?: string;
  callerPlatform?: string;
}

export interface A2AJsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface A2AJsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const BASE_URL = (() => {
  const dom = getEnv().REPLIT_DEV_DOMAIN;
  return dom ? `https://${dom}/api-server` : 'http://localhost:8080';
})();

export function buildAgentCard(agentId: string): A2AAgentCard {
  const agentProfiles: Record<string, Partial<A2AAgentCard>> = {
    helmsman: {
      name: 'Helmsman',
      description:
        'Maritime intelligence agent specializing in fleet operations, AIS tracking, maritime security, route risk assessment, and sanctions compliance.',
      skills: [
        {
          id: 'maritime_risk_assessment',
          name: 'Maritime Risk Assessment',
          description:
            'Assess route risks, weather threats, and geopolitical factors affecting shipping lanes',
          tags: ['maritime', 'risk', 'route', 'weather'],
          examples: [
            'Assess risk for vessel transiting Strait of Hormuz',
            'Evaluate sanctions exposure for route from Dubai to Piraeus',
          ],
          inputModes: ['text', 'json'],
          outputModes: ['text', 'json'],
        },
        {
          id: 'ais_tracking',
          name: 'AIS Position Tracking',
          description: 'Real-time vessel position tracking and analysis using AIS data',
          tags: ['ais', 'vessel', 'tracking', 'position'],
          examples: ['Where is vessel MMSI 123456789?', 'Track fleet movements in Arabian Sea'],
          inputModes: ['text', 'json'],
          outputModes: ['text', 'json', 'stream'],
        },
      ],
      tags: ['maritime', 'fleet', 'shipping', 'sanctions', 'ais'],
    },
    sentinel: {
      name: 'Sentinel',
      description:
        'Cybersecurity intelligence agent specializing in threat analysis, CVE assessment, incident response, and security posture evaluation.',
      skills: [
        {
          id: 'threat_analysis',
          name: 'Threat Analysis',
          description:
            'Analyze cybersecurity threats using MITRE ATT&CK framework and CVSS scoring',
          tags: ['threat', 'security', 'mitre', 'cvss'],
          examples: ['Analyze CVE-2024-12345', 'Assess ransomware threat actor TTPs'],
          inputModes: ['text', 'json'],
          outputModes: ['text', 'json'],
        },
        {
          id: 'incident_response',
          name: 'Incident Response',
          description:
            'Guide incident response with structured containment, eradication, and recovery plans',
          tags: ['incident', 'response', 'containment', 'recovery'],
          examples: ['Create IR plan for ransomware incident', 'Triage alert from SIEM'],
          inputModes: ['text', 'json'],
          outputModes: ['text', 'json', 'stream'],
        },
      ],
      tags: ['security', 'cybersecurity', 'threat-intel', 'incident-response'],
    },
    inca: {
      name: 'INCA',
      description:
        'AI research intelligence agent specializing in ML research, model evaluation, academic literature analysis, and technology trend assessment.',
      skills: [
        {
          id: 'research_analysis',
          name: 'Research Analysis',
          description: 'Search and analyze AI/ML papers, models, and research trends',
          tags: ['research', 'ai', 'ml', 'arxiv', 'huggingface'],
          examples: [
            'Find state-of-the-art models for NER',
            'Summarize recent advances in agentic AI',
          ],
          inputModes: ['text'],
          outputModes: ['text', 'json'],
        },
      ],
      tags: ['ai-research', 'ml', 'academia', 'model-evaluation'],
    },
    alloy: {
      name: 'Alloy',
      description:
        'Central orchestration agent that coordinates domain specialists across the Nuro Mesh, synthesizes multi-agent intelligence, and provides unified answers.',
      skills: [
        {
          id: 'multi_agent_orchestration',
          name: 'Multi-Agent Orchestration',
          description:
            'Route complex queries to domain specialists and synthesize unified responses',
          tags: ['orchestration', 'multi-agent', 'synthesis'],
          examples: [
            'Comprehensive risk assessment for SZL fleet operations',
            'Unified threat and operational status briefing',
          ],
          inputModes: ['text', 'json'],
          outputModes: ['text', 'json', 'stream', 'ui_component'],
        },
      ],
      tags: ['orchestration', 'multi-agent', 'platform'],
    },
    muse: {
      name: 'Muse',
      description:
        'Creative intelligence agent specializing in content strategy, campaign ideation, and brand voice.',
      skills: [
        {
          id: 'content_strategy',
          name: 'Content Strategy',
          description: 'Develop content calendars, creative briefs, and marketing campaigns',
          tags: ['content', 'marketing', 'creative', 'strategy'],
          examples: [
            'Create Q3 content calendar for maritime logistics brand',
            'Write creative brief for safety campaign',
          ],
          inputModes: ['text'],
          outputModes: ['text'],
        },
      ],
      tags: ['creative', 'content', 'marketing'],
    },
    beacon: {
      name: 'Terra Analytics',
      description:
        'Analytics and operations intelligence agent specializing in signal analysis, anomaly detection, and platform performance.',
      skills: [
        {
          id: 'anomaly_detection',
          name: 'Anomaly Detection',
          description: 'Detect and analyze operational anomalies and performance deviations',
          tags: ['analytics', 'anomaly', 'performance', 'signals'],
          examples: ['Detect anomalies in platform metrics', 'Analyze KPI trends for Q4'],
          inputModes: ['text', 'json'],
          outputModes: ['text', 'json'],
        },
      ],
      tags: ['analytics', 'operations', 'monitoring'],
    },
  };

  const profile = agentProfiles[agentId] ?? {};

  return {
    schemaVersion: '0.3',
    agentId,
    name: profile.name ?? agentId,
    description: profile.description ?? `Nuro Mesh agent: ${agentId}`,
    version: '1.0.0',
    publisher: 'SZL Holdings',
    homepage: `${BASE_URL}/a2a/agents/${agentId}`,
    contact: 'ai-platform@szlholdings.com',
    capabilities: [
      {
        name: 'text_reasoning',
        description: 'Process natural language queries and return structured intelligence',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string' }, context: { type: 'object' } },
          required: ['query'],
        },
        outputSchema: {
          type: 'object',
          properties: { response: { type: 'string' }, confidence: { type: 'number' } },
        },
      },
      {
        name: 'streaming',
        description: 'Stream long-form responses via Server-Sent Events',
      },
    ],
    skills: profile.skills ?? [],
    authentication: {
      schemes: ['bearer', 'api_key'],
      required: true,
      bearerFormat: 'JWT',
    },
    endpoints: {
      base: `${BASE_URL}/a2a/agents/${agentId}`,
      tasks: `${BASE_URL}/a2a/agents/${agentId}/tasks`,
      stream: `${BASE_URL}/a2a/agents/${agentId}/stream`,
      jsonrpc: `${BASE_URL}/a2a/agents/${agentId}/rpc`,
      health: `${BASE_URL}/a2a/agents/${agentId}/health`,
    },
    supportedProtocols: ['http', 'sse', 'json-rpc-2.0'],
    maxConcurrentTasks: 10,
    defaultTimeoutMs: 120000,
    tags: profile.tags ?? [],
    metadata: {
      platform: 'Nuro Mesh',
      framework: 'Alloy v2',
      region: 'us-east',
      governanceEnabled: true,
      makerCheckerEnabled: true,
      a2aSpecVersion: '0.3',
    },
    publishedAt: new Date().toISOString(),
  };
}

export function buildMeshAgentIndex(): {
  schemaVersion: '0.3';
  platform: string;
  agents: A2AAgentCard[];
  discoveryEndpoint: string;
  publishedAt: string;
} {
  const agentIds = ['alloy', 'helmsman', 'sentinel', 'inca', 'muse', 'beacon', 'zeus', 'compass'];
  return {
    schemaVersion: '0.3',
    platform: 'Nuro Mesh — SZL Holdings Agentic Platform',
    agents: agentIds.map(buildAgentCard),
    discoveryEndpoint: `${BASE_URL}/.well-known/agent-card.json`,
    publishedAt: new Date().toISOString(),
  };
}

export class A2ATaskManager {
  private tasks: Map<string, A2ATask> = new Map();
  private static readonly MAX_TASKS = 1000;

  createTask(
    agentId: string,
    input: A2ATask['input'],
    callerAgentId?: string,
    callerPlatform?: string,
  ): A2ATask {
    const task: A2ATask = {
      taskId: `a2a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentId,
      input,
      status: 'pending',
      output: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      ...(callerAgentId !== undefined ? { callerAgentId } : {}),
      ...(callerPlatform !== undefined ? { callerPlatform } : {}),
    };
    this.tasks.set(task.taskId, task);
    if (this.tasks.size > A2ATaskManager.MAX_TASKS) {
      const oldest = [...this.tasks.keys()][0];
      if (oldest) this.tasks.delete(oldest);
    }
    return task;
  }

  updateTask(
    taskId: string,
    updates: Partial<Pick<A2ATask, 'status' | 'output' | 'error' | 'completedAt'>>,
  ): A2ATask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    return task;
  }

  getTask(taskId: string): A2ATask | null {
    return this.tasks.get(taskId) ?? null;
  }

  listTasks(agentId?: string, limit = 50): A2ATask[] {
    const tasks = [...this.tasks.values()];
    const filtered = agentId ? tasks.filter((t) => t.agentId === agentId) : tasks;
    return filtered.slice(-limit).reverse();
  }

  handleJsonRpc(request: A2AJsonRpcRequest, agentId: string): A2AJsonRpcResponse {
    const id = request.id;

    if (request.method === 'agent/getCard') {
      return { jsonrpc: '2.0', id, result: buildAgentCard(agentId) };
    }

    if (request.method === 'task/create') {
      const params = request.params as {
        input?: A2ATask['input'];
        callerAgentId?: string;
        callerPlatform?: string;
      };
      if (!params?.input?.query) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Invalid params: input.query required' },
        };
      }
      const task = this.createTask(
        agentId,
        params.input,
        params.callerAgentId,
        params.callerPlatform,
      );
      return {
        jsonrpc: '2.0',
        id,
        result: { taskId: task.taskId, status: task.status, createdAt: task.createdAt },
      };
    }

    if (request.method === 'task/get') {
      const params = request.params as { taskId?: string };
      const task = params?.taskId ? this.getTask(params.taskId) : null;
      if (!task) return { jsonrpc: '2.0', id, error: { code: -32001, message: 'Task not found' } };
      return { jsonrpc: '2.0', id, result: task };
    }

    if (request.method === 'task/list') {
      return { jsonrpc: '2.0', id, result: this.listTasks(agentId) };
    }

    return {
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32601, message: `Method '${request.method}' not found` },
    };
  }
}

export const a2aTaskManager = new A2ATaskManager();
