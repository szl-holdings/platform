import type { ExportAdapterContract, ExportAdapterResult, ProofBundle } from '../types.js';

const ADAPTER_NAME = 'ProofBundleAdapter';
const ADAPTER_VERSION = '1.0.0';

export interface ProofBundleOutput {
  $schema: string;
  adapterVersion: string;
  format: 'proof_bundle';
  bundle: ProofBundle;
  integrity: {
    citationCount: number;
    approvalSteps: number;
    isFullyApproved: boolean;
    finalDecision: 'approved' | 'rejected' | 'escalated' | 'pending';
    confidenceScore: number;
  };
  exportedAt: string;
}

function computeIntegrity(bundle: ProofBundle): ProofBundleOutput['integrity'] {
  const steps = bundle.approvalChain.length;
  const lastDecision = bundle.approvalChain[steps - 1]?.decision ?? 'pending';
  const isFullyApproved = steps > 0 && lastDecision === 'approved';

  return {
    citationCount: bundle.citations.length,
    approvalSteps: steps,
    isFullyApproved,
    finalDecision: lastDecision as ProofBundleOutput['integrity']['finalDecision'],
    confidenceScore: bundle.confidenceScore,
  };
}

export class ProofBundleAdapter implements ExportAdapterContract<ProofBundle, ProofBundleOutput> {
  readonly adapterName = ADAPTER_NAME;
  readonly adapterVersion = ADAPTER_VERSION;
  readonly outputFormat = 'proof_bundle';

  validate(input: ProofBundle): void {
    if (!input.bundleId) throw new Error('ProofBundleAdapter: bundleId is required');
    if (!input.contentId) throw new Error('ProofBundleAdapter: contentId is required');
    if (!input.contentType) throw new Error('ProofBundleAdapter: contentType is required');
    if (
      typeof input.confidenceScore !== 'number' ||
      input.confidenceScore < 0 ||
      input.confidenceScore > 1
    ) {
      throw new Error('ProofBundleAdapter: confidenceScore must be a number between 0 and 1');
    }
    if (!Array.isArray(input.citations)) {
      throw new Error('ProofBundleAdapter: citations must be an array');
    }
    if (!Array.isArray(input.approvalChain)) {
      throw new Error('ProofBundleAdapter: approvalChain must be an array');
    }
  }

  serialize(input: ProofBundle): ProofBundleOutput {
    this.validate(input);
    return {
      $schema: 'https://szlholdings.com/schemas/atlas/proof-bundle/v1.json',
      adapterVersion: ADAPTER_VERSION,
      format: 'proof_bundle',
      bundle: {
        bundleId: input.bundleId,
        contentId: input.contentId,
        contentType: input.contentType,
        sourceClass: input.sourceClass,
        confidenceScore: input.confidenceScore,
        serviceAttribution: input.serviceAttribution,
        modelVersion: input.modelVersion ?? null,
        citations: input.citations,
        approvalChain: input.approvalChain,
        generatedAt: input.generatedAt,
        correlationId: input.correlationId ?? null,
        metadata: input.metadata ?? {},
      },
      integrity: computeIntegrity(input),
      exportedAt: new Date().toISOString(),
    };
  }

  toExportResult(input: ProofBundle): ExportAdapterResult {
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

export function exportProofBundle(input: ProofBundle): ExportAdapterResult {
  return new ProofBundleAdapter().toExportResult(input);
}
