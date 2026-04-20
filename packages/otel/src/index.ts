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

export {
  initOtel,
  getOtelConfig,
  isOtelInitialized,
  getInMemorySpans,
  flushInMemorySpans,
  getTracer,
  buildActorAttributes,
  buildContextAttributes,
} from "@szl-holdings/observability";

export type {
  OtelConfig,
  Span,
  ActorContext,
  SpanContext,
} from "@szl-holdings/observability";

export { startSpan, toolCallSpan, dbSpan, httpOutboundSpan, jobSpan } from "./spans";
export { withCorrelationSpan } from "./correlation-span";
export { createDrizzleInstrumentation } from "./drizzle-instrumentation";
