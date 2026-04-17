import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";

import stephenRouter from "../stephen";
import carlotaJoRouter from "../carlota-jo";
import holdingsRouter from "../holdings";
import capitalReadinessRouter from "../capital-readiness";
import certificationReadinessRouter from "../certification-readiness";
import ownershipControlRouter from "../ownership-control";
import fundOpsRouter from "../fund-ops";
import bookingRouter from "../booking";
import crmRouter from "../crm";
import creativeWorkflowsRouter from "../dreamscape";
import briefingRouter from "../briefing";
import cortexRouter from "../cortex";
import innovationEngineRouter from "../innovation-engine";
import { autopilotRouter } from "../autopilot";
import monteCarloRouter from "../monte-carlo";
import signalChainsRouter from "../signal-chains";
import crossDomainQueryRouter from "../cross-domain-query";
import correlationMapRouter from "../correlation-map";
import realtimeRouter from "../realtime";
import helmRouter from "../helm-console";
import crossAppHandoffsRouter from "../cross-app-handoffs";
import multiplayerSessionsRouter from "../multiplayer-sessions";
import prismBusApiRouter from "../prism-bus-api";
import forgeRuntimeApiRouter from "../forge-runtime-api";
import covenantPolicyApiRouter from "../covenant-policy-api";
import imperiumRouter from "../imperium";
import distributionOsRouter from "../distribution-os";
import dosPublicApiRouter from "../dos-public-api";
import integrationsRouter from "../integrations";
import microsoftGraphRouter from "../microsoft-graph";
import microsoftIntegrationsRouter from "../microsoft-integrations";
import pushTokensRouter from "../push-tokens";
import pushNotificationsRouter from "../push-notifications";
import pushPreferencesRouter from "../push-preferences";
import pushHistoryRouter from "../push-history";
import pushAnalyticsRouter from "../push-analytics";
import webPushSubscriptionsRouter from "../web-push-subscriptions";
import notificationRecipientsRouter from "../notification-recipients";
import supportRouter from "../support";
import dataRetentionRouter from "../data-retention";
import investorAnalyticsRouter from "../investor-analytics";

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

  router.use(stephenRouter);
  router.use(carlotaJoRouter);

  router.use("/holdings/inquiries", _writeLimiter);
  router.use("/holdings", _readLimiter);
  router.use(holdingsRouter);

  router.use("/capital", _writeLimiter);
  router.use(capitalReadinessRouter);

  router.use("/certification", _writeLimiter);
  router.use(certificationReadinessRouter);

  router.use("/ownership", _writeLimiter);
  router.use(ownershipControlRouter);

  router.use("/fund-ops", _writeLimiter);
  router.use("/fund-ops", _readLimiter);
  router.use(fundOpsRouter);

  router.use("/booking", _readLimiter);
  router.use(bookingRouter);

  router.use("/salesforce", _readLimiter);
  router.use("/hubspot", _readLimiter);
  router.use("/dynamics", _readLimiter);
  router.use("/crm", _writeLimiter);
  router.use(crmRouter);

  router.use("/dreamscape", _readLimiter);
  router.use(creativeWorkflowsRouter);

  router.use("/briefing", _readLimiter);
  router.use("/briefing", _writeLimiter);
  router.use(briefingRouter);

  router.use("/cortex", _writeLimiter);
  router.use(cortexRouter);

  router.use("/innovation-engine", _readLimiter);
  router.use("/innovation-engine", innovationEngineRouter);

  router.use("/autopilot", _readLimiter);
  router.use(autopilotRouter);

  router.use("/monte-carlo", _readLimiter);
  router.use(monteCarloRouter);

  router.use("/signal-chains", _readLimiter);
  router.use("/signal-chains", _writeLimiter);
  router.use(signalChainsRouter);

  router.use("/cross-domain-query", _writeLimiter);
  router.use(crossDomainQueryRouter);

  router.use("/correlation-map", _readLimiter);
  router.use(correlationMapRouter);

  router.use("/realtime", _readLimiter);
  router.use(realtimeRouter);

  router.use("/helm", _readLimiter);
  router.use(helmRouter);

  router.use("/cross-app", _readLimiter);
  router.use("/cross-app", _writeLimiter);
  router.use(crossAppHandoffsRouter);

  router.use("/sessions/command", _readLimiter);
  router.use("/sessions/command", _writeLimiter);
  router.use(multiplayerSessionsRouter);

  router.use("/prism-bus", _readLimiter);
  router.use(prismBusApiRouter);

  router.use("/forge", _writeLimiter);
  router.use(forgeRuntimeApiRouter);

  router.use("/covenant", _readLimiter);
  router.use(covenantPolicyApiRouter);

  router.use("/imperium", _readLimiter);
  router.use(imperiumRouter);

  router.use("/distribution-os", _writeLimiter);
  router.use("/distribution-os", distributionOsRouter);
  // /v1 — public API gated by dosApiKeyAuth (API key), not user session. Exempt from tenantScope by design.
  router.use("/v1", dosPublicApiRouter);

  router.use("/integrations", _readLimiter);
  router.use(microsoftIntegrationsRouter);
  router.use(integrationsRouter);

  router.use("/microsoft", _readLimiter);
  router.use(microsoftGraphRouter);

  router.use("/push-tokens", _writeLimiter);
  router.use(pushTokensRouter);
  router.use("/push-notifications", _writeLimiter);
  router.use(pushNotificationsRouter);
  router.use(pushPreferencesRouter);
  router.use(pushHistoryRouter);
  router.use(pushAnalyticsRouter);

  router.use("/web-push", _writeLimiter);
  router.use(webPushSubscriptionsRouter);

  router.use("/notification-recipients", _writeLimiter);
  router.use(notificationRecipientsRouter);

  router.use("/support", _readLimiter);
  router.use("/support", _writeLimiter);
  router.use(supportRouter);

  router.use("/data-retention", _readLimiter);
  router.use("/data-retention", _writeLimiter);
  router.use(dataRetentionRouter);

  router.use("/analytics/investor", _readLimiter);
  router.use(investorAnalyticsRouter);
}
