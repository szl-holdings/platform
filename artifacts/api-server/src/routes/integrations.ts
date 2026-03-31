import { Router, type IRouter, type Request, type Response } from "express";
import { services } from "@workspace/services";
import { db, alloySignalsTable, insertAlloySignalSchema } from "@workspace/db";
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

async function ingestSignalToDB(
  source: string,
  sourceType: string,
  title: string,
  body: string,
  severity: "info" | "warning" | "critical",
  valueAtRisk: number | null,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    const data = insertAlloySignalSchema.parse({
      source,
      sourceType,
      severity,
      title,
      body,
      status: "new",
      orgId: null,
      workflowId: null,
      normalizedScore: null,
      valueAtRisk,
      metadata,
    });
    await db.insert(alloySignalsTable).values(data);
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

router.post("/integrations/salesforce/sync", authMiddleware(), requireRole("ops", "super_admin", "admin"), async (_req, res) => {
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
        signal.type,
        signal.title,
        signal.description,
        signal.severity,
        signal.valueAtRisk,
        signal.metadata,
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
      eventType,
      title,
      description,
      "info",
      null,
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
        signal.type,
        signal.title,
        signal.description,
        signal.severity,
        null,
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
        webhookEvent,
        `Jira ${webhookEvent}: ${issueKey}`,
        issueSummary,
        "info",
        null,
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
        signal.type,
        signal.title,
        signal.description,
        signal.severity,
        signal.valueAtRisk,
        signal.metadata,
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
        signal.type,
        signal.title,
        signal.description,
        signal.severity,
        null,
        { ...signal.metadata, projectKey: signal.projectKey },
      );
      ingested++;
    }
    sendCreated(res, { ingested, signals, timestamp: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Jira signal ingestion failed");
  }
});

export default router;
