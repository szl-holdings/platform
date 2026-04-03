import { Router, type IRouter, type Request, type Response } from "express";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { eq, and } from "drizzle-orm";
import { services } from "@workspace/services";
import { db, alloySignals, connectorsTable } from "@workspace/db";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendError,
  handleRouteError,
} from "../lib/api-response";
import { isFlagEnabled } from "../lib/platform-flags";
import { logger } from "../lib/logger";
import { deliverWebhookEvent } from "./webhooks";

const router: IRouter = Router();

/**
 * Checks the x-szl-webhook-secret header against the stored connector config.
 * Returns true if the secret matches, false otherwise.
 * Used to authenticate inbound callouts from the Salesforce managed package
 * without requiring a user session token.
 */
async function validateSalesforceWebhookSecret(req: Request): Promise<boolean> {
  const providedSecret = req.headers["x-szl-webhook-secret"] as string | undefined;
  if (!providedSecret) return false;
  try {
    const [connector] = await db
      .select()
      .from(connectorsTable)
      .where(and(eq(connectorsTable.type, "custom"), eq(connectorsTable.name, "Salesforce")));
    if (!connector?.config) return false;
    const config = connector.config as Record<string, unknown>;
    const storedSecret = typeof config["webhookSecret"] === "string" ? config["webhookSecret"] : null;
    if (!storedSecret) return false;
    const provided = Buffer.from(providedSecret, "utf-8");
    const stored = Buffer.from(storedSecret, "utf-8");
    if (provided.length !== stored.length) return false;
    return timingSafeEqual(provided, stored);
  } catch {
    return false;
  }
}

async function ingestSignalToDB(
  source: string,
  sourceType: "webhook" | "batch" | "manual" | "scheduled" | "demo" | "api",
  title: string,
  summary: string,
  severity: "info" | "low" | "medium" | "high" | "critical",
  domain: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(alloySignals).values({
      source,
      sourceType,
      severity,
      title,
      summary,
      domain,
      status: "raw",
      metadata,
    });
  } catch (err) {
    logger.warn({ err, source, title }, "integrations: failed to write signal to DB");
  }
}

router.get("/integrations/salesforce/status", authMiddleware(), async (_req, res) => {
  try {
    const adapter = services.salesforce;
    const health = adapter.getHealthReport();
    const status = await adapter.testConnection();
    sendSuccess(res, { health, connection: status });
  } catch (err) {
    handleRouteError(res, err, "Failed to get Salesforce status");
  }
});

router.get("/integrations/salesforce/query", authMiddleware(), requireRole("ops", "analyst", "super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const enabled = await isFlagEnabled("salesforce_sync_enabled");
    if (!enabled) {
      sendError(res, "Salesforce sync is disabled", 403);
      return;
    }

    const { object, soql, limit: limitParam, stage } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(limitParam ?? "50", 10), 200);

    const adapter = services.salesforce;

    if (soql) {
      const result = await adapter.executeSOQL(soql);
      sendSuccess(res, result);
      return;
    }

    switch (object?.toLowerCase()) {
      case "account":
      case "accounts": {
        const data = await adapter.queryAccounts(limit);
        sendSuccess(res, { object: "Account", totalSize: data.length, records: data });
        break;
      }
      case "opportunity":
      case "opportunities": {
        const data = await adapter.queryOpportunities(limit, stage);
        sendSuccess(res, { object: "Opportunity", totalSize: data.length, records: data });
        break;
      }
      case "case":
      case "cases": {
        const escalatedOnly = req.query.escalated === "true";
        const data = await adapter.queryCases(limit, escalatedOnly);
        sendSuccess(res, { object: "Case", totalSize: data.length, records: data });
        break;
      }
      case "lead":
      case "leads": {
        const data = await adapter.queryLeads(limit);
        sendSuccess(res, { object: "Lead", totalSize: data.length, records: data });
        break;
      }
      case "pipeline":
      case "pipeline_health": {
        const data = await adapter.getPipelineHealth();
        sendSuccess(res, data);
        break;
      }
      case "signals": {
        const data = await adapter.ingestSignals();
        sendSuccess(res, { totalSize: data.length, signals: data });
        break;
      }
      default:
        sendBadRequest(res, "object parameter required: account, opportunity, case, lead, pipeline_health, signals — or provide soql parameter");
    }
  } catch (err) {
    handleRouteError(res, err, "Salesforce query failed");
  }
});

