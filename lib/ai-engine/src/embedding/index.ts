export {
  EmbeddingPipeline,
  embeddingPipeline,
  getEmbedding,
  type EmbeddingResult,
  type BatchEmbeddingResult,
  type EmbedOptions,
  type BatchEmbedOptions,
  type ProviderHealth,
  type EmbeddingProviderType,
} from "./provider.js";

export {
  getDomainModelConfig,
  inferDomain,
  getAllDomainConfigs,
  RAG_DB_DIMENSIONS,
  type EmbeddingDomain,
  type DomainEmbeddingConfig,
} from "./domain-config.js";

export {
  embeddingAnalytics,
  type EmbeddingAnalyticsReport,
} from "./analytics.js";

export {
  createEmbeddingAnalyticsRouter,
  getEmbeddingAnalytics,
} from "./analytics-endpoint.js";
