import { Router, type IRouter } from "express";
import pulseBriefingRouter from "./pulse";
import { perUserApiSlidingLimiter } from "../middlewares/sliding-window-limiter";
import * as core from "./groups/core";
import * as vessels from "./groups/vessels";
import * as security from "./groups/security";
import * as lyte from "./groups/lyte";
import * as terra from "./groups/terra";
import * as alloy from "./groups/alloy";
import * as prismCounsel from "./groups/prism-counsel";
import * as platform from "./groups/platform";
import * as ai from "./groups/ai";
import * as operations from "./groups/operations";
import * as dataServices from "./groups/data-services";
import * as billing from "./groups/billing";
import * as misc from "./groups/misc";
import * as decisions from "./groups/decisions";
import * as domainAtlas from "./groups/domain-atlas";
import * as graph from "./groups/graph";
import * as guardian from "./groups/guardian";
import tracesRouter from "./traces";

const router: IRouter = Router();

router.use("/pulse", perUserApiSlidingLimiter, pulseBriefingRouter);

core.register(router);
vessels.register(router);
security.register(router);
lyte.register(router);
terra.register(router);
alloy.register(router);
prismCounsel.register(router);
platform.register(router);
ai.register(router);
operations.register(router);
dataServices.register(router);
billing.register(router);
misc.register(router);
decisions.register(router);
domainAtlas.register(router);
graph.register(router);
guardian.register(router);

router.use(tracesRouter);

export default router;
