import { Router, type IRouter } from "express";
import { db, usersTable, sessionsTable, rolesTable, userRolesTable, toCanonicalRole, type RoleName } from "@szl-holdings/db";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, sendForbidden, sendError, handleRouteError } from "../lib/api-response";
import { logActivity } from "../lib/activity-logger";
import { createAuthService } from "@szl-holdings/auth";
import { issueWsTicket } from "../lib/websocket.js";
import { getSessionToken, getSessionUser } from "../lib/auth";

const router: IRouter = Router();
const authService = createAuthService();

router.post("/auth/login", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential || typeof credential !== "string") {
      sendBadRequest(res, "credential is required");
      return;
    }

    const identity = await authService.verifyIdentity(credential);
    if (!identity) {
      sendError(res, "Invalid credentials", 401, "INVALID_CREDENTIALS");
      return;
    }

    let [user] = await db.select().from(usersTable).where(eq(usersTable.replitId, identity.externalId));

    if (!user) {
      [user] = await db.insert(usersTable).values({
        replitId: identity.externalId,
        displayName: identity.displayName,
        email: identity.email ?? null,
        avatarUrl: identity.avatarUrl ?? null,
      }).returning();
    }

    if (!user.isActive) {
      sendError(res, "Account is disabled", 403, "ACCOUNT_DISABLED");
      return;
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [session] = await db.insert(sessionsTable).values({
      userId: user.id,
      token,
      expiresAt,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    }).returning();

    const userRoles = await db
      .select({ roleName: rolesTable.name })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, user.id));

    sendCreated(res, {
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        roles: userRoles.map((r) => r.roleName),
      },
    });
  } catch (err) {
    req.log?.error({ err }, "Login failed");
    handleRouteError(res, err, "Login failed");
  }
});

router.get("/auth/providers", async (_req, res) => {
  sendSuccess(res, { providers: authService.getProviders() });
});

router.get("/auth/me", authMiddleware(), async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
    if (!user) {
      sendNotFound(res, "User");
      return;
    }
    sendSuccess(res, {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      roles: req.user!.roles,
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to get current user");
    handleRouteError(res, err, "Failed to get current user");
  }
});

router.post("/auth/sessions", authMiddleware(), async (req, res) => {
  try {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [session] = await db.insert(sessionsTable).values({
      userId: req.user!.id,
      token,
      expiresAt,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    }).returning();

    await logActivity(req, "create", "session", String(session.id));

    sendCreated(res, {
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to create session");
    handleRouteError(res, err, "Failed to create session");
  }
});

router.delete("/auth/sessions/current", authMiddleware(), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      sendBadRequest(res, "No active session token to revoke");
      return;
    }
    const token = authHeader.slice(7);
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.token, token));

    if (!session) {
      sendNotFound(res, "Session");
      return;
    }

    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
    await logActivity(req, "delete", "session", String(session.id));
    sendNoContent(res);
  } catch (err) {
    req.log?.error({ err }, "Failed to delete session");
    handleRouteError(res, err, "Failed to delete session");
  }
});

router.delete("/auth/sessions/:id", authMiddleware(), async (req, res) => {
  try {
    const sessionId = parseIdParam(req.params.id);
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId));

    if (!session) {
      sendNotFound(res, "Session");
      return;
    }

    const isOwner = session.userId === req.user!.id;
    const isPrivileged = req.user!.roles.includes("super_admin") || req.user!.roles.includes("ops");
    if (!isOwner && !isPrivileged) {
      sendForbidden(res);
      return;
    }

    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
    await logActivity(req, "delete", "session", String(session.id));
    sendNoContent(res);
  } catch (err) {
    req.log?.error({ err }, "Failed to delete session");
    handleRouteError(res, err, "Failed to delete session");
  }
});

router.get("/auth/roles", authMiddleware(), requireRole("ops", "analyst"), async (_req, res) => {
  try {
    const roles = await db.select().from(rolesTable).orderBy(rolesTable.name);
    sendSuccess(res, roles);
  } catch (err) {
    handleRouteError(res, err, "Failed to list roles");
  }
});

router.get("/auth/users", authMiddleware(), requireRole("ops"), async (_req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      displayName: usersTable.displayName,
      email: usersTable.email,
      avatarUrl: usersTable.avatarUrl,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt));
    sendSuccess(res, users);
  } catch (err) {
    handleRouteError(res, err, "Failed to list users");
  }
});

router.post("/auth/ws-ticket", async (req, res) => {
  try {
    let userId: number | undefined;
    let legacyRoles: RoleName[] = [];

    const sessionToken = getSessionToken(req);
    if (sessionToken) {
      const sessionUser = await getSessionUser(sessionToken);
      if (sessionUser) {
        userId = sessionUser.id;
        legacyRoles = (sessionUser.roles ?? []) as RoleName[];
      }
    }

    if (!userId && req.user?.id) {
      userId = req.user.id;
      legacyRoles = (req.user.roles ?? []) as RoleName[];
    }

    if (!userId) {
      sendForbidden(res);
      return;
    }

    const [userRow] = await db
      .select({ platformRole: usersTable.platformRole })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    let platformRole = userRow?.platformRole;
    if (!platformRole) {
      platformRole = legacyRoles.length > 0 ? toCanonicalRole(legacyRoles) as any : "anonymous_visitor";
    }

    const ticket = issueWsTicket(userId, platformRole!);
    sendSuccess(res, { ticket, expiresIn: 300 });
  } catch (err) {
    handleRouteError(res, err, "Failed to issue WS ticket");
  }
});

export default router;
