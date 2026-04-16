import { Router, type IRouter } from "express";
import copilotRouter from "./copilot";
import mcpRouter from "./mcp";
import { SHORT_CACHE, MEDIUM_CACHE } from "../middlewares/rate-limiters";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter, strictAuthSlidingLimiter } from "../middlewares/sliding-window-limiter";
import analyticsEngineRouter from "./analytics-engine";
const _authLimiter = strictAuthSlidingLimiter;
const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;
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
import storageRouter from "./storage";
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
import a2aRouter from "./a2a";
import nueroMeshAdvancedRouter from "./nuro-mesh-advanced";
import controlTowerRouter from "./control-tower";
import aiSafetyRouter from "./ai-safety";
import domainAgentsRouter from "./domain-agents/index";
import govDataRouter from "./gov-data";
import terraRouter from "./terra";
import terraDistressRouter from "./terra-distress";
import terraBrokerRouter from "./terra-broker";
import exportsRouter from "./exports";
import reportsRouter from "./reports";
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
import fundOpsRouter from "./fund-ops";
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
import pushPreferencesRouter from "./push-preferences";
import pushHistoryRouter from "./push-history";
import pushAnalyticsRouter from "./push-analytics";
import backupRouter from "./backup";
import demoRequestsRouter from "./demo-requests";
import contactRouter from "./contact";
import aegisSocLiveRouter from "./firestorm-live";
import commandRouter from "./command";
import firestormCommandRouter from "./firestorm-command-surfaces";
import publicStatusRouter from "./public-status";
import opsManagementRouter from "./ops-management";
import { feedbackRouter } from "./feedback";
import aiEngineRouter from "./ai-engine";
import analyticsRouter from "./analytics";
import invitationsRouter from "./invitations";
import { idempotencyMiddleware, optionalIdempotencyMiddleware } from "../middlewares/idempotency";
import gdprRouter from "./gdpr";
import privacyRouter from "./privacy";
import lyteBillingRouter from "./lyte-billing";
import { alloyResearchRouter } from "./alloy-research";
import alloyChannelsRouter from "./alloy-channels";
import prismCounselNyRouter from "./prism-counsel-ny";
import prismCounselOpsRouter from "./prism-counsel-ops";
import prismCounselS31Router from "./prism-counsel-s31";
import { prismCounselPilotRouter } from "./prism-counsel-pilot";
import prismCounselCoreRouter from "./prism-counsel-core";
import { prismCounselPilotOneRouter } from "./prism-counsel-pilot-one";
import prismCounselReviewRouter from "./prism-counsel-review";
import prismCounselPurviewRouter from "./prism-counsel-purview";
import prismCounselCourtRouter from "./prism-counsel-court";
import alloyEmailRouter from "./alloy-email";
import alloyMeetingsRouter from "./alloy-meetings";
import alloyDigestRouter from "./alloy-digest";
import alloyIntegrationsRouter from "./alloy-integrations";
import alloyVoiceRouter from "./alloy-voice";
import governanceRouter from "./governance";
import alloyGovernanceRouter from "./alloy-governance";
import approvalsRouter from "./approvals";
import proofChainRouter from "./proof-chain";
import worldlineRouter from "./worldline";
import distributionOsRouter from "./distribution-os";
import dosPublicApiRouter from "./dos-public-api";
import prismBusApiRouter from "./prism-bus-api";
import forgeRuntimeApiRouter from "./forge-runtime-api";
import covenantPolicyApiRouter from "./covenant-policy-api";
import receiptGraphRouter from "./receipt-graph";
import pulseEvalsRouter from "./pulse-evals";
import genAITelemetryRouter from "./genai-telemetry";
import outcomeGraphRouter from "./outcome-graph";
import atlasRouter from "./atlas-artifacts";
import helmRouter from "./helm-console";
import telemetryRouter from "./telemetry";
import crossAppHandoffsRouter from "./cross-app-handoffs";
import alloyCognitiveLearningRouter from "./alloy-cognitive-learning";
import agentAutonomyRouter from "./agent-autonomy";
import alloySkillsRouter from "./alloy-skills";
import externalIntegrationsRouter from "./external-integrations";
import agentFederationRouter from "./agent-federation";
import streamingIngestionRouter from "./streaming-ingestion";
import fineTuningRouter from "./fine-tuning";
import connectorHubRouter from "./connector-hub";
import complianceRouter from "./compliance";
import crmRouter from "./crm";
import consciousnessRouter from "./consciousness";
import ragKnowledgeRouter from "./rag-knowledge";
import vesselsTradingRouter from "./vessels-trading";
import vesselsInsuranceRouter from "./vessels-insurance";
import rmmRouter from "./rmm";
import ontologyRouter from "./ontology";
import digitalTwinsRouter from "./digital-twins";
import fusionRouter from "./fusion";
import knowledgeGraphRouter from "./knowledge-graph";
import mlPipelineRouter from "./ml-pipeline";
import meteringRouter from "./metering";
import realtimeRouter from "./realtime";
import monteCarloRouter from "./monte-carlo";
import partnerPortalRouter from "./partner-portal";
import deltaSyncRouter from "./delta-sync";
import changesRouter from "./changes";
import webPushSubscriptionsRouter from "./web-push-subscriptions";
import notificationRecipientsRouter from "./notification-recipients";
import imperiumRouter from "./imperium";
import innovationEngineRouter from "./innovation-engine";
import cortexRouter from "./cortex";
import briefingRouter from "./briefing";
import auditChainRouter from "./audit-chain";
import revenueIntelligenceRouter from "./revenue-intelligence";
import multiplayerSessionsRouter from "./multiplayer-sessions";
import { autopilotRouter } from "./autopilot";
import signalChainsRouter from "./signal-chains";
import crossDomainQueryRouter from "./cross-domain-query";
import correlationMapRouter from "./correlation-map";
import unifiedSettingsRouter from "./unified-settings";
import tenantHealthRouter from "./tenant-health";

