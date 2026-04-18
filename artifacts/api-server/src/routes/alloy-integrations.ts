import { Router, type IRouter, type Request, type Response } from "express";
import { createHmac, randomBytes } from "crypto";
import { pool, db, connectorsTable } from "@szl-holdings/db";
import { eq, and } from "drizzle-orm";
import { services } from "@szl-holdings/services";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router: IRouter = Router();


const INTEGRATION_REGISTRY = [
  {
    type: "google_workspace",
    name: "Google Workspace",
    description: "Gmail, Calendar, Drive — email, scheduling, and document access",
    authType: "oauth2",
    scopes: ["gmail.readonly", "calendar.readonly", "drive.readonly"],
    approvalClass: "elevated",
    rateLimit: { rpm: 100, rph: 3000 },
    capabilities: ["email_read", "calendar_read", "document_access", "email_send"],
    setupGuide: "Create a Google Cloud OAuth2 app with the required scopes and provide client_id and client_secret.",
    docUrl: "https://developers.google.com/workspace",
  },
  {
    type: "microsoft_365",
    name: "Microsoft 365",
    description: "Outlook, Teams, OneDrive — Microsoft shops full integration",
    authType: "oauth2",
    scopes: ["Mail.Read", "Calendars.Read", "Files.Read.All", "User.Read"],
    approvalClass: "elevated",
    rateLimit: { rpm: 100, rph: 3000 },
    capabilities: ["email_read", "calendar_read", "teams_message", "file_access"],
    setupGuide: "Register an Azure AD app and configure OAuth2 with Microsoft Graph permissions.",
    docUrl: "https://docs.microsoft.com/en-us/graph",
  },
  {
    type: "slack",
    name: "Slack",
    description: "ChatOps — commands, notifications, task routing from Slack channels",
    authType: "oauth2",
    scopes: ["chat:write", "commands", "channels:read", "users:read"],
    approvalClass: "standard",
    rateLimit: { rpm: 60, rph: 1000 },
    capabilities: ["message_send", "command_receive", "channel_manage"],
    setupGuide: "Create a Slack app with Bot Token Scopes. Set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET.",
    docUrl: "https://api.slack.com",
  },
  {
    type: "hubspot",
    name: "HubSpot",
    description: "CRM — contacts, deals, pipeline, company data",
    authType: "api_key",
    scopes: ["contacts", "deals", "companies", "tickets"],
    approvalClass: "standard",
    rateLimit: { rpm: 100, rph: 3000 },
    capabilities: ["contact_read", "deal_read", "pipeline_read", "ticket_create"],
    setupGuide: "Create a HubSpot Private App and set HUBSPOT_API_KEY with required scopes.",
    docUrl: "https://developers.hubspot.com",
  },
  {
    type: "salesforce",
    name: "Salesforce",
    description: "CRM — accounts, opportunities, cases, leads (full OAuth2 integration)",
    authType: "oauth2",
    scopes: ["api", "refresh_token"],
    approvalClass: "elevated",
    rateLimit: { rpm: 100, rph: 2000 },
    capabilities: ["account_read", "opportunity_read", "case_create", "task_create", "signal_ingest"],
    setupGuide: "Use /api/integrations/salesforce/oauth/authorize to connect via OAuth2.",
    docUrl: "https://developer.salesforce.com",
    connectedVia: "/api/integrations/salesforce/oauth/authorize",
  },
  {
    type: "stripe",
    name: "Stripe",
    description: "Billing — payment events, subscription lifecycle, invoice triggers",
    authType: "webhook",
    scopes: ["payment_intent", "subscription", "invoice", "customer"],
    approvalClass: "standard",
    rateLimit: { rpm: 100, rph: 3000 },
    capabilities: ["payment_event", "subscription_event", "invoice_event"],
    setupGuide: "Configure Stripe webhooks to point to /api/billing/stripe/webhook.",
    docUrl: "https://stripe.com/docs/api",
  },
  {
    type: "jira",
    name: "Jira",
    description: "Project management — issues, sprints, project status (full Atlassian OAuth2)",
    authType: "oauth2",
    scopes: ["read:jira-work", "write:jira-work"],
    approvalClass: "standard",
    rateLimit: { rpm: 100, rph: 2000 },
    capabilities: ["issue_read", "issue_create", "sprint_read", "project_read", "signal_ingest"],
    setupGuide: "Use /api/integrations/jira/oauth/authorize to connect via Atlassian OAuth2.",
    docUrl: "https://developer.atlassian.com",
    connectedVia: "/api/integrations/jira/oauth/authorize",
  },
  {
    type: "webhook_generic",
    name: "Generic Webhook",
    description: "Custom inbound webhook — any system can push events to Alloy",
    authType: "secret",
    scopes: ["*"],
    approvalClass: "standard",
    rateLimit: { rpm: 60, rph: 500 },
    capabilities: ["event_receive", "signal_ingest", "workflow_trigger"],
    setupGuide: "Create a webhook endpoint, get the secret, and configure your source system.",
    docUrl: null,
  },
];

