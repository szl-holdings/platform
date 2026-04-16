export const GENAI_ATTRS = {
  SYSTEM: "gen_ai.system",
  OPERATION_NAME: "gen_ai.operation.name",
  REQUEST_MODEL: "gen_ai.request.model",
  RESPONSE_MODEL: "gen_ai.response.model",
  RESPONSE_FINISH_REASON: "gen_ai.response.finish_reasons",
  USAGE_INPUT_TOKENS: "gen_ai.usage.input_tokens",
  USAGE_OUTPUT_TOKENS: "gen_ai.usage.output_tokens",

  PROMPT_TOKENS: "gen_ai.usage.prompt_tokens",
  COMPLETION_TOKENS: "gen_ai.usage.completion_tokens",
  TOTAL_TOKENS: "gen_ai.usage.total_tokens",

  REQUEST_TEMPERATURE: "gen_ai.request.temperature",
  REQUEST_TOP_P: "gen_ai.request.top_p",
  REQUEST_MAX_TOKENS: "gen_ai.request.max_tokens",
  REQUEST_SEED: "gen_ai.request.seed",
  REQUEST_STOP_SEQUENCES: "gen_ai.request.stop_sequences",

  AGENT_ID: "gen_ai.agent.id",
  AGENT_NAME: "gen_ai.agent.name",
  AGENT_DOMAIN: "gen_ai.agent.domain",
  AGENT_STEP_INDEX: "gen_ai.agent.step_index",
  AGENT_STEP_TYPE: "gen_ai.agent.step_type",

  TOOL_CALL_ID: "gen_ai.tool.call.id",
  TOOL_NAME: "gen_ai.tool.name",
  TOOL_CALL_TYPE: "gen_ai.tool.call.type",
  TOOL_RISK_LEVEL: "gen_ai.tool.risk_level",
  TOOL_POLICY_APPLIED: "gen_ai.tool.policy_applied",
  TOOL_APPROVAL_REQUIRED: "gen_ai.tool.approval_required",

  RETRIEVAL_ENGINE: "gen_ai.retrieval.engine",
  RETRIEVAL_QUERY: "gen_ai.retrieval.query",
  RETRIEVAL_CHUNKS_RETRIEVED: "gen_ai.retrieval.chunks_retrieved",
  RETRIEVAL_CHUNKS_USED: "gen_ai.retrieval.chunks_used",
  RETRIEVAL_TOP_SCORE: "gen_ai.retrieval.top_score",

  DECISION_ID: "gen_ai.decision.id",
  DECISION_TYPE: "gen_ai.decision.type",
  APPROVAL_LEVEL: "gen_ai.approval.level",
  APPROVAL_DELAY_MS: "gen_ai.approval.delay_ms",
  APPROVAL_OUTCOME: "gen_ai.approval.outcome",

  COST_ESTIMATE_USD: "gen_ai.cost.estimate_usd",
  ROUTE_CLASS: "gen_ai.route.class",
  MODEL_PROVIDER: "gen_ai.model.provider",
  USED_FALLBACK: "gen_ai.model.used_fallback",

  TRACE_ID: "gen_ai.trace.id",
  PARENT_SPAN_ID: "gen_ai.parent_span.id",
  CORRELATION_ID: "gen_ai.correlation.id",

  TENANT_ID: "gen_ai.tenant.id",
  ORG_ID: "gen_ai.org.id",
} as const;

export type GenAIAttrKey = (typeof GENAI_ATTRS)[keyof typeof GENAI_ATTRS];

export const GENAI_OPERATION = {
  CHAT: "chat",
  TEXT_COMPLETION: "text_completion",
  EMBEDDINGS: "embeddings",
  IMAGE_GENERATION: "image_generation",
  AGENT_STEP: "agent_step",
  TOOL_CALL: "tool_call",
  RETRIEVAL: "retrieval",
  RERANKING: "reranking",
} as const;

export const GENAI_SYSTEM = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOGLE_VERTEX: "vertex_ai",
  GOOGLE_GENAI: "gemini",
  OPENROUTER: "openrouter",
  AZURE_OPENAI: "az.ai.openai",
  AWS_BEDROCK: "aws.bedrock",
  OLLAMA: "ollama",
} as const;

export const GENAI_FINISH_REASON = {
  STOP: "stop",
  LENGTH: "length",
  CONTENT_FILTER: "content_filter",
  TOOL_CALLS: "tool_calls",
  ERROR: "error",
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
  status: "ok" | "error" | "cancelled";
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
  stepType: "think" | "plan" | "tool_select" | "execute" | "summarize" | "escalate";
  inputSummary?: string;
  outputSummary?: string;
  latencyMs: number;
  status: "ok" | "error" | "pending";
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
  status: "ok" | "error" | "pending";
  riskLevel?: "low" | "medium" | "high" | "critical";
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
  status: "ok" | "error";
  correlationId?: string;
  timestamp: number;
}
