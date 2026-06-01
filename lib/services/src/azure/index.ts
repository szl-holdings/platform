import { type Env, getEnv } from '@szl-holdings/env';

export interface AzureServiceConfig {
  enabled: boolean;
  connectionString?: string | undefined;
  endpoint?: string | undefined;
}

function isAzureEnabled(envKey: keyof Env): boolean {
  return !!getEnv()[envKey];
}

export const azureKeyVault = {
  get enabled() {
    return isAzureEnabled('AZURE_KEY_VAULT_URL');
  },
  get config(): AzureServiceConfig {
    return {
      enabled: this.enabled,
      endpoint: getEnv().AZURE_KEY_VAULT_URL,
    };
  },
  async getSecret(_name: string): Promise<string | null> {
    if (!this.enabled) return null;
    return null;
  },
};

export const azureBlobStorage = {
  get enabled() {
    return isAzureEnabled('AZURE_STORAGE_CONNECTION_STRING');
  },
  get config(): AzureServiceConfig {
    return {
      enabled: this.enabled,
      connectionString: getEnv().AZURE_STORAGE_CONNECTION_STRING,
    };
  },
  async uploadBlob(_container: string, _blobName: string, _data: Buffer): Promise<string | null> {
    if (!this.enabled) return null;
    return null;
  },
  async downloadBlob(_container: string, _blobName: string): Promise<Buffer | null> {
    if (!this.enabled) return null;
    return null;
  },
  async deleteBlob(_container: string, _blobName: string): Promise<boolean> {
    if (!this.enabled) return false;
    return false;
  },
};

export const azureRedis = {
  get enabled() {
    return isAzureEnabled('AZURE_REDIS_CONNECTION_STRING');
  },
  get config(): AzureServiceConfig {
    return {
      enabled: this.enabled,
      connectionString: getEnv().AZURE_REDIS_CONNECTION_STRING,
    };
  },
  async get(_key: string): Promise<string | null> {
    if (!this.enabled) return null;
    return null;
  },
  async set(_key: string, _value: string, _ttlSeconds?: number): Promise<boolean> {
    if (!this.enabled) return false;
    return false;
  },
  async del(_key: string): Promise<boolean> {
    if (!this.enabled) return false;
    return false;
  },
};

export const azurePostgres = {
  get enabled() {
    return isAzureEnabled('AZURE_PG_CONNECTION_STRING');
  },
  get config(): AzureServiceConfig {
    return {
      enabled: this.enabled,
      connectionString: getEnv().AZURE_PG_CONNECTION_STRING,
    };
  },
  async query(_sql: string, _params?: unknown[]): Promise<unknown[] | null> {
    if (!this.enabled) return null;
    return null;
  },
};

export const azureAppInsights = {
  get enabled() {
    return isAzureEnabled('AZURE_APP_INSIGHTS_CONNECTION_STRING');
  },
  get config(): AzureServiceConfig {
    return {
      enabled: this.enabled,
      connectionString: getEnv().AZURE_APP_INSIGHTS_CONNECTION_STRING,
    };
  },
  trackEvent(_name: string, _properties?: Record<string, string>): void {
    if (!this.enabled) return;
  },
  trackException(_error: Error): void {
    if (!this.enabled) return;
  },
  trackMetric(_name: string, _value: number): void {
    if (!this.enabled) return;
  },
};

export function getAzureStatus() {
  return {
    keyVault: azureKeyVault.config,
    blobStorage: azureBlobStorage.config,
    redis: azureRedis.config,
    postgres: azurePostgres.config,
    appInsights: azureAppInsights.config,
  };
}
