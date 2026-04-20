import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { randomUUID } from "crypto";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { defaultMemoryStore } from "@workspace/memory-fabric/store";
import { guardSeedInProduction, isProductionEnvironment } from "../lib/seed-guard";
import { authMiddleware } from "../middlewares/auth";

import { validateBody } from "../lib/validation";

const router: IRouter = Router();

const NARRATIVE_OPTIONS = ["all", "business", "security", "maritime", "legal"] as const;
type NarrativeOption = (typeof NARRATIVE_OPTIONS)[number];

const NARRATIVE_LABELS: Record<NarrativeOption, string> = {
  all: "All four narratives (full reset)",
  business: "Business / RevOps / CFO (Lyte)",
  security: "Security / SOC / Risk (Aegis)",
  maritime: "Maritime / Sanctions / Vessels",
  legal: "Legal / Compliance (PRISM Counsel)",
};

function isDemoModeEnabled(): boolean {
  // Only available in demo / staging environments. DEMO_MODE=true must be set
  // explicitly. Production is also blocked by the seed-guard regardless.
  if (isProductionEnvironment()) return false;
  const flag = (process.env["DEMO_MODE"] ?? "").trim().toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}

/**
 * Status endpoint — used by the in-platform reset toolbar to decide whether to
 * render itself. Public (no auth) so the toolbar can ask before showing.
 * Returns enabled=false in production or when DEMO_MODE is not set.
 */
router.get("/demo/reset/status", (_req: Request, res: Response) => {
  sendSuccess(res, {
    enabled: isDemoModeEnabled(),
    narratives: NARRATIVE_OPTIONS.map((id) => ({ id, label: NARRATIVE_LABELS[id] })),
    estimatedSeconds: { all: 60, single: 30 },
  });
});

/**
 * Admin-only role guard for the reset endpoint. We require an authenticated
 * caller with admin / super_admin / founder_admin / platform_admin so that
 * presenters with admin sessions can trigger the reset from the UI without
 * touching the terminal, while ordinary visitors cannot.
 */
function requireAdminRole(req: Request, res: Response, next: NextFunction): void {
  const roles = (req.user?.roles ?? []) as string[];
  const platformRole = (req.user as { platformRole?: string } | undefined)?.platformRole;
  const adminRoleNames = new Set(["admin", "super_admin", "founder_admin", "platform_admin"]);
  const isAdmin =
    roles.some((r) => adminRoleNames.has(r)) ||
    (typeof platformRole === "string" && adminRoleNames.has(platformRole));
  if (!isAdmin) {
    sendError(res, "Demo reset requires admin role", 403, "FORBIDDEN");
    return;
  }
  next();
}

router.post(
  "/demo/reset",
  validateBody(bodyShape({})),
  // Order matters: production guard first (returns 404, never reveals the
  // endpoint exists), then DEMO_MODE gate, then auth + admin check.
  (_req: Request, res: Response, next: NextFunction) => {
    if (guardSeedInProduction(res)) return;
    if (!isDemoModeEnabled()) {
      sendError(
        res,
        "Demo reset is disabled. Set DEMO_MODE=true to enable in-platform reset.",
        404,
        "DEMO_MODE_DISABLED",
      );
      return;
    }
    next();
  },
  authMiddleware({ required: true }),
  requireAdminRole,
  async (req: Request, res: Response) => {
    const sessionId = randomUUID();
    const startedAt = new Date();
    const ops: Array<{ operation: string; status: "done" | "skipped" | "failed"; detail?: string }> = [];

    const requestedNarrative = (req.body?.narrative ?? "all") as string;
    const narrative = (NARRATIVE_OPTIONS as readonly string[]).includes(requestedNarrative)
      ? (requestedNarrative as NarrativeOption)
      : null;

    if (!narrative) {
      sendError(
        res,
        `Invalid narrative. Must be one of: ${NARRATIVE_OPTIONS.join(", ")}`,
        400,
        "INVALID_NARRATIVE",
      );
      return;
    }

    try {
      // 1. Clear in-memory demo entries from the memory fabric (best-effort).
      try {
        const allEntries = await defaultMemoryStore.list?.({ tags: ["demo"] });
        if (allEntries && allEntries.length > 0) {
          for (const entry of allEntries) {
            await defaultMemoryStore.delete?.(entry.id);
          }
          ops.push({
            operation: "clear_scenario_memory",
            status: "done",
            detail: `Cleared ${allEntries.length} demo memory entries`,
          });
        } else {
          ops.push({ operation: "clear_scenario_memory", status: "skipped", detail: "No demo memory entries found" });
        }
      } catch {
        ops.push({ operation: "clear_scenario_memory", status: "skipped", detail: "Memory store list not available" });
      }

      // 2. Re-run the seed scripts for the selected narrative. Dynamic import
      // keeps the heavy seed module out of the api-server cold-start path.
      try {
        const { seedNarrative, seedAllNarratives } = await import("@workspace/demo-seed");
        if (narrative === "all") {
          await seedAllNarratives();
          ops.push({
            operation: "seed_all_narratives",
            status: "done",
            detail: "All four narratives re-seeded (business, security, maritime, legal)",
          });
        } else {
          await seedNarrative(narrative);
          ops.push({
            operation: `seed_${narrative}_narrative`,
            status: "done",
            detail: `Narrative '${NARRATIVE_LABELS[narrative]}' re-seeded`,
          });
        }
      } catch (seedErr) {
        const msg = seedErr instanceof Error ? seedErr.message : String(seedErr);
        ops.push({ operation: "seed_narrative", status: "failed", detail: msg });
        throw seedErr;
      }

      // 3. Reset presentation state hints (consumed by the launchpad UI).
      ops.push({
        operation: "reset_presentation_state",
        status: "done",
        detail: "Demo launchpad progress cleared — all stops marked incomplete",
      });

      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      logger.info(
        {
          sessionId,
          narrative,
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          durationMs,
          adminUserId: req.user?.id,
          ops,
        },
        "[demo/reset] Demo state reset complete",
      );

      sendSuccess(res, {
        sessionId,
        narrative,
        narrativeLabel: NARRATIVE_LABELS[narrative],
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs,
        operations: ops,
        readyForDemo: true,
      });
    } catch (err) {
      logger.error({ err, sessionId, narrative, ops }, "[demo/reset] Demo reset failed");
      handleRouteError(res, err, "Demo reset failed");
    }
  },
);

export default router;
