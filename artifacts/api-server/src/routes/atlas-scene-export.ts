import { bodyShape } from '@szl-holdings/contracts/common';
import {
  auditEventsTable,
  db,
  type SpatialTwinSnapshot,
  spatialTwinSnapshotsTable,
} from '@szl-holdings/db';
import { type BranchPackage, type ProofBundle, type SceneSnapshot, buildOpenUSDManifest, exportBranchPackage, exportJsonSnapshot, exportOpenUSDManifest, exportProofBundle } from '@szl-holdings/scene-export';
import { desc, eq } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { isFlagEnabled } from '../lib/platform-flags';
import { anyQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

/**
 * Sentinel error thrown when an ATLAS export audit write fails. Routes catch
 * this and fail the export response so a successful export can never occur
 * without a corresponding entry in audit_events (fail-closed compliance).
 */
class AtlasExportAuditError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AtlasExportAuditError';
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
        ...params.details,
      },
      ipAddress: params.req.ip ?? null,
      userAgent: params.req.get('user-agent') ?? null,
      product: 'atlas',
    });
  } catch (err) {
    logger.error(
      { err, action: params.action, entityId: params.entityId },
      'Failed to write ATLAS export audit event — failing export request',
    );
    throw new AtlasExportAuditError('Failed to record audit event for ATLAS export', err);
  }
}

function handleAuditFailure(res: Response, err: unknown): boolean {
  if (err instanceof AtlasExportAuditError) {
    sendError(
      res,
      'Export blocked: audit log unavailable. Please retry.',
      503,
      'AUDIT_LOG_UNAVAILABLE',
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
  message: { error: 'ATLAS export rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
});

const FEATURE_FLAG = 'ENABLE_ATLAS_SPATIAL_RUNTIME';

async function checkAtlasEnabled(res: Response): Promise<boolean> {
  const enabled = await isFlagEnabled(FEATURE_FLAG);
  if (!enabled) {
    sendError(res, 'ATLAS Spatial Runtime is currently unavailable.', 503, 'FEATURE_DISABLED', {
      feature: FEATURE_FLAG,
    });
    return false;
  }
  return true;
}

/**
 * Loads the most recent persisted spatial twin snapshot for a given sceneId.
 * In this codebase the route param `sceneId` corresponds to the
 * `spatial_twin_snapshots.twin_id` column (the ATLAS scenes table). The
 * latest snapshot is selected by snapshotAt desc + sequenceNumber desc.
 *
 * Returns `null` when no snapshot exists for the sceneId so callers can
 * respond with 404.
 */
async function loadLatestSpatialSnapshot(sceneId: string): Promise<SpatialTwinSnapshot | null> {
  const rows = await db
    .select()
    .from(spatialTwinSnapshotsTable)
    .where(eq(spatialTwinSnapshotsTable.twinId, sceneId))
    .orderBy(
      desc(spatialTwinSnapshotsTable.snapshotAt),
      desc(spatialTwinSnapshotsTable.sequenceNumber),
    )
    .limit(1);
  return rows[0] ?? null;
}

router.get(
  '/atlas/snapshot/:sceneId',
  validateQuery(anyQuerySchema),
  authMiddleware(),
  requireRole('operator', 'ops', 'exec', 'admin', 'super_admin'),
  atlasExportRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await checkAtlasEnabled(res))) return;

      const sceneId = String(req.params.sceneId);
      const query = req.query as Record<string, string>;
      const domainOverride = query.domain;
      const entityTypeOverride = query.entityType;
      const entityIdOverride = query.entityId;

      const row = await loadLatestSpatialSnapshot(sceneId);
      if (!row) {
        sendNotFound(res, `ATLAS scene "${sceneId}"`);
        return;
      }

      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      const correlationId =
        typeof metadata.correlationId === 'string' ? metadata.correlationId : null;

      const snapshot: SceneSnapshot = {
        sceneId,
        domain: domainOverride ?? row.twinCategory ?? 'default',
        entityType: entityTypeOverride ?? row.twinCategory ?? 'scene',
        entityId: entityIdOverride ?? row.entityId,
        capturedAt: (row.snapshotAt instanceof Date
          ? row.snapshotAt
          : new Date(row.snapshotAt as unknown as string)
        ).toISOString(),
        state: (row.state ?? {}) as Record<string, unknown>,
        proofChainId: row.proofChainId ?? null,
        correlationId,
        metadata,
      };

      const result = exportJsonSnapshot(snapshot);
      await recordAtlasExportAudit({
        req,
        action: 'atlas.snapshot.export',
        entityType: 'atlas_scene',
        entityId: sceneId,
        format: result.format,
        details: {
          domain: snapshot.domain,
          entityType: snapshot.entityType,
          entityId: snapshot.entityId,
        },
      });
      sendSuccess(res, result);
    } catch (err) {
      if (handleAuditFailure(res, err)) return;
      if (err instanceof Error && err.message.includes('required')) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, 'Failed to export scene snapshot');
    }
  },
);

