/**
 * Pipeline Command — shared sales pipeline (org-scoped) with audit log.
 *
 * Replaces the per-browser localStorage state used by the
 * `/admin/pipeline-command` page in the szl-holdings artifact so deals are
 * visible to every admin in the same organization (and only to them).
 *
 * Auth: mounted under the /admin router which already enforces
 *   authMiddleware() + requireRole("admin"). All endpoints inherit those.
 *
 * Org scoping (strict, no fallback):
 *   - Every deal has a NOT NULL org_id, set at create time.
 *   - List queries return only deals whose org_id is in the caller's
 *     org membership set. There is no "null org" visibility path.
 *   - Single-org admins: org_id is taken from their membership.
 *   - Multi-org admins: must pass `orgId` in the request body, and that
 *     org must be in their membership set; otherwise 400 / 403.
 *   - Admins with no org membership cannot create deals (400) and see
 *     an empty list.
 *
 * Audit log:
 *   - pipeline_deal_events carries its own org_id and account_snapshot,
 *     so the audit trail outlives the deal it described and remains
 *     authorizable independently of the deals table.
 *   - GET /admin/pipeline-deals/:id/events returns events filtered by
 *     deal_id AND the caller's org membership. Works after delete.
 *   - Stage transitions (including the implicit one on create) write a
 *     row with from_stage / to_stage, actor user id, email, and name.
 */

import type { IRouter, Request, Response } from "express";
import {
  db,
  pipelineDealsTable,
  pipelineDealEventsTable,
  PIPELINE_VERTICALS,
  PIPELINE_STAGES,
  type PipelineStage,
} from "@szl-holdings/db";
import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { z } from "zod";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  sendForbidden,
  handleRouteError,
} from "../../lib/api-response.js";
import { jsonObjectBodySchema, validateBody } from "../../lib/validation.js";
import { logger } from "../../lib/logger.js";

const verticalEnum = z.enum(PIPELINE_VERTICALS);
const stageEnum = z.enum(PIPELINE_STAGES);

const createDealSchema = z.object({
  account: z.string().min(1).max(200),
  vertical: verticalEnum,
  champion: z.string().max(200).optional().default(""),
  championTitle: z.string().max(200).optional().default(""),
  stage: stageEnum.optional().default("Researched"),
  fitScore: z.number().int().min(1).max(10).optional().default(7),
  nextStep: z.string().max(2000).optional().default(""),
  notes: z.string().max(8000).optional().default(""),
  orgId: z.number().int().positive().optional(),
});

const updateDealSchema = z.object({
  account: z.string().min(1).max(200).optional(),
  vertical: verticalEnum.optional(),
  champion: z.string().max(200).optional(),
  championTitle: z.string().max(200).optional(),
  stage: stageEnum.optional(),
  fitScore: z.number().int().min(1).max(10).optional(),
  nextStep: z.string().max(2000).optional(),
  notes: z.string().max(8000).optional(),
});

const idParamsSchema = z.object({ id: z.coerce.number().int().positive() });

function actorOrgIds(req: Request): number[] {
  return req.user?.orgs?.map((o) => o.orgId).filter((n): n is number => typeof n === "number") ?? [];
}

function actorEmail(req: Request): string | null {
  return req.user?.email ?? null;
}

function actorName(req: Request): string | null {
  return req.user?.displayName ?? req.user?.email ?? null;
}

function actorUserId(req: Request): number | null {
  const id = req.user?.id;
  return typeof id === "number" && id > 0 ? id : null;
}

/**
 * Resolve the org a write should land in.
 *  - 0 memberships => null (caller will return 400)
 *  - 1 membership  => use it; if body.orgId is provided, it must match
 *  - >1 memberships => body.orgId is REQUIRED and must be a member
 * Returns { orgId } on success, or { error, status } on rejection.
 */
function resolveWriteOrg(
  req: Request,
  bodyOrgId: number | undefined,
): { orgId: number } | { error: string; status: number } {
  const memberships = actorOrgIds(req);
  if (memberships.length === 0) {
    return { error: "Your account has no organization membership; cannot create pipeline deals.", status: 400 };
  }
  if (bodyOrgId !== undefined) {
    if (!memberships.includes(bodyOrgId)) {
      return { error: "You are not a member of the specified organization.", status: 403 };
    }
    return { orgId: bodyOrgId };
  }
  if (memberships.length === 1) {
    return { orgId: memberships[0] };
  }
  return {
    error: "Your account belongs to multiple organizations; specify `orgId` in the request body.",
    status: 400,
  };
}

async function recordEvent(args: {
  dealId: number;
  orgId: number;
  accountSnapshot: string;
  fromStage: PipelineStage | null;
  toStage: PipelineStage;
  req: Request;
  note?: string | null;
}): Promise<void> {
  try {
    await db.insert(pipelineDealEventsTable).values({
      dealId: args.dealId,
      orgId: args.orgId,
      accountSnapshot: args.accountSnapshot,
      fromStage: args.fromStage,
      toStage: args.toStage,
      actorUserId: actorUserId(args.req),
      actorEmail: actorEmail(args.req),
      actorName: actorName(args.req),
      note: args.note ?? null,
    });
  } catch (err) {
    // Audit failure must not break the user-facing operation; log it.
    logger.warn({ err, dealId: args.dealId }, "[pipeline-deals] failed to write audit event");
  }
}

/** Strict org filter — no null fallback. Returns undefined when caller has no orgs (caller should short-circuit). */
function buildOrgFilter(req: Request): SQL | null {
  const orgIds = actorOrgIds(req);
  if (orgIds.length === 0) return null;
  return inArray(pipelineDealsTable.orgId, orgIds);
}

