import type { OrgMembership as SharedOrgMembership } from '@szl-holdings/auth-shared';
import { apiKeysTable, type RoleName, db, isReadOnlyRole, oauthClientsTable, organizationsTable, orgMembersTable, ROLE_HIERARCHY, rolesTable, sessionsTable, toCanonicalRole, userRolesTable, usersTable } from '@szl-holdings/db';
import { serverTelemetry } from '@szl-holdings/observability';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { sendError, sendForbidden, sendUnauthorized } from '../lib/api-response';
import { readSessionCookie } from '../lib/auth';
import {
  type InternalAgentContext,
  type InternalScope,
  tokenHasScope,
  verifyInternalHeader,
} from '../lib/internal-tokens';
import { logger } from '../lib/logger';
import { verifyMeshToken } from '../lib/mesh-jwt';
import {
  ensureApiKeyDid,
  ensureInternalAgentDid,
  ensureOAuthClientDid,
  getPlatformServiceDid,
} from '../lib/platform-did-registry';
import { getSessionMinCreatedAt } from './session-policy';

/**
 * OrgMembership is the canonical type from @szl-holdings/auth-shared.
 * Re-exported here for backward compatibility with the many local imports
 * across this codebase. New code should import directly from auth-shared.
 *
 * @see packages/auth-shared/src/types.ts
 */
export type OrgMembership = SharedOrgMembership;

export interface AuthenticatedUser {
  id: number;
  displayName: string;
  email: string | null;
  /**
   * Platform roles — same string union as PlatformRole in @szl-holdings/auth-shared
   * but typed here as RoleName from @szl-holdings/db for drizzle-orm compatibility.
   */
  roles: RoleName[];
  orgs: OrgMembership[];
  /**
   * Platform DID bound to this principal. Populated for machine/agent identities
   * (M2M API keys, internal agents, registered agents). Absent for human sessions.
   */
  did?: string;
  /**
   * Actor kind for the identity layer. Distinguishes human users from service
   * accounts, agents, and tenant machines.
   */
  actorKind?: 'human' | 'service' | 'agent' | 'tenant_machine';
}

/**
 * MeshPrincipal — normalized identity across all auth mechanisms.
 * Populated by authMiddleware regardless of which auth path resolved.
 */
export type MeshPrincipal =
  | { type: 'session'; userId: number; orgIds: number[] }
  | { type: 'api_key'; keyId: number; orgId: number | null; scopes: string[] }
  | { type: 'oauth_client'; clientId: string; orgId: number | null; scopes: string[] }
  | { type: 'internal_agent'; name: string; scopes: string[] };

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      isInternalAgent?: boolean;
      internalAgent?: InternalAgentContext;
      meshPrincipal?: MeshPrincipal;
    }
  }
}

/**
 * Build the synthesized request user for an authenticated internal-service
 * call.
 *
 * GAP-016: BOTH legacy ALLOY_INTERNAL_TOKEN and new INTERNAL_SERVICE_TOKENS
 * entries are mapped to "ops" only — never `super_admin`. The previous
 * behavior (legacy → super_admin) created a privilege-escalation blast
 * radius if the token leaked: any holder could perform admin-only
 * operations across every domain. Now legacy callers are bounded to the
 * same scope catalog as scoped tokens, and downstream routes that need
 * fine-grained authorization must additionally gate on declared scopes
 * via `requireInternalScope(...)`. This is the hardening the first
 * external-user launch requires.
 */
function buildInternalAgentUser(ctx: InternalAgentContext, agentDid?: string): AuthenticatedUser {
  const roles: RoleName[] = ['ops'];
  return {
    id: 0,
    displayName: `Internal Agent (${ctx.name})`,
    email: null,
    roles,
    orgs: [],
    actorKind: 'service',
    // Each named internal agent gets its own distinct DID (did:plat:agent:{name}).
    // Falls back to platform service DID if per-agent mint fails (DB outage).
    did: agentDid ?? getPlatformServiceDid() ?? undefined,
  };
}