const router: IRouter = Router();


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
router.use("/storage/uploads", _writeLimiter);
router.use("/storage", _readLimiter);
router.use(storageRouter);

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
router.use(externalIntegrationsRouter);
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
const FIRESTORM_SOC_PATHS = new Set([
  "scenarios","assessments","simulations","findings","risk-scores","reports",
  "incidents","compliance","alerts","vulnerabilities","live","soar","stix",
  "taxii","mitre","mitre-detections","cves","command","assets","cases",
  "workflow-actions","hardening-controls","hardening-summary","ingest",
  "tradecraft","soc-dashboard",
]);
router.use((req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => {
  const m = req.url.match(/^\/aegis\/([\w-]+)/);
  if (m && FIRESTORM_SOC_PATHS.has(m[1])) req.url = req.url.replace(/^\/aegis\//, "/firestorm/");
  next();
});
router.use(aegisSocRouter);
router.use(aegisSocLiveRouter);
router.use("/monte-carlo", _readLimiter);
router.use(monteCarloRouter);

router.use("/command", _readLimiter);
router.use("/command", _writeLimiter);
router.use("/command", commandRouter);
router.use("/firestorm/command", _readLimiter);
router.use(firestormCommandRouter);
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
router.use(nueroMeshAdvancedRouter);
router.use("/control-tower", _readLimiter);
router.use("/control-tower", _writeLimiter);
router.use(controlTowerRouter);
router.use(a2aRouter);
router.use("/rag", _readLimiter);
router.use(ragKnowledgeRouter);
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
router.use("/vessels/trading", _readLimiter);
router.use(vesselsTradingRouter);
router.use("/vessels/insurance", _readLimiter);
router.use(vesselsInsuranceRouter);
router.use("/msp", _readLimiter);
router.use("/msp", rmmRouter);

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

router.use("/governance", _writeLimiter);
router.use("/governance", governanceRouter);

router.use("/alloy/policies", _writeLimiter);
router.use("/alloy/governance", _writeLimiter);
router.use("/alloy/usage", _writeLimiter);
router.use("/alloy/admin", _readLimiter);
router.use(alloyGovernanceRouter);

router.use("/capital", _writeLimiter);
router.use(capitalReadinessRouter);

router.use("/certification", _writeLimiter);
router.use(certificationReadinessRouter);

router.use("/ownership", _writeLimiter);
router.use(ownershipControlRouter);

router.use("/fund-ops", _writeLimiter);
router.use("/fund-ops", _readLimiter);
router.use(fundOpsRouter);

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
router.use(pushPreferencesRouter);
router.use(pushHistoryRouter);
router.use(pushAnalyticsRouter);

router.use("/admin/backup", _writeLimiter);
router.use(backupRouter);

router.use("/exports", _writeLimiter);
router.use("/exports", tenantScope({ required: false }));
router.use(exportsRouter);

router.use("/reports", _readLimiter);
router.use(reportsRouter);

router.use("/public", publicStatusRouter);
router.use("/admin/status", _writeLimiter);
router.use("/admin/status", publicStatusRouter);

router.use(opsManagementRouter);

router.use("/feedback", _writeLimiter);
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

router.use("/prism-counsel", _readLimiter);
router.use("/prism-counsel", _writeLimiter);
router.use(prismCounselCoreRouter);
router.use("/prism-counsel", prismCounselOpsRouter);
router.use("/prism-counsel/s31", prismCounselS31Router);
router.use("/prism-counsel/pilot", prismCounselPilotRouter);
router.use("/prism-counsel/pilot-one", prismCounselPilotOneRouter);
router.use("/prism-counsel", prismCounselReviewRouter);
router.use("/prism-counsel", prismCounselPurviewRouter);
router.use("/prism-counsel", prismCounselCourtRouter);
router.use(prismCounselNyRouter);

router.use("/mcp", _readLimiter);
router.use(mcpRouter);

router.use("/approvals", _writeLimiter);
router.use(approvalsRouter);

router.use("/proof-chain", _readLimiter);
router.use(proofChainRouter);

router.use("/worldline", _writeLimiter);
router.use(worldlineRouter);

router.use("/distribution-os", _writeLimiter);
router.use("/distribution-os", distributionOsRouter);

router.use("/v1", dosPublicApiRouter);

router.use("/prism-bus", _readLimiter);
router.use(prismBusApiRouter);

router.use("/forge", _writeLimiter);
router.use(forgeRuntimeApiRouter);

router.use("/covenant", _readLimiter);
router.use(covenantPolicyApiRouter);

router.use("/receipt-graph", _readLimiter);
router.use("/receipt-graph", _writeLimiter);
router.use(receiptGraphRouter);

router.use("/pulse-evals", _readLimiter);
router.use("/pulse-evals", _writeLimiter);
router.use(pulseEvalsRouter);

router.use("/genai-telemetry", _readLimiter);
router.use("/genai-telemetry", _writeLimiter);
router.use(genAITelemetryRouter);

router.use("/outcome-graph", _writeLimiter);
router.use(outcomeGraphRouter);

router.use("/atlas", _writeLimiter);
router.use(atlasRouter);

router.use("/helm", _readLimiter);
router.use(helmRouter);

router.use("/telemetry", _writeLimiter);
router.use(telemetryRouter);

router.use("/cross-app", _readLimiter);
router.use("/cross-app", _writeLimiter);
router.use(crossAppHandoffsRouter);

router.use("/alloy/cognitive", _readLimiter);
router.use("/alloy/cognitive", _writeLimiter);
router.use(alloyCognitiveLearningRouter);

router.use("/federation", _readLimiter);
router.use(agentFederationRouter);

router.use("/stream", _readLimiter);
router.use(streamingIngestionRouter);

router.use("/fine-tuning", _readLimiter);
router.use("/fine-tuning", _writeLimiter);
router.use(fineTuningRouter);

router.use("/connector-hub", _readLimiter);
router.use("/connector-hub", _writeLimiter);
router.use(connectorHubRouter);

router.use(consciousnessRouter);

router.use("/a2a", _readLimiter);
router.use("/a2a", _writeLimiter);
router.use(a2aRouter);

router.use("/agent-autonomy", _readLimiter);
router.use("/agent-autonomy", _writeLimiter);
router.use(agentAutonomyRouter);

router.use("/alloy/skills", _readLimiter);
router.use("/alloy/skills", _writeLimiter);
router.use("/alloy/agents", _readLimiter);
router.use("/alloy/agents", _writeLimiter);
router.use("/alloy/performance", _readLimiter);
router.use("/alloy/performance", _writeLimiter);
router.use("/alloy/self-improvement", _readLimiter);
router.use("/alloy/self-improvement", _writeLimiter);
router.use("/alloy/decisions", _writeLimiter);
router.use(alloySkillsRouter);

router.use("/compliance", _readLimiter);
router.use("/compliance", _writeLimiter);
router.use(complianceRouter);

router.use("/salesforce", _readLimiter);
router.use("/hubspot", _readLimiter);
router.use("/dynamics", _readLimiter);
router.use("/crm", _writeLimiter);
router.use(crmRouter);

router.use("/ontology", _readLimiter);
router.use("/ontology", _writeLimiter);
router.use(ontologyRouter);

router.use("/digital-twins", _readLimiter);
router.use("/digital-twins", _writeLimiter);
router.use(digitalTwinsRouter);

router.use("/fusion", _readLimiter);
router.use("/fusion", _writeLimiter);
router.use(fusionRouter);

router.use("/knowledge", _readLimiter);
router.use("/knowledge", _writeLimiter);
router.use("/knowledge", knowledgeGraphRouter);

router.use("/ml", _readLimiter);
router.use("/ml", _writeLimiter);
router.use(mlPipelineRouter);

router.use("/analytics-engine", _readLimiter);
router.use("/analytics-engine", _writeLimiter);
router.use(analyticsEngineRouter);

router.use("/metering", _readLimiter);
router.use("/metering", _writeLimiter);
router.use(meteringRouter);

router.use("/realtime", _readLimiter);
router.use(realtimeRouter);

router.use("/copilot", _writeLimiter);
router.use(copilotRouter);

router.use(gdprRouter);

router.use(privacyRouter);

router.use("/partner", _writeLimiter);
router.use("/partner", _readLimiter);
router.use("/org-branding", _readLimiter);
router.use("/orgs/:orgId/branding", _writeLimiter);
router.use("/orgs/:orgId/custom-domains", _writeLimiter);
router.use("/resolve-domain", _readLimiter);
router.use(partnerPortalRouter);

router.use("/aegis/sync", _readLimiter);
router.use("/vessels/sync", _readLimiter);
router.use("/alloy/sync", _readLimiter);
router.use(deltaSyncRouter);
router.use(changesRouter);

router.use("/web-push", _writeLimiter);
router.use(webPushSubscriptionsRouter);

router.use("/notification-recipients", _writeLimiter);
router.use(notificationRecipientsRouter);

router.use("/imperium", _readLimiter);
router.use(imperiumRouter);

router.use("/innovation-engine", _readLimiter);
router.use("/innovation-engine", innovationEngineRouter);

router.use("/cortex", _writeLimiter);
router.use(cortexRouter);

router.use("/briefing", _readLimiter);
router.use("/briefing", _writeLimiter);
router.use(briefingRouter);

router.use("/audit-chain", _readLimiter);
router.use("/audit-chain", _writeLimiter);
router.use(auditChainRouter);

router.use("/revenue-intelligence", _readLimiter);
router.use(revenueIntelligenceRouter);

router.use("/sessions/command", _readLimiter);
router.use("/sessions/command", _writeLimiter);
router.use(multiplayerSessionsRouter);

router.use("/autopilot", _readLimiter);
router.use(autopilotRouter);

router.use("/signal-chains", _readLimiter);
router.use("/signal-chains", _writeLimiter);
router.use(signalChainsRouter);

router.use("/cross-domain-query", _writeLimiter);
router.use(crossDomainQueryRouter);

router.use("/correlation-map", _readLimiter);
router.use(correlationMapRouter);

router.use("/settings", _readLimiter);
router.use("/settings", _writeLimiter);
router.use(unifiedSettingsRouter);

router.use("/tenant-health", _readLimiter);
router.use("/tenant-health", _writeLimiter);
router.use(tenantHealthRouter);

export default router;
