import { apiFetch } from "@workspace/shared-ui";

export function isAuthenticated(): boolean {
  return true;
}

export const api = {
  getOverview: () => apiFetch<AdminOverview>("/admin/overview"),
  getApps: () => apiFetch<{ apps: AppInfo[] }>("/admin/apps"),
  getConnectors: () => apiFetch<ConnectorsResponse>("/admin/connectors"),
  testConnector: (name: string) => apiFetch<ConnectionTestResult>(`/admin/connectors/${name}/test`, { method: "POST" }),
  syncConnector: (name: string) => apiFetch<ConnectorSyncResult>(`/admin/connectors/${name}/sync`, { method: "POST" }),
  getUsers: () => apiFetch<{ users: UserInfo[] }>("/admin/users"),
  createUser: (data: { email: string; name: string; role: string }) => apiFetch<UserInfo>("/admin/users", { method: "POST", body: JSON.stringify(data) }),
  getAuditLog: (params?: { search?: string; action?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.action) qs.set("action", params.action);
    const query = qs.toString();
    return apiFetch<{ logs: AuditEntry[]; total: number }>(`/admin/audit-log${query ? `?${query}` : ""}`);
  },
  getFeatureFlags: () => apiFetch<{ flags: FeatureFlag[] }>("/admin/feature-flags"),
  toggleFlag: (key: string, enabled: boolean) => apiFetch<FeatureFlag>(`/admin/feature-flags/${key}`, { method: "PUT", body: JSON.stringify({ enabled }) }),
  getBilling: () => apiFetch<BillingInfo>("/admin/billing"),
  getWebhooks: () => apiFetch<{ events: WebhookEvent[] }>("/admin/webhooks"),
  getFiles: () => apiFetch<{ files: StoredFileInfo[] }>("/admin/files"),
  getEnvironment: () => apiFetch<EnvironmentInfo>("/admin/environment"),
  seedData: () => apiFetch<SeedResult>("/admin/seed", { method: "POST" }),
  resetData: () => apiFetch<SeedResult>("/admin/seed/reset", { method: "POST" }),
  getServicesHealth: () => apiFetch<ServicesHealthMatrix>("/services/health"),
  getIntegrationHealth: () => apiFetch<IntegrationHealthDashboard>("/admin/integration-health"),
  getIntegrationActivity: (params?: { connector?: string; app?: string; type?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.connector) qs.set("connector", params.connector);
    if (params?.app) qs.set("app", params.app);
    if (params?.type) qs.set("type", params.type);
    if (params?.status) qs.set("status", params.status);
    const query = qs.toString();
    return apiFetch<IntegrationActivityResponse>(`/admin/integration-activity${query ? `?${query}` : ""}`);
  },
  getHealthSummary: () => apiFetch<HealthSummary>("/services/health/summary"),
  testAppConnectors: (appSlug: string) => apiFetch<{ app: string; results: ConnectionTestResult[] }>(`/services/health/app/${appSlug}/test`, { method: "POST" }),
  setConnectorEnabled: (name: string, enabled: boolean) => apiFetch<{ name: string; enabled: boolean; status: string }>(`/admin/connectors/${name}/enable`, { method: "PUT", body: JSON.stringify({ enabled }) }),
  verifyAll: () => apiFetch<VerifyAllResult>("/services/health/verify-all", { method: "POST" }),
  getSystemHealth: () => apiFetch<SystemHealthResponse>("/admin/system-health"),
  validateSeedData: () => apiFetch<SeedValidationResponse>("/admin/seed/validate"),
  getBillingSettings: () => apiFetch<BillingSettingsResponse>("/admin/billing/settings"),
};

export interface AdminOverview {
  timestamp: string;
  system: { uptime: number; nodeVersion: string; memoryUsage: { heapUsed: number; heapTotal: number; rss: number }; platform: string };
  database: { status: string; latency: number; connections: number; maxConnections: number };
  storage: { status: string; usedBytes: number; totalBytes: number };
  connectors: ServicesHealthMatrix;
  apps: AppInfo[];
  counts: { apps: number; activeApps: number; connectors: number; liveConnectors: number; users: number; activeUsers: number };
}

