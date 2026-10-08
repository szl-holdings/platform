import { isProductionRuntime } from '@workspace/aef-contracts';

const configuredApiKey =
  process.env.AEF_BEARER_TOKEN?.trim() || process.env.AEF_API_KEY?.trim() || undefined;
const configuredServiceSecret = process.env.AEF_S2S_SECRET?.trim() || undefined;
const configuredTenantId = process.env.AEF_API_TENANT_ID?.trim() || undefined;

if (!configuredApiKey) {
  throw new Error('AEF_BEARER_TOKEN (or AEF_API_KEY) is required and must not be blank');
}
if (isProductionRuntime(process.env, ['AEF_ENV', 'AEF_FABRIC_ENV']) && !configuredTenantId) {
  throw new Error('AEF_API_TENANT_ID is required in production and must not be blank');
}

export const FABRIC_API_KEY = configuredApiKey;
export const FABRIC_SERVICE_SECRET = configuredServiceSecret;
export const FABRIC_API_TENANT_ID = configuredTenantId;
