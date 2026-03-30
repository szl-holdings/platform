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
