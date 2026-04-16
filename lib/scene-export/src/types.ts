export interface ExportAdapterResult {
  format: string;
  payload: unknown;
  sizeEstimateBytes?: number;
  generatedAt: string;
  adapterVersion: string;
  warnings?: string[];
}

export interface SceneSnapshot {
  sceneId: string;
  domain: string;
  entityType: string;
  entityId: string;
  capturedAt: string;
  state: Record<string, unknown>;
  driftScore?: number;
  proofChainId?: number | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface BranchPackage {
  parentSceneId: string;
  branchId: string;
  branchLabel: string;
  domain: string;
  branchedAt: string;
  hypothesis: string;
  deltaState: Record<string, unknown>;
  outcomeProjections: Array<{
    label: string;
    probability: number;
    impact: string;
    metrics: Record<string, number>;
  }>;
  approvedBy?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProofBundle {
  bundleId: string;
  contentId: string;
  contentType: string;
  sourceClass: string;
  confidenceScore: number;
  serviceAttribution: string;
  modelVersion?: string | null;
  citations: Array<{
    source: string;
    excerpt?: string;
    url?: string;
  }>;
  approvalChain: Array<{
    approverRole: string;
    approvedAt: string;
    decision: "approved" | "rejected" | "escalated";
    rationale?: string;
  }>;
  generatedAt: string;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface OpenUSDManifest {
  manifestVersion: string;
  stage: string;
  domain: string;
  layers: Array<{
    identifier: string;
    layerType: "root" | "sublayer" | "reference" | "payload";
    documentation?: string;
  }>;
  prims: Array<{
    path: string;
    typeName: string;
    attributes: Record<string, { type: string; value: unknown }>;
    metadata?: Record<string, unknown>;
  }>;
  customLayerData: {
    szlAtlasVersion: string;
    exportedAt: string;
    domain: string;
    entityId?: string;
    proofChainId?: number | null;
    notice: string;
  };
}

export interface ExportAdapterContract<TInput, TOutput> {
  readonly adapterName: string;
  readonly adapterVersion: string;
  readonly outputFormat: string;

  validate(input: TInput): void;
  serialize(input: TInput): TOutput;
  toExportResult(input: TInput): ExportAdapterResult;
}
