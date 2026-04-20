/**
 * @szl/substrate-client
 *
 * Typed client SDK for the Substrate MCP Gateway.
 *
 * @example
 * ```ts
 * import { SubstrateClient } from "@szl/substrate-client";
 *
 * const client = new SubstrateClient({
 *   baseUrl: "http://localhost:3700",
 *   apiKey: process.env.SUBSTRATE_GATEWAY_API_KEY,
 * });
 *
 * // Submit a run
 * const run = await client.submitRun({
 *   workflowId: "opportunity-audit",
 *   input: { tenantId: "acme", period: "2026-Q1" },
 * });
 *
 * // Poll until complete
 * let state = await client.getRun(run.runId);
 * while (state.status === "running") {
 *   await new Promise(r => setTimeout(r, 500));
 *   state = await client.getRun(run.runId);
 * }
 *
 * // Approve a gate
 * if (state.status === "pending-approval") {
 *   await client.approve({
 *     recommendationId: run.runId,
 *     actor: "alice@example.com",
 *     note: "Reviewed and approved.",
 *   });
 * }
 * ```
 *
 * @module
 */

export { SubstrateClient } from "./client.js";
export { SubstrateStreaming, connectRunEvents } from "./streaming.js";
export { SubstrateClientError } from "./types.js";

export type {
  SubstrateClientOptions,
  ExecutionMode,
  PipelineRunStatus,
  StageType,
  StageResultStatus,
  StageResultSummary,
  PipelineRunSummary,
  SubmitRunResponse,
  ApprovalVerdict,
  ApprovalEntry,
  ApprovalListResponse,
  ApprovalActionResponse,
  ReplayResponse,
  StageDiff,
  CounterfactualDiff,
  CounterfactualResponse,
  WorkflowSummary,
  WorkflowListResponse,
  RunEvent,
  StreamingOptions,
} from "./types.js";

export type { SubstrateStreamingOptions } from "./streaming.js";

export const SUBSTRATE_CLIENT_VERSION = "1.0.0" as const;
