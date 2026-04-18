import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";
import { services, type NormalizedSiemEvent } from "@szl-holdings/services";
import { logger } from "../lib/logger";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router: IRouter = Router();

type RequestWithRawBody = Request & { rawBody?: Buffer };

function extractRawBody(req: Request): string {
  const raw = (req as RequestWithRawBody).rawBody;
  if (raw) return raw.toString("utf-8");
  if (typeof req.body === "string") return req.body;
  return JSON.stringify(req.body);
}

interface IntegrationStatus {
  adapter: string;
  description: string;
  mode: "live" | "demo" | "unconfigured";
  status: "healthy" | "degraded" | "unconfigured";
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  errorCount: number;
  consecutiveFailures: number;
  dataFreshness: "fresh" | "stale" | "unknown";
  requiredEnvVars: string[];
  presentEnvVars: string[];
  missingEnvVars: string[];
}

const lastSyncTimes = new Map<string, string>();
const lastErrorTimes = new Map<string, string>();

function verifySiemToken(req: Request, res: Response, next: NextFunction): void {
  const siemToken = process.env["SIEM_INGEST_TOKEN"];
  if (!siemToken) {
    next();
    return;
  }
  const authHeader = req.headers.authorization ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!bearer || bearer !== siemToken) {
    res.status(401).json({ error: "SIEM ingest token required — set Authorization: Bearer <SIEM_INGEST_TOKEN>" });
    return;
  }
  next();
}

function buildIntegrationStatus(adapterName: string): IntegrationStatus {
  const adapter = services.getAdapter(adapterName);
  if (!adapter) {
    return {
      adapter: adapterName,
      description: "Unknown adapter",
      mode: "unconfigured",
      status: "unconfigured",
      connectedAt: null,
      lastSyncAt: null,
      lastErrorAt: null,
      lastError: null,
      errorCount: 0,
      consecutiveFailures: 0,
      dataFreshness: "unknown",
      requiredEnvVars: [],
      presentEnvVars: [],
      missingEnvVars: [],
    };
  }

  const report = adapter.getHealthReport();
  const lastSyncAt = lastSyncTimes.get(adapterName) ?? report.lastSuccessfulCheck ?? null;
  const lastErrorAt = lastErrorTimes.get(adapterName) ?? null;

  let mode: IntegrationStatus["mode"];
  if (report.status === "LIVE_CONFIGURED") mode = "live";
  else if (report.status === "MOCKED_DEMO_MODE") mode = "demo";
  else mode = "unconfigured";

  let status: IntegrationStatus["status"];
  if (report.status === "MANUAL_REQUIRED") {
    status = "unconfigured";
  } else if (report.consecutiveFailures >= 2) {
    status = "degraded";
  } else {
    status = "healthy";
  }

  let dataFreshness: IntegrationStatus["dataFreshness"] = "unknown";
  if (lastSyncAt) {
    const ageMs = Date.now() - new Date(lastSyncAt).getTime();
    dataFreshness = ageMs < 5 * 60 * 1000 ? "fresh" : ageMs < 60 * 60 * 1000 ? "stale" : "stale";
  }

  return {
    adapter: adapterName,
    description: report.description,
    mode,
    status,
    connectedAt: report.lastSuccessfulCheck,
    lastSyncAt,
    lastErrorAt,
    lastError: report.lastError,
    errorCount: report.errorCount,
    consecutiveFailures: report.consecutiveFailures,
    dataFreshness,
    requiredEnvVars: report.requiredEnvVars,
    presentEnvVars: report.presentEnvVars,
    missingEnvVars: report.missingEnvVars,
  };
}

const TRACKED_INTEGRATIONS = ["jira", "pagerduty", "siem", "slack", "salesforce"];