function _safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function checkInternalToken(req: Request): InternalAgentContext | null {
  const header = req.headers['x-internal-token'] as string | undefined;
  if (!header) return null;
  const match = verifyInternalHeader(header, req.originalUrl || req.url);
  if (!match) {
    // We can't tell from the registry alone whether the header value matched
    // *some* token but failed the path check vs. didn't match at all; the
    // registry helper logs neither case. Emit a single low-noise debug-level
    // notice for visibility without alerting on every probe.
    logger.debug(
      { method: req.method, path: req.path, ip: req.ip },
      '[auth] Internal token header rejected',
    );
    return null;
  }
  logger.info(
    {
      method: req.method,
      path: req.path,
      ip: req.ip,
      tokenName: match.context.name,
      legacy: match.context.legacy,
    },
    '[auth] Internal agent token accepted',
  );
  return match.context;
}

export type SessionResolution =
  | { kind: 'ok'; user: AuthenticatedUser }
  | {
      kind: 'revoked';
      reason: 'session_version_mismatch' | 'session_revoked' | 'session_pre_secret_rotation';
    }
  | { kind: 'missing' };

export async function resolveUserFromToken(token: string): Promise<SessionResolution> {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.token, token),
        gt(sessionsTable.expiresAt, new Date()),
        isNull(sessionsTable.revokedAt),
      ),
    );

  if (!session) {
    // Disambiguate: if a row exists but is revoked, surface SESSION_REVOKED
    // instead of a generic 401 so the client knows to drop the session.
    const [revoked] = await db
      .select({ id: sessionsTable.id })
      .from(sessionsTable)
      .where(eq(sessionsTable.token, token))
      .limit(1);
    if (revoked) {
      return { kind: 'revoked', reason: 'session_revoked' };
    }
    return { kind: 'missing' };
  }

  // Global SESSION_SECRET-rotation cutoff (AF-012). Any session created before
  // SESSION_MIN_CREATED_AT is treated as revoked. Operators set this env when
  // rotating SESSION_SECRET (or any other "force-logout-everyone" event) so
  // that long-lived opaque tokens issued before the rotation can no longer be
  // exchanged for an authenticated request.
  const cutoff = getSessionMinCreatedAt();
  if (cutoff && session.createdAt < cutoff) {
    return { kind: 'revoked', reason: 'session_pre_secret_rotation' };
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));

  if (!user?.isActive) return { kind: 'missing' };

  // Session-version check — bumped on role/org-membership change.
  if (typeof user.sessionVersion === 'number' && session.sessionVersion !== user.sessionVersion) {
    return { kind: 'revoked', reason: 'session_version_mismatch' };
  }

  const [userRoles, orgMemberships] = await Promise.all([
    db
      .select({ roleName: rolesTable.name })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, user.id)),
    db
      .select({
        orgId: orgMembersTable.orgId,
        orgSlug: organizationsTable.slug,
        orgName: organizationsTable.name,
        role: orgMembersTable.role,
      })
      .from(orgMembersTable)
      .innerJoin(organizationsTable, eq(orgMembersTable.orgId, organizationsTable.id))
      .where(eq(orgMembersTable.userId, user.id)),
  ]);

  return {
    kind: 'ok',
    user: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      roles: userRoles.map((r) => r.roleName) as RoleName[],
      orgs: orgMemberships.map((m) => ({
        orgId: m.orgId,
        orgSlug: m.orgSlug,
        orgName: m.orgName,
        role: m.role,
      })),
    },
  };
}

/**
 * Resolve a Bearer token against the api_keys table (SHA-256 hash lookup).
 * Returns the resolved user and key metadata on success, null on miss.
 */