router.post("/integrations/salesforce/sync", async (req, res, next) => {
  const secretValid = await validateSalesforceWebhookSecret(req);
  if (secretValid) { next(); return; }
  authMiddleware()(req, res, () => requireRole("ops", "super_admin", "admin")(req, res, next));
}, async (_req, res) => {
  try {
    const enabled = await isFlagEnabled("salesforce_sync_enabled");
    if (!enabled) {
      sendError(res, "Salesforce sync is disabled", 403);
      return;
    }
    const adapter = services.salesforce;
    const result = await adapter.sync();

    const signals = await adapter.ingestSignals();
    let signalsIngested = 0;

    for (const signal of signals) {
      await ingestSignalToDB(
        "salesforce",
        "api",
        signal.title,
        signal.description,
        signal.severity as "info" | "low" | "medium" | "high" | "critical",
        "salesforce",
        { ...signal.metadata, valueAtRisk: signal.valueAtRisk },
      );
      signalsIngested++;
    }

    await deliverWebhookEvent("workflow.completed", {
      integration: "salesforce",
      action: "sync",
      synced: result.synced,
      signalsIngested,
      timestamp: result.timestamp,
    });

    sendSuccess(res, { ...result, signalsIngested });
  } catch (err) {
    handleRouteError(res, err, "Salesforce sync failed");
  }
});

router.post("/integrations/salesforce/push/task", authMiddleware(), requireRole("ops", "super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const enabled = await isFlagEnabled("salesforce_sync_enabled");
    if (!enabled) {
      sendError(res, "Salesforce sync is disabled", 403);
      return;
    }
    const { subject, description, whatId, priority, status } = req.body as {
      subject?: string;
      description?: string;
      whatId?: string;
      priority?: "High" | "Normal" | "Low";
      status?: string;
    };
    if (!subject) {
      sendBadRequest(res, "subject is required");
      return;
    }
    const adapter = services.salesforce;
    const result = await adapter.createTask({ subject, description, whatId, priority, status });
    logger.info({ result, subject }, "integrations: Salesforce Task created");
    sendCreated(res, { ...result, type: "Task", subject });
  } catch (err) {
    handleRouteError(res, err, "Failed to create Salesforce Task");
  }
});

router.post("/integrations/salesforce/push/case", authMiddleware(), requireRole("ops", "super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const enabled = await isFlagEnabled("salesforce_sync_enabled");
    if (!enabled) {
      sendError(res, "Salesforce sync is disabled", 403);
      return;
    }
    const { subject, description, priority, origin, accountId } = req.body as {
      subject?: string;
      description?: string;
      priority?: "High" | "Medium" | "Low";
      origin?: string;
      accountId?: string;
    };
    if (!subject) {
      sendBadRequest(res, "subject is required");
      return;
    }
    const adapter = services.salesforce;
    const result = await adapter.createCase({ subject, description, priority, origin, accountId });
    logger.info({ result, subject }, "integrations: Salesforce Case created");
    sendCreated(res, { ...result, type: "Case", subject });
  } catch (err) {
    handleRouteError(res, err, "Failed to create Salesforce Case");
  }
});

router.post("/integrations/salesforce/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    logger.info({ body }, "integrations: Salesforce outbound message received");

    const secretValid = await validateSalesforceWebhookSecret(req);
    if (!secretValid) {
      logger.warn("integrations: Salesforce webhook rejected — invalid or missing x-szl-webhook-secret");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const enabled = await isFlagEnabled("salesforce_sync_enabled");
    if (!enabled) {
      res.status(200).send("<Ack/>");
      return;
    }

    const eventType = (body["eventType"] as string) ?? (body["type"] as string) ?? "salesforce.event";
    const objectType = (body["sObject"] as string) ?? (body["object"] as string) ?? "unknown";
    const recordId = (body["id"] as string) ?? (body["recordId"] as string) ?? "unknown";
    const title = (body["title"] as string) ?? `Salesforce ${objectType} event — ${recordId}`;
    const description = (body["description"] as string) ?? JSON.stringify(body).slice(0, 500);

    await ingestSignalToDB(
      "salesforce_webhook",
      "webhook",
      title,
      description,
      "info",
      "salesforce",
      { ...body, receivedAt: new Date().toISOString() },
    );

    await deliverWebhookEvent("workflow.started", {
      integration: "salesforce",
      trigger: "outbound_message",
      eventType,
      objectType,
      recordId,
      receivedAt: new Date().toISOString(),
    });

    res.status(200).send("<Ack/>");
  } catch (err) {
    logger.error({ err }, "integrations: Salesforce webhook processing error");
    res.status(200).send("<Ack/>");
  }
});

