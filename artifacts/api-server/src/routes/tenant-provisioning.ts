import { Router, type IRouter } from "express";
import tenantCoreRouter from "./tenant-core";
import tenantPowerBiRouter from "./tenant-powerbi";
import tenantScimRouter from "./tenant-scim";
import tenantBrandingRouter from "./tenant-branding";

const router: IRouter = Router();

router.use(tenantCoreRouter);
router.use(tenantPowerBiRouter);
router.use(tenantScimRouter);
router.use(tenantBrandingRouter);

export default router;
