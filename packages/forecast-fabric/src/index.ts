/**
 * @workspace/forecast-fabric
 *
 * Forecast Fabric — unified multi-head forecasting service.
 *
 * Provides:
 *  - Head registration for all 7 platform lanes (27 named heads)
 *  - Calibrated interval outputs (point + lower/upper + confidence)
 *  - Provider-adapter slots (swap-ready; ships with SafeDefaultAdapter)
 *  - Per-lane and per-head forecast invocation
 *
 * Usage:
 *   import { createForecastService, ALL_HEADS } from "@workspace/forecast-fabric";
 *   const svc = createForecastService();
 *   const output = await svc.forecast({ headName: "lyte:bottlenecks", context: {} });
 */

export * from './types.js';
export * from './adapters.js';
export * from './service.js';
export * from './heads/index.js';

export { FORECAST_FABRIC_VERSION } from './types.js';

import { ForecastService } from './service.js';
import { ALL_HEADS } from './heads/index.js';

export function createForecastService(): ForecastService {
  const svc = new ForecastService();
  for (const head of ALL_HEADS) {
    svc.registerHead(head);
  }
  return svc;
}

export const globalForecastServiceWithHeads = createForecastService();