router.get("/alloy/integrations/registry", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const connections = await pool.query(`SELECT integration_type, status, is_enabled FROM alloy_integration_connections`);
    const connectedTypes = new Set(connections.rows.filter(r => r.status === "active").map(r => r.integration_type));
    const legacyConnectors = await db.select({ type: connectorsTable.type, name: connectorsTable.name, status: connectorsTable.status }).from(connectorsTable);

    const registry = INTEGRATION_REGISTRY.map(integration => ({
      ...integration,
      connected: connectedTypes.has(integration.type) || legacyConnectors.some(c => c.name.toLowerCase() === integration.name.toLowerCase() && c.status === "active"),
    }));

    sendSuccess(res, { integrations: registry, total: registry.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to get integration registry");
  }
});

router.get("/alloy/integrations/connections", authMiddleware(), requireRole("ops", "admin", "super_admin"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { integrationType, status } = req.query as Record<string, string>;
    let q = `SELECT * FROM alloy_integration_connections WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;
    if (integrationType) { q += ` AND integration_type = $${idx++}`; params.push(integrationType); }
    if (status) { q += ` AND status = $${idx++}`; params.push(status); }
    q += ` ORDER BY created_at DESC`;
    const result = await pool.query(q, params);
    const sanitized = result.rows.map(r => ({ ...r, config: "[redacted]" }));
    sendSuccess(res, { connections: sanitized, total: result.rowCount });
  } catch (err) {
    handleRouteError(res, err, "Failed to list integration connections");
  }
});

router.post("/alloy/integrations/connections", authMiddleware(), requireRole("admin", "super_admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { integrationType, displayName, tenantId, config, scope, approvalClass } = req.body as {
      integrationType: string;
      displayName?: string;
      tenantId?: string;
      config?: Record<string, unknown>;
      scope?: string[];
      approvalClass?: string;
    };

    if (!integrationType) { sendBadRequest(res, "integrationType is required"); return; }

    const integrationDef = INTEGRATION_REGISTRY.find(i => i.type === integrationType);
    if (!integrationDef) { sendBadRequest(res, `Unknown integration type: ${integrationType}`); return; }

    const id = `intcon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const aprClass = approvalClass ?? integrationDef.approvalClass;

    await pool.query(
      `INSERT INTO alloy_integration_connections (id, integration_type, integration_name, display_name, tenant_id, auth_type, status, scope, approval_class, config, rate_limit_rpm, rate_limit_rph, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10,$11,NOW(),NOW())`,
      [
        id, integrationType, integrationDef.name, displayName ?? integrationDef.name,
        tenantId ?? null, integrationDef.authType,
        JSON.stringify(scope ?? integrationDef.scopes), aprClass,
        JSON.stringify(config ?? {}),
        integrationDef.rateLimit.rpm, integrationDef.rateLimit.rph,
      ],
    );

    sendCreated(res, { id, integrationType, displayName: displayName ?? integrationDef.name, status: "pending", approvalClass: aprClass });
  } catch (err) {
    handleRouteError(res, err, "Failed to create integration connection");
  }
});

