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
  coreSemanticConventionsVersion: '1.43.0',
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
  PROMPT_NAME: 'gen_ai.prompt.name',
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
  RPC_RESPONSE_STATUS_CODE: 'rpc.response.status_code',
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

export interface GenAIAgentInternalSpanInput {
  kind?: 'INTERNAL';
  agentName?: string;
  requestModel?: string;
  conversationId?: string;
  errorType?: string;
}

export interface GenAIAgentClientSpanInput {
  kind: 'CLIENT';
  providerName: string;
  agentName?: string;
  agentId?: string;
  agentVersion?: string;
  requestModel?: string;
  conversationId?: string;
  serverAddress?: string;
  serverPort?: number;
  errorType?: string;
}

export type GenAIAgentSpanInput = GenAIAgentInternalSpanInput | GenAIAgentClientSpanInput;

export interface GenAIContentCapturePolicy {
  enabled: true;
  maxBytes: number;
  redactKeys?: readonly string[];
}

export interface GenAIToolSpanInput {
  toolName: string;
  toolType?: string;
  toolCallId?: string;
  agentName?: string;
  errorType?: string;
  toolArguments?: string;
  toolResult?: string;
  contentCapturePolicy?: GenAIContentCapturePolicy;
}

export interface McpSpanInput {
  role: 'client' | 'server';
  methodName: string;
  protocolVersion?: string;
  sessionId?: string;
  jsonrpcRequestId?: string;
  notification?: boolean;
  toolName?: string;
  promptName?: string;
  resourceUri?: string;
  clientAddress?: string;
  clientPort?: number;
  serverAddress?: string;
  serverPort?: number;
  responseStatusCode?: string;
  errorType?: string;
  toolArguments?: string;
  toolResult?: string;
  contentCapturePolicy?: GenAIContentCapturePolicy;
}

function requireText(value: string, field: string): string {
  if (typeof value !== 'string') {
    throw new TypeError(`${field} must be a string`);
  }
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

function optionalInteger(value: number | undefined, field: string): number | undefined {
  const normalized = optionalNonNegative(value, field);
  if (normalized !== undefined && !Number.isInteger(normalized)) {
    throw new RangeError(`${field} must be an integer`);
  }
  return normalized;
}

function optionalFinite(value: number | undefined, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) {
    throw new RangeError(`${field} must be finite`);
  }
  return value;
}

function optionalPort(
  address: string | undefined,
  port: number | undefined,
  addressField: string,
  portField: string,
): readonly [string | undefined, number | undefined] {
  const normalizedAddress = optionalText(address, addressField);
  const normalizedPort = optionalInteger(port, portField);
  if (normalizedPort !== undefined && normalizedAddress === undefined) {
    throw new TypeError(`${addressField} is required when ${portField} is set`);
  }
  if (normalizedPort !== undefined && (normalizedPort < 1 || normalizedPort > 65_535)) {
    throw new RangeError(`${portField} must be between 1 and 65535`);
  }
  return [normalizedAddress, normalizedPort];
}

const DEFAULT_REDACTED_KEYS = [
  'authorization',
  'api_key',
  'apikey',
  'token',
  'secret',
  'password',
] as const;

function redactJson(value: unknown, redactedKeys: ReadonlySet<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactJson(entry, redactedKeys));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [
          key,
          redactedKeys.has(key.toLowerCase()) ? '[REDACTED]' : redactJson(entry, redactedKeys),
        ]),
    );
  }
  return value;
}

