import { Router, type IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import { lazyMount, lazyRegister, lazyMatch } from "../../lib/lazy-router";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  router.use("/holdings", tenantScope({ required: true }));
  router.use("/capital", tenantScope({ required: true }));
  router.use("/certification", tenantScope({ required: true }));
  router.use("/ownership", tenantScope({ required: true }));
  router.use("/fund-ops", tenantScope({ required: true }));
  router.use("/booking", tenantScope({ required: true }));
  router.use("/salesforce", tenantScope({ required: true }));
  router.use("/hubspot", tenantScope({ required: true }));
  router.use("/dynamics", tenantScope({ required: true }));
  router.use("/crm", tenantScope({ required: true }));
  router.use("/dreamscape", tenantScope({ required: true }));
  router.use("/briefing", tenantScope({ required: true }));
  router.use("/cortex", tenantScope({ required: true }));
  router.use("/innovation-engine", tenantScope({ required: true }));
  router.use("/autopilot", tenantScope({ required: true }));
  router.use("/monte-carlo", tenantScope({ required: true }));
  router.use("/signal-chains", tenantScope({ required: true }));
  router.use("/cross-domain-query", tenantScope({ required: true }));
  router.use("/correlation-map", tenantScope({ required: true }));
  router.use("/realtime", tenantScope({ required: true }));
  router.use("/helm", tenantScope({ required: true }));
  router.use("/cross-app", tenantScope({ required: true }));
  router.use("/sessions/command", tenantScope({ required: true }));
  router.use("/prism-bus", tenantScope({ required: true }));
  router.use("/forge", tenantScope({ required: true }));
  router.use("/covenant", tenantScope({ required: true }));
  router.use("/imperium", tenantScope({ required: true }));
  router.use("/distribution-os", tenantScope({ required: true }));
  router.use("/integrations", tenantScope({ required: true }));
  router.use("/microsoft", tenantScope({ required: true }));
  router.use("/push-tokens", tenantScope({ required: true }));
  router.use("/push-notifications", tenantScope({ required: true }));
  router.use("/push-preferences", tenantScope({ required: true }));
  router.use("/push-history", tenantScope({ required: true }));
  router.use("/push-analytics", tenantScope({ required: true }));
  router.use("/web-push", tenantScope({ required: true }));
  router.use("/notification-recipients", tenantScope({ required: true }));
  router.use("/support", tenantScope({ required: true }));
  router.use("/data-retention", tenantScope({ required: true }));
  router.use("/analytics/investor", tenantScope({ required: true }));
  router.use("/stephen", tenantScope({ required: true }));

  router.use(lazyMatch("/stephen", () => import("../stephen"), "stephen"));
  router.use(lazyMatch(["/booking", "/portal", "/carlota"], () => import("../carlota-jo"), "carlota-jo"));

  router.use("/holdings/inquiries", _writeLimiter);
  router.use("/holdings", _readLimiter);
  router.use(lazyMatch(["/holdings", "/investors"], () => import("../holdings"), "holdings"));

  router.use("/capital", _writeLimiter);
  router.use(lazyMatch("/capital", () => import("../capital-readiness"), "capital-readiness"));

  router.use("/certification", _writeLimiter);
  router.use(lazyMatch("/certification", () => import("../certification-readiness"), "certification-readiness"));

  router.use("/ownership", _writeLimiter);
  router.use(lazyMatch("/ownership", () => import("../ownership-control"), "ownership-control"));

  router.use("/fund-ops", _writeLimiter);
  router.use("/fund-ops", _readLimiter);
  router.use(lazyMatch("/fund-ops", () => import("../fund-ops"), "fund-ops"));

  router.use("/booking", _readLimiter);
  router.use(lazyMatch("/booking", () => import("../booking"), "booking"));

  router.use("/salesforce", _readLimiter);
  router.use("/hubspot", _readLimiter);
  router.use("/dynamics", _readLimiter);
  router.use("/crm", _writeLimiter);
  router.use(lazyMatch(["/salesforce", "/hubspot", "/dynamics", "/crm"], () => import("../crm"), "crm"));

  router.use("/dreamscape", _readLimiter);
  router.use(lazyMatch("/dreamscape", () => import("../dreamscape"), "dreamscape"));

  router.use("/briefing", _readLimiter);
  router.use("/briefing", _writeLimiter);
  router.use(lazyMatch("/briefing", () => import("../briefing"), "briefing"));

  router.use("/cortex", _writeLimiter);
  router.use(lazyMatch("/cortex", () => import("../cortex"), "cortex"));

  router.use("/innovation-engine", _readLimiter);
  router.use("/innovation-engine", lazyMount(() => import("../innovation-engine"), "innovation-engine"));

  router.use("/autopilot", _readLimiter);
  router.use(lazyMatch("/autopilot", () => import("../autopilot").then(m => ({ default: m.autopilotRouter })), "autopilot"));

  router.use("/monte-carlo", _readLimiter);
  router.use(lazyMatch("/monte-carlo", () => import("../monte-carlo"), "monte-carlo"));

  router.use("/signal-chains", _readLimiter);
  router.use("/signal-chains", _writeLimiter);
  router.use(lazyMatch("/signal-chains", () => import("../signal-chains"), "signal-chains"));

  router.use("/cross-domain-query", _writeLimiter);
  router.use(lazyMatch("/cross-domain-query", () => import("../cross-domain-query"), "cross-domain-query"));

  router.use("/correlation-map", _readLimiter);
  router.use(lazyMatch("/correlation-map", () => import("../correlation-map"), "correlation-map"));

  router.use("/realtime", _readLimiter);
  router.use(lazyMatch("/realtime", () => import("../realtime"), "realtime"));

  router.use("/helm", _readLimiter);
  router.use(lazyMatch("/helm", () => import("../helm-console"), "helm-console"));

  router.use("/cross-app", _readLimiter);
  router.use("/cross-app", _writeLimiter);
  router.use(lazyMatch("/cross-app", () => import("../cross-app-handoffs"), "cross-app-handoffs"));

  router.use("/sessions/command", _readLimiter);
  router.use("/sessions/command", _writeLimiter);
  router.use(lazyMatch("/sessions", () => import("../multiplayer-sessions"), "multiplayer-sessions"));

  router.use("/prism-bus", _readLimiter);
  router.use(lazyMatch("/prism-bus", () => import("../prism-bus-api"), "prism-bus-api"));

  router.use("/forge", _writeLimiter);
  router.use(lazyMatch("/forge", () => import("../forge-runtime-api"), "forge-runtime-api"));

  router.use("/covenant", _readLimiter);
  router.use(lazyMatch("/covenant", () => import("../covenant-policy-api"), "covenant-policy-api"));

  router.use("/imperium", _readLimiter);
  router.use(lazyMatch("/imperium", () => import("../imperium"), "imperium"));

  router.use("/distribution-os", _writeLimiter);
  router.use("/distribution-os", lazyRegister(() => import("../distribution-os"), "distribution-os"));
  // /v1 — public API gated by dosApiKeyAuth (API key), not user session. Exempt from tenantScope by design.
  router.use("/v1", lazyMount(() => import("../dos-public-api"), "dos-public-api"));

  router.use("/integrations", _readLimiter);
  router.use(lazyMatch("/integrations", () => import("../microsoft-integrations"), "microsoft-integrations"));
  router.use(lazyMatch("/integrations", () => import("../integrations"), "integrations"));

  router.use("/microsoft", _readLimiter);
  router.use(lazyMatch("/microsoft", () => import("../microsoft-graph"), "microsoft-graph"));

  router.use("/push-tokens", _writeLimiter);
  router.use(lazyMatch("/push-tokens", () => import("../push-tokens"), "push-tokens"));
  router.use("/push-notifications", _writeLimiter);
  router.use(lazyMatch("/push-notifications", () => import("../push-notifications"), "push-notifications"));
  router.use(lazyMatch("/push-preferences", () => import("../push-preferences"), "push-preferences"));
  router.use(lazyMatch("/push-history", () => import("../push-history"), "push-history"));
  router.use(lazyMatch("/push-analytics", () => import("../push-analytics"), "push-analytics"));

  router.use("/web-push", _writeLimiter);
  router.use(lazyMatch("/web-push", () => import("../web-push-subscriptions"), "web-push-subscriptions"));

  router.use("/notification-recipients", _writeLimiter);
  router.use(lazyMatch("/notification-recipients", () => import("../notification-recipients"), "notification-recipients"));

  router.use("/support", _readLimiter);
  router.use("/support", _writeLimiter);
  router.use(lazyMatch("/support", () => import("../support"), "support"));

  router.use("/data-retention", _readLimiter);
  router.use("/data-retention", _writeLimiter);
  router.use(lazyMatch("/data-retention", () => import("../data-retention"), "data-retention"));

  router.use("/analytics/investor", _readLimiter);
  router.use(lazyMatch("/investor-analytics", () => import("../investor-analytics"), "investor-analytics"));

  // Suppress unused-Router warning (kept import for compatibility with consumers).
  void Router;
}
