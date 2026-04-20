import { createHash, randomUUID } from 'crypto';
import type {
  ApproveReceiptParams,
  AuditPacket,
  ConfidenceTier,
  CreateReceiptParams,
  ExecutiveTrustSummary,
  PolicyClass,
  PostExecutionDelta,
  ReceiptClass,
  ReceiptInputSource,
  ReceiptStatus,
  ReceiptSummary,
  RecordDeltaParams,
  TrustReceipt,
  TrustReceiptGraph,
} from './types.js';

function computeConfidenceTier(score: number): ConfidenceTier {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  if (score >= 0.4) return 'low';
  return 'uncertain';
}

function derivePolicy(receiptClass: ReceiptClass, confidence: number): PolicyClass {
  if (receiptClass === 'action' || receiptClass === 'export') {
    if (confidence < 0.5) return 'blocked';
    if (confidence < 0.7) return 'require_human';
    return 'require_human';
  }
  if (receiptClass === 'decision' || receiptClass === 'approval') {
    if (confidence >= 0.85) return 'require_human';
    return 'require_human';
  }
  if (confidence >= 0.9) return 'audit_only';
  if (confidence >= 0.7) return 'audit_only';
  return 'require_human';
}

function deriveExportSafe(status: ReceiptStatus, confidence: number, policy: PolicyClass): boolean {
  if (status === 'retracted' || status === 'rejected') return false;
  if (policy === 'blocked') return false;
  if (status === 'approved') return true;
  if (confidence < 0.5) return false;
  if (status === 'generated' && policy === 'audit_only') return true;
  return false;
}

function computePromptHash(promptText: string): string {
  return createHash('sha256').update(promptText).digest('hex').slice(0, 16);
}

const MAX_RECEIPTS = 5000;
const MAX_EDGES = 10000;

interface ReceiptEdge {
  parentId: string;
  childId: string;
  relationship: 'derived_from' | 'informed_by' | 'supersedes' | 'validated_by';
}

class ReceiptStore {
  private receipts: Map<string, TrustReceipt> = new Map();
  private edges: ReceiptEdge[] = [];
  private receiptsByContent: Map<string, string[]> = new Map();
  private receiptsByOrg: Map<number, string[]> = new Map();

  create(params: CreateReceiptParams): TrustReceipt {
    const id = randomUUID();
    const confidence = params.confidenceScore ?? 0.7;
    const receiptClass = params.receiptClass;
    const policy = params.policyClass ?? derivePolicy(receiptClass, confidence);
    const tier = computeConfidenceTier(confidence);
    const status: ReceiptStatus = 'generated';
    const exportSafe = deriveExportSafe(status, confidence, policy);

    const receipt: TrustReceipt = {
      id,
      orgId: params.orgId ?? null,
      contentId: params.contentId,
      contentType: params.contentType,
      receiptClass,
      status,
      policyClass: policy,
      confidenceScore: confidence,
      confidenceTier: tier,
      modelId: params.modelId ?? null,
      modelProvider: params.modelProvider ?? null,
      modelVersion: params.modelVersion ?? null,
      modelLane: params.modelLane ?? null,
      promptHash: params.promptText ? computePromptHash(params.promptText) : null,
      correlationId: params.correlationId ?? null,
      traceId: params.traceId ?? null,
      parentReceiptId: params.parentReceiptId ?? null,
      generatedByUserId: params.generatedByUserId ?? null,
      approvedByUserId: null,
      approvedAt: null,
      approvalNote: null,
      whatWasSeen: params.whatWasSeen ?? [],
      whatWasUsed: params.whatWasUsed ?? [],
      whatWasIgnored: params.whatWasIgnored ?? [],
      assumptions: params.assumptions ?? [],
      postExecutionDeltas: [],
      serviceAttribution: params.serviceAttribution ?? null,
      metadata: params.metadata ?? {},
      exportSafe,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.receipts.size >= MAX_RECEIPTS) {
      const oldestKey = this.receipts.keys().next().value;
      if (oldestKey) this.receipts.delete(oldestKey);
    }

    this.receipts.set(id, receipt);

    const contentKey = `${params.contentType}:${params.contentId}`;
    const existing = this.receiptsByContent.get(contentKey) ?? [];
    existing.push(id);
    this.receiptsByContent.set(contentKey, existing);

    if (params.orgId != null) {
      const orgExisting = this.receiptsByOrg.get(params.orgId) ?? [];
      orgExisting.push(id);
      this.receiptsByOrg.set(params.orgId, orgExisting);
    }

    if (params.parentReceiptId) {
      this.addEdge(params.parentReceiptId, id, 'derived_from');
    }

    return receipt;
  }