async function resolveApiKeyBearer(token: string): Promise<{
  user: AuthenticatedUser;
  principal: MeshPrincipal;
} | null> {
  const keyHash = createHash('sha256').update(token).digest('hex');
  const [apiKey] = await db
    .select()
    .from(apiKeysTable)
    .where(
      and(
        eq(apiKeysTable.keyHash, keyHash),
        eq(apiKeysTable.isActive, true),
      ),
    )
    .limit(1);

  if (!apiKey) return null;

  // Check expiry
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Load the owning user
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, apiKey.userId));
  if (!user?.isActive) return null;

  const [userRoles, orgMemberships] = await Promise.all([
    db
      .select({ roleName: rolesTable.name })
      .from(userRolesTable)
      .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
      .where(eq(userRolesTable.userId, user.id)),
    db
      .select({
        orgId: orgMembersTable.orgId,
        orgSlug: organizationsTable.slug,
        orgName: organizationsTable.name,
        role: orgMembersTable.role,
      })
      .from(orgMembersTable)
      .innerJoin(organizationsTable, eq(orgMembersTable.orgId, organizationsTable.id))
      .where(eq(orgMembersTable.userId, user.id)),
  ]);

  // Per-credential DID binding (G6): each API key gets did:plat:api_key:{id}.
  // Fail closed if the DID has been revoked (independent of key active status).
  // Fall back to platform service DID only on DB outage (non-fatal degradation).
  const apiKeyDidResult = await ensureApiKeyDid(apiKey.id);
  if (apiKeyDidResult?.revoked) {
    logger.warn({ keyId: apiKey.id, did: apiKeyDidResult.did }, '[auth] API-key DID revoked — rejecting auth');
    return null;
  }
  const resolvedDid = apiKeyDidResult?.did ?? (() => {
    const fallback = getPlatformServiceDid();
    if (!fallback) logger.warn({ keyId: apiKey.id }, '[auth] API-key bearer: DID unavailable (DB outage) and no platform DID — audit row lacks M2M binding');
    return fallback ?? undefined;
  })();

  // Update last_used_at asynchronously — don't block the request
  db.update(apiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeysTable.id, apiKey.id))
    .catch((err) => logger.warn({ err, keyId: apiKey.id }, '[auth] Failed to update api key last_used_at'));

  return {
    user: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      roles: userRoles.map((r) => r.roleName) as RoleName[],
      orgs: orgMemberships.map((m) => ({
        orgId: m.orgId,
        orgSlug: m.orgSlug,
        orgName: m.orgName,
        role: m.role,
      })),
      actorKind: 'tenant_machine' as const,
      did: resolvedDid,
    },
    principal: {
      type: 'api_key',
      keyId: apiKey.id,
      orgId: apiKey.orgId ?? null,
      scopes: apiKey.scopes ?? [],
    },
  };
}

/**
 * Resolve a Bearer token as a platform-signed OAuth JWT (client_credentials).
 * Returns a synthesized service-account user and mesh principal on success.
 */
async function resolveOAuthJwtBearer(token: string): Promise<{
  user: AuthenticatedUser;
  principal: MeshPrincipal;
} | null> {
  const payload = verifyMeshToken(token);
  if (!payload) return null;

  // Verify the oauth_client row is still active
  const [oauthClient] = await db
    .select()
    .from(oauthClientsTable)
    .where(
      and(
        eq(oauthClientsTable.clientId, payload.clientId),
        eq(oauthClientsTable.isActive, true),
      ),
    )
    .limit(1);

  if (!oauthClient) return null;

  // Per-credential DID binding (G6): each OAuth clientId gets did:plat:oauth_client:{id}.
  // Fail closed if the DID has been revoked (independent of oauthClient.isActive).
  // Fall back to platform service DID only on DB outage (non-fatal degradation).
  const oauthDidResult = await ensureOAuthClientDid(payload.clientId);
  if (oauthDidResult?.revoked) {
    logger.warn({ clientId: payload.clientId, did: oauthDidResult.did }, '[auth] OAuth client DID revoked — rejecting auth');
    return null;
  }
  const resolvedDid = oauthDidResult?.did ?? (() => {
    const fallback = getPlatformServiceDid();
    if (!fallback) logger.warn({ clientId: payload.clientId }, '[auth] OAuth client_credentials: DID unavailable (DB outage) and no platform DID — audit row lacks M2M binding');
    return fallback ?? undefined;
  })();

  // OAuth machine clients carry NO roles. Access is exclusively scope-based
  // (enforced by requireMeshScope). Granting even 'ops' unconditionally would
  // let any valid client bypass role-gated routes — that is privilege escalation.
  return {
    user: {
      id: 0,
      displayName: `OAuth Client (${oauthClient.name})`,
      email: null,
      roles: [] as RoleName[],
      orgs: [],
      actorKind: 'tenant_machine' as const,
      did: resolvedDid,
    },
    principal: {
      type: 'oauth_client',
      clientId: payload.clientId,
      orgId: payload.orgId,
      scopes: payload.scopes,
    },
  };
}

