/**
 * @szl-holdings/platform-metrics-registry
 *
 * Single source of truth for all published SZL Holdings platform facts.
 *
 * Structural counts are generated from repo introspection by running:
 *   pnpm run generate-platform-metrics
 *
 * Curated facts (version, providers, founding year, etc.) are maintained
 * in src/registry.ts overrides and represent intentional public-facing numbers.
 *
 * Consumption pattern:
 *   import { PLATFORM_FACTS, formatPlatformSummary } from "@szl-holdings/platform-metrics-registry";
 *
 * Validation:
 *   pnpm run validate-platform-facts
 */

export * from './helpers.js';
export * from './registry.js';
export * from './schema.js';
export * from './validate.js';
