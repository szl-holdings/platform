import { Router, type IRouter, type Request, type Response } from "express";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { prismBus, prismConnectorRegistry } from "@szl-holdings/prism-bus";
import { PRISM_BUILT_IN_TOOLS, PRISM_DOMAIN_TOOLS } from "@szl-holdings/prism-bus";
import type { PrismDomain } from "@szl-holdings/prism-bus";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router: IRouter = Router();

PRISM_BUILT_IN_TOOLS.forEach(tool => prismConnectorRegistry.registerTool(tool));

router.get("/prism-bus/status", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const stats = prismBus.getStats();
    const health = prismConnectorRegistry.getHealthSummary();
    sendSuccess(res, {
      prismBus: {
        status: "active",
        stats,
      },
      connectors: health,
      registeredTools: prismConnectorRegistry.getAllTools().length,
    });
  } catch (err) {
    handleRouteError(res, err, "PRISM BUS status");
  }
});

router.get("/prism-bus/events", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { domain, type, limit, since, correlationId } = req.query as {
      domain?: string;
      type?: string;
      limit?: string;
      since?: string;
      correlationId?: string;
    };

    const callerTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isSuperAdmin = req.user?.roles?.includes("super_admin") || req.user?.roles?.includes("admin");

    const events = prismBus.getHistory({
      domain: domain as PrismDomain | undefined,
      type: type as any,
      limit: limit ? Number(limit) : 100,
      since: since ? Number(since) : undefined,
      correlationId,
    }).filter(e =>
      isSuperAdmin ||
      e.tenantId == null ||
      e.tenantId === callerTenantId
    );

    sendSuccess(res, { events, count: events.length });
  } catch (err) {
    handleRouteError(res, err, "PRISM BUS events");
  }
});

router.post("/prism-bus/publish", authMiddleware(), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { type, domain, sourceId, payload, severity, correlationId, tenantId } = req.body as {
      type?: string;
      domain?: string;
      sourceId?: string;
      payload?: Record<string, unknown>;
      severity?: string;
      correlationId?: string;
      tenantId?: string;
    };

    if (!type || !domain || !sourceId) {
      sendBadRequest(res, "type, domain, and sourceId are required");
      return;
    }

    const authenticatedTenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isSuperAdmin = req.user?.roles?.includes("super_admin") || req.user?.roles?.includes("admin");
    const callerTenantId = isSuperAdmin
      ? (tenantId ?? authenticatedTenantId)
      : authenticatedTenantId;

    const event = await prismBus.publish({
      type: type as Parameters<typeof prismBus.publish>[0]["type"],
      domain: domain as PrismDomain,
      sourceId,
      payload: payload ?? {},
      severity: (severity as "info" | "low" | "medium" | "high" | "critical") ?? "info",
      correlationId,
      tenantId: callerTenantId,
      userId: req.user?.id?.toString() ?? null,
    });

    sendSuccess(res, { event });
  } catch (err) {
    handleRouteError(res, err, "PRISM BUS publish");
  }
});

router.get("/prism-bus/tools", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { domain } = req.query as { domain?: string };
    const tools = domain
      ? prismConnectorRegistry.getToolsForDomain(domain as PrismDomain)
      : PRISM_BUILT_IN_TOOLS;

    sendSuccess(res, { tools, count: tools.length, domain: domain ?? "all" });
  } catch (err) {
    handleRouteError(res, err, "PRISM BUS tools");
  }
});

router.get("/prism-bus/domain-tools", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    sendSuccess(res, { domainTools: PRISM_DOMAIN_TOOLS });
  } catch (err) {
    handleRouteError(res, err, "PRISM BUS domain-tools");
  }
});

router.get("/prism-bus/connectors", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { domain } = req.query as { domain?: string };
    const connectors = domain
      ? prismConnectorRegistry.getConnectorsForDomain(domain as PrismDomain)
      : prismConnectorRegistry.getAllConnectors();
    const states = prismConnectorRegistry.getAllStates();

    sendSuccess(res, {
      connectors,
      states,
      health: prismConnectorRegistry.getHealthSummary(),
    });
  } catch (err) {
    handleRouteError(res, err, "PRISM BUS connectors");
  }
});

export default router;