export function authMiddleware(options: { required?: boolean } = {}) {
  const { required = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // The global enforcer may have already authenticated the request as an
      // internal agent (e.g. NEXUS orchestrator loopback bypass). Preserve
      // that principal instead of re-running session lookup, which would
      // otherwise overwrite req.user with undefined and reject the call.
      if (req.isInternalAgent && req.user) {
        if (!req.meshPrincipal && req.internalAgent) {
          req.meshPrincipal = {
            type: 'internal_agent',
            name: req.internalAgent.name,
            scopes: Array.from(req.internalAgent.scopes),
          };
        }
        next();
        return;
      }

      // Priority 1: x-internal-token header
      const internalCtx = checkInternalToken(req);
      if (internalCtx) {
        // G6: resolve per-agent DID (lazy-mint on first auth, revocation-checked on every call).
        // ensureInternalAgentDid returns null only if the DB is down (non-fatal).
        const agentDid = await ensureInternalAgentDid(internalCtx.name);
        if (agentDid?.revoked) {
          // The agent's DID has been explicitly revoked — fail closed.
          sendError(res, 'Agent identity has been revoked', 401, 'AGENT_IDENTITY_REVOKED');
          logger.warn(
            { agentName: internalCtx.name, did: agentDid.did },
            '[auth] Internal agent auth rejected — DID revoked',
          );
          return;
        }
        req.user = buildInternalAgentUser(internalCtx, agentDid?.did);
        req.isInternalAgent = true;
        req.internalAgent = internalCtx;
        req.meshPrincipal = {
          type: 'internal_agent',
          name: internalCtx.name,
          scopes: Array.from(internalCtx.scopes),
        };
        next();
        return;
      }

      let user: AuthenticatedUser | null = null;
      let revokedReason:
        | 'session_version_mismatch'
        | 'session_revoked'
        | 'session_pre_secret_rotation'
        | null = null;
      let resolvedPrincipal: MeshPrincipal | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const bearerToken = authHeader.slice(7);

        // Priority 2: OAuth JWT bearer (platform-signed client_credentials token)
        const oauthResult = await resolveOAuthJwtBearer(bearerToken);
        if (oauthResult) {
          req.user = oauthResult.user;
          req.meshPrincipal = oauthResult.principal;
          next();
          return;
        }

        // Priority 3: API key bearer (SHA-256 hash lookup in api_keys table)
        const apiKeyResult = await resolveApiKeyBearer(bearerToken);
        if (apiKeyResult) {
          req.user = apiKeyResult.user;
          req.meshPrincipal = apiKeyResult.principal;
          next();
          return;
        }

        // Priority 4: Session token via Authorization: Bearer header
        const resolved = await resolveUserFromToken(bearerToken);
        if (resolved.kind === 'ok') {
          user = resolved.user;
        } else if (resolved.kind === 'revoked') {
          revokedReason = resolved.reason;
        }
      } else {
        // Priority 4 (cookie path): Session cookie
        const cookieToken = readSessionCookie(req);
        if (cookieToken) {
          const resolved = await resolveUserFromToken(cookieToken);
          if (resolved.kind === 'ok') {
            user = resolved.user;
          } else if (resolved.kind === 'revoked') {
            revokedReason = resolved.reason;
          }
        }
      }

      if (user) {
        resolvedPrincipal = {
          type: 'session',
          userId: user.id,
          orgIds: user.orgs.map((o) => o.orgId),
        };
      }

      if (!user && required) {
        serverTelemetry.recordAuthFailure();
        if (revokedReason) {
          sendError(res, 'Session has been revoked. Please sign in again.', 401, 'SESSION_REVOKED');
          return;
        }
        sendUnauthorized(res);
        return;
      }

      req.user = user ?? undefined;
      if (resolvedPrincipal) {
        req.meshPrincipal = resolvedPrincipal;
      }
      next();
    } catch (err) {
      logger.error({ err }, 'Auth middleware error');
      sendError(res, 'Authentication error', 500, 'INTERNAL_ERROR');
    }
  };
}

export function requireRole(...allowedRoles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (req.user.roles.includes('super_admin') || req.user.roles.includes('admin')) {
      next();
      return;
    }

    const userGrantedRoles = new Set<RoleName>();
    for (const userRole of req.user.roles) {
      const implied = ROLE_HIERARCHY[userRole];
      if (implied) implied.forEach((r: RoleName) => userGrantedRoles.add(r));
    }

    const hasRole = allowedRoles.some((role) => userGrantedRoles.has(role));
    if (!hasRole) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
}

