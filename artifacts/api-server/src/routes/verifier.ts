import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request } from "express";
import {
  verify,
  defaultVerifierStore,
  VerifierContextSchema,
  VerifierOutputSchema,
  VerifierTargetSchema,
  type VerifierStoreQuery,
} from "@workspace/verifier";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  handleRouteError,
  sendNotFound,
  sendBadRequest,
} from "../lib/api-response";

const router: IRouter = Router();

const ALLOWED_TARGET_TYPES = new Set(["plan", "plan_step", "skill_run", "action", "output"]);
const ALLOWED_OUTCOMES = new Set(["pass", "fail", "warn", "blocked"]);

const PRIVILEGED_ROLES = new Set(["admin", "super_admin"]);

/**
 * Resolve the org-scope for a request.
 *
 * - Internal agents bypass scoping (orgIds === undefined → cross-org).
 * - Privileged roles (admin / super_admin) may opt into cross-org reads
 *   via `?allOrgs=true`. By default they remain scoped to their own
 *   memberships, matching every other authenticated user.
 * - Returns `[]` (empty allow-list, matches nothing) when the caller has
 *   no org memberships and is not privileged — so we never accidentally
 *   leak rows that were saved with `orgId = null`.
 */
function resolveOrgScope(req: Request): { orgIds: number[] | undefined } {
  if (req.isInternalAgent) return { orgIds: undefined };
  const user = req.user;
  if (!user) return { orgIds: [] };

  const isPrivileged = user.roles.some((r) => PRIVILEGED_ROLES.has(r));
  const wantsAllOrgs = String(req.query["allOrgs"] ?? "") === "true";
  if (isPrivileged && wantsAllOrgs) return { orgIds: undefined };

  return { orgIds: user.orgs.map((o) => o.orgId) };
}

/** Pick the org id to stamp on a newly created decision. */
function resolveSaveOrgId(req: Request, requested: number | null | undefined): number | null {
  // Internal agents may persist with the org id they explicitly set.
  if (req.isInternalAgent) return requested ?? null;
  const user = req.user;
  if (!user) return null;
  const memberOrgIds = new Set(user.orgs.map((o) => o.orgId));
  // Honor a caller-supplied org id only if the caller is a member.
  if (typeof requested === "number" && memberOrgIds.has(requested)) return requested;
  // Otherwise default to the caller's first membership (deterministic).
  return user.orgs[0]?.orgId ?? null;
}

router.post("/verifier", authMiddleware(), async (req, res) => {
  try {
    const body = req.body as {
      target?: unknown;
      output?: unknown;
      context?: unknown;
      persist?: boolean;
    };
    const outputParse = VerifierOutputSchema.safeParse(body.output ?? {});
    if (!outputParse.success) {
      sendBadRequest(res, `Invalid output: ${outputParse.error.message}`);
      return;
    }
    const ctxParse = VerifierContextSchema.safeParse(body.context ?? {});
    if (!ctxParse.success) {
      sendBadRequest(res, `Invalid context: ${ctxParse.error.message}`);
      return;
    }

    // Target is optional — when omitted, generate a synthetic "output"
    // target so we can use the unified 3-arg engine signature.
    let target;
    if (body.target !== undefined) {
      const t = VerifierTargetSchema.safeParse(body.target);
      if (!t.success) {
        sendBadRequest(res, `Invalid target: ${t.error.message}`);
        return;
      }
      target = t.data;
    } else {
      target = { targetType: "output" as const, targetId: randomUUID() };
    }

    // Stamp the owning org so persisted records can be tenant-scoped on
    // read. Honors caller-supplied context.orgId only when the caller is
    // a member of that org; otherwise falls back to their first org.
    const stampedOrgId = resolveSaveOrgId(req, ctxParse.data.orgId ?? null);
    const scopedContext = { ...ctxParse.data, orgId: stampedOrgId };

    const decision = verify(outputParse.data, target, scopedContext);
    if (body.persist !== false) {
      await defaultVerifierStore.save(decision);
    }
    sendCreated(res, decision);
  } catch (err) {
    handleRouteError(res, err, "Failed to verify output");
  }
});

router.get("/verifier", authMiddleware(), async (req, res) => {
  try {
    const query: VerifierStoreQuery = {};
    if (req.query.targetType) {
      const t = String(req.query.targetType);
      if (!ALLOWED_TARGET_TYPES.has(t)) {
        sendBadRequest(res, `Invalid targetType: ${t}`);
        return;
      }
      query.targetType = t as VerifierStoreQuery["targetType"];
    }
    if (req.query.targetId) query.targetId = String(req.query.targetId);
    if (req.query.traceId) query.traceId = String(req.query.traceId);
    if (req.query.planId) query.planId = String(req.query.planId);
    if (req.query.outcome) {
      const o = String(req.query.outcome);
      if (!ALLOWED_OUTCOMES.has(o)) {
        sendBadRequest(res, `Invalid outcome: ${o}`);
        return;
      }
      query.outcome = o as VerifierStoreQuery["outcome"];
    }

    const limit = parseInt((req.query.limit as string) ?? "50", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    if (isNaN(limit) || limit < 1 || limit > 500) {
      sendBadRequest(res, "limit must be between 1 and 500");
      return;
    }
    if (isNaN(offset) || offset < 0) {
      sendBadRequest(res, "offset must be >= 0");
      return;
    }
    query.limit = limit;
    query.offset = offset;

    const { orgIds } = resolveOrgScope(req);
    if (orgIds !== undefined) query.orgIds = orgIds;

    const { items, total } = await defaultVerifierStore.list(query);
    sendSuccess(res, { items, total, limit, offset });
  } catch (err) {
    handleRouteError(res, err, "Failed to list verifier results");
  }
});

router.get("/verifier/target/:targetType/:targetId", authMiddleware(), async (req, res) => {
  try {
    const targetType = String(req.params.targetType);
    const targetId = String(req.params.targetId);
    if (!ALLOWED_TARGET_TYPES.has(targetType)) {
      sendBadRequest(res, `Invalid targetType: ${targetType}`);
      return;
    }
    const { orgIds } = resolveOrgScope(req);
    const latest = await defaultVerifierStore.latestForTarget(
      targetType as "plan" | "plan_step" | "skill_run" | "action" | "output",
      targetId,
      { orgIds },
    );
    if (!latest) {
      // Return 404 (not 403) on cross-org access to avoid leaking existence.
      sendNotFound(res, "No verifier result for target");
      return;
    }
    sendSuccess(res, latest);
  } catch (err) {
    handleRouteError(res, err, "Failed to get verifier result for target");
  }
});

router.get("/verifier/:id", authMiddleware(), async (req, res) => {
  try {
    const { orgIds } = resolveOrgScope(req);
    const decision = await defaultVerifierStore.get(String(req.params.id), { orgIds });
    if (!decision) {
      // 404 (not 403) on cross-org miss — do not leak record existence.
      sendNotFound(res, "Verifier result not found");
      return;
    }
    sendSuccess(res, decision);
  } catch (err) {
    handleRouteError(res, err, "Failed to get verifier result");
  }
});

router.delete(
  "/verifier/:id",
  authMiddleware(),
  requireRole("admin", "super_admin"),
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const { orgIds } = resolveOrgScope(req);
      const deleted = await defaultVerifierStore.delete(id, { orgIds });
      if (!deleted) {
        sendNotFound(res, "Verifier result not found");
        return;
      }
      sendSuccess(res, { deleted: id });
    } catch (err) {
      handleRouteError(res, err, "Failed to delete verifier result");
    }
  },
);

export default router;
