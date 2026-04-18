import { type IRouter } from "express";
import { register as registerFeeds } from "./feeds.js";
import { register as registerAiRoutes } from "./ai-routes.js";
import { register as registerResearch } from "./research.js";
import { scheduleIntelligenceRefresh, prewarmIntelligenceCache, scheduleIntelligenceCachePruning } from "./shared.js";

export { scheduleIntelligenceRefresh, prewarmIntelligenceCache, scheduleIntelligenceCachePruning };

export function register(router: IRouter): void {
  registerFeeds(router);
  registerAiRoutes(router);
  registerResearch(router);
}
