export type ReceiptClass =
  | 'recommendation'
  | 'artifact'
  | 'decision'
  | 'action'
  | 'analysis'
  | 'alert'
  | 'approval'
  | 'export';

export type ReceiptStatus =
  | 'generated'
  | 'approved'
  | 'rejected'
  | 'retracted'
  | 'superseded'
  | 'pending_review';

export type PolicyClass =
  | 'auto_approve'
  | 'require_human'
  | 'require_executive'
  | 'require_dual_sign'
  | 'blocked'
  | 'audit_only';

export type ConfidenceTier = 'high' | 'medium' | 'low' | 'uncertain';

export interface ReceiptInputSource {
  type:
    | 'retrieval_chunk'
    | 'live_api'
    | 'database_query'
    | 'user_input'
    | 'model_output'
    | 'tool_result'
    | 'system_signal';
  id: string;
  label?: string;
  relevanceScore?: number;
  wasUsed: boolean;
}

export interface ReceiptAssumption {
  id: string;
  statement: string;
  basis: string;
  confidenceImpact: 'high' | 'medium' | 'low';
}

export interface PostExecutionDelta {
  field: string;
  before: unknown;
  after: unknown;
  changedAt: Date;
  changedByUserId?: number | null;
}

export interface TrustReceipt {
  id: string;
  orgId: number | null;
  contentId: string;
  contentType: string;
  receiptClass: ReceiptClass;
  status: ReceiptStatus;
  policyClass: PolicyClass;
  confidenceScore: number;
  confidenceTier: ConfidenceTier;
  modelId: string | null;
  modelProvider: string | null;
  modelVersion: string | null;
  modelLane: string | null;
  promptHash: string | null;
  correlationId: string | null;
  traceId: string | null;
  parentReceiptId: string | null;
  generatedByUserId: number | null;
  approvedByUserId: number | null;
  approvedAt: Date | null;
  approvalNote: string | null;
  whatWasSeen: ReceiptInputSource[];
  whatWasUsed: ReceiptInputSource[];
  whatWasIgnored: ReceiptInputSource[];
  assumptions: ReceiptAssumption[];
  postExecutionDeltas: PostExecutionDelta[];
  serviceAttribution: string | null;
  metadata: Record<string, unknown>;
  exportSafe: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustReceiptGraph {
  rootReceiptId: string;
  receipts: TrustReceipt[];
  edges: Array<{
    parentId: string;
    childId: string;
    relationship: 'derived_from' | 'informed_by' | 'supersedes' | 'validated_by';
  }>;
  depth: number;
}

export interface ReceiptSummary {
  id: string;
  contentId: string;
  contentType: string;
  receiptClass: ReceiptClass;
  status: ReceiptStatus;
  policyClass: PolicyClass;
  confidenceScore: number;
  confidenceTier: ConfidenceTier;
  modelId: string | null;
  modelProvider: string | null;
  approvedByUserId: number | null;
  exportSafe: boolean;
  createdAt: Date;
}

export interface AuditPacket {
  receiptId: string;
  exportedAt: Date;
  exportedByUserId?: number;
  orgId: number | null;
  receipt: TrustReceipt;
  graph: TrustReceiptGraph;
  attestation: string;
}

export interface ExecutiveTrustSummary {
  orgId: number | null;
  windowMs: number;
  totalReceipts: number;
  byClass: Record<ReceiptClass, number>;
  byStatus: Record<ReceiptStatus, number>;
  averageConfidence: number;
  highConfidenceCount: number;
  lowConfidenceCount: number;
  pendingApprovalCount: number;
  exportSafeCount: number;
  exportBlockedCount: number;
  topPolicyClasses: Array<{ policy: PolicyClass; count: number }>;
  recentReceipts: ReceiptSummary[];
}

export interface CreateReceiptParams {
  orgId?: number | null;
  contentId: string;
  contentType: string;
  receiptClass: ReceiptClass;
  policyClass?: PolicyClass;
  confidenceScore?: number;
  modelId?: string;
  modelProvider?: string;
  modelVersion?: string;
  modelLane?: string;
  promptText?: string;
  correlationId?: string;
  traceId?: string;
  parentReceiptId?: string;
  generatedByUserId?: number | null;
  serviceAttribution?: string;
  whatWasSeen?: ReceiptInputSource[];
  whatWasUsed?: ReceiptInputSource[];
  whatWasIgnored?: ReceiptInputSource[];
  assumptions?: ReceiptAssumption[];
  metadata?: Record<string, unknown>;
}

export interface ApproveReceiptParams {
  receiptId: string;
  approvedByUserId: number;
  approvalNote?: string;
  newStatus?: ReceiptStatus;
}

export interface RecordDeltaParams {
  receiptId: string;
  field: string;
  before: unknown;
  after: unknown;
  changedByUserId?: number;
}