router.get("/integrations/status", async (_req: Request, res: Response) => {
  try {
    const statuses = TRACKED_INTEGRATIONS.map((name) => buildIntegrationStatus(name));

    const summary = {
      total: statuses.length,
      live: statuses.filter((s) => s.mode === "live").length,
      demo: statuses.filter((s) => s.mode === "demo").length,
      unconfigured: statuses.filter((s) => s.mode === "unconfigured").length,
      healthy: statuses.filter((s) => s.status === "healthy").length,
      degraded: statuses.filter((s) => s.status === "degraded").length,
    };

    const overallHealth =
      summary.degraded > 0 ? "degraded" :
      summary.live > 0 ? "operational" :
      "demo_mode";

    sendSuccess(res, {
      overallHealth,
      checkedAt: new Date().toISOString(),
      summary,
      integrations: statuses,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve integration status");
  }
});

router.get("/integrations/status/:adapter", async (req: Request, res: Response) => {
  try {
    const adapter = req.params.adapter as string;
    if (!TRACKED_INTEGRATIONS.includes(adapter)) {
      sendError(res, `Unknown integration: ${adapter}. Available: ${TRACKED_INTEGRATIONS.join(", ")}`, 404);
      return;
    }
    const status = buildIntegrationStatus(adapter);
    sendSuccess(res, status);
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve adapter status");
  }
});

router.post("/integrations/status/refresh", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const results: Array<{ adapter: string; success: boolean; responseTimeMs: number; error?: string }> = [];

    for (const name of TRACKED_INTEGRATIONS) {
      const adapter = services.getAdapter(name);
      if (!adapter) continue;
      const result = await adapter.runHealthCheck();
      if (result.success) {
        lastSyncTimes.set(name, result.testedAt);
      } else {
        lastErrorTimes.set(name, result.testedAt);
      }
      results.push({
        adapter: name,
        success: result.success,
        responseTimeMs: result.responseTimeMs,
        error: result.error ?? undefined,
      });
    }

    sendSuccess(res, {
      refreshedAt: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to refresh integration status");
  }
});


router.post("/webhooks/inbound/jira", async (req: Request, res: Response) => {
  try {
    const rawBody = extractRawBody(req);

    const signature = (req.headers["x-hub-signature-256"] as string | undefined)
      ?? (req.headers["x-hub-signature"] as string | undefined)
      ?? "";

    const webhookSecret = process.env["JIRA_WEBHOOK_SECRET"];
    if (webhookSecret && !signature) {
      res.status(401).json({ error: "Webhook signature required: X-Hub-Signature-256 header missing" });
      return;
    }

    const payload = req.body as Record<string, unknown>;

    const event = await services.jira.handleWebhookEvent(payload, rawBody, signature || undefined);
    lastSyncTimes.set("jira", new Date().toISOString());

    logger.info({ eventType: event.webhookEvent, source: "jira" }, "Jira webhook received");

    res.status(200).json({
      received: true,
      eventId: event.id,
      eventType: event.webhookEvent,
      timestamp: event.timestamp,
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes("signature invalid")) {
      logger.warn({ err }, "Jira webhook signature validation failed");
      res.status(401).json({ error: "Webhook signature validation failed", detail: message });
      return;
    }
    logger.error({ err }, "Jira webhook processing error");
    handleRouteError(res, err, "Failed to process Jira webhook");
  }
});

router.post("/webhooks/inbound/pagerduty", async (req: Request, res: Response) => {
  try {
    const rawBody = extractRawBody(req);

    const signature = (req.headers["x-pagerduty-signature"] as string | undefined) ?? "";

    const webhookSecret = process.env["PAGERDUTY_WEBHOOK_SECRET"];
    if (webhookSecret && !signature) {
      res.status(401).json({ error: "Webhook signature required: X-PagerDuty-Signature header missing" });
      return;
    }

    const payload = req.body as Record<string, unknown>;

    const event = await services.pagerduty.handleWebhookEvent(payload, rawBody, signature || undefined);
    lastSyncTimes.set("pagerduty", new Date().toISOString());

    if (event) {
      logger.info({ eventType: event.eventType, incidentId: event.incident.id, source: "pagerduty" }, "PagerDuty webhook received");
      res.status(200).json({
        received: true,
        eventId: event.id,
        eventType: event.eventType,
        incidentId: event.incident.id,
        incidentStatus: event.incident.status,
      });
    } else {
      res.status(200).json({ received: true, note: "No processable event in payload" });
    }
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes("signature invalid")) {
      logger.warn({ err }, "PagerDuty webhook signature validation failed");
      res.status(401).json({ error: "Webhook signature validation failed", detail: message });
      return;
    }
    logger.error({ err }, "PagerDuty webhook processing error");
    handleRouteError(res, err, "Failed to process PagerDuty webhook");
  }
});

router.post("/webhooks/inbound/slack/events", async (req: Request, res: Response) => {
  try {
    const rawBody = extractRawBody(req);

    const signature = (req.headers["x-slack-signature"] as string | undefined) ?? "";
    const timestamp = (req.headers["x-slack-request-timestamp"] as string | undefined) ?? "";

    const signingSecret = process.env["SLACK_SIGNING_SECRET"];
    if (signingSecret && (!signature || !timestamp)) {
      res.status(401).json({ error: "Slack signature headers required: X-Slack-Signature and X-Slack-Request-Timestamp" });
      return;
    }
    if (signature && timestamp) {
      const valid = await services.slack.verifyWebhookSignature(rawBody, signature, timestamp);
      if (!valid) {
        logger.warn("Slack webhook signature validation failed");
        res.status(401).json({ error: "Webhook signature validation failed" });
        return;
      }
    }

    const payload = req.body as Record<string, unknown>;

    if (payload["type"] === "url_verification") {
      res.status(200).json({ challenge: payload["challenge"] });
      return;
    }

    lastSyncTimes.set("slack", new Date().toISOString());
    logger.info({ eventType: payload["type"], source: "slack" }, "Slack event received");

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err }, "Slack event webhook processing error");
    handleRouteError(res, err, "Failed to process Slack event");
  }
});

