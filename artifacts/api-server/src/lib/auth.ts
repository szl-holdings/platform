import { hashIp } from '@szl-holdings/audit';
import type { RoleName } from '@szl-holdings/db';
import {
  azureTenantsTable,
  db,
  organizationsTable,
  orgMembersTable,
  rolesTable,
  sessionsTable,
  userRolesTable,
  usersTable,
} from '@szl-holdings/db';
import crypto from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import type { Request, Response } from 'express';
import * as client from 'openid-client';

export const ISSUER_URL = process.env.ISSUER_URL ?? 'https://replit.com/oidc';
/**
 * Session cookie name. Uses the `__Host-` prefix (FINDING-005, NCC Group
 * 2026-04 pen test): browsers refuse to set/send `__Host-` cookies unless
 * Secure, Path=/, and no Domain attribute are present, which prevents
 * subdomain cookie injection attacks.
 *
 * `LEGACY_SESSION_COOKIE` is the pre-migration name. During the rollout
 * window, request handlers fall back to reading the legacy cookie so users
 * with active sessions are not invalidated by the rename. New responses
 * always set the new name and clear the legacy one.
 */
export const SESSION_COOKIE = '__Host-sid';
export const LEGACY_SESSION_COOKIE = 'sid';
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * Read the session token from either the new `__Host-sid` cookie or the
 * legacy `sid` cookie. Prefers the new one when both are present.
 */
export function readSessionCookie(req: Request): string | undefined {
  const fresh = req.cookies?.[SESSION_COOKIE];
  if (fresh) return fresh as string;
  const legacy = req.cookies?.[LEGACY_SESSION_COOKIE];
  if (legacy) return legacy as string;
  return undefined;
}

let oidcConfig: client.Configuration | null = null;
let azureAdConfig: client.Configuration | null = null;
const multiTenantConfigs: Map<string, client.Configuration> = new Map();

export async function getOidcConfig(): Promise<client.Configuration> {
  if (!oidcConfig) {
    oidcConfig = await client.discovery(new URL(ISSUER_URL), process.env.REPL_ID!);
  }
  return oidcConfig;
}

export function isOidcConfigured(): boolean {
  return !!process.env.REPL_ID;
}

export function isAzureAdConfigured(): boolean {
  return !!(
    process.env.AZURE_AD_TENANT_ID &&
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET
  );
}

export function getAzureAdIssuerUrl(tenantId?: string): string {
  const tid = tenantId ?? process.env.AZURE_AD_TENANT_ID!;
  return `https://login.microsoftonline.com/${tid}/v2.0`;
}

export async function getAzureAdConfig(tenantId?: string): Promise<client.Configuration> {
  if (!tenantId) {
    if (!azureAdConfig) {
      azureAdConfig = await client.discovery(
        new URL(getAzureAdIssuerUrl()),
        process.env.AZURE_AD_CLIENT_ID!,
        { client_secret: process.env.AZURE_AD_CLIENT_SECRET },
      );
    }
    return azureAdConfig;
  }

  if (!multiTenantConfigs.has(tenantId)) {
    const config = await client.discovery(
      new URL(getAzureAdIssuerUrl(tenantId)),
      process.env.AZURE_AD_CLIENT_ID!,
      { client_secret: process.env.AZURE_AD_CLIENT_SECRET },
    );
    multiTenantConfigs.set(tenantId, config);
  }
  return multiTenantConfigs.get(tenantId)!;
}

export async function isProvisionedTenant(azureTenantId: string): Promise<boolean> {
  const [tenant] = await db
    .select()
    .from(azureTenantsTable)
    .where(
      and(
        eq(azureTenantsTable.azureTenantId, azureTenantId),
        eq(azureTenantsTable.status, 'active'),
        eq(azureTenantsTable.adminConsentGranted, 'granted'),
      ),
    )
    .limit(1);
  return !!tenant;
}

export async function getProvisionedTenant(azureTenantId: string) {
  try {
    const [tenant] = await db
      .select()
      .from(azureTenantsTable)
      .where(eq(azureTenantsTable.azureTenantId, azureTenantId))
      .limit(1);
    return tenant ?? null;
  } catch {
    return null;
  }
}

export async function getOrgForAzureTenant(azureTenantId: string): Promise<number | null> {
  try {
    const [tenant] = await db
      .select({ organizationId: azureTenantsTable.organizationId })
      .from(azureTenantsTable)
      .where(eq(azureTenantsTable.azureTenantId, azureTenantId))
      .limit(1);
    return tenant?.organizationId ?? null;
  } catch {
    return null;
  }
}

export async function getAzureTenantForUser(userId: number): Promise<string | null> {
  try {
    const [row] = await db
      .select({ azureTenantId: azureTenantsTable.azureTenantId })
      .from(orgMembersTable)
      .innerJoin(azureTenantsTable, eq(azureTenantsTable.organizationId, orgMembersTable.orgId))
      .where(and(eq(orgMembersTable.userId, userId), eq(azureTenantsTable.status, 'active')))
      .limit(1);
    return row?.azureTenantId ?? null;
  } catch {
    return null;
  }
}

const AZURE_AD_ROLE_MAP: Record<string, RoleName> = {
  'SZL.Admin': 'admin',
  'SZL.SuperAdmin': 'super_admin',
  'SZL.Operator': 'ops',
  'SZL.Analyst': 'analyst',
  'SZL.Viewer': 'viewer',
};

