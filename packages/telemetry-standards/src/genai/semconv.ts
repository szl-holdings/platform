/**
 * OpenTelemetry GenAI semantic-convention compatibility layer.
 *
 * The upstream conventions are Development status and may change. Keep the
 * source commit pinned in this file and update the tests and migration table
 * together whenever the upstream model is refreshed.
 */

export const OTEL_GENAI_SEMCONV = {
  status: 'development',
  sourceRepository: 'https://github.com/open-telemetry/semantic-conventions-genai',
  sourceCommit: '64cfaa612a1af8472b2f063374fbe3c9e6cea2ab',
  verifiedAt: '2026-07-25',
} as const;

export const OTEL_GENAI_ATTRS = {
  PROVIDER_NAME: 'gen_ai.provider.name',
  OPERATION_NAME: 'gen_ai.operation.name',
  REQUEST_MODEL: 'gen_ai.request.model',
  RESPONSE_ID: 'gen_ai.response.id',
  RESPONSE_MODEL: 'gen_ai.response.model',
  RESPONSE_FINISH_REASONS: 'gen_ai.response.finish_reasons',
  REQUEST_MAX_TOKENS: 'gen_ai.request.max_tokens',
  REQUEST_TEMPERATURE: 'gen_ai.request.temperature',
  REQUEST_TOP_P: 'gen_ai.request.top_p',
  REQUEST_STREAM: 'gen_ai.request.stream',
  RESPONSE_TIME_TO_FIRST_CHUNK: 'gen_ai.response.time_to_first_chunk',
  USAGE_INPUT_TOKENS: 'gen_ai.usage.input_tokens',
  USAGE_OUTPUT_TOKENS: 'gen_ai.usage.output_tokens',
  USAGE_REASONING_OUTPUT_TOKENS: 'gen_ai.usage.reasoning.output_tokens',
  AGENT_ID: 'gen_ai.agent.id',
  AGENT_NAME: 'gen_ai.agent.name',
  AGENT_VERSION: 'gen_ai.agent.version',
  CONVERSATION_ID: 'gen_ai.conversation.id',
  TOOL_NAME: 'gen_ai.tool.name',
  TOOL_TYPE: 'gen_ai.tool.type',
  TOOL_CALL_ID: 'gen_ai.tool.call.id',
  TOOL_CALL_ARGUMENTS: 'gen_ai.tool.call.arguments',
  TOOL_CALL_RESULT: 'gen_ai.tool.call.result',
  DATA_SOURCE_ID: 'gen_ai.data_source.id',
  RETRIEVAL_QUERY_TEXT: 'gen_ai.retrieval.query.text',
  ERROR_TYPE: 'error.type',
  SERVER_ADDRESS: 'server.address',
  SERVER_PORT: 'server.port',
} as const;

export const OTEL_MCP_ATTRS = {
  METHOD_NAME: 'mcp.method.name',
  SESSION_ID: 'mcp.session.id',
  RESOURCE_URI: 'mcp.resource.uri',
  PROTOCOL_VERSION: 'mcp.protocol.version',
  JSONRPC_REQUEST_ID: 'jsonrpc.request.id',
  CLIENT_ADDRESS: 'client.address',
  CLIENT_PORT: 'client.port',
  SERVER_ADDRESS: 'server.address',
  SERVER_PORT: 'server.port',
  ERROR_TYPE: 'error.type',
} as const;

export const OTEL_GENAI_PROVIDER = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  COHERE: 'cohere',
  GCP_GENAI: 'gcp.gen_ai',
  GCP_VERTEX_AI: 'gcp.vertex_ai',
  GCP_GEMINI: 'gcp.gemini',
  AZURE_AI_INFERENCE: 'azure.ai.inference',
  AZURE_OPENAI: 'azure.ai.openai',
  AWS_BEDROCK: 'aws.bedrock',
  IBM_WATSONX_AI: 'ibm.watsonx.ai',
  PERPLEXITY: 'perplexity',
  X_AI: 'x_ai',
  DEEPSEEK: 'deepseek',
  GROQ: 'groq',
  MISTRAL_AI: 'mistral_ai',
  MOONSHOT_AI: 'moonshot_ai',
} as const;

export const OTEL_GENAI_OPERATION = {
  CHAT: 'chat',
  GENERATE_CONTENT: 'generate_content',
  TEXT_COMPLETION: 'text_completion',
  EMBEDDINGS: 'embeddings',
  RETRIEVAL: 'retrieval',
  CREATE_AGENT: 'create_agent',
  INVOKE_AGENT: 'invoke_agent',
  EXECUTE_TOOL: 'execute_tool',
  INVOKE_WORKFLOW: 'invoke_workflow',
  PLAN: 'plan',
  SEARCH_MEMORY: 'search_memory',
  CREATE_MEMORY: 'create_memory',
  UPDATE_MEMORY: 'update_memory',
  UPSERT_MEMORY: 'upsert_memory',
  DELETE_MEMORY: 'delete_memory',
  CREATE_MEMORY_STORE: 'create_memory_store',
  DELETE_MEMORY_STORE: 'delete_memory_store',
} as const;

