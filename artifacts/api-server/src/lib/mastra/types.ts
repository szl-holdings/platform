import { z } from "zod";

export interface MastraAgentConfig {
  agentId: string;
  name: string;
  domain: string;
  description: string;
  systemPrompt: string;
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  tools: MastraTool[];
  memory?: MemoryConfig;
  routing?: RoutingStrategy;
  guardrails?: Guardrail[];
}

export interface MastraTool {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  outputSchema?: z.ZodType<any>;
  permissions?: string[];
  rateLimit?: { maxCalls: number; windowMs: number };
  handler: (input: any, context: AgentExecutionContext) => Promise<any>;
}

export interface MemoryConfig {
  shortTerm: { maxMessages: number; ttlMinutes: number };
  longTerm: { enabled: boolean; semanticRecall: boolean; topK: number };
  knowledgeGraph: { enabled: boolean; extractEntities: boolean };
}

export type RoutingStrategy = "preferred" | "fastest" | "cheapest" | "fallback";

export interface Guardrail {
  name: string;
  type: "input" | "output" | "both";
  validator: (content: string, context: AgentExecutionContext) => Promise<GuardrailResult>;
}

export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  sanitizedContent?: string;
}

export interface AgentExecutionContext {
  runId: string;
  traceId: string;
  agentId: string;
  domain: string;
  threadId: string;
  userId?: string;
  parentRunId?: string;
  metadata: Record<string, unknown>;
  delegateTo: (agentId: string, task: string) => Promise<DelegationResult>;
  recall: (query: string, topK?: number) => Promise<MemoryRecallResult[]>;
  storeEntity: (entity: KnowledgeEntity) => Promise<void>;
  emitTrace: (span: TraceSpan) => Promise<void>;
}

export interface DelegationResult {
  agentId: string;
  response: string;
  toolsUsed: string[];
  latencyMs: number;
  traceId: string;
}

export interface MemoryRecallResult {
  content: string;
  role: string;
  similarity: number;
  threadId: string;
  createdAt: Date;
}

export interface KnowledgeEntity {
  entityType: string;
  name: string;
  description?: string;
  properties?: Record<string, unknown>;
  relations?: { targetName: string; targetType: string; relationType: string; weight?: number }[];
}

export interface TraceSpan {
  traceId: string;
  parentTraceId?: string;
  spanType: "agent_run" | "tool_call" | "llm_inference" | "delegation" | "workflow_step" | "memory_recall" | "rag_query";
  name: string;
  status: "running" | "completed" | "failed" | "cancelled";
  input?: any;
  output?: any;
  error?: string;
  tokensInput?: number;
  tokensOutput?: number;
  costUsd?: number;
  latencyMs?: number;
  model?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowDAG {
  workflowId: string;
  name: string;
  steps: WorkflowStep[];
  edges: WorkflowEdge[];
  context?: Record<string, unknown>;
}

export interface WorkflowStep {
  stepId: string;
  stepType: "agent_run" | "tool_call" | "condition" | "parallel" | "human_review" | "checkpoint";
  agentId?: string;
  toolName?: string;
  input?: any;
  condition?: (ctx: Record<string, unknown>) => boolean;
  parallelSteps?: string[];
  timeout?: number;
  retries?: number;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: (ctx: Record<string, unknown>) => boolean;
}

export interface A2AAgentCard {
  agentId: string;
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
  };
  skills: A2ASkill[];
  authentication: { schemes: string[] };
}

export interface A2ASkill {
  id: string;
  name: string;
  description: string;
  inputModes: string[];
  outputModes: string[];
}

export interface A2ATask {
  taskId: string;
  contextId: string;
  clientAgentId: string;
  remoteAgentId: string;
  status: "submitted" | "working" | "completed" | "failed" | "cancelled";
  input: any;
  output?: any;
  artifacts?: any[];
  error?: string;
}

export interface AgentOpsMetrics {
  agentId: string;
  totalRuns: number;
  avgLatencyMs: number;
  avgTokensUsed: number;
  avgCostUsd: number;
  successRate: number;
  avgQualityScore: number;
  p95LatencyMs: number;
  runsLast24h: number;
  sloStatus: "healthy" | "degraded" | "breached";
}

export interface CognitiveRunMetadata {
  cognitiveMode: "system1" | "system2";
  complexityScore: number;
  planningStrategy: string;
  riskLevel: string;
  planningTrace?: import("./advanced-planner").PlanningTrace;
  metacognitiveState?: import("./metacognition").MetacognitiveState;
  consensusUsed?: boolean;
  recoveryAttempted?: boolean;
  intentPreserved?: boolean;
  personalizationApplied?: boolean;
}
