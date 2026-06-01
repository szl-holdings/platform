export type PluginCapabilityId =
  | 'domain:intelligence'
  | 'domain:alerts'
  | 'domain:timeline'
  | 'domain:documents'
  | 'ui:command-card'
  | 'ui:dashboard'
  | 'billing:metered'
  | 'governance:proof-chain'
  | 'governance:autonomy'
  | 'api:public'
  | 'webhook:events';

export interface PluginInstallContext {
  orgId: number;
  config: Record<string, unknown>;
}

export interface PluginEventContext {
  type: string;
  orgId: number;
  payload: unknown;
  timestamp: Date;
}

export interface PluginAlertPayload {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  domainSlug: string;
  metadata?: Record<string, unknown>;
}

export interface PluginCommandCard {
  title: string;
  subtitle?: string;
  status?: string;
  metrics?: Array<{ label: string; value: string | number; trend?: 'up' | 'down' | 'flat' }>;
  actions?: Array<{ label: string; href: string }>;
}

export interface PluginWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface PluginDefinition {
  slug: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  capabilities: PluginCapabilityId[];
  governanceInherited: boolean;
  proofChainEnabled: boolean;
  designSystemVersion?: string;
  billingEnabled?: boolean;
  pricingModel?: 'free' | 'flat' | 'usage';

  onInstall?(ctx: PluginInstallContext): Promise<void>;
  onUninstall?(ctx: PluginInstallContext): Promise<void>;
  onEvent?(ctx: PluginEventContext): Promise<void>;

  getCommandCard?(orgId: number): Promise<PluginCommandCard | null>;
  getAlerts?(orgId: number): Promise<PluginAlertPayload[]>;
  getWebhookEvents?(): PluginWebhookEvent['type'][];
}

export interface PluginRegistration {
  definition: PluginDefinition;
  registeredAt: Date;
  validationResult: PluginValidationResult;
}

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
