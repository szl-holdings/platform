import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";

const router: IRouter = Router();

router.post("/proof-chain/tag", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const {
      contentId,
      contentType,
      sourceClass,
      confidenceScore,
      modelLane,
      modelId,
      modelProvider,
      modelVersion,
      promptText,
      parentProofId,
      inputSources,
      metadata,
    } = req.body as {
      contentId?: string;
      contentType?: string;
      sourceClass?: string;
      confidenceScore?: number;
      modelLane?: string;
      modelId?: string;
      modelProvider?: string;
      modelVersion?: string;
      promptText?: string;
      parentProofId?: number;
      inputSources?: Array<{ type: string; id: string; label?: string }>;
      metadata?: Record<string, unknown>;
    };

    if (!contentId || !contentType || !sourceClass) {
      sendBadRequest(res, "contentId, contentType, and sourceClass are required");
      return;
    }

    const { tagAIContent } = await import("@szl-holdings/proof-chain");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? null;

    const proof = await tagAIContent({
      orgId,
      contentId,
      contentType,
      sourceClass: sourceClass as import("@szl-holdings/proof-chain").ProvenanceSourceClass,
      confidenceScore,
      modelLane,
      modelId,
      modelProvider,
      modelVersion,
      promptText,
      parentProofId,
      generatedByUserId: user?.id ?? null,
      correlationId: (req as unknown as { correlationId?: string }).correlationId,
      serviceAttribution: "api-server",
      inputSources,
      metadata,
    });

    sendCreated(res, proof);
  } catch (err) {
    handleRouteError(res, err, "Failed to tag AI content");
  }
});

router.get("/proof-chain/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid proof ID"); return; }

    const { db, proofChainTable } = await import("@szl-holdings/db");
    const { eq } = await import("drizzle-orm");
    const [row] = await db.select().from(proofChainTable).where(eq(proofChainTable.id, id));
    if (!row) { sendNotFound(res, "Proof"); return; }

    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get proof");
  }
});

router.get("/proof-chain/by-content/:contentType/:contentId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { contentType, contentId } = req.params as { contentType: string; contentId: string };

    const { getProofByContent } = await import("@szl-holdings/proof-chain");
    const proof = await getProofByContent(contentId, contentType);
    if (!proof) { sendNotFound(res, "Proof"); return; }

    sendSuccess(res, proof);
  } catch (err) {
    handleRouteError(res, err, "Failed to get proof by content");
  }
});

router.post("/proof-chain/:id/review", authMiddleware(), requireRole("super_admin", "admin", "ops", "compliance"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) { sendBadRequest(res, "Invalid proof ID"); return; }

    const { reviewState, reviewNote, exportSafetyState } = req.body as {
      reviewState?: string;
      reviewNote?: string;
      exportSafetyState?: string;
    };

    if (!reviewState || !["unreviewed", "reviewed", "approved", "flagged", "retracted"].includes(reviewState)) {
      sendBadRequest(res, "reviewState must be one of: unreviewed, reviewed, approved, flagged, retracted");
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ success: false, error: "Must be authenticated to review" });
      return;
    }

    const { reviewProof } = await import("@szl-holdings/proof-chain");
    const updated = await reviewProof({
      proofId: id,
      reviewedBy: req.user.id,
      reviewState: reviewState as import("@szl-holdings/proof-chain").ProofReviewState,
      reviewNote,
      exportSafetyState: exportSafetyState as import("@szl-holdings/proof-chain").ProofExportSafetyState | undefined,
    });

    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to review proof");
  }
});

router.get("/proof-chain", authMiddleware(), requireRole("super_admin", "admin", "ops", "analyst", "compliance"), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const isAdmin = user?.roles?.some(r => ["super_admin", "admin"].includes(r)) ?? false;
    const orgId = isAdmin ? undefined : (user?.orgs?.[0]?.orgId ?? undefined);
    const reviewState = req.query["reviewState"] as string | undefined;
    const sourceClass = req.query["sourceClass"] as string | undefined;
    const contentType = req.query["contentType"] as string | undefined;
    const limit = Math.min(parseInt(req.query["limit"] as string ?? "100", 10), 500);

    const { listProofChain } = await import("@szl-holdings/proof-chain");
    const results = await listProofChain({
      orgId,
      reviewState: reviewState as import("@szl-holdings/proof-chain").ProofReviewState | undefined,
      sourceClass: sourceClass as import("@szl-holdings/proof-chain").ProvenanceSourceClass | undefined,
      contentType,
      limit,
    });

    sendSuccess(res, results);
  } catch (err) {
    handleRouteError(res, err, "Failed to list proof chain");
  }
});

export default router;
