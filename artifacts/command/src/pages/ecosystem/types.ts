export type GovernanceStatus = 'critical' | 'elevated' | 'standard';
export type SessionStatus = 'active' | 'idle' | 'quarantined';
export type Decision = 'allowed' | 'logged' | 'blocked' | 'quarantined';

export interface TopologyNode {
  id: string;
  name: string;
  kind: 'gateway' | 'domain';
  domain: string;
  description: string;
  policyTier: string;
  endpoint: string;
  color: string;
  toolCount: number;
  callsLast24h: number;
  avgLatencyMs: number | null;
  governanceStatus: GovernanceStatus;
}

export interface TopologyEdge {
  source: string;
  target: string;
  toolFlow: number;
}

export interface TopologyData {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  generatedAt: string;
}

export interface ToolInvocation {
  tool: string;
  mcpServerId: string;
  decision: Decision;
  reason: string;
  latencyMs: number | null;
  occurredAt: string;
}

export interface AgentSession {
  sessionId: string;
  agentClass: string;
  agentName: string;
  color: string;
  transport: string;
  status: SessionStatus;
  toolInvocations: ToolInvocation[];
  invocationCount: number;
  blockedCount: number;
  quarantinedCount: number;
  avgLatencyMs: number | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface SessionsData {
  sessions: AgentSession[];
  windowMs: number;
  generatedAt: string;
}

export interface ToolEntry {
  id: string;
  name: string;
  description: string;
  domainTags: string[];
  policyTier: string;
  approvalRequired: boolean;
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  serverId: string;
  serverName: string;
  domain: string;
  color: string;
  callsLast30d: number;
  blockedLast30d: number;
  enabled: boolean;
}

export interface ToolsData {
  tools: ToolEntry[];
  total: number;
  query: string | null;
  domain: string | null;
}

export interface GovernanceVerdict {
  decision: Decision;
  policyTier: string;
  reason: string;
  proofChainId: string | null;
  requiresApproval: boolean;
}

export interface ToolExecutionResult {
  requestId: string;
  toolId: string;
  toolName?: string;
  result: unknown;
  executionMs: number;
  governanceVerdict: GovernanceVerdict;
  error?: string | null;
  message?: string;
}
