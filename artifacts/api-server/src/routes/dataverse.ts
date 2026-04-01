import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { db } from "@workspace/db";
import {
  azureTenantsTable,
  dataverseConnectionsTable,
  terraLeadsTable,
  alloySignalsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { services } from "@workspace/services";
import { getAzureTenantForUser } from "../lib/auth";
import { decryptSecret } from "../lib/crypto";

const router: IRouter = Router();

const dataverseRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Dataverse API rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

function isAdmin(req: Request): boolean {
  return !!(req.user?.roles.some(r => ADMIN_ROLES.has(r)));
}

async function resolveTenantId(req: Request): Promise<string | null> {
  if (!req.user) return null;

  if (isAdmin(req) && req.query.tenantId) {
    return req.query.tenantId as string;
  }

  return getAzureTenantForUser(req.user.id);
}

async function resolveConnection(
  tenantAzureId: string,
  connectionId?: number,
): Promise<{ orgUrl: string; tenantId: string; clientId?: string; clientSecret?: string } | null> {
  const [conn] = await db
    .select()
    .from(dataverseConnectionsTable)
    .where(
      connectionId
        ? and(
            eq(dataverseConnectionsTable.azureTenantId, tenantAzureId),
            eq(dataverseConnectionsTable.id, connectionId),
          )
        : eq(dataverseConnectionsTable.azureTenantId, tenantAzureId),
    )
    .limit(1);

  if (!conn) return null;

  return {
    orgUrl: conn.orgUrl,
    tenantId: tenantAzureId,
    clientId: conn.clientId ?? undefined,
    clientSecret: conn.clientSecret ? decryptSecret(conn.clientSecret) : undefined,
  };
}

async function buildConnParams(
  req: Request,
): Promise<{ orgUrl: string; tenantId: string; clientId?: string; clientSecret?: string } | { error: string; status: number }> {
  const azureTenantId = await resolveTenantId(req);
  if (!azureTenantId) {
    return { error: "No Azure AD tenant context for this user. Cannot determine Dataverse scope.", status: 403 };
  }

  const connectionId = req.query.connectionId ? parseInt(String(req.query.connectionId), 10) : undefined;
  const conn = await resolveConnection(azureTenantId, connectionId);
  if (!conn) {
    return { error: "Dataverse connection not found for your tenant", status: 404 };
  }
  return conn;
}

router.get(
  "/status",
  dataverseRateLimit,
  authMiddleware(),
  async (_req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      sendSuccess(res, {
        adapter: adapter.name,
        description: adapter.description,
        status: adapter.status,
        requiredEnvVars: adapter.requiredEnvVars,
        missingEnvVars: adapter.missingEnvVars,
        isLive: adapter.isLive,
        isDemoMode: adapter.isDemoMode,
        configuration: {
          DATAVERSE_ORG_URL: process.env["DATAVERSE_ORG_URL"] ? "configured" : "not configured",
          DATAVERSE_TENANT_ID: process.env["DATAVERSE_TENANT_ID"] ? "configured" : "not configured",
          DATAVERSE_CLIENT_ID: process.env["DATAVERSE_CLIENT_ID"] ? "configured" : "not configured",
          DATAVERSE_CLIENT_SECRET: process.env["DATAVERSE_CLIENT_SECRET"] ? "configured" : "not configured",
        },
        supportedEntities: ["accounts", "contacts", "leads", "opportunities", "activities"],
        dataverseApiVersion: "v9.2",
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to get Dataverse status");
    }
  },
);

router.get(
  "/accounts",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const accounts = await adapter.listAccounts(
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Accounts",
        count: accounts.length,
        isLive: adapter.isLive,
        accounts,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list Dataverse accounts");
    }
  },
);

router.get(
  "/accounts/:accountId",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const { accountId } = req.params as Record<string, string>;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const account = await adapter.getAccount(
        accountId!,
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      if (!account) {
        res.status(404).json({ error: "Account not found" });
        return;
      }

      sendSuccess(res, { source: "Dynamics 365 Dataverse — Account", account, isLive: adapter.isLive });
    } catch (err) {
      handleRouteError(res, err, "Failed to get Dataverse account");
    }
  },
);

