import { Router, type IRouter } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.js";
import { register as registerSystem } from "./system.js";
import { register as registerUsers } from "./users.js";
import { register as registerFlags } from "./flags.js";
import { register as registerIntegrations, integrationActivityLog, type IntegrationActivity } from "./integrations.js";
import { register as registerSupport } from "./support.js";

const adminRouter: IRouter = Router();

adminRouter.use("/admin", authMiddleware());
adminRouter.use("/admin", requireRole("admin"));

registerSystem(adminRouter);
registerUsers(adminRouter);
registerFlags(adminRouter);
registerIntegrations(adminRouter);
registerSupport(adminRouter);

export { integrationActivityLog, type IntegrationActivity };
export default adminRouter;
