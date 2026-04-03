/**
 * Atlassian Connect webhook handlers.
 *
 * Jira posts signed JWT-authenticated payloads to these endpoints for each
 * subscribed event (issue created/updated/deleted, sprint started/closed, etc.).
 *
 * Each handler verifies the JWT using the tenant's stored shared secret before
 * processing the event. Unverified requests are rejected with 401.
 *
 * After verification, events are forwarded to the SZL platform via the existing
 * /api/integrations/jira/webhook route — no duplicate ingestion logic here.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { verifyRequestJWT, JWTVerificationError } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const PLATFORM_API_URL = process.env["PLATFORM_API_URL"] ?? "https://api.szlholdings.com";

async function verifyWebhookJWT(req: Request, res: Response): Promise<boolean> {
  try {
    await verifyRequestJWT(req);
    return true;
  } catch (err) {
    if (err instanceof JWTVerificationError) {
      logger.warn({ err: err.message, path: req.path }, "atlassian-connect: webhook JWT verification failed");
      res.status(401).json({ error: "Invalid or missing JWT" });
      return false;
    }
    logger.error({ err, path: req.path }, "atlassian-connect: unexpected error during JWT verification");
    res.status(500).json({ error: "Internal error during JWT verification" });
    return false;
  }
}

async function forwardToSZL(webhookEvent: string, issueKey: string | undefined, body: unknown): Promise<void> {
  try {
    await fetch(`${PLATFORM_API_URL}/api/integrations/jira/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookEvent,
        issue: { key: issueKey, fields: {} },
        source: "atlassian_connect",
        receivedAt: new Date().toISOString(),
        raw: body,
      }),
    });
  } catch (err) {
    logger.warn({ err, webhookEvent, issueKey }, "atlassian-connect: failed to forward webhook to SZL platform");
  }
}

router.post("/webhooks/issue-created", async (req: Request, res: Response) => {
  if (!await verifyWebhookJWT(req, res)) return;
  const body = req.body as Record<string, unknown>;
  const issue = body["issue"] as Record<string, unknown> | undefined;
  const issueKey = issue?.["key"] as string | undefined;
  logger.info({ issueKey }, "atlassian-connect: issue created");
  await forwardToSZL("jira:issue_created", issueKey, body);
  res.status(200).json({ received: true });
});

router.post("/webhooks/issue-updated", async (req: Request, res: Response) => {
  if (!await verifyWebhookJWT(req, res)) return;
  const body = req.body as Record<string, unknown>;
  const issue = body["issue"] as Record<string, unknown> | undefined;
  const issueKey = issue?.["key"] as string | undefined;
  const changelog = body["changelog"] as Record<string, unknown> | undefined;
  logger.info({ issueKey, changelog }, "atlassian-connect: issue updated");
  await forwardToSZL("jira:issue_updated", issueKey, body);
  res.status(200).json({ received: true });
});

router.post("/webhooks/issue-deleted", async (req: Request, res: Response) => {
  if (!await verifyWebhookJWT(req, res)) return;
  const body = req.body as Record<string, unknown>;
  const issue = body["issue"] as Record<string, unknown> | undefined;
  const issueKey = issue?.["key"] as string | undefined;
  logger.info({ issueKey }, "atlassian-connect: issue deleted");
  await forwardToSZL("jira:issue_deleted", issueKey, body);
  res.status(200).json({ received: true });
});

router.post("/webhooks/sprint-started", async (req: Request, res: Response) => {
  if (!await verifyWebhookJWT(req, res)) return;
  const body = req.body as Record<string, unknown>;
  const sprint = body["sprint"] as Record<string, unknown> | undefined;
  logger.info({ sprintId: sprint?.["id"], sprintName: sprint?.["name"] }, "atlassian-connect: sprint started");
  await forwardToSZL("sprint_started", undefined, body);
  res.status(200).json({ received: true });
});

router.post("/webhooks/sprint-closed", async (req: Request, res: Response) => {
  if (!await verifyWebhookJWT(req, res)) return;
  const body = req.body as Record<string, unknown>;
  const sprint = body["sprint"] as Record<string, unknown> | undefined;
  logger.info({ sprintId: sprint?.["id"], sprintName: sprint?.["name"] }, "atlassian-connect: sprint closed");
  await forwardToSZL("sprint_closed", undefined, body);
  res.status(200).json({ received: true });
});

router.post("/webhooks/worklog-updated", async (req: Request, res: Response) => {
  if (!await verifyWebhookJWT(req, res)) return;
  const body = req.body as Record<string, unknown>;
  logger.info({}, "atlassian-connect: worklog updated");
  await forwardToSZL("jira:worklog_updated", undefined, body);
  res.status(200).json({ received: true });
});

export default router;