router.get(
  "/contacts",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const contacts = await adapter.listContacts(
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Contacts",
        count: contacts.length,
        isLive: adapter.isLive,
        contacts,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list Dataverse contacts");
    }
  },
);

router.get(
  "/leads",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const leads = await adapter.listLeads(
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Leads",
        count: leads.length,
        isLive: adapter.isLive,
        leads,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list Dataverse leads");
    }
  },
);

router.post(
  "/leads",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (!body.firstName || !body.lastName) {
        sendBadRequest(res, "firstName and lastName are required");
        return;
      }

      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const result = await adapter.createLead(
        {
          firstName: body.firstName,
          lastName: body.lastName,
          companyName: body.companyName,
          emailAddress1: body.emailAddress1 ?? body.email,
          subject: body.subject,
          estimatedvalue: body.estimatedvalue,
        },
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Lead Created",
        ...result,
        isLive: adapter.isLive,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to create Dataverse lead");
    }
  },
);

router.get(
  "/opportunities",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const opportunities = await adapter.listOpportunities(
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Opportunities",
        count: opportunities.length,
        isLive: adapter.isLive,
        opportunities,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list Dataverse opportunities");
    }
  },
);

router.patch(
  "/opportunities/:opportunityId/stage",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const { opportunityId } = req.params as Record<string, string>;
      const { stageName } = req.body ?? {};

      if (!stageName) {
        sendBadRequest(res, "stageName is required");
        return;
      }

      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const result = await adapter.updateOpportunityStage(
        opportunityId!,
        stageName,
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Opportunity Stage Updated",
        opportunityId,
        stageName,
        ...result,
        isLive: adapter.isLive,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to update opportunity stage");
    }
  },
);

router.get(
  "/activities",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const activities = await adapter.listActivities(
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Activities",
        count: activities.length,
        isLive: adapter.isLive,
        activities,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to list Dataverse activities");
    }
  },
);

router.post(
  "/activities",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (!body.subject) {
        sendBadRequest(res, "subject is required");
        return;
      }

      const validTypes = ["phonecall", "email", "task", "appointment"];
      if (!validTypes.includes(body.activityType ?? "task")) {
        sendBadRequest(res, `activityType must be one of: ${validTypes.join(", ")}`);
        return;
      }

      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const result = await adapter.createActivity(
        {
          subject: body.subject,
          activityType: body.activityType ?? "task",
          regardingObjectId: body.regardingObjectId,
          regardingObjectType: body.regardingObjectType,
          description: body.description,
          scheduledstart: body.scheduledstart,
        },
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Activity Created",
        ...result,
        isLive: adapter.isLive,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to create Dataverse activity");
    }
  },
);

router.post(
  "/notes",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (!body.noteText || !body.regardingObjectId || !body.regardingObjectType) {
        sendBadRequest(res, "noteText, regardingObjectId, and regardingObjectType are required");
        return;
      }

      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const result = await adapter.logNote(
        body.regardingObjectId,
        body.regardingObjectType,
        body.noteText,
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Note Logged",
        ...result,
        isLive: adapter.isLive,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to log Dataverse note");
    }
  },
);

router.get(
  "/signals",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const signals = await adapter.generateLyteSignals(
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — CRM Signal Intelligence (Lyte Integration)",
        count: signals.length,
        signals,
        isLive: adapter.isLive,
        detectedAt: new Date().toISOString(),
        signalBreakdown: {
          staleOpportunities: signals.filter(s => s.type === "stale_opportunity").length,
          pipelineAnomalies: signals.filter(s => s.type === "pipeline_anomaly").length,
          dealStageConflicts: signals.filter(s => s.type === "deal_stage_conflict").length,
          highValueLeads: signals.filter(s => s.type === "high_value_lead").length,
          overdueActivities: signals.filter(s => s.type === "overdue_activity").length,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to generate Dataverse signals");
    }
  },
);

