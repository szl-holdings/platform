import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { platformAuth } from "../middlewares/platform-auth";
import { isFlagEnabled } from "../lib/platform-flags";
import { services } from "@workspace/services";
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendNotFound,
  sendError,
  handleRouteError,
} from "../lib/api-response";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const powerAutomateWebhookLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Power Automate webhook rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const dynamicsWebhookLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Dynamics webhook rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

function validateHmacSignature(
  payload: string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  const sigBuffer = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  const expBuffer = Buffer.from(expected, "hex");
  if (sigBuffer.length !== expBuffer.length) return false;
  return crypto.timingSafeEqual(sigBuffer, expBuffer);
}

router.get("/integrations/dynamics/entities", authMiddleware(), async (req, res) => {
  try {
    const enabled = await isFlagEnabled("dynamics365_sync_enabled");
    if (!enabled) {
      sendSuccess(res, {
        featureDisabled: true,
        message: "Dynamics 365 sync is not enabled. Enable the dynamics365_sync_enabled feature flag.",
      });
      return;
    }

    const entity = (req.query.entity as string) || "all";
    const adapter = services.dynamics365;
    const result: Record<string, unknown> = { mode: adapter.status };

    if (entity === "accounts" || entity === "all") {
      result.accounts = await adapter.listAccounts();
    }
    if (entity === "contacts" || entity === "all") {
      result.contacts = await adapter.listContacts();
    }
    if (entity === "opportunities" || entity === "all") {
      result.opportunities = await adapter.listOpportunities();
    }
    if (entity === "leads" || entity === "all") {
      result.leads = await adapter.listLeads();
    }
    if (entity === "cases" || entity === "all") {
      result.cases = await adapter.listCases();
    }
    if (entity === "activities" || entity === "all") {
      result.activities = await adapter.listActivities();
    }

    const validEntities = ["accounts", "contacts", "opportunities", "leads", "cases", "activities", "all"];
    if (!validEntities.includes(entity)) {
      sendBadRequest(res, `Invalid entity type. Must be one of: ${validEntities.join(", ")}`);
      return;
    }

    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch Dynamics 365 entities");
  }
});

