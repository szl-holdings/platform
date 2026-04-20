/**
 * AEEP Workflow Type Contracts
 *
 * Defines starter workflow descriptors, run states, trigger types,
 * and the step result shape used across the runtime.
 */
import type { AgentRoleId } from "./agent-roles.js";

export type WorkflowRunState =
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "cancelled"
  | "approval-required"
  | "approved"
  | "rejected";

export type StepRunState =
  | "pending"
  | "running"
  | "complete"
  | "failed"
  | "skipped"
  | "approval-required"
  | "approved"
  | "rejected";

export type TriggerType = "manual" | "scheduled" | "event" | "api" | "parent-workflow";

export type WorkflowId =
  | "ingest_source"
  | "rebuild_index"
  | "verify_index_health"
  | "investigate_signal"
  | "prepare_executive_brief"
  | "compile_case_timeline"
  | "review_property_risk"
  | "generate_operational_digest"
  | "rotate_profile_version"
  | "run_eval_suite";

export interface WorkflowStepDescriptor {
  stepId: string;
  name: string;
  agentRole: AgentRoleId;
  toolIds: string[];
  policyCheck: boolean;
  evidenceRequired: boolean;
  requiresApproval?: boolean;
  timeoutMs?: number;
  retryCount?: number;
}

export interface WorkflowDescriptor {
  id: WorkflowId;
  name: string;
  description: string;
  category: "data" | "intelligence" | "operational" | "governance" | "evaluation";
  triggerTypes: TriggerType[];
  steps: WorkflowStepDescriptor[];
  domainProfiles?: string[];
  estimatedDurationMs?: number;
  policyTier: "low" | "medium" | "high" | "critical";
}