router.get(
  "/sync",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const results = await adapter.sync(
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Full Entity Sync",
        results,
        totalSynced: results.reduce((s, r) => s + r.count, 0),
        isLive: adapter.isLive,
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to sync Dataverse data");
    }
  },
);

router.get(
  "/contacts/:contactId",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const contact = await adapter.getContact(
        String(req.params.contactId),
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      if (!contact) {
        res.status(404).json({ error: "Contact not found" });
        return;
      }
      sendSuccess(res, { source: "Dynamics 365 Dataverse — Contact", contact, isLive: adapter.isLive });
    } catch (err) {
      handleRouteError(res, err, "Failed to get Dataverse contact");
    }
  },
);

router.patch(
  "/contacts/:contactId",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const result = await adapter.updateContact(
        String(req.params.contactId),
        req.body ?? {},
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Contact Updated",
        contactId: String(req.params.contactId),
        ...result,
        isLive: adapter.isLive,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to update Dataverse contact");
    }
  },
);

router.delete(
  "/contacts/:contactId",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const result = await adapter.deleteContact(
        String(req.params.contactId),
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Contact Deleted",
        contactId: String(req.params.contactId),
        ...result,
        isLive: adapter.isLive,
        deletedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to delete Dataverse contact");
    }
  },
);

router.post(
  "/contacts",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (!body.firstName || !body.lastName) {
        sendBadRequest(res, "firstName and lastName are required");
        return;
      }
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const result = await adapter.createContact(
        {
          firstName: body.firstName,
          lastName: body.lastName,
          emailAddress1: body.emailAddress1 ?? body.email,
          telephone1: body.telephone1,
          jobTitle: body.jobTitle,
          accountId: body.accountId,
        },
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Contact Created",
        ...result,
        isLive: adapter.isLive,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to create Dataverse contact");
    }
  },
);

router.get(
  "/leads/:leadId",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const lead = await adapter.getLead(
        String(req.params.leadId),
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }
      sendSuccess(res, { source: "Dynamics 365 Dataverse — Lead", lead, isLive: adapter.isLive });
    } catch (err) {
      handleRouteError(res, err, "Failed to get Dataverse lead");
    }
  },
);

router.patch(
  "/leads/:leadId",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const result = await adapter.updateLead(
        String(req.params.leadId),
        req.body ?? {},
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Lead Updated",
        leadId: String(req.params.leadId),
        ...result,
        isLive: adapter.isLive,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to update Dataverse lead");
    }
  },
);

router.delete(
  "/leads/:leadId",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const result = await adapter.deleteLead(
        String(req.params.leadId),
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Lead Deleted",
        leadId: String(req.params.leadId),
        ...result,
        isLive: adapter.isLive,
        deletedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to delete Dataverse lead");
    }
  },
);

router.get(
  "/opportunities/:opportunityId",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const opportunity = await adapter.getOpportunity(
        String(req.params.opportunityId),
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      if (!opportunity) {
        res.status(404).json({ error: "Opportunity not found" });
        return;
      }
      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Opportunity",
        opportunity,
        isLive: adapter.isLive,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to get Dataverse opportunity");
    }
  },
);

router.patch(
  "/opportunities/:opportunityId",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const result = await adapter.updateOpportunity(
        String(req.params.opportunityId),
        req.body ?? {},
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Opportunity Updated",
        opportunityId: String(req.params.opportunityId),
        ...result,
        isLive: adapter.isLive,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to update Dataverse opportunity");
    }
  },
);

router.delete(
  "/opportunities/:opportunityId",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const result = await adapter.deleteOpportunity(
        String(req.params.opportunityId),
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Opportunity Deleted",
        opportunityId: String(req.params.opportunityId),
        ...result,
        isLive: adapter.isLive,
        deletedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to delete Dataverse opportunity");
    }
  },
);

