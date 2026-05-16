import { installDefaultThesisProbe as _installDefaultThesisProbe } from './thesis-rag.js';

export * from './types.js';
export * from './sources.js';
export * from './classifier.js';
export * from './store.js';
export * from './adapters.js';
export * from './worker.js';
export * from './temporal-scheduler.js';
export * from './thesis-rag.js';
export {
  ensureSchema as ensureFrontierIngestDbSchema,
  isDbBackendEnabled as isFrontierIngestDbEnabled,
  dbListInbox as dbListInboxShared,
  dbGetInboxById as dbGetInboxByIdShared,
  dbListTimeline as dbListTimelineShared,
  dbListPromotions as dbListPromotionsShared,
  dbListDownstream as dbListDownstreamShared,
  dbGetStats as dbGetStatsShared,
  _truncateForTests as _truncateFrontierDbForTests,
  _resetDbBackendForTests,
} from './db-backend.js';

// Auto-install the thesis-RAG probe on first import so any process
// using the classifier (api-server, Temporal worker, in-process dev
// worker, e2e tests) gets the embedding-based thesisFit by default.
// `installDefaultThesisProbe()` is a no-op when the corpus is
// unavailable — the classifier transparently falls back to its
// keyword scorer in that case.
_installDefaultThesisProbe();
