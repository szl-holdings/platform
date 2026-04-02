import { Router, type IRouter } from "express";
import { authLimiter, readLimiter, writeLimiter, SHORT_CACHE, MEDIUM_CACHE } from "../middlewares/rate-limiters";
const _authLimiter = authLimiter;
const _readLimiter = readLimiter;
const _writeLimiter = writeLimiter;
import { adminGuard } from "../middlewares/admin-guard";
import { tenantScope } from "../middlewares/tenant-scope";
import documentsRouter from "./documents";
import healthRouter from "./health";
import healthIntegrationsRouter from "./health-integrations";
import webhooksRouter from "./webhooks";
import projectsRouter from "./projects";
import servicesRouter from "./services";
import authRouter from "./auth";
import oidcAuthRouter from "./oidc-auth";
import connectorsRouter from "./connectors";
import notificationsRouter from "./notifications";
import auditRouter from "./audit";
import billingRouter from "./billing";
import featureFlagsRouter from "./feature-flags";
import filesRouter from "./files";
import stephenRouter from "./stephen";
import vesselsRouter from "./vessels";
import aegisSocRouter from "./firestorm";
import lyteRouter from "./lyte";
import creativeWorkflowsRouter from "./dreamscape"; // creative-workflows module (legacy filename: dreamscape.ts)
import readinessRouter from "./readiness";
import adminRouter from "./admin";
import intelligenceRouter from "./intelligence";
import aegisIntelRouter from "./inca";
import bookingRouter from "./booking";
import holdingsRouter from "./holdings";
import carlotaJoRouter from "./carlota-jo";
import observabilityRouter from "./observability";
import alloyChatRouter from "./alloy-chat";
import jobsRouter from "./jobs";
import nueroMeshRouter from "./nuro-mesh";
import aiSafetyRouter from "./ai-safety";
import domainAgentsRouter from "./domain-agents/index";
import govDataRouter from "./gov-data";
import terraRouter from "./terra";
import terraDistressRouter from "./terra-distress";
import terraBrokerRouter from "./terra-broker";
import exportsRouter from "./exports";
import aegisOpsLiveRouter from "./msp-live";
import aegisOpsRouter from "./msp";
import terraLiveRouter from "./terra-live";
import agentTrainingRouter from "./agent-training";
import commentsRouter from "./comments";
import agentOsRouter from "./agent-os";
import cmsRouter from "./cms";
import doctrineRouter from "./doctrine";
import alloyRouter from "./alloy";
import lytePlatformRouter from "./lyte-platform";
import vesselsPlatformRouter from "./vessels-platform";
import capitalReadinessRouter from "./capital-readiness";
import certificationReadinessRouter from "./certification-readiness";
import ownershipControlRouter from "./ownership-control";
import coreRouter from "./core";
import lyteExtendedRouter from "./lyte-extended";
import vesselsExtendedRouter from "./vessels-extended";
import terraCrmRouter from "./terra-crm";
import microsoftGraphRouter from "./microsoft-graph";
import lyteObservabilityRouter from "./lyte-observability";
import tenantProvisioningRouter from "./tenant-provisioning";
import dataverseRouter from "./dataverse";
import microsoftIntegrationsRouter from "./microsoft-integrations";
import lyteLiveRouter from "./lyte-live";
import vesselsLiveRouter from "./vessels-live";
import integrationsRouter from "./integrations";
import configRouter from "./config";
import apmRouter from "./apm";
import scimRouter from "./scim";
import pushTokensRouter from "./push-tokens";
import pushNotificationsRouter from "./push-notifications";
import backupRouter from "./backup";
import demoRequestsRouter from "./demo-requests";
import contactRouter from "./contact";
import aegisSocLiveRouter from "./firestorm-live";
import publicStatusRouter from "./public-status";
import { feedbackRouter } from "./feedback";
import aiEngineRouter from "./ai-engine";
import analyticsRouter from "./analytics";
import invitationsRouter from "./invitations";
import { idempotencyMiddleware, optionalIdempotencyMiddleware } from "../middlewares/idempotency";
import lyteBillingRouter from "./lyte-billing";
import { alloyResearchRouter } from "./alloy-research";
import alloyChannelsRouter from "./alloy-channels";
import alloyEmailRouter from "./alloy-email";
import alloyMeetingsRouter from "./alloy-meetings";
import alloyDigestRouter from "./alloy-digest";
import alloyIntegrationsRouter from "./alloy-integrations";
import alloyVoiceRouter from "./alloy-voice";