export const STARTER_WORKFLOWS: Record<WorkflowId, WorkflowDescriptor> = {
  ingest_source: {
    id: "ingest_source",
    name: "Ingest Source",
    description: "Crawl or import a raw document source, chunk, embed, and register chunks in the retrieval index.",
    category: "data",
    triggerTypes: ["manual", "api", "scheduled"],
    policyTier: "medium",
    estimatedDurationMs: 30_000,
    steps: [
      { stepId: "validate_source", name: "Validate source URI", agentRole: "ToolOrchestrator", toolIds: ["source.validate"], policyCheck: false, evidenceRequired: false },
      { stepId: "crawl", name: "Crawl / fetch content", agentRole: "ToolOrchestrator", toolIds: ["source.crawl"], policyCheck: true, evidenceRequired: false },
      { stepId: "chunk", name: "Chunk documents", agentRole: "ToolOrchestrator", toolIds: ["chunker.run"], policyCheck: false, evidenceRequired: false },
      { stepId: "embed", name: "Embed chunks", agentRole: "ToolOrchestrator", toolIds: ["embedder.run"], policyCheck: false, evidenceRequired: false },
      { stepId: "index", name: "Index into vector store", agentRole: "ToolOrchestrator", toolIds: ["index.upsert"], policyCheck: true, evidenceRequired: true, requiresApproval: false },
      { stepId: "register", name: "Register source in profile", agentRole: "MemoryCustodian", toolIds: ["profile.registerSource"], policyCheck: false, evidenceRequired: true },
    ],
  },

  rebuild_index: {
    id: "rebuild_index",
    name: "Rebuild Index",
    description: "Full reindex of all chunks for a domain profile. Requires approval for production profiles.",
    category: "data",
    triggerTypes: ["manual", "api"],
    policyTier: "high",
    estimatedDurationMs: 120_000,
    steps: [
      { stepId: "snapshot", name: "Snapshot current index", agentRole: "ToolOrchestrator", toolIds: ["index.snapshot"], policyCheck: false, evidenceRequired: true },
      { stepId: "policy_check", name: "Policy check", agentRole: "PolicyGuardian", toolIds: ["policy.evaluate"], policyCheck: true, evidenceRequired: true, requiresApproval: true },
      { stepId: "clear", name: "Clear index namespace", agentRole: "ToolOrchestrator", toolIds: ["index.clearNamespace"], policyCheck: true, evidenceRequired: true, requiresApproval: true },
      { stepId: "rebuild", name: "Re-embed and reindex all", agentRole: "ToolOrchestrator", toolIds: ["embedder.run", "index.upsert"], policyCheck: false, evidenceRequired: true },
      { stepId: "verify", name: "Verify index health", agentRole: "ToolOrchestrator", toolIds: ["index.healthCheck"], policyCheck: false, evidenceRequired: true },
    ],
  },

  verify_index_health: {
    id: "verify_index_health",
    name: "Verify Index Health",
    description: "Spot-checks vector index coverage, staleness, and recall quality.",
    category: "data",
    triggerTypes: ["manual", "scheduled", "event"],
    policyTier: "low",
    estimatedDurationMs: 10_000,
    steps: [
      { stepId: "coverage_check", name: "Check chunk coverage", agentRole: "Evaluator", toolIds: ["index.coverageReport"], policyCheck: false, evidenceRequired: true },
      { stepId: "staleness_check", name: "Check document freshness", agentRole: "MemoryCustodian", toolIds: ["freshness.check"], policyCheck: false, evidenceRequired: true },
      { stepId: "recall_probe", name: "Recall quality probe", agentRole: "Evaluator", toolIds: ["eval.recallProbe"], policyCheck: false, evidenceRequired: true },
      { stepId: "report", name: "Emit health report", agentRole: "EvidenceSynthesizer", toolIds: ["evidence.compile"], policyCheck: false, evidenceRequired: true },
    ],
  },

  investigate_signal: {
    id: "investigate_signal",
    name: "Investigate Signal",
    description: "Deep investigation of a flagged signal. Retrieval-first with evidence compilation.",
    category: "intelligence",
    triggerTypes: ["manual", "api", "event"],
    policyTier: "medium",
    estimatedDurationMs: 45_000,
    steps: [
      { stepId: "classify_signal", name: "Classify signal type", agentRole: "MissionPlanner", toolIds: ["signal.classify"], policyCheck: false, evidenceRequired: false },
      { stepId: "retrieve_context", name: "Retrieve relevant context", agentRole: "RetrievalStrategist", toolIds: ["retrieval.search", "retrieval.rerank"], policyCheck: false, evidenceRequired: true },
      { stepId: "memory_lookup", name: "Check memory for prior context", agentRole: "MemoryCustodian", toolIds: ["memory.read"], policyCheck: false, evidenceRequired: true },
      { stepId: "synthesize", name: "Synthesize findings", agentRole: "EvidenceSynthesizer", toolIds: ["evidence.compile", "evidence.scoreConfidence"], policyCheck: true, evidenceRequired: true },
      { stepId: "policy_verdict", name: "Policy verdict on findings", agentRole: "PolicyGuardian", toolIds: ["policy.evaluate"], policyCheck: true, evidenceRequired: true },
      { stepId: "write_memory", name: "Store investigation to memory", agentRole: "MemoryCustodian", toolIds: ["memory.write"], policyCheck: false, evidenceRequired: true },
    ],
  },

  prepare_executive_brief: {
    id: "prepare_executive_brief",
    name: "Prepare Executive Brief",
    description: "Compile an evidence-backed executive brief with top risks, actions, and confidence scoring.",
    category: "intelligence",
    triggerTypes: ["manual", "scheduled", "api"],
    policyTier: "medium",
    estimatedDurationMs: 60_000,
    domainProfiles: ["Lyte", "Aegis", "Vessels", "Terra"],
    steps: [
      { stepId: "gather_signals", name: "Gather active signals", agentRole: "MissionPlanner", toolIds: ["signal.list"], policyCheck: false, evidenceRequired: false },
      { stepId: "retrieve_briefing_context", name: "Retrieve briefing context", agentRole: "RetrievalStrategist", toolIds: ["retrieval.search"], policyCheck: false, evidenceRequired: true },
      { stepId: "score_risks", name: "Score and rank risks", agentRole: "EvidenceSynthesizer", toolIds: ["risk.score"], policyCheck: false, evidenceRequired: true },
      { stepId: "compile_brief", name: "Compile brief package", agentRole: "EvidenceSynthesizer", toolIds: ["evidence.compile"], policyCheck: true, evidenceRequired: true },
      { stepId: "approval_gate", name: "Approval gate", agentRole: "ExecutionSupervisor", toolIds: ["approval.request"], policyCheck: true, evidenceRequired: true, requiresApproval: true },
      { stepId: "deliver", name: "Deliver brief", agentRole: "ToolOrchestrator", toolIds: ["brief.deliver"], policyCheck: false, evidenceRequired: true },
    ],
  },

  compile_case_timeline: {
    id: "compile_case_timeline",
    name: "Compile Case Timeline",
    description: "Build a structured event timeline for a legal matter or investigation case.",
    category: "intelligence",
    triggerTypes: ["manual", "api"],
    policyTier: "high",
    estimatedDurationMs: 90_000,
    domainProfiles: ["PRISM"],
    steps: [
      { stepId: "load_matter", name: "Load matter context", agentRole: "MissionPlanner", toolIds: ["matter.load"], policyCheck: true, evidenceRequired: false },
      { stepId: "retrieve_documents", name: "Retrieve matter documents", agentRole: "RetrievalStrategist", toolIds: ["retrieval.search"], policyCheck: false, evidenceRequired: true },
      { stepId: "extract_events", name: "Extract events from documents", agentRole: "EvidenceSynthesizer", toolIds: ["event.extract"], policyCheck: false, evidenceRequired: true },
      { stepId: "deduplicate", name: "Deduplicate and order events", agentRole: "EvidenceSynthesizer", toolIds: ["event.deduplicate"], policyCheck: false, evidenceRequired: false },
      { stepId: "compile_timeline", name: "Compile timeline", agentRole: "EvidenceSynthesizer", toolIds: ["evidence.compile"], policyCheck: true, evidenceRequired: true },
    ],
  },

  review_property_risk: {
    id: "review_property_risk",
    name: "Review Property Risk",
    description: "Assess risk factors for a real estate property using market data, comps, and zoning context.",
    category: "intelligence",
    triggerTypes: ["manual", "api"],
    policyTier: "medium",
    estimatedDurationMs: 40_000,
    domainProfiles: ["Terra"],
    steps: [
      { stepId: "load_property", name: "Load property record", agentRole: "ToolOrchestrator", toolIds: ["property.load"], policyCheck: false, evidenceRequired: false },
      { stepId: "retrieve_comps", name: "Retrieve comparable properties", agentRole: "RetrievalStrategist", toolIds: ["retrieval.search"], policyCheck: false, evidenceRequired: true },
      { stepId: "retrieve_market_data", name: "Retrieve market signals", agentRole: "RetrievalStrategist", toolIds: ["retrieval.search"], policyCheck: false, evidenceRequired: true },
      { stepId: "score_risk", name: "Score risk factors", agentRole: "EvidenceSynthesizer", toolIds: ["risk.score"], policyCheck: false, evidenceRequired: true },
      { stepId: "compile_report", name: "Compile risk report", agentRole: "EvidenceSynthesizer", toolIds: ["evidence.compile"], policyCheck: true, evidenceRequired: true },
    ],
  },

  generate_operational_digest: {
    id: "generate_operational_digest",
    name: "Generate Operational Digest",
    description: "Produces a concise operational digest from recent workflow runs, alerts, and approvals.",
    category: "operational",
    triggerTypes: ["scheduled", "manual"],
    policyTier: "low",
    estimatedDurationMs: 20_000,
    steps: [
      { stepId: "collect_runs", name: "Collect recent run summaries", agentRole: "ExecutionSupervisor", toolIds: ["run.list"], policyCheck: false, evidenceRequired: false },
      { stepId: "collect_alerts", name: "Collect alerts", agentRole: "ExecutionSupervisor", toolIds: ["alert.list"], policyCheck: false, evidenceRequired: false },
      { stepId: "collect_approvals", name: "Collect approval decisions", agentRole: "PolicyGuardian", toolIds: ["approval.list"], policyCheck: false, evidenceRequired: false },
      { stepId: "compile_digest", name: "Compile digest", agentRole: "EvidenceSynthesizer", toolIds: ["evidence.compile"], policyCheck: false, evidenceRequired: true },
    ],
  },

  rotate_profile_version: {
    id: "rotate_profile_version",
    name: "Rotate Profile Version",
    description: "Bump the active version of a domain profile and migrate associated index namespaces.",
    category: "governance",
    triggerTypes: ["manual", "api"],
    policyTier: "critical",
    estimatedDurationMs: 60_000,
    steps: [
      { stepId: "validate_new_version", name: "Validate new profile version", agentRole: "PolicyGuardian", toolIds: ["profile.validate"], policyCheck: true, evidenceRequired: true },
      { stepId: "approval_gate", name: "Approval gate", agentRole: "ExecutionSupervisor", toolIds: ["approval.request"], policyCheck: true, evidenceRequired: true, requiresApproval: true },
      { stepId: "snapshot_old", name: "Snapshot old version", agentRole: "ToolOrchestrator", toolIds: ["profile.snapshot"], policyCheck: false, evidenceRequired: true },
      { stepId: "activate_new", name: "Activate new version", agentRole: "ToolOrchestrator", toolIds: ["profile.activate"], policyCheck: true, evidenceRequired: true },
      { stepId: "migrate_namespace", name: "Migrate index namespace", agentRole: "ToolOrchestrator", toolIds: ["index.migrateNamespace"], policyCheck: false, evidenceRequired: true },
      { stepId: "verify", name: "Verify profile health", agentRole: "Evaluator", toolIds: ["eval.profileHealthCheck"], policyCheck: false, evidenceRequired: true },
    ],
  },

  run_eval_suite: {
    id: "run_eval_suite",
    name: "Run Eval Suite",
    description: "Execute a named evaluation suite against current agent outputs. Reports scores and regressions.",
    category: "evaluation",
    triggerTypes: ["manual", "scheduled", "api"],
    policyTier: "low",
    estimatedDurationMs: 120_000,
    steps: [
      { stepId: "load_suite", name: "Load eval suite config", agentRole: "Evaluator", toolIds: ["eval.loadSuite"], policyCheck: false, evidenceRequired: false },
      { stepId: "run_cases", name: "Run evaluation cases", agentRole: "Evaluator", toolIds: ["eval.run"], policyCheck: false, evidenceRequired: true },
      { stepId: "score", name: "Score results", agentRole: "Evaluator", toolIds: ["eval.score"], policyCheck: false, evidenceRequired: true },
      { stepId: "compare_baseline", name: "Compare against baseline", agentRole: "Evaluator", toolIds: ["eval.compareBaseline"], policyCheck: false, evidenceRequired: true },
      { stepId: "report", name: "Emit eval report", agentRole: "EvidenceSynthesizer", toolIds: ["evidence.compile"], policyCheck: false, evidenceRequired: true },
    ],
  },
};
