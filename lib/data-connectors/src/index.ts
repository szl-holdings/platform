export {
  ServiceAdapter,
  type ServiceStatus,
  type ServiceHealthReport,
  type ConnectionTestResult,
} from "@szl-holdings/services";

export {
  ServiceRegistry,
  services as ConnectorRegistry,
  type IntegrationHealthMatrix,
} from "@szl-holdings/services";

export {
  resolveProviderMode,
  createProvider,
  type ProviderMode,
  type DataProvider,
} from "@szl-holdings/services";

export {
  AIAdapter,
  type ChatMessage,
  type ChatCompletionResult,
} from "@szl-holdings/services";
export { WeatherAdapter, type WeatherConditions, type WeatherForecastDay } from "@szl-holdings/services";
export { ShippingAdapter, type VesselPosition, type PortInfo } from "@szl-holdings/services";
export { StripeAdapter, type StripeConnectionStatus, type StripeProduct } from "@szl-holdings/services";
export { SlackAdapter, type SlackMessageResult } from "@szl-holdings/services";
export { TwilioAdapter, type SMSResult } from "@szl-holdings/services";
export { GoogleAdapter, type GoogleAuthStatus } from "@szl-holdings/services";
export { NotionAdapter, type NotionPage, type NotionDatabase } from "@szl-holdings/services";
export { StorageAdapter, type UploadResult, type StoredFile } from "@szl-holdings/services";
export { MonitoringAdapter, type ErrorReport, type AnalyticsEvent } from "@szl-holdings/services";
export { GitHubAdapter, type GitHubRepo, type GitHubWebhookEvent } from "@szl-holdings/services";
export { GoogleCalendarAdapter, type CalendarEvent } from "@szl-holdings/services";
export { GoogleDocsAdapter, type GoogleDoc } from "@szl-holdings/services";
export { GoogleDriveAdapter, type DriveFile } from "@szl-holdings/services";
export { DropboxAdapter, type DropboxFile } from "@szl-holdings/services";
export { OneDriveAdapter, type OneDriveFile } from "@szl-holdings/services";
export { StormGlassAdapter, type MarineWeather } from "@szl-holdings/services";
export { PostHogAdapter, type PostHogEvent, type PostHogInsight } from "@szl-holdings/services";
export { GmailAdapter, type GmailMessage } from "@szl-holdings/services";
export { ConfluenceAdapter, type ConfluencePage } from "@szl-holdings/services";
export { HubSpotAdapter, type HubSpotContact, type HubSpotDeal } from "@szl-holdings/services";
export { ElevenLabsAdapter, type ElevenLabsVoice, type TTSResult } from "@szl-holdings/services";
export { FigmaAdapter, type FigmaFile, type FigmaProject } from "@szl-holdings/services";
export { CisaAdapter, type CisaKevEntry, type MitreAttackTechnique } from "@szl-holdings/services";
export { ArxivAdapter, type ArxivPaper } from "@szl-holdings/services";
export { AbuseIPDBAdapter, type IpReputationResult } from "@szl-holdings/services";
export { NOAAAdapter } from "@szl-holdings/services";
export { NVDAdapter } from "@szl-holdings/services";
export { BLSAdapter } from "@szl-holdings/services";
export { WorldBankAdapter } from "@szl-holdings/services";
export { OpenMeteoAdapter } from "@szl-holdings/services";
export { MITREAdapter } from "@szl-holdings/services";
export { GDELTAdapter } from "@szl-holdings/services";
export { ResoMlsAdapter, type MlsListing, type ODataQueryParams, type MlsIncrementalSyncResult } from "@szl-holdings/services";
export { CoStarAdapter, type CoStarProperty, type CoStarMarketStats, type CoStarSaleComp } from "@szl-holdings/services";
export { CompStakAdapter, type CompStakLeaseComp, type CompStakSaleComp, type CompStakPropertyDetail } from "@szl-holdings/services";
export {
  SalesforceAdapter,
  type SalesforceAccount,
  type SalesforceContact,
  type SalesforceOpportunity,
  type SalesforceLead,
  type SalesforceCase,
  type SalesforceTask,
  type SalesforceSignal,
  type SalesforceQueryResult,
  type SalesforceConnectionStatus,
  type SalesforcePipelineHealth,
} from "@szl-holdings/services";
export {
  JiraAdapter,
  type JiraProject,
  type JiraIssue,
  type JiraSprint,
  type JiraSprintHealth,
  type JiraSignal,
  type JiraWebhookEvent,
  type JiraConnectionStatus,
} from "@szl-holdings/services";
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
} from "@szl-holdings/services";

export {
  azureKeyVault,
  azureBlobStorage,
  azureRedis,
  azurePostgres,
  azureAppInsights,
  getAzureStatus,
  type AzureServiceConfig,
} from "@szl-holdings/services";

export {
  Dynamics365Adapter,
  type DynamicsAccount,
  type DynamicsContact,
  type DynamicsOpportunity,
  type DynamicsLead,
  type DynamicsCase,
  type DynamicsActivity,
  type DynamicsSyncSignal,
} from "@szl-holdings/services";

export {
  SharePointSPFxAdapter,
  type SPFxWebPartManifest,
  type SPFxPreconfiguredEntry,
  type SPFxSiteInfo,
  type SPFxDeploymentStatus,
  type SPFxDeployedPackage,
} from "@szl-holdings/services";

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
} from "@szl-holdings/services";
