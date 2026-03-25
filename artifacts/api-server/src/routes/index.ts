import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import servicesRouter from "./services";
import authRouter from "./auth";
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

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(servicesRouter);
router.use(authRouter);
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

export default router;
