import { Router, type IRouter } from "express";
import mcpRouter from "./mcp";
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
import billingMarketplaceRouter from "./billing-marketplace";
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
import intelligenceMeshRouter from "./intelligence-mesh";
import bookingRouter from "./booking";
import holdingsRouter from "./holdings";
import carlotaJoRouter from "./carlota-jo";
import observabilityRouter from "./observability";
import alloyChatRouter from "./alloy-chat";
import jobsRouter from "./jobs";
import nueroMeshRouter from "./nuro-mesh";
import aiSafetyRouter from "./ai-safety";
import nexusRouter from "./nexus";
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
import firestormCommandRouter from "./firestorm-command-surfaces";
import publicStatusRouter from "./public-status";
import { feedbackRouter } from "./feedback";
import aiEngineRouter from "./ai-engine";
import analyticsRouter from "./analytics";
import invitationsRouter from "./invitations";
import { idempotencyMiddleware, optionalIdempotencyMiddleware } from "../middlewares/idempotency";
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
import alloyGatewayRouter from "./alloy-gateway";
import alloyEvolutionRouter from "./alloy-evolution";
import alloyMlRouter from "./alloy-ml";
import alloyIntelligenceRouter from "./alloy-intelligence";
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
import prismBusApiRouter from "./prism-bus-api";
import forgeRuntimeApiRouter from "./forge-runtime-api";
import forgePortalRouter from "./forge-portal";
import covenantPolicyApiRouter from "./covenant-policy-api";
import receiptGraphRouter from "./receipt-graph";
import pulseEvalsRouter from "./pulse-evals";
import genAITelemetryRouter from "./genai-telemetry";
import outcomeGraphRouter from "./outcome-graph";
import atlasRouter from "./atlas-artifacts";
import helmRouter from "./helm-console";
import telemetryRouter from "./telemetry";
import crossAppHandoffsRouter from "./cross-app-handoffs";
import { aiRouter as aiOrchestratorRouter } from "./ai-orchestrator";
import { mastraRouter } from "./mastra-agents";
import actionEngineRouter from "./action-engine";
import { cognitiveRouter } from "./cognitive";
import stephenTelemetryRouter from "./stephen-telemetry";
import aistreamLiveRouter from "./aisstream-live";
import courtlistenerLiveRouter from "./courtlistener-live";
import threatFeedsLiveRouter from "./threat-feeds-live";
import samgovLiveRouter from "./samgov-live";
import noaaAlertsLiveRouter from "./noaa-alerts-live";
import firestormAgenticSocRouter from "./firestorm-agentic-soc";
import vesselsDigitalTwinRouter from "./vessels-digital-twin";
import terraInnovationsRouter from "./terra-innovations";
import prismCounselInnovationsRouter from "./prism-counsel-innovations";
import carlotaJoInnovationsRouter from "./carlota-jo-innovations";
import lyteInnovationsRouter from "./lyte-innovations";
import aiInnovationsRouter from "./ai-innovations";
import crossDomainIntelligenceRouter from "./cross-domain-intelligence";
import pulseRouter from "./pulse";
import emailMarketingRouter from "./email-marketing";
import sessionAnalyticsRouter from "./session-analytics";
import analyticsLakeRouter from "./analytics-lake";
import analyticsEngineRouter from "./analytics-engine";
import skillsCatalogRouter from "./skills-catalog";
import forgeRevenueRouter from "./forge-revenue";
import { multimodalRouter } from "./multimodal";
import gatewayIntelligenceRouter from "./gateway-intelligence";
import copilotRouter from "./copilot";
import packageRegistryRouter from "./package-registry";
import modelFinetuningRouter from "./model-finetuning";
import soundStudioRouter from "./sound-studio";
import videoStreamingRouter from "./video-streaming";
import multimodalDocumentsRouter from "./multimodal-documents";
import aboRouter from "./abo";

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

router.use("/vessels", _readLimiter);
router.use("/intelligence", _readLimiter);
router.use("/firestorm", _readLimiter);
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
router.use(billingMarketplaceRouter);
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
router.use("/vessels", _readLimiter);
router.use(aistreamLiveRouter);
router.use("/aegis", _readLimiter);
router.use(threatFeedsLiveRouter);
router.use("/firestorm/command", _readLimiter);
router.use(firestormCommandRouter);
router.use(lyteRouter);
router.use(creativeWorkflowsRouter);
router.use(readinessRouter);
router.use("/admin", adminGuard);
router.use(adminRouter);
router.use(intelligenceRouter);
router.use("/intelligence-mesh", intelligenceMeshRouter);
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
router.use("/nexus", _readLimiter, nexusRouter);
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

router.use("/prism", _readLimiter);
router.use(courtlistenerLiveRouter);

router.use("/lyte", _readLimiter);
router.use(samgovLiveRouter);

router.use("/noaa", _readLimiter);
router.use(noaaAlertsLiveRouter);


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