router.get("/integrations/salesforce/pipeline-health", authMiddleware(), async (_req, res) => {
  try {
    const adapter = services.salesforce;
    const health = await adapter.getPipelineHealth();
    sendSuccess(res, health);
  } catch (err) {
    handleRouteError(res, err, "Failed to get Salesforce pipeline health");
  }
});

router.get("/integrations/jira/status", authMiddleware(), async (_req, res) => {
  try {
    const adapter = services.jira;
    const health = adapter.getHealthReport();
    const status = await adapter.testConnection();
    sendSuccess(res, { health, connection: status });
  } catch (err) {
    handleRouteError(res, err, "Failed to get Jira status");
  }
});

router.get("/integrations/jira/query", authMiddleware(), requireRole("ops", "analyst", "super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const enabled = await isFlagEnabled("jira_sync_enabled");
    if (!enabled) {
      sendError(res, "Jira sync is disabled", 403);
      return;
    }

    const { type, jql, limit: limitParam, boardId } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(limitParam ?? "50", 10), 200);
    const adapter = services.jira;

    switch (type?.toLowerCase()) {
      case "projects": {
        const data = await adapter.listProjects(limit);
        sendSuccess(res, { type: "projects", totalSize: data.length, records: data });
        break;
      }
      case "issues": {
        const resolvedJql = jql ?? "project in (LYTE, VESSEL, ALLOY, OPS) AND statusCategory != Done ORDER BY updated DESC";
        const data = await adapter.searchIssues(resolvedJql, limit);
        sendSuccess(res, { type: "issues", jql: resolvedJql, totalSize: data.length, records: data });
        break;
      }
      case "sprints": {
        const data = await adapter.getActiveSprints(boardId ? parseInt(boardId, 10) : undefined);
        sendSuccess(res, { type: "sprints", totalSize: data.length, records: data });
        break;
      }
      case "sprint_health": {
        const data = await adapter.getSprintHealth();
        sendSuccess(res, { type: "sprint_health", totalSize: data.length, records: data });
        break;
      }
      case "signals": {
        const data = await adapter.ingestSignals();
        sendSuccess(res, { type: "signals", totalSize: data.length, signals: data });
        break;
      }
      default:
        sendBadRequest(res, "type parameter required: projects, issues, sprints, sprint_health, signals — or provide jql parameter for issue search");
    }
  } catch (err) {
    handleRouteError(res, err, "Jira query failed");
  }
});

router.post("/integrations/jira/sync", authMiddleware(), requireRole("ops", "super_admin", "admin"), async (_req, res) => {
  try {
    const enabled = await isFlagEnabled("jira_sync_enabled");
    if (!enabled) {
      sendError(res, "Jira sync is disabled", 403);
      return;
    }
    const adapter = services.jira;
    const result = await adapter.sync();

    const signals = await adapter.ingestSignals();
    let signalsIngested = 0;

    for (const signal of signals) {
      await ingestSignalToDB(
        "jira",
        "api",
        signal.title,
        signal.description,
        signal.severity as "info" | "low" | "medium" | "high" | "critical",
        "jira",
        { ...signal.metadata, projectKey: signal.projectKey, sprintName: signal.sprintName, issueKeys: signal.issueKeys },
      );
      signalsIngested++;
    }

    await deliverWebhookEvent("workflow.completed", {
      integration: "jira",
      action: "sync",
      projects: result.projects,
      issues: result.issues,
      signalsIngested,
      timestamp: result.timestamp,
    });

    sendSuccess(res, { ...result, signalsIngested });
  } catch (err) {
    handleRouteError(res, err, "Jira sync failed");
  }
});

