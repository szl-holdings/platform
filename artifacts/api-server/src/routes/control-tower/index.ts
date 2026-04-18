import { type IRouter } from "express";
import { authMiddleware } from "../../middlewares/auth";
import { register as registerSense } from "./sense.js";
import { register as registerDecide } from "./decide.js";
import { register as registerAct } from "./act.js";
import { register as registerGovernEvolve } from "./govern-evolve.js";

export function register(router: IRouter): void {
  router.use(authMiddleware({ required: true }));
  registerSense(router);
  registerDecide(router);
  registerAct(router);
  registerGovernEvolve(router);
}