router.post("/webhooks/inbound/slack/interactions", async (req: Request, res: Response) => {
  try {
    const rawBody = extractRawBody(req);

    const signature = (req.headers["x-slack-signature"] as string | undefined) ?? "";
    const timestamp = (req.headers["x-slack-request-timestamp"] as string | undefined) ?? "";

    const signingSecret = process.env["SLACK_SIGNING_SECRET"];
    if (signingSecret && (!signature || !timestamp)) {
      res.status(401).json({ error: "Slack signature headers required: X-Slack-Signature and X-Slack-Request-Timestamp" });
      return;
    }
    if (signature && timestamp) {
      const valid = await services.slack.verifyWebhookSignature(rawBody, signature, timestamp);
      if (!valid) {
        res.status(401).json({ error: "Webhook signature validation failed" });
        return;
      }
    }

    const bodyPayload = req.body as Record<string, unknown>;
    const payloadStr = bodyPayload["payload"] as string | undefined;
    const interactionPayload = payloadStr
      ? (JSON.parse(payloadStr) as import("@szl-holdings/services").SlackInteractiveMessagePayload)
      : (bodyPayload as unknown as import("@szl-holdings/services").SlackInteractiveMessagePayload);

    const result = await services.slack.handleInteractiveAction(interactionPayload);
    lastSyncTimes.set("slack", new Date().toISOString());

    res.status(200).json(result ?? { ok: true });
  } catch (err) {
    logger.error({ err }, "Slack interaction webhook processing error");
    handleRouteError(res, err, "Failed to process Slack interaction");
  }
});