export const OTEL_GENAI_SPAN_TYPES = {
  INFERENCE_CLIENT: 'gen_ai.inference.client',
  EMBEDDINGS_CLIENT: 'gen_ai.embeddings.client',
  RETRIEVAL_CLIENT: 'gen_ai.retrieval.client',
  CREATE_AGENT_CLIENT: 'gen_ai.create_agent.client',
  INVOKE_AGENT_CLIENT: 'gen_ai.invoke_agent.client',
  INVOKE_AGENT_INTERNAL: 'gen_ai.invoke_agent.internal',
  EXECUTE_TOOL_INTERNAL: 'gen_ai.execute_tool.internal',
  INVOKE_WORKFLOW_INTERNAL: 'gen_ai.invoke_workflow.internal',
} as const;

export const OTEL_MCP_SPAN_TYPES = {
  CLIENT: 'mcp.client',
  SERVER: 'mcp.server',
} as const;

export const OTEL_GENAI_EVENTS = {
  INFERENCE_OPERATION_DETAILS: 'gen_ai.client.inference.operation.details',
  EVALUATION_RESULT: 'gen_ai.evaluation.result',
  CLIENT_OPERATION_EXCEPTION: 'gen_ai.client.operation.exception',
} as const;

export const OTEL_GENAI_METRICS = {
  CLIENT_TOKEN_USAGE: 'gen_ai.client.token.usage',
  CLIENT_OPERATION_DURATION: 'gen_ai.client.operation.duration',
  CLIENT_TIME_TO_FIRST_CHUNK: 'gen_ai.client.operation.time_to_first_chunk',
  CLIENT_TIME_PER_OUTPUT_CHUNK: 'gen_ai.client.operation.time_per_output_chunk',
  SERVER_REQUEST_DURATION: 'gen_ai.server.request.duration',
  SERVER_TIME_PER_OUTPUT_TOKEN: 'gen_ai.server.time_per_output_token',
  SERVER_TIME_TO_FIRST_TOKEN: 'gen_ai.server.time_to_first_token',
  WORKFLOW_DURATION: 'gen_ai.workflow.duration',
  INVOKE_AGENT_DURATION: 'gen_ai.invoke_agent.duration',
  INVOKE_AGENT_INFERENCE_CALLS: 'gen_ai.invoke_agent.inference_calls',
  INVOKE_AGENT_TOOL_CALLS: 'gen_ai.invoke_agent.tool_calls',
  EXECUTE_TOOL_DURATION: 'gen_ai.execute_tool.duration',
} as const;

export const OTEL_MCP_METRICS = {
  CLIENT_OPERATION_DURATION: 'mcp.client.operation.duration',
  SERVER_OPERATION_DURATION: 'mcp.server.operation.duration',
  CLIENT_SESSION_DURATION: 'mcp.client.session.duration',
  SERVER_SESSION_DURATION: 'mcp.server.session.duration',
} as const;

export type OtelAttributeValue =
  | string
  | number
  | boolean
  | readonly string[]
  | readonly number[]
  | readonly boolean[];

export interface OtelSemconvSpan {
  semanticType: string;
  name: string;
  kind: 'CLIENT' | 'INTERNAL' | 'SERVER';
  stability: typeof OTEL_GENAI_SEMCONV.status;
  attributes: Record<string, OtelAttributeValue>;
}

export interface GenAIInferenceSpanInput {
  providerName: string;
  operationName: string;
  requestModel: string;
  responseId?: string;
  responseModel?: string;
  finishReasons?: readonly string[];
  inputTokens?: number;
  outputTokens?: number;
  reasoningOutputTokens?: number;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  streaming?: boolean;
  timeToFirstChunkSeconds?: number;
  conversationId?: string;
  serverAddress?: string;
  serverPort?: number;
  errorType?: string;
}

export interface GenAIAgentSpanInput {
  providerName: string;
  agentName?: string;
  agentId?: string;
  agentVersion?: string;
  requestModel?: string;
  conversationId?: string;
  kind?: 'CLIENT' | 'INTERNAL';
  errorType?: string;
}

export interface GenAIToolSpanInput {
  toolName: string;
  toolType?: string;
  toolCallId?: string;
  agentName?: string;
  errorType?: string;
  captureContent?: boolean;
  toolArguments?: string;
  toolResult?: string;
}

