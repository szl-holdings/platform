import type { SkillDefinition } from "./types.js";
import type { SkillRegistry } from "./registry.js";

const NOW = "2024-01-01T00:00:00.000Z";

export const builtinSkills: SkillDefinition[] = [
  {
    id: "builtin:graph-query:entity-relationship-lookup",
    name: "Entity Relationship Lookup",
    description:
      "Traverses the knowledge graph to surface first- and second-degree relationships for a given entity, returning connected nodes and edge types.",
    category: "graph-query",
    objective:
      "Retrieve all direct and indirect relationships for a target entity from the knowledge graph.",
    inputFields: ["entityId", "maxDepth", "relationshipTypes"],
    steps: [
      {
        id: "step:validate-entity",
        name: "Validate Entity",
        description: "Confirm the entity exists in the graph before traversal.",
        handler: "graph-query:validate-entity",
        parameters: {},
        toolsUsed: ["graph-lookup"],
        expectedOutput: "Validated entity node",
      },
      {
        id: "step:traverse-relationships",
        name: "Traverse Relationships",
        description: "Perform BFS/DFS from the entity up to maxDepth hops.",
        handler: "graph-query:traverse",
        parameters: { maxDepth: 2 },
        toolsUsed: ["graph-traversal"],
        expectedOutput: "List of related nodes and edge metadata",
      },
      {
        id: "step:rank-results",
        name: "Rank & Filter Results",
        description: "Score relationships by relevance and prune noise.",
        handler: "graph-query:rank",
        parameters: {},
        toolsUsed: ["graph-ranker"],
        expectedOutput: "Ranked relationship list",
      },
    ],
    toolsUsed: ["graph-lookup", "graph-traversal", "graph-ranker"],
    expectedOutputs: ["Ranked list of related entities", "Edge-type breakdown"],
    successCriteria: [
      {
        criterion: "nodes_returned",
        description: "At least one related node is returned for valid entities.",
      },
      {
        criterion: "latency_under_2s",
        description: "Graph traversal completes within 2 seconds.",
      },
    ],
    failureConditions: [
      {
        condition: "entity_not_found",
        description: "The specified entityId does not exist in the graph.",
        recoveryHint: "Verify the entityId and retry with a canonical identifier.",
      },
      {
        condition: "graph_timeout",
        description: "Traversal exceeded the allowed time budget.",
        recoveryHint: "Reduce maxDepth or narrow relationshipTypes filter.",
      },
    ],
    performance: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgLatencyMs: 0,
    },
    isBuiltin: true,
    enabled: true,
    version: "1.0.0",
    tags: ["graph", "entities", "relationships"],
    createdAt: NOW,
    updatedAt: NOW,
  },

  {
    id: "builtin:research:domain-intelligence-synthesis",
    name: "Domain Intelligence Research",
    description:
      "Gathers and structures intelligence on a specified domain from internal knowledge bases, RAG chunks, and external signals.",
    category: "research",
    objective:
      "Produce a structured research brief covering key facts, signals, and open questions for a target domain.",
    inputFields: ["domain", "focusTopics", "maxSources"],
    steps: [
      {
        id: "step:query-rag",
        name: "Query Knowledge Base",
        description: "Retrieve relevant chunks from the RAG knowledge store.",
        handler: "research:rag-query",
        parameters: { topK: 20 },
        toolsUsed: ["rag-retrieval"],
        expectedOutput: "Top-K relevant knowledge chunks",
      },
      {
        id: "step:deduplicate-chunks",
        name: "Deduplicate & Rank Chunks",
        description: "Remove near-duplicate passages and rank by relevance score.",
        handler: "research:deduplicate",
        parameters: {},
        toolsUsed: ["chunk-deduplicator"],
        expectedOutput: "Unique ranked chunk list",
      },
      {
        id: "step:draft-brief",
        name: "Draft Research Brief",
        description: "Synthesise ranked chunks into a structured brief.",
        handler: "research:draft-brief",
        parameters: {},
        toolsUsed: ["llm-synthesis"],
        expectedOutput: "Markdown research brief",
      },
    ],
    toolsUsed: ["rag-retrieval", "chunk-deduplicator", "llm-synthesis"],
    expectedOutputs: ["Structured research brief", "Source citation list"],
    successCriteria: [
      {
        criterion: "sources_cited",
        description: "At least 3 distinct sources are cited in the brief.",
      },
      {
        criterion: "brief_non_empty",
        description: "The output brief contains at least 200 words.",
      },
    ],
    failureConditions: [
      {
        condition: "no_rag_results",
        description: "The knowledge base returned zero chunks for the domain.",
        recoveryHint: "Broaden focusTopics or ingest additional domain documents.",
      },
    ],
    performance: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgLatencyMs: 0,
    },
    isBuiltin: true,
    enabled: true,
    version: "1.0.0",
    tags: ["research", "rag", "knowledge"],
    createdAt: NOW,
    updatedAt: NOW,
  },

  {
    id: "builtin:synthesis:multi-source-narrative",
    name: "Multi-Source Narrative Synthesis",
    description:
      "Combines findings from multiple upstream research or analysis outputs into a single coherent narrative with a clear thesis and supporting evidence.",
    category: "synthesis",
    objective:
      "Merge disparate source summaries into one logically structured, non-contradictory narrative.",
    inputFields: ["sourceSummaries", "targetAudience", "maxWords"],
    steps: [
      {
        id: "step:identify-themes",
        name: "Identify Common Themes",
        description: "Extract recurring themes and contradictions across summaries.",
        handler: "synthesis:theme-extraction",
        parameters: {},
        toolsUsed: ["theme-extractor"],
        expectedOutput: "Theme taxonomy",
      },
      {
        id: "step:resolve-contradictions",
        name: "Resolve Contradictions",
        description: "Flag and adjudicate conflicting claims between sources.",
        handler: "synthesis:contradiction-resolver",
        parameters: {},
        toolsUsed: ["claim-verifier"],
        expectedOutput: "Resolved claim set",
      },
      {
        id: "step:write-narrative",
        name: "Write Unified Narrative",
        description: "Generate a structured narrative from resolved themes.",
        handler: "synthesis:narrative-writer",
        parameters: {},
        toolsUsed: ["llm-synthesis"],
        expectedOutput: "Unified narrative document",
      },
    ],
    toolsUsed: ["theme-extractor", "claim-verifier", "llm-synthesis"],
    expectedOutputs: ["Unified narrative", "Theme map", "Contradiction log"],
    successCriteria: [
      {
        criterion: "narrative_coherent",
        description: "Output narrative has no unresolved contradictions.",
      },
    ],
    failureConditions: [
      {
        condition: "insufficient_sources",
        description: "Fewer than 2 source summaries provided.",
        recoveryHint: "Supply at least 2 source summaries for meaningful synthesis.",
      },
    ],
    performance: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgLatencyMs: 0,
    },
    isBuiltin: true,
    enabled: true,
    version: "1.0.0",
    tags: ["synthesis", "narrative", "multi-source"],
    createdAt: NOW,
    updatedAt: NOW,
  },

  {
    id: "builtin:workflow:approval-gated-action",
    name: "Approval-Gated Action Workflow",
    description:
      "Stages an action for human approval, waits for sign-off, then executes and records the result with full audit trail.",
    category: "workflow",
    objective:
      "Ensure high-impact actions receive explicit human approval before execution.",
    inputFields: ["actionPayload", "approverRole", "timeoutMinutes"],
    steps: [
      {
        id: "step:stage-action",
        name: "Stage Action",
        description: "Persist the pending action and generate an approval request.",
        handler: "workflow:stage-action",
        parameters: {},
        toolsUsed: ["action-stager"],
        expectedOutput: "Approval request record",
      },
      {
        id: "step:await-approval",
        name: "Await Approval",
        description: "Poll or listen for approval/rejection from the designated role.",
        handler: "workflow:await-approval",
        parameters: { pollIntervalMs: 5000 },
        toolsUsed: ["approval-gate"],
        expectedOutput: "Approval decision",
      },
      {
        id: "step:execute-action",
        name: "Execute Action",
        description: "Invoke the approved action and capture outputs.",
        handler: "workflow:execute-action",
        parameters: {},
        toolsUsed: ["action-executor"],
        expectedOutput: "Action execution result",
      },
      {
        id: "step:audit-record",
        name: "Record Audit Entry",
        description: "Write an immutable audit record of the decision and outcome.",
        handler: "workflow:audit-record",
        parameters: {},
        toolsUsed: ["audit-writer"],
        expectedOutput: "Audit entry ID",
      },
    ],
    toolsUsed: ["action-stager", "approval-gate", "action-executor", "audit-writer"],
    expectedOutputs: ["Execution result", "Audit entry"],
    successCriteria: [
      {
        criterion: "audit_written",
        description: "An immutable audit entry is persisted after every run.",
      },
    ],
    failureConditions: [
      {
        condition: "approval_timeout",
        description: "Approval was not received within the configured timeout.",
        recoveryHint: "Re-escalate or extend the timeout window.",
      },
      {
        condition: "approval_rejected",
        description: "The approver explicitly rejected the action.",
        recoveryHint: "Review rejection reason and revise the action payload.",
      },
    ],
    performance: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgLatencyMs: 0,
    },
    isBuiltin: true,
    enabled: true,
    version: "1.0.0",
    tags: ["workflow", "approval", "audit"],
    createdAt: NOW,
    updatedAt: NOW,
  },

  {
    id: "builtin:reporting:executive-kpi-report",
    name: "Executive KPI Report Builder",
    description:
      "Assembles a structured KPI report from live metrics, computes period-over-period deltas, and formats output for executive consumption.",
    category: "reporting",
    objective:
      "Generate a period KPI report with trend analysis ready for executive review.",
    inputFields: ["metricIds", "periodStart", "periodEnd", "compareWithPriorPeriod"],
    steps: [
      {
        id: "step:fetch-metrics",
        name: "Fetch Metrics",
        description: "Pull current-period metric values from the data layer.",
        handler: "reporting:fetch-metrics",
        parameters: {},
        toolsUsed: ["metrics-api"],
        expectedOutput: "Raw metric values",
      },
      {
        id: "step:compute-deltas",
        name: "Compute Period Deltas",
        description: "Calculate absolute and percentage changes vs. prior period.",
        handler: "reporting:compute-deltas",
        parameters: {},
        toolsUsed: ["delta-calculator"],
        expectedOutput: "Delta table",
      },
      {
        id: "step:format-report",
        name: "Format Report",
        description: "Render the KPI table and trend commentary into a report document.",
        handler: "reporting:format-report",
        parameters: { format: "markdown" },
        toolsUsed: ["report-formatter"],
        expectedOutput: "Formatted report document",
      },
    ],
    toolsUsed: ["metrics-api", "delta-calculator", "report-formatter"],
    expectedOutputs: ["KPI report document", "Delta summary table"],
    successCriteria: [
      {
        criterion: "all_metrics_present",
        description: "Every requested metricId appears in the output report.",
      },
      {
        criterion: "deltas_computed",
        description: "Period-over-period delta is computed for each metric.",
      },
    ],
    failureConditions: [
      {
        condition: "metric_unavailable",
        description: "One or more requested metrics could not be fetched.",
        recoveryHint: "Check metric IDs and data availability for the period.",
      },
    ],
    performance: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgLatencyMs: 0,
    },
    isBuiltin: true,
    enabled: true,
    version: "1.0.0",
    tags: ["reporting", "kpi", "metrics", "executive"],
    createdAt: NOW,
    updatedAt: NOW,
  },

  {
    id: "builtin:analysis:anomaly-detection",
    name: "Time-Series Anomaly Detection",
    description:
      "Applies statistical methods to a time-series signal to identify anomalous spikes, drops, and structural breaks, then ranks them by severity.",
    category: "analysis",
    objective:
      "Detect and rank anomalies in a time-series dataset for operational or financial signals.",
    inputFields: ["seriesId", "windowDays", "sensitivityLevel"],
    steps: [
      {
        id: "step:load-series",
        name: "Load Series",
        description: "Retrieve the time-series data for the specified window.",
        handler: "analysis:load-series",
        parameters: {},
        toolsUsed: ["timeseries-store"],
        expectedOutput: "Time-series data points",
      },
      {
        id: "step:detect-anomalies",
        name: "Detect Anomalies",
        description: "Run Z-score / IQR / STL decomposition anomaly detection.",
        handler: "analysis:detect-anomalies",
        parameters: { method: "z-score", threshold: 3 },
        toolsUsed: ["anomaly-detector"],
        expectedOutput: "List of anomaly candidates with timestamps",
      },
      {
        id: "step:rank-anomalies",
        name: "Rank & Classify Anomalies",
        description: "Assign severity scores and classify anomaly types.",
        handler: "analysis:rank-anomalies",
        parameters: {},
        toolsUsed: ["anomaly-classifier"],
        expectedOutput: "Ranked anomaly report",
      },
    ],
    toolsUsed: ["timeseries-store", "anomaly-detector", "anomaly-classifier"],
    expectedOutputs: ["Ranked anomaly list", "Severity scores", "Structural break report"],
    successCriteria: [
      {
        criterion: "series_loaded",
        description: "Time-series data loads without gaps exceeding 10% of the window.",
      },
    ],
    failureConditions: [
      {
        condition: "insufficient_data_points",
        description: "Series contains fewer data points than required for analysis.",
        recoveryHint: "Extend windowDays or lower sensitivityLevel.",
      },
    ],
    performance: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgLatencyMs: 0,
    },
    isBuiltin: true,
    enabled: true,
    version: "1.0.0",
    tags: ["analysis", "anomaly-detection", "time-series"],
    createdAt: NOW,
    updatedAt: NOW,
  },

  {
    id: "builtin:remediation:policy-violation-remediation",
    name: "Policy Violation Remediation",
    description:
      "Evaluates a detected policy violation, selects the appropriate remediation playbook, executes corrective steps, and logs the outcome.",
    category: "remediation",
    objective:
      "Automatically resolve or escalate a detected policy violation with a full audit trail.",
    inputFields: ["violationId", "policyId", "severity", "affectedResourceId"],
    steps: [
      {
        id: "step:classify-violation",
        name: "Classify Violation",
        description: "Determine violation type and applicable remediation playbook.",
        handler: "remediation:classify-violation",
        parameters: {},
        toolsUsed: ["policy-engine"],
        expectedOutput: "Violation classification and playbook ID",
      },
      {
        id: "step:select-playbook",
        name: "Select Remediation Playbook",
        description: "Load the matching playbook for the violation class.",
        handler: "remediation:select-playbook",
        parameters: {},
        toolsUsed: ["playbook-store"],
        expectedOutput: "Remediation playbook steps",
      },
      {
        id: "step:execute-remediation",
        name: "Execute Remediation Steps",
        description: "Run playbook steps against the affected resource.",
        handler: "remediation:execute",
        parameters: {},
        toolsUsed: ["resource-manager"],
        expectedOutput: "Remediation execution result",
      },
      {
        id: "step:log-outcome",
        name: "Log Outcome",
        description: "Record the remediation result against the violation record.",
        handler: "remediation:log-outcome",
        parameters: {},
        toolsUsed: ["audit-writer"],
        expectedOutput: "Outcome log entry",
      },
    ],
    toolsUsed: ["policy-engine", "playbook-store", "resource-manager", "audit-writer"],
    expectedOutputs: ["Remediation result", "Audit log entry", "Escalation notice if required"],
    successCriteria: [
      {
        criterion: "violation_resolved",
        description: "Violation status transitions to resolved or escalated.",
      },
      {
        criterion: "audit_logged",
        description: "Full audit entry is written regardless of outcome.",
      },
    ],
    failureConditions: [
      {
        condition: "no_playbook_found",
        description: "No remediation playbook matches the violation class.",
        recoveryHint: "Add a playbook for this policy or escalate manually.",
      },
      {
        condition: "resource_unreachable",
        description: "The affected resource cannot be accessed for remediation.",
        recoveryHint: "Check resource connectivity and re-run after access is restored.",
      },
    ],
    performance: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgLatencyMs: 0,
    },
    isBuiltin: true,
    enabled: true,
    version: "1.0.0",
    tags: ["remediation", "policy", "compliance", "playbook"],
    createdAt: NOW,
    updatedAt: NOW,
  },

  {
    id: "builtin:executive-brief:daily-intelligence-brief",
    name: "Daily Executive Intelligence Brief",
    description:
      "Assembles a concise, prioritised intelligence brief for senior leadership by aggregating domain signals, risk alerts, and recommended actions.",
    category: "executive-brief",
    objective:
      "Deliver a daily one-page brief that surfaces the highest-priority signals, decisions needed, and context for executive action.",
    inputFields: ["domains", "recipientRole", "maxItems", "date"],
    steps: [
      {
        id: "step:aggregate-signals",
        name: "Aggregate Domain Signals",
        description: "Pull active alerts and signals across requested domains.",
        handler: "executive-brief:aggregate-signals",
        parameters: {},
        toolsUsed: ["signal-aggregator"],
        expectedOutput: "Raw signal list with severity labels",
      },
      {
        id: "step:prioritise",
        name: "Prioritise by Impact & Urgency",
        description: "Score and rank signals by business impact and time sensitivity.",
        handler: "executive-brief:prioritise",
        parameters: { topN: 5 },
        toolsUsed: ["priority-scorer"],
        expectedOutput: "Top-N prioritised signals",
      },
      {
        id: "step:draft-brief",
        name: "Draft Brief",
        description: "Generate a structured markdown brief with sections for context, risks, and actions.",
        handler: "executive-brief:draft",
        parameters: {},
        toolsUsed: ["llm-synthesis"],
        expectedOutput: "Formatted executive brief",
      },
      {
        id: "step:quality-gate",
        name: "Quality Gate",
        description: "Validate brief length, tone, and completeness before delivery.",
        handler: "executive-brief:quality-gate",
        parameters: { minWords: 150, maxWords: 500 },
        toolsUsed: ["content-validator"],
        expectedOutput: "Validation pass/fail with notes",
      },
    ],
    toolsUsed: ["signal-aggregator", "priority-scorer", "llm-synthesis", "content-validator"],
    expectedOutputs: [
      "Executive brief document",
      "Top-N signal list",
      "Recommended actions",
    ],
    successCriteria: [
      {
        criterion: "brief_word_count",
        description: "Brief contains between 150 and 500 words.",
      },
      {
        criterion: "actions_present",
        description: "At least one recommended action is included.",
      },
      {
        criterion: "signals_cited",
        description: "Every top-N signal is referenced in the brief.",
      },
    ],
    failureConditions: [
      {
        condition: "no_active_signals",
        description: "No signals were found for the requested domains.",
        recoveryHint: "Verify domain names and signal ingestion pipelines.",
      },
      {
        condition: "quality_gate_failed",
        description: "Generated brief did not pass the quality gate.",
        recoveryHint: "Re-run synthesis with tighter constraints or manually review.",
      },
    ],
    performance: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgLatencyMs: 0,
    },
    isBuiltin: true,
    enabled: true,
    version: "1.0.0",
    tags: ["executive-brief", "intelligence", "daily", "leadership"],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export function seedBuiltinSkills(registry: SkillRegistry): void {
  for (const skill of builtinSkills) {
    registry.registerSkill(skill);
  }
}