function capturedJsonObject(
  value: string | undefined,
  field: string,
  policy: GenAIContentCapturePolicy | undefined,
): string | undefined {
  if (value === undefined || policy === undefined) return undefined;
  if (policy.enabled !== true) {
    throw new TypeError('contentCapturePolicy.enabled must be true');
  }
  if (!Number.isInteger(policy.maxBytes) || policy.maxBytes < 1 || policy.maxBytes > 16_384) {
    throw new RangeError('contentCapturePolicy.maxBytes must be an integer between 1 and 16384');
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(value);
  } catch {
    throw new TypeError(`${field} must be valid JSON`);
  }
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
    throw new TypeError(`${field} must encode a JSON object`);
  }

  const keys = new Set(
    [...DEFAULT_REDACTED_KEYS, ...(policy.redactKeys ?? [])].map((key) => key.toLowerCase()),
  );
  const normalized = JSON.stringify(redactJson(decoded, keys));
  if (new TextEncoder().encode(normalized).byteLength > policy.maxBytes) {
    throw new RangeError(`${field} exceeds contentCapturePolicy.maxBytes`);
  }
  return normalized;
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
  const outputTokens = optionalInteger(input.outputTokens, 'outputTokens');
  const reasoningOutputTokens = optionalInteger(
    input.reasoningOutputTokens,
    'reasoningOutputTokens',
  );
  if (
    outputTokens !== undefined &&
    reasoningOutputTokens !== undefined &&
    reasoningOutputTokens > outputTokens
  ) {
    throw new RangeError('reasoningOutputTokens must not exceed outputTokens');
  }
  const [serverAddress, serverPort] = optionalPort(
    input.serverAddress,
    input.serverPort,
    'serverAddress',
    'serverPort',
  );

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
      [OTEL_GENAI_ATTRS.USAGE_INPUT_TOKENS, optionalInteger(input.inputTokens, 'inputTokens')],
      [OTEL_GENAI_ATTRS.USAGE_OUTPUT_TOKENS, outputTokens],
      [OTEL_GENAI_ATTRS.USAGE_REASONING_OUTPUT_TOKENS, reasoningOutputTokens],
      [OTEL_GENAI_ATTRS.REQUEST_TEMPERATURE, optionalFinite(input.temperature, 'temperature')],
      [OTEL_GENAI_ATTRS.REQUEST_TOP_P, optionalFinite(input.topP, 'topP')],
      [OTEL_GENAI_ATTRS.REQUEST_MAX_TOKENS, optionalInteger(input.maxTokens, 'maxTokens')],
      [OTEL_GENAI_ATTRS.REQUEST_STREAM, input.streaming],
      [
        OTEL_GENAI_ATTRS.RESPONSE_TIME_TO_FIRST_CHUNK,
        optionalNonNegative(input.timeToFirstChunkSeconds, 'timeToFirstChunkSeconds'),
      ],
      [OTEL_GENAI_ATTRS.CONVERSATION_ID, optionalText(input.conversationId, 'conversationId')],
      [OTEL_GENAI_ATTRS.SERVER_ADDRESS, serverAddress],
      [OTEL_GENAI_ATTRS.SERVER_PORT, serverPort],
      [OTEL_GENAI_ATTRS.ERROR_TYPE, optionalText(input.errorType, 'errorType')],
    ]),
  };
}

export function createGenAIAgentSpan(input: GenAIAgentSpanInput): OtelSemconvSpan {
  const kind = input.kind ?? 'INTERNAL';
  const agentName = optionalText(input.agentName, 'agentName');
  const clientInput = kind === 'CLIENT' ? (input as GenAIAgentClientSpanInput) : undefined;
  const [serverAddress, serverPort] = optionalPort(
    clientInput?.serverAddress,
    clientInput?.serverPort,
    'serverAddress',
    'serverPort',
  );

  return {
    semanticType:
      kind === 'CLIENT'
        ? OTEL_GENAI_SPAN_TYPES.INVOKE_AGENT_CLIENT
        : OTEL_GENAI_SPAN_TYPES.INVOKE_AGENT_INTERNAL,
    name: agentName ? `invoke_agent ${agentName}` : 'invoke_agent',
    kind,
    stability: OTEL_GENAI_SEMCONV.status,
    attributes: definedAttributes([
      [
        OTEL_GENAI_ATTRS.PROVIDER_NAME,
        clientInput ? requireText(clientInput.providerName, 'providerName') : undefined,
      ],
      [OTEL_GENAI_ATTRS.OPERATION_NAME, OTEL_GENAI_OPERATION.INVOKE_AGENT],
      [OTEL_GENAI_ATTRS.AGENT_NAME, agentName],
      [OTEL_GENAI_ATTRS.AGENT_ID, optionalText(clientInput?.agentId, 'agentId')],
      [OTEL_GENAI_ATTRS.AGENT_VERSION, optionalText(clientInput?.agentVersion, 'agentVersion')],
      [OTEL_GENAI_ATTRS.REQUEST_MODEL, optionalText(input.requestModel, 'requestModel')],
      [OTEL_GENAI_ATTRS.CONVERSATION_ID, optionalText(input.conversationId, 'conversationId')],
      [OTEL_GENAI_ATTRS.SERVER_ADDRESS, serverAddress],
      [OTEL_GENAI_ATTRS.SERVER_PORT, serverPort],
      [OTEL_GENAI_ATTRS.ERROR_TYPE, optionalText(input.errorType, 'errorType')],
    ]),
  };
}

