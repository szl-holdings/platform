import { Router, type IRouter } from "express";
import { db, usersTable, sessionsTable, rolesTable, userRolesTable, organizationsTable, orgMembersTable, mfaSecretsTable, toCanonicalRole, type RoleName } from "@szl-holdings/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { randomBytes, pbkdf2Sync, timingSafeEqual, createCipheriv, createDecipheriv } from "crypto";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, sendForbidden, sendError, handleRouteError, parsePagination } from "../lib/api-response";
import { logActivity } from "../lib/activity-logger";
import { logger } from "../lib/logger";
import { createAuthService } from "@szl-holdings/auth";
import { issueWsTicket } from "../lib/websocket.js";
import { getSessionToken, getSessionUser } from "../lib/auth";
import { hashIp } from "@szl-holdings/audit";
import {
  createSessionWithRefresh,
  rotateRefreshToken,
  writeAuditEvent,
  RefreshTokenInvalidError,
  RefreshTokenReplayError,
} from "../middlewares/session-policy";
import { z } from "zod";
import { jsonObjectBodySchema, listQuerySchema, loginPasswordSchema, validateBody, validateQuery } from "../lib/validation";
import { generateSecret as otpGenerateSecret, verifySync as otpVerifySync, generateURI as otpGenerateURI } from "otplib";
import { redisGet, redisSet, redisDel } from "../lib/redis-client.js";

const router: IRouter = Router();
const authService = createAuthService();

interface MfaChallenge {
  userId: number;
  expiresAt: number;
}

// MFA challenge tokens use a dual-write strategy: always written to both Redis
// (primary, TTL-backed) and an in-process Map (safety net). This guarantees
// the token is findable on consume even if Redis has a transient failure
// between create and consume.  On consume we try Redis first (authoritative,
// single-use via GET+DEL), then fall through to the in-memory map if Redis
// returns null (handles the Redis-down-at-create scenario).
const _pendingMfaChallengesFallback = new Map<string, MfaChallenge>();
const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MFA_REDIS_PREFIX = "mfac:";

async function createMfaChallengeToken(userId: number): Promise<string> {
  const token = "mfac_" + randomBytes(24).toString("hex");
  const challenge: MfaChallenge = { userId, expiresAt: Date.now() + MFA_CHALLENGE_TTL_MS };
  // Dual-write: in-memory first (synchronous, always succeeds) then Redis
  _pendingMfaChallengesFallback.set(token, challenge);
  // Best-effort Redis write — failure is non-fatal; in-memory remains the fallback
  await redisSet(MFA_REDIS_PREFIX + token, challenge, MFA_CHALLENGE_TTL_MS);
  return token;
}

async function consumeMfaChallengeToken(token: string): Promise<number | null> {
  // Try Redis first — single-use, TTL-backed, works across instances
  const redisChallenge = await redisGet<MfaChallenge>(MFA_REDIS_PREFIX + token);
  if (redisChallenge) {
    await redisDel(MFA_REDIS_PREFIX + token);
    _pendingMfaChallengesFallback.delete(token); // keep stores consistent
    if (Date.now() > redisChallenge.expiresAt) return null;
    return redisChallenge.userId;
  }
  // Fallback: in-memory store (handles Redis-down-at-create or Redis-unavailable env)
  const challenge = _pendingMfaChallengesFallback.get(token);
  if (!challenge) return null;
  _pendingMfaChallengesFallback.delete(token);
  if (Date.now() > challenge.expiresAt) return null;
  return challenge.userId;
}

// ---------------------------------------------------------------------------
// TOTP secret encryption — AES-256-GCM, application-layer
// Set MFA_SECRET_ENCRYPTION_KEY to a 32-byte value (64 hex chars or 44-char
// base64) in production. Without it, secrets are stored with a "plain:" prefix
// and a startup warning is emitted. Encrypted secrets carry an "enc:" prefix
// so legacy and newly-encrypted rows are distinguishable.
// ---------------------------------------------------------------------------

