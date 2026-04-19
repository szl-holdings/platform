import { Router, type IRouter } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.js";
import { register as registerSystem } from "./system.js";
import { register as registerUsers } from "./users.js";
import { register as registerFlags } from "./flags.js";
import { register as registerIntegrations, integrationActivityLog, type IntegrationActivity } from "./integrations.js";
import { register as registerSupport } from "./support.js";
import { register as registerUsage } from "./usage.js";
import { register as registerSeed } from "./seed.js";
import { register as registerGrowth } from "./growth.js";
import { register as registerFunnel } from "./funnel.js";
import { register as registerPipelineDeals } from "./pipeline-deals.js";
import { register as registerAppsRegistry } from "./apps-registry.js";

const adminRouter: IRouter = Router();

adminRouter.use("/admin", authMiddleware());
adminRouter.use("/admin", requireRole("admin"));

registerSystem(adminRouter);
registerUsers(adminRouter);
registerFlags(adminRouter);
registerIntegrations(adminRouter);
registerSupport(adminRouter);
registerUsage(adminRouter);
registerSeed(adminRouter);
registerGrowth(adminRouter);
registerFunnel(adminRouter);
registerPipelineDeals(adminRouter);
registerAppsRegistry(adminRouter);

export { integrationActivityLog, type IntegrationActivity };
export default adminRouter;
