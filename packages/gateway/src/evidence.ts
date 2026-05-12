/**
 * SZL Holdings — Agent Gateway: Evidence Attachment
 * Phase 11 — Agent Gateway
 *
 * Assembles an immutable EvidenceRecord before any agent execution.
 * The evidence record is the primary artifact of the gateway: it ties
 * together caller identity, OPA decision, simulation result, action plan,
 * diff, and rollback path into a single attestation that is stored in the
 * audit ledger and referenced by the approval workflow.
 */

import { randomUUID } from 'crypto';
import type {
  AgentActionRequest,
  CallerIdentity,
  EvidenceRecord,
  OpaDecision,
  SimulationResult,
  ActionPlan,
  ManifestDiff,
  AllowedCapability,
} from './types.js';

// ---------------------------------------------------------------------------
// Rollback path derivation
// ---------------------------------------------------------------------------

function deriveRollbackPath(request: AgentActionRequest): string {
  const target = request.target;
  const domain = request.domain;
  const env = request.targetEnvironment;

  const paths: Record<string, string> = {
    inspect_code: 'No rollback required — read-only operation.',
    inspect_manifests: 'No rollback required — read-only operation.',
    analyze_telemetry: 'No rollback required — read-only operation.',
    summarize_incidents: 'No rollback required — read-only operation.',
    draft_runbooks: `Discard generated file at infra/runbooks/${domain}/${target}.md before any commit.`,
    draft_prs: `Close the draft PR without merging. No source changes committed until PR-flow approval is complete.`,
    propose_policy_fixes: `Delete the proposed Rego file at platform/policy/${domain}/agent-proposed-fix.rego. Existing policy remains unchanged.`,
    generate_documentation: `Discard the generated documentation file. No commit was made.`,
    generate_test_plans: `Discard the test plan document. No test files were modified.`,
    propose_architecture_diffs: `Discard the ADR document. No infrastructure change was applied.`,
  };

  return (
    paths[request.capability] ??
    `Advisory action — discard all output files for target '${target}' in '${env}'. No infrastructure was changed.`
  );
}

// ---------------------------------------------------------------------------
// Evidence record assembly
// ---------------------------------------------------------------------------

export function attachEvidence(
  request: AgentActionRequest,
  caller: CallerIdentity,
  decision: OpaDecision,
  simulation: SimulationResult,
  plan: ActionPlan,
  diff: ManifestDiff,
): EvidenceRecord {
  const evidenceId = randomUUID();

  return {
    evidenceId,
    correlationId: request.correlationId,
    capability: request.capability as AllowedCapability,
    model: request.model,
    promptHash: request.promptHash,
    actor: caller.sub,
    target: request.target,
    domain: request.domain,
    simulationResult: simulation,
    plan,
    diff,
    rollbackPath: deriveRollbackPath(request),
    policyDecision: decision,
    createdAt: new Date().toISOString(),
  };
}