router.use("/alloy/gateway", _writeLimiter);
router.use(alloyGatewayRouter);

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

router.use("/ai/orchestrator", aiOrchestratorRouter);
router.use("/ai/mastra", mastraRouter);
router.use("/ai/mastra/action-engine", _writeLimiter);
router.use("/ai/mastra", actionEngineRouter);
router.use("/ai/mastra/cognitive", cognitiveRouter);

router.use("/ai/multimodal", _writeLimiter);
router.use("/ai/multimodal", multimodalRouter);

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
router.use(prismCounselNyRouter);

router.use("/mcp", _readLimiter);
router.use(mcpRouter);

router.use("/skills", _readLimiter);
router.use("/skills", skillsCatalogRouter);

router.use("/copilot", copilotRouter);

router.use("/approvals", _writeLimiter);
router.use(approvalsRouter);

router.use("/proof-chain", _readLimiter);
router.use(proofChainRouter);

router.use("/worldline", _writeLimiter);
router.use(worldlineRouter);

router.use("/distribution-os", _writeLimiter);
router.use("/distribution-os", distributionOsRouter);

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

router.use("/alloy/evolution", _readLimiter);
router.use("/alloy/experts", _readLimiter);
router.use("/alloy/threats", _readLimiter);
router.use("/alloy/capabilities", _readLimiter);
router.use("/alloy", alloyEvolutionRouter);

router.use("/alloy/ml", _readLimiter);
router.use("/alloy", alloyMlRouter);

router.use("/alloy/intelligence", _readLimiter);
router.use("/alloy", alloyIntelligenceRouter);

router.use("/stephen/telemetry", _readLimiter);
router.use(stephenTelemetryRouter);

router.use("/intelligence-mesh", _readLimiter);
router.use(intelligenceMeshRouter);

router.use("/firestorm", _readLimiter);
router.use(firestormAgenticSocRouter);

router.use("/vessels", _readLimiter);
router.use(vesselsDigitalTwinRouter);

router.use("/terra", _readLimiter);
router.use(terraInnovationsRouter);

router.use("/prism-counsel", _readLimiter);
router.use(prismCounselInnovationsRouter);

router.use("/carlota-jo", _readLimiter);
router.use(carlotaJoInnovationsRouter);

router.use("/lyte", _readLimiter);
router.use(lyteInnovationsRouter);

router.use("/ai", _readLimiter);
router.use(aiInnovationsRouter);

router.use("/cross-domain", _readLimiter);
router.use(crossDomainIntelligenceRouter);

router.use("/pulse", _readLimiter);
router.use("/pulse", _writeLimiter);
router.use(pulseRouter);

router.use("/forge-portal", _readLimiter);
router.use(forgePortalRouter);
router.use(forgeRevenueRouter);

router.use("/distribution-os/email-campaigns", _writeLimiter);
router.use("/distribution-os/drip-sequences", _writeLimiter);
router.use("/distribution-os/segments", _writeLimiter);
router.use("/distribution-os/campaign-dashboard", _readLimiter);
router.use("/distribution-os/privacy", _writeLimiter);
router.use("/distribution-os/preferences", _writeLimiter);
router.use("/distribution-os/cookie-consent", _writeLimiter);
router.use("/distribution-os/unsubscribe", _readLimiter);
router.use("/distribution-os", emailMarketingRouter);

router.use("/distribution-os/sessions", _writeLimiter);
router.use("/distribution-os/cohorts", _readLimiter);
router.use("/distribution-os/funnels", _readLimiter);
router.use("/distribution-os/realtime", _readLimiter);
router.use("/distribution-os", sessionAnalyticsRouter);

router.use("/analytics-lake", _readLimiter);
router.use("/analytics-lake", _writeLimiter);
router.use(analyticsLakeRouter);

router.use("/gateway-intelligence", _readLimiter);
router.use("/gateway-intelligence", _writeLimiter);
router.use("/gateway-intelligence", gatewayIntelligenceRouter);

router.use("/analytics/recordings", _writeLimiter);
router.use("/analytics/heatmap-events", _writeLimiter);
router.use("/analytics/consent", _writeLimiter);
router.use(analyticsEngineRouter);

router.use("/abo", _readLimiter);
router.use("/abo", _writeLimiter);
router.use(aboRouter);

router.use("/package-registry", _readLimiter);
router.use("/package-registry", _writeLimiter);
router.use("/package-registry", packageRegistryRouter);

import championRouter from "./champion";
router.use("/champion", _readLimiter);
router.use(championRouter);

router.use("/model-finetuning", _writeLimiter);
router.use(modelFinetuningRouter);

router.use("/sound-studio", _writeLimiter);
router.use(soundStudioRouter);

router.use("/video-streaming", _writeLimiter);
router.use(videoStreamingRouter);

router.use("/multimodal-documents", _writeLimiter);
router.use(multimodalDocumentsRouter);

export default router;
