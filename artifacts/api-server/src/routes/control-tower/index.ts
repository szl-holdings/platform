import { type IRouter } from "express";
import { authMiddleware } from "../../middlewares/auth";
import { register as registerSense } from "./sense.js";
import { register as registerDecide } from "./decide.js";
import { register as registerAct } from "./act.js";
import { register as registerGovernEvolve } from "./govern-evolve.js";
import { register as registerSubstrateReplay } from "./substrate-replay.js";
import { registerSubstrateLyteRetriever } from "../../lib/substrate-lyte-retriever.js";

export function register(router: IRouter): void {
  router.use(authMiddleware({ required: true }));
  registerSense(router);
  registerDecide(router);
  registerAct(router);
  registerGovernEvolve(router);
  registerSubstrateReplay(router);

  // Register the concrete Lyte retriever adapter so Opportunity Audit runs
  // against live Lyte data (lyteSignals, lyteIncidents, lyteActions tables).
  void registerSubstrateLyteRetriever();
}
