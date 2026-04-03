import { receiptStore } from "./receipt-store.js";
import type {
  TrustReceipt,
  TrustReceiptGraph,
  ReceiptSummary,
  AuditPacket,
  ExecutiveTrustSummary,
  CreateReceiptParams,
  ApproveReceiptParams,
  RecordDeltaParams,
  ReceiptClass,
  ReceiptStatus,
} from "./types.js";

export function createReceipt(params: CreateReceiptParams): TrustReceipt {
  return receiptStore.create(params);
}

export function approveReceipt(params: ApproveReceiptParams): TrustReceipt {
  return receiptStore.approve({ ...params, newStatus: "approved" });
}

export function rejectReceipt(params: ApproveReceiptParams): TrustReceipt {
  return receiptStore.approve({ ...params, newStatus: "rejected" });
}

export function retractReceipt(params: ApproveReceiptParams): TrustReceipt {
  return receiptStore.approve({ ...params, newStatus: "retracted" });
}

export function recordPostExecutionDelta(params: RecordDeltaParams): TrustReceipt {
  return receiptStore.recordDelta(params);
}

export function getReceipt(receiptId: string): TrustReceipt | undefined {
  return receiptStore.get(receiptId);
}

export function getReceiptByContent(
  contentType: string,
  contentId: string,
): TrustReceipt[] {
  return receiptStore.getByContent(contentType, contentId);
}

export function getReceiptGraph(receiptId: string, maxDepth?: number): TrustReceiptGraph {
  return receiptStore.getGraph(receiptId, maxDepth);
}

export function buildAuditPacket(receiptId: string, exportedByUserId?: number): AuditPacket {
  return receiptStore.buildAuditPacket(receiptId, exportedByUserId);
}

export function getExecutiveTrustSummary(options: {
  orgId?: number | null;
  windowMs?: number;
} = {}): ExecutiveTrustSummary {
  return receiptStore.getExecutiveSummary(options);
}

export function listReceipts(options: {
  orgId?: number | null;
  contentType?: string;
  receiptClass?: ReceiptClass;
  status?: ReceiptStatus;
  limit?: number;
  sinceMs?: number;
} = {}): TrustReceipt[] {
  return receiptStore.list(options);
}

export function isExportSafe(contentType: string, contentId: string): boolean {
  const receipts = receiptStore.getByContent(contentType, contentId);
  if (receipts.length === 0) return true;
  const latest = receipts[receipts.length - 1];
  return latest.exportSafe;
}

export function assertExportSafe(contentType: string, contentId: string): void {
  const receipts = receiptStore.getByContent(contentType, contentId);
  if (receipts.length === 0) return;
  const latest = receipts[receipts.length - 1];
  if (!latest.exportSafe) {
    throw Object.assign(
      new Error(`Content ${contentType}:${contentId} is not export safe — status: ${latest.status}, policy: ${latest.policyClass}`),
      { code: "EXPORT_BLOCKED", receiptId: latest.id },
    );
  }
}

export function linkReceipts(
  parentId: string,
  childId: string,
  relationship: "derived_from" | "informed_by" | "supersedes" | "validated_by" = "derived_from",
): void {
  receiptStore.addEdge(parentId, childId, relationship);
}