router.patch("/alloy/integrations/connections/:id", authMiddleware(), requireRole("admin", "super_admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { status, isEnabled, config, displayName } = req.body as {
      status?: string;
      isEnabled?: boolean;
      config?: Record<string, unknown>;
      displayName?: string;
    };
    const updates: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];
    let idx = 1;
    if (status) { updates.push(`status = $${idx++}`); params.push(status); if (status === "active") { updates.push(`last_success_at = NOW()`); } }
    if (isEnabled !== undefined) { updates.push(`is_enabled = $${idx++}`); params.push(isEnabled); }
    if (config) { updates.push(`config = $${idx++}`); params.push(JSON.stringify(config)); }
    if (displayName) { updates.push(`display_name = $${idx++}`); params.push(displayName); }
    params.push(req.params.id);
    await pool.query(`UPDATE alloy_integration_connections SET ${updates.join(", ")} WHERE id = $${idx}`, params);
    sendSuccess(res, { id: req.params.id, updated: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to update connection");
  }
});

router.delete("/alloy/integrations/connections/:id", authMiddleware(), requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    await pool.query(`DELETE FROM alloy_integration_connections WHERE id = $1`, [req.params.id]);
    sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete connection");
  }
});

router.post("/alloy/integrations/webhooks/endpoints", authMiddleware(), requireRole("admin", "super_admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { name, description, allowedEvents = ["*"], targetSkill, targetWorkflowType, metadata } = req.body as {
      name: string;
      description?: string;
      allowedEvents?: string[];
      targetSkill?: string;
      targetWorkflowType?: string;
      metadata?: Record<string, unknown>;
    };
    if (!name) { sendBadRequest(res, "name is required"); return; }

    const id = `whep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const secret = randomBytes(32).toString("hex");

    await pool.query(
      `INSERT INTO alloy_webhook_endpoints (id, name, description, secret, allowed_events, target_skill, target_workflow_type, metadata, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
      [id, name, description ?? null, secret, JSON.stringify(allowedEvents), targetSkill ?? null, targetWorkflowType ?? null, JSON.stringify(metadata ?? {})],
    );

    sendCreated(res, {
      id, name, secret,
      webhookUrl: `/api/alloy/integrations/webhooks/receive/${id}`,
      allowedEvents, targetSkill, targetWorkflowType,
      message: "Store the secret securely — it will not be shown again.",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to create webhook endpoint");
  }
});

router.get("/alloy/integrations/webhooks/endpoints", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT id, name, description, is_enabled, allowed_events, target_skill, event_count, last_received_at, created_at FROM alloy_webhook_endpoints ORDER BY created_at DESC`);
    sendSuccess(res, { endpoints: result.rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to list webhook endpoints");
  }
});

router.post("/alloy/integrations/webhooks/receive/:endpointId", async (req: Request, res: Response) => {
  try {
    const { endpointId } = req.params;
    const endpointResult = await pool.query(`SELECT * FROM alloy_webhook_endpoints WHERE id = $1 AND is_enabled = TRUE`, [endpointId]);
    if (!endpointResult.rows[0]) {
      res.status(404).json({ error: "Webhook endpoint not found or disabled" });
      return;
    }
    const endpoint = endpointResult.rows[0];

    const signature = req.headers["x-alloy-signature"] as string | undefined;
    if (!signature) {
      res.status(401).json({ error: "Missing webhook signature — x-alloy-signature header is required" });
      return;
    }
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody?.toString("utf-8") ?? JSON.stringify(req.body);
    const computed = createHmac("sha256", endpoint.secret).update(rawBody).digest("hex");
    if (signature !== `sha256=${computed}`) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    res.status(200).json({ received: true, eventId: `evt-${Date.now()}` });

    setImmediate(async () => {
      try {
        const eventId = `intevt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const body = req.body as Record<string, unknown>;
        const eventType = (body["type"] as string) ?? (body["event"] as string) ?? "unknown";

        await pool.query(
          `INSERT INTO alloy_integration_events (id, connection_id, integration_type, event_type, direction, payload, status, created_at)
           VALUES ($1,$2,'webhook',$3,'inbound',$4,'received',NOW())`,
          [eventId, endpointId, eventType, JSON.stringify(body)],
        );

        await pool.query(
          `UPDATE alloy_webhook_endpoints SET event_count = event_count + 1, last_received_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [endpointId],
        );

        if (endpoint.target_skill) {
          try {
            await services.ai.chatCompletion([
              { role: "system", content: `You are an Alloy signal processor. Process this incoming ${eventType} webhook event for the ${endpoint.target_skill} skill and summarize what action should be taken.` },
              { role: "user", content: JSON.stringify(body).slice(0, 2000) },
            ], { maxTokens: 300 });
          } catch { }
        }

        await pool.query(
          `UPDATE alloy_integration_events SET status='processed', processed_at=NOW() WHERE id=$1`,
          [eventId],
        );
      } catch (asyncErr) {
        logger.error({ err: asyncErr, endpointId }, "alloy-integrations: webhook processing failed");
      }
    });
  } catch (err) {
    handleRouteError(res, err, "Webhook receive failed");
  }
});

router.get("/alloy/integrations/events", authMiddleware(), requireRole("ops", "admin", "super_admin"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { connectionId, integrationType, limit: limitStr = "50" } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(limitStr, 10), 200);
    let q = `SELECT * FROM alloy_integration_events WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;
    if (connectionId) { q += ` AND connection_id = $${idx++}`; params.push(connectionId); }
    if (integrationType) { q += ` AND integration_type = $${idx++}`; params.push(integrationType); }
    q += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(limit);
    const result = await pool.query(q, params);
    sendSuccess(res, { events: result.rows, total: result.rowCount });
  } catch (err) {
    handleRouteError(res, err, "Failed to list integration events");
  }
});