const router: IRouter = Router();

router.use((req, _res, next) => {
  if (req.path.startsWith("/aegis/soc/")) {
    req.url = req.url.replace("/aegis/soc/", "/firestorm/");
  } else if (req.path.startsWith("/aegis/soc")) {
    req.url = req.url.replace("/aegis/soc", "/firestorm");
  } else if (req.path.startsWith("/aegis/ops/")) {
    req.url = req.url.replace("/aegis/ops/", "/msp/");
  } else if (req.path.startsWith("/aegis/ops")) {
    req.url = req.url.replace("/aegis/ops", "/msp");
  } else if (req.path.startsWith("/aegis/intel/")) {
    req.url = req.url.replace("/aegis/intel/", "/inca/");
  } else if (req.path.startsWith("/aegis/intel")) {
    req.url = req.url.replace("/aegis/intel", "/inca");
  }
  next();
});

router.use("/auth", _authLimiter);

router.use("/billing", _writeLimiter);
router.use("/billing", optionalIdempotencyMiddleware);
router.use("/billing/checkout", idempotencyMiddleware);
router.use("/billing/terra/subscribe", idempotencyMiddleware);
router.use("/billing/cancel-subscription", idempotencyMiddleware);
router.use("/billing/update-subscription", idempotencyMiddleware);
router.use("/connectors", _writeLimiter);
router.use("/notifications", _writeLimiter);
router.use("/feature-flags", _writeLimiter);
router.use("/projects", _writeLimiter);
router.use("/files", _writeLimiter);

router.use("/vessels", _readLimiter);
router.use("/intelligence", _readLimiter);
router.use("/firestorm", _readLimiter);
router.use("/inca", _readLimiter);
router.use("/msp", _readLimiter);
router.use("/aegis", _readLimiter);
router.use("/booking", _readLimiter);
router.use("/holdings/inquiries", _writeLimiter);
router.use("/holdings", _readLimiter);
router.use("/audit", _readLimiter);
router.use("/audit", tenantScope({ required: false }));
router.use("/contact", _writeLimiter);

router.use(healthRouter);
router.use(healthIntegrationsRouter);
router.use("/webhooks", _writeLimiter);
router.use("/webhooks", optionalIdempotencyMiddleware);
router.use(webhooksRouter);
router.use(projectsRouter);
router.use(servicesRouter);
router.use(authRouter);
router.use(oidcAuthRouter);
router.use(connectorsRouter);
router.use(notificationsRouter);
router.use(auditRouter);
router.use(billingRouter);
router.use(featureFlagsRouter);
router.use(filesRouter);

router.use(stephenRouter);
router.use(contactRouter);
router.use("/lyte", _readLimiter);
router.use("/lyte/billing", _writeLimiter);
router.use(lyteBillingRouter);
router.use("/lyte", lyteExtendedRouter);
router.use(lyteObservabilityRouter);
router.use("/vessels", _readLimiter);
router.use(vesselsExtendedRouter);
router.use("/lyte/platform", _readLimiter);
router.use(lytePlatformRouter);
router.use("/vessels/platform", _readLimiter);
router.use(vesselsPlatformRouter);
router.use(vesselsRouter);
router.use(aegisSocRouter);
router.use(aegisSocLiveRouter);
router.use(lyteRouter);
router.use(creativeWorkflowsRouter);
router.use(readinessRouter);
router.use("/admin", adminGuard);
router.use(adminRouter);
router.use(intelligenceRouter);
router.use(aegisIntelRouter);
router.use(bookingRouter);
router.use(holdingsRouter);
router.use("/demo-requests", _writeLimiter);
router.use(demoRequestsRouter);
router.use(carlotaJoRouter);
router.use("/observability", _readLimiter);
router.use(observabilityRouter);
router.use(alloyChatRouter);
router.use("/jobs", _readLimiter);
router.use("/jobs", tenantScope({ required: false }));
router.use(jobsRouter);
router.use("/nuro-mesh", _readLimiter);
router.use(nueroMeshRouter);
router.use("/ai-safety", _readLimiter);
router.use(aiSafetyRouter);
router.use("/domain-agents", _readLimiter);
router.use(domainAgentsRouter);
router.use("/gov", _readLimiter);
router.use(govDataRouter);

router.use("/terra", _readLimiter);
router.use(terraRouter);
router.use("/beacon", _readLimiter);
router.use(terraRouter);

router.use("/terra", _readLimiter);
router.use(terraDistressRouter);
router.use("/beacon", _readLimiter);
router.use(terraDistressRouter);

