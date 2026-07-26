export const GENAI_ATTRS = {
  /**
   * @deprecated OpenTelemetry renamed this attribute to `gen_ai.provider.name`.
   * Retained so existing callers do not change their emitted telemetry silently.
   */
  SYSTEM: 'gen_ai.system',
  PROVIDER_NAME: 'gen_ai.provider.name',
  OPERATION_NAME: 'gen_ai.operation.name',
  REQUEST_MODEL: 'gen_ai.request.model',
  RESPONSE_MODEL: 'gen_ai.response.model',
  RESPONSE_FINISH_REASON: 'gen_ai.response.finish_reasons',
  USAGE_INPUT_TOKENS: 'gen_ai.usage.input_tokens',
  USAGE_OUTPUT_TOKENS: 'gen_ai.usage.output_tokens',

  PROMPT_TOKENS: 'gen_ai.usage.prompt_tokens',
  COMPLETION_TOKENS: 'gen_ai.usage.completion_tokens',
  TOTAL_TOKENS: 'gen_ai.usage.total_tokens',

  REQUEST_TEMPERATURE: 'gen_ai.request.temperature',
  REQUEST_TOP_P: 'gen_ai.request.top_p',
  REQUEST_MAX_TOKENS: 'gen_ai.request.max_tokens',
  REQUEST_SEED: 'gen_ai.request.seed',
  REQUEST_STOP_SEQUENCES: 'gen_ai.request.stop_sequences',

  AGENT_ID: 'gen_ai.agent.id',
  AGENT_NAME: 'gen_ai.agent.name',
  AGENT_DOMAIN: 'gen_ai.agent.domain',
  AGENT_STEP_INDEX: 'gen_ai.agent.step_index',
  AGENT_STEP_TYPE: 'gen_ai.agent.step_type',

  TOOL_CALL_ID: 'gen_ai.tool.call.id',
  TOOL_NAME: 'gen_ai.tool.name',
  TOOL_CALL_TYPE: 'gen_ai.tool.call.type',
  TOOL_RISK_LEVEL: 'gen_ai.tool.risk_level',
  TOOL_POLICY_APPLIED: 'gen_ai.tool.policy_applied',
  TOOL_APPROVAL_REQUIRED: 'gen_ai.tool.approval_required',

  RETRIEVAL_ENGINE: 'gen_ai.retrieval.engine',
  RETRIEVAL_QUERY: 'gen_ai.retrieval.query',
  RETRIEVAL_CHUNKS_RETRIEVED: 'gen_ai.retrieval.chunks_retrieved',
  RETRIEVAL_CHUNKS_USED: 'gen_ai.retrieval.chunks_used',
  RETRIEVAL_TOP_SCORE: 'gen_ai.retrieval.top_score',

  DECISION_ID: 'gen_ai.decision.id',
  DECISION_TYPE: 'gen_ai.decision.type',
  APPROVAL_LEVEL: 'gen_ai.approval.level',
  APPROVAL_DELAY_MS: 'gen_ai.approval.delay_ms',
  APPROVAL_OUTCOME: 'gen_ai.approval.outcome',

  COST_ESTIMATE_USD: 'gen_ai.cost.estimate_usd',
  ROUTE_CLASS: 'gen_ai.route.class',
  MODEL_PROVIDER: 'gen_ai.model.provider',
  USED_FALLBACK: 'gen_ai.model.used_fallback',

  TRACE_ID: 'gen_ai.trace.id',
  PARENT_SPAN_ID: 'gen_ai.parent_span.id',
  CORRELATION_ID: 'gen_ai.correlation.id',

  TENANT_ID: 'gen_ai.tenant.id',
  ORG_ID: 'gen_ai.org.id',
} as const;

export type GenAIAttrKey = (typeof GENAI_ATTRS)[keyof typeof GENAI_ATTRS];

export const GENAI_OPERATION = {
  CHAT: 'chat',
  GENERATE_CONTENT: 'generate_content',
  TEXT_COMPLETION: 'text_completion',
  EMBEDDINGS: 'embeddings',
  IMAGE_GENERATION: 'image_generation',
  CREATE_AGENT: 'create_agent',
  INVOKE_AGENT: 'invoke_agent',
  EXECUTE_TOOL: 'execute_tool',
  INVOKE_WORKFLOW: 'invoke_workflow',
  PLAN: 'plan',
  AGENT_STEP: 'agent_step',
  TOOL_CALL: 'tool_call',
  RETRIEVAL: 'retrieval',
  RERANKING: 'reranking',
} as const;