router.post("/alloy/integrations/connections/:id/test", authMiddleware(), requireRole("ops", "admin", "super_admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM alloy_integration_connections WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) { sendError(res, "Connection not found", 404); return; }

    const connection = result.rows[0];
    let testResult = { connected: false, message: "Test not implemented for this integration type" };

    if (connection.integration_type === "salesforce") {
      const sfStatus = await services.salesforce.testConnection();
      testResult = { connected: sfStatus.connected, message: sfStatus.connected ? "Connected successfully" : "Connection failed" };
    } else if (connection.integration_type === "jira") {
      const jiraStatus = await services.jira.testConnection();
      testResult = { connected: jiraStatus.connected, message: jiraStatus.connected ? "Connected successfully" : "Connection failed" };
    } else if (connection.integration_type === "slack") {
      const hasToken = !!process.env.SLACK_BOT_TOKEN;
      testResult = { connected: hasToken, message: hasToken ? "Slack token configured" : "SLACK_BOT_TOKEN not set" };
    }

    if (testResult.connected) {
      await pool.query(`UPDATE alloy_integration_connections SET status='active', last_success_at=NOW(), failure_count=0, updated_at=NOW() WHERE id=$1`, [req.params.id]);
    } else {
      await pool.query(`UPDATE alloy_integration_connections SET failure_count=failure_count+1, last_failure_at=NOW(), updated_at=NOW() WHERE id=$1`, [req.params.id]);
    }

    sendSuccess(res, { id: req.params.id, ...testResult, testedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Connection test failed");
  }
});

router.get("/alloy/integrations/health", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const [connections, events] = await Promise.all([
      pool.query(`SELECT integration_type, status, is_enabled, failure_count, last_success_at FROM alloy_integration_connections`),
      pool.query(`SELECT integration_type, COUNT(*) as total, SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed FROM alloy_integration_events WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY integration_type`),
    ]);

    const health: Record<string, unknown> = {};
    for (const conn of connections.rows) {
      const eventStats = events.rows.find(e => e.integration_type === conn.integration_type);
      health[conn.integration_type] = {
        status: conn.status,
        enabled: conn.is_enabled,
        failureCount: conn.failure_count,
        lastSuccess: conn.last_success_at,
        recentEvents: eventStats ? parseInt(eventStats.total) : 0,
        recentFailures: eventStats ? parseInt(eventStats.failed) : 0,
      };
    }

    sendSuccess(res, { health, timestamp: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to get integration health");
  }
});

export default router;