router.post("/webhooks/inbound/slack/commands", async (req: Request, res: Response) => {
  try {
    const rawBody = (req as RequestWithRawBody).rawBody?.toString("utf-8")
      ?? (typeof req.body === "string" ? req.body : new URLSearchParams(req.body as Record<string, string>).toString());

    const signature = (req.headers["x-slack-signature"] as string | undefined) ?? "";
    const timestamp = (req.headers["x-slack-request-timestamp"] as string | undefined) ?? "";

    const signingSecret = process.env["SLACK_SIGNING_SECRET"];
    if (signingSecret && (!signature || !timestamp)) {
      res.status(401).json({ error: "Slack signature headers required: X-Slack-Signature and X-Slack-Request-Timestamp" });
      return;
    }
    if (signature && timestamp) {
      const valid = await services.slack.verifyWebhookSignature(rawBody, signature, timestamp);
      if (!valid) {
        res.status(401).json({ error: "Webhook signature validation failed" });
        return;
      }
    }

    const commandPayload = req.body as import("@szl-holdings/services").SlackSlashCommandPayload;
    const response = await services.slack.handleSlashCommand(commandPayload);

    lastSyncTimes.set("slack", new Date().toISOString());
    res.status(200).json(response);
  } catch (err) {
    logger.error({ err }, "Slack slash command processing error");
    handleRouteError(res, err, "Failed to process Slack slash command");
  }
});

router.post("/webhooks/inbound/salesforce/cdc", async (req: Request, res: Response) => {
  try {
    const rawBody = extractRawBody(req);

    const signature = (req.headers["x-salesforce-signature"] as string | undefined)
      ?? (req.headers["x-sfdc-signature"] as string | undefined)
      ?? "";

    const webhookSecret = process.env["SALESFORCE_WEBHOOK_SECRET"];
    if (webhookSecret && !signature) {
      res.status(401).json({ error: "Webhook signature required: X-Salesforce-Signature header missing" });
      return;
    }

    const payload = req.body as Record<string, unknown>;

    const event = await services.salesforce.processCdcEvent(payload, rawBody, signature || undefined);
    lastSyncTimes.set("salesforce", new Date().toISOString());

    if (event) {
      logger.info({ objectType: event.objectType, changeType: event.changeType, recordId: event.recordId, source: "salesforce" }, "Salesforce CDC event received");
      res.status(200).json({
        received: true,
        eventId: event.id,
        objectType: event.objectType,
        changeType: event.changeType,
        recordId: event.recordId,
        changedFields: event.changedFields,
      });
    } else {
      res.status(200).json({ received: true, note: "No processable CDC event in payload" });
    }
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes("signature invalid")) {
      logger.warn({ err }, "Salesforce CDC signature validation failed");
      res.status(401).json({ error: "Webhook signature validation failed", detail: message });
      return;
    }
    logger.error({ err }, "Salesforce CDC webhook processing error");
    handleRouteError(res, err, "Failed to process Salesforce CDC event");
  }
});

router.post("/webhooks/inbound/siem/splunk", verifySiemToken, async (req: Request, res: Response) => {
  try {
    const payload = req.body as Record<string, unknown> | Array<Record<string, unknown>>;
    const result = services.siem.ingestSplunkHec(payload);
    lastSyncTimes.set("siem", new Date().toISOString());

    logger.info({ accepted: result.accepted, rejected: result.rejected, correlatedAlerts: result.correlatedAlerts.length }, "SIEM Splunk HEC ingestion complete");

    res.status(200).json({
      text: "Success",
      accepted: result.accepted,
      rejected: result.rejected,
      correlatedAlerts: result.correlatedAlerts.length,
    });
  } catch (err) {
    logger.error({ err }, "SIEM Splunk HEC ingestion error");
    handleRouteError(res, err, "Failed to ingest Splunk HEC events");
  }
});