const _MFA_KEY_LOG_CACHE = { warned: false };

function getMfaEncryptionKey(): Buffer | null {
  const raw = process.env.MFA_SECRET_ENCRYPTION_KEY;
  if (!raw) {
    if (!_MFA_KEY_LOG_CACHE.warned) {
      logger.warn("[mfa] MFA_SECRET_ENCRYPTION_KEY not set — TOTP secrets are stored without encryption. Set this variable in production.");
      _MFA_KEY_LOG_CACHE.warned = true;
    }
    return null;
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) return b64;
  logger.error("[mfa] MFA_SECRET_ENCRYPTION_KEY must be 32 bytes (64 hex chars or 44 base64 chars) — ignoring malformed key.");
  return null;
}

function encryptMfaSecret(plaintext: string): string {
  const key = getMfaEncryptionKey();
  if (!key) return "plain:" + plaintext;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return "enc:" + iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptMfaSecret(stored: string): string {
  if (stored.startsWith("enc:")) {
    const key = getMfaEncryptionKey();
    if (!key) throw new Error("MFA_SECRET_ENCRYPTION_KEY not set but encrypted secret found — cannot authenticate.");
    const parts = stored.slice(4).split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted MFA secret format.");
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    return decipher.update(Buffer.from(ciphertextHex, "hex")).toString("utf8") + decipher.final("utf8");
  }
  if (stored.startsWith("plain:")) return stored.slice(6);
  // Legacy plaintext row (no prefix) — transparently readable; re-setup rotates to encrypted
  return stored;
}

// ---------------------------------------------------------------------------
// Org-level MFA enforcement (Task 2166)
//
// When any organization a user belongs to has mfa_required=true, the user
// MUST have MFA enabled to receive a session. If they do not, login returns
// `mfa_setup_required: true` along with a short-lived setup token that lets
// them complete MFA setup without an active session, after which a session
// is issued.
// ---------------------------------------------------------------------------

async function isOrgMfaRequiredForUser(userId: number): Promise<boolean> {
  const memberOrgIds = await db
    .select({ orgId: orgMembersTable.orgId })
    .from(orgMembersTable)
    .where(eq(orgMembersTable.userId, userId));
  if (memberOrgIds.length === 0) return false;
  const orgIds = memberOrgIds.map((r) => r.orgId);
  const enforcing = await db
    .select({ id: organizationsTable.id })
    .from(organizationsTable)
    .where(and(inArray(organizationsTable.id, orgIds), eq(organizationsTable.mfaRequired, true)))
    .limit(1);
  return enforcing.length > 0;
}

interface MfaSetupChallenge {
  userId: number;
  expiresAt: number;
  secret?: string;
}

const _pendingMfaSetupFallback = new Map<string, MfaSetupChallenge>();
const MFA_SETUP_TTL_MS = 15 * 60 * 1000;
const MFA_SETUP_REDIS_PREFIX = "mfasetup:";

async function createMfaSetupToken(userId: number): Promise<string> {
  const token = "mfasetup_" + randomBytes(24).toString("hex");
  const challenge: MfaSetupChallenge = { userId, expiresAt: Date.now() + MFA_SETUP_TTL_MS };
  _pendingMfaSetupFallback.set(token, challenge);
  await redisSet(MFA_SETUP_REDIS_PREFIX + token, challenge, MFA_SETUP_TTL_MS);
  return token;
}

async function readMfaSetupToken(token: string): Promise<MfaSetupChallenge | null> {
  const fromRedis = await redisGet<MfaSetupChallenge>(MFA_SETUP_REDIS_PREFIX + token);
  if (fromRedis) {
    if (Date.now() > fromRedis.expiresAt) return null;
    return fromRedis;
  }
  const local = _pendingMfaSetupFallback.get(token);
  if (!local) return null;
  if (Date.now() > local.expiresAt) {
    _pendingMfaSetupFallback.delete(token);
    return null;
  }
  return local;
}

async function updateMfaSetupToken(token: string, patch: Partial<MfaSetupChallenge>): Promise<void> {
  const current = await readMfaSetupToken(token);
  if (!current) return;
  const next = { ...current, ...patch };
  _pendingMfaSetupFallback.set(token, next);
  await redisSet(MFA_SETUP_REDIS_PREFIX + token, next, Math.max(1, next.expiresAt - Date.now()));
}

async function consumeMfaSetupToken(token: string): Promise<MfaSetupChallenge | null> {
  const current = await readMfaSetupToken(token);
  if (!current) return null;
  await redisDel(MFA_SETUP_REDIS_PREFIX + token);
  _pendingMfaSetupFallback.delete(token);
  return current;
}

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

    const [mfaRecord] = await db
      .select()
      .from(mfaSecretsTable)
      .where(eq(mfaSecretsTable.userId, user.id))
      .limit(1);

    if (mfaRecord?.enabled) {
      const mfaChallengeToken = await createMfaChallengeToken(user.id);
      sendSuccess(res, { mfa_required: true, mfa_challenge_token: mfaChallengeToken });
      return;
    }

    if (await isOrgMfaRequiredForUser(user.id)) {
      const mfaSetupToken = await createMfaSetupToken(user.id);
      sendSuccess(res, {
        mfa_setup_required: true,
        mfa_setup_token: mfaSetupToken,
        message: "Your organization requires multi-factor authentication. Please set up MFA to continue.",
      });
      return;
    }

    const created = await createSessionWithRefresh({
      userId: user.id,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      reason: "login",
    });

    const userRoles = await db
      .select({ roleName: rolesTable.name })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, user.id));

    sendCreated(res, {
      token: created.token,
      refreshToken: created.refreshToken,
      expiresAt: created.expiresAt.toISOString(),
      refreshTokenExpiresAt: created.refreshTokenExpiresAt.toISOString(),
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

router.post("/auth/sessions", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const created = await createSessionWithRefresh({
      userId: req.user!.id,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      reason: "manual_session_create",
    });

    await logActivity(req, "create", "session", String(created.sessionId));

    sendCreated(res, {
      token: created.token,
      refreshToken: created.refreshToken,
      expiresAt: created.expiresAt.toISOString(),
      refreshTokenExpiresAt: created.refreshTokenExpiresAt.toISOString(),
    });
  } catch (err) {
    req.log?.error({ err }, "Failed to create session");
    handleRouteError(res, err, "Failed to create session");
  }
});

const refreshBodySchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

/**
 * Rotate a refresh token. Returns a new access token + refresh token pair.
 * Old refresh token is single-use and replay attempts revoke all sessions
 * for the user.
 */
router.post("/auth/refresh", validateBody(refreshBodySchema), async (req, res) => {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshBodySchema>;
    const next = await rotateRefreshToken({
      refreshToken,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });

    sendSuccess(res, {
      token: next.token,
      refreshToken: next.refreshToken,
      expiresAt: next.expiresAt.toISOString(),
      refreshTokenExpiresAt: next.refreshTokenExpiresAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof RefreshTokenReplayError) {
      sendError(res, "Refresh token replay detected. All sessions revoked.", 401, "REFRESH_TOKEN_REPLAY");
      return;
    }
    if (err instanceof RefreshTokenInvalidError) {
      sendError(res, err.message, 401, "REFRESH_TOKEN_INVALID");
      return;
    }
    req.log?.error({ err }, "Refresh token rotation failed");
    handleRouteError(res, err, "Failed to refresh session");
  }
});

router.delete("/auth/sessions/current", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
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
    await writeAuditEvent({
      userId: req.user!.id,
      action: "session.invalidate",
      entityType: "session",
      entityId: String(session.id),
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      newValues: { reason: "user_logout" },
    });
    sendNoContent(res);
  } catch (err) {
    req.log?.error({ err }, "Failed to delete session");
    handleRouteError(res, err, "Failed to delete session");
  }
});

