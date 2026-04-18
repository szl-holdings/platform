import { Router, type IRouter } from "express";
import { perUserApiSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";

import * as aegisSoc from "../firestorm";
import aegisSocLiveRouter from "../firestorm-live";
import firestormCommandRouter from "../firestorm-command-surfaces";
import firestormCognitiveRouter from "../firestorm-cognitive";
import * as intelligence from "../intelligence";
import aegisIntelRouter from "../inca";
import govDataRouter from "../gov-data";
import readinessRouter from "../readiness";
import aegisOpsLiveRouter from "../msp-live";
import aegisOpsRouter from "../msp";
import * as rmm from "../rmm";
import otIcsRouter from "../ot-ics";
import aegisDigitalTwinRouter from "../aegis-digital-twin";

const _readLimiter = perUserApiSlidingLimiter;

const FIRESTORM_SOC_PATHS = new Set([
  "scenarios","assessments","simulations","findings","risk-scores","reports",
  "incidents","compliance","alerts","vulnerabilities","live","soar","stix",
  "taxii","mitre","mitre-detections","cves","command","assets","cases",
  "workflow-actions","hardening-controls","hardening-summary","ingest",
  "tradecraft","soc-dashboard",
]);

export function register(router: IRouter): void {
  router.use("/firestorm", tenantScope({ required: true }));
  router.use("/inca", tenantScope({ required: true }));
  router.use("/msp", tenantScope({ required: true }));
  router.use("/aegis", tenantScope({ required: true }));
  router.use("/intelligence", tenantScope({ required: true }));
  router.use("/gov", tenantScope({ required: true }));
  router.use("/readiness", tenantScope({ required: true }));
  router.use("/command", tenantScope({ required: true }));

  router.use("/firestorm", _readLimiter);
  router.use("/inca", _readLimiter);
  router.use("/msp", _readLimiter);
  router.use("/aegis", _readLimiter);
  router.use("/intelligence", _readLimiter);

  router.use((req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => {
    const m = req.url.match(/^\/aegis\/([\w-]+)/);
    if (m && FIRESTORM_SOC_PATHS.has(m[1])) req.url = req.url.replace(/^\/aegis\//, "/firestorm/");
    next();
  });

  aegisSoc.register(router);
  router.use(aegisSocLiveRouter);

  router.use("/command", _readLimiter);
  router.use("/firestorm/command", _readLimiter);
  router.use(firestormCommandRouter);

  router.use("/firestorm/cognitive", _readLimiter);
  router.use(firestormCognitiveRouter);

  intelligence.register(router);
  router.use(aegisIntelRouter);

  router.use("/gov", _readLimiter);
  router.use(govDataRouter);

  router.use("/readiness", _readLimiter);
  router.use(readinessRouter);
  router.use("/aegis", _readLimiter);
  router.use(readinessRouter);

  router.use(aegisOpsLiveRouter);
  router.use(aegisOpsRouter);

  router.use("/msp", _readLimiter);
  const mspRouter = Router();
  rmm.register(mspRouter);
  router.use("/msp", mspRouter);

  router.use(otIcsRouter);

  router.use("/aegis", _readLimiter);
  router.use(aegisDigitalTwinRouter);
}
