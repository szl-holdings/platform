export interface SZLClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  userAgent?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  page?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    hasMore?: boolean;
  };
}

export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreatedApiKey extends ApiKey {
  key: string;
  warning: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  eventTypes: string[] | '*';
  active: boolean;
  description?: string;
  createdAt: number;
  lastDeliveredAt?: number;
  failureCount: number;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: string;
  status: 'pending' | 'delivered' | 'failed';
  statusCode?: number;
  attempt: number;
  deliveredAt?: number;
  error?: string;
}

export interface TreasuryAccount {
  id: number;
  orgId: number;
  provider: string;
  label: string;
  currency: string;
  currencyType: 'fiat' | 'stablecoin' | 'crypto';
  network?: string;
  createdAt: string;
}

export interface TreasuryBalance {
  account: TreasuryAccount;
  balance: string;
  balanceUsd: string;
  lastUpdated: string | null;
}

export interface TreasurySummary {
  fiat: { totalUsd: string; accounts: number };
  stablecoin: { totalUsd: string; accounts: number };
  combined: { totalUsd: string };
  lastRefreshed: string;
}

export interface EsignatureRequest {
  id: number;
  orgId: number;
  matterId?: number;
  provider: string;
  providerEnvelopeId?: string;
  documentTitle: string;
  status: string;
  signatories: unknown[];
  expiresAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CourtFiling {
  id: number;
  orgId: number;
  matterId?: number;
  filingType: string;
  jurisdiction: string;
  courtName?: string;
  caseNumber?: string;
  documentTitle: string;
  status: string;
  electronicFilingSystem: string;
  electronicallySupportedJurisdiction: boolean;
  submittedAt?: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface Plugin {
  id: number;
  slug: string;
  name: string;
  version: string;
  category: string;
  capabilities: string[];
  governanceInherited: boolean;
  proofChainEnabled: boolean;
  isPublished: boolean;
  createdAt: string;
}

export type ApiScope =
  | 'portfolio:read'
  | 'briefings:read'
  | 'alerts:read'
  | 'matters:read'
  | 'vessels:read'
  | 'analytics:read'
  | 'webhooks:manage'
  | 'admin:read';
