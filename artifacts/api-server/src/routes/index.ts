import { Router, type IRouter } from "express";
import { authLimiter, readLimiter, writeLimiter, SHORT_CACHE, MEDIUM_CACHE } from "../middlewares/rate-limiters";
import { adminGuard } from "../middlewares/admin-guard";
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
import firestormRouter from "./firestorm";
import lyteRouter from "./lyte";
import dreamscapeRouter from "./dreamscape";
import readinessRouter from "./readiness";
import adminRouter from "./admin";
import intelligenceRouter from "./intelligence";
import incaRouter from "./inca";
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
import mspLiveRouter from "./msp-live";
import terraLiveRouter from "./terra-live";
import agentTrainingRouter from "./agent-training";
import commentsRouter from "./comments";
import agentOsRouter from "./agent-os";
import cmsRouter from "./cms";
import doctrineRouter from "./doctrine";
import alloyRouter from "./alloy";
import lytePlatformRouter from "./lyte-platform";
import vesselsPlatformRouter from "./vessels-platform";

const router: IRouter = Router();

router.use("/auth", authLimiter);

router.use("/billing", writeLimiter);
router.use("/connectors", writeLimiter);
router.use("/notifications", writeLimiter);
router.use("/feature-flags", writeLimiter);
router.use("/projects", writeLimiter);
router.use("/files", writeLimiter);

router.use("/vessels", readLimiter);
router.use("/intelligence", readLimiter);
router.use("/inca", readLimiter);
router.use("/booking", readLimiter);
router.use("/holdings/inquiries", writeLimiter);
router.use("/holdings", readLimiter);
router.use("/audit", readLimiter);

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
router.use(vesselsRouter);
router.use(firestormRouter);
router.use(lyteRouter);
router.use(dreamscapeRouter);
router.use(readinessRouter);
router.use("/admin", adminGuard);
router.use(adminRouter);
router.use(intelligenceRouter);
router.use(incaRouter);
router.use(bookingRouter);
router.use(holdingsRouter);
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

router.use("/msp", readLimiter);
router.use(mspLiveRouter);
router.use("/rosie", readLimiter);
router.use(mspLiveRouter);

router.use("/terra", readLimiter);
router.use(terraLiveRouter);
router.use("/beacon", readLimiter);
router.use(terraLiveRouter);

router.use("/readiness", readLimiter);
router.use(readinessRouter);
router.use("/aegis", readLimiter);
router.use(readinessRouter);

router.use("/dreamscape", readLimiter);
router.use(dreamscapeRouter);

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

router.use("/lyte/platform", readLimiter);
router.use(lytePlatformRouter);

router.use("/vessels/platform", readLimiter);
router.use(vesselsPlatformRouter);

export default router;
