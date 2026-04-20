export { AefClient, createAefClient, getDefaultClient } from "./client.js";
export { resolveConfig } from "./config.js";
export type { AefClientConfig } from "./config.js";
export {
  AefError,
  AefUnavailableError,
  AefAuthError,
  AefPolicyError,
  AefTimeoutError,
  AefRateLimitError,
} from "./errors.js";
export { useAefSearch, useAefEmbed } from "./hooks.js";
export type { UseAefSearchOptions, UseAefSearchReturn, UseAefSearchState, UseAefEmbedOptions } from "./hooks.js";

export const AEF_SDK_VERSION = "0.1.0" as const;
