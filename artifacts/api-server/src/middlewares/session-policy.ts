/**
 * Session Policy Middleware
 *
 * Implements:
 *   - Session sliding window refresh (auto-extend TTL on active use)
 *   - Session timeout enforcement (absolute max age)
 *   - Admin impersonation session management with audit trail
 *
 * Constants:
 *   SESSION_TTL            = 7 days (hard expiry from creation)
 *   SESSION_REFRESH_WINDOW = 1 day  (refresh if < 1 day remaining)
 *   IMPERSONATION_TTL      = 1 hour
 */

import { hashIp } from '@szl-holdings/audit';
import type { RoleName } from '@szl-holdings/db';
import {
  auditEventsTable,
  db,
  rolesTable,
  sessionsTable,
  userRolesTable,
  usersTable,
} from '@szl-holdings/db';
import crypto from 'crypto';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE, SESSION_TTL, setSessionCookie } from '../lib/auth';
import { logger } from '../lib/logger';
import type { AuthenticatedUser } from './auth';

export const SESSION_REFRESH_WINDOW = 24 * 60 * 60 * 1000;
export const IMPERSONATION_TTL = 60 * 60 * 1000;
export const IMPERSONATION_HEADER = 'x-impersonation-session';

declare global {
  namespace Express {
    interface Request {
      isImpersonation?: boolean;
      impersonatingUserId?: number;
    }
  }
}

/**
 * Sliding window session refresh middleware.
 *
 * Policy:
 * - Absolute max age = SESSION_TTL from session creation (createdAt). Sessions
 *   are never extended past createdAt + SESSION_TTL, preventing indefinite sliding.
 * - Sliding refresh: if the session has fewer than SESSION_REFRESH_WINDOW ms
 *   remaining AND the absolute max age has not been reached, extend expiry up to
 *   the absolute ceiling.
 * - When DB expiry is updated, the response cookie is also refreshed to match so
 *   the client-side cookie does not expire before the DB session.
 *
 * Must be placed AFTER authMiddleware().
 */
export function sessionRefreshPolicy() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.isInternalAgent) {
        next();
        return;
      }

      const token = req.cookies?.[SESSION_COOKIE] ?? extractBearerToken(req);
      if (!token) {
        next();
        return;
      }

      // Impersonation tokens must not be extended — they have a hard 1-hour TTL
      // enforced at creation and must not be prolonged by the sliding refresh policy.
      if (token.startsWith('imp_')) {
        next();
        return;
      }

      const [session] = await db
        .select({
          id: sessionsTable.id,
          expiresAt: sessionsTable.expiresAt,
          createdAt: sessionsTable.createdAt,
        })
        .from(sessionsTable)
        .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, new Date())))
        .limit(1);

      if (!session) {
        next();
        return;
      }

      const absoluteCeiling = new Date(session.createdAt.getTime() + SESSION_TTL);
      const now = Date.now();

      if (now >= absoluteCeiling.getTime()) {
        next();
        return;
      }

      const remaining = session.expiresAt.getTime() - now;
      if (remaining < SESSION_REFRESH_WINDOW) {
        const newExpiry = new Date(Math.min(now + SESSION_TTL, absoluteCeiling.getTime()));
        await db
          .update(sessionsTable)
          .set({ expiresAt: newExpiry })
          .where(eq(sessionsTable.id, session.id));

        if (req.cookies?.[SESSION_COOKIE]) {
          setSessionCookie(res, token);
        }
      }

      next();
    } catch (err) {
      logger.warn({ err }, 'Session refresh policy error — non-fatal');
      next();
    }
  };
}

function extractBearerToken(req: Request): string | undefined {
  const h = req.headers.authorization;
  if (h?.startsWith('Bearer ')) return h.slice(7);
  return undefined;
}

/**
 * Write an audit event for an auth/access action.
 */
type AuditInsert = typeof auditEventsTable.$inferInsert;

export async function writeAuditEvent(params: {
  userId: number | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  newValues?: Record<string, unknown>;
}) {
  try {
    const row: AuditInsert = {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      ipAddress: hashIp(params.ipAddress),
      userAgent: params.userAgent ?? null,
      newValues: params.newValues ?? null,
    };
    await db.insert(auditEventsTable).values(row);
  } catch (err) {
    logger.error({ err }, 'Failed to write audit event');
  }
}

