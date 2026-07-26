/**
 * Native OpenTelemetry wrappers for the Development-status GenAI and MCP
 * semantic-convention descriptions in @szl-holdings/telemetry-standards.
 */
import * as api from '@opentelemetry/api';
import {
  createGenAIAgentSpan,
  createGenAIInferenceClientSpan,
  createGenAIToolSpan,
  createMcpSpan,
  type GenAIAgentSpanInput,
  type GenAIInferenceSpanInput,
  type GenAIToolSpanInput,
  type McpSpanInput,
  type OtelAttributeValue,
  type OtelSemconvSpan,
} from '@szl-holdings/telemetry-standards/genai';

type SpanCallback<T> = (span: api.Span) => Promise<T>;
const tracer = api.trace.getTracer('@szl-holdings/otel');

function toSpanKind(kind: OtelSemconvSpan['kind']): api.SpanKind {
  switch (kind) {
    case 'CLIENT':
      return api.SpanKind.CLIENT;
    case 'SERVER':
      return api.SpanKind.SERVER;
    case 'INTERNAL':
      return api.SpanKind.INTERNAL;
  }
}

function toApiAttributeValue(value: OtelAttributeValue): api.AttributeValue {
  return Array.isArray(value) ? [...value] : (value as api.AttributeValue);
}

function toApiAttributes(attributes: Record<string, OtelAttributeValue>): api.Attributes {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [key, toApiAttributeValue(value)]),
  );
}

async function runSemconvSpan<T>(
  definition: OtelSemconvSpan,
  callback: SpanCallback<T>,
): Promise<T> {
  const attributes = toApiAttributes(definition.attributes);
  const capturedToolResult = attributes['gen_ai.tool.call.result'];
  delete attributes['gen_ai.tool.call.result'];
  return tracer.startActiveSpan(
    definition.name,
    {
      kind: toSpanKind(definition.kind),
      // These attributes are sampling-relevant upstream and must be visible to
      // head samplers at span creation rather than set inside the callback.
      attributes,
    },
    async (span) => {
      try {
        const result = await callback(span);
        if (definition.attributes['error.type'] !== undefined) {
          span.setStatus({ code: api.SpanStatusCode.ERROR });
        } else if (capturedToolResult !== undefined) {
          span.setAttribute('gen_ai.tool.call.result', capturedToolResult);
        }
        // Successful operations intentionally remain UNSET per OTel guidance.
        return result;
      } catch (error) {
        const errorType = sanitizeErrorType(error);
        span.setAttribute('error.type', errorType);
        span.recordException({
          name: errorType,
          message: 'operation failed',
        });
        span.setStatus({ code: api.SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

function sanitizeErrorType(error: unknown): string {
  const candidate =
    error instanceof Error && error.name.trim() ? error.name : `thrown.${typeof error}`;
  const sanitized = candidate.replace(/[^a-zA-Z0-9._/-]/g, '_').slice(0, 128);
  return sanitized || 'Error';
}

export async function genAIInferenceClientSpan<T>(
  input: GenAIInferenceSpanInput,
  callback: SpanCallback<T>,
): Promise<T> {
  return runSemconvSpan(createGenAIInferenceClientSpan(input), callback);
}

export async function genAIAgentSpan<T>(
  input: GenAIAgentSpanInput,
  callback: SpanCallback<T>,
): Promise<T> {
  return runSemconvSpan(createGenAIAgentSpan(input), callback);
}

export async function genAIToolSpan<T>(
  input: GenAIToolSpanInput,
  callback: SpanCallback<T>,
): Promise<T> {
  return runSemconvSpan(createGenAIToolSpan(input), callback);
}

export async function mcpSpan<T>(input: McpSpanInput, callback: SpanCallback<T>): Promise<T> {
  return runSemconvSpan(createMcpSpan(input), callback);
}

/**
 * Apply MCP semantic attributes to an already-active GenAI tool span. This is
 * the preferred path when one physical tool execution would otherwise create
 * duplicate GenAI and MCP spans.
 */
export function applyMcpAttributes(span: api.Span, input: McpSpanInput): OtelSemconvSpan {
  const definition = createMcpSpan(input);
  span.setAttributes(toApiAttributes(definition.attributes));
  return definition;
}