router.post("/webhooks/inbound/siem/sentinel", verifySiemToken, async (req: Request, res: Response) => {
  try {
    const payload = req.body as Record<string, unknown>;
    const alerts = (payload["value"] as Array<Record<string, unknown>>) ?? [payload];
    const result = services.siem.ingestMicrosoftSentinel(alerts);
    lastSyncTimes.set("siem", new Date().toISOString());

    logger.info({ accepted: result.accepted, correlatedAlerts: result.correlatedAlerts.length }, "SIEM Sentinel ingestion complete");

    res.status(200).json({
      accepted: result.accepted,
      rejected: result.rejected,
      correlatedAlerts: result.correlatedAlerts.length,
    });
  } catch (err) {
    logger.error({ err }, "SIEM Sentinel ingestion error");
    handleRouteError(res, err, "Failed to ingest Microsoft Sentinel alerts");
  }
});

router.post("/webhooks/inbound/siem/cef", verifySiemToken, async (req: Request, res: Response) => {
  try {
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const lines = rawBody.split("\n").filter((l) => l.trim());
    const result = services.siem.ingestCef(lines);
    lastSyncTimes.set("siem", new Date().toISOString());

    logger.info({ accepted: result.accepted, rejected: result.rejected }, "SIEM CEF ingestion complete");

    res.status(200).json({
      accepted: result.accepted,
      rejected: result.rejected,
      correlatedAlerts: result.correlatedAlerts.length,
    });
  } catch (err) {
    logger.error({ err }, "SIEM CEF ingestion error");
    handleRouteError(res, err, "Failed to ingest CEF events");
  }
});

router.post("/webhooks/inbound/siem/syslog", verifySiemToken, async (req: Request, res: Response) => {
  try {
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const lines = rawBody.split("\n").filter((l) => l.trim());
    const result = services.siem.ingestSyslog(lines);
    lastSyncTimes.set("siem", new Date().toISOString());

    res.status(200).json({
      accepted: result.accepted,
      rejected: result.rejected,
      correlatedAlerts: result.correlatedAlerts.length,
    });
  } catch (err) {
    logger.error({ err }, "SIEM syslog ingestion error");
    handleRouteError(res, err, "Failed to ingest syslog events");
  }
});

router.post("/webhooks/inbound/siem/events", verifySiemToken, async (req: Request, res: Response) => {
  try {
    const payload = req.body as Array<Record<string, unknown>> | Record<string, unknown>;
    const events = Array.isArray(payload) ? payload : [payload];
    const result = services.siem.ingestGeneric(events);
    lastSyncTimes.set("siem", new Date().toISOString());

    res.status(200).json({
      accepted: result.accepted,
      rejected: result.rejected,
      correlatedAlerts: result.correlatedAlerts.length,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to ingest generic SIEM events");
  }
});

const opsAuth = [authMiddleware(), requireRole("ops", "admin", "super_admin")];

router.get("/integrations/siem/events", ...opsAuth, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) ?? "100", 10), 500);
    const severity = req.query.severity as NormalizedSiemEvent["severity"] | undefined;
    const events = services.siem.getRecentEvents(limit, severity);
    const stats = services.siem.getEventStats();
    sendSuccess(res, { events, stats, limit });
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve SIEM events");
  }
});

router.get("/integrations/siem/alerts", ...opsAuth, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) ?? "50", 10), 200);
    const alerts = services.siem.getCorrelatedAlerts(limit);
    const stats = services.siem.getEventStats();
    sendSuccess(res, { alerts, totalCorrelated: alerts.length, stats });
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve SIEM correlated alerts");
  }
});

router.get("/integrations/siem/rules", ...opsAuth, async (_req: Request, res: Response) => {
  try {
    const rules = services.siem.getCorrelationRules();
    sendSuccess(res, { rules, count: rules.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve SIEM correlation rules");
  }
});

router.get("/integrations/pagerduty/incidents", ...opsAuth, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const status = req.query.status
      ? String(req.query.status).split(",") as Array<"triggered" | "acknowledged" | "resolved">
      : ["triggered", "acknowledged"] as Array<"triggered" | "acknowledged" | "resolved">;
    const limit = Math.min(parseInt((req.query.limit as string) ?? "25", 10), 100);
    const incidents = await services.pagerduty.listIncidents({ status, limit });
    const summary = await services.pagerduty.getActiveIncidentSummary();
    sendSuccess(res, { incidents, summary });
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve PagerDuty incidents");
  }
});

