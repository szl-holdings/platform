/**
 * @szl-holdings/intelligence-feeds
 *
 * Real OSINT feed adapters, fusion engine, and feed scheduler
 * for the SZL Intelligence OS.
 */

export { AISFeedAdapter, createAISConfig } from './adapters/ais.js';
export { createLegalRecordsConfig, LegalRecordsFeedAdapter } from './adapters/legal-records.js';
export { createSanctionsConfig, SanctionsFeedAdapter } from './adapters/sanctions.js';
export { createSTIXConfig, STIXTAXIIFeedAdapter } from './adapters/stix-taxii.js';
export type {
  FeedAdapterConfig,
  FeedHealthStatus,
  NormalizedFeedPayload,
  PollResult,
} from './feed-adapter.js';
export { BaseFeedAdapter, DeduplicationCache } from './feed-adapter.js';
export type { SchedulerConfig } from './feed-scheduler.js';
export { FeedScheduler, feedScheduler } from './feed-scheduler.js';
export type { FusionAlert, FusionEngineStats, FusionPatternType } from './fusion-engine.js';
export { FusionEngine, fusionEngine } from './fusion-engine.js';
