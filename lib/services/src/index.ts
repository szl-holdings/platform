export { ServiceAdapter, type ServiceStatus, type ServiceHealthReport, type ConnectionTestResult } from "./base.js";
export { ServiceRegistry, type IntegrationHealthMatrix, services } from "./registry.js";

export {
  type ProviderMode,
  type DataProvider,
  resolveProviderMode,
  createProvider,
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
  mspClients,
  mspTickets,
  mspDevices,
  mspContracts,
  mspAlerts,
  mspTechnicians,
  mspRevenueData,
  mspUptimeData,
  mspIncidentTimeline,
  type MspClient,
  type MspTicket,
  type MspDevice,
  type MspContract,
  type MspAlert,
  type MspTechnician,
  lyteSignals,
  lyteIncidents,
  lyteRecommendations,
  lytePlaybooks,
  lyteCommandCards,
  mockPrograms,
  mockDimensions,
  mockMilestones,
  mockRisks,
  readinessMockAlerts,
  mockScoreHistory,
  type Program,
  type Dimension,
  type Milestone,
  type Risk,
  type ReadinessAlert,
  type ScoreHistory,
} from "./providers/index.js";

export {
  azureKeyVault,
  azureBlobStorage,
  azureRedis,
  azurePostgres,
  azureAppInsights,
  getAzureStatus,
  type AzureServiceConfig,
} from "./azure/index.js";

export { AIAdapter, type ChatMessage, type ChatCompletionResult } from "./adapters/ai.js";
export { WeatherAdapter, type WeatherConditions, type WeatherForecastDay } from "./adapters/weather.js";
export { ShippingAdapter, type VesselPosition, type PortInfo } from "./adapters/shipping.js";
export { StripeAdapter, type StripeConnectionStatus, type StripeProduct } from "./adapters/stripe.js";
export { SlackAdapter, type SlackMessageResult } from "./adapters/slack.js";
export { TwilioAdapter, type SMSResult } from "./adapters/twilio.js";
export { GoogleAdapter, type GoogleAuthStatus } from "./adapters/google.js";
export { NotionAdapter, type NotionPage, type NotionDatabase } from "./adapters/notion.js";
export { StorageAdapter, type UploadResult, type StoredFile } from "./adapters/storage.js";
export { MonitoringAdapter, type ErrorReport, type AnalyticsEvent } from "./adapters/monitoring.js";
export { GitHubAdapter, type GitHubRepo, type GitHubWebhookEvent } from "./adapters/github.js";
export { GoogleCalendarAdapter, type CalendarEvent } from "./adapters/google-calendar.js";
export { GoogleDocsAdapter, type GoogleDoc } from "./adapters/google-docs.js";
export { GoogleDriveAdapter, type DriveFile } from "./adapters/google-drive.js";
export { DropboxAdapter, type DropboxFile } from "./adapters/dropbox.js";
export { OneDriveAdapter, type OneDriveFile } from "./adapters/onedrive.js";
export { StormGlassAdapter, type MarineWeather } from "./adapters/stormglass.js";
export { PostHogAdapter, type PostHogEvent, type PostHogInsight } from "./adapters/posthog.js";
export { GmailAdapter, type GmailMessage } from "./adapters/gmail.js";
export { ConfluenceAdapter, type ConfluencePage } from "./adapters/confluence.js";
export { HubSpotAdapter, type HubSpotContact, type HubSpotDeal } from "./adapters/hubspot.js";
export { ElevenLabsAdapter, type ElevenLabsVoice, type TTSResult } from "./adapters/elevenlabs.js";
export { FigmaAdapter, type FigmaFile, type FigmaProject } from "./adapters/figma.js";
export { CisaAdapter, type CisaKevEntry, type MitreAttackTechnique } from "./adapters/cisa.js";
export { ArxivAdapter, type ArxivPaper } from "./adapters/arxiv.js";
export { AbuseIPDBAdapter, type IpReputationResult } from "./adapters/abuseipdb.js";
export { NOAAAdapter } from "./adapters/noaa.js";
export { NVDAdapter } from "./adapters/nvd.js";
export { BLSAdapter } from "./adapters/bls.js";
export { WorldBankAdapter } from "./adapters/worldbank.js";
export { OpenMeteoAdapter } from "./adapters/openmeteo.js";
export { MITREAdapter } from "./adapters/mitre.js";
export { GDELTAdapter } from "./adapters/gdelt.js";
export { MicrosoftGraphAdapter, type GraphFile, type GraphCalendarEvent, type GraphContact, type GraphTeamsNotification, type GraphSharePointSite, type GraphConnectionStatus } from "./adapters/microsoft-graph.js";
export { ResoMlsAdapter, type MlsListing, type ODataQueryParams, type MlsIncrementalSyncResult } from "./adapters/reso-mls.js";
export { CoStarAdapter, type CoStarProperty, type CoStarMarketStats, type CoStarSaleComp } from "./adapters/costar.js";
export { CompStakAdapter, type CompStakLeaseComp, type CompStakSaleComp, type CompStakPropertyDetail } from "./adapters/compstak.js";
export { DataverseAdapter, type DataverseAccount, type DataverseContact, type DataverseLead, type DataverseOpportunity, type DataverseActivity, type DataverseConnectionStatus, type DataverseSyncResult, type DataverseLyteSignal } from "./adapters/dataverse.js";
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
} from "./adapters/salesforce.js";
export {
  JiraAdapter,
  type JiraProject,
  type JiraIssue,
  type JiraSprint,
  type JiraSprintHealth,
  type JiraSignal,
  type JiraWebhookEvent,
  type JiraConnectionStatus,
} from "./adapters/jira.js";

export {
  Dynamics365Adapter,
  type DynamicsAccount,
  type DynamicsContact,
  type DynamicsOpportunity,
  type DynamicsLead,
  type DynamicsCase,
  type DynamicsActivity,
  type DynamicsSyncSignal,
} from "./adapters/dynamics365.js";

export {
  SharePointSPFxAdapter,
  type SPFxWebPartManifest,
  type SPFxPreconfiguredEntry,
  type SPFxSiteInfo,
  type SPFxDeploymentStatus,
  type SPFxDeployedPackage,
} from "./adapters/sharepoint-spfx.js";

export { XTwitterAdapter, type XPostResult } from "./adapters/x-twitter.js";
export { MediumAdapter, type MediumPublishResult } from "./adapters/medium.js";
export { SubstackAdapter, type SubstackPublishResult } from "./adapters/substack.js";
export { LinkedInAdapter, type LinkedInPostResult } from "./adapters/linkedin.js";

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
} from "./adapters/huggingface.js";
