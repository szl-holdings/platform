/**
 * SCIM 2.0 Server Implementation
 * RFC 7643 (Schema) + RFC 7644 (Protocol)
 *
 * Endpoints:
 *   GET    /scim/v2/Users            — list users (with filter)
 *   GET    /scim/v2/Users/:id        — get user by ID
 *   POST   /scim/v2/Users            — create user (provision)
 *   PUT    /scim/v2/Users/:id        — replace user
 *   PATCH  /scim/v2/Users/:id        — partial update
 *   DELETE /scim/v2/Users/:id        — deactivate (soft delete)
 *   GET    /scim/v2/Groups           — list groups
 *   GET    /scim/v2/Groups/:id       — get group by ID
 *   POST   /scim/v2/Groups           — create group
 *   PUT    /scim/v2/Groups/:id       — replace group
 *   PATCH  /scim/v2/Groups/:id       — partial update
 *   DELETE /scim/v2/Groups/:id       — delete group
 *   GET    /scim/v2/ServiceProviderConfig
 *   GET    /scim/v2/ResourceTypes
 *   GET    /scim/v2/Schemas
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../lib/logger";
import { revokeUserSessionsOnRoleChange } from "../middlewares/session-policy";
import { db } from "@szl-holdings/db";
import {
  usersTable,
  orgMembersTable,
  rolesTable,
  userRolesTable,
  azureTenantsTable,
  scimTokensTable,
  scimGroupsTable,
  scimGroupMembersTable,
  scimProvisionedUsersTable,
  scimSyncLogsTable,
} from "@szl-holdings/db";
import { eq, and, or, ilike, desc, sql, inArray, count } from "drizzle-orm";
import { jsonObjectBodySchema, listQuerySchema, validateBody, validateQuery } from "../lib/validation";

const router = Router();

// ─── SCIM Constants ──────────────────────────────────────────────────────────

const SCIM_CONTENT_TYPE = "application/scim+json";
const SCIM_USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User";
const SCIM_GROUP_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:Group";
const SCIM_LIST_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
const SCIM_ERROR_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:Error";
const SCIM_PATCH_OP_SCHEMA = "urn:ietf:params:scim:api:messages:2.0:PatchOp";

// Default group → platform role mapping
const GROUP_ROLE_MAP: Record<string, string> = {
  "Admins": "platform_admin",
  "Operators": "operator",
  "Analysts": "analyst",
  "Viewers": "executive_viewer",
  "OpsManagers": "ops_manager",
  "SalesDelivery": "sales_delivery_user",
  "MaritimeOps": "maritime_ops_user",
  "ServiceCoordinators": "service_coordinator",
};

// ─── Auth Middleware ──────────────────────────────────────────────────────────

interface ScimContext {
  tenantId: number;
  azureTenantId: string;
  organizationId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      scimContext?: ScimContext;
    }
  }
}

async function scimBearerAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return scimError(res, 401, "invalidCredentials", "Bearer token required");
  }

  const rawToken = authHeader.slice(7).trim();
  if (!rawToken) {
    return scimError(res, 401, "invalidCredentials", "Bearer token is empty");
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const [tokenRow] = await db
    .select({
      id: scimTokensTable.id,
      tenantId: scimTokensTable.tenantId,
      isActive: scimTokensTable.isActive,
      expiresAt: scimTokensTable.expiresAt,
    })
    .from(scimTokensTable)
    .where(and(
      eq(scimTokensTable.tokenHash, tokenHash),
      eq(scimTokensTable.isActive, true),
    ))
    .limit(1);

  if (!tokenRow) {
    return scimError(res, 401, "invalidCredentials", "Invalid or revoked SCIM token");
  }

  if (tokenRow.expiresAt && tokenRow.expiresAt < new Date()) {
    return scimError(res, 401, "invalidCredentials", "SCIM token has expired");
  }

  const [tenant] = await db
    .select({
      id: azureTenantsTable.id,
      azureTenantId: azureTenantsTable.azureTenantId,
      organizationId: azureTenantsTable.organizationId,
      status: azureTenantsTable.status,
    })
    .from(azureTenantsTable)
    .where(eq(azureTenantsTable.id, tokenRow.tenantId))
    .limit(1);

  if (!tenant || tenant.status === "suspended") {
    return scimError(res, 403, "mutability", "Tenant is suspended or not found");
  }

  await db
    .update(scimTokensTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(scimTokensTable.id, tokenRow.id));

  req.scimContext = {
    tenantId: tenant.id,
    azureTenantId: tenant.azureTenantId,
    organizationId: tenant.organizationId,
  };

  return next();
}

// ─── SCIM Response Helpers ────────────────────────────────────────────────────

function scimError(res: Response, status: number, scimType: string, detail: string) {
  return res
    .status(status)
    .set("Content-Type", SCIM_CONTENT_TYPE)
    .json({
      schemas: [SCIM_ERROR_SCHEMA],
      status: String(status),
      scimType,
      detail,
    });
}

function scimResponse(res: Response, status: number, body: unknown) {
  return res
    .status(status)
    .set("Content-Type", SCIM_CONTENT_TYPE)
    .json(body);
}

function buildUserScimResource(
  user: { id: number; displayName: string; email: string | null; isActive: boolean; createdAt: Date; updatedAt: Date },
  provisioned: { externalId: string | null; scimUserName: string; provisionedRole: string; lastSyncAt: Date | null } | null,
  baseUrl: string,
) {
  const scimId = String(user.id);
  const userName = provisioned?.scimUserName ?? user.email ?? `user-${user.id}`;
  const nameParts = user.displayName.split(" ");
  const givenName = nameParts[0] ?? "";
  const familyName = nameParts.slice(1).join(" ") || givenName;

  return {
    schemas: [SCIM_USER_SCHEMA],
    id: scimId,
    externalId: provisioned?.externalId ?? undefined,
    userName,
    name: {
      formatted: user.displayName,
      givenName,
      familyName,
    },
    displayName: user.displayName,
    emails: user.email
      ? [{ value: user.email, primary: true, type: "work" }]
      : [],
    active: user.isActive,
    meta: {
      resourceType: "User",
      created: user.createdAt.toISOString(),
      lastModified: user.updatedAt.toISOString(),
      location: `${baseUrl}/scim/v2/Users/${scimId}`,
      version: `W/"${user.updatedAt.getTime()}"`,
    },
  };
}

function buildGroupScimResource(
  group: { id: number; displayName: string; externalId: string | null; createdAt: Date; updatedAt: Date; platformRole: string },
  members: { userId: number; userName: string; displayName: string }[],
  baseUrl: string,
) {
  const scimId = String(group.id);
  return {
    schemas: [SCIM_GROUP_SCHEMA],
    id: scimId,
    externalId: group.externalId ?? undefined,
    displayName: group.displayName,
    members: members.map((m) => ({
      value: String(m.userId),
      $ref: `${baseUrl}/scim/v2/Users/${m.userId}`,
      display: m.displayName,
    })),
    meta: {
      resourceType: "Group",
      created: group.createdAt.toISOString(),
      lastModified: group.updatedAt.toISOString(),
      location: `${baseUrl}/scim/v2/Groups/${scimId}`,
      version: `W/"${group.updatedAt.getTime()}"`,
    },
  };
}

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  return `${proto}://${host}/api`;
}

// Parse SCIM filter string (subset: userName eq, email eq, active eq, displayName eq)
function parseScimFilter(filter: string): { field: string; op: string; value: string } | null {
  const m = filter.trim().match(/^(\w+)\s+(eq|sw|co|ne)\s+"([^"]*)"$/i);
  if (!m) return null;
  return { field: m[1]!, op: m[2]!.toLowerCase(), value: m[3]! };
}

async function logScimOperation(
  tenantId: number,
  operation: "create_user" | "update_user" | "delete_user" | "create_group" | "update_group" | "delete_group" | "patch_user" | "patch_group",
  resourceType: "User" | "Group",
  status: "success" | "error" | "skipped",
  opts: { externalId?: string | null; userId?: number | null; errorMessage?: string; requestBody?: unknown } = {},
) {
  try {
    await db.insert(scimSyncLogsTable).values({
      tenantId,
      operation,
      resourceType,
      status,
      externalId: opts.externalId ?? null,
      userId: opts.userId ?? null,
      errorMessage: opts.errorMessage ?? null,
      requestBody: opts.requestBody ?? null,
    });
  } catch {
    // best-effort logging
  }
}

// ─── ServiceProviderConfig ────────────────────────────────────────────────────

router.get("/scim/v2/ServiceProviderConfig", async (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  scimResponse(res, 200, {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    documentationUri: `${baseUrl}/docs`,
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: "oauthbearertoken",
        name: "OAuth Bearer Token",
        description: "Authentication using an OAuth 2.0 Bearer Token",
        specUri: "http://www.rfc-editor.org/info/rfc6750",
        primary: true,
      },
    ],
    meta: {
      resourceType: "ServiceProviderConfig",
      location: `${baseUrl}/scim/v2/ServiceProviderConfig`,
    },
  });
});

// ─── ResourceTypes ────────────────────────────────────────────────────────────

router.get("/scim/v2/ResourceTypes", async (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  scimResponse(res, 200, {
    schemas: [SCIM_LIST_SCHEMA],
    totalResults: 2,
    Resources: [
      {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"],
        id: "User",
        name: "User",
        endpoint: "/scim/v2/Users",
        description: "User accounts",
        schema: SCIM_USER_SCHEMA,
        schemaExtensions: [],
        meta: {
          resourceType: "ResourceType",
          location: `${baseUrl}/scim/v2/ResourceTypes/User`,
        },
      },
      {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"],
        id: "Group",
        name: "Group",
        endpoint: "/scim/v2/Groups",
        description: "Groups",
        schema: SCIM_GROUP_SCHEMA,
        schemaExtensions: [],
        meta: {
          resourceType: "ResourceType",
          location: `${baseUrl}/scim/v2/ResourceTypes/Group`,
        },
      },
    ],
  });
});

// ─── Schemas ──────────────────────────────────────────────────────────────────

router.get("/scim/v2/Schemas", async (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  scimResponse(res, 200, {
    schemas: [SCIM_LIST_SCHEMA],
    totalResults: 2,
    Resources: [
      {
        id: SCIM_USER_SCHEMA,
        name: "User",
        description: "User Account",
        attributes: [
          { name: "userName", type: "string", multiValued: false, required: true, caseExact: false },
          { name: "name", type: "complex", multiValued: false, required: false },
          { name: "displayName", type: "string", multiValued: false, required: false, caseExact: false },
          { name: "emails", type: "complex", multiValued: true, required: false },
          { name: "active", type: "boolean", multiValued: false, required: false },
          { name: "externalId", type: "string", multiValued: false, required: false, caseExact: false },
        ],
        meta: { resourceType: "Schema", location: `${baseUrl}/scim/v2/Schemas/${SCIM_USER_SCHEMA}` },
      },
      {
        id: SCIM_GROUP_SCHEMA,
        name: "Group",
        description: "Group",
        attributes: [
          { name: "displayName", type: "string", multiValued: false, required: true, caseExact: false },
          { name: "members", type: "complex", multiValued: true, required: false },
          { name: "externalId", type: "string", multiValued: false, required: false, caseExact: false },
        ],
        meta: { resourceType: "Schema", location: `${baseUrl}/scim/v2/Schemas/${SCIM_GROUP_SCHEMA}` },
      },
    ],
  });
});

// ─── SCIM Users ───────────────────────────────────────────────────────────────

// GET /scim/v2/Users — list with optional filter
router.get("/scim/v2/Users", scimBearerAuth, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const startIndex = Math.max(1, parseInt(String(req.query.startIndex ?? "1"), 10));
    const count_ = Math.min(200, Math.max(1, parseInt(String(req.query.count ?? "100"), 10)));
    const filterStr = req.query.filter as string | undefined;
    const baseUrl = getBaseUrl(req);

    const provisionedRows = await db
      .select({
        userId: scimProvisionedUsersTable.userId,
        externalId: scimProvisionedUsersTable.externalId,
        scimUserName: scimProvisionedUsersTable.scimUserName,
        provisionedRole: scimProvisionedUsersTable.provisionedRole,
        lastSyncAt: scimProvisionedUsersTable.lastSyncAt,
      })
      .from(scimProvisionedUsersTable)
      .where(eq(scimProvisionedUsersTable.tenantId, ctx.tenantId));

    const userIds = provisionedRows.map((r) => r.userId);
    if (userIds.length === 0) {
      return scimResponse(res, 200, {
        schemas: [SCIM_LIST_SCHEMA],
        totalResults: 0,
        startIndex,
        itemsPerPage: count_,
        Resources: [],
      });
    }

    let userQuery = db
      .select()
      .from(usersTable)
      .where(inArray(usersTable.id, userIds))
      .$dynamic();

    if (filterStr) {
      const parsed = parseScimFilter(filterStr);
      if (parsed) {
        if (parsed.field === "userName" || parsed.field === "email") {
          userQuery = userQuery.where(ilike(usersTable.email, parsed.op === "sw" ? `${parsed.value}%` : parsed.value)) as typeof userQuery;
        } else if (parsed.field === "displayName") {
          userQuery = userQuery.where(ilike(usersTable.displayName, `%${parsed.value}%`)) as typeof userQuery;
        } else if (parsed.field === "active") {
          const activeVal = parsed.value === "true";
          userQuery = userQuery.where(eq(usersTable.isActive, activeVal)) as typeof userQuery;
        }
      }
    }

    const allUsers = await userQuery.orderBy(desc(usersTable.createdAt));
    const totalResults = allUsers.length;
    const page = allUsers.slice(startIndex - 1, startIndex - 1 + count_);

    const provisionedMap = new Map(provisionedRows.map((r) => [r.userId, r]));

    return scimResponse(res, 200, {
      schemas: [SCIM_LIST_SCHEMA],
      totalResults,
      startIndex,
      itemsPerPage: count_,
      Resources: page.map((u) => buildUserScimResource(u, provisionedMap.get(u.id) ?? null, baseUrl)),
    });
  } catch (err) {
    logger.error({ err }, "SCIM GET /Users error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// GET /scim/v2/Users/:id
router.get("/scim/v2/Users/:id", scimBearerAuth, async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const userId = parseInt(String(req.params.id), 10);
    if (isNaN(userId)) return scimError(res, 400, "invalidValue", "Invalid user ID");

    const [provisioned] = await db
      .select()
      .from(scimProvisionedUsersTable)
      .where(and(
        eq(scimProvisionedUsersTable.tenantId, ctx.tenantId),
        eq(scimProvisionedUsersTable.userId, userId),
      ))
      .limit(1);

    if (!provisioned) return scimError(res, 404, "notFound", "User not found in this tenant");

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return scimError(res, 404, "notFound", "User not found");

    return scimResponse(res, 200, buildUserScimResource(user, provisioned, getBaseUrl(req)));
  } catch (err) {
    logger.error({ err }, "SCIM GET /Users/:id error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// POST /scim/v2/Users — create/provision user
router.post("/scim/v2/Users", scimBearerAuth, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const body = req.body ?? {};
    const baseUrl = getBaseUrl(req);

    const userName: string = body.userName;
    if (!userName) return scimError(res, 400, "invalidValue", "userName is required");

    const emails: { value: string; primary?: boolean }[] = body.emails ?? [];
    const primaryEmail = emails.find((e) => e.primary)?.value ?? emails[0]?.value ?? null;
    const displayName: string = body.displayName
      ?? (body.name?.formatted)
      ?? [body.name?.givenName, body.name?.familyName].filter(Boolean).join(" ")
      ?? userName;

    const active = body.active !== false;
    const externalId: string | null = body.externalId ?? null;

    const emailToLookup = primaryEmail ?? userName;
    const existing = await db
      .select()
      .from(usersTable)
      .where(emailToLookup.includes("@") ? eq(usersTable.email, emailToLookup) : eq(usersTable.email, emailToLookup))
      .limit(1);

    let user = existing[0];

    if (!user) {
      const [created] = await db.insert(usersTable).values({
        displayName,
        email: primaryEmail,
        isActive: active,
        replitId: null,
      }).returning();
      user = created!;
    } else {
      if (!active && user.isActive) {
        const [updated] = await db.update(usersTable).set({ isActive: false, updatedAt: new Date() }).where(eq(usersTable.id, user.id)).returning();
        user = updated!;
      }
    }

    const existingProvisioned = await db
      .select()
      .from(scimProvisionedUsersTable)
      .where(and(
        eq(scimProvisionedUsersTable.tenantId, ctx.tenantId),
        eq(scimProvisionedUsersTable.userId, user.id),
      ))
      .limit(1);

    if (existingProvisioned[0]) {
      return scimError(res, 409, "uniqueness", "User already provisioned for this tenant");
    }

    const [provisionedRow] = await db.insert(scimProvisionedUsersTable).values({
      tenantId: ctx.tenantId,
      userId: user.id,
      externalId,
      scimUserName: userName,
      active,
      provisionedRole: "viewer",
      lastSyncAt: new Date(),
    }).returning();

    if (ctx.organizationId) {
      const existing = await db.select().from(orgMembersTable).where(and(
        eq(orgMembersTable.orgId, ctx.organizationId),
        eq(orgMembersTable.userId, user.id),
      )).limit(1);
      if (!existing[0]) {
        await db.insert(orgMembersTable).values({
          orgId: ctx.organizationId,
          userId: user.id,
          role: "member",
        });
      }
    }

    await logScimOperation(ctx.tenantId, "create_user", "User", "success", {
      externalId,
      userId: user.id,
      requestBody: body,
    });

    return scimResponse(res, 201, buildUserScimResource(user, provisionedRow ?? null, baseUrl));
  } catch (err) {
    logger.error({ err }, "SCIM POST /Users error:");
    await logScimOperation(req.scimContext?.tenantId ?? 0, "create_user", "User", "error", {
      errorMessage: String(err),
      requestBody: req.body,
    });
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// PUT /scim/v2/Users/:id — full replace
router.put("/scim/v2/Users/:id", scimBearerAuth, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const userId = parseInt(String(req.params.id), 10);
    if (isNaN(userId)) return scimError(res, 400, "invalidValue", "Invalid user ID");

    const body = req.body ?? {};
    const baseUrl = getBaseUrl(req);

    const [provisioned] = await db
      .select()
      .from(scimProvisionedUsersTable)
      .where(and(
        eq(scimProvisionedUsersTable.tenantId, ctx.tenantId),
        eq(scimProvisionedUsersTable.userId, userId),
      ))
      .limit(1);

    if (!provisioned) return scimError(res, 404, "notFound", "User not found in this tenant");

    const emails: { value: string; primary?: boolean }[] = body.emails ?? [];
    const primaryEmail = emails.find((e) => e.primary)?.value ?? emails[0]?.value ?? null;
    const displayName: string = body.displayName
      ?? (body.name?.formatted)
      ?? [body.name?.givenName, body.name?.familyName].filter(Boolean).join(" ")
      ?? body.userName;

    const active = body.active !== false;

    const [updatedUser] = await db.update(usersTable).set({
      displayName: displayName || undefined,
      email: primaryEmail,
      isActive: active,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, userId)).returning();

    if (!updatedUser) return scimError(res, 404, "notFound", "User not found");

    const [updatedProvisioned] = await db.update(scimProvisionedUsersTable).set({
      scimUserName: body.userName ?? provisioned.scimUserName,
      externalId: body.externalId ?? provisioned.externalId,
      active,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(scimProvisionedUsersTable.id, provisioned.id)).returning();

    await logScimOperation(ctx.tenantId, "update_user", "User", "success", {
      externalId: body.externalId,
      userId,
      requestBody: body,
    });

    return scimResponse(res, 200, buildUserScimResource(updatedUser, updatedProvisioned ?? null, baseUrl));
  } catch (err) {
    logger.error({ err }, "SCIM PUT /Users/:id error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// PATCH /scim/v2/Users/:id — partial update
router.patch("/scim/v2/Users/:id", scimBearerAuth, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const userId = parseInt(String(req.params.id), 10);
    if (isNaN(userId)) return scimError(res, 400, "invalidValue", "Invalid user ID");

    const body = req.body ?? {};
    const baseUrl = getBaseUrl(req);

    const schemas: string[] = body.schemas ?? [];
    if (!schemas.includes(SCIM_PATCH_OP_SCHEMA)) {
      return scimError(res, 400, "invalidValue", "Missing PatchOp schema");
    }

    const [provisioned] = await db
      .select()
      .from(scimProvisionedUsersTable)
      .where(and(
        eq(scimProvisionedUsersTable.tenantId, ctx.tenantId),
        eq(scimProvisionedUsersTable.userId, userId),
      ))
      .limit(1);

    if (!provisioned) return scimError(res, 404, "notFound", "User not found in this tenant");

    const operations: { op: string; path?: string; value?: unknown }[] = body.Operations ?? [];
    const userUpdates: Partial<{ displayName: string; email: string | null; isActive: boolean; updatedAt: Date }> = { updatedAt: new Date() };
    const provUpdates: Partial<{ active: boolean; scimUserName: string; lastSyncAt: Date; updatedAt: Date }> = { lastSyncAt: new Date(), updatedAt: new Date() };

    for (const op of operations) {
      const opName = op.op?.toLowerCase();

      if (opName === "replace" || opName === "add") {
        if (op.path === "active" || (typeof op.value === "object" && op.value !== null && "active" in (op.value as Record<string, unknown>))) {
          const activeVal = op.path === "active" ? Boolean(op.value) : Boolean((op.value as Record<string, unknown>)["active"]);
          userUpdates.isActive = activeVal;
          provUpdates.active = activeVal;
        }
        if (op.path === "displayName" && typeof op.value === "string") {
          userUpdates.displayName = op.value;
        }
        if (op.path === "userName" && typeof op.value === "string") {
          provUpdates.scimUserName = op.value;
        }
        if (op.path === "emails" && Array.isArray(op.value)) {
          const emailArr = op.value as { value: string; primary?: boolean }[];
          const primary = emailArr.find((e) => e.primary)?.value ?? emailArr[0]?.value ?? null;
          userUpdates.email = primary;
        }
        if (!op.path && typeof op.value === "object" && op.value !== null) {
          const val = op.value as Record<string, unknown>;
          if ("displayName" in val) userUpdates.displayName = String(val["displayName"]);
          if ("active" in val) { userUpdates.isActive = Boolean(val["active"]); provUpdates.active = Boolean(val["active"]); }
        }
      }

      if (opName === "remove") {
        if (op.path === "active") {
          userUpdates.isActive = false;
          provUpdates.active = false;
        }
      }
    }

    const [updatedUser] = await db.update(usersTable).set(userUpdates).where(eq(usersTable.id, userId)).returning();
    if (!updatedUser) return scimError(res, 404, "notFound", "User not found");

    const [updatedProvisioned] = await db.update(scimProvisionedUsersTable).set(provUpdates).where(eq(scimProvisionedUsersTable.id, provisioned.id)).returning();

    if (userUpdates.isActive === false && ctx.organizationId) {
      await db.delete(orgMembersTable).where(and(
        eq(orgMembersTable.orgId, ctx.organizationId),
        eq(orgMembersTable.userId, userId),
      ));
    }

    await logScimOperation(ctx.tenantId, "patch_user", "User", "success", {
      userId,
      requestBody: body,
    });

    return scimResponse(res, 200, buildUserScimResource(updatedUser, updatedProvisioned ?? null, baseUrl));
  } catch (err) {
    logger.error({ err }, "SCIM PATCH /Users/:id error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// DELETE /scim/v2/Users/:id — soft delete (deactivate)
router.delete("/scim/v2/Users/:id", validateBody(jsonObjectBodySchema), scimBearerAuth, async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const userId = parseInt(String(req.params.id), 10);
    if (isNaN(userId)) return scimError(res, 400, "invalidValue", "Invalid user ID");

    const [provisioned] = await db
      .select()
      .from(scimProvisionedUsersTable)
      .where(and(
        eq(scimProvisionedUsersTable.tenantId, ctx.tenantId),
        eq(scimProvisionedUsersTable.userId, userId),
      ))
      .limit(1);

    if (!provisioned) return scimError(res, 404, "notFound", "User not found in this tenant");

    await db.update(usersTable).set({ isActive: false, updatedAt: new Date() }).where(eq(usersTable.id, userId));
    await db.update(scimProvisionedUsersTable).set({ active: false, updatedAt: new Date() }).where(eq(scimProvisionedUsersTable.id, provisioned.id));

    if (ctx.organizationId) {
      await db.delete(orgMembersTable).where(and(
        eq(orgMembersTable.orgId, ctx.organizationId),
        eq(orgMembersTable.userId, userId),
      ));
    }

    await logScimOperation(ctx.tenantId, "delete_user", "User", "success", { userId });

    return res.status(204).end();
  } catch (err) {
    logger.error({ err }, "SCIM DELETE /Users/:id error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// ─── SCIM Groups ──────────────────────────────────────────────────────────────

// GET /scim/v2/Groups
router.get("/scim/v2/Groups", scimBearerAuth, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const startIndex = Math.max(1, parseInt(String(req.query.startIndex ?? "1"), 10));
    const count_ = Math.min(200, Math.max(1, parseInt(String(req.query.count ?? "100"), 10)));
    const baseUrl = getBaseUrl(req);

    const groups = await db
      .select()
      .from(scimGroupsTable)
      .where(eq(scimGroupsTable.tenantId, ctx.tenantId))
      .orderBy(desc(scimGroupsTable.createdAt));

    const totalResults = groups.length;
    const page = groups.slice(startIndex - 1, startIndex - 1 + count_);

    const groupIds = page.map((g) => g.id);
    const members = groupIds.length > 0
      ? await db
        .select({
          groupId: scimGroupMembersTable.groupId,
          userId: usersTable.id,
          userName: usersTable.email,
          displayName: usersTable.displayName,
        })
        .from(scimGroupMembersTable)
        .innerJoin(usersTable, eq(scimGroupMembersTable.userId, usersTable.id))
        .where(inArray(scimGroupMembersTable.groupId, groupIds))
      : [];

    const membersByGroup = new Map<number, typeof members>();
    for (const m of members) {
      if (!membersByGroup.has(m.groupId)) membersByGroup.set(m.groupId, []);
      membersByGroup.get(m.groupId)!.push(m);
    }

    return scimResponse(res, 200, {
      schemas: [SCIM_LIST_SCHEMA],
      totalResults,
      startIndex,
      itemsPerPage: count_,
      Resources: page.map((g) => buildGroupScimResource(
        g,
        (membersByGroup.get(g.id) ?? []).map((m) => ({ userId: m.userId, userName: m.userName ?? "", displayName: m.displayName })),
        baseUrl,
      )),
    });
  } catch (err) {
    logger.error({ err }, "SCIM GET /Groups error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// GET /scim/v2/Groups/:id
router.get("/scim/v2/Groups/:id", scimBearerAuth, async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) return scimError(res, 400, "invalidValue", "Invalid group ID");

    const [group] = await db
      .select()
      .from(scimGroupsTable)
      .where(and(eq(scimGroupsTable.id, groupId), eq(scimGroupsTable.tenantId, ctx.tenantId)))
      .limit(1);

    if (!group) return scimError(res, 404, "notFound", "Group not found");

    const members = await db
      .select({
        groupId: scimGroupMembersTable.groupId,
        userId: usersTable.id,
        userName: usersTable.email,
        displayName: usersTable.displayName,
      })
      .from(scimGroupMembersTable)
      .innerJoin(usersTable, eq(scimGroupMembersTable.userId, usersTable.id))
      .where(eq(scimGroupMembersTable.groupId, groupId));

    return scimResponse(res, 200, buildGroupScimResource(
      group,
      members.map((m) => ({ userId: m.userId, userName: m.userName ?? "", displayName: m.displayName })),
      getBaseUrl(req),
    ));
  } catch (err) {
    logger.error({ err }, "SCIM GET /Groups/:id error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// POST /scim/v2/Groups
router.post("/scim/v2/Groups", scimBearerAuth, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const body = req.body ?? {};
    const baseUrl = getBaseUrl(req);

    const displayName: string = body.displayName;
    if (!displayName) return scimError(res, 400, "invalidValue", "displayName is required");

    const externalId: string | null = body.externalId ?? null;
    const platformRole = GROUP_ROLE_MAP[displayName] ?? "viewer";

    const [group] = await db.insert(scimGroupsTable).values({
      tenantId: ctx.tenantId,
      externalId,
      displayName,
      platformRole,
    }).returning();

    const members: { value: string }[] = body.members ?? [];
    const memberUserIds = members
      .map((m) => parseInt(m.value, 10))
      .filter((id) => !isNaN(id));

    if (memberUserIds.length > 0 && group) {
      const existingUsers = await db.select({ id: usersTable.id }).from(usersTable).where(inArray(usersTable.id, memberUserIds));
      const validIds = existingUsers.map((u) => u.id);
      if (validIds.length > 0) {
        await db.insert(scimGroupMembersTable).values(
          validIds.map((uid) => ({ groupId: group.id, userId: uid }))
        ).onConflictDoNothing();
      }
    }

    await logScimOperation(ctx.tenantId, "create_group", "Group", "success", {
      externalId,
      requestBody: body,
    });

    return scimResponse(res, 201, buildGroupScimResource(
      group!,
      [],
      baseUrl,
    ));
  } catch (err) {
    logger.error({ err }, "SCIM POST /Groups error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// PUT /scim/v2/Groups/:id
router.put("/scim/v2/Groups/:id", scimBearerAuth, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) return scimError(res, 400, "invalidValue", "Invalid group ID");

    const body = req.body ?? {};
    const baseUrl = getBaseUrl(req);

    const [group] = await db
      .select()
      .from(scimGroupsTable)
      .where(and(eq(scimGroupsTable.id, groupId), eq(scimGroupsTable.tenantId, ctx.tenantId)))
      .limit(1);

    if (!group) return scimError(res, 404, "notFound", "Group not found");

    const displayName: string = body.displayName ?? group.displayName;
    const platformRole = GROUP_ROLE_MAP[displayName] ?? group.platformRole;

    const [updatedGroup] = await db.update(scimGroupsTable).set({
      displayName,
      externalId: body.externalId ?? group.externalId,
      platformRole,
      updatedAt: new Date(),
    }).where(eq(scimGroupsTable.id, groupId)).returning();

    const newMembers: { value: string }[] = body.members ?? [];
    const newMemberIds = newMembers.map((m) => parseInt(m.value, 10)).filter((id) => !isNaN(id));

    await db.delete(scimGroupMembersTable).where(eq(scimGroupMembersTable.groupId, groupId));

    if (newMemberIds.length > 0) {
      const existingUsers = await db.select({ id: usersTable.id }).from(usersTable).where(inArray(usersTable.id, newMemberIds));
      const validIds = existingUsers.map((u) => u.id);
      if (validIds.length > 0) {
        await db.insert(scimGroupMembersTable).values(
          validIds.map((uid) => ({ groupId, userId: uid }))
        ).onConflictDoNothing();
      }
    }

    await logScimOperation(ctx.tenantId, "update_group", "Group", "success", {
      externalId: body.externalId,
      requestBody: body,
    });

    const finalMembers = newMemberIds.length > 0
      ? await db.select({ userId: usersTable.id, userName: usersTable.email, displayName: usersTable.displayName, groupId: scimGroupMembersTable.groupId })
        .from(scimGroupMembersTable)
        .innerJoin(usersTable, eq(scimGroupMembersTable.userId, usersTable.id))
        .where(eq(scimGroupMembersTable.groupId, groupId))
      : [];

    return scimResponse(res, 200, buildGroupScimResource(
      updatedGroup!,
      finalMembers.map((m) => ({ userId: m.userId, userName: m.userName ?? "", displayName: m.displayName })),
      baseUrl,
    ));
  } catch (err) {
    logger.error({ err }, "SCIM PUT /Groups/:id error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// PATCH /scim/v2/Groups/:id
router.patch("/scim/v2/Groups/:id", scimBearerAuth, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) return scimError(res, 400, "invalidValue", "Invalid group ID");

    const body = req.body ?? {};
    const baseUrl = getBaseUrl(req);

    const schemas: string[] = body.schemas ?? [];
    if (!schemas.includes(SCIM_PATCH_OP_SCHEMA)) {
      return scimError(res, 400, "invalidValue", "Missing PatchOp schema");
    }

    const [group] = await db
      .select()
      .from(scimGroupsTable)
      .where(and(eq(scimGroupsTable.id, groupId), eq(scimGroupsTable.tenantId, ctx.tenantId)))
      .limit(1);

    if (!group) return scimError(res, 404, "notFound", "Group not found");

    const operations: { op: string; path?: string; value?: unknown }[] = body.Operations ?? [];
    const groupUpdates: Partial<{ displayName: string; platformRole: string; updatedAt: Date }> = { updatedAt: new Date() };

    for (const op of operations) {
      const opName = op.op?.toLowerCase();

      if ((opName === "replace" || opName === "add") && op.path === "displayName" && typeof op.value === "string") {
        groupUpdates.displayName = op.value;
        groupUpdates.platformRole = GROUP_ROLE_MAP[op.value] ?? group.platformRole;
      }

      if (op.path === "members" && Array.isArray(op.value)) {
        const memberValues = op.value as { value: string }[];
        const memberIds = memberValues.map((m) => parseInt(m.value, 10)).filter((id) => !isNaN(id));

        if (opName === "add") {
          if (memberIds.length > 0) {
            const existingUsers = await db.select({ id: usersTable.id }).from(usersTable).where(inArray(usersTable.id, memberIds));
            await db.insert(scimGroupMembersTable).values(
              existingUsers.map((u) => ({ groupId, userId: u.id }))
            ).onConflictDoNothing();
            for (const u of existingUsers) {
              await revokeUserSessionsOnRoleChange({ userId: u.id, changedByUserId: null, reason: "scim_group_member_add" }).catch((err) => {
                logger.error({ err, userId: u.id }, "[scim] session revocation failed on member add");
              });
            }
          }
        } else if (opName === "remove") {
          if (memberIds.length > 0) {
            await db.delete(scimGroupMembersTable).where(
              and(eq(scimGroupMembersTable.groupId, groupId), inArray(scimGroupMembersTable.userId, memberIds))
            );
            for (const id of memberIds) {
              await revokeUserSessionsOnRoleChange({ userId: id, changedByUserId: null, reason: "scim_group_member_remove" }).catch((err) => {
                logger.error({ err, userId: id }, "[scim] session revocation failed on member remove");
              });
            }
          }
        } else if (opName === "replace") {
          const previousMembers = await db.select({ userId: scimGroupMembersTable.userId }).from(scimGroupMembersTable).where(eq(scimGroupMembersTable.groupId, groupId));
          await db.delete(scimGroupMembersTable).where(eq(scimGroupMembersTable.groupId, groupId));
          if (memberIds.length > 0) {
            const existingUsers = await db.select({ id: usersTable.id }).from(usersTable).where(inArray(usersTable.id, memberIds));
            await db.insert(scimGroupMembersTable).values(
              existingUsers.map((u) => ({ groupId, userId: u.id }))
            ).onConflictDoNothing();
          }
          const allAffected = new Set([...previousMembers.map((m) => m.userId), ...memberIds]);
          for (const uid of allAffected) {
            await revokeUserSessionsOnRoleChange({ userId: uid, changedByUserId: null, reason: "scim_group_replace" }).catch((err) => {
              logger.error({ err, userId: uid }, "[scim] session revocation failed on group replace");
            });
          }
        }
      }
    }

    if (Object.keys(groupUpdates).length > 1) {
      await db.update(scimGroupsTable).set(groupUpdates).where(eq(scimGroupsTable.id, groupId));
    }

    await logScimOperation(ctx.tenantId, "patch_group", "Group", "success", { requestBody: body });

    const [updatedGroup] = await db.select().from(scimGroupsTable).where(eq(scimGroupsTable.id, groupId)).limit(1);
    const finalMembers = await db
      .select({ userId: usersTable.id, userName: usersTable.email, displayName: usersTable.displayName, groupId: scimGroupMembersTable.groupId })
      .from(scimGroupMembersTable)
      .innerJoin(usersTable, eq(scimGroupMembersTable.userId, usersTable.id))
      .where(eq(scimGroupMembersTable.groupId, groupId));

    return scimResponse(res, 200, buildGroupScimResource(
      updatedGroup!,
      finalMembers.map((m) => ({ userId: m.userId, userName: m.userName ?? "", displayName: m.displayName })),
      baseUrl,
    ));
  } catch (err) {
    logger.error({ err }, "SCIM PATCH /Groups/:id error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

// DELETE /scim/v2/Groups/:id
router.delete("/scim/v2/Groups/:id", validateBody(jsonObjectBodySchema), scimBearerAuth, async (req: Request, res: Response) => {
  try {
    const ctx = req.scimContext!;
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) return scimError(res, 400, "invalidValue", "Invalid group ID");

    const [group] = await db
      .select()
      .from(scimGroupsTable)
      .where(and(eq(scimGroupsTable.id, groupId), eq(scimGroupsTable.tenantId, ctx.tenantId)))
      .limit(1);

    if (!group) return scimError(res, 404, "notFound", "Group not found");

    await db.delete(scimGroupMembersTable).where(eq(scimGroupMembersTable.groupId, groupId));
    await db.delete(scimGroupsTable).where(eq(scimGroupsTable.id, groupId));

    await logScimOperation(ctx.tenantId, "delete_group", "Group", "success", { externalId: group.externalId });

    return res.status(204).end();
  } catch (err) {
    logger.error({ err }, "SCIM DELETE /Groups/:id error:");
    return scimError(res, 500, "internalError", "Internal server error");
  }
});

export default router;
