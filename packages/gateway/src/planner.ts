/**
 * SZL Holdings — Agent Gateway: Plan Generation
 * Phase 11 — Agent Gateway
 *
 * Generates a human-readable, step-by-step plan for an agent action
 * before execution. The plan is attached to the evidence record and
 * shown to approvers so they understand exactly what the agent will do.
 */

import type { AgentActionRequest, ActionPlan, OpaDecision } from './types.js';

// ---------------------------------------------------------------------------
// Step templates per capability
// ---------------------------------------------------------------------------

function buildSteps(request: AgentActionRequest): ActionPlan['steps'] {
  const target = request.target;
  const domain = request.domain;
  const env = request.targetEnvironment;

  const templates: Record<string, ActionPlan['steps']> = {
    inspect_code: [
      { order: 1, action: 'Fetch source', target, rationale: 'Load source files within allowed scope', reversible: true },
      { order: 2, action: 'Analyse structure', target, rationale: 'Identify patterns, dependencies, and concerns', reversible: true },
      { order: 3, action: 'Emit structured report', target, rationale: 'Return findings to caller; no mutation', reversible: true },
    ],
    inspect_manifests: [
      { order: 1, action: 'Load manifests', target: `${domain}/${target}`, rationale: 'Read catalog and deployment manifests', reversible: true },
      { order: 2, action: 'Validate against schema', target, rationale: 'Check manifest correctness', reversible: true },
      { order: 3, action: 'Return diff-ready snapshot', target, rationale: 'Provide current manifest state for comparison', reversible: true },
    ],
    analyze_telemetry: [
      { order: 1, action: 'Query observability store', target: `${domain} telemetry`, rationale: 'Read metrics and traces for target service', reversible: true },
      { order: 2, action: 'Identify anomalies', target, rationale: 'Statistical comparison against baseline', reversible: true },
      { order: 3, action: 'Return analysis report', target, rationale: 'Emit structured findings; no write', reversible: true },
    ],
    summarize_incidents: [
      { order: 1, action: 'Load incident records', target: `incidents/${domain}`, rationale: 'Query incident store for target scope', reversible: true },
      { order: 2, action: 'Generate timeline', target, rationale: 'Order events chronologically', reversible: true },
      { order: 3, action: 'Produce executive summary', target, rationale: 'Return natural-language summary with citations', reversible: true },
    ],
    draft_runbooks: [
      { order: 1, action: 'Inspect service topology', target, rationale: 'Understand dependencies and failure modes', reversible: true },
      { order: 2, action: 'Draft runbook sections', target, rationale: 'Generate step-by-step operational procedures', reversible: true },
      { order: 3, action: 'Attach to evidence record', target, rationale: 'Output ready for PR-flow submission', reversible: true },
    ],
    draft_prs: [
      { order: 1, action: 'Analyse change scope', target, rationale: 'Determine minimal diff to implement requested change', reversible: true },
      { order: 2, action: 'Generate patch', target, rationale: 'Produce unified diff; no write to SCM', reversible: true },
      { order: 3, action: 'Write PR description', target, rationale: 'Include context, risk, and rollback path', reversible: true },
      { order: 4, action: 'Attach for human review', target, rationale: 'No PR opened without explicit human action', reversible: true },
    ],
    propose_policy_fixes: [
      { order: 1, action: 'Load current policy bundle', target: `platform/policy/${domain}`, rationale: 'Read Rego policy and test corpus', reversible: true },
      { order: 2, action: 'Identify policy gaps', target, rationale: 'Compare against current violations and incidents', reversible: true },
      { order: 3, action: 'Draft Rego amendments', target, rationale: 'Generate updated rules with test cases', reversible: true },
      { order: 4, action: 'Emit proposal for policy-approver review', target, rationale: 'No policy applied without sign-off', reversible: true },
    ],
    generate_documentation: [
      { order: 1, action: 'Inspect source and catalog', target, rationale: 'Load component metadata and API spec', reversible: true },
      { order: 2, action: 'Generate documentation draft', target, rationale: 'Produce Markdown with accurate references', reversible: true },
      { order: 3, action: 'Return for PR-flow submission', target, rationale: 'No commit without human review', reversible: true },
    ],
    generate_test_plans: [
      { order: 1, action: 'Analyse existing test coverage', target, rationale: 'Load test files and coverage report', reversible: true },
      { order: 2, action: 'Identify coverage gaps', target, rationale: 'Map untested paths and edge cases', reversible: true },
      { order: 3, action: 'Draft test plan', target, rationale: 'Generate test scenarios with acceptance criteria', reversible: true },
      { order: 4, action: 'Return advisory document', target, rationale: 'No tests modified without human implementation', reversible: true },
    ],
    propose_architecture_diffs: [
      { order: 1, action: 'Load reference architecture', target: 'docs/reference-architecture-szl.md', rationale: 'Understand current target state', reversible: true },
      { order: 2, action: 'Analyse proposed change', target, rationale: 'Map impact across planes and services', reversible: true },
      { order: 3, action: 'Draft architecture diff', target, rationale: 'Produce ADR with rationale and trade-offs', reversible: true },
      { order: 4, action: 'Submit for architecture review', target, rationale: 'No change applied without approval', reversible: true },
    ],
  };

  return templates[request.capability] ?? [
    { order: 1, action: 'Execute advisory action', target, rationale: 'Advisory-only action; no production mutation', reversible: true },
  ];
}

// ---------------------------------------------------------------------------
// Public plan builder
// ---------------------------------------------------------------------------

export function buildPlan(request: AgentActionRequest, decision: OpaDecision): ActionPlan {
  const steps = buildSteps(request);
  const requiresApproval = decision.requiredApprovals > 0;

  const durationEstimates: Record<string, number> = {
    inspect_code: 5_000,
    inspect_manifests: 3_000,
    analyze_telemetry: 8_000,
    summarize_incidents: 6_000,
    draft_runbooks: 15_000,
    draft_prs: 20_000,
    propose_policy_fixes: 25_000,
    generate_documentation: 12_000,
    generate_test_plans: 18_000,
    propose_architecture_diffs: 30_000,
  };

  const summaries: Record<string, string> = {
    inspect_code: `Inspect source code at '${request.target}' and return a structured analysis report. Read-only. No data leaves the gateway context.`,
    inspect_manifests: `Inspect deployment manifests for '${request.target}' in the '${request.domain}' domain. Read-only.`,
    analyze_telemetry: `Analyse telemetry data for '${request.target}' in '${request.targetEnvironment}'. No write operations.`,
    summarize_incidents: `Summarise incident history for '${request.target}'. Advisory output only.`,
    draft_runbooks: `Draft an operational runbook for '${request.target}'. Output attached to evidence record for PR-flow submission.`,
    draft_prs: `Draft a pull request for change to '${request.target}'. No PR is opened without explicit human action through the PR-flow gate.`,
    propose_policy_fixes: `Propose Rego policy amendments for '${request.domain}'. No policy is applied without policy-approver sign-off.`,
    generate_documentation: `Generate documentation for '${request.target}'. Advisory text output; no commit without human review.`,
    generate_test_plans: `Generate a test plan for '${request.target}'. No test files are modified; advisory only.`,
    propose_architecture_diffs: `Propose architecture changes for '${request.target}'. Advisory ADR output; no infrastructure change without approval.`,
  };

  return {
    summary: summaries[request.capability] ?? `Advisory agent action on '${request.target}'.`,
    steps,
    estimatedDurationMs: durationEstimates[request.capability] ?? 10_000,
    requiresApproval,
    approvalGroups: decision.requiredGroups,
  };
}