function buildEventOrgFilter(req: Request): SQL | null {
  const orgIds = actorOrgIds(req);
  if (orgIds.length === 0) return null;
  return inArray(pipelineDealEventsTable.orgId, orgIds);
}

export function register(router: IRouter): void {
  router.get("/admin/pipeline-deals", async (req: Request, res: Response) => {
    try {
      const filter = buildOrgFilter(req);
      if (!filter) {
        sendSuccess(res, []);
        return;
      }
      const rows = await db
        .select()
        .from(pipelineDealsTable)
        .where(filter)
        .orderBy(desc(pipelineDealsTable.updatedAt));
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, "Failed to list pipeline deals");
    }
  });

  router.post(
    "/admin/pipeline-deals",
    validateBody(jsonObjectBodySchema),
    async (req: Request, res: Response) => {
      try {
        const body = createDealSchema.parse(req.body);
        const resolved = resolveWriteOrg(req, body.orgId);
        if ("error" in resolved) {
          if (resolved.status === 403) sendForbidden(res, resolved.error);
          else sendBadRequest(res, resolved.error);
          return;
        }
        const userId = actorUserId(req);
        const [created] = await db
          .insert(pipelineDealsTable)
          .values({
            orgId: resolved.orgId,
            account: body.account,
            vertical: body.vertical,
            champion: body.champion,
            championTitle: body.championTitle,
            stage: body.stage,
            fitScore: body.fitScore,
            nextStep: body.nextStep,
            notes: body.notes,
            createdByUserId: userId,
            updatedByUserId: userId,
          })
          .returning();
        await recordEvent({
          dealId: created.id,
          orgId: resolved.orgId,
          accountSnapshot: created.account,
          fromStage: null,
          toStage: created.stage,
          req,
          note: "deal created",
        });
        sendCreated(res, created);
      } catch (err) {
        if (err instanceof z.ZodError) {
          sendBadRequest(res, err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
          return;
        }
        handleRouteError(res, err, "Failed to create pipeline deal");
      }
    },
  );

  router.patch(
    "/admin/pipeline-deals/:id",
    validateBody(jsonObjectBodySchema),
    async (req: Request, res: Response) => {
      try {
        const { id } = idParamsSchema.parse({ id: req.params.id });
        const body = updateDealSchema.parse(req.body);

        const orgFilter = buildOrgFilter(req);
        if (!orgFilter) {
          sendNotFound(res, "Pipeline deal");
          return;
        }
        const [existing] = await db
          .select()
          .from(pipelineDealsTable)
          .where(and(eq(pipelineDealsTable.id, id), orgFilter))
          .limit(1);
        if (!existing) {
          sendNotFound(res, "Pipeline deal");
          return;
        }

        const patch: Record<string, unknown> = {
          updatedAt: new Date(),
          updatedByUserId: actorUserId(req),
        };
        for (const k of [
          "account",
          "vertical",
          "champion",
          "championTitle",
          "stage",
          "fitScore",
          "nextStep",
          "notes",
        ] as const) {
          if (body[k] !== undefined) patch[k] = body[k];
        }

        const [updated] = await db
          .update(pipelineDealsTable)
          .set(patch as never)
          .where(eq(pipelineDealsTable.id, id))
          .returning();

        if (body.stage && body.stage !== existing.stage) {
          await recordEvent({
            dealId: id,
            orgId: existing.orgId,
            accountSnapshot: updated.account,
            fromStage: existing.stage,
            toStage: body.stage,
            req,
            note: null,
          });
        }

        sendSuccess(res, updated);
      } catch (err) {
        if (err instanceof z.ZodError) {
          sendBadRequest(res, err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
          return;
        }
        handleRouteError(res, err, "Failed to update pipeline deal");
      }
    },
  );

  router.delete("/admin/pipeline-deals/:id", async (req: Request, res: Response) => {
    try {
      const { id } = idParamsSchema.parse({ id: req.params.id });
      const orgFilter = buildOrgFilter(req);
      if (!orgFilter) {
        sendNotFound(res, "Pipeline deal");
        return;
      }
      const [existing] = await db
        .select()
        .from(pipelineDealsTable)
        .where(and(eq(pipelineDealsTable.id, id), orgFilter))
        .limit(1);
      if (!existing) {
        sendNotFound(res, "Pipeline deal");
        return;
      }
      await db.delete(pipelineDealsTable).where(eq(pipelineDealsTable.id, id));
      // Audit events table is intentionally retained — events carry their
      // own org_id + account_snapshot, so the trail remains queryable
      // even after the source deal is removed.
      sendSuccess(res, { id });
    } catch (err) {
      handleRouteError(res, err, "Failed to delete pipeline deal");
    }
  });

  router.get("/admin/pipeline-deals/:id/events", async (req: Request, res: Response) => {
    try {
      const { id } = idParamsSchema.parse({ id: req.params.id });
      const eventOrgFilter = buildEventOrgFilter(req);
      if (!eventOrgFilter) {
        sendSuccess(res, []);
        return;
      }
      // Authorize via the events' own org_id — the deal row may have been
      // deleted, but its audit trail belongs to a known org.
      const events = await db
        .select()
        .from(pipelineDealEventsTable)
        .where(and(eq(pipelineDealEventsTable.dealId, id), eventOrgFilter))
        .orderBy(desc(pipelineDealEventsTable.createdAt));
      sendSuccess(res, events);
    } catch (err) {
      handleRouteError(res, err, "Failed to list pipeline deal events");
    }
  });
}