  approve(params: ApproveReceiptParams): TrustReceipt {
    const receipt = this.receipts.get(params.receiptId);
    if (!receipt) {
      throw Object.assign(new Error(`Receipt ${params.receiptId} not found`), {
        code: 'NOT_FOUND',
      });
    }

    const newStatus: ReceiptStatus = params.newStatus ?? 'approved';
    const exportSafe = deriveExportSafe(newStatus, receipt.confidenceScore, receipt.policyClass);

    const updated: TrustReceipt = {
      ...receipt,
      status: newStatus,
      approvedByUserId: params.approvedByUserId,
      approvedAt: new Date(),
      approvalNote: params.approvalNote ?? null,
      exportSafe,
      updatedAt: new Date(),
    };

    this.receipts.set(params.receiptId, updated);
    return updated;
  }

  recordDelta(params: RecordDeltaParams): TrustReceipt {
    const receipt = this.receipts.get(params.receiptId);
    if (!receipt) {
      throw Object.assign(new Error(`Receipt ${params.receiptId} not found`), {
        code: 'NOT_FOUND',
      });
    }

    const delta: PostExecutionDelta = {
      field: params.field,
      before: params.before,
      after: params.after,
      changedAt: new Date(),
      changedByUserId: params.changedByUserId ?? null,
    };

    const updated: TrustReceipt = {
      ...receipt,
      postExecutionDeltas: [...receipt.postExecutionDeltas, delta],
      updatedAt: new Date(),
    };

    this.receipts.set(params.receiptId, updated);
    return updated;
  }

  addEdge(parentId: string, childId: string, relationship: ReceiptEdge['relationship']): void {
    if (this.edges.length >= MAX_EDGES) {
      this.edges.shift();
    }
    this.edges.push({ parentId, childId, relationship });
  }

  get(id: string): TrustReceipt | undefined {
    return this.receipts.get(id);
  }

  getByContent(contentType: string, contentId: string): TrustReceipt[] {
    const key = `${contentType}:${contentId}`;
    const ids = this.receiptsByContent.get(key) ?? [];
    return ids.map((id) => this.receipts.get(id)).filter(Boolean) as TrustReceipt[];
  }

  getGraph(receiptId: string, maxDepth = 5): TrustReceiptGraph {
    const visited = new Set<string>();
    const receiptsInGraph: TrustReceipt[] = [];
    const edgesInGraph: ReceiptEdge[] = [];

    const traverse = (id: string, depth: number) => {
      if (visited.has(id) || depth > maxDepth) return;
      visited.add(id);
      const receipt = this.receipts.get(id);
      if (receipt) receiptsInGraph.push(receipt);

      const childEdges = this.edges.filter((e) => e.parentId === id);
      const parentEdges = this.edges.filter((e) => e.childId === id);

      for (const edge of [...childEdges, ...parentEdges]) {
        if (!edgesInGraph.find((e) => e.parentId === edge.parentId && e.childId === edge.childId)) {
          edgesInGraph.push(edge);
        }
        const nextId = edge.parentId === id ? edge.childId : edge.parentId;
        traverse(nextId, depth + 1);
      }
    };

    traverse(receiptId, 0);

    return {
      rootReceiptId: receiptId,
      receipts: receiptsInGraph,
      edges: edgesInGraph,
      depth: maxDepth,
    };
  }