router.delete("/auth/sessions/:id", validateBody(jsonObjectBodySchema), authMiddleware(), async (req, res) => {
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
    await writeAuditEvent({
      userId: req.user!.id,
      action: "session.invalidate",
      entityType: "session",
      entityId: String(session.id),
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      newValues: {
        reason: "session_delete_by_id",
        targetUserId: session.userId,
        invokedBy: req.user!.id,
      },
    });
    sendNoContent(res);
  } catch (err) {
    req.log?.error({ err }, "Failed to delete session");
    handleRouteError(res, err, "Failed to delete session");
  }
});

router.get("/auth/my-roles", authMiddleware(), async (req, res) => {
  res.json({ roles: req.user!.roles ?? [] });
});

router.get("/auth/roles", authMiddleware(), requireRole("ops", "analyst"), async (_req, res) => {
  try {
    const roles = await db.select().from(rolesTable).orderBy(rolesTable.name);
    sendSuccess(res, roles);
  } catch (err) {
    handleRouteError(res, err, "Failed to list roles");
  }
});

router.get("/auth/users", authMiddleware(), requireRole("ops"), validateQuery(listQuerySchema), async (req, res) => {
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

router.post("/auth/ws-ticket", validateBody(jsonObjectBodySchema), async (req, res) => {
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

router.get("/auth/verify-email", validateQuery(listQuerySchema), async (req, res) => {
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

    const created = await createSessionWithRefresh({
      userId: user.id,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      reason: "email_verification",
    });

    sendSuccess(res, {
      verified: true,
      token: created.token,
      refreshToken: created.refreshToken,
      expiresAt: created.expiresAt.toISOString(),
      refreshTokenExpiresAt: created.refreshTokenExpiresAt.toISOString(),
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

    const [mfaRecord] = await db
      .select()
      .from(mfaSecretsTable)
      .where(eq(mfaSecretsTable.userId, user.id))
      .limit(1);

    if (mfaRecord?.enabled) {
      await db.update(usersTable).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(usersTable.id, user.id));
      const mfaChallengeToken = await createMfaChallengeToken(user.id);
      sendSuccess(res, { mfa_required: true, mfa_challenge_token: mfaChallengeToken });
      return;
    }

    if (await isOrgMfaRequiredForUser(user.id)) {
      const mfaSetupToken = await createMfaSetupToken(user.id);
      sendSuccess(res, {
        mfa_setup_required: true,
        mfa_setup_token: mfaSetupToken,
        message: "Your organization requires multi-factor authentication. Please set up MFA to continue.",
      });
      return;
    }

    const created = await createSessionWithRefresh({
      userId: user.id,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      reason: "password_login",
    });

    await db.update(usersTable).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(usersTable.id, user.id));

    sendSuccess(res, {
      token: created.token,
      refreshToken: created.refreshToken,
      expiresAt: created.expiresAt.toISOString(),
      refreshTokenExpiresAt: created.refreshTokenExpiresAt.toISOString(),
      user: { id: user.id, displayName: user.displayName, email: user.email },
    });
  } catch (err) {
    req.log?.error({ err }, "Password login failed");
    handleRouteError(res, err, "Password login failed");
  }
});

const mfaSetupSchema = z.object({});

router.post("/auth/mfa/setup", authMiddleware(), validateBody(mfaSetupSchema), async (req, res) => {
  try {
    const userId = req.user!.id;

    const [existing] = await db
      .select()
      .from(mfaSecretsTable)
      .where(eq(mfaSecretsTable.userId, userId))
      .limit(1);

    if (existing?.enabled) {
      sendBadRequest(res, "MFA is already enabled. Disable it first to set up a new authenticator.");
      return;
    }

    const secret = otpGenerateSecret();

    const storedSecret = encryptMfaSecret(secret);

    if (existing) {
      await db
        .update(mfaSecretsTable)
        .set({ secret: storedSecret, enabled: false, enabledAt: null })
        .where(eq(mfaSecretsTable.userId, userId));
    } else {
      await db.insert(mfaSecretsTable).values({ userId, secret: storedSecret, enabled: false });
    }

    const [user] = await db.select({ displayName: usersTable.displayName, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const label = user?.email ?? user?.displayName ?? `user_${userId}`;
    const otpauthUri = otpGenerateURI({ issuer: "SZL Holdings", label, secret, strategy: "totp" });

    sendSuccess(res, {
      secret,
      otpauthUri,
      message: "Scan the QR code in your authenticator app, then call POST /auth/mfa/enable with a valid 6-digit code to activate MFA.",
    });
  } catch (err) {
    req.log?.error({ err }, "MFA setup failed");
    handleRouteError(res, err, "MFA setup failed");
  }
});

const mfaEnableSchema = z.object({
  code: z.string().length(6, "TOTP code must be exactly 6 digits").regex(/^\d{6}$/, "TOTP code must be 6 digits"),
});

router.post("/auth/mfa/enable", authMiddleware(), validateBody(mfaEnableSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { code } = req.body as z.infer<typeof mfaEnableSchema>;

    const [record] = await db
      .select()
      .from(mfaSecretsTable)
      .where(eq(mfaSecretsTable.userId, userId))
      .limit(1);

    if (!record) {
      sendBadRequest(res, "No MFA setup found. Call POST /auth/mfa/setup first.");
      return;
    }

    if (record.enabled) {
      sendBadRequest(res, "MFA is already enabled.");
      return;
    }

    const isValid = otpVerifySync({ token: code, secret: decryptMfaSecret(record.secret) });
    if (!isValid) {
      sendError(res, "Invalid TOTP code. Please try again.", 400, "MFA_INVALID_CODE");
      return;
    }

    await db
      .update(mfaSecretsTable)
      .set({ enabled: true, enabledAt: new Date() })
      .where(eq(mfaSecretsTable.userId, userId));

    await writeAuditEvent({
      userId,
      action: "mfa.enabled",
      entityType: "user",
      entityId: String(userId),
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      newValues: { enabled: true },
    });

    sendSuccess(res, { enabled: true, message: "MFA has been enabled for your account." });
  } catch (err) {
    req.log?.error({ err }, "MFA enable failed");
    handleRouteError(res, err, "MFA enable failed");
  }
});

const mfaChallengeSchema = z.object({
  mfa_challenge_token: z.string().min(1, "mfa_challenge_token is required"),
  code: z.string().length(6, "TOTP code must be exactly 6 digits").regex(/^\d{6}$/, "TOTP code must be 6 digits"),
});

router.post("/auth/mfa/challenge", validateBody(mfaChallengeSchema), async (req, res) => {
  try {
    const { mfa_challenge_token, code } = req.body as z.infer<typeof mfaChallengeSchema>;

    const userId = await consumeMfaChallengeToken(mfa_challenge_token);
    if (!userId) {
      sendError(res, "MFA challenge token is invalid or expired. Please log in again.", 401, "MFA_CHALLENGE_EXPIRED");
      return;
    }

    const [record] = await db
      .select()
      .from(mfaSecretsTable)
      .where(eq(mfaSecretsTable.userId, userId))
      .limit(1);

    if (!record?.enabled) {
      sendError(res, "MFA is not configured for this account.", 400, "MFA_NOT_CONFIGURED");
      return;
    }

    const isValid = otpVerifySync({ token: code, secret: decryptMfaSecret(record.secret) });
    if (!isValid) {
      sendError(res, "Invalid TOTP code.", 401, "MFA_INVALID_CODE");
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || !user.isActive) {
      sendError(res, "Account is disabled.", 403, "ACCOUNT_DISABLED");
      return;
    }

    const created = await createSessionWithRefresh({
      userId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      reason: "mfa_challenge",
    });

    await db.update(usersTable).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(usersTable.id, userId));

    await writeAuditEvent({
      userId,
      action: "mfa.challenge_passed",
      entityType: "session",
      entityId: String(created.sessionId),
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });

    sendSuccess(res, {
      token: created.token,
      refreshToken: created.refreshToken,
      expiresAt: created.expiresAt.toISOString(),
      refreshTokenExpiresAt: created.refreshTokenExpiresAt.toISOString(),
      user: { id: user.id, displayName: user.displayName, email: user.email },
    });
  } catch (err) {
    req.log?.error({ err }, "MFA challenge failed");
    handleRouteError(res, err, "MFA challenge failed");
  }
});

const mfaDisableSchema = z.object({
  code: z.string().length(6, "TOTP code must be exactly 6 digits").regex(/^\d{6}$/, "TOTP code must be 6 digits"),
});

router.delete("/auth/mfa", authMiddleware(), validateBody(mfaDisableSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { code } = req.body as z.infer<typeof mfaDisableSchema>;

    const [record] = await db
      .select()
      .from(mfaSecretsTable)
      .where(eq(mfaSecretsTable.userId, userId))
      .limit(1);

    if (!record?.enabled) {
      sendBadRequest(res, "MFA is not currently enabled.");
      return;
    }

    const isValid = otpVerifySync({ token: code, secret: decryptMfaSecret(record.secret) });
    if (!isValid) {
      sendError(res, "Invalid TOTP code. MFA was not disabled.", 401, "MFA_INVALID_CODE");
      return;
    }

    await db
      .delete(mfaSecretsTable)
      .where(eq(mfaSecretsTable.userId, userId));

    await writeAuditEvent({
      userId,
      action: "mfa.disabled",
      entityType: "user",
      entityId: String(userId),
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      newValues: { enabled: false },
    });

    sendNoContent(res);
  } catch (err) {
    req.log?.error({ err }, "MFA disable failed");
    handleRouteError(res, err, "MFA disable failed");
  }
});

// ---------------------------------------------------------------------------
// Org-required MFA setup endpoints (Task 2166)
//
// These endpoints let a user complete MFA setup without holding a session,
// using the short-lived setup token returned by /auth/login or
// /auth/login-password when their org enforces MFA. After enabling MFA, a
// session is issued in a single round trip.
// ---------------------------------------------------------------------------

const mfaSetupRequiredSchema = z.object({
  mfa_setup_token: z.string().min(1, "mfa_setup_token is required"),
});

router.post("/auth/mfa/setup-required", validateBody(mfaSetupRequiredSchema), async (req, res) => {
  try {
    const { mfa_setup_token } = req.body as z.infer<typeof mfaSetupRequiredSchema>;
    const challenge = await readMfaSetupToken(mfa_setup_token);
    if (!challenge) {
      sendError(res, "MFA setup token is invalid or expired. Please log in again.", 401, "MFA_SETUP_TOKEN_INVALID");
      return;
    }

    const userId = challenge.userId;

    const [existing] = await db
      .select()
      .from(mfaSecretsTable)
      .where(eq(mfaSecretsTable.userId, userId))
      .limit(1);

    if (existing?.enabled) {
      sendBadRequest(res, "MFA is already enabled. Please log in again.");
      return;
    }

    const secret = otpGenerateSecret();
    const storedSecret = encryptMfaSecret(secret);

    if (existing) {
      await db
        .update(mfaSecretsTable)
        .set({ secret: storedSecret, enabled: false, enabledAt: null })
        .where(eq(mfaSecretsTable.userId, userId));
    } else {
      await db.insert(mfaSecretsTable).values({ userId, secret: storedSecret, enabled: false });
    }

    await updateMfaSetupToken(mfa_setup_token, { secret });

    const [user] = await db.select({ displayName: usersTable.displayName, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const label = user?.email ?? user?.displayName ?? `user_${userId}`;
    const otpauthUri = otpGenerateURI({ issuer: "SZL Holdings", label, secret, strategy: "totp" });

    sendSuccess(res, {
      secret,
      otpauthUri,
      message: "Scan the QR code in your authenticator app, then call POST /auth/mfa/enable-required with the 6-digit code to finish login.",
    });
  } catch (err) {
    req.log?.error({ err }, "Org-required MFA setup failed");
    handleRouteError(res, err, "MFA setup failed");
  }
});

const mfaEnableRequiredSchema = z.object({
  mfa_setup_token: z.string().min(1, "mfa_setup_token is required"),
  code: z.string().length(6, "TOTP code must be exactly 6 digits").regex(/^\d{6}$/, "TOTP code must be 6 digits"),
});

router.post("/auth/mfa/enable-required", validateBody(mfaEnableRequiredSchema), async (req, res) => {
  try {
    const { mfa_setup_token, code } = req.body as z.infer<typeof mfaEnableRequiredSchema>;
    const challenge = await readMfaSetupToken(mfa_setup_token);
    if (!challenge) {
      sendError(res, "MFA setup token is invalid or expired. Please log in again.", 401, "MFA_SETUP_TOKEN_INVALID");
      return;
    }

    const userId = challenge.userId;

    const [record] = await db
      .select()
      .from(mfaSecretsTable)
      .where(eq(mfaSecretsTable.userId, userId))
      .limit(1);

    if (!record) {
      sendBadRequest(res, "No MFA setup found. Call POST /auth/mfa/setup-required first.");
      return;
    }

    if (record.enabled) {
      sendBadRequest(res, "MFA is already enabled. Please log in again.");
      return;
    }

    const isValid = otpVerifySync({ token: code, secret: decryptMfaSecret(record.secret) });
    if (!isValid) {
      sendError(res, "Invalid TOTP code. Please try again.", 400, "MFA_INVALID_CODE");
      return;
    }

    await db
      .update(mfaSecretsTable)
      .set({ enabled: true, enabledAt: new Date() })
      .where(eq(mfaSecretsTable.userId, userId));

    await consumeMfaSetupToken(mfa_setup_token);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || !user.isActive) {
      sendError(res, "Account is disabled.", 403, "ACCOUNT_DISABLED");
      return;
    }

    await writeAuditEvent({
      userId,
      action: "mfa.enabled",
      entityType: "user",
      entityId: String(userId),
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      newValues: { enabled: true, reason: "org_mfa_required" },
    });

    const created = await createSessionWithRefresh({
      userId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      reason: "mfa_setup_required",
    });

    await db.update(usersTable).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(usersTable.id, userId));

    sendSuccess(res, {
      token: created.token,
      refreshToken: created.refreshToken,
      expiresAt: created.expiresAt.toISOString(),
      refreshTokenExpiresAt: created.refreshTokenExpiresAt.toISOString(),
      user: { id: user.id, displayName: user.displayName, email: user.email },
    });
  } catch (err) {
    req.log?.error({ err }, "Org-required MFA enable failed");
    handleRouteError(res, err, "MFA enable failed");
  }
});

router.get("/auth/mfa/status", authMiddleware(), async (req, res) => {
  try {
    const userId = req.user!.id;
    const [record] = await db
      .select({ enabled: mfaSecretsTable.enabled, enabledAt: mfaSecretsTable.enabledAt })
      .from(mfaSecretsTable)
      .where(eq(mfaSecretsTable.userId, userId))
      .limit(1);

    sendSuccess(res, {
      enabled: record?.enabled ?? false,
      enabledAt: record?.enabledAt ?? null,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get MFA status");
  }
});

export default router;