export function createGenAIToolSpan(input: GenAIToolSpanInput): OtelSemconvSpan {
  const toolName = requireText(input.toolName, 'toolName');
  const errorType = optionalText(input.errorType, 'errorType');

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
      [OTEL_GENAI_ATTRS.ERROR_TYPE, errorType],
      [
        OTEL_GENAI_ATTRS.TOOL_CALL_ARGUMENTS,
        capturedJsonObject(input.toolArguments, 'toolArguments', input.contentCapturePolicy),
      ],
      [
        OTEL_GENAI_ATTRS.TOOL_CALL_RESULT,
        errorType
          ? undefined
          : capturedJsonObject(input.toolResult, 'toolResult', input.contentCapturePolicy),
      ],
    ]),
  };
}

export function createMcpSpan(input: McpSpanInput): OtelSemconvSpan {
  if (input.role !== 'client' && input.role !== 'server') {
    throw new TypeError('role must be client or server');
  }
  const methodName = requireText(input.methodName, 'methodName');
  const isClient = input.role === 'client';
  const notification = input.notification === true;
  const requestId = optionalText(input.jsonrpcRequestId, 'jsonrpcRequestId');
  if (notification && requestId !== undefined) {
    throw new TypeError('jsonrpcRequestId must be omitted for a notification');
  }
  if (!notification && requestId === undefined) {
    throw new TypeError('jsonrpcRequestId is required for a request');
  }

  const toolName = optionalText(input.toolName, 'toolName');
  const promptName = optionalText(input.promptName, 'promptName');
  if (methodName === 'tools/call' && toolName === undefined) {
    throw new TypeError('toolName is required for tools/call');
  }
  if (methodName === 'prompts/get' && promptName === undefined) {
    throw new TypeError('promptName is required for prompts/get');
  }
  const target =
    methodName === 'tools/call' ? toolName : methodName === 'prompts/get' ? promptName : undefined;
  const [serverAddress, serverPort] = optionalPort(
    input.serverAddress,
    input.serverPort,
    'serverAddress',
    'serverPort',
  );
  const [clientAddress, clientPort] = optionalPort(
    input.clientAddress,
    input.clientPort,
    'clientAddress',
    'clientPort',
  );
  if (isClient && (clientAddress !== undefined || clientPort !== undefined)) {
    throw new TypeError('clientAddress/clientPort apply only to server spans');
  }
  if (!isClient && (serverAddress !== undefined || serverPort !== undefined)) {
    throw new TypeError('serverAddress/serverPort apply only to client spans');
  }
  const errorType = optionalText(input.errorType, 'errorType');

  return {
    semanticType: isClient ? OTEL_MCP_SPAN_TYPES.CLIENT : OTEL_MCP_SPAN_TYPES.SERVER,
    name: target ? `${methodName} ${target}` : methodName,
    kind: isClient ? 'CLIENT' : 'SERVER',
    stability: OTEL_GENAI_SEMCONV.status,
    attributes: definedAttributes([
      [OTEL_MCP_ATTRS.METHOD_NAME, methodName],
      [OTEL_MCP_ATTRS.PROTOCOL_VERSION, optionalText(input.protocolVersion, 'protocolVersion')],
      [OTEL_MCP_ATTRS.SESSION_ID, optionalText(input.sessionId, 'sessionId')],
      [OTEL_MCP_ATTRS.JSONRPC_REQUEST_ID, requestId],
      [OTEL_MCP_ATTRS.RESOURCE_URI, optionalText(input.resourceUri, 'resourceUri')],
      [OTEL_MCP_ATTRS.SERVER_ADDRESS, isClient ? serverAddress : undefined],
      [OTEL_MCP_ATTRS.SERVER_PORT, isClient ? serverPort : undefined],
      [OTEL_MCP_ATTRS.CLIENT_ADDRESS, isClient ? undefined : clientAddress],
      [OTEL_MCP_ATTRS.CLIENT_PORT, isClient ? undefined : clientPort],
      [
        OTEL_MCP_ATTRS.RPC_RESPONSE_STATUS_CODE,
        optionalText(input.responseStatusCode, 'responseStatusCode'),
      ],
      [OTEL_MCP_ATTRS.ERROR_TYPE, errorType],
      [
        OTEL_GENAI_ATTRS.OPERATION_NAME,
        methodName === 'tools/call' ? OTEL_GENAI_OPERATION.EXECUTE_TOOL : undefined,
      ],
      [OTEL_GENAI_ATTRS.TOOL_NAME, toolName],
      [OTEL_GENAI_ATTRS.PROMPT_NAME, promptName],
      [
        OTEL_GENAI_ATTRS.TOOL_CALL_ARGUMENTS,
        capturedJsonObject(input.toolArguments, 'toolArguments', input.contentCapturePolicy),
      ],
      [
        OTEL_GENAI_ATTRS.TOOL_CALL_RESULT,
        errorType
          ? undefined
          : capturedJsonObject(input.toolResult, 'toolResult', input.contentCapturePolicy),
      ],
    ]),
  };
}
