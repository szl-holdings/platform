import { Router, type IRouter, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendCreated, handleRouteError } from "../lib/api-response";
import { validateBody, jsonObjectBodySchema } from "../lib/validation";
import { logger } from "../lib/logger";
import {
  defaultPolicyModeRegistry,
  PolicyModeConfigSchema,
  buildPolicyEvaluation,
} from "@szl-holdings/policy-engine";
import { defaultMemoryStore } from "@workspace/memory-fabric/store";
import type { MemoryEntry } from "@workspace/memory-fabric/types";

const router: IRouter = Router();

function buildMemoryEntry(overrides: Partial<MemoryEntry> & { id?: string; key: string; value: unknown }): MemoryEntry {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? randomUUID(),
    tier: overrides.tier ?? "entity",
    memoryType: overrides.tier ?? "entity",
    key: overrides.key,
    value: overrides.value,
    summary: overrides.summary,
    provenance: overrides.provenance ?? { source: "demo-seed", method: "import", createdAt: now },
    freshness: { lastUpdatedAt: now, isStale: false, ...(overrides.freshness ?? {}) },
    confidence: overrides.confidence ?? 0.92,
    retention: { policy: "persistent", pinned: false, ...(overrides.retention ?? {}) },
    sensitivity: overrides.sensitivity ?? "internal",
    linkedEntities: overrides.linkedEntities ?? [],
    linkedTraces: overrides.linkedTraces ?? [],
    linkedActions: overrides.linkedActions ?? [],
    tags: overrides.tags ?? ["demo", "seeded"],
    scopeId: overrides.scopeId,
    metadata: overrides.metadata ?? {},
  };
}

