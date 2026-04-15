/**
 * @szl-holdings/intelligence-feeds
 *
 * Real OSINT feed adapters, fusion engine, and feed scheduler
 * for the SZL Intelligence OS.
 */

export { BaseFeedAdapter, DeduplicationCache } from "./feed-adapter.js";
export type {
  FeedAdapterConfig,
  FeedHealthStatus,
  NormalizedFeedPayload,
  PollResult,
} from "./feed-adapter.js";

export { AISFeedAdapter, createAISConfig } from "./adapters/ais.js";
export { STIXTAXIIFeedAdapter, createSTIXConfig } from "./adapters/stix-taxii.js";
export { SanctionsFeedAdapter, createSanctionsConfig } from "./adapters/sanctions.js";
export { LegalRecordsFeedAdapter, createLegalRecordsConfig } from "./adapters/legal-records.js";

export { fusionEngine, FusionEngine } from "./fusion-engine.js";
export type { FusionAlert, FusionPatternType, FusionEngineStats } from "./fusion-engine.js";

export { feedScheduler, FeedScheduler } from "./feed-scheduler.js";
export type { SchedulerConfig } from "./feed-scheduler.js";