export function mapAzureAdRoles(
  groups: string[] | undefined,
  appRoles: string[] | undefined,
): RoleName[] {
  const roles: Set<RoleName> = new Set();
  const sources = [...(groups ?? []), ...(appRoles ?? [])];
  for (const r of sources) {
    const mapped = AZURE_AD_ROLE_MAP[r];
    if (mapped) roles.add(mapped);
  }
  if (roles.size === 0) roles.add('viewer' as RoleName);
  return Array.from(roles);
}

export interface OidcUserData {
  replitId: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export async function upsertUserFromOidc(claims: Record<string, unknown>): Promise<{
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  roles: RoleName[];
}> {
  const replitId = claims.sub as string;
  const email = (claims.email as string) || null;
  const firstName = (claims.first_name as string) || null;
  const lastName = (claims.last_name as string) || null;
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') || (claims.username as string) || replitId;
  const avatarUrl = ((claims.profile_image_url || claims.picture) as string) || null;

  const [user] = await db
    .insert(usersTable)
    .values({ replitId, email, displayName, avatarUrl })
    .onConflictDoUpdate({
      target: usersTable.replitId,
      set: { email, displayName, avatarUrl, updatedAt: new Date() },
    })
    .returning();

  const userRoles = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, user.id));

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    roles: userRoles.map((r) => r.roleName) as RoleName[],
  };
}

export async function upsertUserFromAzureAd(claims: Record<string, unknown>): Promise<{
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  roles: RoleName[];
  azureTenantId: string | null;
}> {
  const azureOid = claims.oid as string;
  const sub = claims.sub as string;
  const externalId = `aad:${azureOid ?? sub}`;
  const email = (claims.email as string) || (claims.preferred_username as string) || null;
  const givenName = (claims.given_name as string) || null;
  const familyName = (claims.family_name as string) || null;
  const displayName =
    [givenName, familyName].filter(Boolean).join(' ') || (claims.name as string) || externalId;
  const avatarUrl = null;
  const azureTenantId = (claims.tid as string) || null;

  const [user] = await db
    .insert(usersTable)
    .values({ replitId: externalId, email, displayName, avatarUrl })
    .onConflictDoUpdate({
      target: usersTable.replitId,
      set: { email, displayName, updatedAt: new Date() },
    })
    .returning();

  const groups = (claims.groups as string[]) ?? [];
  const appRoles = (claims.roles as string[]) ?? [];
  const mappedRoles = mapAzureAdRoles(groups, appRoles);

  const existingRoles = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, user.id));

  if (existingRoles.length === 0 && mappedRoles.length > 0) {
    for (const roleName of mappedRoles) {
      const [role] = await db
        .select()
        .from(rolesTable)
        .where(eq(rolesTable.name, roleName))
        .limit(1);
      if (role) {
        await db
          .insert(userRolesTable)
          .values({ userId: user.id, roleId: role.id })
          .onConflictDoNothing();
      }
    }
  }

  if (azureTenantId) {
    try {
      const [tenant] = await db
        .select({ organizationId: azureTenantsTable.organizationId })
        .from(azureTenantsTable)
        .where(
          and(
            eq(azureTenantsTable.azureTenantId, azureTenantId),
            eq(azureTenantsTable.status, 'active'),
          ),
        )
        .limit(1);

      if (tenant?.organizationId) {
        const [existing] = await db
          .select({ id: orgMembersTable.id })
          .from(orgMembersTable)
          .where(
            and(
              eq(orgMembersTable.orgId, tenant.organizationId),
              eq(orgMembersTable.userId, user.id),
            ),
          )
          .limit(1);

        if (!existing) {
          await db.insert(orgMembersTable).values({
            orgId: tenant.organizationId,
            userId: user.id,
            role: 'member',
          });
        }
      }
    } catch {}
  }

  const finalRoles = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, user.id));

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    roles: (finalRoles.length > 0 ? finalRoles.map((r) => r.roleName) : mappedRoles) as RoleName[],
    azureTenantId,
  };
}

export async function createOidcSession(
  userId: number,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL);
  await db
    .insert(sessionsTable)
    .values({ userId, token, expiresAt, ipAddress: hashIp(ipAddress), userAgent });
  return token;
}

export async function getSessionUser(token: string): Promise<{
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  roles: RoleName[];
} | null> {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, new Date())));

  if (!session) return null;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user || !user.isActive) return null;

  const userRoles = await db
    .select({ roleName: rolesTable.name })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, user.id));

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    roles: userRoles.map((r) => r.roleName) as RoleName[],
  };
}

export async function deleteOidcSession(token: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
}

export function getSessionToken(req: Request): string | undefined {
  const cookieToken = readSessionCookie(req);
  if (cookieToken) return cookieToken;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  return undefined;
}

export function setSessionCookie(res: Response, token: string): void {
  // The `__Host-` prefix mandates: Secure=true, Path="/", and NO Domain
  // attribute. The browser will silently reject the cookie if any of
  // those are violated, so do not change these without re-reading the
  // RFC 6265bis §4.1.3.2 rules.
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
  // Clear any pre-rename cookie so two parallel session cookies don't
  // linger in the browser. Safe to call unconditionally — clearCookie on
  // a missing cookie is a no-op in browsers.
  res.clearCookie(LEGACY_SESSION_COOKIE, { path: '/' });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.clearCookie(LEGACY_SESSION_COOKIE, { path: '/' });
}

export function setOidcCookie(res: Response, name: string, value: string): void {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60 * 1000,
  });
}

export function getSafeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
}

export function getOrigin(req: Request): string {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost';
  return `${proto}://${host}`;
}
