import type { FieldAgentTemplate, TrustTier, FieldAgentConfig } from '../types/sovereign-mesh.js';

export interface AgentJsonSpec {
  model: string;
  provider?: string;
  mcpServers: Record<string, { url: string; transport: 'sse' | 'stdio'; tools?: string[] }>;
  systemPrompt?: string;
  maxSteps?: number;
  covenantBindings: string[];
  template: FieldAgentTemplate;
}

export interface GovernedAgentConfig {
  agentId: string;
  name: string;
  template: FieldAgentTemplate;
  spec: AgentJsonSpec;
  fieldConfig: FieldAgentConfig;
  trustTier: TrustTier;
  maxCostPerRunUsd: number;
  requiresApprovalAbove: TrustTier;
  onProofGenerated?: (proof: ProofPacketRecord) => void;
  onTrustUpdated?: (agentId: string, newScore: number) => void;
}

export interface MCPServerRegistration {
  serverId: string;
  url: string;
  transport: 'sse' | 'stdio';
  capabilities: string[];
  tools: string[];
  healthStatus: 'healthy' | 'degraded' | 'unreachable';
  lastHeartbeat: string;
  registeredAt: string;
}

export interface MCPCapabilityQuery {
  requiredCapabilities: string[];
  preferredTransport?: 'sse' | 'stdio';
  maxLatencyMs?: number;
}

export interface MCPCapabilityResult {
  serverId: string;
  matchedCapabilities: string[];
  availableTools: string[];
  estimatedLatencyMs: number;
  healthStatus: string;
}

export interface WorkcellAssignment {
  workcellId: string;
  agentId: string;
  role: 'primary' | 'support' | 'observer';
  assignedAt: string;
  status: 'active' | 'completed' | 'failed';
}

export interface ProofPacketRecord {
  id: string;
  agentId: string;
  workcellId: string | null;
  action: string;
  inputHash: string;
  outputHash: string;
  toolsCalled: string[];
  covenantsPassed: string[];
  costUsd: number;
  latencyMs: number;
  timestamp: string;
}

export const TRUST_TIER_ORDER: TrustTier[] = ['untrusted', 'provisional', 'standard', 'elevated', 'sovereign'];

export function tierMeetsThreshold(agentTier: TrustTier, requiredTier: TrustTier): boolean {
  return TRUST_TIER_ORDER.indexOf(agentTier) >= TRUST_TIER_ORDER.indexOf(requiredTier);
}
