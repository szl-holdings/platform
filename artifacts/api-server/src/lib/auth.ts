import * as client from "openid-client";
import crypto from "crypto";
import { type Request, type Response } from "express";
import { db, usersTable, sessionsTable, rolesTable, userRolesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import type { RoleName } from "@workspace/db";

export const ISSUER_URL = process.env.ISSUER_URL ?? "https://replit.com/oidc";
export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

let oidcConfig: client.Configuration | null = null;

export async function getOidcConfig(): Promise<client.Configuration> {
  if (!oidcConfig) {
    oidcConfig = await client.discovery(
      new URL(ISSUER_URL),
      process.env.REPL_ID!,
    );
  }
  return oidcConfig;
}

export function isOidcConfigured(): boolean {
  return !!process.env.REPL_ID;
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
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || (claims.username as string) || replitId;
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

export async function createOidcSession(userId: number, ipAddress: string | null, userAgent: string | null): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL);
  await db.insert(sessionsTable).values({ userId, token, expiresAt, ipAddress, userAgent });
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
  const cookieToken = req.cookies?.[SESSION_COOKIE];
  if (cookieToken) return cookieToken;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return undefined;
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function setOidcCookie(res: Response, name: string, value: string): void {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });
}

export function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}