/**
 * Global session cutoff for SESSION_SECRET rotation (AF-012).
 *
 * Tokens issued by this server are opaque random strings stored in the
 * `sessions` table — they are NOT signed with SESSION_SECRET, so rotating
 * SESSION_SECRET alone does not invalidate any existing sessions. To force
 * a global re-authentication after a secret rotation (or any other "log
 * everyone out now" event), set `SESSION_MIN_CREATED_AT` to an ISO-8601
 * timestamp at or after the rotation moment. Any session with
 * `created_at < SESSION_MIN_CREATED_AT` will be treated as revoked by
 * `resolveUserFromToken` on the next request.
 *
 * Returns null when the env var is unset, malformed, or in the future
 * relative to deployment (defensive — we never want a misconfig to lock
 * out future logins).
 */
let _cachedCutoff: { raw: string; value: Date | null } | null = null;
export function getSessionMinCreatedAt(): Date | null {
  const raw = process.env['SESSION_MIN_CREATED_AT']?.trim();
  if (!raw) {
    _cachedCutoff = null;
    return null;
  }
  if (_cachedCutoff && _cachedCutoff.raw === raw) return _cachedCutoff.value;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    logger.warn(
      { rawValue: raw },
      'SESSION_MIN_CREATED_AT is set but not a valid ISO-8601 timestamp — ignoring',
    );
    _cachedCutoff = { raw, value: null };
    return null;
  }
  // Defensive: a future cutoff would invalidate every session including
  // brand-new ones (clock skew / timezone typo / accidentally pasting
  // a tomorrow timestamp), creating a global auth outage. Allow a small
  // forward tolerance for clock drift but reject anything beyond.
  // NOTE: future timestamps are not cached — once "now" advances past
  // them they should automatically take effect, so we re-evaluate on
  // every call until they become valid.
  const now = Date.now();
  const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
  if (parsed.getTime() > now + FUTURE_TOLERANCE_MS) {
    logger.warn(
      { rawValue: raw, parsedIso: parsed.toISOString(), nowIso: new Date(now).toISOString() },
      'SESSION_MIN_CREATED_AT is more than 5 minutes in the future — ignoring to avoid locking out all users (likely clock-skew or timezone misconfig)',
    );
    return null;
  }
  _cachedCutoff = { raw, value: parsed };
  return parsed;
}

/**
 * Test-only helper to clear the cached cutoff so unit tests can mutate
 * SESSION_MIN_CREATED_AT between cases.
 */
export function _resetSessionMinCreatedAtCache(): void {
  _cachedCutoff = null;
}

/**
 * Bump a user's session_version. All sessions whose stored sessionVersion is
 * less than the new value are considered revoked by the auth middleware on the
 * next request (≤30s convergence is bounded by request frequency, not a TTL).
 *
 * Returns the new session_version.
 */