export const GENAI_SYSTEM = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE_VERTEX: 'vertex_ai',
  GOOGLE_GENAI: 'gemini',
  OPENROUTER: 'openrouter',
  AZURE_OPENAI: 'az.ai.openai',
  AWS_BEDROCK: 'aws.bedrock',
  OLLAMA: 'ollama',
} as const;

export * from './semconv.js';

export const GENAI_FINISH_REASON = {
  STOP: 'stop',
  LENGTH: 'length',
  CONTENT_FILTER: 'content_filter',
  TOOL_CALLS: 'tool_calls',
  ERROR: 'error',
} as const;

export interface GenAIModelCallContract {
  traceId: string;
  spanId?: string;
  parentSpanId?: string;
  system: (typeof GENAI_SYSTEM)[keyof typeof GENAI_SYSTEM] | string;
  operationName: (typeof GENAI_OPERATION)[keyof typeof GENAI_OPERATION];
  requestModel: string;
  responseModel?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimateUsd?: number;
  latencyMs: number;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  finishReasons?: string[];
  usedFallback?: boolean;
  status: 'ok' | 'error' | 'cancelled';
  errorCode?: string;
  errorMessage?: string;
  correlationId?: string;
  tenantId?: string;
  orgId?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface GenAIAgentStepContract {
  traceId: string;
  spanId?: string;
  parentSpanId?: string;
  agentId: string;
  agentName?: string;
  agentDomain: string;
  stepIndex: number;
  stepType: 'think' | 'plan' | 'tool_select' | 'execute' | 'summarize' | 'escalate';
  inputSummary?: string;
  outputSummary?: string;
  latencyMs: number;
  status: 'ok' | 'error' | 'pending';
  errorMessage?: string;
  correlationId?: string;
  timestamp: number;
}

export interface GenAIToolCallContract {
  traceId: string;
  spanId?: string;
  parentSpanId?: string;
  toolCallId?: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  latencyMs: number;
  status: 'ok' | 'error' | 'pending';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  policyApplied?: string;
  approvalRequired?: boolean;
  errorMessage?: string;
  correlationId?: string;
  timestamp: number;
}

export interface GenAIPromptTraceContract {
  traceId: string;
  promptId?: string;
  promptVersion?: string;
  template?: string;
  variables?: Record<string, unknown>;
  renderedInput?: string;
  tokenCount?: number;
  timestamp: number;
}

export interface GenAIRetrievalContract {
  traceId: string;
  spanId?: string;
  query: string;
  engine: string;
  chunksRetrieved: number;
  chunksUsed: number;
  topScore?: number;
  latencyMs: number;
  status: 'ok' | 'error';
  correlationId?: string;
  timestamp: number;
}

export const AGENT_RUN_ATTRS = {
  RUN_ID: 'agent.run.id',
  RUN_OBJECTIVE: 'agent.run.objective',
  RUN_OUTCOME: 'agent.run.outcome',
  RUN_AUTONOMY_MODE: 'agent.run.autonomy_mode',
  RUN_LATENCY_MS: 'agent.run.latency_ms',
  RUN_COST_USD: 'agent.run.cost_usd',
  RUN_TOTAL_TOKENS: 'agent.run.total_tokens',
  RUN_TOOL_CALL_COUNT: 'agent.run.tool_call_count',
  RUN_EVIDENCE_COUNT: 'agent.run.evidence_count',
  RUN_POLICY_GATE_COUNT: 'agent.run.policy_gate_count',
  RUN_APPROVAL_COUNT: 'agent.run.approval_count',
  RUN_RETRY_COUNT: 'agent.run.retry_count',
  RUN_HAS_FAILURE: 'agent.run.has_failure',
  RUN_FAILURE_POINT: 'agent.run.failure_point',
  RUN_HUMAN_HANDOFF: 'agent.run.human_handoff',
  RUN_DOMAIN: 'agent.run.domain',
  RUN_USER_ID: 'agent.run.user_id',
  RUN_SESSION_ID: 'agent.run.session_id',

  POLICY_GATE_ID: 'agent.policy_gate.id',
  POLICY_GATE_DECISION: 'agent.policy_gate.decision',
  POLICY_GATE_REASON: 'agent.policy_gate.reason',
  POLICY_GATE_TIER: 'agent.policy_gate.tier',

  EVIDENCE_ID: 'agent.evidence.id',
  EVIDENCE_SOURCE: 'agent.evidence.source',
  EVIDENCE_KIND: 'agent.evidence.kind',
  EVIDENCE_CONFIDENCE: 'agent.evidence.confidence',
  EVIDENCE_ENTITY_ID: 'agent.evidence.entity_id',

  HANDOFF_TYPE: 'agent.handoff.type',
  HANDOFF_TO: 'agent.handoff.to',
  HANDOFF_REASON: 'agent.handoff.reason',

  EVAL_SUITE_ID: 'agent.eval.suite_id',
  EVAL_RUN_ID: 'agent.eval.run_id',
  EVAL_PASS_RATE: 'agent.eval.pass_rate',
  EVAL_AVG_SCORE: 'agent.eval.avg_score',
  EVAL_HAS_REGRESSION: 'agent.eval.has_regression',
  EVAL_VARIANT_MODEL: 'agent.eval.variant_model',
  EVAL_VARIANT_STRATEGY: 'agent.eval.variant_strategy',
  EVAL_VARIANT_PROMPT: 'agent.eval.variant_prompt',

  PAGE_LOAD_PATH: 'app.page_load.path',
  PAGE_LOAD_LATENCY_MS: 'app.page_load.latency_ms',
  API_CALL_PATH: 'app.api_call.path',
  API_CALL_METHOD: 'app.api_call.method',
  API_CALL_STATUS: 'app.api_call.status',
  API_CALL_LATENCY_MS: 'app.api_call.latency_ms',
  CACHE_HIT: 'app.cache.hit',
  CACHE_KEY: 'app.cache.key',
} as const;

export type AgentRunAttrKey = (typeof AGENT_RUN_ATTRS)[keyof typeof AGENT_RUN_ATTRS];

export interface AgentRunContract {
  traceId: string;
  spanId?: string;
  runId: string;
  agentId: string;
  agentName?: string;
  domain: string;
  userId?: string;
  sessionId?: string;
  objective: string;
  autonomyMode: 'autonomous' | 'supervised' | 'advisory' | 'read-only';
  outcome: 'success' | 'partial' | 'blocked' | 'failed';
  latencyMs: number;
  costUsd?: number;
  totalTokens?: number;
  toolCallCount?: number;
  evidenceCount?: number;
  policyGateCount?: number;
  approvalCount?: number;
  retryCount?: number;
  hasFailure?: boolean;
  failurePoint?: string;
  humanHandoff?: boolean;
  correlationId?: string;
  timestamp: number;
}

export interface AgentEvalRunContract {
  traceId?: string;
  spanId?: string;
  evalSuiteId: string;
  evalRunId: string;
  domain?: string;
  passRate: number;
  avgScore: number;
  totalCases: number;
  passed: number;
  failed: number;
  hasRegression: boolean;
  regressionSeverity: 'none' | 'minor' | 'major' | 'critical';
  triggeredBy?: string;
  avgLatencyMs?: number;
  totalCostUsd?: number;
  variantModel?: string;
  variantStrategy?: string;
  variantPrompt?: string;
  timestamp: number;
}

export interface AgentEvidenceAccessContract {
  traceId: string;
  spanId?: string;
  runId: string;
  evidenceId: string;
  source: string;
  kind: 'raw' | 'normalized' | 'derived';
  entityId?: string;
  confidence?: number;
  accessType: 'read' | 'write';
  latencyMs?: number;
  cacheHit?: boolean;
  timestamp: number;
}

export interface AgentPolicyGateContract {
  traceId: string;
  spanId?: string;
  runId: string;
  policyId: string;
  decision: 'allow' | 'block' | 'escalate' | 'require_approval';
  tier?: string;
  reason?: string;
  latencyMs?: number;
  timestamp: number;
}

export interface AgentHandoffContract {
  traceId: string;
  spanId?: string;
  runId: string;
  handoffType: 'human' | 'agent' | 'queue';
  handoffTo: string;
  reason?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}
