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
import { startSpan } from './spans';

type SpanCallback<T> = (span: api.Span) => Promise<T>;

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
  return startSpan(
    definition.name,
    async (span) => {
      span.setAttributes(toApiAttributes(definition.attributes));
      return callback(span);
    },
    { kind: toSpanKind(definition.kind) },
  );
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
