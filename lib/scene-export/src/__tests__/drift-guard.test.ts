import { describe, expect, it } from 'vitest';
import { BranchPackageAdapter, exportBranchPackage } from '../adapters/branch-package.js';
import type { BranchPackage } from '../types.js';

const baseBranch: BranchPackage = {
  parentSceneId: 'scene-001',
  branchId: 'branch-isolate-001',
  branchLabel: 'Network Isolation Path',
  domain: 'security',
  branchedAt: new Date().toISOString(),
  hypothesis: 'Isolate ERP Server to prevent lateral movement',
  deltaState: {
    containmentStatus: 'full',
    isolatedSystems: ['ERP Server'],
    estimatedRecoveryHours: 48,
  },
  outcomeProjections: [
    {
      label: 'Successful isolation',
      probability: 0.72,
      impact: 'high — prevents $2.4M ransomware payout',
      metrics: { recoveryHours: 48, dataLossGb: 200, estimatedCostUsd: 180000 },
    },
    {
      label: 'Isolation fails',
      probability: 0.28,
      impact: 'critical — financial system breach',
      metrics: { recoveryHours: 120, dataLossGb: 2400, estimatedCostUsd: 2400000 },
    },
  ],
  approvedBy: null,
  correlationId: 'corr-001',
  metadata: { test: true },
};

describe('Drift Guard — BranchPackageAdapter', () => {
  it('validates a well-formed branch package', () => {
    const adapter = new BranchPackageAdapter();
    expect(() => adapter.validate(baseBranch)).not.toThrow();
  });

  it('throws on missing parentSceneId', () => {
    const adapter = new BranchPackageAdapter();
    expect(() => adapter.validate({ ...baseBranch, parentSceneId: '' })).toThrow(
      'parentSceneId is required',
    );
  });

  it('throws on missing branchId', () => {
    const adapter = new BranchPackageAdapter();
    expect(() => adapter.validate({ ...baseBranch, branchId: '' })).toThrow('branchId is required');
  });

  it('throws on missing hypothesis', () => {
    const adapter = new BranchPackageAdapter();
    expect(() => adapter.validate({ ...baseBranch, hypothesis: '' })).toThrow(
      'hypothesis is required',
    );
  });

  it('throws when outcomeProjections is not an array', () => {
    const adapter = new BranchPackageAdapter();
    expect(() =>
      adapter.validate({ ...baseBranch, outcomeProjections: null as unknown as [] }),
    ).toThrow('outcomeProjections must be an array');
  });

  it("infers 'critical' risk level from critical impact label", () => {
    const adapter = new BranchPackageAdapter();
    const criticalBranch: BranchPackage = {
      ...baseBranch,
      outcomeProjections: [
        { label: 'Breach', probability: 0.9, impact: 'critical breach', metrics: {} },
      ],
    };
    const output = adapter.serialize(criticalBranch);
    expect(output.comparisonSummary.riskLevel).toBe('critical');
  });

  it("infers 'high' risk level from high impact label", () => {
    const adapter = new BranchPackageAdapter();
    const highBranch: BranchPackage = {
      ...baseBranch,
      outcomeProjections: [
        { label: 'Breach', probability: 0.9, impact: 'high severity event', metrics: {} },
      ],
    };
    const output = adapter.serialize(highBranch);
    expect(output.comparisonSummary.riskLevel).toBe('high');
  });

  it("infers 'low' risk level when projections are absent", () => {
    const adapter = new BranchPackageAdapter();
    const output = adapter.serialize({ ...baseBranch, outcomeProjections: [] });
    expect(output.comparisonSummary.riskLevel).toBe('low');
  });

  it('serializes correct deltaKeyCount', () => {
    const adapter = new BranchPackageAdapter();
    const output = adapter.serialize(baseBranch);
    expect(output.comparisonSummary.deltaKeyCount).toBe(3);
  });

  it('serializes hasApproval as false when approvedBy is null', () => {
    const adapter = new BranchPackageAdapter();
    const output = adapter.serialize(baseBranch);
    expect(output.comparisonSummary.hasApproval).toBe(false);
  });

  it('serializes hasApproval as true when approvedBy is set', () => {
    const adapter = new BranchPackageAdapter();
    const output = adapter.serialize({ ...baseBranch, approvedBy: 'user@example.com' });
    expect(output.comparisonSummary.hasApproval).toBe(true);
  });

  it('returns a valid ExportAdapterResult from exportBranchPackage', () => {
    const result = exportBranchPackage(baseBranch);
    expect(result.format).toBe('branch_package');
    expect(result.adapterVersion).toBe('1.0.0');
    expect(result.sizeEstimateBytes!).toBeGreaterThan(0);
  });
});
