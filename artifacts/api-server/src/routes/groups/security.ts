import { type IRouter } from "express";
import { perUserApiSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";
import { lazyMount, lazyRegister, lazyMatch, lazyRegisterMatch } from "../../lib/lazy-router";

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

  router.use(lazyRegisterMatch("/firestorm", () => import("../firestorm"), "firestorm"));
  router.use(lazyMatch("/firestorm", () => import("../firestorm-live"), "firestorm-live"));

  router.use("/command", _readLimiter);
  router.use("/firestorm/command", _readLimiter);
  router.use(lazyMatch("/firestorm", () => import("../firestorm-command-surfaces"), "firestorm-command-surfaces"));

  router.use("/firestorm/cognitive", _readLimiter);
  router.use(lazyMatch("/firestorm", () => import("../firestorm-cognitive"), "firestorm-cognitive"));

  router.use(lazyRegisterMatch("/intelligence", () => import("../intelligence"), "intelligence"));
  router.use(lazyMatch("/inca", () => import("../inca"), "inca"));

  router.use("/gov", _readLimiter);
  router.use(lazyMatch("/gov", () => import("../gov-data"), "gov-data"));

  router.use("/readiness", _readLimiter);
  router.use(lazyMatch("/readiness", () => import("../readiness"), "readiness"));
  router.use("/aegis", _readLimiter);
  router.use(lazyMatch("/readiness", () => import("../readiness"), "readiness"));

  router.use(lazyMatch("/msp", () => import("../msp-live"), "msp-live"));
  router.use(lazyMatch("/msp", () => import("../msp"), "msp"));

  router.use("/msp", _readLimiter);
  router.use("/msp", lazyRegister(() => import("../rmm"), "rmm"));

  router.use(lazyMatch("/aegis", () => import("../ot-ics"), "ot-ics"));

  router.use("/aegis", _readLimiter);
  router.use(lazyMatch("/aegis", () => import("../aegis-digital-twin"), "aegis-digital-twin"));
  router.use(lazyMatch("/aegis", () => import("../aegis-modules"), "aegis-modules"));
}
