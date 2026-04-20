/**
 * Control Tower — Substrate Replay Endpoint
 *
 * POST /control-tower/substrate/replay
 *
 * Triggers a replay or counterfactual run against a past substrate run.
 * Returns the full CounterfactualDiff for Eval Console consumption.
 *
 * Authentication: operator-tier enforced via authMiddleware + requireRole("ops", "admin")
 * applied to each route handler.
 */

import { z } from "zod";
import { type IRouter } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth";

// ─── Request Schema (Zod boundary validation) ────────────────────────────────

const ReplayRequestSchema = z.object({
  runId: z.string().min(1, "runId is required"),
  counterfactual: z.boolean().optional(),
  model: z.string().optional(),
  policyId: z.string().optional(),
  // Workflow overrides are complex nested objects; validated as a structured
  // record (not raw unknown) so every key is at least a primitive or object.
  workflow: z.record(z.unknown()).optional(),
});

export function register(router: IRouter): void {
  /**
   * POST /substrate/replay
   *
   * Body: { runId, counterfactual?, model?, policyId?, workflow? }
   *
   * Response: ReplayEndpointResponse
   *   { sourceRunId, replayRunId, mode, stableHashes, mismatchedStages, diff, replayRun }
   */
  router.post(
    "/substrate/replay",
    authMiddleware(),
    requireRole("ops", "admin"),
    async (req, res) => {
      const parsed = ReplayRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const body = parsed.data;

      try {
        const { handleReplayRequest } = await import("@szl/substrate");

        const response = await handleReplayRequest({
          runId: body.runId,
          counterfactual: body.counterfactual,
          model: body.model,
          policyId: body.policyId,
          // body.workflow is validated as z.record(z.unknown()); the substrate
          // engine performs further schema validation at runtime.
          workflow: body.workflow as import("@szl/substrate").WorkflowDefinition | undefined,
        });

        res.json(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";

        if (message.includes("not found")) {
          res.status(404).json({ error: message });
          return;
        }

        console.error("[substrate-replay] Error:", message);
        res.status(500).json({ error: message });
      }
    },
  );

  /**
   * GET /substrate/run/:runId
   *
   * Fetch a pipeline run by ID (from the substrate run store).
   * Useful for polling run status on async approval gates.
   */
  router.get(
    "/substrate/run/:runId",
    authMiddleware(),
    requireRole("ops", "admin"),
    async (req, res) => {
      const runIdParsed = z.string().min(1).safeParse(req.params["runId"]);
      if (!runIdParsed.success) {
        res.status(400).json({ error: "Invalid runId" });
        return;
      }

      try {
        const { defaultRunStore } = await import("@szl/substrate");

        const run = await defaultRunStore.get(runIdParsed.data);
        if (!run) {
          res.status(404).json({ error: `Run '${runIdParsed.data}' not found` });
          return;
        }

        res.json(run);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
      }
    },
  );

  /**
   * GET /substrate/metrics
   *
   * Return aggregate telemetry metrics from the substrate runtime.
   * Restricted to ops/admin to prevent metric exfiltration.
   */
  router.get(
    "/substrate/metrics",
    authMiddleware(),
    requireRole("ops", "admin"),
    async (_req, res) => {
      try {
        const { getMetrics } = await import("@szl/substrate");
        res.json(getMetrics());
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: message });
      }
    },
  );
}
