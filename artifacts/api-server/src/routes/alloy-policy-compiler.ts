/**
 * Alloy Policy Authoring Studio — persistence for compiled policies,
 * version history, and per-studio test case definitions.
 *
 * Auth model:
 *   GET /state is public (whitelisted in global-auth-enforcer) so the studio
 *   demo surface can render its initial state without a session. All
 *   mutating endpoints require an authenticated user via authMiddleware,
 *   and CSRF protection applies (no exemption in csrf.ts).
 *
 *   GET    /api/alloy/policy-compiler/state[?studioId=default]
 *   POST   /api/alloy/policy-compiler/versions
 *   POST   /api/alloy/policy-compiler/versions/:externalId/sign
 *   POST   /api/alloy/policy-compiler/test-cases
 *   DELETE /api/alloy/policy-compiler/test-cases/:externalId
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db, alloyPolicyVersions, alloyPolicyTestCases } from "@szl-holdings/db";
import { and, asc, eq, max } from "drizzle-orm";
import { bodyShape } from "@szl-holdings/contracts/common";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
  handleRouteError,
} from "../lib/api-response";
import { validateBody } from "../lib/validation";
import { authMiddleware } from "../middlewares/auth";

const requireAuth = authMiddleware({ required: true });

const router: IRouter = Router();

const DEFAULT_STUDIO = "default";

function studioIdFromQuery(req: Request): string {
  const raw = req.query["studioId"];
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim().slice(0, 64);
  return DEFAULT_STUDIO;
}

function studioIdFromBody(body: Record<string, unknown>): string {
  const raw = body["studioId"];
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim().slice(0, 64);
  return DEFAULT_STUDIO;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

router.get("/alloy/policy-compiler/state", async (req: Request, res: Response) => {
  try {
    const studioId = studioIdFromQuery(req);
    const [versions, testCases] = await Promise.all([
      db
        .select()
        .from(alloyPolicyVersions)
        .where(eq(alloyPolicyVersions.studioId, studioId))
        .orderBy(asc(alloyPolicyVersions.versionNumber)),
      db
        .select()
        .from(alloyPolicyTestCases)
        .where(eq(alloyPolicyTestCases.studioId, studioId))
        .orderBy(asc(alloyPolicyTestCases.createdAt)),
    ]);
    sendSuccess(res, { studioId, versions, testCases });
  } catch (err) {
    handleRouteError(res, err, "alloy-policy-compiler:state");
  }
});

router.post(
  "/alloy/policy-compiler/versions",
  requireAuth,
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      const studioId = studioIdFromBody(body);

      const input = typeof body["input"] === "string" ? body["input"] : null;
      const policy = body["policy"];
      const author = typeof body["author"] === "string" ? body["author"] : null;
      const authorId = typeof body["authorId"] === "string" ? body["authorId"] : null;
      const message = typeof body["message"] === "string" ? body["message"] : "";
      const signers = Array.isArray(body["signers"]) ? body["signers"] : [];

      if (!input || !policy || typeof policy !== "object" || !author || !authorId) {
        sendBadRequest(res, "input, policy, author, and authorId are required");
        return;
      }

      const [{ value: maxVersion }] = await db
        .select({ value: max(alloyPolicyVersions.versionNumber) })
        .from(alloyPolicyVersions)
        .where(eq(alloyPolicyVersions.studioId, studioId));

      const versionNumber = (maxVersion ?? 0) + 1;
      const externalId = typeof body["externalId"] === "string" && body["externalId"].length > 0
        ? body["externalId"]
        : `polver_${uid()}`;

      const [row] = await db
        .insert(alloyPolicyVersions)
        .values({
          externalId,
          studioId,
          versionNumber,
          input,
          policy: policy as never,
          author,
          authorId,
          message: message || `Version ${versionNumber}`,
          signers: signers as never,
        })
        .returning();

      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, "alloy-policy-compiler:create-version");
    }
  },
);

router.post(
  "/alloy/policy-compiler/versions/:externalId/sign",
  requireAuth,
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const externalId = req.params["externalId"];
      if (!externalId) { sendBadRequest(res, "externalId is required"); return; }
      const body = req.body as Record<string, unknown>;
      const name = typeof body["name"] === "string" ? body["name"] : null;
      const role = typeof body["role"] === "string" ? body["role"] : null;
      if (!name || !role) {
        sendBadRequest(res, "name and role are required");
        return;
      }

      const [existing] = await db
        .select()
        .from(alloyPolicyVersions)
        .where(eq(alloyPolicyVersions.externalId, externalId))
        .limit(1);

      if (!existing) { sendNotFound(res, "PolicyVersion"); return; }

      const currentSigners = Array.isArray(existing.signers)
        ? (existing.signers as Array<{ name: string; role: string; signedAt: number }>)
        : [];
      if (currentSigners.some((s) => s.name === name)) {
        sendSuccess(res, existing);
        return;
      }
      const nextSigners = [...currentSigners, { name, role, signedAt: Date.now() }];

      const [updated] = await db
        .update(alloyPolicyVersions)
        .set({ signers: nextSigners as never })
        .where(eq(alloyPolicyVersions.externalId, externalId))
        .returning();

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, "alloy-policy-compiler:sign-version");
    }
  },
);

router.post(
  "/alloy/policy-compiler/test-cases",
  requireAuth,
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      const studioId = studioIdFromBody(body);
      const name = typeof body["name"] === "string" ? body["name"] : null;
      const context = body["context"];
      const expectedOutcome = typeof body["expectedOutcome"] === "string" ? body["expectedOutcome"] : null;
      if (!name || !expectedOutcome || !context || typeof context !== "object") {
        sendBadRequest(res, "name, context, and expectedOutcome are required");
        return;
      }
      const externalId = typeof body["externalId"] === "string" && body["externalId"].length > 0
        ? body["externalId"]
        : `polte_${uid()}`;

      const [row] = await db
        .insert(alloyPolicyTestCases)
        .values({
          externalId,
          studioId,
          name,
          context: context as never,
          expectedOutcome,
        })
        .returning();

      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, "alloy-policy-compiler:create-test-case");
    }
  },
);

router.delete(
  "/alloy/policy-compiler/test-cases/:externalId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const externalId = req.params["externalId"];
      if (!externalId) { sendBadRequest(res, "externalId is required"); return; }
      const studioId = studioIdFromQuery(req);
      const deleted = await db
        .delete(alloyPolicyTestCases)
        .where(
          and(
            eq(alloyPolicyTestCases.externalId, externalId),
            eq(alloyPolicyTestCases.studioId, studioId),
          ),
        )
        .returning();
      if (deleted.length === 0) { sendNotFound(res, "PolicyTestCase"); return; }
      sendSuccess(res, { deleted: true, externalId });
    } catch (err) {
      handleRouteError(res, err, "alloy-policy-compiler:delete-test-case");
    }
  },
);

export default router;
