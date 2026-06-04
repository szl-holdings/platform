/**
 * @workspace/agents-sdk-bridge
 *
 * Bridges the @openai/agents SDK into the SZL governed platform:
 *   - SzlTracingProcessor: dual-exports SDK traces to Trace Graph + Cognitive Observability
 *   - SzlToolAdapter: converts Tool Mesh manifests into SDK tool() definitions
 *   - SzlAgentAdapter: wraps SZL AgentDefinitions as SDK Agent instances
 *   - SzlGuardrailAdapter: bridges SDK guardrails to the Policy Engine's evaluateFull()
 *   - PII filter: respects trace_include_sensitive_data and SZL's PII redactor
 */

export { SzlTracingProcessor, registerSzlTracingProcessor } from './tracing-processor.js';
export type { SzlTracingProcessorOptions } from './tracing-processor.js';

export { SzlToolAdapter, adaptToolManifest } from './tool-adapter.js';
export type { SzlToolAdapterOptions } from './tool-adapter.js';

export { SzlAgentAdapter } from './agent-adapter.js';
export type { AgentDefinitionLike, SzlAgentAdapterOptions } from './agent-adapter.js';

export { SzlGuardrailAdapter } from './guardrail-adapter.js';
export type { SzlGuardrailAdapterOptions, GuardrailCheckResult } from './guardrail-adapter.js';

export {
  recordGenerationMetrics,
  recordToolMetrics,
  recordApprovalBottleneck,
  recordRunStart,
  recordRunComplete,
} from './metrics-bridge.js';
export type {
  GenerationMetrics,
  ToolMetrics,
  ApprovalBottleneckMetrics,
} from './metrics-bridge.js';

export {
  NoopBehavioralTracerBridge,
} from './behavioral-tracer-bridge.js';
export type { BehavioralTracerBridge, RoutingForkRecord } from './behavioral-tracer-bridge.js';

export { redactSensitiveData, shouldIncludeSensitiveData } from './pii-filter.js';

export { runAgentViaSdk } from './sdk-runner.js';
export type { SdkRunnerOptions, SdkRunResult } from './sdk-runner.js';

export const AGENTS_SDK_BRIDGE_VERSION = '0.1.0' as const;
