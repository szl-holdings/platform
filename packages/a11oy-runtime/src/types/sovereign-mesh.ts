export type FieldAgentStatus = 'idle' | 'active' | 'paused' | 'error' | 'terminated';
export type FieldAgentTemplate = 'research' | 'analysis' | 'monitoring' | 'synthesis' | 'compliance' | 'security';
export type TrustTier = 'untrusted' | 'provisional' | 'standard' | 'elevated' | 'sovereign';

export interface TrustScore {
  overall: number;
  rollingAccuracy: number;
  approvalRate: number;
  costEfficiency: number;
  uptimeReliability: number;
  proofCompleteness: number;
  tier: TrustTier;
  computedAt: string;
  historyWindow: number;
}

export interface FieldAgentConfig {
  model: string;
  mcpServers: string[];
  allowedTools: string[];
  blockedTools: string[];
  covenantBindings: string[];
  maxConcurrentCalls: number;
  maxCostPerRunUsd: number;
  requiresApprovalAbove: TrustTier;
}

export interface FieldAgent {
  id: string;
  name: string;
  template: FieldAgentTemplate;
  status: FieldAgentStatus;
  config: FieldAgentConfig;
  trustScore: TrustScore;
  capabilities: string[];
  workcellId: string | null;
  crewId: string | null;
  spawnedAt: string;
  lastActiveAt: string;
  tasksCompleted: number;
  tasksErrored: number;
  totalCostUsd: number;
  proofPacketIds: string[];
}

export interface CrewComposition {
  id: string;
  name: string;
  objective: string;
  agentIds: string[];
  plannerAgentId: string;
  status: 'forming' | 'active' | 'completed' | 'dissolved';
  formedAt: string;
  completedAt: string | null;
  proofPacketId: string | null;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  crewId: string | null;
  type: 'task_assignment' | 'result' | 'capability_query' | 'capability_response' | 'handoff' | 'proof_share';
  payload: Record<string, unknown>;
  proofHash: string;
  timestamp: string;
}

export interface AgentActivityEntry {
  id: string;
  agentId: string;
  agentName: string;
  type: 'tool_call' | 'message_sent' | 'message_received' | 'proof_generated' | 'trust_updated' | 'crew_joined' | 'crew_left' | 'status_change' | 'error';
  detail: string;
  toolId?: string;
  proofHash?: string;
  timestamp: string;
}

export interface MeshSummary {
  totalAgents: number;
  activeAgents: number;
  totalCrews: number;
  activeCrews: number;
  totalMessages: number;
  totalProofPackets: number;
  avgTrustScore: number;
  totalCostUsd: number;
  uptimePercent: number;
}

export const TRUST_TIER_THRESHOLDS: Record<TrustTier, { min: number; maxToolAccess: number; approvalRequired: boolean }> = {
  untrusted: { min: 0, maxToolAccess: 2, approvalRequired: true },
  provisional: { min: 40, maxToolAccess: 5, approvalRequired: true },
  standard: { min: 60, maxToolAccess: 10, approvalRequired: true },
  elevated: { min: 80, maxToolAccess: 20, approvalRequired: false },
  sovereign: { min: 95, maxToolAccess: 999, approvalRequired: false },
};

export const TEMPLATE_DEFINITIONS: Record<FieldAgentTemplate, {
  label: string;
  description: string;
  defaultModel: string;
  defaultMcpServers: string[];
  defaultTools: string[];
  defaultCovenants: string[];
  capabilities: string[];
}> = {
  research: {
    label: 'Research Agent',
    description: 'Gathers intelligence from external sources, builds context packs with citations, and scores evidence freshness.',
    defaultModel: 'Qwen/Qwen3-27B',
    defaultMcpServers: ['substrate-gateway', 'perplexity-mcp'],
    defaultTools: ['signal_reader', 'domain_lookup', 'document_reader', 'context_pack_builder'],
    defaultCovenants: ['policy.data-retention', 'policy.cross-domain-access'],
    capabilities: ['real-time search', 'citation verification', 'evidence scoring', 'context building'],
  },
  analysis: {
    label: 'Analysis Agent',
    description: 'Performs deep quantitative and qualitative analysis on structured and unstructured data.',
    defaultModel: 'Qwen/Qwen3-27B',
    defaultMcpServers: ['substrate-gateway'],
    defaultTools: ['financial_reader', 'signal_reader', 'domain_lookup', 'document_reader'],
    defaultCovenants: ['policy.data-retention', 'policy.ai-output-validation'],
    capabilities: ['quantitative analysis', 'trend detection', 'anomaly identification', 'forecast generation'],
  },
  monitoring: {
    label: 'Monitoring Agent',
    description: 'Watches signal streams for anomalies, threshold breaches, and drift conditions.',
    defaultModel: 'Qwen/Qwen3-27B',
    defaultMcpServers: ['substrate-gateway'],
    defaultTools: ['signal_reader', 'domain_lookup'],
    defaultCovenants: ['policy.data-retention'],
    capabilities: ['signal monitoring', 'threshold alerts', 'drift detection', 'heartbeat checks'],
  },
  synthesis: {
    label: 'Synthesis Agent',
    description: 'Combines outputs from multiple agents into coherent executive summaries and board packets.',
    defaultModel: 'Qwen/Qwen3-27B',
    defaultMcpServers: ['substrate-gateway'],
    defaultTools: ['document_reader', 'proof_ledger_writer', 'context_pack_builder'],
    defaultCovenants: ['policy.ai-output-validation', 'policy.data-retention'],
    capabilities: ['report generation', 'cross-domain synthesis', 'executive summary', 'board packet creation'],
  },
  compliance: {
    label: 'Compliance Agent',
    description: 'Evaluates actions and outputs against regulatory frameworks and internal policies.',
    defaultModel: 'Qwen/Qwen3-27B',
    defaultMcpServers: ['substrate-gateway'],
    defaultTools: ['policy_checker', 'covenant_guard', 'document_reader'],
    defaultCovenants: ['policy.ai-output-validation', 'policy.cross-domain-access', 'policy.data-retention'],
    capabilities: ['policy evaluation', 'regulatory mapping', 'compliance scoring', 'violation detection'],
  },
  security: {
    label: 'Security Agent',
    description: 'Monitors for security threats, evaluates attack surfaces, and recommends mitigations.',
    defaultModel: 'Qwen/Qwen3-27B',
    defaultMcpServers: ['substrate-gateway'],
    defaultTools: ['signal_reader', 'sanctions_checker', 'policy_checker', 'domain_lookup'],
    defaultCovenants: ['policy.ai-output-validation', 'policy.data-retention', 'policy.maritime-cyber-ir'],
    capabilities: ['threat detection', 'vulnerability scanning', 'incident triage', 'attack surface analysis'],
  },
};
