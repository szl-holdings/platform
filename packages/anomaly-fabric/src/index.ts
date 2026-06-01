/**
 * @workspace/anomaly-fabric
 *
 * Anomaly Fabric — unified streaming and batch anomaly detection.
 *
 * Provides a single shared contract across all platform lanes:
 *  - Streaming detection with rolling-window z-score analysis
 *  - Batch detection with per-metric outlier and distribution-shift detection
 *  - Pluggable AnomalyStore for persistence
 *
 * Usage:
 *   import { globalAnomalyService } from "@workspace/anomaly-fabric";
 *   const result = await globalAnomalyService.detectStreaming({ point, lane: "lyte" });
 */

export * from './types.js';
export * from './streaming.js';
export * from './batch.js';
export * from './service.js';

export { ANOMALY_FABRIC_VERSION } from './types.js';
