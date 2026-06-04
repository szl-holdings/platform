import type { BranchPackage, ExportAdapterContract, ExportAdapterResult } from '../types.js';

const ADAPTER_NAME = 'BranchPackageAdapter';
const ADAPTER_VERSION = '1.0.0';

export interface BranchPackageOutput {
  $schema: string;
  adapterVersion: string;
  format: 'branch_package';
  branch: BranchPackage;
  comparisonSummary: {
    deltaKeyCount: number;
    projectionCount: number;
    hasApproval: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  exportedAt: string;
}

function inferRiskLevel(pkg: BranchPackage): 'low' | 'medium' | 'high' | 'critical' {
  const topProjection = pkg.outcomeProjections
    .slice()
    .sort((a, b) => b.probability - a.probability)[0];

  if (!topProjection) return 'low';

  const impact = topProjection.impact.toLowerCase();
  if (impact.includes('critical') || impact.includes('catastrophic')) return 'critical';
  if (impact.includes('high') || impact.includes('severe')) return 'high';
  if (impact.includes('medium') || impact.includes('moderate')) return 'medium';
  return 'low';
}

export class BranchPackageAdapter
  implements ExportAdapterContract<BranchPackage, BranchPackageOutput>
{
  readonly adapterName = ADAPTER_NAME;
  readonly adapterVersion = ADAPTER_VERSION;
  readonly outputFormat = 'branch_package';

  validate(input: BranchPackage): void {
    if (!input.parentSceneId) throw new Error('BranchPackageAdapter: parentSceneId is required');
    if (!input.branchId) throw new Error('BranchPackageAdapter: branchId is required');
    if (!input.branchLabel) throw new Error('BranchPackageAdapter: branchLabel is required');
    if (!input.hypothesis) throw new Error('BranchPackageAdapter: hypothesis is required');
    if (!Array.isArray(input.outcomeProjections)) {
      throw new Error('BranchPackageAdapter: outcomeProjections must be an array');
    }
  }

  serialize(input: BranchPackage): BranchPackageOutput {
    this.validate(input);
    return {
      $schema: 'https://szlholdings.com/schemas/atlas/branch-package/v1.json',
      adapterVersion: ADAPTER_VERSION,
      format: 'branch_package',
      branch: {
        parentSceneId: input.parentSceneId,
        branchId: input.branchId,
        branchLabel: input.branchLabel,
        domain: input.domain,
        branchedAt: input.branchedAt,
        hypothesis: input.hypothesis,
        deltaState: input.deltaState,
        outcomeProjections: input.outcomeProjections,
        approvedBy: input.approvedBy ?? null,
        correlationId: input.correlationId ?? null,
        metadata: input.metadata ?? {},
      },
      comparisonSummary: {
        deltaKeyCount: Object.keys(input.deltaState).length,
        projectionCount: input.outcomeProjections.length,
        hasApproval: !!input.approvedBy,
        riskLevel: inferRiskLevel(input),
      },
      exportedAt: new Date().toISOString(),
    };
  }

  toExportResult(input: BranchPackage): ExportAdapterResult {
    const output = this.serialize(input);
    const json = JSON.stringify(output, null, 2);
    return {
      format: this.outputFormat,
      payload: output,
      sizeEstimateBytes: Buffer.byteLength(json, 'utf8'),
      generatedAt: output.exportedAt,
      adapterVersion: ADAPTER_VERSION,
    };
  }
}

export function exportBranchPackage(input: BranchPackage): ExportAdapterResult {
  return new BranchPackageAdapter().toExportResult(input);
}
