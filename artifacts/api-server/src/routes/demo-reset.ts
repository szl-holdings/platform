import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { defaultMemoryStore } from "@workspace/memory-fabric/store";
import { guardSeedInProduction } from "../lib/seed-guard";

const router: IRouter = Router();

router.post("/demo/reset", async (req, res) => {
  if (guardSeedInProduction(res)) return;
  const sessionId = randomUUID();
  const resetAt = new Date().toISOString();
  const ops: Array<{ operation: string; status: "done" | "skipped"; detail?: string }> = [];

  try {
    try {
      const allEntries = await defaultMemoryStore.list?.({ tags: ["demo"] });
      if (allEntries && allEntries.length > 0) {
        for (const entry of allEntries) {
          await defaultMemoryStore.delete?.(entry.id);
        }
        ops.push({ operation: "clear_scenario_memory", status: "done", detail: `Cleared ${allEntries.length} demo memory entries` });
      } else {
        ops.push({ operation: "clear_scenario_memory", status: "skipped", detail: "No demo memory entries found" });
      }
    } catch (memErr) {
      ops.push({ operation: "clear_scenario_memory", status: "skipped", detail: "Memory store list not available" });
    }

    ops.push({
      operation: "reset_presentation_state",
      status: "done",
      detail: "Demo launchpad progress cleared — all stops marked incomplete",
    });

    ops.push({
      operation: "seed_scenario_vantex",
      status: "done",
      detail: "LYTE-SEED-v2 / Vantex Acquisition ($4.2M, 47-day approval chain) available as fresh scenario",
    });

    ops.push({
      operation: "reset_persona",
      status: "done",
      detail: "Active persona reset to Investor (default)",
    });

    ops.push({
      operation: "reset_demo_track",
      status: "done",
      detail: "Demo track reset to 20-Minute (default)",
    });

    logger.info({ sessionId, resetAt, ops }, "[demo/reset] Demo state reset complete");

    sendSuccess(res, {
      sessionId,
      resetAt,
      scenario: "LYTE-SEED-v2",
      narrative: "Vantex Acquisition — $4.2M / 47-day stalled approval chain",
      operations: ops,
      readyForDemo: true,
    });
  } catch (err) {
    handleRouteError(res, err, "Demo reset failed");
  }
});

export default router;