export async function bumpUserSessionVersion(userId: number): Promise<number> {
  const [row] = await db
    .update(usersTable)
    .set({ sessionVersion: sql`${usersTable.sessionVersion} + 1`, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning({ sessionVersion: usersTable.sessionVersion });
  return row?.sessionVersion ?? 0;
}

/**
 * Revoke all active sessions for a user after a role change.
 *
 * Call this whenever a user's roles are assigned, updated, or removed so that
 * privilege escalation or de-escalation takes effect immediately. The user
 * will be required to re-authenticate with their new role set.
 *
 * Writes an audit event so the revocation is traceable.
 */
export async function revokeUserSessionsOnRoleChange(params: {
  userId: number;
  changedByUserId: number | null;
  reason?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ revokedCount: number }> {
  const { userId, changedByUserId, reason, ipAddress = null, userAgent = null } = params;

  // Bump session_version first — ensures even sessions resolved between the
  // bump and the delete will fail the version check on their next request.
  const newVersion = await bumpUserSessionVersion(userId);

  const sessions = await db
    .select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(and(eq(sessionsTable.userId, userId), isNull(sessionsTable.revokedAt)));

  const now = new Date();
  if (sessions.length > 0) {
    await db
      .update(sessionsTable)
      .set({ revokedAt: now, revokedReason: reason ?? 'role_change' })
      .where(and(eq(sessionsTable.userId, userId), isNull(sessionsTable.revokedAt)));
  }

  await writeAuditEvent({
    userId: changedByUserId,
    action: 'session.invalidate',
    entityType: 'user',
    entityId: String(userId),
    ipAddress,
    userAgent,
    newValues: {
      targetUserId: userId,
      revokedSessionCount: sessions.length,
      newSessionVersion: newVersion,
      reason: reason ?? 'role change',
    },
  });

  logger.info(
    { userId, changedByUserId, revokedCount: sessions.length, newSessionVersion: newVersion },
    'Sessions revoked on role change',
  );

  return { revokedCount: sessions.length };
}

/**
 * Default refresh-token TTL — 30 days, matching the access-session TTL ceiling.
 */
export const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 * 1000;

/**
 * Generate a fresh access + refresh token pair for a new session.
 */
export function generateTokenPair(): { token: string; refreshToken: string } {
  return {
    token: crypto.randomBytes(32).toString('hex'),
    refreshToken: `rt_${crypto.randomBytes(32).toString('hex')}`,
  };
}

export interface CreatedSession {
  sessionId: number;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  refreshTokenExpiresAt: Date;
  sessionVersion: number;
}

/**
 * Create a session with a rotating refresh token. Writes a `session.create`
 * audit event tied to the operator id, IP, and user agent.
 */
export async function createSessionWithRefresh(params: {
  userId: number;
  ipAddress: string | null;
  userAgent: string | null;
  reason?: string;
  ttlMs?: number;
}): Promise<CreatedSession> {
  const ttl = params.ttlMs ?? SESSION_TTL;
  const { token, refreshToken } = generateTokenPair();
  const expiresAt = new Date(Date.now() + ttl);
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);

  const [user] = await db
    .select({ sessionVersion: usersTable.sessionVersion })
    .from(usersTable)
    .where(eq(usersTable.id, params.userId))
    .limit(1);

  const sessionVersion = user?.sessionVersion ?? 1;

  const [row] = await db
    .insert(sessionsTable)
    .values({
      userId: params.userId,
      token,
      expiresAt,
      ipAddress: hashIp(params.ipAddress),
      userAgent: params.userAgent,
      sessionVersion,
      refreshToken,
      refreshTokenExpiresAt,
    })
    .returning({ id: sessionsTable.id });

  await writeAuditEvent({
    userId: params.userId,
    action: 'session.create',
    entityType: 'session',
    entityId: String(row.id),
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    newValues: {
      reason: params.reason ?? 'login',
      sessionVersion,
      tokenPrefix: token.slice(0, 8),
    },
  });

  return {
    sessionId: row.id,
    token,
    refreshToken,
    expiresAt,
    refreshTokenExpiresAt,
    sessionVersion,
  };
}

export class RefreshTokenReplayError extends Error {
  constructor() {
    super('Refresh token replay detected');
    this.name = 'RefreshTokenReplayError';
  }
}

export class RefreshTokenInvalidError extends Error {
  constructor(message = 'Invalid or expired refresh token') {
    super(message);
    this.name = 'RefreshTokenInvalidError';
  }
}

/**
 * Single-use refresh-token rotation.
 *
 * - The presented refresh token must exist, not be expired, not previously
 *   used, and the parent session must not have been revoked.
 * - On success: the parent session is revoked (replaced), a new session +
 *   refresh token are issued, and a `session.refresh` audit event is written.
 * - Replay (presenting an already-used refresh token) revokes ALL of that
 *   user's active sessions and writes a `session.refresh.replay` audit event,
 *   matching standard rotating-refresh-token theft response.
 */
export async function rotateRefreshToken(params: {
  refreshToken: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<CreatedSession> {
  const { refreshToken, ipAddress, userAgent } = params;

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.refreshToken, refreshToken))
    .limit(1);

  if (!session) {
    throw new RefreshTokenInvalidError();
  }

  // Replay detection: a refresh token that was already consumed signals theft.
  if (session.refreshTokenUsedAt) {
    const now = new Date();
    await db
      .update(sessionsTable)
      .set({ revokedAt: now, revokedReason: 'refresh_token_replay' })
      .where(and(eq(sessionsTable.userId, session.userId), isNull(sessionsTable.revokedAt)));

    await bumpUserSessionVersion(session.userId);

    await writeAuditEvent({
      userId: session.userId,
      action: 'session.refresh.replay',
      entityType: 'session',
      entityId: String(session.id),
      ipAddress,
      userAgent,
      newValues: {
        replayedRefreshTokenPrefix: refreshToken.slice(0, 8),
        originalUsedAt: session.refreshTokenUsedAt.toISOString(),
      },
    });

    throw new RefreshTokenReplayError();
  }

  if (session.revokedAt) {
    throw new RefreshTokenInvalidError('Session has been revoked');
  }

  if (session.refreshTokenExpiresAt && session.refreshTokenExpiresAt.getTime() < Date.now()) {
    throw new RefreshTokenInvalidError('Refresh token expired');
  }

  // Confirm the user is still active and pull the live session_version so
  // the new session reflects any role changes that occurred during the old
  // session's lifetime.
  const [user] = await db
    .select({
      id: usersTable.id,
      isActive: usersTable.isActive,
      sessionVersion: usersTable.sessionVersion,
    })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);

  if (!user || !user.isActive) {
    throw new RefreshTokenInvalidError('User is not active');
  }

  // Atomically CLAIM the refresh token before minting anything new. The
  // conditional WHERE means only one of N concurrent rotations can succeed;
  // the others see 0 rows updated and fail closed. This is what makes the
  // refresh token genuinely single-use under load, independent of the
  // surrounding transaction isolation level.
  const usedAt = new Date();
  const claimed = await db
    .update(sessionsTable)
    .set({
      refreshTokenUsedAt: usedAt,
      revokedAt: usedAt,
      revokedReason: 'rotated',
    })
    .where(
      and(
        eq(sessionsTable.id, session.id),
        isNull(sessionsTable.refreshTokenUsedAt),
        isNull(sessionsTable.revokedAt),
      ),
    )
    .returning({ id: sessionsTable.id });

  if (claimed.length === 0) {
    // Lost the race — another concurrent rotation already consumed this
    // token. Treat as replay so the second attempt is rejected without
    // minting a duplicate session. We do NOT cascade-revoke here (a brief
    // double-click on a flaky network shouldn't sign every device out); a
    // subsequent reuse of the same token will hit the early replay check
    // above and trigger the full session-version bump.
    await writeAuditEvent({
      userId: session.userId,
      action: 'session.refresh.replay',
      entityType: 'session',
      entityId: String(session.id),
      ipAddress,
      userAgent,
      newValues: {
        replayedRefreshTokenPrefix: refreshToken.slice(0, 8),
        cause: 'concurrent_rotation_race',
      },
    });
    throw new RefreshTokenReplayError();
  }

  const next = await createSessionWithRefresh({
    userId: session.userId,
    ipAddress,
    userAgent,
    reason: 'refresh',
  });

  // Backfill the replaced_by pointer now that the new session id is known.
  await db
    .update(sessionsTable)
    .set({ replacedBySessionId: next.sessionId })
    .where(eq(sessionsTable.id, session.id));

  await writeAuditEvent({
    userId: session.userId,
    action: 'session.refresh',
    entityType: 'session',
    entityId: String(next.sessionId),
    ipAddress,
    userAgent,
    newValues: {
      previousSessionId: session.id,
      newSessionId: next.sessionId,
      sessionVersion: next.sessionVersion,
    },
  });

  return next;
}

/**
 * Start an impersonation session.
 * Caller must already be authenticated as super_admin or admin.
 * Returns a short-lived impersonation token.
 */
export async function startImpersonation(params: {
  impersonatorId: number;
  targetUserId: number;
  ipAddress: string | null;
  userAgent: string | null;
  reason?: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const { impersonatorId, targetUserId, ipAddress, userAgent, reason } = params;

  const [target] = await db
    .select({ id: usersTable.id, isActive: usersTable.isActive })
    .from(usersTable)
    .where(eq(usersTable.id, targetUserId))
    .limit(1);

  if (!target || !target.isActive) {
    throw new Error('Target user not found or inactive');
  }

  const impersonatorRoleRows = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, impersonatorId));

  const impersonatorRoleNames = impersonatorRoleRows.map((r) => r.roleName as RoleName);

  const targetRoleRows = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, targetUserId));

  const targetRoleNames = targetRoleRows.map((r) => r.roleName as RoleName);

  const impersonatorIsSuperAdmin = impersonatorRoleNames.includes('super_admin');
  const targetIsElevated =
    targetRoleNames.includes('super_admin') || targetRoleNames.includes('admin');

  if (!impersonatorIsSuperAdmin && targetIsElevated) {
    throw new Error('Cannot impersonate a user with higher or equal privileges');
  }

  if (!impersonatorRoleNames.includes('super_admin') && !impersonatorRoleNames.includes('admin')) {
    throw new Error('Impersonation requires admin or super_admin role');
  }

  const token = `imp_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = new Date(Date.now() + IMPERSONATION_TTL);

  const impersonationMeta = JSON.stringify({ impersonatorId, realUserAgent: userAgent });

  await db.insert(sessionsTable).values({
    userId: targetUserId,
    token,
    expiresAt,
    ipAddress: hashIp(ipAddress),
    userAgent: impersonationMeta,
  });

  await writeAuditEvent({
    userId: impersonatorId,
    action: 'impersonation_start',
    entityType: 'user',
    entityId: String(targetUserId),
    ipAddress,
    userAgent,
    newValues: {
      impersonatorId,
      targetUserId,
      expiresAt: expiresAt.toISOString(),
      reason: reason ?? 'not specified',
      tokenPrefix: token.slice(0, 8),
    },
  });

  logger.info({ impersonatorId, targetUserId }, 'Admin impersonation session started');

  return { token, expiresAt };
}

/**
 * End an impersonation session.
 * Deletes the impersonation token and writes an audit event.
 *
 * Authorization:
 * - Ownership is determined by reading the impersonatorId stored in the session's
 *   userAgent field (encoded at session creation as JSON). This binds the
 *   authorization check to the exact token/session, not a general audit scan.
 * - super_admin may end any impersonation session.
 * - admin may only end sessions they personally started.
 */
export async function endImpersonation(params: {
  impersonatorId: number;
  impersonationToken: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<void> {
  const { impersonatorId, impersonationToken, ipAddress, userAgent } = params;

  if (!impersonationToken.startsWith('imp_')) {
    throw new Error('Invalid impersonation token format');
  }

  const [session] = await db
    .select({
      id: sessionsTable.id,
      userId: sessionsTable.userId,
      userAgent: sessionsTable.userAgent,
    })
    .from(sessionsTable)
    .where(eq(sessionsTable.token, impersonationToken))
    .limit(1);

  if (!session) {
    throw new Error('Impersonation session not found');
  }

  let sessionImpersonatorId: number | null = null;
  try {
    if (session.userAgent) {
      const meta = JSON.parse(session.userAgent) as { impersonatorId?: number };
      sessionImpersonatorId = meta.impersonatorId ?? null;
    }
  } catch {
    // userAgent not structured JSON — legacy or non-impersonation session
  }

  const callerRoleRows = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, impersonatorId));

  const callerRoleNames = callerRoleRows.map((r) => r.roleName as RoleName);
  const callerIsSuperAdmin = callerRoleNames.includes('super_admin');

  if (!callerIsSuperAdmin) {
    if (sessionImpersonatorId !== impersonatorId) {
      throw new Error('Not authorized to end this impersonation session');
    }
  }

  await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));

  await writeAuditEvent({
    userId: impersonatorId,
    action: 'impersonation_end',
    entityType: 'user',
    entityId: String(session.userId),
    ipAddress,
    userAgent,
    newValues: {
      impersonatorId,
      targetUserId: session.userId,
    },
  });

  logger.info(
    { impersonatorId, targetUserId: session.userId },
    'Admin impersonation session ended',
  );
}

/**
 * Force-terminate all sessions for a specific user.
 * Used by admins to lock out a user immediately.
 */
export async function forceTerminateUserSessions(params: {
  adminUserId: number;
  targetUserId: number;
  ipAddress: string | null;
  userAgent: string | null;
  reason?: string;
}): Promise<{ deletedCount: number }> {
  const { adminUserId, targetUserId, ipAddress, userAgent, reason } = params;

  const sessions = await db
    .select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(eq(sessionsTable.userId, targetUserId));

  for (const s of sessions) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, s.id));
  }

  await writeAuditEvent({
    userId: adminUserId,
    action: 'admin_force_logout',
    entityType: 'user',
    entityId: String(targetUserId),
    ipAddress,
    userAgent,
    newValues: {
      adminUserId,
      targetUserId,
      deletedSessionCount: sessions.length,
      reason: reason ?? 'not specified',
    },
  });

  logger.info(
    { adminUserId, targetUserId, deletedCount: sessions.length },
    'Admin force-terminated user sessions',
  );

  return { deletedCount: sessions.length };
}
