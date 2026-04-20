import type { IRouter } from 'express';
import { register as registerAiRoutes } from './ai-routes.js';
import { register as registerFeeds } from './feeds.js';
import { register as registerResearch } from './research.js';
import {
  prewarmIntelligenceCache,
  scheduleIntelligenceCachePruning,
  scheduleIntelligenceRefresh,
} from './shared.js';

export { prewarmIntelligenceCache, scheduleIntelligenceCachePruning, scheduleIntelligenceRefresh };

export function register(router: IRouter): void {
  registerFeeds(router);
  registerAiRoutes(router);
  registerResearch(router);
}
