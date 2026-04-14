export type ConnectorCategory =
  | "ticketing"
  | "alerting"
  | "communication"
  | "crm"
  | "security"
  | "ai_inference"
  | "ai_voice"
  | "ai_media"
  | "ai_observability"
  | "ai_models"
  | "data"
  | "storage"
  | "monitoring";

export type AuthScheme = "api_key" | "oauth2_client_credentials" | "oauth2_authorization_code" | "webhook_signature" | "none";

export type ConnectorHealthStatus = "healthy" | "degraded" | "down" | "unconfigured" | "disabled";

export type CircuitBreakerState = "closed" | "open" | "half_open";

export interface AuthConfig {
  scheme: AuthScheme;
  requiredEnvVars: string[];
  optionalEnvVars?: string[];
  oauthTokenUrl?: string;
  oauthScopes?: string[];
  webhookSignatureHeader?: string;
  webhookSignatureAlgorithm?: "hmac-sha256" | "hmac-sha1";
  description?: string;
}

export interface CapabilityParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  enum?: string[];
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  parameters: CapabilityParameter[];
  outputSchema?: string;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour?: number;
  };
  requiresAuth: boolean;
  tags?: string[];
}

export interface ConnectorHealth {
  connectorId: string;
  status: ConnectorHealthStatus;
  latencyMs: number | null;
  lastCheckedAt: string;
  lastSuccessAt: string | null;
  errorRate: number;
  errorCount: number;
  requestCount: number;
  circuitBreakerState: CircuitBreakerState;
  configuredCorrectly: boolean;
  missingEnvVars: string[];
  message: string;
}

export interface ConnectorResult<T = unknown> {
  success: boolean;
  connectorId: string;
  capability: string;
  data: T | null;
  error: string | null;
  latencyMs: number;
  timestamp: string;
  fromCache: boolean;
  rateLimited: boolean;
}

export interface ConnectorRegistryEntry {
  id: string;
  name: string;
  description: string;
  category: ConnectorCategory;
  authConfig: AuthConfig;
  capabilities: Capability[];
  version: string;
  homepage?: string;
  tags?: string[];
}

export interface ConnectorHubSnapshot {
  timestamp: string;
  totalConnectors: number;
  healthy: number;
  degraded: number;
  down: number;
  unconfigured: number;
  disabled: number;
  connectors: ConnectorHealth[];
}

export interface RateLimitState {
  windowStart: number;
  requestsInWindow: number;
  hourlyWindowStart: number;
  requestsInHour: number;
}
