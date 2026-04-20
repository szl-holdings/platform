import type {
  DriftStatus,
  ModelLaneType,
  OverlaySignalType,
  SourceTrustClass,
  SpatialTwinCategory,
} from '@szl-holdings/db';

export type {
  DriftStatus,
  ModelLaneType,
  OverlaySignalType,
  SourceTrustClass,
  SpatialTwinCategory,
};

export interface SpatialCoordinates {
  lat: number;
  lon: number;
  alt?: number;
  timestamp: string;
}

export interface SpatialTwinSnapshot {
  id?: number;
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  sequenceNumber: number;
  state: Record<string, unknown>;
  predictedStates: Array<{
    timeHorizon: string;
    state: Record<string, unknown>;
    confidence: number;
    drivingFactors: string[];
    generatedAt: string;
  }>;
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    metric: string;
    currentValue: unknown;
    threshold: unknown;
    triggeredAt: string;
  }>;
  confidenceScore: number;
  parentSnapshotId?: number | null;
  derivedBranchId?: string | null;
  proofChainId?: number | null;
  modelLane?: string | null;
  promptHash?: string | null;
  renderedArtifactHash?: string | null;
  sourceEvidenceList: Array<{ type: string; id: string; label?: string }>;
  coordinates?: SpatialCoordinates | null;
  spatialContext: Record<string, unknown>;
  metadata: Record<string, unknown>;
  snapshotAt: string;
}

export interface SnapshotDelta {
  fromSnapshotId: number;
  toSnapshotId: number;
  twinId: string;
  changedFields: string[];
  deltaValues: Record<string, { before: unknown; after: unknown; changePercent?: number }>;
  confidenceDelta: number;
  alertsDelta: { added: string[]; removed: string[]; changed: string[] };
  computedAt: string;
}

export interface SceneMemorySlice {
  snapshotId: number;
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  overlapScore: number;
  recencyScore: number;
  trustWeight: number;
  causalRelevanceScore: number;
  compositeRankScore: number;
  retrievalTags: string[];
  state: Record<string, unknown>;
  snapshotAt: string;
}

export interface DriftAssessment {
  id?: number;
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  driftStatus: DriftStatus;
  driftScore: number;
  divergentFields: Array<{
    field: string;
    currentValue: unknown;
    trustedValue: unknown;
    divergenceScore: number;
  }>;
  trustedSourceDeltas: Array<{
    sourceId: string;
    sourceSlug: string;
    delta: Record<string, unknown>;
  }>;
  confidenceDowngradeReason?: string | null;
  originalConfidence: number;
  adjustedConfidence: number;
  blockedReason?: string | null;
  assessedAt: string;
}

export interface ScenarioBranch {
  id?: number;
  branchId: string;
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  name: string;
  description?: string | null;
  baselineSnapshotId?: number | null;
  branchSnapshotId?: number | null;
  parameters: Record<string, unknown>;
  deltaMetrics: Record<string, { before: unknown; after: unknown; changePercent?: number }>;
  riskAssessment?: string | null;
  recommendedActions: string[];
  confidenceScore: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'archived';
  proofChainId?: number | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown> | null;
  completedAt?: string | null;
  createdAt?: string | null;
}

export interface ScenarioBranchComparison {
  baseline: ScenarioBranch;
  branchA: ScenarioBranch;
  branchB?: ScenarioBranch;
  fieldComparisons: Record<
    string,
    {
      baseline: unknown;
      branchA: unknown;
      branchB?: unknown;
      unit?: string;
    }
  >;
  riskRanking: Array<{ branchId: string; riskScore: number; label: string }>;
  recommendation: string;
}

export interface SimulationArtifact {
  artifactId: string;
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  scenarioBranchId?: string | null;
  artifactType: 'snapshot' | 'branch_comparison' | 'drift_report' | 'replay_frame' | 'scene_memory';
  contentHash: string;
  payload: Record<string, unknown>;
  modelLane?: string | null;
  proofChainId?: number | null;
  generatedAt: string;
}

export interface EvidenceOverlay {
  overlayId: string;
  signalType: OverlaySignalType;
  sourceTrustClass: SourceTrustClass;
  signalTimestamp: string;
  expiresAt?: string | null;
  coordinates?: SpatialCoordinates | null;
  boundingRegion?: Record<string, unknown> | null;
  affectedEntityIds: string[];
  affectedTwinCategories: SpatialTwinCategory[];
  payload: Record<string, unknown>;
  confidenceScore: number;
  causalLinkage: Array<{ targetEntityId: string; linkType: string; strength: number }>;
  severity: 'info' | 'warning' | 'critical';
}

export interface SpatialRecommendation {
  recommendationId: string;
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  rationale: string;
  actions: string[];
  evidenceSources: Array<{ type: string; id: string; label?: string }>;
  confidenceScore: number;
  expiresAt?: string | null;
  generatedAt: string;
}

export interface ReplayFrame {
  frameIndex: number;
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  timestamp: string;
  state: Record<string, unknown>;
  alerts: Array<{ id: string; severity: string; message: string }>;
  confidenceScore: number;
  driftStatus?: DriftStatus | null;
  overlaysActive: string[];
  metadata: Record<string, unknown>;
}

export interface ReplayTimeline {
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  frames: ReplayFrame[];
  totalFrames: number;
  startAt: string;
  endAt: string;
  durationMs: number;
  snapshotIds: number[];
}

export interface ModelLaneMetadata {
  laneType: ModelLaneType;
  modelId: string;
  provider: string;
  latencyMs: number;
  confidenceContribution: number;
  costEstimateUsd: number;
  proofChainTraceable: boolean;
  nimAdapterAvailable: boolean;
}

export interface SceneMemoryQuery {
  twinId?: string;
  entityId?: string;
  twinCategory?: SpatialTwinCategory;
  orgId?: number;
  limit?: number;
  minCompositeScore?: number;
  tags?: string[];
  afterTimestamp?: string;
  beforeTimestamp?: string;
}

export interface DriftGuardInput {
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  orgId?: number;
  currentState: Record<string, unknown>;
  currentConfidence: number;
  currentSnapshotId?: number;
  approvedSnapshotId?: number;
  trustedSourceDeltas?: Array<{
    sourceId: string;
    sourceSlug: string;
    delta: Record<string, unknown>;
  }>;
}

export interface ScenarioForgeInput {
  twinId: string;
  entityId: string;
  twinCategory: SpatialTwinCategory;
  orgId?: number;
  baselineSnapshotId: number;
  branchName: string;
  branchDescription?: string;
  parameters: Record<string, unknown>;
  correlationId?: string;
  createdByUserId?: number;
}
