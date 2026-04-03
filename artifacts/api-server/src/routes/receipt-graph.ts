import { Router, type IRouter } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  createReceipt,
  approveReceipt,
  rejectReceipt,
  retractReceipt,
  recordPostExecutionDelta,
  getReceipt,
  getReceiptByContent,
  getReceiptGraph,
  buildAuditPacket,
  getExecutiveTrustSummary,
  listReceipts,
  linkReceipts,
  type ReceiptClass,
  type ReceiptStatus,
} from "@szl-holdings/receipt-graph";

const router: IRouter = Router();

router.post(
  "/receipt-graph/receipts",
  authMiddleware({ required: true }),
  (req, res) => {
    try {
      const {
        orgId,
        contentId,
        contentType,
        receiptClass,
        policyClass,
        confidenceScore,
        modelId,
        modelProvider,
        modelVersion,
        modelLane,
        promptText,
        correlationId,
        traceId,
        parentReceiptId,
        serviceAttribution,
        whatWasSeen,
        whatWasUsed,
        whatWasIgnored,
        assumptions,
        metadata,
      } = req.body;

      if (!contentId || !contentType || !receiptClass) {
        res.status(400).json({ error: "contentId, contentType, and receiptClass are required" });
        return;
      }

      const receipt = createReceipt({
        orgId: orgId ?? req.user?.orgs?.[0]?.orgId ?? null,
        contentId,
        contentType,
        receiptClass,
        policyClass,
        confidenceScore,
        modelId,
        modelProvider,
        modelVersion,
        modelLane,
        promptText,
        correlationId,
        traceId,
        parentReceiptId,
        generatedByUserId: req.user?.id ?? null,
        serviceAttribution,
        whatWasSeen,
        whatWasUsed,
        whatWasIgnored,
        assumptions,
        metadata,
      });

      res.status(201).json({ receipt });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/receipt-graph/receipts",
  authMiddleware({ required: true }),
  (req, res) => {
    try {
      const {
        orgId,
        contentType,
        receiptClass,
        status,
        limit,
        sinceMs,
      } = req.query;

      const receipts = listReceipts({
        orgId: orgId ? Number(orgId) : (req.user?.orgs?.[0]?.orgId ?? undefined),
        contentType: contentType as string | undefined,
        receiptClass: receiptClass as ReceiptClass | undefined,
        status: status as ReceiptStatus | undefined,
        limit: limit ? Number(limit) : 50,
        sinceMs: sinceMs ? Number(sinceMs) : 86_400_000,
      });

      res.json({ receipts, count: receipts.length });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/receipt-graph/receipts/:receiptId",
  authMiddleware({ required: true }),
  (req, res) => {
    try {
      const receipt = getReceipt(req.params.receiptId as string);
      if (!receipt) {
        res.status(404).json({ error: "Receipt not found" });
        return;
      }
      res.json({ receipt });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/receipt-graph/by-content/:contentType/:contentId",
  authMiddleware({ required: true }),
  (req, res) => {
    try {
      const receipts = getReceiptByContent(req.params.contentType as string, req.params.contentId as string);
      res.json({ receipts, count: receipts.length });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/receipt-graph/graph/:receiptId",
  authMiddleware({ required: true }),
  (req, res) => {
    try {
      const maxDepth = req.query.maxDepth ? Number(req.query.maxDepth) : 5;
      const graph = getReceiptGraph(req.params.receiptId as string, maxDepth);
      res.json({ graph });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.post(
  "/receipt-graph/receipts/:receiptId/approve",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  (req, res) => {
    try {
      const { approvalNote } = req.body;
      const receipt = approveReceipt({
        receiptId: req.params.receiptId as string,
        approvedByUserId: req.user!.id,
        approvalNote,
      });
      res.json({ receipt });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "NOT_FOUND") {
        res.status(404).json({ error: "Receipt not found" });
        return;
      }
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.post(
  "/receipt-graph/receipts/:receiptId/reject",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  (req, res) => {
    try {
      const { approvalNote } = req.body;
      const receipt = rejectReceipt({
        receiptId: req.params.receiptId as string,
        approvedByUserId: req.user!.id,
        approvalNote,
      });
      res.json({ receipt });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "NOT_FOUND") {
        res.status(404).json({ error: "Receipt not found" });
        return;
      }
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.post(
  "/receipt-graph/receipts/:receiptId/retract",
  authMiddleware({ required: true }),
  requireRole("admin"),
  (req, res) => {
    try {
      const { approvalNote } = req.body;
      const receipt = retractReceipt({
        receiptId: req.params.receiptId as string,
        approvedByUserId: req.user!.id,
        approvalNote,
      });
      res.json({ receipt });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "NOT_FOUND") {
        res.status(404).json({ error: "Receipt not found" });
        return;
      }
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.post(
  "/receipt-graph/receipts/:receiptId/delta",
  authMiddleware({ required: true }),
  (req, res) => {
    try {
      const { field, before, after } = req.body;
      if (!field) {
        res.status(400).json({ error: "field is required" });
        return;
      }
      const receipt = recordPostExecutionDelta({
        receiptId: req.params.receiptId as string,
        field,
        before,
        after,
        changedByUserId: req.user?.id,
      });
      res.json({ receipt });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "NOT_FOUND") {
        res.status(404).json({ error: "Receipt not found" });
        return;
      }
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.post(
  "/receipt-graph/link",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  (req, res) => {
    try {
      const { parentId, childId, relationship } = req.body;
      if (!parentId || !childId) {
        res.status(400).json({ error: "parentId and childId are required" });
        return;
      }
      linkReceipts(parentId, childId, relationship);
      res.json({ success: true, parentId, childId, relationship: relationship ?? "derived_from" });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/receipt-graph/audit/:receiptId",
  authMiddleware({ required: true }),
  requireRole("admin", "operator"),
  (req, res) => {
    try {
      const packet = buildAuditPacket(req.params.receiptId as string, req.user?.id);
      res.json({ packet });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "NOT_FOUND") {
        res.status(404).json({ error: "Receipt not found" });
        return;
      }
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

router.get(
  "/receipt-graph/executive-summary",
  authMiddleware({ required: true }),
  requireRole("admin", "operator", "viewer"),
  (req, res) => {
    try {
      const { orgId, windowMs } = req.query;
      const summary = getExecutiveTrustSummary({
        orgId: orgId ? Number(orgId) : (req.user?.orgs?.[0]?.orgId ?? null),
        windowMs: windowMs ? Number(windowMs) : 86_400_000,
      });
      res.json({ summary });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  },
);

export default router;
