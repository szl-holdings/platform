import { Router, type IRouter } from "express";
import { authLimiter, readLimiter, writeLimiter, SHORT_CACHE, MEDIUM_CACHE } from "../middlewares/rate-limiters";
import { adminGuard } from "../middlewares/admin-guard";
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

router.use("/auth", authLimiter);

router.use("/billing", writeLimiter);
router.use("/connectors", writeLimiter);
router.use("/notifications", writeLimiter);
router.use("/feature-flags", writeLimiter);
router.use("/projects", writeLimiter);
router.use("/files", writeLimiter);

router.use("/vessels", readLimiter);
router.use("/intelligence", readLimiter);
router.use("/firestorm", readLimiter);
router.use("/inca", readLimiter);
router.use("/msp", readLimiter);
router.use("/aegis", readLimiter);
router.use("/booking", readLimiter);
router.use("/holdings/inquiries", writeLimiter);
router.use("/holdings", readLimiter);
router.use("/audit", readLimiter);
router.use("/contact", writeLimiter);

router.use(healthRouter);
router.use(healthIntegrationsRouter);
router.use("/webhooks", writeLimiter);
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
router.use("/lyte", readLimiter);
router.use("/lyte", lyteExtendedRouter);
router.use(lyteObservabilityRouter);
router.use("/vessels", readLimiter);
router.use(vesselsExtendedRouter);
router.use("/lyte/platform", readLimiter);
router.use(lytePlatformRouter);
router.use("/vessels/platform", readLimiter);
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
router.use("/demo-requests", writeLimiter);
router.use(demoRequestsRouter);
router.use(carlotaJoRouter);
router.use("/observability", readLimiter);
router.use(observabilityRouter);
router.use(alloyChatRouter);
router.use("/jobs", readLimiter);
router.use(jobsRouter);
router.use("/nuro-mesh", readLimiter);
router.use(nueroMeshRouter);
router.use("/ai-safety", readLimiter);
router.use(aiSafetyRouter);
router.use("/domain-agents", readLimiter);
router.use(domainAgentsRouter);
router.use("/gov", readLimiter);
router.use(govDataRouter);

router.use("/terra", readLimiter);
router.use(terraRouter);
router.use("/beacon", readLimiter);
router.use(terraRouter);

router.use("/terra", readLimiter);
router.use(terraDistressRouter);
router.use("/beacon", readLimiter);
router.use(terraDistressRouter);

router.use("/terra", readLimiter);
router.use(terraBrokerRouter);

router.use(aegisOpsLiveRouter);
router.use(aegisOpsRouter);

router.use("/terra", readLimiter);
router.use(terraLiveRouter);
router.use("/beacon", readLimiter);
router.use(terraLiveRouter);

router.use("/readiness", readLimiter);
router.use(readinessRouter);
router.use("/aegis", readLimiter);
router.use(readinessRouter);

router.use("/dreamscape", readLimiter); // legacy path — creative-workflows module
router.use(creativeWorkflowsRouter);

router.use(agentTrainingRouter);
router.use("/comments", writeLimiter);
router.use(commentsRouter);
router.use("/agent-os", readLimiter);
router.use(agentOsRouter);
router.use("/cms", readLimiter);
router.use(cmsRouter);
router.use("/doctrine", readLimiter);
router.use(doctrineRouter);

router.use("/alloy", readLimiter);
router.use(alloyRouter);

router.use("/capital", writeLimiter);
router.use(capitalReadinessRouter);

router.use("/certification", writeLimiter);
router.use(certificationReadinessRouter);

router.use("/ownership", writeLimiter);
router.use(ownershipControlRouter);

router.use("/terra", writeLimiter);
router.use(terraCrmRouter);
router.use("/beacon", writeLimiter);
router.use(terraCrmRouter);

router.use("/core", readLimiter);
router.use(coreRouter);

router.use("/microsoft", readLimiter);
router.use(microsoftGraphRouter);

router.use("/admin/tenants", writeLimiter);
router.use(tenantProvisioningRouter);

router.use("/dataverse", readLimiter);
router.use("/dataverse", dataverseRouter);

router.use("/integrations", readLimiter);
router.use(microsoftIntegrationsRouter);
router.use(integrationsRouter);

router.use("/lyte", readLimiter);
router.use(lyteLiveRouter);

router.use("/vessels", readLimiter);
router.use(vesselsLiveRouter);

router.use(configRouter);

router.use(apmRouter);

router.use("/documents", writeLimiter);
router.use(documentsRouter);

router.use(scimRouter);

router.use("/push-tokens", writeLimiter);
router.use(pushTokensRouter);
router.use("/push-notifications", writeLimiter);
router.use(pushNotificationsRouter);

router.use("/admin/backup", writeLimiter);
router.use(backupRouter);

router.use("/exports", writeLimiter);
router.use(exportsRouter);

router.use("/public", publicStatusRouter);
router.use("/admin/status", writeLimiter);
router.use("/admin/status", publicStatusRouter);

export default router;