router.post("/integrations/dynamics/sync", authMiddleware(), requireRole("super_admin", "ops"), async (req, res) => {
  try {
    const enabled = await isFlagEnabled("dynamics365_sync_enabled");
    if (!enabled) {
      sendBadRequest(res, "Dynamics 365 sync is not enabled. Enable the dynamics365_sync_enabled feature flag.");
      return;
    }

    const { direction, entityTypes, leadScoreThreshold } = req.body as {
      direction?: "ingest" | "push" | "bidirectional";
      entityTypes?: string[];
      leadScoreThreshold?: number;
    };

    const adapter = services.dynamics365;
    const resolvedDirection = direction ?? "ingest";
    const resolvedThreshold = leadScoreThreshold ?? 75;

    const signals = await adapter.getMockSyncSignals();

    const pushResult: { pushed: number; records: unknown[] } = { pushed: 0, records: [] };
    if (resolvedDirection === "push" || resolvedDirection === "bidirectional") {
      const pushed = await adapter.pushActivityRecord({
        subject: "SZL Platform Sync Event",
        description: `Bidirectional sync executed at ${new Date().toISOString()} from SZL Alloy. Direction: ${resolvedDirection}.`,
        regardingEntitySet: "accounts",
        regardingId: "",
        activityType: "task",
      });
      pushResult.pushed = 1;
      pushResult.records = [pushed];
    }

    sendSuccess(res, {
      direction: resolvedDirection,
      mode: adapter.status,
      ingestedSignals: signals.length,
      signals,
      pushResult: resolvedDirection !== "ingest" ? pushResult : null,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to execute Dynamics 365 sync");
  }
});

router.post(
  "/integrations/dynamics/webhook",
  dynamicsWebhookLimit,
  async (req, res) => {
    try {
      const enabled = await isFlagEnabled("dynamics365_sync_enabled");
      if (!enabled) {
        res.status(200).json({ received: true, processed: false, reason: "Feature disabled" });
        return;
      }

      const body = req.body as {
        EntityName?: string;
        MessageName?: string;
        BusinessUnitId?: string;
        PrimaryEntityId?: string;
        InputParameters?: unknown;
        PostEntityImages?: unknown;
        PreEntityImages?: unknown;
      };

      const entityName = body.EntityName ?? "unknown";
      const messageName = body.MessageName ?? "unknown";
      const entityId = body.PrimaryEntityId ?? null;

      logger.info({ entityName, messageName, entityId }, "Dynamics 365 webhook received");

      const signalMap: Record<string, { title: string; severity: "info" | "warning" | "critical" }> = {
        "opportunity:Update": { title: "Dynamics — Opportunity Updated", severity: "warning" },
        "opportunity:Create": { title: "Dynamics — New Opportunity Created", severity: "info" },
        "incident:Update": { title: "Dynamics — Case Updated", severity: "warning" },
        "incident:Create": { title: "Dynamics — New Case Created", severity: "info" },
        "lead:Create": { title: "Dynamics — New Lead Created", severity: "info" },
        "lead:Update": { title: "Dynamics — Lead Updated", severity: "info" },
      };

      const key = `${entityName}:${messageName}`;
      const mapped = signalMap[key] ?? { title: `Dynamics — ${entityName} ${messageName}`, severity: "info" as const };

      res.status(200).json({
        received: true,
        processed: true,
        entityName,
        messageName,
        entityId,
        signal: {
          source: "dynamics365",
          sourceType: "crm_webhook",
          title: mapped.title,
          severity: mapped.severity,
          metadata: {
            entityName,
            messageName,
            entityId,
            receivedAt: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      logger.error({ err }, "Dynamics 365 webhook processing failed");
      res.status(200).json({ received: true, processed: false, error: "Processing failed" });
    }
  },
);

router.post(
  "/integrations/power-automate/trigger",
  powerAutomateWebhookLimit,
  async (req, res) => {
    try {
      const enabled = await isFlagEnabled("power_automate_webhook_enabled");
      if (!enabled) {
        res.status(200).json({
          success: false,
          reason: "Power Automate webhook integration is not enabled. Enable the power_automate_webhook_enabled feature flag.",
        });
        return;
      }

      const webhookSecret = process.env["POWER_AUTOMATE_WEBHOOK_SECRET"];
      if (webhookSecret) {
        const rawBody = JSON.stringify(req.body);
        const sig = req.headers["x-szl-signature"] as string | undefined;
        if (!validateHmacSignature(rawBody, sig, webhookSecret)) {
          res.status(401).json({ error: "Invalid webhook signature" });
          return;
        }
      }

      const {
        action,
        workflowId,
        signalPayload,
        orgId,
      } = req.body as {
        action?: "trigger_workflow" | "create_signal" | "ingest_event";
        workflowId?: string | number;
        signalPayload?: {
          title?: string;
          body?: string;
          severity?: string;
          source?: string;
          metadata?: Record<string, unknown>;
        };
        orgId?: number;
      };

      const resolvedAction = action ?? "create_signal";

      logger.info({ action: resolvedAction, workflowId, orgId }, "Power Automate webhook received");

      const responsePayload: Record<string, unknown> = {
        received: true,
        action: resolvedAction,
        processedAt: new Date().toISOString(),
      };

      if (resolvedAction === "trigger_workflow") {
        if (!workflowId) {
          res.status(400).json({ error: "workflowId is required for trigger_workflow action" });
          return;
        }
        responsePayload.workflowTriggered = true;
        responsePayload.workflowId = workflowId;
        responsePayload.runState = "queued";
        responsePayload.message = "Workflow trigger received and queued via Power Automate";
      } else if (resolvedAction === "create_signal" || resolvedAction === "ingest_event") {
        const title = signalPayload?.title ?? "Power Automate Event";
        const severity = signalPayload?.severity ?? "info";
        responsePayload.signalCreated = true;
        responsePayload.signal = {
          source: signalPayload?.source ?? "power_automate",
          sourceType: "power_automate_webhook",
          title,
          severity,
          body: signalPayload?.body ?? null,
          metadata: {
            ...(signalPayload?.metadata ?? {}),
            poweredBy: "power_automate",
            receivedAt: new Date().toISOString(),
          },
          orgId: orgId ?? null,
        };
        responsePayload.message = "Signal ingested from Power Automate flow";
      } else {
        res.status(400).json({ error: `Unknown action: ${resolvedAction}` });
        return;
      }

      res.status(200).json(responsePayload);
    } catch (err) {
      logger.error({ err }, "Power Automate webhook processing failed");
      res.status(200).json({ received: true, processed: false, error: "Processing failed" });
    }
  },
);

router.get("/integrations/sharepoint/webparts", authMiddleware(), async (req, res) => {
  try {
    const enabled = await isFlagEnabled("sharepoint_spfx_enabled");
    if (!enabled) {
      sendSuccess(res, {
        featureDisabled: true,
        message: "SharePoint SPFx integration is not enabled. Enable the sharepoint_spfx_enabled feature flag.",
        webParts: [],
      });
      return;
    }

    const adapter = services.sharepointSpfx;
    const manifests = adapter.getWebPartManifests();
    const buildInfo = adapter.getSPFxPackageBuildInfo();

    sendSuccess(res, {
      mode: adapter.status,
      webParts: manifests,
      buildInfo,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch SPFx web part manifests");
  }
});

router.get("/integrations/sharepoint/webparts/:id", authMiddleware(), async (req, res) => {
  try {
    const enabled = await isFlagEnabled("sharepoint_spfx_enabled");
    if (!enabled) {
      sendBadRequest(res, "SharePoint SPFx integration is not enabled.");
      return;
    }

    const adapter = services.sharepointSpfx;
    const manifest = adapter.getWebPartManifest(String(req.params.id));
    if (!manifest) {
      sendNotFound(res, "Web part");
      return;
    }
    sendSuccess(res, manifest);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch SPFx web part manifest");
  }
});

router.get("/integrations/sharepoint/deployment", authMiddleware(), requireRole("super_admin", "ops"), async (req, res) => {
  try {
    const enabled = await isFlagEnabled("sharepoint_spfx_enabled");
    if (!enabled) {
      sendBadRequest(res, "SharePoint SPFx integration is not enabled.");
      return;
    }

    const adapter = services.sharepointSpfx;
    const status = await adapter.getDeploymentStatus();
    const sites = await adapter.listSites();

    sendSuccess(res, {
      mode: adapter.status,
      deployment: status,
      connectedSites: sites,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch SharePoint deployment status");
  }
});

router.get("/integrations/dynamics/health", authMiddleware(), requireRole("super_admin", "ops"), async (_req, res) => {
  try {
    const adapter = services.dynamics365;
    const report = adapter.getHealthReport();
    sendSuccess(res, report);
  } catch (err) {
    handleRouteError(res, err, "Failed to get Dynamics 365 health");
  }
});

router.get("/integrations/sharepoint/health", authMiddleware(), requireRole("super_admin", "ops"), async (_req, res) => {
  try {
    const adapter = services.sharepointSpfx;
    const report = adapter.getHealthReport();
    sendSuccess(res, report);
  } catch (err) {
    handleRouteError(res, err, "Failed to get SharePoint SPFx health");
  }
});

export default router;