router.post("/integrations/jira/push/issue", authMiddleware(), requireRole("ops", "super_admin", "admin"), async (req: Request, res: Response) => {
  try {
    const enabled = await isFlagEnabled("jira_sync_enabled");
    if (!enabled) {
      sendError(res, "Jira sync is disabled", 403);
      return;
    }
    const { projectKey, summary, description, issueType, priority, labels, source } = req.body as {
      projectKey?: string;
      summary?: string;
      description?: string;
      issueType?: string;
      priority?: "Highest" | "High" | "Medium" | "Low" | "Lowest";
      labels?: string[];
      source?: string;
    };
    if (!projectKey || !summary) {
      sendBadRequest(res, "projectKey and summary are required");
      return;
    }
    const resolvedLabels = [...(labels ?? [])];
    if (source && !resolvedLabels.includes(source)) resolvedLabels.push(source);
    const adapter = services.jira;
    const result = await adapter.createIssue({ projectKey, summary, description, issueType, priority, labels: resolvedLabels });
    logger.info({ result, projectKey, summary, source }, "integrations: Jira issue created");
    sendCreated(res, { ...result, projectKey, summary, source: source ?? "szl-platform" });
  } catch (err) {
    handleRouteError(res, err, "Failed to create Jira issue");
  }
});

router.post("/integrations/jira/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    logger.info({ webhookEvent: body["webhookEvent"], issueKey: (body["issue"] as Record<string, unknown>)?.["key"] }, "integrations: Jira webhook received");

    const flagEnabled = await isFlagEnabled("jira_webhook_enabled");
    if (!flagEnabled) {
      res.status(200).json({ received: true, processed: false, reason: "jira_webhook_enabled flag is off" });
      return;
    }

    const adapter = services.jira;
    const event = await adapter.handleWebhookEvent(body);

    const webhookEvent = (body["webhookEvent"] as string) ?? "jira_event";
    const issue = body["issue"] as Record<string, unknown> | undefined;
    const issueKey = (issue?.["key"] as string) ?? "unknown";
    const issueSummary = ((issue?.["fields"] as Record<string, unknown>)?.["summary"] as string) ?? "Jira event";
    const issueStatus = (((issue?.["fields"] as Record<string, unknown>)?.["status"] as Record<string, unknown>)?.["name"] as string) ?? "unknown";

    const syncEnabled = await isFlagEnabled("jira_sync_enabled");
    if (syncEnabled) {
      await ingestSignalToDB(
        "jira_webhook",
        "webhook",
        `Jira ${webhookEvent}: ${issueKey}`,
        issueSummary,
        "info",
        "jira",
        {
          webhookEvent,
          issueKey,
          issueStatus,
          changelog: body["changelog"],
          receivedAt: event.timestamp,
        },
      );
    }

    await deliverWebhookEvent("workflow.started", {
      integration: "jira",
      trigger: "webhook",
      webhookEvent,
      issueKey,
      issueStatus,
      receivedAt: event.timestamp,
    });

    res.status(200).json({ received: true, processed: true, event: event.id });
  } catch (err) {
    logger.error({ err }, "integrations: Jira webhook processing error");
    res.status(200).json({ received: true, processed: false, error: (err as Error).message });
  }
});

