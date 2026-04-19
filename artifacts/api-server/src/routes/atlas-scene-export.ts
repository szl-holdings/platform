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
import { db, auditEventsTable } from "@szl-holdings/db";
import { logger } from "../lib/logger";

import { anyQuerySchema, jsonObjectBodySchema, validateBody, validateQuery } from "../lib/validation";
const router: IRouter = Router();

/**
 * Sentinel error thrown when an ATLAS export audit write fails. Routes catch
 * this and fail the export response so a successful export can never occur
 * without a corresponding entry in audit_events (fail-closed compliance).
 */
class AtlasExportAuditError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AtlasExportAuditError";
  }
}

/**
 * Record an audit event for an ATLAS scene/branch/proof-bundle export.
 *
 * Governance & compliance require that every successful export be traceable —
 * who exported what, when, and in which format. We write to audit_events
 * (visible via /audit/events) before returning the export to the caller. If
 * the audit write fails, this throws AtlasExportAuditError so the route can
 * fail the response — fail-closed: no export response without an audit row.
 * The event is written even when the underlying exporter returns a stub or
 * empty payload so the trail is complete.
 */
async function recordAtlasExportAudit(params: {
  req: Request;
  action: string;
  entityType: string;
  entityId: string | null;
  format: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(auditEventsTable).values({
      userId: params.req.user?.id ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      newValues: {
        format: params.format,
        ...(params.details ?? {}),
      },
      ipAddress: params.req.ip ?? null,
      userAgent: params.req.get("user-agent") ?? null,
      product: "atlas",
    });
  } catch (err) {
    logger.error(
      { err, action: params.action, entityId: params.entityId },
      "Failed to write ATLAS export audit event — failing export request",
    );
    throw new AtlasExportAuditError(
      "Failed to record audit event for ATLAS export",
      err,
    );
  }
}

function handleAuditFailure(res: Response, err: unknown): boolean {
  if (err instanceof AtlasExportAuditError) {
    sendError(
      res,
      "Export blocked: audit log unavailable. Please retry.",
      503,
      "AUDIT_LOG_UNAVAILABLE",
    );
    return true;
  }
  return false;
}

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
  "/atlas/snapshot/:sceneId", validateQuery(anyQuerySchema),
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
      await recordAtlasExportAudit({
        req,
        action: "atlas.snapshot.export",
        entityType: "atlas_scene",
        entityId: sceneId,
        format: result.format,
        details: { domain, entityType, entityId },
      });
      sendSuccess(res, result);
    } catch (err) {
      if (handleAuditFailure(res, err)) return;
      if (err instanceof Error && err.message.includes("required")) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, "Failed to export scene snapshot");
    }
  },
);

router.post(
  "/atlas/branch/export", validateBody(jsonObjectBodySchema),
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
      await recordAtlasExportAudit({
        req,
        action: "atlas.branch.export",
        entityType: "atlas_branch",
        entityId: branchPackage.branchId,
        format: result.format,
        details: {
          parentSceneId: branchPackage.parentSceneId,
          branchLabel: branchPackage.branchLabel,
          domain: branchPackage.domain,
          correlationId: branchPackage.correlationId,
        },
      });
      sendSuccess(res, result);
    } catch (err) {
      if (handleAuditFailure(res, err)) return;
      if (err instanceof Error && err.message.includes("required")) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, "Failed to export branch package");
    }
  },
);

router.post(
  "/atlas/proof-bundle/export", validateBody(jsonObjectBodySchema),
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
      await recordAtlasExportAudit({
        req,
        action: "atlas.proof_bundle.export",
        entityType: "atlas_proof_bundle",
        entityId: proofBundle.bundleId,
        format: result.format,
        details: {
          contentId: proofBundle.contentId,
          contentType: proofBundle.contentType,
          sourceClass: proofBundle.sourceClass,
          confidenceScore: proofBundle.confidenceScore,
          serviceAttribution: proofBundle.serviceAttribution,
          correlationId: proofBundle.correlationId,
        },
      });
      sendSuccess(res, result);
    } catch (err) {
      if (handleAuditFailure(res, err)) return;
      if (err instanceof Error && err.message.includes("required")) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, "Failed to export proof bundle");
    }
  },
);

router.get(
  "/atlas/export/openusd/:sceneId", validateQuery(anyQuerySchema),
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
      await recordAtlasExportAudit({
        req,
        action: "atlas.openusd.export",
        entityType: "atlas_scene",
        entityId: sceneId,
        format: result.format,
        details: {
          domain,
          entityId: entityId ?? sceneId,
          proofChainId: resolvedProofChainId,
        },
      });
      sendSuccess(res, result);
    } catch (err) {
      if (handleAuditFailure(res, err)) return;
      if (err instanceof Error && err.message.includes("required")) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, "Failed to export OpenUSD manifest");
    }
  },
);

export default router;
