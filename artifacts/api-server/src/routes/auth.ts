import { Router, type IRouter } from "express";
import { db, usersTable, sessionsTable, rolesTable, userRolesTable, organizationsTable, orgMembersTable, toCanonicalRole, type RoleName } from "@szl-holdings/db";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, sendForbidden, sendError, handleRouteError, parsePagination } from "../lib/api-response";
import { logActivity } from "../lib/activity-logger";
import { createAuthService } from "@szl-holdings/auth";
import { issueWsTicket } from "../lib/websocket.js";
import { getSessionToken, getSessionUser } from "../lib/auth";
import { z } from "zod";
import { validateBody, loginPasswordSchema } from "../lib/validation";

const router: IRouter = Router();
const authService = createAuthService();

const loginBodySchema = z.object({
  credential: z.string().min(1, "credential is required"),
});

router.post("/auth/login", validateBody(loginBodySchema), async (req, res) => {
  try {
    const { credential } = req.body as z.infer<typeof loginBodySchema>;

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

    const orgRows = await db
      .select({
        slug: organizationsTable.slug,
        name: organizationsTable.name,
        role: orgMembersTable.role,
      })
      .from(orgMembersTable)
      .innerJoin(organizationsTable, eq(orgMembersTable.orgId, organizationsTable.id))
      .where(eq(orgMembersTable.userId, req.user!.id));

    sendSuccess(res, {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      roles: req.user!.roles,
      orgs: orgRows,
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

router.get("/auth/users", authMiddleware(), requireRole("ops"), async (req, res) => {
  try {
    const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
    const users = await db.select({
      id: usersTable.id,
      displayName: usersTable.displayName,
      email: usersTable.email,
      avatarUrl: usersTable.avatarUrl,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    sendSuccess(res, users, 200, { page, limit, offset });
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

const registerBodySchema = z.object({
  displayName: z.string().min(1, "displayName is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return randomBytes(32).toString("hex");
}

function generateVerificationToken(): string {
  return randomBytes(48).toString("hex");
}

router.post("/auth/register", validateBody(registerBodySchema), async (req, res) => {
  try {
    const { displayName, email, password } = req.body as z.infer<typeof registerBodySchema>;

    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing) {
      sendError(res, "An account with this email already exists. Please log in.", 409, "EMAIL_ALREADY_REGISTERED");
      return;
    }

    const salt = generateSalt();
    const passwordHash = `pbkdf2:${salt}:${hashPassword(password, salt)}`;

    const verificationToken = generateVerificationToken();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [user] = await db.insert(usersTable).values({
      displayName,
      email,
      replitId: null,
      isActive: false,
      passwordHash,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: tokenExpiresAt,
    }).returning({ id: usersTable.id, email: usersTable.email, displayName: usersTable.displayName });

    await logActivity(req, "create", "user", String(user.id)).catch(() => {});

    sendCreated(res, {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      message: "Account created. Check your email to verify and activate your account.",
    });
  } catch (err) {
    req.log?.error({ err }, "Registration failed");
    handleRouteError(res, err, "Registration failed");
  }
});

router.get("/auth/verify-email", async (req, res) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : null;
    if (!token) {
      sendBadRequest(res, "Missing verification token");
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.emailVerificationToken, token))
      .limit(1);

    if (!user) {
      sendError(res, "Invalid or expired verification link.", 400, "INVALID_TOKEN");
      return;
    }

    if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < new Date()) {
      sendError(res, "Verification link has expired. Please register again.", 400, "TOKEN_EXPIRED");
      return;
    }

    await db
      .update(usersTable)
      .set({
        isActive: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));

    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(sessionsTable).values({
      userId: user.id,
      token: sessionToken,
      expiresAt,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });

    sendSuccess(res, {
      verified: true,
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (err) {
    req.log?.error({ err }, "Email verification failed");
    handleRouteError(res, err, "Email verification failed");
  }
});

router.post("/auth/login-password", validateBody(loginPasswordSchema), async (req, res) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginPasswordSchema>;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    const invalidMsg = "Invalid email or password.";
    if (!user || !user.passwordHash) {
      sendError(res, invalidMsg, 401, "INVALID_CREDENTIALS");
      return;
    }

    const [, salt, storedHash] = user.passwordHash.split(":");
    if (!salt || !storedHash) {
      sendError(res, invalidMsg, 401, "INVALID_CREDENTIALS");
      return;
    }

    const candidateHash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
    const isValid = timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(candidateHash, "hex"));
    if (!isValid) {
      sendError(res, invalidMsg, 401, "INVALID_CREDENTIALS");
      return;
    }

    if (!user.isActive) {
      sendError(res, "Account is not yet verified. Please check your email.", 403, "EMAIL_NOT_VERIFIED");
      return;
    }

    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(sessionsTable).values({
      userId: user.id,
      token: sessionToken,
      expiresAt,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });

    await db.update(usersTable).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(usersTable.id, user.id));

    sendSuccess(res, {
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
      user: { id: user.id, displayName: user.displayName, email: user.email },
    });
  } catch (err) {
    req.log?.error({ err }, "Password login failed");
    handleRouteError(res, err, "Password login failed");
  }
});

export default router;
