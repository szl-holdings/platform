/**
 * Atlassian Connect lifecycle handlers.
 *
 * Jira calls these endpoints when the app is installed, uninstalled,
 * enabled, or disabled in a tenant's instance. We store the shared
 * secret from the installed callback so we can verify future JWT tokens.
 *
 * The installed callback is the ONLY lifecycle endpoint that does not
 * require JWT verification (because the shared secret is being delivered
 * for the first time). All others verify the JWT.
 *
 * Tenant records are persisted to the SZL platform API (backed by Postgres)
 * so restarts do not lose tenant secrets or break JWT verification.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { verifyRequestJWT, JWTVerificationError } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import { saveTenant, getTenant as fetchTenant, deleteTenant } from "../lib/tenantStore.js";

export interface AtlassianTenant {
  key: string;
  clientKey: string;
  sharedSecret: string;
  serverVersion: string;
  pluginsVersion: string;
  baseUrl: string;
  productType: string;
  description: string;
  serviceEntitlementNumber?: string;
}

const router: IRouter = Router();

export async function getTenant(clientKey: string): Promise<AtlassianTenant | undefined> {
  return fetchTenant(clientKey);
}

router.post("/lifecycle/installed", async (req: Request, res: Response) => {
  const body = req.body as AtlassianTenant;
  if (!body.clientKey || !body.sharedSecret) {
    logger.warn({ body }, "atlassian-connect: installed callback missing clientKey or sharedSecret");
    res.status(400).json({ error: "Missing clientKey or sharedSecret" });
    return;
  }

  await saveTenant(body);
  logger.info(
    { clientKey: body.clientKey, baseUrl: body.baseUrl, productType: body.productType },
    "atlassian-connect: tenant installed and persisted",
  );

  const platformApiUrl = process.env["PLATFORM_API_URL"] ?? "https://api.szlholdings.com";
  const internalToken = process.env["ALLOY_INTERNAL_TOKEN"];
  fetch(`${platformApiUrl}/api/integrations/jira/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(internalToken ? { "x-internal-token": internalToken } : {}),
    },
    body: JSON.stringify({ clientKey: body.clientKey, source: "atlassian_install" }),
  }).catch((err: unknown) => {
    logger.warn({ err }, "atlassian-connect: failed to trigger initial sync after install");
  });

  res.status(204).send();
});

router.post("/lifecycle/uninstalled", async (req: Request, res: Response) => {
  try {
    await verifyRequestJWT(req);
  } catch (err) {
    if (err instanceof JWTVerificationError) {
      logger.warn({ err: err.message }, "atlassian-connect: uninstalled JWT verification failed");
      res.status(401).json({ error: "Invalid JWT" });
      return;
    }
  }
  const body = req.body as { clientKey?: string };
  if (body.clientKey) {
    await deleteTenant(body.clientKey);
    logger.info({ clientKey: body.clientKey }, "atlassian-connect: tenant uninstalled");
  }
  res.status(204).send();
});

router.post("/lifecycle/enabled", async (req: Request, res: Response) => {
  try {
    await verifyRequestJWT(req);
  } catch (err) {
    if (err instanceof JWTVerificationError) {
      logger.warn({ err: err.message }, "atlassian-connect: enabled JWT verification failed");
      res.status(401).json({ error: "Invalid JWT" });
      return;
    }
  }
  const body = req.body as { clientKey?: string };
  logger.info({ clientKey: body.clientKey }, "atlassian-connect: app enabled");
  res.status(204).send();
});

router.post("/lifecycle/disabled", async (req: Request, res: Response) => {
  try {
    await verifyRequestJWT(req);
  } catch (err) {
    if (err instanceof JWTVerificationError) {
      logger.warn({ err: err.message }, "atlassian-connect: disabled JWT verification failed");
      res.status(401).json({ error: "Invalid JWT" });
      return;
    }
  }
  const body = req.body as { clientKey?: string };
  logger.info({ clientKey: body.clientKey }, "atlassian-connect: app disabled");
  res.status(204).send();
});

export default router;
