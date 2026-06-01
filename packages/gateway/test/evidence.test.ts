/**
 * Agent Gateway — Evidence Attachment Tests
 * Phase 11 — Agent Gateway
 *
 * Tests: evidence record assembly, rollback path derivation,
 * immutability of key fields.
 */

import { describe, it, expect } from 'vitest';
import { attachEvidence } from '../src/evidence.js';
import { simulateImpact } from '../src/simulation.js';
import { buildPlan } from '../src/planner.js';
import { buildDiff } from '../src/differ.js';
import type { AgentActionRequest, CallerIdentity, OpaDecision } from '../src/types.js';

const REQUEST: AgentActionRequest = {
  correlationId: 'test-corr-001',
  capability: 'draft_prs',
  model: 'gpt-4o',
  promptHash: 'abcdef123456',
  target: 'api-server',
  targetEnvironment: 'development',
  domain: 'platform',
  parameters: { prompt: 'Fix the auth redirect' },
  requestedAt: new Date().toISOString(),
};

const CALLER: CallerIdentity = {
  sub: 'eng@szl.io',
  role: 'platform-engineer',
  groups: ['platform-team'],
  orgId: 'szl-holdings',
  iat: Math.floor(Date.now() / 1000) - 10,
  exp: Math.floor(Date.now() / 1000) + 3600,
};

const DECISION: OpaDecision = {
  allowed: true,
  requiredApprovals: 0,
  requiredGroups: [],
  policyId: 'szl.agent-gateway.draft_prs',
  evaluatedAt: new Date().toISOString(),
  reasons: [],
};

describe('attachEvidence', () => {
  it('produces a complete evidence record', () => {
    const simulation = simulateImpact(REQUEST);
    const plan = buildPlan(REQUEST, DECISION);
    const diff = buildDiff(REQUEST);
    const evidence = attachEvidence(REQUEST, CALLER, DECISION, simulation, plan, diff);

    expect(evidence.evidenceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(evidence.correlationId).toBe(REQUEST.correlationId);
    expect(evidence.capability).toBe('draft_prs');
    expect(evidence.model).toBe('gpt-4o');
    expect(evidence.promptHash).toBe(REQUEST.promptHash);
    expect(evidence.actor).toBe(CALLER.sub);
    expect(evidence.target).toBe(REQUEST.target);
    expect(evidence.domain).toBe(REQUEST.domain);
    expect(evidence.rollbackPath).not.toHaveLength(0);
    expect(evidence.createdAt).toMatch(/^\d{4}-/);
  });

  it('includes simulation result in evidence', () => {
    const simulation = simulateImpact(REQUEST);
    const plan = buildPlan(REQUEST, DECISION);
    const diff = buildDiff(REQUEST);
    const evidence = attachEvidence(REQUEST, CALLER, DECISION, simulation, plan, diff);
    expect(evidence.simulationResult.riskLevel).toBeDefined();
  });

  it('includes policy decision in evidence', () => {
    const simulation = simulateImpact(REQUEST);
    const plan = buildPlan(REQUEST, DECISION);
    const diff = buildDiff(REQUEST);
    const evidence = attachEvidence(REQUEST, CALLER, DECISION, simulation, plan, diff);
    expect(evidence.policyDecision.policyId).toBe(DECISION.policyId);
  });

  it('includes a non-empty rollback path for draft_prs', () => {
    const simulation = simulateImpact(REQUEST);
    const plan = buildPlan(REQUEST, DECISION);
    const diff = buildDiff(REQUEST);
    const evidence = attachEvidence(REQUEST, CALLER, DECISION, simulation, plan, diff);
    expect(evidence.rollbackPath).toContain('PR');
  });

  it('returns read-only rollback path for inspect_code', () => {
    const req = { ...REQUEST, capability: 'inspect_code' };
    const simulation = simulateImpact(req);
    const plan = buildPlan(req, DECISION);
    const diff = buildDiff(req);
    const evidence = attachEvidence(req, CALLER, DECISION, simulation, plan, diff);
    expect(evidence.rollbackPath).toContain('No rollback required');
  });
});
