/**
 * Persistent tenant store for Atlassian Connect.
 *
 * Delegates storage to the SZL platform API (/api/integrations/atlassian/tenant)
 * using the ALLOY_INTERNAL_TOKEN for auth, which ensures restarts do not lose
 * tenant records or break JWT verification for existing Jira installs.
 *
 * Falls back to an in-memory cache to reduce round-trips within a single
 * process lifecycle.
 */

import { logger } from "./logger.js";
import type { AtlassianTenant } from "../routes/lifecycle.js";

const platformApiUrl = process.env["PLATFORM_API_URL"] ?? "https://api.szlholdings.com";
const internalToken = process.env["ALLOY_INTERNAL_TOKEN"];

const localCache = new Map<string, AtlassianTenant>();

function internalHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (internalToken) headers["x-internal-token"] = internalToken;
  return headers;
}

export async function saveTenant(tenant: AtlassianTenant): Promise<void> {
  localCache.set(tenant.clientKey, tenant);
  try {
    const res = await fetch(`${platformApiUrl}/api/integrations/atlassian/tenant`, {
      method: "PUT",
      headers: internalHeaders(),
      body: JSON.stringify(tenant),
    });
    if (!res.ok) {
      logger.warn({ status: res.status, clientKey: tenant.clientKey }, "tenantStore: failed to persist tenant to platform API");
    }
  } catch (err) {
    logger.warn({ err, clientKey: tenant.clientKey }, "tenantStore: error persisting tenant to platform API");
  }
}

export async function getTenant(clientKey: string): Promise<AtlassianTenant | undefined> {
  if (localCache.has(clientKey)) return localCache.get(clientKey);
  try {
    const res = await fetch(
      `${platformApiUrl}/api/integrations/atlassian/tenant/${encodeURIComponent(clientKey)}`,
      { headers: internalHeaders() },
    );
    if (res.ok) {
      const tenant = await res.json() as AtlassianTenant;
      localCache.set(clientKey, tenant);
      return tenant;
    }
    if (res.status !== 404) {
      logger.warn({ status: res.status, clientKey }, "tenantStore: unexpected status fetching tenant");
    }
  } catch (err) {
    logger.warn({ err, clientKey }, "tenantStore: error fetching tenant from platform API");
  }
  return undefined;
}

export async function deleteTenant(clientKey: string): Promise<void> {
  localCache.delete(clientKey);
  try {
    const res = await fetch(
      `${platformApiUrl}/api/integrations/atlassian/tenant/${encodeURIComponent(clientKey)}`,
      { method: "DELETE", headers: internalHeaders() },
    );
    if (!res.ok && res.status !== 404) {
      logger.warn({ status: res.status, clientKey }, "tenantStore: failed to delete tenant from platform API");
    }
  } catch (err) {
    logger.warn({ err, clientKey }, "tenantStore: error deleting tenant from platform API");
  }
}
