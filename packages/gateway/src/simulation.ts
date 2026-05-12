/**
 * SZL Holdings — Agent Gateway: Impact Simulation
 * Phase 11 — Agent Gateway
 *
 * Simulates the impact of an agent action BEFORE any execution.
 * Returns a risk assessment, affected resource list, and warnings.
 * No actual change is made — this is always a dry-run.
 */

import type { AgentActionRequest, SimulationResult } from './types.js';

// ---------------------------------------------------------------------------
// Risk scoring by capability and environment
// ---------------------------------------------------------------------------

const BASE_RISK: Record<string, SimulationResult['riskLevel']> = {
  inspect_code: 'low',
  inspect_manifests: 'low',
  analyze_telemetry: 'low',
  summarize_incidents: 'low',
  draft_runbooks: 'low',
  generate_documentation: 'low',
  generate_test_plans: 'low',
  draft_prs: 'medium',
  propose_policy_fixes: 'medium',
  propose_architecture_diffs: 'medium',
};

function elevateRisk(
  base: SimulationResult['riskLevel'],
  environment: string,
): SimulationResult['riskLevel'] {
  if (environment === 'production') {
    const table: Record<SimulationResult['riskLevel'], SimulationResult['riskLevel']> = {
      low: 'medium',
      medium: 'high',
      high: 'critical',
      critical: 'critical',
    };
    return table[base];
  }
  if (environment === 'staging') {
    const table: Record<SimulationResult['riskLevel'], SimulationResult['riskLevel']> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical',
    };
    return table[base];
  }
  return base;
}

// ---------------------------------------------------------------------------
// Affected resource inference by capability
// ---------------------------------------------------------------------------

function inferAffectedResources(request: AgentActionRequest): string[] {
  const target = request.target;
  const domain = request.domain;

  switch (request.capability) {
    case 'inspect_code':
      return [`source:${target}`];
    case 'inspect_manifests':
      return [`manifest:${target}`, `catalog:${domain}`];
    case 'analyze_telemetry':
      return [`observability:${domain}`, `traces:${target}`];
    case 'summarize_incidents':
      return [`incidents:${domain}`, `alerts:${target}`];
    case 'draft_runbooks':
      return [`docs:runbooks/${domain}`, `source:${target}`];
    case 'draft_prs':
      return [`scm:pr/${target}`, `source:${target}`];
    case 'propose_policy_fixes':
      return [`policy:${domain}`, `manifest:${target}`];
    case 'generate_documentation':
      return [`docs:${domain}/${target}`];
    case 'generate_test_plans':
      return [`tests:${target}`, `source:${target}`];
    case 'propose_architecture_diffs':
      return [`docs:architecture`, `manifest:${target}`, `catalog:${domain}`];
    default:
      return [`resource:${target}`];
  }
}

// ---------------------------------------------------------------------------
// Warning generation
// ---------------------------------------------------------------------------

function generateWarnings(request: AgentActionRequest, riskLevel: SimulationResult['riskLevel']): string[] {
  const warnings: string[] = [];

  if (request.targetEnvironment === 'production') {
    warnings.push('Action targets production environment — human approval required before any derivative change is applied.');
  }

  if (riskLevel === 'high' || riskLevel === 'critical') {
    warnings.push('Risk level is elevated. Ensure evidence record and rollback path are reviewed before approval.');
  }

  if (['draft_prs', 'propose_policy_fixes', 'propose_architecture_diffs'].includes(request.capability)) {
    warnings.push('Output is advisory only. No PR, policy change, or diff is applied without explicit human action and PR flow approval.');
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Public simulation entry point
// ---------------------------------------------------------------------------

export function simulateImpact(request: AgentActionRequest): SimulationResult {
  const baseRisk = BASE_RISK[request.capability] ?? 'medium';
  const riskLevel = elevateRisk(baseRisk, request.targetEnvironment);
  const affectedResources = inferAffectedResources(request);
  const warnings = generateWarnings(request, riskLevel);

  const impactSummaries: Record<string, string> = {
    inspect_code: `Read-only inspection of source code at '${request.target}'. No write operations. No data leaves the gateway context.`,
    inspect_manifests: `Read-only inspection of manifests for '${request.target}' in domain '${request.domain}'. No mutations.`,
    analyze_telemetry: `Analysis of telemetry signals for '${request.target}'. Query-only access to observability store.`,
    summarize_incidents: `Summarization of incident records for '${request.target}'. Read-only access to incident store.`,
    draft_runbooks: `Generation of runbook draft for '${request.target}'. Output is advisory text; no file is committed without PR flow.`,
    draft_prs: `Draft of a pull request for '${request.target}'. No PR is opened without human review and explicit PR-flow approval.`,
    propose_policy_fixes: `Proposal of policy updates for '${request.domain}'. No policy is applied without policy-approver sign-off.`,
    generate_documentation: `Generation of documentation for '${request.target}'. Output is advisory text; no commit without PR flow.`,
    generate_test_plans: `Generation of test plan for '${request.target}'. Advisory output only; no tests are executed or modified.`,
    propose_architecture_diffs: `Proposal of architecture changes for '${request.target}'. Advisory diff only; no infrastructure change without approval.`,
  };

  return {
    safe: riskLevel !== 'critical',
    impactSummary: impactSummaries[request.capability] ?? `Advisory action on '${request.target}'.`,
    affectedResources,
    riskLevel,
    warnings,
  };
}
