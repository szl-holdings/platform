/**
 * @szl-holdings/config
 *
 * Single source of truth for platform claims, feature flags, environment
 * contract, and public-facing registry.
 *
 * Usage:
 *   import { PLATFORM_PRODUCTS, getProduct } from "@szl-holdings/config/platform-registry"
 *   import { PUBLIC_CLAIMS, FOUNDER_YEARS_EXPERIENCE } from "@szl-holdings/config/public-claims"
 *   import { FEATURE_FLAGS, isFlagEnabled } from "@szl-holdings/config/feature-flags"
 *   import { ENV_CONTRACT, getRequiredVars } from "@szl-holdings/config/env-contract"
 *
 * Or import everything from the root:
 *   import { PLATFORM_PRODUCTS, PUBLIC_CLAIMS, FEATURE_FLAGS, ENV_CONTRACT } from "@szl-holdings/config"
 */

export * from "./platform-registry";
export * from "./public-claims";
export * from "./feature-flags";
export * from "./env-contract";