router.get("/integrations/pagerduty/oncall", ...opsAuth, validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const policyId = req.query.policy as string | undefined;
    const oncall = await services.pagerduty.getOnCallSchedule(policyId);
    const policies = await services.pagerduty.listEscalationPolicies();
    sendSuccess(res, { oncall, policies });
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve PagerDuty on-call schedule");
  }
});

router.post("/integrations/pagerduty/incidents", ...opsAuth, validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { title, serviceId, fromEmail, urgency, escalationPolicyId, body } = req.body as {
      title: string;
      serviceId: string;
      fromEmail: string;
      urgency?: "high" | "low";
      escalationPolicyId?: string;
      body?: string;
    };

    if (!title || !serviceId) {
      sendError(res, "title and serviceId are required", 400);
      return;
    }
    if (!fromEmail || !fromEmail.includes("@")) {
      sendError(res, "fromEmail is required and must be a valid email address (PagerDuty From header)", 400);
      return;
    }

    const incident = await services.pagerduty.createIncident({ title, serviceId, fromEmail, urgency, escalationPolicyId, body });
    lastSyncTimes.set("pagerduty", new Date().toISOString());

    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    handleRouteError(res, err, "Failed to create PagerDuty incident");
  }
});

router.get("/integrations/jira/sync", ...opsAuth, async (_req: Request, res: Response) => {
  try {
    const result = await services.jira.sync();
    lastSyncTimes.set("jira", new Date().toISOString());
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to sync Jira");
  }
});

router.get("/integrations/salesforce/sync", ...opsAuth, async (_req: Request, res: Response) => {
  try {
    const result = await services.salesforce.sync();
    lastSyncTimes.set("salesforce", new Date().toISOString());
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to sync Salesforce");
  }
});

