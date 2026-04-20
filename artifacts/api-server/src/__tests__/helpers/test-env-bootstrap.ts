/**
 * Vitest setup file — runs before every test module is evaluated.
 *
 * Several modules in this workspace (notably `lib/db` via
 * `packages/env`) validate required environment variables at import
 * time using a strict zod schema. When a test file imports anything
 * that transitively pulls those modules, missing/short env vars cause
 * the whole file to fail to load before a single test executes.
 *
 * To make tests reliably bootable in any environment (CI, local, the
 * Replit api-test workflow), we pre-populate safe non-secret defaults
 * for the small set of vars enforced by the schema. We use `??=` so
 * any value already supplied by the runner takes precedence.
 *
 * NOTE: these are TEST defaults only. Production values come from the
 * Replit environment (see `setEnvVars`).
 */

const SAFE_TOKEN = "vitest-internal-token-padding-padding-padding-1214";
if (
  !process.env.ALLOY_INTERNAL_TOKEN ||
  process.env.ALLOY_INTERNAL_TOKEN.length < 32
) {
  process.env.ALLOY_INTERNAL_TOKEN = SAFE_TOKEN;
}
process.env.NODE_ENV ??= "test";