router.use("/terra", _readLimiter);
router.use(terraBrokerRouter);

router.use(aegisOpsLiveRouter);
router.use(aegisOpsRouter);

router.use("/terra", _readLimiter);
router.use(terraLiveRouter);
router.use("/beacon", _readLimiter);
router.use(terraLiveRouter);

router.use("/readiness", _readLimiter);
router.use(readinessRouter);
router.use("/aegis", _readLimiter);
router.use(readinessRouter);

router.use("/dreamscape", _readLimiter); // legacy path — creative-workflows module
router.use(creativeWorkflowsRouter);

router.use(agentTrainingRouter);
router.use("/comments", _writeLimiter);
router.use("/comments", tenantScope({ required: false }));
router.use(commentsRouter);
router.use("/agent-os", _readLimiter);
router.use(agentOsRouter);
router.use("/cms", _readLimiter);
router.use(cmsRouter);
router.use("/doctrine", _readLimiter);
router.use(doctrineRouter);

router.use("/alloy", _readLimiter);
router.use("/alloy/ingest", optionalIdempotencyMiddleware);
router.use("/alloy/workflows", _writeLimiter);
router.use("/alloy/workflows", optionalIdempotencyMiddleware);
router.use(alloyRouter);

router.use("/alloy/channels", _writeLimiter);
router.use(alloyChannelsRouter);

router.use("/alloy/email", _writeLimiter);
router.use(alloyEmailRouter);

router.use("/alloy/meetings", _writeLimiter);
router.use(alloyMeetingsRouter);

router.use("/alloy/digest", _readLimiter);
router.use(alloyDigestRouter);

router.use("/alloy/integrations", _writeLimiter);
router.use(alloyIntegrationsRouter);

router.use("/alloy/voice", _writeLimiter);
router.use(alloyVoiceRouter);

router.use("/capital", _writeLimiter);
router.use(capitalReadinessRouter);

router.use("/certification", _writeLimiter);
router.use(certificationReadinessRouter);

router.use("/ownership", _writeLimiter);
router.use(ownershipControlRouter);

router.use("/terra", _writeLimiter);
router.use(terraCrmRouter);
router.use("/beacon", _writeLimiter);
router.use(terraCrmRouter);

router.use("/core", _readLimiter);
router.use(coreRouter);

router.use("/microsoft", _readLimiter);
router.use(microsoftGraphRouter);

router.use("/admin/tenants", _writeLimiter);
router.use(tenantProvisioningRouter);

router.use("/dataverse", _readLimiter);
router.use("/dataverse", dataverseRouter);

router.use("/integrations", _readLimiter);
router.use(microsoftIntegrationsRouter);
router.use(integrationsRouter);

router.use("/lyte", _readLimiter);
router.use(lyteLiveRouter);

router.use("/vessels", _readLimiter);
router.use(vesselsLiveRouter);

router.use(configRouter);

router.use(apmRouter);

router.use("/documents", _writeLimiter);
router.use("/documents", tenantScope({ required: false }));
router.use(documentsRouter);

router.use(scimRouter);

router.use("/push-tokens", _writeLimiter);
router.use(pushTokensRouter);
router.use("/push-notifications", _writeLimiter);
router.use(pushNotificationsRouter);

router.use("/admin/backup", _writeLimiter);
router.use(backupRouter);

router.use("/exports", writeLimiter);
router.use("/exports", tenantScope({ required: false }));
router.use(exportsRouter);

router.use("/public", publicStatusRouter);
router.use("/admin/status", writeLimiter);
router.use("/admin/status", publicStatusRouter);

router.use("/feedback", writeLimiter);
router.use(feedbackRouter);

router.use("/ai", _readLimiter);
router.use("/ai/tools/execute", idempotencyMiddleware);
router.use(aiEngineRouter);

router.use("/analytics", _writeLimiter);
router.use(analyticsRouter);

router.use("/orgs", _writeLimiter);
router.use("/orgs", tenantScope({ required: false }));
// invitationsRouter is mounted WITHOUT a path prefix because its routes already
// start with /orgs/... (e.g. /orgs/:orgSlug/invite → /api/orgs/:orgSlug/invite).
// The middleware above applies rate limiting and tenant context to /orgs/* prefix.
router.use(invitationsRouter);

router.use("/alloy/research", _writeLimiter);
router.use("/alloy/browser", _writeLimiter);
router.use(alloyResearchRouter);

export default router;
