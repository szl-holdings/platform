export { AefClient, createAefClient, getDefaultClient } from './client.js';
export type { AefClientConfig } from './config.js';
export { resolveConfig } from './config.js';
export {
  AefAuthError,
  AefError,
  AefPolicyError,
  AefRateLimitError,
  AefTimeoutError,
  AefUnavailableError,
} from './errors.js';
export type {
  UseAefEmbedOptions,
  UseAefSearchOptions,
  UseAefSearchReturn,
  UseAefSearchState,
} from './hooks.js';
export { useAefEmbed, useAefSearch } from './hooks.js';
export { AefMockClient } from './testing/mock-client.js';
export type { AefMockClientOptions, AefMockResponses } from './testing/mock-client.js';

export const AEF_SDK_VERSION = '0.1.0' as const;