export interface ServicesHealthMatrix {
  timestamp: string;
  services: ServiceHealth[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

export interface ServiceHealth {
  name: string;
  status: "LIVE_CONFIGURED" | "MOCKED_DEMO_MODE" | "MANUAL_REQUIRED";
  description: string;
  requiredEnvVars: string[];
  presentEnvVars: string[];
  missingEnvVars: string[];
  lastChecked: string | null;
  lastError: string | null;
  errorCount: number;
  responseTimeMs: number | null;
  lastSuccessfulCheck: string | null;
  consecutiveFailures: number;
  retryState: "idle" | "retrying" | "failed";
  enabled: boolean;
}

export interface AppInfo {
  id: string;
  name: string;
  description: string;
  status: string;
  url: string;
}

export interface ConnectorsResponse {
  connectors: ConnectorDetail[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

export interface ConnectorDetail extends ServiceHealth {
  category: string;
  lastSync: string | null;
  syncEnabled: boolean;
  webhookUrl: string;
}

export interface ConnectionTestResult {
  name: string;
  success: boolean;
  status: string;
  testedAt: string;
  responseTimeMs: number;
  message: string;
  error: string | null;
}

export interface ConnectorSyncResult {
  name: string;
  synced: boolean;
  syncedAt: string;
  itemsSynced: number;
}

export interface IntegrationHealthDashboard {
  timestamp: string;
  overall: ServicesHealthMatrix;
  perApp: Record<string, {
    slug: string;
    name: string;
    connectors: string[];
    health: ServicesHealthMatrix;
  }>;
  alerts: {
    unhealthyCount: number;
    demoCount: number;
    unhealthyConnectors: string[];
    demoConnectors: string[];
  };
}

export interface IntegrationActivity {
  id: string;
  type: "connection_test" | "sync" | "webhook" | "api_call" | "error" | "health_check";
  connector: string;
  app: string | null;
  status: "success" | "error" | "warning";
  message: string;
  timestamp: string;
  responseTimeMs: number | null;
}

export interface IntegrationActivityResponse {
  events: IntegrationActivity[];
  total: number;
}

export interface HealthSummary {
  unhealthyCount: number;
  demoCount: number;
  liveCount: number;
  total: number;
  hasDemoMode: boolean;
  hasUnhealthy: boolean;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string | null;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  result: string;
  timestamp: string;
  details: string;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: string;
}

export interface StripeProductPrice {
  id: string;
  amount: number;
  currency: string;
  interval?: string;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  prices: StripeProductPrice[];
}

export interface BillingInfo {
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  monthlyAmount: number;
  currency: string;
  seats: { used: number; total: number };
  features: string[];
  invoices: { id: string; date: string; amount: number; status: string }[];
  stripeMode?: "live" | "test" | "mock";
  stripeConnected?: boolean;
  products?: StripeProduct[];
}

export interface WebhookEvent {
  id: string;
  source: string;
  event: string;
  status: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

export interface StoredFileInfo {
  key: string;
  url: string;
  size: number;
  contentType: string;
  lastModified: string;
}

export interface EnvironmentInfo {
  environment: string;
  envVars: { name: string; configured: boolean; usedBy: string[] }[];
  configured: number;
  missing: number;
  total: number;
}

export interface SeedResult {
  success: boolean;
  seededAt?: string;
  resetAt?: string;
  message?: string;
  tables?: { name: string; rows: number }[];
}

export interface VerifyAllResult {
  verifiedAt: string;
  summary: { totalApps: number; healthyApps: number; totalConnectors: number; totalFallbacks: number; totalFailed: number };
  apps: Record<string, {
    app: string;
    connectors: Array<{ name: string; success: boolean; status: string; fallbackMode: boolean; message: string; responseTimeMs: number }>;
    allHealthy: boolean;
    fallbackCount: number;
    failedCount: number;
  }>;
}

export interface SystemHealthCheck {
  name: string;
  category: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number | null;
  details: string;
}

export interface SystemHealthResponse {
  timestamp: string;
  status: "healthy" | "degraded" | "down";
  checks: SystemHealthCheck[];
  summary: { total: number; healthy: number; degraded: number; down: number };
}

export interface SeedValidationResult {
  table: string;
  description: string;
  expected: number;
  actual: number;
  status: "pass" | "fail" | "error";
}

export interface SeedValidationResponse {
  timestamp: string;
  overallStatus: "complete" | "incomplete" | "error";
  results: SeedValidationResult[];
  summary: { total: number; passed: number; failed: number; errors: number };
}

export interface BillingPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: string;
  priceYearly: string | null;
  features: unknown;
  stripePriceId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface BillingSubscription {
  id: number;
  orgId: number;
  planId: number;
  status: string;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInvoiceRecord {
  id: number;
  orgId: number;
  subscriptionId: number | null;
  stripeInvoiceId: string | null;
  amount: string;
  currency: string;
  status: string;
  paidAt: string | null;
  dueDate: string | null;
  createdAt: string;
}

export interface BillingEntitlement {
  id: number;
  planId: number;
  featureKey: string;
  featureName: string;
  type: string;
  limitValue: number | null;
  description: string | null;
  createdAt: string;
}

export interface BillingSettingsResponse {
  stripeConfigured: boolean;
  plans: BillingPlan[];
  subscriptions: BillingSubscription[];
  invoices: BillingInvoiceRecord[];
  entitlements: BillingEntitlement[];
  usageSummary: { featureKey: string; totalQuantity: number; eventCount: number }[];
}