  list(
    options: {
      orgId?: number | null;
      contentType?: string;
      receiptClass?: ReceiptClass;
      status?: ReceiptStatus;
      limit?: number;
      sinceMs?: number;
    } = {},
  ): TrustReceipt[] {
    let items = Array.from(this.receipts.values());

    if (options.orgId != null) items = items.filter((r) => r.orgId === options.orgId);
    if (options.contentType) items = items.filter((r) => r.contentType === options.contentType);
    if (options.receiptClass) items = items.filter((r) => r.receiptClass === options.receiptClass);
    if (options.status) items = items.filter((r) => r.status === options.status);
    if (options.sinceMs) {
      const cutoff = new Date(Date.now() - options.sinceMs);
      items = items.filter((r) => r.createdAt >= cutoff);
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items.slice(0, options.limit ?? 100);
  }

  summarize(receipt: TrustReceipt): ReceiptSummary {
    return {
      id: receipt.id,
      contentId: receipt.contentId,
      contentType: receipt.contentType,
      receiptClass: receipt.receiptClass,
      status: receipt.status,
      policyClass: receipt.policyClass,
      confidenceScore: receipt.confidenceScore,
      confidenceTier: receipt.confidenceTier,
      modelId: receipt.modelId,
      modelProvider: receipt.modelProvider,
      approvedByUserId: receipt.approvedByUserId,
      exportSafe: receipt.exportSafe,
      createdAt: receipt.createdAt,
    };
  }

  buildAuditPacket(receiptId: string, exportedByUserId?: number): AuditPacket {
    const receipt = this.get(receiptId);
    if (!receipt) {
      throw Object.assign(new Error(`Receipt ${receiptId} not found`), { code: 'NOT_FOUND' });
    }

    const graph = this.getGraph(receiptId);
    const attestation = [
      `RECEIPT GRAPH AUDIT PACKET`,
      `Receipt ID: ${receipt.id}`,
      `Content: ${receipt.contentType}:${receipt.contentId}`,
      `Status: ${receipt.status}`,
      `Policy: ${receipt.policyClass}`,
      `Confidence: ${receipt.confidenceScore} (${receipt.confidenceTier})`,
      `Model: ${receipt.modelId ?? 'none'} (${receipt.modelProvider ?? 'none'})`,
      `Export Safe: ${receipt.exportSafe}`,
      `Graph depth: ${graph.depth}, receipts: ${graph.receipts.length}`,
      `Exported: ${new Date().toISOString()}`,
      `Integrity hash: ${createHash('sha256').update(JSON.stringify(receipt)).digest('hex').slice(0, 32)}`,
    ].join('\n');

    return {
      receiptId,
      exportedAt: new Date(),
      ...(exportedByUserId !== undefined ? { exportedByUserId } : {}),
      orgId: receipt.orgId,
      receipt,
      graph,
      attestation,
    };
  }

  getExecutiveSummary(
    options: { orgId?: number | null; windowMs?: number } = {},
  ): ExecutiveTrustSummary {
    const windowMs = options.windowMs ?? 86_400_000;
    const items = this.list({
      ...(options.orgId !== undefined ? { orgId: options.orgId } : {}),
      sinceMs: windowMs,
      limit: 5000,
    });

    const byClass = {} as Record<ReceiptClass, number>;
    const byStatus = {} as Record<ReceiptStatus, number>;
    const policyCount = {} as Record<PolicyClass, number>;

    let totalConf = 0;
    let highConf = 0;
    let lowConf = 0;
    let pendingApproval = 0;
    let exportSafeCount = 0;
    let exportBlockedCount = 0;

    for (const r of items) {
      byClass[r.receiptClass] = (byClass[r.receiptClass] ?? 0) + 1;
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      policyCount[r.policyClass] = (policyCount[r.policyClass] ?? 0) + 1;
      totalConf += r.confidenceScore;
      if (r.confidenceTier === 'high') highConf++;
      if (r.confidenceTier === 'uncertain' || r.confidenceTier === 'low') lowConf++;
      if (r.status === 'pending_review') pendingApproval++;
      if (r.exportSafe) exportSafeCount++;
      else exportBlockedCount++;
    }

    const topPolicyClasses = Object.entries(policyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([policy, count]) => ({ policy: policy as PolicyClass, count }));

    return {
      orgId: options.orgId ?? null,
      windowMs,
      totalReceipts: items.length,
      byClass,
      byStatus,
      averageConfidence: items.length > 0 ? totalConf / items.length : 0,
      highConfidenceCount: highConf,
      lowConfidenceCount: lowConf,
      pendingApprovalCount: pendingApproval,
      exportSafeCount,
      exportBlockedCount,
      topPolicyClasses,
      recentReceipts: items.slice(0, 20).map((r) => this.summarize(r)),
    };
  }
}

export const receiptStore = new ReceiptStore();
