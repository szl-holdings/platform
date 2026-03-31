export {
  ServiceAdapter,
  type ServiceStatus,
  type ServiceHealthReport,
  type ConnectionTestResult,
} from "@workspace/services";

export {
  ServiceRegistry,
  services as ConnectorRegistry,
  type IntegrationHealthMatrix,
} from "@workspace/services";

export {
  resolveProviderMode,
  createProvider,
  type ProviderMode,
  type DataProvider,
} from "@workspace/services";

export {
  AIAdapter,
  type ChatMessage,
  type ChatCompletionResult,
} from "@workspace/services";
export { WeatherAdapter, type WeatherConditions, type WeatherForecastDay } from "@workspace/services";
export { ShippingAdapter, type VesselPosition, type PortInfo } from "@workspace/services";
export { StripeAdapter, type StripeConnectionStatus, type StripeProduct } from "@workspace/services";
export { SlackAdapter, type SlackMessageResult } from "@workspace/services";
export { TwilioAdapter, type SMSResult } from "@workspace/services";
export { GoogleAdapter, type GoogleAuthStatus } from "@workspace/services";
export { NotionAdapter, type NotionPage, type NotionDatabase } from "@workspace/services";
export { StorageAdapter, type UploadResult, type StoredFile } from "@workspace/services";
export { MonitoringAdapter, type ErrorReport, type AnalyticsEvent } from "@workspace/services";
export { GitHubAdapter, type GitHubRepo, type GitHubWebhookEvent } from "@workspace/services";
export { GoogleCalendarAdapter, type CalendarEvent } from "@workspace/services";
export { GoogleDocsAdapter, type GoogleDoc } from "@workspace/services";
export { GoogleDriveAdapter, type DriveFile } from "@workspace/services";
export { DropboxAdapter, type DropboxFile } from "@workspace/services";
export { OneDriveAdapter, type OneDriveFile } from "@workspace/services";
export { StormGlassAdapter, type MarineWeather } from "@workspace/services";
export { PostHogAdapter, type PostHogEvent, type PostHogInsight } from "@workspace/services";
export { GmailAdapter, type GmailMessage } from "@workspace/services";
export { ConfluenceAdapter, type ConfluencePage } from "@workspace/services";
export { HubSpotAdapter, type HubSpotContact, type HubSpotDeal } from "@workspace/services";
export { ElevenLabsAdapter, type ElevenLabsVoice, type TTSResult } from "@workspace/services";
export { FigmaAdapter, type FigmaFile, type FigmaProject } from "@workspace/services";
export { CisaAdapter, type CisaKevEntry, type MitreAttackTechnique } from "@workspace/services";
export { ArxivAdapter, type ArxivPaper } from "@workspace/services";
export { AbuseIPDBAdapter, type IpReputationResult } from "@workspace/services";
export { NOAAAdapter } from "@workspace/services";
export { NVDAdapter } from "@workspace/services";
export { BLSAdapter } from "@workspace/services";
export { WorldBankAdapter } from "@workspace/services";
export { OpenMeteoAdapter } from "@workspace/services";
export { MITREAdapter } from "@workspace/services";
export { GDELTAdapter } from "@workspace/services";
export { ResoMlsAdapter, type MlsListing, type ODataQueryParams, type MlsIncrementalSyncResult } from "@workspace/services";
export { CoStarAdapter, type CoStarProperty, type CoStarMarketStats, type CoStarSaleComp } from "@workspace/services";
export { CompStakAdapter, type CompStakLeaseComp, type CompStakSaleComp, type CompStakPropertyDetail } from "@workspace/services";
export {
  HuggingFaceAdapter,
  type HFTextGenerationResult,
  type HFSummarizationResult,
  type HFClassificationResult,
  type HFNERResult,
  type HFTranslationResult,
  type HFZeroShotResult,
  type HFImageResult,
  type HFSentimentResult,
  type HFQuestionAnswerResult,
  type HFEmbeddingResult,
  type HFDocumentAnalysis,
  type HFChatMessage,
  type HFChatResult,
  type HFHealthStatus,
  type HFTranscriptionResult,
  type HFReasoningResult,
  type ModelTier,
} from "@workspace/services";

export {
  azureKeyVault,
  azureBlobStorage,
  azureRedis,
  azurePostgres,
  azureAppInsights,
  getAzureStatus,
  type AzureServiceConfig,
} from "@workspace/services";

export {
  Dynamics365Adapter,
  type DynamicsAccount,
  type DynamicsContact,
  type DynamicsOpportunity,
  type DynamicsLead,
  type DynamicsCase,
  type DynamicsActivity,
  type DynamicsSyncSignal,
} from "@workspace/services";

export {
  SharePointSPFxAdapter,
  type SPFxWebPartManifest,
  type SPFxPreconfiguredEntry,
  type SPFxSiteInfo,
  type SPFxDeploymentStatus,
  type SPFxDeployedPackage,
} from "@workspace/services";

export {
  vesselsMockProvider,
  type VesselRecord,
  incaMockProvider,
  type IncaModel,
  bookingMockProvider,
  type BookingAppointment,
  holdingsMockProvider,
  type HoldingsVenture,
  vesselsDomainMockData,
  type VesselProfile,
  type MaintenanceLog,
  type ComplianceCertificate,
  type PortStateDeficiency,
  type ShipmentRecord,
  type EventLog,
  type EmissionRecord,
  type AIBriefing,
  type PredictiveMaintenance,
  type ForecastModule,
} from "@workspace/services";