router.post(
  '/atlas/branch/export',
  validateBody(
    bodyShape({
      approvedBy: z.unknown().optional(),
      branchId: z.unknown().optional(),
      branchLabel: z.unknown().optional(),
      branchedAt: z.unknown().optional(),
      correlationId: z.unknown().optional(),
      deltaState: z.unknown().optional(),
      domain: z.unknown().optional(),
      hypothesis: z.unknown().optional(),
      metadata: z.unknown().optional(),
      outcomeProjections: z.unknown().optional(),
      parentSceneId: z.unknown().optional(),
    }),
  ),
  authMiddleware(),
  requireRole('operator', 'ops', 'exec', 'admin', 'super_admin'),
  atlasExportRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await checkAtlasEnabled(res))) return;

      const body = req.body as Partial<BranchPackage>;

      if (!body.parentSceneId) {
        sendBadRequest(res, 'parentSceneId is required');
        return;
      }
      if (!body.branchId) {
        sendBadRequest(res, 'branchId is required');
        return;
      }
      if (!body.hypothesis) {
        sendBadRequest(res, 'hypothesis is required');
        return;
      }

      const branchPackage: BranchPackage = {
        parentSceneId: body.parentSceneId,
        branchId: body.branchId,
        branchLabel: body.branchLabel ?? body.branchId,
        domain: body.domain ?? 'default',
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
        action: 'atlas.branch.export',
        entityType: 'atlas_branch',
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
      if (err instanceof Error && err.message.includes('required')) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, 'Failed to export branch package');
    }
  },
);

router.post(
  '/atlas/proof-bundle/export',
  validateBody(
    bodyShape({
      approvalChain: z.unknown().optional(),
      bundleId: z.unknown().optional(),
      citations: z.unknown().optional(),
      confidenceScore: z.unknown().optional(),
      contentId: z.unknown().optional(),
      contentType: z.unknown().optional(),
      correlationId: z.unknown().optional(),
      generatedAt: z.unknown().optional(),
      metadata: z.unknown().optional(),
      modelVersion: z.unknown().optional(),
      serviceAttribution: z.unknown().optional(),
      sourceClass: z.unknown().optional(),
    }),
  ),
  authMiddleware(),
  requireRole('operator', 'ops', 'exec', 'admin', 'super_admin'),
  atlasExportRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await checkAtlasEnabled(res))) return;

      const body = req.body as Partial<ProofBundle>;

      if (!body.bundleId) {
        sendBadRequest(res, 'bundleId is required');
        return;
      }
      if (!body.contentId) {
        sendBadRequest(res, 'contentId is required');
        return;
      }
      if (body.confidenceScore === undefined || body.confidenceScore === null) {
        sendBadRequest(res, 'confidenceScore is required');
        return;
      }

      const proofBundle: ProofBundle = {
        bundleId: body.bundleId,
        contentId: body.contentId,
        contentType: body.contentType ?? 'unknown',
        sourceClass: body.sourceClass ?? 'unknown',
        confidenceScore: body.confidenceScore,
        serviceAttribution: body.serviceAttribution ?? 'atlas',
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
        action: 'atlas.proof_bundle.export',
        entityType: 'atlas_proof_bundle',
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
      if (err instanceof Error && err.message.includes('required')) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, 'Failed to export proof bundle');
    }
  },
);

router.get(
  '/atlas/export/openusd/:sceneId',
  validateQuery(anyQuerySchema),
  authMiddleware(),
  requireRole('operator', 'ops', 'exec', 'admin', 'super_admin'),
  atlasExportRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await checkAtlasEnabled(res))) return;

      const sceneId = String(req.params.sceneId);
      const query = req.query as Record<string, string>;
      const domainOverride = query.domain;
      const entityIdOverride = query.entityId;
      const proofChainId: string | undefined = query.proofChainId;

      let resolvedProofChainId: number | null | undefined;
      if (proofChainId !== undefined) {
        const parsed = Number(proofChainId);
        if (!Number.isInteger(parsed) || parsed < 0) {
          sendBadRequest(res, 'proofChainId must be a non-negative integer');
          return;
        }
        resolvedProofChainId = parsed;
      }

      const row = await loadLatestSpatialSnapshot(sceneId);
      if (!row) {
        sendNotFound(res, `ATLAS scene "${sceneId}"`);
        return;
      }

      const manifest = buildOpenUSDManifest({
        stage: `/ATLAS/${sceneId}`,
        domain: domainOverride ?? row.twinCategory ?? 'default',
        entityId: entityIdOverride ?? row.entityId,
        proofChainId:
          resolvedProofChainId !== undefined ? resolvedProofChainId : (row.proofChainId ?? null),
        sceneState: (row.state ?? {}) as Record<string, unknown>,
      });

      const result = exportOpenUSDManifest(manifest);
      await recordAtlasExportAudit({
        req,
        action: 'atlas.openusd.export',
        entityType: 'atlas_scene',
        entityId: sceneId,
        format: result.format,
        details: {
          domain: manifest.domain,
          entityId: manifest.customLayerData.entityId ?? sceneId,
          proofChainId: manifest.customLayerData.proofChainId ?? null,
        },
      });
      sendSuccess(res, result);
    } catch (err) {
      if (handleAuditFailure(res, err)) return;
      if (err instanceof Error && err.message.includes('required')) {
        sendBadRequest(res, err.message);
        return;
      }
      handleRouteError(res, err, 'Failed to export OpenUSD manifest');
    }
  },
);

export default router;
