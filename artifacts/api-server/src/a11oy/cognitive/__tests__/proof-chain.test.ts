import { describe, it, expect } from 'vitest';
import { createProofChain, verifyProofChainIntegrity } from '../proof-chain.js';
import type { PhaseResult } from '../types.js';

const TENANT = 'tenant-proof-test';

function mockPhase(phase: string, status = 'completed'): PhaseResult {
  return {
    phaseRunId: `pr-${phase.toLowerCase()}-001`,
    requestId: 'req-proof-001',
    phase: phase as PhaseResult['phase'],
    phaseIndex: 0,
    status: status as PhaseResult['status'],
    latencyMs: 120,
    retryCount: 0,
    failureClass: 'none',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    telemetry: {},
  };
}

describe('ProofChain', () => {
  it('creates a proof chain with a non-empty audit hash', () => {
    const proof = createProofChain({
      requestId: 'req-001',
      tenantId: TENANT,
      model: 'claude-sonnet-4',
      provider: 'anthropic',
    });
    expect(proof.proofChainId).toMatch(/^pch-/);
    expect(proof.auditHash).toHaveLength(64);
    expect(proof.auditHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('includes sealed proof even on execution failure', () => {
    const proof = createProofChain({
      requestId: 'req-fail-001',
      tenantId: TENANT,
      executionSucceeded: false,
      failureReason: 'model_timeout',
    });
    expect(proof.proofChainId).toBeDefined();
    expect(proof.executionSucceeded).toBe(false);
    expect(proof.failureReason).toBe('model_timeout');
    expect(proof.auditHash).toHaveLength(64);
    expect(proof.sealedAt).toBeDefined();
  });

  it('completedPhases only contains successful phases', () => {
    const phases: PhaseResult[] = [
      mockPhase('INGEST', 'completed'),
      mockPhase('NORMALIZE', 'completed'),
      mockPhase('RETRIEVE', 'failed'),
      mockPhase('PLAN', 'skipped'),
    ];
    const proof = createProofChain({
      requestId: 'req-phases-001',
      tenantId: TENANT,
      phases,
    });
    expect(proof.completedPhases).toContain('INGEST');
    expect(proof.completedPhases).toContain('NORMALIZE');
    expect(proof.completedPhases).not.toContain('RETRIEVE');
    expect(proof.completedPhases).not.toContain('PLAN');
    expect(proof.phaseCount).toBe(4);
  });

  it('audit hash integrity check passes for unmodified record', () => {
    const proof = createProofChain({
      requestId: 'req-integrity-001',
      tenantId: TENANT,
      model: 'o3',
      provider: 'openai',
      routeDecisionId: 'rd-abc123',
    });
    const { valid } = verifyProofChainIntegrity(proof);
    expect(valid).toBe(true);
  });

  it('audit hash integrity check fails when lineage is tampered', () => {
    const proof = createProofChain({
      requestId: 'req-tamper-001',
      tenantId: TENANT,
    });
    const tampered = { ...proof, lineage: [...proof.lineage, { step: 'injected_evil' }] };
    const { valid } = verifyProofChainIntegrity(tampered);
    expect(valid).toBe(false);
  });

  it('two proof chains for different requests always produce different hashes', () => {
    const p1 = createProofChain({ requestId: 'req-unique-A', tenantId: TENANT });
    const p2 = createProofChain({ requestId: 'req-unique-B', tenantId: TENANT });
    expect(p1.auditHash).not.toBe(p2.auditHash);
  });
});