router.get("/integrations/health", authMiddleware(), async (_req, res) => {
  try {
    const [sfHealth, jiraHealth] = await Promise.all([
      services.salesforce.runHealthCheck(),
      services.jira.runHealthCheck(),
    ]);
    const [sfFlags, jiraFlags] = await Promise.all([
      Promise.all([
        isFlagEnabled("salesforce_sync_enabled"),
        isFlagEnabled("salesforce_streaming_enabled"),
      ]),
      Promise.all([
        isFlagEnabled("jira_sync_enabled"),
        isFlagEnabled("jira_webhook_enabled"),
      ]),
    ]);

    sendSuccess(res, {
      salesforce: {
        health: sfHealth,
        flags: {
          salesforce_sync_enabled: sfFlags[0],
          salesforce_streaming_enabled: sfFlags[1],
        },
      },
      jira: {
        health: jiraHealth,
        flags: {
          jira_sync_enabled: jiraFlags[0],
          jira_webhook_enabled: jiraFlags[1],
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get integration health");
  }
});

router.post("/integrations/salesforce/ingest-signals", authMiddleware(), requireRole("ops", "super_admin", "admin"), async (_req, res) => {
  try {
    const enabled = await isFlagEnabled("salesforce_sync_enabled");
    if (!enabled) {
      sendError(res, "Salesforce sync is disabled", 403);
      return;
    }
    const signals = await services.salesforce.ingestSignals();
    let ingested = 0;
    for (const signal of signals) {
      await ingestSignalToDB(
        "salesforce",
        "api",
        signal.title,
        signal.description,
        signal.severity as "info" | "low" | "medium" | "high" | "critical",
        "salesforce",
        { ...signal.metadata, valueAtRisk: signal.valueAtRisk },
      );
      ingested++;
    }
    sendCreated(res, { ingested, signals, timestamp: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Salesforce signal ingestion failed");
  }
});

router.post("/integrations/jira/ingest-signals", authMiddleware(), requireRole("ops", "super_admin", "admin"), async (_req, res) => {
  try {
    const enabled = await isFlagEnabled("jira_sync_enabled");
    if (!enabled) {
      sendError(res, "Jira sync is disabled", 403);
      return;
    }
    const signals = await services.jira.ingestSignals();
    let ingested = 0;
    for (const signal of signals) {
      await ingestSignalToDB(
        "jira",
        "api",
        signal.title,
        signal.description,
        signal.severity as "info" | "low" | "medium" | "high" | "critical",
        "jira",
        { ...signal.metadata, projectKey: signal.projectKey },
      );
      ingested++;
    }
    sendCreated(res, { ingested, signals, timestamp: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Jira signal ingestion failed");
  }
});

const OAUTH_STATE_SECRET = process.env["OAUTH_STATE_SECRET"];
if (!OAUTH_STATE_SECRET) {
  logger.warn("integrations: OAUTH_STATE_SECRET env var not set — OAuth state validation will reject all callbacks. Set this to a random secret in production.");
}
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const PLATFORM_UI_URL = process.env["PLATFORM_UI_URL"] ?? "https://szlholdings.com";
const PLATFORM_API_URL = process.env["PLATFORM_API_URL"] ?? "https://api.szlholdings.com";
const SF_LOGIN_URL = "https://login.salesforce.com";
const ATLASSIAN_AUTH_URL = "https://auth.atlassian.com";

function generateOAuthState(provider: "salesforce" | "jira"): string {
  if (!OAUTH_STATE_SECRET) throw new Error("OAUTH_STATE_SECRET env var is required to initiate OAuth flows");
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Date.now();
  const payload = `${provider}:${nonce}:${issuedAt}`;
  const sig = createHmac("sha256", OAUTH_STATE_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function validateOAuthState(state: string | undefined, expectedProvider: "salesforce" | "jira"): boolean {
  if (!state || !OAUTH_STATE_SECRET) return false;
  try {
    const raw = Buffer.from(state, "base64url").toString("utf-8");
    const parts = raw.split(":");
    if (parts.length !== 4) return false;
    const [provider, nonce, issuedAtStr, sig] = parts as [string, string, string, string];
    if (provider !== expectedProvider) return false;
    const issuedAt = parseInt(issuedAtStr, 10);
    if (isNaN(issuedAt) || Date.now() - issuedAt > OAUTH_STATE_TTL_MS) return false;
    const expectedSig = createHmac("sha256", OAUTH_STATE_SECRET)
      .update(`${provider}:${nonce}:${issuedAtStr}`)
      .digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

router.get("/integrations/salesforce/oauth/authorize", (_req: Request, res: Response) => {
  try {
    const clientId = process.env["SALESFORCE_CLIENT_ID"] ?? "";
    const redirectUri = `${PLATFORM_API_URL}/api/integrations/salesforce/oauth/callback`;
    const state = generateOAuthState("salesforce");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "api refresh_token offline_access",
      state,
      prompt: "consent",
    });

    res.redirect(`${SF_LOGIN_URL}/services/oauth2/authorize?${params.toString()}`);
  } catch (err) {
    handleRouteError(res, err, "Failed to initiate Salesforce OAuth flow");
  }
});

router.get("/integrations/salesforce/oauth/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query as Record<string, string>;

    if (error) {
      logger.warn({ error, error_description }, "integrations: Salesforce OAuth callback — authorization denied");
      res.redirect(`${PLATFORM_UI_URL}/integrations/salesforce?error=${encodeURIComponent(error_description ?? error)}`);
      return;
    }

    if (!validateOAuthState(state, "salesforce")) {
      logger.warn({ statePresent: !!state }, "integrations: Salesforce OAuth callback — invalid or expired state");
      res.redirect(`${PLATFORM_UI_URL}/integrations/salesforce?error=invalid_state`);
      return;
    }

    if (!code) {
      sendBadRequest(res, "Missing authorization code in Salesforce OAuth callback");
      return;
    }

    logger.info({ codePresent: true }, "integrations: Salesforce OAuth callback received — exchange pending");

    const redirectUri = `${PLATFORM_API_URL}/api/integrations/salesforce/oauth/callback`;
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env["SALESFORCE_CLIENT_ID"] ?? "",
      client_secret: process.env["SALESFORCE_CLIENT_SECRET"] ?? "",
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(`${SF_LOGIN_URL}/services/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => "");
      logger.error({ status: tokenRes.status, body }, "integrations: Salesforce token exchange failed");
      res.redirect(`${PLATFORM_UI_URL}/integrations/salesforce?error=token_exchange_failed`);
      return;
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      instance_url: string;
      id: string;
    };

    logger.info(
      { instanceUrl: tokenData.instance_url },
      "integrations: Salesforce OAuth token exchange successful — persisting connector",
    );

    const [existing] = await db
      .select()
      .from(connectorsTable)
      .where(and(eq(connectorsTable.type, "custom"), eq(connectorsTable.name, "Salesforce")));

    const existingConfig = existing?.config as Record<string, unknown> | null | undefined;
    const webhookSecret = (typeof existingConfig?.["webhookSecret"] === "string" && existingConfig["webhookSecret"])
      ? existingConfig["webhookSecret"]
      : randomBytes(32).toString("hex");

    const connectorConfig = {
      provider: "salesforce",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      instanceUrl: tokenData.instance_url,
      salesforceId: tokenData.id,
      webhookSecret,
      connectedAt: new Date().toISOString(),
    };

    if (existing) {
      await db
        .update(connectorsTable)
        .set({ config: connectorConfig, status: "active", updatedAt: new Date() })
        .where(eq(connectorsTable.id, existing.id));
    } else {
      await db.insert(connectorsTable).values({
        name: "Salesforce",
        type: "custom",
        status: "active",
        config: connectorConfig,
        isEnabled: true,
      });
    }

    res.redirect(
      `${PLATFORM_UI_URL}/integrations/salesforce?connected=true&instance=${encodeURIComponent(tokenData.instance_url)}`,
    );
  } catch (err) {
    handleRouteError(res, err, "Salesforce OAuth callback failed");
  }
});

router.get("/integrations/jira/oauth/authorize", (_req: Request, res: Response) => {
  try {
    const clientId = process.env["JIRA_CLIENT_ID"] ?? "";
    const redirectUri = `${PLATFORM_API_URL}/api/integrations/jira/oauth/callback`;
    const state = generateOAuthState("jira");

    const params = new URLSearchParams({
      audience: "api.atlassian.com",
      client_id: clientId,
      scope: "read:jira-work write:jira-work read:jira-user offline_access",
      redirect_uri: redirectUri,
      state,
      response_type: "code",
      prompt: "consent",
    });

    res.redirect(`${ATLASSIAN_AUTH_URL}/authorize?${params.toString()}`);
  } catch (err) {
    handleRouteError(res, err, "Failed to initiate Jira OAuth flow");
  }
});

router.get("/integrations/jira/oauth/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query as Record<string, string>;

    if (error) {
      logger.warn({ error, error_description }, "integrations: Jira OAuth callback — authorization denied");
      res.redirect(`${PLATFORM_UI_URL}/integrations/jira?error=${encodeURIComponent(error_description ?? error)}`);
      return;
    }

    if (!validateOAuthState(state, "jira")) {
      logger.warn({ statePresent: !!state }, "integrations: Jira OAuth callback — invalid or expired state");
      res.redirect(`${PLATFORM_UI_URL}/integrations/jira?error=invalid_state`);
      return;
    }

    if (!code) {
      sendBadRequest(res, "Missing authorization code in Jira OAuth callback");
      return;
    }

    logger.info({ codePresent: true }, "integrations: Jira OAuth callback received — exchange pending");

    const tokenRes = await fetch(`${ATLASSIAN_AUTH_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env["JIRA_CLIENT_ID"] ?? "",
        client_secret: process.env["JIRA_CLIENT_SECRET"] ?? "",
        code,
        redirect_uri: `${PLATFORM_API_URL}/api/integrations/jira/oauth/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => "");
      logger.error({ status: tokenRes.status, body }, "integrations: Jira token exchange failed");
      res.redirect(`${PLATFORM_UI_URL}/integrations/jira?error=token_exchange_failed`);
      return;
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
    };

    logger.info({ expiresIn: tokenData.expires_in }, "integrations: Jira OAuth token exchange successful — persisting connector");

    const connectorConfig = {
      provider: "jira",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scope: tokenData.scope ?? null,
      connectedAt: new Date().toISOString(),
    };

    const [existing] = await db
      .select()
      .from(connectorsTable)
      .where(and(eq(connectorsTable.type, "custom"), eq(connectorsTable.name, "Jira")));

    if (existing) {
      await db
        .update(connectorsTable)
        .set({ config: connectorConfig, status: "active", updatedAt: new Date() })
        .where(eq(connectorsTable.id, existing.id));
    } else {
      await db.insert(connectorsTable).values({
        name: "Jira",
        type: "custom",
        status: "active",
        config: connectorConfig,
        isEnabled: true,
      });
    }

    res.redirect(`${PLATFORM_UI_URL}/integrations/jira?connected=true`);
  } catch (err) {
    handleRouteError(res, err, "Jira OAuth callback failed");
  }
});

router.get("/integrations/atlassian/descriptor", (_req: Request, res: Response) => {
  const baseUrl = process.env["CONNECT_BASE_URL"] ?? `${PLATFORM_API_URL}/api/atlassian`;
  res.redirect(`${baseUrl}/atlassian-connect.json`);
});

router.put("/integrations/atlassian/tenant", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const tenant = req.body as {
      clientKey?: string;
      sharedSecret?: string;
      baseUrl?: string;
      productType?: string;
      key?: string;
      serverVersion?: string;
      pluginsVersion?: string;
      description?: string;
      serviceEntitlementNumber?: string;
    };
    if (!tenant.clientKey || !tenant.sharedSecret) {
      sendBadRequest(res, "clientKey and sharedSecret are required");
      return;
    }

    const config = {
      provider: "atlassian_connect",
      clientKey: tenant.clientKey,
      sharedSecret: tenant.sharedSecret,
      baseUrl: tenant.baseUrl ?? null,
      productType: tenant.productType ?? null,
      key: tenant.key ?? null,
      serverVersion: tenant.serverVersion ?? null,
      pluginsVersion: tenant.pluginsVersion ?? null,
      description: tenant.description ?? null,
      serviceEntitlementNumber: tenant.serviceEntitlementNumber ?? null,
      installedAt: new Date().toISOString(),
    };

    const [existing] = await db
      .select()
      .from(connectorsTable)
      .where(and(eq(connectorsTable.type, "custom"), eq(connectorsTable.name, `atlassian:${tenant.clientKey}`)));

    if (existing) {
      await db
        .update(connectorsTable)
        .set({ config, status: "active", updatedAt: new Date() })
        .where(eq(connectorsTable.id, existing.id));
    } else {
      await db.insert(connectorsTable).values({
        name: `atlassian:${tenant.clientKey}`,
        type: "custom",
        status: "active",
        config,
        isEnabled: true,
      });
    }

    sendSuccess(res, { persisted: true, clientKey: tenant.clientKey });
  } catch (err) {
    handleRouteError(res, err, "Failed to persist Atlassian tenant");
  }
});

router.get("/integrations/atlassian/tenant/:clientKey", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { clientKey } = req.params;
    const [connector] = await db
      .select()
      .from(connectorsTable)
      .where(and(eq(connectorsTable.type, "custom"), eq(connectorsTable.name, `atlassian:${clientKey}`)));

    if (!connector?.config) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    sendSuccess(res, connector.config);
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve Atlassian tenant");
  }
});

router.delete("/integrations/atlassian/tenant/:clientKey", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { clientKey } = req.params;
    await db
      .delete(connectorsTable)
      .where(and(eq(connectorsTable.type, "custom"), eq(connectorsTable.name, `atlassian:${clientKey}`)));

    sendSuccess(res, { deleted: true, clientKey });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete Atlassian tenant");
  }
});

export default router;
