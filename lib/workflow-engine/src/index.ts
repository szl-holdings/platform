/**
 * @deprecated This package is superseded by `@szl-holdings/forge-runtime` which wraps
 * and extends these workflow/event-bus APIs with FORGE RUNTIME governance.
 * Existing imports continue to work (backward-compatible). Migrate new code to:
 *   import { forgeRuntime, agentEventBus, jobQueue } from "@szl-holdings/forge-runtime";
 */

export { AgentEventBus, agentEventBus, type AgentEventType, type AgentEvent } from "./event-bus.js";
export { logger } from "./logger.js";
export {
  KnowledgeStore,
  knowledgeStore,
  createKnowledgeEntry,
  persistAgentRun,
  type KnowledgeEntryType,
  type KnowledgeDomain,
  type KnowledgeEntry,
  type KnowledgeQuery,
} from "./knowledge-store.js";
export {
  InProcessJobQueue,
  jobQueue,
  JOB_TYPES,
  type Job,
  type JobStatus,
  type WsPublishFn,
} from "./job-queue.js";
export {
  AgentScheduler,
  agentScheduler,
  type AgentSchedule,
  type AgentRunRecord,
} from "./agent-scheduler.js";
export {
  WorkflowStateMachine,
  type WorkflowStatus,
  type WorkflowTransition,
  type WorkflowContext,
} from "./workflow-state-machine.js";
export {
  DurableJobQueue,
  durableJobQueue,
  JobChain,
  type DurableJob,
  type DurableJobOptions,
  type JobPriority,
  type JobExecutionContext,
  type QueueConfig,
  type JobChainStep,
  type JobStatus as DurableJobStatus,
} from "./durable-job-queue.js";
export {
  DurableScheduler,
  durableScheduler,
  seedDefaultSchedules,
  type ScheduleDefinition,
} from "./durable-scheduler.js";
export {
  AgentExecutionRuntime,
  agentExecutionRuntime,
  type AgentExecutionConfig,
  type AgentRunContext,
  type AgentState,
} from "./agent-execution-runtime.js";
