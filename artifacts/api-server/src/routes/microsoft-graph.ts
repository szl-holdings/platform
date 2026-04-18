import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { services } from "@szl-holdings/services";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router: IRouter = Router();

const msGraphLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Microsoft Graph rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

router.get("/microsoft/status", msGraphLimit, authMiddleware({ required: false }), async (_req: Request, res: Response) => {
  try {
    const adapter = services.microsoftGraph;
    const status = await adapter.testConnection();
    sendSuccess(res, {
      adapter: adapter.name,
      status: adapter.status,
      connected: status.connected,
      description: adapter.description,
      requiredEnvVars: adapter.requiredEnvVars,
      missingEnvVars: adapter.missingEnvVars,
      tenantId: status.tenantId,
      scopes: status.scopes,
      configuration: {
        MICROSOFT_TENANT_ID: process.env["MICROSOFT_TENANT_ID"] ? "configured" : "not configured",
        MICROSOFT_CLIENT_ID: process.env["MICROSOFT_CLIENT_ID"] ? "configured" : "not configured",
        MICROSOFT_CLIENT_SECRET: process.env["MICROSOFT_CLIENT_SECRET"] ? "configured" : "not configured",
        MICROSOFT_TEAMS_WEBHOOK_URL: process.env["MICROSOFT_TEAMS_WEBHOOK_URL"] ? "configured" : "not configured",
      },
      integrations: {
        sharePoint: "Read/write SharePoint document libraries — deal docs, compliance evidence, workflow attachments",
        oneDrive: "File storage and sharing across all apps",
        outlookCalendar: "Calendar sync for Carlota Jo booking availability",
        outlookContacts: "Contact sync with Terra CRM and Lyte",
        teams: "Webhook notifications for critical platform events",
        excelOnline: "Import/export property lists and financial models",
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to get Microsoft Graph status"); }
});

router.get("/microsoft/sharepoint/files", msGraphLimit, authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const siteId = req.query.siteId as string | undefined;
    const libraryPath = (req.query.path as string) ?? "/Shared Documents";
    const adapter = services.microsoftGraph;
    const files = await adapter.listSharePointFiles(siteId, libraryPath);
    sendSuccess(res, {
      source: "Microsoft SharePoint Online — Document Libraries",
      siteId: siteId ?? "default",
      libraryPath,
      count: files.length,
      files,
      isLive: adapter.isLive,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to list SharePoint files"); }
});

router.get("/microsoft/onedrive/files", msGraphLimit, authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const adapter = services.microsoftGraph;
    const files = await adapter.listOneDriveFiles(userId);
    sendSuccess(res, {
      source: "Microsoft OneDrive — Personal Drive",
      userId: userId ?? "current user",
      count: files.length,
      files,
      isLive: adapter.isLive,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to list OneDrive files"); }
});

router.get("/microsoft/calendar/events", msGraphLimit, authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const daysAhead = req.query.days ? Math.min(Number(req.query.days), 90) : 14;
    const adapter = services.microsoftGraph;
    const events = await adapter.listCalendarEvents(userId, daysAhead);
    sendSuccess(res, {
      source: "Microsoft Outlook Calendar — Event Feed",
      userId: userId ?? "current user",
      daysAhead,
      count: events.length,
      events,
      isLive: adapter.isLive,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to list calendar events"); }
});

router.get("/microsoft/contacts", msGraphLimit, authMiddleware({ required: false }), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const adapter = services.microsoftGraph;
    const contacts = await adapter.listContacts(userId);
    sendSuccess(res, {
      source: "Microsoft Outlook Contacts",
      userId: userId ?? "current user",
      count: contacts.length,
      contacts,
      isLive: adapter.isLive,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to list Outlook contacts"); }
});

router.get("/microsoft/sharepoint/sites", msGraphLimit, authMiddleware({ required: false }), async (_req: Request, res: Response) => {
  try {
    const adapter = services.microsoftGraph;
    const sites = await adapter.listSharePointSites();
    sendSuccess(res, {
      source: "Microsoft SharePoint Online — Sites",
      count: sites.length,
      sites,
      isLive: adapter.isLive,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to list SharePoint sites"); }
});

router.post("/microsoft/teams/notify", msGraphLimit, authMiddleware({ required: false }), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { text, title, color, channelId, webHookUrl } = req.body;
    if (!text || typeof text !== "string") {
      sendBadRequest(res, "text is required");
      return;
    }
    const adapter = services.microsoftGraph;
    const result = await adapter.sendTeamsNotification({ text, title, color, channelId, webHookUrl });
    sendSuccess(res, {
      source: "Microsoft Teams Webhook",
      ...result,
      isLive: adapter.isLive,
      sentAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to send Teams notification"); }
});

router.get("/microsoft/sync", msGraphLimit, authMiddleware({ required: false }), async (_req: Request, res: Response) => {
  try {
    const adapter = services.microsoftGraph;
    const result = await adapter.sync();
    sendSuccess(res, {
      source: "Microsoft 365 — Full Sync (SharePoint + OneDrive + Calendar + Contacts)",
      ...result,
      isLive: adapter.isLive,
    });
  } catch (err) { handleRouteError(res, err, "Failed to sync Microsoft Graph data"); }
});

export default router;