router.post(
  "/demo/seed-governed-scenarios",
  authMiddleware(),
  requireRole("super_admin", "admin"),
  validateBody(jsonObjectBodySchema),
  async (_req: Request, res: Response) => {
    try {
      const results: Record<string, unknown> = {};

      const vesselsModeId = "demo-vessels-reroute-mode";
      const carlotaModeId = "demo-carlota-vendor-mode";

      const vesselsModeConfig = PolicyModeConfigSchema.parse({
        id: vesselsModeId,
        scope: { product: "vessels", actionType: "vessel.reroute", workspace: "*" },
        mode: "approval-required",
        confidenceThreshold: 0.85,
        maxCostUsd: 50000,
        guardedEntitySensitivity: "confidential",
        environment: "production",
        reason: "Vessel rerouting carries significant fuel cost, contractual, and safety implications; requires operator sign-off.",
        createdBy: "demo-seed",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const carlotaModeConfig = PolicyModeConfigSchema.parse({
        id: carlotaModeId,
        scope: { product: "carlota-jo", actionType: "vendor.reschedule", workspace: "operations" },
        mode: "auto-within-guardrails",
        confidenceThreshold: 0.80,
        maxCostUsd: 2000,
        guardedEntitySensitivity: "internal",
        environment: "production",
        reason: "Vendor reschedule within cost guardrails can be handled autonomously to reduce operator load.",
        createdBy: "demo-seed",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      defaultPolicyModeRegistry.register(vesselsModeConfig);
      defaultPolicyModeRegistry.register(carlotaModeConfig);
      results.modesRegistered = [vesselsModeId, carlotaModeId];

      const vesselEval = buildPolicyEvaluation({
        action: "vessel.reroute",
        actionType: "vessel.reroute",
        product: "vessels",
        workspace: "operations",
        subjectRoles: ["ops", "analyst"],
        entitySensitivity: "confidential",
        confidence: 0.91,
        freshnessScore: 0.88,
        environment: "production",
        windowValid: true,
        projectedCostUsd: 34200,
        projectedImpact: "MV Albatross rerouted via Cape Finisterre to avoid Storm Nadia. +18h transit. Estimated fuel delta: +$34,200.",
        projectedRisk: "Weather risk eliminated. Minor schedule delay for 2 downstream port calls.",
        evidenceChain: [
          { source: "weather-intelligence", summary: "Storm Nadia Force-9 winds along original route for next 36h", confidence: 0.96, freshness: 0.99 },
          { source: "port-authority-feed", summary: "Finisterre waypoint clear; berth availability confirmed for revised ETA", confidence: 0.88, freshness: 0.91 },
          { source: "fuel-ledger", summary: "Current fuel margin adequate for +18% transit extension", confidence: 0.83, freshness: 0.85 },
        ],
        evaluatedBy: "vessels-agent-v2",
      });

      const carlotaEval = buildPolicyEvaluation({
        action: "vendor.reschedule",
        actionType: "vendor.reschedule",
        product: "carlota-jo",
        workspace: "operations",
        subjectRoles: ["ops"],
        entitySensitivity: "internal",
        confidence: 0.93,
        freshnessScore: 0.97,
        environment: "production",
        windowValid: true,
        projectedCostUsd: 450,
        projectedImpact: "FloorWorks Co. installation rescheduled from Friday 2pm to Monday 9am. Client notified automatically.",
        projectedRisk: "Minimal. Client confirmed availability for Monday slot. No penalty clause triggered.",
        evidenceChain: [
          { source: "calendar-integration", summary: "Client calendar shows Monday 9am as preferred alternative", confidence: 0.95, freshness: 0.99 },
          { source: "vendor-crm", summary: "FloorWorks confirms Monday slot available at no additional cost", confidence: 0.91, freshness: 0.97 },
        ],
        evaluatedBy: "carlota-agent-v1",
      });

      results.evaluations = {
        vessels: { evaluationId: vesselEval.evaluationId, mode: vesselEval.mode, action: vesselEval.action },
        carlota: { evaluationId: carlotaEval.evaluationId, mode: carlotaEval.mode, action: carlotaEval.action },
      };

      const vesselEntityEntry = buildMemoryEntry({
        tier: "entity",
        key: "vessel:mv-albatross:reroute-decision",
        value: {
          vesselId: "mv-albatross",
          vesselName: "MV Albatross",
          decision: "reroute-via-cape-finisterre",
          originalRoute: "Bay of Biscay direct",
          newRoute: "Cape Finisterre waypoint",
          reason: "Storm Nadia avoidance",
          evaluationId: vesselEval.evaluationId,
          status: "pending-approval",
        },
        summary: "MV Albatross reroute decision pending operator approval — Storm Nadia avoidance via Cape Finisterre",
        confidence: 0.91,
        sensitivity: "confidential",
        tags: ["demo", "vessels", "reroute", "pending-approval"],
        linkedActions: [vesselEval.evaluationId],
        metadata: { evaluation: vesselEval },
      });

      const vesselWorkingEntry = buildMemoryEntry({
        tier: "working",
        key: `run:${vesselEval.evaluationId}:weather-context`,
        value: {
          storm: "Nadia",
          severity: "Force-9",
          duration: "36h",
          affectedRoute: "Bay of Biscay",
          source: "weather-intelligence",
        },
        summary: "Live weather context for Storm Nadia fetched during reroute evaluation",
        confidence: 0.96,
        retention: { policy: "ephemeral", pinned: false },
        tags: ["demo", "vessels", "weather", "ephemeral"],
        scopeId: vesselEval.evaluationId,
      });

      const carlotaEntityEntry = buildMemoryEntry({
        tier: "entity",
        key: "vendor:floorworks:reschedule",
        value: {
          vendorId: "floorworks-co",
          vendorName: "FloorWorks Co.",
          originalSlot: "Friday 2pm",
          newSlot: "Monday 9am",
          clientConfirmed: true,
          cost: 450,
          evaluationId: carlotaEval.evaluationId,
          status: "auto-executed",
        },
        summary: "FloorWorks Co. reschedule auto-executed within guardrails — Monday 9am confirmed",
        confidence: 0.93,
        sensitivity: "internal",
        tags: ["demo", "carlota", "vendor", "auto-executed"],
        linkedActions: [carlotaEval.evaluationId],
        metadata: { evaluation: carlotaEval },
      });

      const lessonEntry = buildMemoryEntry({
        tier: "skill",
        key: "pattern:vendor-reschedule:low-cost",
        value: "Vendor reschedule requests with cost < $2000 and confirmed client availability can be auto-executed without operator review.",
        summary: "Auto-execute low-cost vendor reschedules when client availability is confirmed",
        confidence: 0.89,
        retention: { policy: "archival", pinned: true },
        tags: ["demo", "carlota", "lesson", "playbook"],
      });

      defaultMemoryStore.put(vesselEntityEntry);
      defaultMemoryStore.put(vesselWorkingEntry);
      defaultMemoryStore.put(carlotaEntityEntry);
      defaultMemoryStore.put(lessonEntry);

      results.memoryEntries = {
        seeded: [vesselEntityEntry.id, vesselWorkingEntry.id, carlotaEntityEntry.id, lessonEntry.id],
      };

      logger.info(results, "demo.governed-scenarios.seeded");

      sendCreated(res, {
        message: "Governed scenario seed complete",
        ...results,
        scenarios: [
          {
            name: "Vessels Reroute — Approval Required",
            product: "vessels",
            actionType: "vessel.reroute",
            mode: "approval-required",
            vessel: "MV Albatross",
            reason: "Storm Nadia avoidance",
            cost: 34200,
            evaluationId: vesselEval.evaluationId,
          },
          {
            name: "Carlota Vendor Reschedule — Auto Within Guardrails",
            product: "carlota-jo",
            actionType: "vendor.reschedule",
            mode: "auto-within-guardrails",
            vendor: "FloorWorks Co.",
            cost: 450,
            evaluationId: carlotaEval.evaluationId,
          },
        ],
      });
    } catch (err) {
      handleRouteError(res, err, "demo:seed-governed-scenarios");
    }
  }
);

export default router;
