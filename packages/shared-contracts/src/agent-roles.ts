/**
 * AEEP Agent Role Contracts
 *
 * Each role defines the capability envelope, tool permissions,
 * autonomy mode, and evidence requirements for a class of AI agent.
 *
 * Roles are used by:
 *  - policy-guard to evaluate permitted operations
 *  - agent-core to wire capability sets at runtime
 *  - evidence-ledger to tag ledger entries with originating role
 */

export type AgentRoleId =
  | "MissionPlanner"
  | "RetrievalStrategist"
  | "MemoryCustodian"
  | "ToolOrchestrator"
  | "PolicyGuardian"
  | "ExecutionSupervisor"
  | "EvidenceSynthesizer"
  | "Evaluator";

export type AutonomyMode = "full" | "supervised" | "approval-required" | "read-only";

export interface AgentRoleCapability {
  toolId: string;
  permitted: boolean;
  requiresApproval?: boolean;
  maxCallsPerRun?: number;
}

export interface AgentRoleContract {
  roleId: AgentRoleId;
  displayName: string;
  description: string;
  defaultAutonomyMode: AutonomyMode;
  capabilities: AgentRoleCapability[];
  evidenceRequired: boolean;
  policyCheck: boolean;
  maxRunDepth?: number;
}

export const AGENT_ROLE_CONTRACTS: Record<AgentRoleId, AgentRoleContract> = {
  MissionPlanner: {
    roleId: "MissionPlanner",
    displayName: "Mission Planner",
    description: "Decomposes high-level goals into executable task trees and coordinates sub-agent delegation.",
    defaultAutonomyMode: "supervised",
    capabilities: [
      { toolId: "task.decompose", permitted: true },
      { toolId: "task.delegate", permitted: true, requiresApproval: false },
      { toolId: "context.read", permitted: true },
      { toolId: "memory.read", permitted: true },
      { toolId: "memory.write", permitted: false },
      { toolId: "file.write", permitted: false },
      { toolId: "external.call", permitted: false },
    ],
    evidenceRequired: true,
    policyCheck: true,
    maxRunDepth: 3,
  },

  RetrievalStrategist: {
    roleId: "RetrievalStrategist",
    displayName: "Retrieval Strategist",
    description: "Plans and executes multi-source retrieval, query rewriting, and result ranking.",
    defaultAutonomyMode: "full",
    capabilities: [
      { toolId: "retrieval.search", permitted: true },
      { toolId: "retrieval.rerank", permitted: true },
      { toolId: "retrieval.queryRewrite", permitted: true },
      { toolId: "retrieval.hybridFuse", permitted: true },
      { toolId: "memory.read", permitted: true },
      { toolId: "memory.write", permitted: false },
      { toolId: "file.write", permitted: false },
      { toolId: "external.call", permitted: false },
    ],
    evidenceRequired: true,
    policyCheck: false,
  },

  MemoryCustodian: {
    roleId: "MemoryCustodian",
    displayName: "Memory Custodian",
    description: "Manages working memory, episodic memory, and structured fact storage. Enforces freshness TTL.",
    defaultAutonomyMode: "supervised",
    capabilities: [
      { toolId: "memory.read", permitted: true },
      { toolId: "memory.write", permitted: true },
      { toolId: "memory.forget", permitted: true, requiresApproval: true },
      { toolId: "memory.expire", permitted: true },
      { toolId: "context.read", permitted: true },
    ],
    evidenceRequired: true,
    policyCheck: true,
  },

  ToolOrchestrator: {
    roleId: "ToolOrchestrator",
    displayName: "Tool Orchestrator",
    description: "Selects, sequences, and validates tool calls. Handles retries, timeouts, and schema validation.",
    defaultAutonomyMode: "supervised",
    capabilities: [
      { toolId: "*", permitted: true },
      { toolId: "file.delete", permitted: false },
      { toolId: "db.mutate", permitted: false },
    ],
    evidenceRequired: true,
    policyCheck: true,
    maxRunDepth: 5,
  },

  PolicyGuardian: {
    roleId: "PolicyGuardian",
    displayName: "Policy Guardian",
    description: "Evaluates planned actions against policy rules. Issues allow/require-approval/block verdicts.",
    defaultAutonomyMode: "read-only",
    capabilities: [
      { toolId: "policy.evaluate", permitted: true },
      { toolId: "policy.audit.read", permitted: true },
      { toolId: "context.read", permitted: true },
      { toolId: "memory.read", permitted: true },
    ],
    evidenceRequired: true,
    policyCheck: false,
  },

  ExecutionSupervisor: {
    roleId: "ExecutionSupervisor",
    displayName: "Execution Supervisor",
    description: "Monitors live runs, detects anomalies, and can halt or escalate runs that breach policy.",
    defaultAutonomyMode: "supervised",
    capabilities: [
      { toolId: "run.monitor", permitted: true },
      { toolId: "run.halt", permitted: true, requiresApproval: true },
      { toolId: "run.escalate", permitted: true },
      { toolId: "run.resumeAfterApproval", permitted: true },
      { toolId: "audit.read", permitted: true },
    ],
    evidenceRequired: true,
    policyCheck: true,
  },

  EvidenceSynthesizer: {
    roleId: "EvidenceSynthesizer",
    displayName: "Evidence Synthesizer",
    description: "Compiles retrieval results, tool outputs, and citations into structured evidence packages.",
    defaultAutonomyMode: "full",
    capabilities: [
      { toolId: "evidence.compile", permitted: true },
      { toolId: "evidence.cite", permitted: true },
      { toolId: "evidence.scoreConfidence", permitted: true },
      { toolId: "retrieval.search", permitted: true },
      { toolId: "memory.read", permitted: true },
    ],
    evidenceRequired: true,
    policyCheck: false,
  },

  Evaluator: {
    roleId: "Evaluator",
    displayName: "Evaluator",
    description: "Runs evaluation suites against agent outputs. Reports scores, regressions, and benchmarks.",
    defaultAutonomyMode: "full",
    capabilities: [
      { toolId: "eval.run", permitted: true },
      { toolId: "eval.score", permitted: true },
      { toolId: "eval.report", permitted: true },
      { toolId: "retrieval.search", permitted: true },
      { toolId: "memory.read", permitted: true },
    ],
    evidenceRequired: false,
    policyCheck: false,
  },
};