export function requireAnyAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    next();
  };
}

/**
 * Middleware that blocks write operations for read-only canonical roles
 * (executive_viewer, anonymous_visitor). Must be used after authMiddleware().
 *
 * Usage: router.post("/resource", authMiddleware(), denyIfReadOnly(), handler)
 */
export function denyIfReadOnly() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    if (isReadOnlyRole(req.user.roles)) {
      const canonical = toCanonicalRole(req.user.roles);
      sendForbidden(
        res,
        `Read-only access — write operations are not permitted for role: ${canonical ?? 'unknown'}`,
      );
      return;
    }
    next();
  };
}

export class InvalidIdError extends Error {
  constructor() {
    super('Invalid ID parameter');
    this.name = 'InvalidIdError';
  }
}

export function parseIdParam(raw: string | string[]): number {
  const str = Array.isArray(raw) ? raw[0] : raw;
  const id = parseInt(str, 10);
  if (Number.isNaN(id) || id < 1) throw new InvalidIdError();
  return id;
}

export function requireOrgMembership(
  orgSlug: string,
  minRole: 'owner' | 'admin' | 'member' | 'viewer' = 'viewer',
) {
  const roleHierarchy: Record<string, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (req.user.roles.includes('super_admin') || req.user.roles.includes('admin')) {
      next();
      return;
    }

    const membership = req.user.orgs.find((o) => o.orgSlug === orgSlug);
    if (!membership) {
      sendForbidden(res, 'Not a member of this organization');
      return;
    }

    if ((roleHierarchy[membership.role] ?? 0) < (roleHierarchy[minRole] ?? 0)) {
      sendForbidden(res, 'Insufficient organization role');
      return;
    }

    next();
  };
}

export function canAccessOrgRecord(
  user: AuthenticatedUser,
  recordOrgId: number | null | undefined,
): boolean {
  if (
    user.roles.includes('super_admin') ||
    user.roles.includes('admin') ||
    user.roles.includes('exec') ||
    user.roles.includes('ops')
  ) {
    return true;
  }
  if (recordOrgId == null) return false;
  return user.orgs.some((o) => o.orgId === recordOrgId);
}

export function isElevatedUser(user: AuthenticatedUser): boolean {
  const elevated = new Set(['super_admin', 'admin', 'exec', 'ops', 'compliance']);
  return user.roles.some((r) => elevated.has(r));
}

/**
 * Gate a route on a specific internal-token scope. Sessioned (human) users
 * always pass through to the next handler — combine this with `authMiddleware`
 * + role checks to constrain the human path. The scope check ONLY applies to
 * internal service callers (those authenticated via `x-internal-token`).
 */
export function requireInternalScope(required: InternalScope) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isInternalAgent) {
      next();
      return;
    }
    if (tokenHasScope(req.internalAgent, required)) {
      next();
      return;
    }
    logger.warn(
      {
        tokenName: req.internalAgent?.name,
        required,
        scopes: Array.from(req.internalAgent?.scopes ?? []),
        path: req.path,
      },
      '[auth] Internal token lacks required scope',
    );
    res.status(403).json({
      error: 'Forbidden',
      message: `Internal token missing required scope: ${required}`,
      code: 'INTERNAL_SCOPE_MISSING',
    });
  };
}

/**
 * Gate a route on a specific OAuth or API key scope.
 * For session-authenticated users, this check is bypassed (session users
 * inherit all permissions via their roles). Only machine principals
 * (oauth_client, api_key) are checked against declared scopes.
 */
export function requireMeshScope(required: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const principal = req.meshPrincipal;
    if (!principal) {
      sendUnauthorized(res);
      return;
    }
    // Session users and internal agents are not scope-constrained via this check
    if (principal.type === 'session' || principal.type === 'internal_agent') {
      next();
      return;
    }
    const scopes = principal.scopes ?? [];
    if (scopes.includes(required) || scopes.includes('*')) {
      next();
      return;
    }
    sendForbidden(res, `Missing required scope: ${required}`);
  };
}