router.get("/integrations/webhooks/info", (_req: Request, res: Response) => {
  sendSuccess(res, {
    inboundWebhooks: {
      jira: {
        endpoint: "POST /api/webhooks/inbound/jira",
        signatureHeader: "x-hub-signature-256 (HMAC-SHA256)",
        envVar: "JIRA_WEBHOOK_SECRET",
        events: ["jira:issue_created", "jira:issue_updated", "jira:issue_deleted", "sprint_started", "sprint_closed"],
      },
      pagerduty: {
        endpoint: "POST /api/webhooks/inbound/pagerduty",
        signatureHeader: "x-pagerduty-signature (HMAC-SHA256)",
        envVar: "PAGERDUTY_WEBHOOK_SECRET",
        events: ["incident.triggered", "incident.acknowledged", "incident.resolved", "incident.escalated"],
      },
      slack: {
        eventsEndpoint: "POST /api/webhooks/inbound/slack/events",
        interactionsEndpoint: "POST /api/webhooks/inbound/slack/interactions",
        commandsEndpoint: "POST /api/webhooks/inbound/slack/commands",
        signatureAlgorithm: "Slack v0 (HMAC-SHA256 with timestamp anti-replay)",
        envVars: ["SLACK_SIGNING_SECRET", "SLACK_BOT_TOKEN"],
        slashCommands: ["/alert", "/status", "/incident"],
      },
      salesforce: {
        cdcEndpoint: "POST /api/webhooks/inbound/salesforce/cdc",
        signatureHeader: "x-salesforce-signature (HMAC-SHA256 base64)",
        envVar: "SALESFORCE_WEBHOOK_SECRET",
        events: ["AccountChangeEvent", "OpportunityChangeEvent", "CaseChangeEvent", "LeadChangeEvent"],
      },
      siem: {
        splunkHec: "POST /api/webhooks/inbound/siem/splunk",
        microsoftSentinel: "POST /api/webhooks/inbound/siem/sentinel",
        cef: "POST /api/webhooks/inbound/siem/cef",
        syslog: "POST /api/webhooks/inbound/siem/syslog",
        generic: "POST /api/webhooks/inbound/siem/events",
        authentication: "Bearer token via Authorization header — set SIEM_INGEST_TOKEN env var to enforce",
        note: "When SIEM_INGEST_TOKEN is not set, endpoints accept all inbound traffic (dev/testing mode)",
      },
    },
    signatureVerification: {
      enabled: true,
      algorithms: {
        jira: "HMAC-SHA256 (x-hub-signature-256)",
        pagerduty: "HMAC-SHA256",
        slack: "Slack v0 HMAC-SHA256 with timestamp",
        salesforce: "HMAC-SHA256 base64",
      },
      replayProtection: {
        slack: "5 minute timestamp tolerance window",
      },
      gracefulDegradation: "Signature verification is skipped when the webhook secret env var is not configured",
    },
    credentialEnvVars: {
      jira: {
        basicAuth: ["JIRA_BASE_URL", "JIRA_API_TOKEN", "JIRA_USER_EMAIL"],
        oauth: ["JIRA_CLOUD_ID", "JIRA_OAUTH_CLIENT_ID", "JIRA_OAUTH_CLIENT_SECRET", "JIRA_OAUTH_REFRESH_TOKEN"],
        webhook: ["JIRA_WEBHOOK_SECRET"],
      },
      pagerduty: ["PAGERDUTY_API_TOKEN", "PAGERDUTY_WEBHOOK_SECRET"],
      slack: ["SLACK_BOT_TOKEN", "SLACK_WEBHOOK_URL", "SLACK_SIGNING_SECRET"],
      salesforce: ["SALESFORCE_INSTANCE_URL", "SALESFORCE_ACCESS_TOKEN", "SALESFORCE_REFRESH_TOKEN", "SALESFORCE_CLIENT_ID", "SALESFORCE_CLIENT_SECRET", "SALESFORCE_WEBHOOK_SECRET"],
      siem: ["SIEM_INGEST_TOKEN"],
    },
  });
});

router.get("/integrations/jira/oauth/status", ...opsAuth, (_req: Request, res: Response) => {
  try {
    const status = services.jira.getOAuthStatus();
    sendSuccess(res, status);
  } catch (err) {
    handleRouteError(res, err, "Failed to retrieve Jira OAuth status");
  }
});

router.get("/integrations/jira/oauth/authorize", ...opsAuth, validateQuery(listQuerySchema), (req: Request, res: Response) => {
  try {
    const redirectUri = req.query.redirect_uri as string;
    const state = req.query.state as string ?? crypto.randomUUID();
    if (!redirectUri) {
      sendError(res, "redirect_uri query parameter is required", 400);
      return;
    }
    const authorizationUrl = services.jira.buildOAuthAuthorizationUrl(redirectUri, state);
    sendSuccess(res, { authorizationUrl, state });
  } catch (err) {
    handleRouteError(res, err, "Failed to build Jira OAuth authorization URL");
  }
});

router.post("/integrations/jira/oauth/callback", ...opsAuth, validateBody(jsonObjectBodySchema), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { code, redirect_uri: redirectUri } = req.body as { code: string; redirect_uri: string };
    if (!code || !redirectUri) {
      sendError(res, "code and redirect_uri are required", 400);
      return;
    }
    const tokenSet = await services.jira.exchangeOAuthCode(code, redirectUri);
    sendSuccess(res, {
      success: true,
      tokenType: tokenSet.tokenType,
      scope: tokenSet.scope,
      expiresAt: tokenSet.expiresAt,
      hasRefreshToken: !!tokenSet.refreshToken,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to exchange Jira OAuth code");
  }
});

export default router;
