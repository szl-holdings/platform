/**
 * @szl-holdings/otel
 *
 * OpenTelemetry SDK initialization and instrumentation helpers.
 * Wraps @szl-holdings/observability with a simpler, service-first API.
 *
 * Usage (in service entry point — must run BEFORE any other imports):
 *   import { initOtel } from "@szl-holdings/otel";
 *   initOtel({ serviceName: "szl-api" });
 *
 * Then in route/job handlers:
 *   import { startSpan, toolCallSpan } from "@szl-holdings/otel";
 *   await startSpan("my-operation", async (span) => {
 *     span.setAttribute("user.id", userId);
 *     // ... do work
 *   });
 */

export type {
  ActorContext,
  OtelConfig,
  Span,
  SpanContext,
} from '@szl-holdings/observability';
export {
  buildActorAttributes,
  buildContextAttributes,
  flushInMemorySpans,
  getInMemorySpans,
  getOtelConfig,
  getTracer,
  initializeOpenTelemetry as initOtel,
  isOtelInitialized,
} from '@szl-holdings/observability';
export { withCorrelationSpan } from './correlation-span';
export { createDrizzleInstrumentation } from './drizzle-instrumentation';
export {
  applyMcpAttributes,
  genAIAgentSpan,
  genAIInferenceClientSpan,
  genAIToolSpan,
  mcpSpan,
} from './genai-spans';
export { dbSpan, httpOutboundSpan, jobSpan, startSpan, toolCallSpan } from './spans';
