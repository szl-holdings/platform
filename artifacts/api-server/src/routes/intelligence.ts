import { Router, type IRouter } from "express";
import intelligenceDataRouter from "./intelligence-data";
import intelligenceAiRouter from "./intelligence-ai";

export { prewarmIntelligenceCache, scheduleIntelligenceRefresh } from "./intelligence-cache";

const router: IRouter = Router();

router.use(intelligenceDataRouter);
router.use(intelligenceAiRouter);

export default router;