router.get(
  "/activities/:activityId",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const activityType = String(req.query.activityType ?? "task");
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const activity = await adapter.getActivity(
        String(req.params.activityId),
        activityType,
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      if (!activity) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }
      sendSuccess(res, { source: "Dynamics 365 Dataverse — Activity", activity, isLive: adapter.isLive });
    } catch (err) {
      handleRouteError(res, err, "Failed to get Dataverse activity");
    }
  },
);

router.patch(
  "/activities/:activityId",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const activityType = String(body.activityType ?? req.query.activityType ?? "task");
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const result = await adapter.updateActivity(
        String(req.params.activityId),
        activityType,
        body,
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Activity Updated",
        activityId: String(req.params.activityId),
        ...result,
        isLive: adapter.isLive,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to update Dataverse activity");
    }
  },
);

router.delete(
  "/activities/:activityId",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const activityType = String(req.query.activityType ?? "task");
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }
      const result = await adapter.deleteActivity(
        String(req.params.activityId),
        activityType,
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );
      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Activity Deleted",
        activityId: String(req.params.activityId),
        ...result,
        isLive: adapter.isLive,
        deletedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to delete Dataverse activity");
    }
  },
);

router.get(
  "/vessels/fleet-operators",
  dataverseRateLimit,
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const [accounts, contacts] = await Promise.all([
        adapter.listAccounts(connParams.orgUrl, connParams.tenantId, connParams.clientId, connParams.clientSecret),
        adapter.listContacts(connParams.orgUrl, connParams.tenantId, connParams.clientId, connParams.clientSecret),
      ]);

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Vessels Fleet Operator Mapping",
        count: accounts.length,
        fleetOperators: accounts.map(a => ({
          id: a.id,
          name: a.name,
          accountNumber: a.accountNumber,
          telephone: a.telephone1,
          email: a.emailAddress1,
          contacts: contacts.filter(c => c.accountId === a.id).map(c => ({
            id: c.id,
            name: c.fullName,
            jobTitle: c.jobTitle,
            email: c.emailAddress1,
          })),
        })),
        isLive: adapter.isLive,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch fleet operators from Dataverse");
    }
  },
);

router.get(
  "/aegis/identity-signals",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      let tenants;
      if (isAdmin(req) && req.query.tenantId) {
        tenants = await db
          .select()
          .from(azureTenantsTable)
          .where(eq(azureTenantsTable.azureTenantId, req.query.tenantId as string))
          .limit(1);
      } else if (isAdmin(req)) {
        tenants = await db
          .select()
          .from(azureTenantsTable)
          .where(eq(azureTenantsTable.status, "active"));
      } else {
        const callerAzureTenantId = await resolveTenantId(req);
        if (!callerAzureTenantId) {
          res.status(403).json({
            error: "No Azure AD tenant context for this user. Use ?tenantId= with admin role to specify a tenant.",
          });
          return;
        }
        tenants = await db
          .select()
          .from(azureTenantsTable)
          .where(eq(azureTenantsTable.azureTenantId, callerAzureTenantId))
          .limit(1);
      }

      const identitySignals = (tenants ?? []).map(t => ({
        tenantId: t.azureTenantId,
        tenantName: t.displayName,
        domain: t.domain,
        status: t.status,
        adminConsentGranted: t.adminConsentGranted,
        provisionedAt: t.provisionedAt,
        riskFlags: [
          ...(t.adminConsentGranted !== "granted" && t.status === "active" ? [{
            type: "missing_consent",
            severity: "medium",
            message: "Tenant is active but admin consent has not been granted",
          }] : []),
          ...(t.status === "suspended" ? [{
            type: "suspended_tenant",
            severity: "high",
            message: "Tenant access is suspended",
          }] : []),
        ],
      }));

      sendSuccess(res, {
        source: "Azure AD Multi-Tenant — Aegis Identity Signal Feed",
        count: identitySignals.length,
        identitySignals,
        checkedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to generate identity signals");
    }
  },
);

