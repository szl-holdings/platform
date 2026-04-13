import { Router, type IRouter } from "express";
import firestormCoreRouter from "./firestorm-core";
import firestormComplianceRouter from "./firestorm-compliance";
import firestormCasesRouter from "./firestorm-cases";
import firestormThreatIntelRouter from "./firestorm-threat-intel";
import firestormTradecraftRouter from "./firestorm-tradecraft";
import firestormBusinessImpactRouter from "./firestorm-business-impact";

const router: IRouter = Router();

router.use(firestormCoreRouter);
router.use(firestormComplianceRouter);
router.use(firestormCasesRouter);
router.use(firestormThreatIntelRouter);
router.use(firestormTradecraftRouter);
router.use(firestormBusinessImpactRouter);

export default router;
