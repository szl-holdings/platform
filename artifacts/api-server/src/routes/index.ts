import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import servicesRouter from "./services";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(servicesRouter);

export default router;
