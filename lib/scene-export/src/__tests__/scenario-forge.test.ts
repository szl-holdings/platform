import { describe, expect, it } from 'vitest';
import { exportProofBundle, ProofBundleAdapter } from '../adapters/proof-bundle.js';
import type { ProofBundle } from '../types.js';

const baseBundle: ProofBundle = {
  bundleId: 'bundle-001',
  contentId: 'artifact-042',
  contentType: 'atlas_artifact',
  sourceClass: 'llm_generated',
  confidenceScore: 0.87,
  serviceAttribution: 'scenario-forge',
  modelVersion: 'gpt-4o-2024-11-20',
  citations: [
    {
      source: 'MITRE ATT&CK T1486',
      excerpt: 'Ransomware encryption technique',
      url: 'https://attack.mitre.org/techniques/T1486',
    },
    { source: 'NIST SP 800-61r2', excerpt: 'Computer Security Incident Handling Guide' },
  ],
  approvalChain: [
    {
      approverRole: 'security_lead',
      approvedAt: new Date().toISOString(),
      decision: 'approved',
      rationale:
        'Network isolation is the safest containment path given current lateral movement indicators',
    },
  ],
  generatedAt: new Date().toISOString(),
  correlationId: 'corr-bundle-001',
  metadata: { test: true },
};

describe('Scenario Forge — ProofBundleAdapter', () => {
  it('validates a well-formed proof bundle', () => {
    const adapter = new ProofBundleAdapter();
    expect(() => adapter.validate(baseBundle)).not.toThrow();
  });

  it('throws on missing bundleId', () => {
    const adapter = new ProofBundleAdapter();
    expect(() => adapter.validate({ ...baseBundle, bundleId: '' })).toThrow('bundleId is required');
  });

  it('throws on missing contentId', () => {
    const adapter = new ProofBundleAdapter();
    expect(() => adapter.validate({ ...baseBundle, contentId: '' })).toThrow(
      'contentId is required',
    );
  });

  it('throws when confidenceScore is below 0', () => {
    const adapter = new ProofBundleAdapter();
    expect(() => adapter.validate({ ...baseBundle, confidenceScore: -0.1 })).toThrow(
      'confidenceScore must be a number between 0 and 1',
    );
  });

  it('throws when confidenceScore exceeds 1', () => {
    const adapter = new ProofBundleAdapter();
    expect(() => adapter.validate({ ...baseBundle, confidenceScore: 1.01 })).toThrow(
      'confidenceScore must be a number between 0 and 1',
    );
  });

  it('throws when citations is not an array', () => {
    const adapter = new ProofBundleAdapter();
    expect(() => adapter.validate({ ...baseBundle, citations: null as unknown as [] })).toThrow(
      'citations must be an array',
    );
  });

  it('throws when approvalChain is not an array', () => {
    const adapter = new ProofBundleAdapter();
    expect(() => adapter.validate({ ...baseBundle, approvalChain: null as unknown as [] })).toThrow(
      'approvalChain must be an array',
    );
  });

  it('computes citationCount correctly', () => {
    const adapter = new ProofBundleAdapter();
    const output = adapter.serialize(baseBundle);
    expect(output.integrity.citationCount).toBe(2);
  });

  it('computes approvalSteps correctly', () => {
    const adapter = new ProofBundleAdapter();
    const output = adapter.serialize(baseBundle);
    expect(output.integrity.approvalSteps).toBe(1);
  });

  it('marks isFullyApproved true when last decision is approved', () => {
    const adapter = new ProofBundleAdapter();
    const output = adapter.serialize(baseBundle);
    expect(output.integrity.isFullyApproved).toBe(true);
  });

  it('marks isFullyApproved false when approval chain is empty', () => {
    const adapter = new ProofBundleAdapter();
    const output = adapter.serialize({ ...baseBundle, approvalChain: [] });
    expect(output.integrity.isFullyApproved).toBe(false);
  });

  it('marks finalDecision as pending when approval chain is empty', () => {
    const adapter = new ProofBundleAdapter();
    const output = adapter.serialize({ ...baseBundle, approvalChain: [] });
    expect(output.integrity.finalDecision).toBe('pending');
  });

  it('marks finalDecision as rejected when last step is rejected', () => {
    const adapter = new ProofBundleAdapter();
    const output = adapter.serialize({
      ...baseBundle,
      approvalChain: [{ ...baseBundle.approvalChain[0], decision: 'rejected' as const }],
    });
    expect(output.integrity.finalDecision).toBe('rejected');
  });

  it('returns confidence score in integrity summary', () => {
    const adapter = new ProofBundleAdapter();
    const output = adapter.serialize(baseBundle);
    expect(output.integrity.confidenceScore).toBe(0.87);
  });

  it('includes correct schema and format', () => {
    const adapter = new ProofBundleAdapter();
    const output = adapter.serialize(baseBundle);
    expect(output.$schema).toContain('proof-bundle');
    expect(output.format).toBe('proof_bundle');
  });

  it('returns a valid ExportAdapterResult from exportProofBundle', () => {
    const result = exportProofBundle(baseBundle);
    expect(result.format).toBe('proof_bundle');
    expect(result.adapterVersion).toBe('1.0.0');
    expect(result.sizeEstimateBytes!).toBeGreaterThan(0);
  });
});
