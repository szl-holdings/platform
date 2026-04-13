export * from "./types.js";
export { MetricCollector } from "./collector.js";
export { ServerTelemetryCollector, ClientTelemetryCollector, serverTelemetry, clientTelemetry } from "./telemetry.js";
export type { TelemetryEvent, RequestTelemetry, WebVitalsReport, BusinessEvent, AlertRecord, ApmSpan, ExternalCallRecord } from "./telemetry.js";
export { doctrineEventBus, seedDoctrineEvents } from "./event-bus.js";
export type { CorrelatedEventGroup } from "./event-bus.js";
export { initializeOpenTelemetry, getTracer, getOtelConfig, isOtelInitialized } from "./otel.js";
export type { OtelConfig, Span } from "./otel.js";
export { genAITelemetry } from "./genai-telemetry.js";
export type {
  GenAISpanKind,
  GenAISpanStatus,
  GenAIModelCallSpan,
  GenAIToolCallSpan,
  GenAIAgentStepSpan,
  GenAIRetrievalSpan,
  GenAIApprovalSpan,
  GenAIArtifactJobSpan,
  GenAIExecutionRunSpan,
  GenAISpan,
  GenAITelemetrySnapshot,
  LangfuseTrace,
  LangfuseObservation,
} from "./genai-telemetry.js";

// ABO Doctrine — Pillar 1 + Pillar 5: Agent Telemetry, Agent Vitals, Trust Mesh
export { agentTelemetry, AgentTelemetryCollector } from "./agent-telemetry.js";
export type {
  AgentVitals,
  AgentReasoningSpan,
  ReasoningStepType,
  DelegationLink,
  DelegationChain,
  TrustReceipt,
  PredictiveRiskSignal,
  AgentGovernanceIdentity,
  AgentAutonomyLevel,
  AgentLifecycleStatus,
  ComplianceRule,
  ComplianceFramework,
  AgentComplianceContext,
  ComplianceEvalResult,
} from "./agent-telemetry.js";
