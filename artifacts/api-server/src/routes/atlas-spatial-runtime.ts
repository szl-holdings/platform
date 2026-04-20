import { Router, type IRouter, type Request, type Response } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { listQuerySchema, validateBody, validateQuery } from "../lib/validation";

const router: IRouter = Router();

router.get("/atlas/spatial/snapshots/:twinId", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params as { twinId: string };
    const { limit } = req.query as { limit?: string };

    const { getSnapshotHistory } = await import("@szl-holdings/ai-engine/digital-twins/twin-engine-spatial");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const snapshots = await getSnapshotHistory(twinId, {
      limit: limit ? Math.min(Number(limit), 200) : 50,
      orgId,
    });

    sendSuccess(res, { twinId, snapshots, count: snapshots.length });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/snapshots/compare", authMiddleware(), validateBody(bodyShape({
      "snapshotIdA": z.unknown().optional(),
      "snapshotIdB": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { snapshotIdA, snapshotIdB } = req.body as {
      snapshotIdA?: number;
      snapshotIdB?: number;
    };

    if (!snapshotIdA || !snapshotIdB) {
      sendBadRequest(res, "snapshotIdA and snapshotIdB are required");
      return;
    }

    const { compareSnapshots } = await import("@szl-holdings/ai-engine/digital-twins/twin-engine-spatial");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;
    const delta = await compareSnapshots(snapshotIdA, snapshotIdB, orgId);

    sendSuccess(res, delta);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/memory/:twinId", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params as { twinId: string };
    const { limit, minCompositeScore, tags } = req.query as {
      limit?: string;
      minCompositeScore?: string;
      tags?: string;
    };

    const { recallSceneMemory } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const slices = await recallSceneMemory({
      twinId,
      orgId,
      limit: limit ? Math.min(Number(limit), 50) : 20,
      minCompositeScore: minCompositeScore ? Number(minCompositeScore) : undefined,
      tags: tags ? tags.split(",") : undefined,
    });

    sendSuccess(res, { twinId, slices, count: slices.length });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/memory/index", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({
      "causalLinks": z.unknown().optional(),
      "causalRelevanceScore": z.unknown().optional(),
      "entityId": z.unknown().optional(),
      "overlapScore": z.unknown().optional(),
      "retrievalTags": z.unknown().optional(),
      "snapshotId": z.unknown().optional(),
      "trustWeight": z.unknown().optional(),
      "twinCategory": z.unknown().optional(),
      "twinId": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const {
      twinId,
      entityId,
      twinCategory,
      snapshotId,
      retrievalTags,
      trustWeight,
      causalRelevanceScore,
      overlapScore,
      causalLinks,
    } = req.body as {
      twinId?: string;
      entityId?: string;
      twinCategory?: string;
      snapshotId?: number;
      retrievalTags?: string[];
      trustWeight?: number;
      causalRelevanceScore?: number;
      overlapScore?: number;
      causalLinks?: Array<{ targetEntityId: string; linkType: string; strength: number }>;
    };

    if (!twinId || !entityId || !twinCategory || !snapshotId) {
      sendBadRequest(res, "twinId, entityId, twinCategory, and snapshotId are required");
      return;
    }

    const { indexSnapshot } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? null;

    await indexSnapshot({
      orgId,
      twinId,
      entityId,
      twinCategory: twinCategory as import("@szl-holdings/db").SpatialTwinCategory,
      snapshotId,
      retrievalTags,
      trustWeight,
      causalRelevanceScore,
      overlapScore,
      causalLinks,
    });

    sendCreated(res, { message: "Snapshot indexed in scene memory", snapshotId });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/drift/assess", authMiddleware(), validateBody(bodyShape({
      "approvedSnapshotId": z.unknown().optional(),
      "currentConfidence": z.unknown().optional(),
      "currentSnapshotId": z.unknown().optional(),
      "currentState": z.unknown().optional(),
      "entityId": z.unknown().optional(),
      "trustedSourceDeltas": z.unknown().optional(),
      "twinCategory": z.unknown().optional(),
      "twinId": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const {
      twinId,
      entityId,
      twinCategory,
      currentState,
      currentConfidence,
      currentSnapshotId,
      approvedSnapshotId,
      trustedSourceDeltas,
    } = req.body as {
      twinId?: string;
      entityId?: string;
      twinCategory?: string;
      currentState?: Record<string, unknown>;
      currentConfidence?: number;
      currentSnapshotId?: number;
      approvedSnapshotId?: number;
      trustedSourceDeltas?: Array<{ sourceId: string; sourceSlug: string; delta: Record<string, unknown> }>;
    };

    if (!twinId || !entityId || !twinCategory || !currentState || currentConfidence == null) {
      sendBadRequest(res, "twinId, entityId, twinCategory, currentState, and currentConfidence are required");
      return;
    }

    const { assessDrift } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const assessment = await assessDrift({
      twinId,
      entityId,
      twinCategory: twinCategory as import("@szl-holdings/db").SpatialTwinCategory,
      orgId,
      currentState,
      currentConfidence,
      currentSnapshotId,
      approvedSnapshotId,
      trustedSourceDeltas,
    });

    sendSuccess(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/twins/sync-status", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { ids } = req.query as { ids?: string };
    const twinIds = (ids ?? "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 50);

    if (twinIds.length === 0) {
      sendSuccess(res, { statuses: [], count: 0, generatedAt: new Date().toISOString() });
      return;
    }

    const { getLatestDriftAssessment } = await import("@szl-holdings/atlas-spatial-runtime");
    const { getSnapshotHistory } = await import("@szl-holdings/ai-engine/digital-twins/twin-engine-spatial");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;
    const now = Date.now();

    const statuses = await Promise.all(twinIds.map(async (twinId) => {
      try {
        const [snapshots, drift] = await Promise.all([
          getSnapshotHistory(twinId, { limit: 1, orgId }).catch(() => []),
          getLatestDriftAssessment(twinId, orgId).catch(() => null),
        ]);

        const latestSnapshot = snapshots[0] ?? null;
        const lastSyncAt = latestSnapshot?.snapshotAt
          ? new Date(latestSnapshot.snapshotAt).toISOString()
          : drift?.assessedAt ?? null;
        const ageSeconds = lastSyncAt ? Math.max(0, Math.round((now - new Date(lastSyncAt).getTime()) / 1000)) : null;

        const rawDrift = drift?.driftScore ?? null;
        const driftScore = rawDrift != null
          ? Math.round(Math.max(0, Math.min(1, rawDrift)) * 100)
          : null;

        let syncState: "fresh" | "stale" | "degraded" | "unknown";
        if (lastSyncAt == null) {
          syncState = "unknown";
        } else if (drift?.driftStatus === "blocked" || drift?.driftStatus === "degraded") {
          syncState = "degraded";
        } else if (ageSeconds != null && ageSeconds > 600) {
          syncState = "stale";
        } else {
          syncState = "fresh";
        }

        return {
          twinId,
          lastSyncAt,
          ageSeconds,
          driftScore,
          driftStatus: drift?.driftStatus ?? null,
          confidence: drift?.adjustedConfidence ?? null,
          syncState,
          hasLiveData: lastSyncAt != null,
        };
      } catch {
        return {
          twinId,
          lastSyncAt: null,
          ageSeconds: null,
          driftScore: null,
          driftStatus: null,
          confidence: null,
          syncState: "unknown" as const,
          hasLiveData: false,
        };
      }
    }));

    sendSuccess(res, { statuses, count: statuses.length, generatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/drift/:twinId/latest", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params as { twinId: string };
    const { getLatestDriftAssessment } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const assessment = await getLatestDriftAssessment(twinId, orgId);
    if (!assessment) {
      sendNotFound(res, `No drift assessment found for twin ${twinId}`);
      return;
    }
    sendSuccess(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/branches", authMiddleware(), validateBody(bodyShape({
      "baselineSnapshotId": z.unknown().optional(),
      "branchDescription": z.unknown().optional(),
      "branchName": z.unknown().optional(),
      "correlationId": z.unknown().optional(),
      "entityId": z.unknown().optional(),
      "parameters": z.unknown().optional(),
      "twinCategory": z.unknown().optional(),
      "twinId": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const {
      twinId,
      entityId,
      twinCategory,
      baselineSnapshotId,
      branchName,
      branchDescription,
      parameters,
      correlationId,
    } = req.body as {
      twinId?: string;
      entityId?: string;
      twinCategory?: string;
      baselineSnapshotId?: number;
      branchName?: string;
      branchDescription?: string;
      parameters?: Record<string, unknown>;
      correlationId?: string;
    };

    if (!twinId || !entityId || !twinCategory || !baselineSnapshotId || !branchName || !parameters) {
      sendBadRequest(res, "twinId, entityId, twinCategory, baselineSnapshotId, branchName, and parameters are required");
      return;
    }

    const { forgeBranch } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const branch = await forgeBranch({
      twinId,
      entityId,
      twinCategory: twinCategory as import("@szl-holdings/db").SpatialTwinCategory,
      orgId,
      baselineSnapshotId,
      branchName,
      branchDescription,
      parameters,
      correlationId,
      createdByUserId: user?.id ?? undefined,
    });

    sendCreated(res, branch);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

/**
 * Build a `simulation` block per branch from the latest drift assessment for
 * that branch's twin. The Blast Radius Simulation page (artifacts/aegis
 * /src/pages/scenario-branches.tsx) consumes this so its blast-radius bars,
 * assets-affected count, MTTR, cost-impact tier and outcome class reflect
 * real twin drift instead of hard-coded seed values.
 *
 * Mapping:
 *   driftScore (0..1)         → blastRadius / driftFromBaseline (0..100, rounded)
 *   adjustedConfidence        → probability (1 - confidence, 0..100)
 *   divergentFields.length    → assetsAffected (clamped 1..50) + controlGaps (top 4 field names)
 *   driftStatus               → outcome class (blocked|degraded|watch|stable)
 *                               + mttr/cost tier
 *   blockedReason / divergent → trigger summary
 *
 * Returns null when no assessment exists yet, so the client can fall back to
 * any admin-saved `parameters` (or finally to the seeded defaults).
 */
type AtlasOutcome = "contained" | "escalated" | "catastrophic" | "recovering";
interface BranchSimulation {
  blastRadius: number;
  assetsAffected: number;
  probability: number;
  driftFromBaseline: number;
  outcome: AtlasOutcome;
  mttr: string;
  costImpact: string;
  trigger: string;
  controlGaps: string[];
  actions: string[];
  driftStatus: string;
  driftScore: number;
  assessedAt: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function buildBranchSimulation(
  assessment: import("@szl-holdings/atlas-spatial-runtime").DriftAssessment | null,
  branchName: string,
): BranchSimulation | null {
  if (!assessment) return null;

  const driftScore = typeof assessment.driftScore === "number" ? assessment.driftScore : 0;
  const adjustedConfidence =
    typeof assessment.adjustedConfidence === "number" ? assessment.adjustedConfidence : 0.5;
  const divergent = Array.isArray(assessment.divergentFields) ? assessment.divergentFields : [];

  const blastRadius = clamp(Math.round(driftScore * 100), 0, 100);
  const driftFromBaseline = blastRadius;
  const probability = clamp(Math.round((1 - adjustedConfidence) * 100), 1, 99);
  const assetsAffected = clamp(divergent.length || 1, 1, 50);

  const status = assessment.driftStatus;
  const outcome: AtlasOutcome =
    status === "blocked"
      ? "catastrophic"
      : status === "degraded"
        ? "escalated"
        : status === "watch"
          ? "recovering"
          : "contained";

  // Heuristic MTTR / cost tier from drift status. These are not authoritative
  // financial figures — they are operating-tier indicators driven by live
  // drift, intentionally bucketed (not random) so repeat polls are stable.
  const mttr =
    status === "blocked"
      ? "11d 4h"
      : status === "degraded"
        ? "6h 48m"
        : status === "watch"
          ? "1h 22m"
          : "0h 45m";
  const costImpact =
    status === "blocked"
      ? "$8.4M"
      : status === "degraded"
        ? "$1.8M"
        : status === "watch"
          ? "$240K"
          : "$80K";

  const controlGaps = divergent
    .slice(0, 4)
    .map((d) => `Drift on ${String(d.field)} (Δ ${(d.divergenceScore ?? 0).toFixed(2)})`);

  const actions =
    status === "blocked"
      ? [
          "Quarantine affected twin and freeze downstream actions",
          "Open IR ticket and engage on-call SRE",
          "Run full forensic snapshot before remediation",
        ]
      : status === "degraded"
        ? [
            "Notify owning team and request manual review",
            "Restrict twin to read-only until drift resolves",
            "Replay last good snapshot to compare divergence",
          ]
        : status === "watch"
          ? [
              "Tag twin for accelerated re-sync next cycle",
              "Confirm trusted source delta is expected",
            ]
          : ["Continue normal monitoring cadence"];

  const trigger = assessment.blockedReason
    ? assessment.blockedReason
    : divergent.length > 0
      ? `${divergent.length} divergent field${divergent.length === 1 ? "" : "s"} detected on ${assessment.twinId} — branch "${branchName}"`
      : `Latest drift assessment for ${assessment.twinId} is ${status}`;

  return {
    blastRadius,
    assetsAffected,
    probability,
    driftFromBaseline,
    outcome,
    mttr,
    costImpact,
    trigger,
    controlGaps,
    actions,
    driftStatus: status,
    driftScore: Number(driftScore.toFixed(3)),
    assessedAt: String(assessment.assessedAt ?? new Date().toISOString()),
  };
}

router.get("/atlas/spatial/branches", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { twinId, entityId, twinCategory, status, limit } = req.query as {
      twinId?: string;
      entityId?: string;
      twinCategory?: string;
      status?: string;
      limit?: string;
    };

    const { listBranches, getLatestDriftAssessment } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const branches = await listBranches({
      twinId,
      entityId,
      twinCategory: twinCategory as import("@szl-holdings/db").SpatialTwinCategory | undefined,
      status: status as import("@szl-holdings/atlas-spatial-runtime").ScenarioBranch["status"] | undefined,
      orgId,
      limit: limit ? Math.min(Number(limit), 100) : 50,
    });

    // Cache one assessment per twinId — many branches usually share a twin.
    const assessmentByTwin = new Map<
      string,
      import("@szl-holdings/atlas-spatial-runtime").DriftAssessment | null
    >();
    let liveSimulationCount = 0;
    const enriched = await Promise.all(
      branches.map(async (b) => {
        let assessment = assessmentByTwin.get(b.twinId);
        if (assessment === undefined) {
          try {
            assessment = await getLatestDriftAssessment(b.twinId);
          } catch {
            assessment = null;
          }
          assessmentByTwin.set(b.twinId, assessment ?? null);
        }
        const simulation = buildBranchSimulation(assessment ?? null, b.name);
        if (simulation) liveSimulationCount += 1;
        return { ...b, simulation };
      }),
    );

    sendSuccess(res, {
      branches: enriched,
      count: enriched.length,
      liveSimulationCount,
    });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/branches/compare", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { branchAId, branchBId } = req.query as { branchAId?: string; branchBId?: string };

    if (!branchAId) {
      sendBadRequest(res, "branchAId is required");
      return;
    }

    const { compareBranches } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;
    const comparison = await compareBranches(branchAId, branchBId, orgId);

    sendSuccess(res, comparison);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/branches/:branchId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params as { branchId: string };
    const { getBranch } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const branch = await getBranch(branchId, orgId);
    if (!branch) {
      sendNotFound(res, `Branch ${branchId} not found`);
      return;
    }
    sendSuccess(res, branch);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.patch("/atlas/spatial/branches/:branchId", authMiddleware(), validateBody(bodyShape({
      "description": z.unknown().optional(),
      "metadata": z.unknown().optional(),
      "name": z.unknown().optional(),
      "status": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params as { branchId: string };
    const { name, description, status, metadata } = req.body as {
      name?: string;
      description?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    };

    const { updateBranch } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const branch = await updateBranch(
      branchId,
      {
        name,
        description,
        status: status as import("@szl-holdings/atlas-spatial-runtime").ScenarioBranch["status"] | undefined,
        metadata,
      },
      orgId,
    );

    if (!branch) {
      sendNotFound(res, `Branch ${branchId} not found`);
      return;
    }
    sendSuccess(res, branch);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.delete("/atlas/spatial/branches/:branchId", validateBody(bodyShape({})), authMiddleware(), requireRole("super_admin", "admin", "ops"), async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params as { branchId: string };
    const { deleteBranch } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const deleted = await deleteBranch(branchId, orgId);
    if (!deleted) {
      sendNotFound(res, `Branch ${branchId} not found`);
      return;
    }
    sendSuccess(res, { message: "Branch deleted", branchId });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/replay/:twinId/timeline", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { twinId } = req.params as { twinId: string };
    const { entityId, twinCategory, startAt, endAt, maxFrames, includeOverlays } = req.query as {
      entityId?: string;
      twinCategory?: string;
      startAt?: string;
      endAt?: string;
      maxFrames?: string;
      includeOverlays?: string;
    };

    const { buildReplayTimeline } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const timeline = await buildReplayTimeline({
      twinId,
      entityId,
      twinCategory: twinCategory as import("@szl-holdings/db").SpatialTwinCategory | undefined,
      orgId,
      startAt,
      endAt,
      maxFrames: maxFrames ? Math.min(Number(maxFrames), 200) : 100,
      includeOverlays: includeOverlays === "true",
    });

    sendSuccess(res, timeline);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/replay/:twinId/frame/:frameIndex", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { twinId, frameIndex } = req.params as { twinId: string; frameIndex: string };
    const { getReplayFrame } = await import("@szl-holdings/atlas-spatial-runtime");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const frame = await getReplayFrame(twinId, Number(frameIndex), orgId);
    if (!frame) {
      sendNotFound(res, `Frame ${frameIndex} not found for twin ${twinId}`);
      return;
    }
    sendSuccess(res, frame);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/proof-bundle/:contentType/:contentId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { contentType, contentId } = req.params as { contentType: string; contentId: string };
    const { getProofBundle } = await import("@szl-holdings/proof-chain");

    const bundle = await getProofBundle(contentId, contentType);
    if (!bundle.proof) {
      sendNotFound(res, `No proof bundle found for ${contentType}:${contentId}`);
      return;
    }
    const user = req.user;
    const userOrgId = user?.orgs?.[0]?.orgId ?? null;
    const userRole = user?.orgs?.[0]?.role ?? "member";
    const isPrivileged = ["super_admin", "admin"].includes(userRole);
    if (!isPrivileged && bundle.proof.orgId != null && bundle.proof.orgId !== userOrgId) {
      sendNotFound(res, `No proof bundle found for ${contentType}:${contentId}`);
      return;
    }
    sendSuccess(res, bundle);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/proof-bundle/tag", authMiddleware(), validateBody(bodyShape({
      "confidenceScore": z.unknown().optional(),
      "contentId": z.unknown().optional(),
      "contentType": z.unknown().optional(),
      "derivedSimulationBranch": z.unknown().optional(),
      "metadata": z.unknown().optional(),
      "modelId": z.unknown().optional(),
      "modelLane": z.unknown().optional(),
      "modelLaneUsed": z.unknown().optional(),
      "modelProvider": z.unknown().optional(),
      "parentProofId": z.unknown().optional(),
      "parentSnapshotId": z.unknown().optional(),
      "promptText": z.unknown().optional(),
      "renderedArtifactHash": z.unknown().optional(),
      "sourceClass": z.unknown().optional(),
      "sourceEvidenceList": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const {
      contentId,
      contentType,
      sourceClass,
      confidenceScore,
      modelLane,
      modelId,
      modelProvider,
      promptText,
      parentProofId,
      parentSnapshotId,
      derivedSimulationBranch,
      renderedArtifactHash,
      modelLaneUsed,
      sourceEvidenceList,
      metadata,
    } = req.body as {
      contentId?: string;
      contentType?: string;
      sourceClass?: string;
      confidenceScore?: number;
      modelLane?: string;
      modelId?: string;
      modelProvider?: string;
      promptText?: string;
      parentProofId?: number;
      parentSnapshotId?: number;
      derivedSimulationBranch?: string;
      renderedArtifactHash?: string;
      modelLaneUsed?: string;
      sourceEvidenceList?: Array<{ type: string; id: string; label?: string }>;
      metadata?: Record<string, unknown>;
    };

    if (!contentId || !contentType || !sourceClass) {
      sendBadRequest(res, "contentId, contentType, and sourceClass are required");
      return;
    }

    const { tagSpatialContent } = await import("@szl-holdings/proof-chain");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? null;

    const proof = await tagSpatialContent({
      orgId,
      contentId,
      contentType,
      sourceClass: sourceClass as import("@szl-holdings/proof-chain").ProvenanceSourceClass,
      confidenceScore,
      modelLane,
      modelId,
      modelProvider,
      promptText,
      parentProofId,
      generatedByUserId: user?.id ?? null,
      parentSnapshotId,
      derivedSimulationBranch,
      renderedArtifactHash,
      modelLaneUsed,
      sourceEvidenceList,
      metadata,
    });

    sendCreated(res, proof);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/worldline/overlays", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { signalType, sourceTrustClass, severity, isActive, entityId, twinCategory, limit } = req.query as {
      signalType?: string;
      sourceTrustClass?: string;
      severity?: string;
      isActive?: string;
      entityId?: string;
      twinCategory?: string;
      limit?: string;
    };

    const { querySignalOverlays } = await import("@szl-holdings/worldline");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? undefined;

    const overlays = await querySignalOverlays({
      orgId,
      signalType: signalType as import("@szl-holdings/db").OverlaySignalType | undefined,
      sourceTrustClass: sourceTrustClass as import("@szl-holdings/db").SourceTrustClass | undefined,
      severity: severity as "info" | "warning" | "critical" | undefined,
      isActive: isActive != null ? isActive === "true" : true,
      entityId,
      twinCategory: twinCategory as import("@szl-holdings/db").SpatialTwinCategory | undefined,
      limit: limit ? Math.min(Number(limit), 200) : 100,
    });

    sendSuccess(res, { overlays, count: overlays.length });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/worldline/overlays", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({
      "affectedEntityIds": z.unknown().optional(),
      "affectedTwinCategories": z.unknown().optional(),
      "boundingRegion": z.unknown().optional(),
      "causalLinkage": z.unknown().optional(),
      "confidenceScore": z.unknown().optional(),
      "coordinates": z.unknown().optional(),
      "expiresAt": z.unknown().optional(),
      "metadata": z.unknown().optional(),
      "payload": z.unknown().optional(),
      "severity": z.unknown().optional(),
      "signalTimestamp": z.unknown().optional(),
      "signalType": z.unknown().optional(),
      "sourceId": z.unknown().optional(),
      "sourceTrustClass": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const {
      signalType,
      sourceId,
      sourceTrustClass,
      signalTimestamp,
      expiresAt,
      coordinates,
      boundingRegion,
      affectedEntityIds,
      affectedTwinCategories,
      payload,
      confidenceScore,
      causalLinkage,
      severity,
      metadata,
    } = req.body as {
      signalType?: string;
      sourceId?: number;
      sourceTrustClass?: string;
      signalTimestamp?: string;
      expiresAt?: string;
      coordinates?: Record<string, unknown>;
      boundingRegion?: Record<string, unknown>;
      affectedEntityIds?: string[];
      affectedTwinCategories?: string[];
      payload?: Record<string, unknown>;
      confidenceScore?: number;
      causalLinkage?: Array<{ targetEntityId: string; linkType: string; strength: number }>;
      severity?: string;
      metadata?: Record<string, unknown>;
    };

    if (!signalType || !signalTimestamp || !payload) {
      sendBadRequest(res, "signalType, signalTimestamp, and payload are required");
      return;
    }

    const { createSignalOverlay } = await import("@szl-holdings/worldline");
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? null;

    const overlay = await createSignalOverlay({
      orgId,
      signalType: signalType as import("@szl-holdings/db").OverlaySignalType,
      sourceId,
      sourceTrustClass: sourceTrustClass as import("@szl-holdings/db").SourceTrustClass | undefined,
      signalTimestamp: new Date(signalTimestamp),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      coordinates: coordinates as Parameters<typeof createSignalOverlay>[0]["coordinates"],
      boundingRegion,
      affectedEntityIds,
      affectedTwinCategories: affectedTwinCategories as import("@szl-holdings/db").SpatialTwinCategory[] | undefined,
      payload,
      confidenceScore,
      causalLinkage,
      severity: severity as "info" | "warning" | "critical" | undefined,
      metadata,
    });

    sendCreated(res, overlay);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/worldline/overlays/:overlayId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { overlayId } = req.params as { overlayId: string };
    const { getOverlayById } = await import("@szl-holdings/worldline");

    const overlay = await getOverlayById(overlayId);
    if (!overlay) {
      sendNotFound(res, `Overlay ${overlayId} not found`);
      return;
    }
    const user = req.user;
    const userOrgId = user?.orgs?.[0]?.orgId ?? null;
    const userRole = user?.orgs?.[0]?.role ?? "member";
    const isPrivileged = ["super_admin", "admin"].includes(userRole);
    if (!isPrivileged && overlay.orgId != null && overlay.orgId !== userOrgId) {
      sendNotFound(res, `Overlay ${overlayId} not found`);
      return;
    }
    sendSuccess(res, overlay);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.patch("/atlas/spatial/worldline/overlays/:overlayId/expire", authMiddleware(), requireRole("super_admin", "admin", "ops"), validateBody(bodyShape({})), async (req: Request, res: Response) => {
  try {
    const { overlayId } = req.params as { overlayId: string };
    const { expireOverlay } = await import("@szl-holdings/worldline");
    const user = req.user;
    const userRole = user?.orgs?.[0]?.role ?? "member";
    const isPrivileged = ["super_admin", "admin"].includes(userRole);
    const orgId = isPrivileged ? undefined : (user?.orgs?.[0]?.orgId ?? undefined);

    const success = await expireOverlay(overlayId, orgId);
    if (!success) {
      sendNotFound(res, `Overlay ${overlayId} not found`);
      return;
    }
    sendSuccess(res, { message: "Overlay expired", overlayId });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/model-lanes", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const { allLaneMetadata, LANE_TO_ROUTE_CLASS } = await import("@szl-holdings/atlas-spatial-runtime");
    const lanes = allLaneMetadata();
    sendSuccess(res, { lanes, routeClassMap: LANE_TO_ROUTE_CLASS });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/model-lanes/invoke", authMiddleware(), validateBody(bodyShape({
      "correlationId": z.unknown().optional(),
      "laneType": z.unknown().optional(),
      "messages": z.unknown().optional(),
      "overrideMaxTokens": z.unknown().optional(),
      "overrideModel": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { laneType, messages, correlationId, overrideModel, overrideMaxTokens } = req.body as {
      laneType?: string;
      messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      correlationId?: string;
      overrideModel?: string;
      overrideMaxTokens?: number;
    };

    if (!laneType || !messages?.length) {
      sendBadRequest(res, "laneType and messages are required");
      return;
    }

    const { mapLaneToRouteClass } = await import("@szl-holdings/atlas-spatial-runtime");
    const { routerCall } = await import("@szl-holdings/ai-engine");
    const user = req.user;

    const routeClass = mapLaneToRouteClass(laneType as import("@szl-holdings/atlas-spatial-runtime").ModelLaneType);

    const result = await routerCall({
      messages,
      routeClass,
      overrideModel,
      overrideMaxTokens,
      correlationId,
      tenantToggles: { tenantId: user?.orgs?.[0]?.orgId },
    });

    sendSuccess(res, {
      laneType,
      routeClass,
      content: result.completion.content,
      model: result.route.model,
      latencyMs: result.telemetry.latencyMs,
      totalTokens: result.telemetry.totalTokens,
      costEstimateUsd: result.telemetry.costEstimateUsd,
    });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/twins/matter", authMiddleware(), validateBody(bodyShape({
      "entityId": z.unknown().optional(),
      "state": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { entityId, state } = req.body as { entityId?: string; state?: Record<string, unknown> };
    if (!entityId || !state) {
      sendBadRequest(res, "entityId and state are required");
      return;
    }
    const { matterTwin } = await import("@szl-holdings/ai-engine");
    const twin = matterTwin.createTwin(entityId, state as unknown as Parameters<typeof matterTwin.createTwin>[1]);
    sendCreated(res, twin);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/twins/portfolio", authMiddleware(), validateBody(bodyShape({
      "entityId": z.unknown().optional(),
      "state": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { entityId, state } = req.body as { entityId?: string; state?: Record<string, unknown> };
    if (!entityId || !state) {
      sendBadRequest(res, "entityId and state are required");
      return;
    }
    const { portfolioTwin } = await import("@szl-holdings/ai-engine");
    const twin = portfolioTwin.createTwin(entityId, state as unknown as Parameters<typeof portfolioTwin.createTwin>[1]);
    sendCreated(res, twin);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/twins/incident", authMiddleware(), validateBody(bodyShape({
      "entityId": z.unknown().optional(),
      "state": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { entityId, state } = req.body as { entityId?: string; state?: Record<string, unknown> };
    if (!entityId || !state) {
      sendBadRequest(res, "entityId and state are required");
      return;
    }
    const { incidentTwin } = await import("@szl-holdings/ai-engine");
    const twin = incidentTwin.createTwin(entityId, state as unknown as Parameters<typeof incidentTwin.createTwin>[1]);
    sendCreated(res, twin);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.post("/atlas/spatial/twins/port", authMiddleware(), validateBody(bodyShape({
      "entityId": z.unknown().optional(),
      "state": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { entityId, state } = req.body as { entityId?: string; state?: Record<string, unknown> };
    if (!entityId || !state) {
      sendBadRequest(res, "entityId and state are required");
      return;
    }
    const { portTwin } = await import("@szl-holdings/ai-engine");
    const twin = portTwin.createTwin(entityId, state as unknown as Parameters<typeof portTwin.createTwin>[1]);
    sendCreated(res, twin);
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

router.get("/atlas/spatial/cross-domain/summary", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const domains = ["aegis", "vessels", "terra", "prism"] as const;
    type DomainStatus = { domain: string; twinCount: number; stableCount: number; degradedCount: number; avgDriftScore: number; activeBranches: number; lastSync: string };
    const summary: DomainStatus[] = domains.map(domain => {
      const seed = domain.charCodeAt(0) + domain.charCodeAt(domain.length - 1);
      const twinCount = 3 + (seed % 5);
      const degradedCount = seed % 3;
      const stableCount = twinCount - degradedCount;
      const avgDrift = parseFloat(((seed % 20) / 100 + 0.02).toFixed(3));
      const activeBranches = 1 + (seed % 4);
      return {
        domain,
        twinCount,
        stableCount,
        degradedCount,
        avgDriftScore: avgDrift,
        activeBranches,
        lastSync: new Date(Date.now() - (seed % 600) * 1000).toISOString(),
      };
    });
    const totals = {
      totalTwins: summary.reduce((s, d) => s + d.twinCount, 0),
      stableTotal: summary.reduce((s, d) => s + d.stableCount, 0),
      degradedTotal: summary.reduce((s, d) => s + d.degradedCount, 0),
      activeBranchesTotal: summary.reduce((s, d) => s + d.activeBranches, 0),
      avgDriftScore: parseFloat((summary.reduce((s, d) => s + d.avgDriftScore, 0) / summary.length).toFixed(3)),
    };
    sendSuccess(res, { domains: summary, totals, generatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Internal server error");
  }
});

export default router;
