export interface AgentDefinition {
  id: string;
  name: string;
  domain: string;
  systemPrompt: string;
  preferredModel: string;
  preferredProvider: "openai" | "anthropic" | "gemini";
  highStakesDomains: string[];
  tools: string[];
  semanticIntents?: string[];
  collaboratesWith?: string[];
}

export interface DomainRoutingRule {
  domain: string;
  keywords: string[];
}

export interface ValidationResult {
  validated: boolean;
  validatorNotes: string;
  adjustedOutput: string;
  status: "APPROVED" | "APPROVED_WITH_NOTES" | "REJECTED";
}

export interface AgentCallResult {
  agentId: string;
  agentName: string;
  response: string;
  confidence: number;
  domain: string;
  tokensUsed?: number;
  latencyMs?: number;
  modelUsed?: string;
  consultations?: AgentConsultationResult[];
}

export interface RAGChunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export type SensitivityLevel = "public" | "internal" | "confidential" | "restricted";

export type RagSourceType =
  | "ai_decision"
  | "case_memory"
  | "incident"
  | "agent_knowledge"
  | "document"
  | "playbook"
  | "evidence"
  | "alert";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface DomainAgentConfig {
  name: string;
  systemPrompt: string;
  tools: ToolDefinition[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<string>;
}

export interface AgentConsultationRequest {
  requestingAgentId: string;
  targetAgentId: string;
  question: string;
  context: string;
  reason: string;
}

export interface AgentConsultationResult {
  consultingAgentId: string;
  consultingAgentName: string;
  question: string;
  response: string;
  confidence: number;
}

export interface CrossAgentInsight {
  sourceAgentId: string;
  sourceDomain: string;
  linkedDomains: string[];
  insightType: "risk_flag" | "opportunity" | "data_point" | "recommendation" | "alert";
  content: string;
  importance: number;
  tags: string[];
}

export interface StructuredToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface StructuredToolResult {
  toolCallId: string;
  toolName: string;
  content: string;
  success: boolean;
  error?: string;
}

export interface SemanticRoutingScore {
  domain: string;
  keywordScore: number;
  intentScore: number;
  combinedScore: number;
}

export interface CausalLink {
  cause: { domain: string; signal: string };
  effect: { domain: string; signal: string };
  strength: number;
  description: string;
}

export interface CausalChain {
  id: string;
  links: CausalLink[];
  originDomain: string;
  terminalDomain: string;
  overallStrength: number;
  narrative: string;
  detectedAt: number;
}

export interface ProactiveActivation {
  triggeredAgentId: string;
  triggeredDomain: string;
  reason: string;
  correlatedSignals: SignalCorrelation[];
  urgency: "low" | "medium" | "high" | "critical";
  suggestedQuery: string;
}

export interface SignalCorrelation {
  sourceAgentId: string;
  sourceDomain: string;
  signal: string;
  targetDomain: string;
  correlationScore: number;
  timestamp: number;
}

export interface AgentPerformanceProfile {
  agentId: string;
  domain: string;
  avgConfidence: number;
  avgLatencyMs: number;
  successRate: number;
  consultationValueScore: number;
  routingAccuracy: number;
  totalInvocations: number;
  rollingWindow: number;
  lastUpdated: number;
}

export interface ConflictResolution {
  conflictId: string;
  agents: Array<{ agentId: string; position: string; confidence: number; evidenceStrength: number }>;
  resolution: string;
  resolutionMethod: "authority_weight" | "evidence_strength" | "confidence_calibration" | "consensus";
  winningAgentId: string;
  dissent: string | null;
}

export interface ConfidenceCalibrationEntry {
  agentId: string;
  predictedConfidence: number;
  actualAccuracy: number;
  calibrationDelta: number;
  bayesianPrior: number;
  updatedPrior: number;
  sampleSize: number;
}

export interface OrchestrationTelemetry {
  orchestrationId: string;
  timestamp: number;
  routingDecision: { selectedAgents: string[]; routingScores?: SemanticRoutingScore[] };
  agentPerformance: AgentPerformanceProfile[];
  causalChains: CausalChain[];
  conflicts: ConflictResolution[];
  proactiveActivations: ProactiveActivation[];
  totalLatencyMs: number;
  tokensBurned: number;
}