export interface McpSpanInput {
  role: 'client' | 'server';
  methodName: string;
  protocolVersion?: string;
  sessionId?: string;
  jsonrpcRequestId?: string | number;
  target?: string;
  resourceUri?: string;
  peerAddress?: string;
  peerPort?: number;
  errorType?: string;
  captureContent?: boolean;
  toolArguments?: string;
  toolResult?: string;
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return normalized;
}

function optionalText(value: string | undefined, field: string): string | undefined {
  return value === undefined ? undefined : requireText(value, field);
}

function optionalNonNegative(value: number | undefined, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${field} must be a finite, non-negative number`);
  }
  return value;
}

function definedAttributes(
  entries: ReadonlyArray<readonly [string, OtelAttributeValue | undefined]>,
): Record<string, OtelAttributeValue> {
  return Object.fromEntries(entries.filter((entry) => entry[1] !== undefined)) as Record<
    string,
    OtelAttributeValue
  >;
}

export function createGenAIInferenceClientSpan(input: GenAIInferenceSpanInput): OtelSemconvSpan {
  const providerName = requireText(input.providerName, 'providerName');
  const operationName = requireText(input.operationName, 'operationName');
  const requestModel = requireText(input.requestModel, 'requestModel');

  return {
    semanticType: OTEL_GENAI_SPAN_TYPES.INFERENCE_CLIENT,
    name: `${operationName} ${requestModel}`,
    kind: 'CLIENT',
    stability: OTEL_GENAI_SEMCONV.status,
    attributes: definedAttributes([
      [OTEL_GENAI_ATTRS.PROVIDER_NAME, providerName],
      [OTEL_GENAI_ATTRS.OPERATION_NAME, operationName],
      [OTEL_GENAI_ATTRS.REQUEST_MODEL, requestModel],
      [OTEL_GENAI_ATTRS.RESPONSE_ID, optionalText(input.responseId, 'responseId')],
      [OTEL_GENAI_ATTRS.RESPONSE_MODEL, optionalText(input.responseModel, 'responseModel')],
      [OTEL_GENAI_ATTRS.RESPONSE_FINISH_REASONS, input.finishReasons],
      [OTEL_GENAI_ATTRS.USAGE_INPUT_TOKENS, optionalNonNegative(input.inputTokens, 'inputTokens')],
      [
        OTEL_GENAI_ATTRS.USAGE_OUTPUT_TOKENS,
        optionalNonNegative(input.outputTokens, 'outputTokens'),
      ],
      [
        OTEL_GENAI_ATTRS.USAGE_REASONING_OUTPUT_TOKENS,
        optionalNonNegative(input.reasoningOutputTokens, 'reasoningOutputTokens'),
      ],
      [OTEL_GENAI_ATTRS.REQUEST_TEMPERATURE, input.temperature],
      [OTEL_GENAI_ATTRS.REQUEST_TOP_P, input.topP],
      [OTEL_GENAI_ATTRS.REQUEST_MAX_TOKENS, optionalNonNegative(input.maxTokens, 'maxTokens')],
      [OTEL_GENAI_ATTRS.REQUEST_STREAM, input.streaming],
      [
        OTEL_GENAI_ATTRS.RESPONSE_TIME_TO_FIRST_CHUNK,
        optionalNonNegative(input.timeToFirstChunkSeconds, 'timeToFirstChunkSeconds'),
      ],
      [OTEL_GENAI_ATTRS.CONVERSATION_ID, optionalText(input.conversationId, 'conversationId')],
      [OTEL_GENAI_ATTRS.SERVER_ADDRESS, optionalText(input.serverAddress, 'serverAddress')],
      [OTEL_GENAI_ATTRS.SERVER_PORT, optionalNonNegative(input.serverPort, 'serverPort')],
      [OTEL_GENAI_ATTRS.ERROR_TYPE, optionalText(input.errorType, 'errorType')],
    ]),
  };
}

export function createGenAIAgentSpan(input: GenAIAgentSpanInput): OtelSemconvSpan {
  const kind = input.kind ?? 'INTERNAL';
  const agentName = optionalText(input.agentName, 'agentName');

  return {
    semanticType:
      kind === 'CLIENT'
        ? OTEL_GENAI_SPAN_TYPES.INVOKE_AGENT_CLIENT
        : OTEL_GENAI_SPAN_TYPES.INVOKE_AGENT_INTERNAL,
    name: agentName ? `invoke_agent ${agentName}` : 'invoke_agent',
    kind,
    stability: OTEL_GENAI_SEMCONV.status,
    attributes: definedAttributes([
      [OTEL_GENAI_ATTRS.PROVIDER_NAME, requireText(input.providerName, 'providerName')],
      [OTEL_GENAI_ATTRS.OPERATION_NAME, OTEL_GENAI_OPERATION.INVOKE_AGENT],
      [OTEL_GENAI_ATTRS.AGENT_NAME, agentName],
      [OTEL_GENAI_ATTRS.AGENT_ID, optionalText(input.agentId, 'agentId')],
      [OTEL_GENAI_ATTRS.AGENT_VERSION, optionalText(input.agentVersion, 'agentVersion')],
      [OTEL_GENAI_ATTRS.REQUEST_MODEL, optionalText(input.requestModel, 'requestModel')],
      [OTEL_GENAI_ATTRS.CONVERSATION_ID, optionalText(input.conversationId, 'conversationId')],
      [OTEL_GENAI_ATTRS.ERROR_TYPE, optionalText(input.errorType, 'errorType')],
    ]),
  };
}

export function createGenAIToolSpan(input: GenAIToolSpanInput): OtelSemconvSpan {
  const toolName = requireText(input.toolName, 'toolName');
  const captureContent = input.captureContent === true;

  return {
    semanticType: OTEL_GENAI_SPAN_TYPES.EXECUTE_TOOL_INTERNAL,
    name: `execute_tool ${toolName}`,
    kind: 'INTERNAL',
    stability: OTEL_GENAI_SEMCONV.status,
    attributes: definedAttributes([
      [OTEL_GENAI_ATTRS.OPERATION_NAME, OTEL_GENAI_OPERATION.EXECUTE_TOOL],
      [OTEL_GENAI_ATTRS.TOOL_NAME, toolName],
      [OTEL_GENAI_ATTRS.TOOL_TYPE, optionalText(input.toolType, 'toolType')],
      [OTEL_GENAI_ATTRS.TOOL_CALL_ID, optionalText(input.toolCallId, 'toolCallId')],
      [OTEL_GENAI_ATTRS.AGENT_NAME, optionalText(input.agentName, 'agentName')],
      [OTEL_GENAI_ATTRS.ERROR_TYPE, optionalText(input.errorType, 'errorType')],
      [
        OTEL_GENAI_ATTRS.TOOL_CALL_ARGUMENTS,
        captureContent ? optionalText(input.toolArguments, 'toolArguments') : undefined,
      ],
      [
        OTEL_GENAI_ATTRS.TOOL_CALL_RESULT,
        captureContent ? optionalText(input.toolResult, 'toolResult') : undefined,
      ],
    ]),
  };
}

export function createMcpSpan(input: McpSpanInput): OtelSemconvSpan {
  const methodName = requireText(input.methodName, 'methodName');
  const target = optionalText(input.target, 'target');
  const isClient = input.role === 'client';
  const captureContent = input.captureContent === true;

  return {
    semanticType: isClient ? OTEL_MCP_SPAN_TYPES.CLIENT : OTEL_MCP_SPAN_TYPES.SERVER,
    name: target ? `${methodName} ${target}` : methodName,
    kind: isClient ? 'CLIENT' : 'SERVER',
    stability: OTEL_GENAI_SEMCONV.status,
    attributes: definedAttributes([
      [OTEL_MCP_ATTRS.METHOD_NAME, methodName],
      [OTEL_MCP_ATTRS.PROTOCOL_VERSION, optionalText(input.protocolVersion, 'protocolVersion')],
      [OTEL_MCP_ATTRS.SESSION_ID, optionalText(input.sessionId, 'sessionId')],
      [
        OTEL_MCP_ATTRS.JSONRPC_REQUEST_ID,
        typeof input.jsonrpcRequestId === 'string'
          ? optionalText(input.jsonrpcRequestId, 'jsonrpcRequestId')
          : input.jsonrpcRequestId,
      ],
      [OTEL_MCP_ATTRS.RESOURCE_URI, optionalText(input.resourceUri, 'resourceUri')],
      [
        isClient ? OTEL_MCP_ATTRS.SERVER_ADDRESS : OTEL_MCP_ATTRS.CLIENT_ADDRESS,
        optionalText(input.peerAddress, 'peerAddress'),
      ],
      [
        isClient ? OTEL_MCP_ATTRS.SERVER_PORT : OTEL_MCP_ATTRS.CLIENT_PORT,
        optionalNonNegative(input.peerPort, 'peerPort'),
      ],
      [OTEL_MCP_ATTRS.ERROR_TYPE, optionalText(input.errorType, 'errorType')],
      [
        OTEL_GENAI_ATTRS.TOOL_CALL_ARGUMENTS,
        captureContent ? optionalText(input.toolArguments, 'toolArguments') : undefined,
      ],
      [
        OTEL_GENAI_ATTRS.TOOL_CALL_RESULT,
        captureContent ? optionalText(input.toolResult, 'toolResult') : undefined,
      ],
    ]),
  };
}