router.post(
  "/terra/sync",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const [d365Leads, d365Opportunities] = await Promise.all([
        adapter.listLeads(connParams.orgUrl, connParams.tenantId, connParams.clientId, connParams.clientSecret),
        adapter.listOpportunities(connParams.orgUrl, connParams.tenantId, connParams.clientId, connParams.clientSecret),
      ]);

      let leadsUpserted = 0;
      for (const lead of d365Leads) {
        const externalId = `d365-lead-${lead.id}`;
        const nameParts = (lead.fullName ?? "Unknown Lead").split(" ");
        const firstName = nameParts[0] ?? "Unknown";
        const lastName = nameParts.slice(1).join(" ") || "Lead";

        const existing = await db
          .select({ id: terraLeadsTable.id })
          .from(terraLeadsTable)
          .where(eq(terraLeadsTable.externalId, externalId))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(terraLeadsTable).values({
            externalId,
            firstName,
            lastName,
            email: (lead as any).email ?? null,
            phone: (lead as any).phone ?? null,
            source: "csv-import",
            stage: "new",
            score: 50,
            notes: `Synced from Dynamics 365 — ${(lead as any).topic ?? ""}`.trim(),
            tags: ["dataverse", "d365-sync"],
          });
          leadsUpserted++;
        }
      }

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Terra CRM Sync",
        isLive: adapter.isLive,
        syncedAt: new Date().toISOString(),
        summary: {
          d365LeadsFetched: d365Leads.length,
          d365OpportunitiesFetched: d365Opportunities.length,
          terraLeadsCreated: leadsUpserted,
        },
        d365Leads,
        d365Opportunities,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to sync Terra CRM data from Dataverse");
    }
  },
);

router.post(
  "/alloy/ingest-signals",
  dataverseRateLimit,
  authMiddleware(),
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      const adapter = services.dataverse;
      const connParams = await buildConnParams(req);
      if ("error" in connParams) {
        res.status(connParams.status).json({ error: connParams.error });
        return;
      }

      const crmSignals = await adapter.generateLyteSignals(
        connParams.orgUrl,
        connParams.tenantId,
        connParams.clientId,
        connParams.clientSecret,
      );

      if (crmSignals.length === 0) {
        sendSuccess(res, {
          source: "Dynamics 365 Dataverse — Alloy Signal Ingestion",
          signalsIngested: 0,
          message: "No CRM signals detected at this time",
        });
        return;
      }

      const orgId = req.user?.orgs?.[0]?.orgId ?? null;

      const rows = crmSignals.map(sig => ({
        orgId,
        source: "Dynamics 365 Dataverse",
        sourceType: "connector" as const,
        severity: (sig.severity === "critical" || sig.severity === "high" || sig.severity === "medium" || sig.severity === "low" ? sig.severity : "info") as "critical" | "high" | "medium" | "low" | "info",
        title: sig.title,
        body: sig.description ?? null,
        status: "new" as const,
        metadata: {
          type: sig.type,
          tenantId: connParams.tenantId,
          entityId: sig.entityId ?? null,
          entityName: sig.entityName ?? null,
          dataverse: true,
        },
      }));

      const inserted = await db.insert(alloySignalsTable).values(rows).returning({ id: alloySignalsTable.id });

      sendSuccess(res, {
        source: "Dynamics 365 Dataverse — Alloy Signal Ingestion",
        isLive: adapter.isLive,
        ingestedAt: new Date().toISOString(),
        signalsIngested: inserted.length,
        signalIds: inserted.map(r => r.id),
        breakdown: {
          staleOpportunities: crmSignals.filter(s => s.type === "stale_opportunity").length,
          pipelineAnomalies: crmSignals.filter(s => s.type === "pipeline_anomaly").length,
          dealStageConflicts: crmSignals.filter(s => s.type === "deal_stage_conflict").length,
          highValueLeads: crmSignals.filter(s => s.type === "high_value_lead").length,
          overdueActivities: crmSignals.filter(s => s.type === "overdue_activity").length,
        },
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to ingest Dataverse signals into Alloy");
    }
  },
);

export default router;
