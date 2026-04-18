import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { isFlagEnabled } from "../lib/platform-flags";
import {
  exportJsonSnapshot,
  exportBranchPackage,
  exportProofBundle,
  exportOpenUSDManifest,
  buildOpenUSDManifest,
} from "@szl-holdings/scene-export";
import type { SceneSnapshot, BranchPackage, ProofBundle } from "@szl-holdings/scene-export";
import { sendSuccess, sendError, sendBadRequest, handleRouteError } from "../lib/api-response";

const router: IRouter = Router();

const atlasExportRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "ATLAS export rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
});

const FEATURE_FLAG = "ENABLE_ATLAS_SPATIAL_RUNTIME";

async function checkAtlasEnabled(res: Response): Promise<boolean> {
  const enabled = await isFlagEnabled(FEATURE_FLAG);
  if (!enabled) {
    sendError(
      res,
      "ATLAS Spatial Runtime is currently unavailable.",
      503,
      "FEATURE_DISABLED",
      { feature: FEATURE_FLAG },
    );
    return false;
  }
  return true;
}

router.get(
  "/atlas/snapshot/:sceneId",
  authMiddleware(),
  requireRole("operator", "ops", "exec", "admin", "super_admin"),
  atlasExportRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await checkAtlasEnabled(res))) return;

      const { sceneId } = req.params;
      const {
        domain = "default",
        entityType = "scene",
        entityId = sceneId,
      } = req.query as Record<string, string>;

      const snapshot: SceneSnapshot = {
        sceneId,
        domain,
        entityType,
        entityId,
        capturedAt: new Date().toISOString(),
        state: {},
      };

      const result = exportJsonSnapshot(snapshot);
      sendSuccess(res, result);
    } catch (err) {
      if (err instanceof Error && err.message.includes("required")) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, "Failed to export scene snapshot");
    }
  },
);

router.post(
  "/atlas/branch/export",
  authMiddleware(),
  requireRole("operator", "ops", "exec", "admin", "super_admin"),
  atlasExportRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await checkAtlasEnabled(res))) return;

      const body = req.body as Partial<BranchPackage>;

      if (!body.parentSceneId) {
        sendBadRequest(res, "parentSceneId is required");
        return;
      }
      if (!body.branchId) {
        sendBadRequest(res, "branchId is required");
        return;
      }
      if (!body.hypothesis) {
        sendBadRequest(res, "hypothesis is required");
        return;
      }

      const branchPackage: BranchPackage = {
        parentSceneId: body.parentSceneId,
        branchId: body.branchId,
        branchLabel: body.branchLabel ?? body.branchId,
        domain: body.domain ?? "default",
        branchedAt: body.branchedAt ?? new Date().toISOString(),
        hypothesis: body.hypothesis,
        deltaState: body.deltaState ?? {},
        outcomeProjections: body.outcomeProjections ?? [],
        approvedBy: body.approvedBy ?? null,
        correlationId: body.correlationId ?? null,
        metadata: body.metadata,
      };

      const result = exportBranchPackage(branchPackage);
      sendSuccess(res, result);
    } catch (err) {
      if (err instanceof Error && err.message.includes("required")) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, "Failed to export branch package");
    }
  },
);

router.post(
  "/atlas/proof-bundle/export",
  authMiddleware(),
  requireRole("operator", "ops", "exec", "admin", "super_admin"),
  atlasExportRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await checkAtlasEnabled(res))) return;

      const body = req.body as Partial<ProofBundle>;

      if (!body.bundleId) {
        sendBadRequest(res, "bundleId is required");
        return;
      }
      if (!body.contentId) {
        sendBadRequest(res, "contentId is required");
        return;
      }
      if (body.confidenceScore === undefined || body.confidenceScore === null) {
        sendBadRequest(res, "confidenceScore is required");
        return;
      }

      const proofBundle: ProofBundle = {
        bundleId: body.bundleId,
        contentId: body.contentId,
        contentType: body.contentType ?? "unknown",
        sourceClass: body.sourceClass ?? "unknown",
        confidenceScore: body.confidenceScore,
        serviceAttribution: body.serviceAttribution ?? "atlas",
        modelVersion: body.modelVersion ?? null,
        citations: body.citations ?? [],
        approvalChain: body.approvalChain ?? [],
        generatedAt: body.generatedAt ?? new Date().toISOString(),
        correlationId: body.correlationId ?? null,
        metadata: body.metadata,
      };

      const result = exportProofBundle(proofBundle);
      sendSuccess(res, result);
    } catch (err) {
      if (err instanceof Error && err.message.includes("required")) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, "Failed to export proof bundle");
    }
  },
);

router.get(
  "/atlas/export/openusd/:sceneId",
  authMiddleware(),
  requireRole("operator", "ops", "exec", "admin", "super_admin"),
  atlasExportRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await checkAtlasEnabled(res))) return;

      const { sceneId } = req.params;
      const {
        domain = "default",
        entityId,
        proofChainId,
      } = req.query as Record<string, string>;

      let resolvedProofChainId: number | null = null;
      if (proofChainId !== undefined) {
        const parsed = Number(proofChainId);
        if (!Number.isInteger(parsed) || parsed < 0) {
          sendBadRequest(res, "proofChainId must be a non-negative integer");
          return;
        }
        resolvedProofChainId = parsed;
      }

      const manifest = buildOpenUSDManifest({
        stage: `/ATLAS/${sceneId}`,
        domain,
        entityId: entityId ?? sceneId,
        proofChainId: resolvedProofChainId,
        sceneState: {},
      });

      const result = exportOpenUSDManifest(manifest);
      sendSuccess(res, result);
    } catch (err) {
      if (err instanceof Error && err.message.includes("required")) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, "Failed to export OpenUSD manifest");
    }
  },
);

export default router;
