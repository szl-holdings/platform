export { ServiceAdapter, type ServiceStatus, type ServiceHealthReport } from "./base.js";
export { ServiceRegistry, type IntegrationHealthMatrix, services } from "./registry.js";

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
